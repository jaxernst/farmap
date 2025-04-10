import {
  Position,
  AttachmentId,
  MapAttachmentModel,
} from "@farmap/domain/MapAttachments";
import { Option, Effect } from "effect";
import { AttachmentsRepo } from "../Repo.js";
import { AttachmentNotFound } from "@farmap/domain/Api";
import { UserId } from "@farmap/domain/Users";
import { AttachmentQueryParams } from "@farmap/domain/Query";
import { FileId, FileStore, FileType } from "@farmap/domain/FileStorage";
import { Unauthorized } from "@effect/platform/HttpApiError";

export class MapAttachmentService extends Effect.Service<MapAttachmentService>()(
  "api/MapAttachment",
  {
    effect: Effect.gen(function* () {
      const repo = yield* AttachmentsRepo;
      const fileStorage = yield* FileStore;

      const attachToMap = (
        userId: UserId,
        position: Position,
        fileId: FileId,
        fileType: FileType
      ) =>
        Effect.gen(function* () {
          yield* fileStorage.confirmUpload(fileId);

          const res = yield* repo.insert(
            MapAttachmentModel.insert.make({
              latitude: position.lat,
              longitude: position.long,
              fileUrl: fileStorage.toFileUrl(fileId),
              fileType,
              userId: userId,
              previewUrl: null,
            })
          );

          return {
            id: AttachmentId.make(res.id),
          };
        });

      const deleteUserAttachment = (userId: UserId, id: AttachmentId) =>
        Effect.gen(function* () {
          const row = yield* repo.findById(id);
          if (Option.isNone(row)) return yield* new AttachmentNotFound({ id });
          if (row.value.userId !== userId) return yield* new Unauthorized();
          yield* repo.delete(id);
        });

      const getById = (id: AttachmentId) =>
        Effect.gen(function* () {
          const row = yield* repo.findById(id);

          return yield* Option.match(row, {
            onSome: (row) =>
              Effect.succeed(MapAttachmentModel.toAttachmentSchema(row)),
            onNone: () => Effect.fail(new AttachmentNotFound({ id })),
          });
        });

      const query = (params: AttachmentQueryParams) =>
        Effect.gen(function* () {
          if (params.userId) {
            const attachments = yield* repo.findByUserId(params.userId);
            return attachments;
          }

          return [];
        });

      const getByIds = repo.findByIds;

      return {
        attachToMap,
        deleteUserAttachment,
        getById,
        getByIds,
        query,
      };
    }),
    dependencies: [AttachmentsRepo.Default],
  }
) {}
