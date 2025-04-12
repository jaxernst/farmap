<script lang="ts">
	import Map from '$lib/components/Map.svelte';
	import { farmapApi } from '$lib/services/farmap-api';
	import { mapStore } from '$lib/Map.svelte';
	import { Effect, pipe } from 'effect';
	import TitleOverlay from '$lib/components/TitleOverlay.svelte';
	import ControlsOverlay from '$lib/components/ControlsOverlay.svelte';
	import { sdk } from '@farcaster/frame-sdk/src';

	// Sign in with farcaster, get attachments, render them on the map
	$effect(() => {
		sdk.actions.ready({ disableNativeGestures: true });

		Effect.runPromise(
			pipe(
				farmapApi.signInWithFarcaster(12163),
				Effect.andThen(farmapApi.myAttachments),
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
			)
		);
	});
</script>

<svelte:head>
	<title>Far Map</title>
	<meta name="description" content="Upload everywhere" />
</svelte:head>

<TitleOverlay />
<Map />
<ControlsOverlay />
