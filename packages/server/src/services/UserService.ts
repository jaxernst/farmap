import { Effect } from "effect";
import { UsersRepo } from "../Repo.js";
import { UserModel } from "@farmap/domain/Users";

export class UserService extends Effect.Service<UserService>()("api/User", {
  effect: Effect.gen(function* () {
    const repo = yield* UsersRepo;

    const getOrCreateByFid = (fid: number) =>
      Effect.gen(function* () {
        console.log("getting user");
        const user = yield* repo.getByFarcasterId(fid);
        console.log("user", user);

        if (!user.length) {
          console.log("inserting user");
          return yield* repo.insert(
            UserModel.insert.make({
              fid,
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
