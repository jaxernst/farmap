import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Effect, Context, Layer, Config } from "effect";
import { v4 as uuidv4 } from "uuid";
import {
  FileUploadRequest,
  FileUrl,
  FileId,
  FileMetadata,
  FileNotFound,
} from "@farmap/domain/FileStorage";
import { FileStore } from "@farmap/domain/FileStorage";

export class S3Config extends Context.Tag("S3ConfigService")<
  S3Config,
  {
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    uploadUrlExpirationSeconds: number;
    endpoint?: string;
  }
>() {}

const S3LiveConfig = Layer.effect(
  S3Config,
  Effect.gen(function* (_) {
    return S3Config.of({
      bucketName: yield* Config.string("S3_BUCKET_NAME"),
      region: yield* Config.string("S3_REGION"),
      accessKeyId: yield* Config.string("S3_ACCESS_KEY_ID"),
      secretAccessKey: yield* Config.string("S3_SECRET_ACCESS_KEY"),
      uploadUrlExpirationSeconds: 10 * 60,
    });
  })
);

const S3FileStoreService = Layer.effect(
  FileStore,
  Effect.gen(function* () {
    const config = yield* S3Config;
    const s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    const getUploadUrl = (
      request: FileUploadRequest
    ): Effect.Effect<{ signedUrl: FileUrl; fileId: FileId }> =>
      Effect.gen(function* (_) {
        const fileId = uuidv4() as FileId;
        const command = new PutObjectCommand({
          Bucket: config.bucketName,
          Key: fileId,
          ContentType: request.contentType,
        });

        const signedUrl = yield* Effect.promise(() =>
          getSignedUrl(s3Client, command, {
            expiresIn: config.uploadUrlExpirationSeconds,
          })
        );

        return {
          signedUrl: signedUrl as FileUrl,
          fileId,
        };
      });

    const confirmUpload = (id: FileId): Effect.Effect<void, FileNotFound> =>
      Effect.gen(function* (_) {
        const exists = yield* checkFileExists(id);

        if (!exists) {
          return yield* Effect.fail(new FileNotFound({ id }));
        }

        return;
      });

    const getFileMetadata = (
      id: FileId
    ): Effect.Effect<FileMetadata, FileNotFound> =>
      Effect.gen(function* () {
        const bucketName = config.bucketName;

        const command = new HeadObjectCommand({
          Bucket: bucketName,
          Key: id,
        });

        const response = yield* Effect.promise(() => s3Client.send(command));

        if (!response) {
          return yield* new FileNotFound({ id });
        }

        return {
          id,
          filename: id,
          contentType: response.ContentType || "application/octet-stream",
          size: response.ContentLength || 0,
          url: toFileUrl(id),
          createdAt: response.LastModified || new Date(),
          updatedAt: response.LastModified || new Date(),
        };
      });

    const deleteFile = (id: FileId): Effect.Effect<void, FileNotFound> =>
      Effect.gen(function* (_) {
        const bucketName = config.bucketName;
        const exists = yield* checkFileExists(id);

        if (!exists) {
          return yield* Effect.fail(new FileNotFound({ id }));
        }

        const command = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: id,
        });

        yield* Effect.promise(() => s3Client.send(command));
        return;
      });

    const toFileUrl = (id: FileId): FileUrl => {
      const bucketName = config.bucketName;
      const region = config.region;
      const customEndpoint = s3Client.config.endpoint;

      if (customEndpoint) {
        return `${customEndpoint}/${bucketName}/${id}` as FileUrl;
      } else {
        return `https://${bucketName}.s3.${region}.amazonaws.com/${id}` as FileUrl;
      }
    };

    const checkFileExists = (id: FileId): Effect.Effect<boolean> =>
      Effect.gen(function* () {
        const bucketName = config.bucketName;

        const command = new HeadObjectCommand({
          Bucket: bucketName,
          Key: id,
        });

        yield* Effect.promise(() => s3Client.send(command));
        return true;
      });

    return {
      getUploadUrl,
      confirmUpload,
      getFileMetadata,
      deleteFile,
      toFileUrl,
      checkFileExists,
    };
  })
);

export const S3FileStoreServiceLive = Layer.provide(
  S3FileStoreService,
  S3LiveConfig
);
