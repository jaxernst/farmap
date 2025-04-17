import { createAppClient, viemConnector } from "@farcaster/auth-client"
import { InputError } from "@farmap/domain/Api"
import type { FarcasterCredential, SessionToken } from "@farmap/domain/Auth"
import { SessionExpired, SessionModel, SessionNotFound, sessionTokenFromString } from "@farmap/domain/Auth"
import { Fid } from "@farmap/domain/Farcaster"
import type { UserId } from "@farmap/domain/Users"
import { DateTime, Duration, Effect, Option } from "effect"
import { v4 as uuidv4 } from "uuid"
import { NoncesRepo, SessionsRepo } from "../Repo.js"

export class AuthService extends Effect.Service<AuthService>()("api/Auth", {
  effect: Effect.gen(function*() {
    const sessionsRepo = yield* SessionsRepo
    const noncesRepo = yield* NoncesRepo

    const generateNonce = () =>
      DateTime.now.pipe(
        Effect.andThen((now) => DateTime.addDuration(now, Duration.minutes(5))),
        Effect.andThen((expiresAt) => noncesRepo.createNonce(expiresAt))
      )

    const verifyFarcasterCredential = ({
      _devdomain,
      message,
      nonce,
      signature
    }: FarcasterCredential) =>
      Effect.gen(function*() {
        yield* noncesRepo.verifyNonce(nonce)

        const fcAppClient = createAppClient({
          relay: "https://relay.farcaster.xyz",
          ethereum: viemConnector()
        })

        const result = yield* Effect.tryPromise({
          try: () =>
            fcAppClient.verifySignInMessage({
              nonce,
              domain: _devdomain ?? "",
              message,
              signature: signature as `0x${string}`
            }),

          catch: (e) =>
            new InputError({
              message: `Sign in message failed to verify: ${e}`
            })
        })

        if (!result.success) {
          return yield* new InputError({
            message: `Sign in message failed to verify: ${result.error}`
          })
        }
        return Fid.make(result.fid)
      })

    const createSession = (userId: UserId, expiry = Duration.hours(24)) =>
      Effect.gen(function*() {
        const token = sessionTokenFromString(uuidv4())
        const expiresAt = DateTime.addDuration(yield* DateTime.now, expiry)
        yield* sessionsRepo.insert(
          SessionModel.insert.make({
            token,
            userId,
            expiresAt
          })
        )

        return token
      })

    const getSession = (token: SessionToken) =>
      Effect.gen(function*() {
        const sessionResult = yield* sessionsRepo.findById(token)
        if (Option.isNone(sessionResult)) {
          return yield* new SessionNotFound()
        }

        const session = sessionResult.value
        if (yield* DateTime.isPast(session.expiresAt)) {
          return yield* new SessionExpired()
        }

        return session.userId
      })

    // Sign out - delete session
    const deleteSession = (userId: UserId) => sessionsRepo.deleteByUserId(userId)

    return {
      generateNonce,
      verifyFarcasterCredential,
      createSession,
      getSession,
      deleteSession
    }
  }),
  dependencies: [SessionsRepo.Default, NoncesRepo.Default]
}) {}
