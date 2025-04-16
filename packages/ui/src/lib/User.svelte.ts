import type { UserPreview } from '@farmap/domain/Users';
import { Effect } from 'effect';
import { farmapApi } from './services/farmap-api';
import sdk from '@farcaster/frame-sdk/src';
import { mapStore } from './Map.svelte';

class UserStore {
	user = $state<UserPreview | null>(null);

	static signInEffect() {
		return Effect.gen(function* () {
			const user = yield* farmapApi.auth.getCurrentUser();
			if (user) return user;

			const nonce = yield* farmapApi.auth.getNonce();
			const signInResult = yield* Effect.tryPromise({
				try: () => sdk.actions.signIn({ nonce }),
				catch: (e) => {
					return new Error('No Farcaster client available for sign in', {
						cause: e
					});
				}
			});

			return yield* farmapApi.auth.signInWithFarcaster({
				_devdomain: window.location.hostname,
				nonce,
				...signInResult
			});
		});
	}

	static initAttachmentsEffect(userAvatarUrl: string | null) {
		return farmapApi.myAttachments().pipe(
			Effect.andThen(({ attachments }) =>
				attachments.map((attachment) => {
					mapStore.addPhotoMarker(
						attachment.id.toString(),
						attachment.position.lat,
						attachment.position.long,
						attachment.fileUrl,
						userAvatarUrl
					);
				})
			)
		);
	}

	async signIn() {
		return Effect.runPromise(UserStore.signInEffect()).then((user) => {
			this.user = user;
			return user;
		});
	}

	async initAttachments() {
		return Effect.runPromise(UserStore.initAttachmentsEffect(this.user?.displayImage ?? null));
	}
}

export const userStore = new UserStore();
