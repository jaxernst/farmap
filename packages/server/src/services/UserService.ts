import type { Fid } from "@farmap/domain/Farcaster"
import { Farcaster } from "@farmap/domain/Farcaster"
import { UserModel } from "@farmap/domain/Users"
import { Effect } from "effect"
import { UsersRepo } from "../Repo.js"

export class UserService extends Effect.Service<UserService>()("api/User", {
  effect: Effect.gen(function*() {
    const repo = yield* UsersRepo
    const farcasterService = yield* Farcaster

    const getProfileData = (fid: Fid) =>
      Effect.gen(function*() {
        const [displayName, displayImage] = yield* Effect.all([
          farcasterService.getUserData("USER_DATA_TYPE_DISPLAY", fid),
          farcasterService.getUserData("USER_DATA_TYPE_PFP", fid)
        ])

        return { displayName, displayImage }
      })

    const getOrCreateByFid = (fid: Fid) =>
      Effect.gen(function*() {
        const user = yield* repo.getByFarcasterId(fid)

        if (!user.length) {
          const profileData = getProfileData(fid).pipe(
            Effect.catchTag("HubError", (_e) => {
              return Effect.succeed({ displayName: null, displayImage: null })
            })
          )

          return yield* repo.insert(
            UserModel.insert.make({
              fid,
              ...(yield* profileData)
            })
          )
        }

        // Asynchronously refresh the external profile data
        Effect.fork(refreshProfileData(user[0]))

        return user[0]
      })

    const refreshProfileData = (user: UserModel) =>
      Effect.gen(function*() {
        const profileData = yield* getProfileData(user.fid)
        return yield* repo.update(
          UserModel.update.make({
            id: user.id,
            fid: user.fid,
            ...profileData
          })
        )
      })
    const getById = repo.findById

    return {
      getOrCreateByFid,
      getById
    }
  }),
  dependencies: [UsersRepo.Default]
}) {}
