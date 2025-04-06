import {
  Position,
  AttachmentId,
  Blob,
  MapAttachmentModel,
} from "@farmap/domain/MapAttachments";
import { Option, Effect } from "effect";
import { AttachmentsRepo } from "./Repo.js";
import { AttachmentNotFound } from "@farmap/domain/Api";

export class MapAttachmentService extends Effect.Service<MapAttachmentService>()(
  "api/MapAttachment",
  {
    effect: Effect.gen(function* () {
      const repo = yield* AttachmentsRepo;

      const attachToMap = (position: Position, item: Blob) =>
        Effect.gen(function* () {
          const res = yield* repo.insert(
            MapAttachmentModel.insert.make({
              latitude: position.lat,
              longitude: position.long,
              data: item,
            })
          );

          return {
            id: AttachmentId.make(res.id),
          };
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

      const getByIds = repo.findByIds;

      return {
        attachToMap,
        getById,
        getByIds,
      };
    }),
    dependencies: [AttachmentsRepo.Default],
  }
) {}
