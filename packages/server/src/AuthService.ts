import {
  Effect,
  Random,
  Schedule,
  Duration,
  Option,
  Ref,
  DateTime,
  Layer,
} from "effect";
import { SessionsRepo } from "./Repo.js";
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
import { Authentication } from "@farmap/domain/Api";
import { Unauthorized } from "@effect/platform/HttpApiError";

export const AuthLive = Layer.effect(
  Authentication,
  Effect.gen(function* () {
    const authService = yield* AuthService;

    return Authentication.of({
      cookie: (sessionToken) =>
        authService.getSession(sessionToken as SessionToken).pipe(
          Effect.catchAll((error) => {
            console.log("Error", error);
            return Effect.fail(error);
          })
        ),
    });
  })
);

export class AuthService extends Effect.Service<AuthService>()("api/Auth", {
  effect: Effect.gen(function* () {
    const sessionsRepo = yield* SessionsRepo;
    const nonceRef = yield* Ref.make(new Map<string, DateTime.Utc>());

    // Store nonces in memory with TTL
    const nonceStore = new Map<string, number>();

    const generateNonce = (expiry = Duration.minutes(10)) =>
      Effect.gen(function* () {
        const uuid = uuidv4();
        const now = yield* DateTime.now;
        const expiresAt = DateTime.addDuration(now, expiry);
        yield* Ref.update(nonceRef, (map) => map.set(uuid, expiresAt));
        return { nonce: uuid };
      });

    // Verify the nonce exists and is valid
    const verifyNonce = (nonce: string) =>
      Effect.sync(() => {
        const expiry = nonceStore.get(nonce);
        if (!expiry) {
          return false;
        }
        if (Date.now() > expiry) {
          nonceStore.delete(nonce);
          return false;
        }
        // Delete after use
        nonceStore.delete(nonce);
        return true;
      });

    const verifyFarcasterCredential = (credential: FarcasterCredential) =>
      Effect.gen(function* () {
        return credential.fid;
      });

    const createSession = (userId: UserId, expiry = Duration.hours(24)) =>
      Effect.gen(function* () {
        console.log("createSession", userId);
        const token = sessionTokenFromString(uuidv4());
        const expiresAt = DateTime.addDuration(yield* DateTime.now, expiry);
        const result = yield* sessionsRepo.insert(
          SessionModel.insert.make({
            token,
            userId,
            expiresAt,
          })
        );

        console.log("createSession", token);
        console.log("result", result);
        return token;
      });

    const getSession = (token: SessionToken) =>
      Effect.gen(function* () {
        const sessionResult = yield* sessionsRepo.findById(token);
        if (Option.isNone(sessionResult)) {
          return yield* new SessionNotFound();
        }

        const session = sessionResult.value;
        console.log("isPast", yield* DateTime.isPast(session.expiresAt));
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
