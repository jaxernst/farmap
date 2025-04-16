import { Effect } from "effect";
import { UsersRepo } from "../Repo.js";
import { UserModel } from "@farmap/domain/Users";
import { FarcasterService, Fid } from "@farmap/domain/Farcaster";

export class UserService extends Effect.Service<UserService>()("api/User", {
  effect: Effect.gen(function* () {
    const repo = yield* UsersRepo;
    const farcasterService = yield* FarcasterService;

    const getProfileData = (user: UserModel) =>
      Effect.gen(function* () {
        const [displayName, pfp] = yield* Effect.all([
          farcasterService.getUserData("DISPLAY_NAME", user.fid),
          farcasterService.getUserData("PFP", user.fid),
        ]);

        return { displayName, pfp };
      });

    const getOrCreateByFid = (fid: Fid) =>
      Effect.gen(function* () {
        const user = yield* repo.getByFarcasterId(fid);
        Effect.log("Got user from fid", { fid, user });

        const profileData = getProfileData(user);

        if (!user.length) {
          return yield* repo.insert(
            UserModel.insert.make({
              fid,
              ...(yield* profileData),
            })
          );
        }

        Effect.fork(refreshProfileData(user[0]));

        return user[0];
      });

    const refreshProfileData = (user: UserModel) =>
      Effect.gen(function* () {
        const profileData = yield* getProfileData(user);
        return yield* repo.update(
          UserModel.update.make({
            id: user.id,
            fid: user.fid,
            ...profileData,
          })
        );
      });
    const getById = repo.findById;

    return {
      getOrCreateByFid,
      getById,
    };
  }),
  dependencies: [UsersRepo.Default],
}) {}
