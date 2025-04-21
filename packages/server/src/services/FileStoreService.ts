import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import type { FileId, FileMetadata, FileUploadRequest, FileUrl } from "@farmap/domain/FileStorage"
import { FileFetchError, FileNotFound, FileStore } from "@farmap/domain/FileStorage"
import { Config, Context, Effect, Layer, Option } from "effect"
import { v4 as uuidv4 } from "uuid"

export class S3Config extends Context.Tag("S3Config")<
  S3Config,
  {
    bucketName: string
    region: string
    accessKeyId: string
    secretAccessKey: string
    uploadUrlExpirationSeconds: number
    fileUrlEndpoint?: string | null
  }
>() {}

const S3ConfigLive = Layer.effect(
  S3Config,
  Effect.gen(function*() {
    // Can override s3 bucket domain for cdn urls
    const fileUrlEndpointOverride = yield* Config.option(Config.string("S3_ENDPOINT"))
    console.log(fileUrlEndpointOverride, Option.getOrNull(fileUrlEndpointOverride))

    return S3Config.of({
      bucketName: yield* Config.string("S3_BUCKET_NAME"),
      region: yield* Config.string("S3_REGION"),
      accessKeyId: yield* Config.string("S3_ACCESS_KEY_ID"),
      secretAccessKey: yield* Config.string("S3_SECRET_ACCESS_KEY"),
      uploadUrlExpirationSeconds: 10 * 60,
      fileUrlEndpoint: Option.getOrNull(fileUrlEndpointOverride)
    })
  })
)

const makeS3FileStore = () =>
  Effect.gen(function*() {
    const config = yield* S3Config
    const s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    })

    const getUploadUrl = (
      request: FileUploadRequest
    ): Effect.Effect<{ signedUrl: FileUrl; fileId: FileId }> =>
      Effect.gen(function*() {
        const fileId = uuidv4() as FileId
        const command = new PutObjectCommand({
          Bucket: config.bucketName,
          Key: fileId,
          ContentType: request.contentType
        })

        const signedUrl = yield* Effect.promise(() =>
          getSignedUrl(s3Client, command, {
            expiresIn: config.uploadUrlExpirationSeconds
          })
        )

        return {
          signedUrl: signedUrl as FileUrl,
          fileId
        }
      })

    const confirmUpload = (id: FileId): Effect.Effect<void, FileNotFound> =>
      Effect.gen(function*() {
        const exists = yield* checkFileExists(id)

        if (!exists) {
          return yield* Effect.fail(new FileNotFound({ id }))
        }

        return
      })

    const getFileMetadata = (
      id: FileId
    ): Effect.Effect<FileMetadata, FileNotFound> =>
      Effect.gen(function*() {
        const bucketName = config.bucketName

        const command = new HeadObjectCommand({
          Bucket: bucketName,
          Key: id
        })

        const response = yield* Effect.promise(() => s3Client.send(command))

        if (!response) {
          return yield* new FileNotFound({ id })
        }

        return {
          id,
          filename: id,
          contentType: response.ContentType || "application/octet-stream",
          size: response.ContentLength || 0,
          url: toFileUrl(id),
          createdAt: response.LastModified || new Date(),
          updatedAt: response.LastModified || new Date()
        }
      })

    const deleteFile = (id: FileId): Effect.Effect<void, FileNotFound> =>
      Effect.gen(function*() {
        const bucketName = config.bucketName
        const exists = yield* checkFileExists(id)

        if (!exists) {
          return yield* Effect.fail(new FileNotFound({ id }))
        }

        const command = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: id
        })

        yield* Effect.promise(() => s3Client.send(command))
        return
      })

    const toFileUrl = (id: FileId): FileUrl => {
      console.log("toFileUrl", id)
      const bucketName = config.bucketName
      const region = config.region
      const customEndpoint = config.fileUrlEndpoint
      console.log("customEndpoint", customEndpoint)

      if (customEndpoint) {
        return `${customEndpoint}/${id}` as FileUrl
      } else {
        return `https://${bucketName}.s3.${region}.amazonaws.com/${id}` as FileUrl
      }
    }

    const checkFileExists = (id: FileId): Effect.Effect<boolean> =>
      Effect.gen(function*() {
        const bucketName = config.bucketName

        const command = new HeadObjectCommand({
          Bucket: bucketName,
          Key: id
        })

        return yield* Effect.promise(() =>
          s3Client
            .send(command)
            .then(() => true)
            .catch(() => false)
        )
      })

    const uploadFile = (fileId: FileId, buffer: Buffer, contentType: string) =>
      Effect.gen(function*() {
        const bucketName = config.bucketName

        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: fileId,
          Body: buffer,
          ContentType: contentType
        })

        yield* Effect.promise(() => s3Client.send(command))
      })

    const getFile = (fileId: FileId) =>
      Effect.gen(function*() {
        const bucketName = config.bucketName
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: fileId
        })

        const response = yield* Effect.promise(() => s3Client.send(command)).pipe(
          Effect.catchAll((error) =>
            Effect.fail(
              new FileFetchError({
                id: fileId,
                message: "Failed to fetch file",
                cause: error
              })
            )
          )
        )

        if (!response.Body) {
          return yield* Effect.fail(
            new FileFetchError({ id: fileId, message: "No body in response" })
          )
        }

        return yield* Effect.promise(response.Body.transformToByteArray).pipe(
          Effect.map((a) => Buffer.from(a))
        )
      })

    return {
      getUploadUrl,
      confirmUpload,
      getFileMetadata,
      deleteFile,
      toFileUrl,
      uploadFile,
      checkFileExists,
      getFile
    }
  })

const S3FileStore = Layer.effect(FileStore, makeS3FileStore())

export class FileStoreService extends FileStore {
  static readonly S3Live = Layer.provide(S3FileStore, S3ConfigLive)
  // static readonly Test = Layer.effect(FileStore, Effect.succeed({}))
}
