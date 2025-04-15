<script lang="ts">
	import Map from '$lib/components/Map.svelte';
	import { farmapApi } from '$lib/services/farmap-api';
	import { mapStore } from '$lib/Map.svelte';
	import { Effect } from 'effect';
	import TitleOverlay from '$lib/components/TitleOverlay.svelte';
	import ControlsOverlay from '$lib/components/ControlsOverlay.svelte';
	import { sdk } from '@farcaster/frame-sdk/src';

	let signedIn = $state(false);

	const signIn = () =>
		Effect.gen(function* () {
			const nonce = yield* farmapApi.auth.getNonce();
			const signInResult = yield* Effect.tryPromise({
				try: () => sdk.actions.signIn({ nonce }),
				catch: (e) => {
					return new Error('Farcaster sign in failed', { cause: e });
				}
			});

			yield* farmapApi.auth.signInWithFarcaster({
				_devdomain: window.location.hostname,
				nonce,
				...signInResult
			});
			signedIn = true;
		});

	const initAttachments = () =>
		farmapApi.myAttachments().pipe(
			Effect.andThen(({ attachments }) =>
				attachments.map((attachment) => {
					mapStore.addPhotoMarker(
						attachment.id.toString(),
						attachment.position.lat,
						attachment.position.long,
						attachment.fileUrl
					);
				})
			)
		);

	$effect(() => {
		sdk.actions.ready({ disableNativeGestures: true });

		Effect.runPromise(
			Effect.gen(function* () {
				const user = yield* farmapApi.auth.getCurrentUser();
				if (user === null) yield* signIn();

				signedIn = true;
				yield* initAttachments();
			})
		);
	});
</script>

<svelte:head>
	<title>FarMap</title>
	<meta name="description" content="Upload everywhere" />
</svelte:head>

<TitleOverlay />
<Map />

{#if signedIn}
	<ControlsOverlay />
{/if}
