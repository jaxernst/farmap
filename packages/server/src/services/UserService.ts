import { Effect } from "effect";
import { UsersRepo } from "../Repo.js";
import { UserModel } from "@farmap/domain/Users";

export class UserService extends Effect.Service<UserService>()("api/User", {
  effect: Effect.gen(function* () {
    const repo = yield* UsersRepo;

    const getOrCreateByFid = (fid: number) =>
      Effect.gen(function* () {
        const user = yield* repo.getByFarcasterId(fid);
        Effect.log("Got user from fid", { fid, user });

        if (!user.length) {
          return yield* repo.insert(
            UserModel.insert.make({
              fid,
              displayName: null,
              displayImage: null,
            })
          );
        }

        return user[0];
      });

    return {
      getOrCreateByFid,
    };
  }),
  dependencies: [UsersRepo.Default],
}) {}
