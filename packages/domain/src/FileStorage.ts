import { Schema, Effect, Context } from "effect";

export type FileId = typeof FileId.Type;
export const FileId = Schema.String.pipe(Schema.brand("FileId"));

export type FileUrl = typeof FileUrl.Type;
export const FileUrl = Schema.String.pipe(Schema.brand("FileUrl"));

export type FileType = Schema.Schema.Type<typeof FileTypeSchema>;
export const FileTypeSchema = Schema.Literal("image");

export type FileUploadRequest = Schema.Schema.Type<
  typeof FileUploadRequestSchema
>;
export const FileUploadRequestSchema = Schema.Struct({
  filename: Schema.String,
  contentType: Schema.String,
  size: Schema.Number,
});

export type FileMetadata = Schema.Schema.Type<typeof FileMetadataSchema>;
export const FileMetadataSchema = Schema.Struct({
  id: FileId,
  filename: Schema.String,
  contentType: Schema.String,
  size: Schema.Number,
  url: FileUrl,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
});

export class FileNotFound extends Schema.TaggedError<FileNotFound>()(
  "FileNotFound",
  {
    id: FileId,
  }
) {}

export interface FileStorage {
  getUploadUrl(
    request: FileUploadRequest
  ): Effect.Effect<{ signedUrl: FileUrl; fileId: FileId }>;
  confirmUpload(id: FileId): Effect.Effect<void, FileNotFound>;
  getFileMetadata(id: FileId): Effect.Effect<FileMetadata, FileNotFound>;
  deleteFile(id: FileId): Effect.Effect<void, FileNotFound>;
  toFileUrl(id: FileId): FileUrl;
  uploadFile(
    fileId: FileId,
    buffer: Buffer,
    contentType: string
  ): Effect.Effect<void, FileNotFound>;
}

export class FileStore extends Context.Tag("FileStore")<
  FileStore,
  FileStorage
>() {}
