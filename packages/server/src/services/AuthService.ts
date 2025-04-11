import { Effect, Duration, Option, DateTime } from "effect";
import { SessionsRepo } from "../Repo.js";
import {
  FarcasterCredential,
  SessionModel,
  SessionToken,
  sessionTokenFromString,
  SessionNotFound,
  SessionExpired,
} from "@farmap/domain/Auth";
import { UserId } from "@farmap/domain/Users";
import { v4 as uuidv4 } from "uuid";

export class AuthService extends Effect.Service<AuthService>()("api/Auth", {
  effect: Effect.gen(function* () {
    const sessionsRepo = yield* SessionsRepo;

    const verifyFarcasterCredential = (credential: FarcasterCredential) =>
      Effect.gen(function* () {
        return credential.fid;
      });

    const createSession = (userId: UserId, expiry = Duration.hours(24)) =>
      Effect.gen(function* () {
        const token = sessionTokenFromString(uuidv4());
        const expiresAt = DateTime.addDuration(yield* DateTime.now, expiry);
        yield* sessionsRepo.insert(
          SessionModel.insert.make({
            token,
            userId,
            expiresAt,
          })
        );

        return token;
      });

    const getSession = (token: SessionToken) =>
      Effect.gen(function* () {
        const sessionResult = yield* sessionsRepo.findById(token);
        if (Option.isNone(sessionResult)) {
          return yield* new SessionNotFound();
        }

        const session = sessionResult.value;
        if (yield* DateTime.isPast(session.expiresAt)) {
          return yield* new SessionExpired();
        }

        return session.userId;
      });

    // Sign out - delete session
    const signOut = sessionsRepo.delete;

    return {
      verifyFarcasterCredential,
      createSession,
      getSession,
      signOut,
    };
  }),
  dependencies: [SessionsRepo.Default],
}) {}
