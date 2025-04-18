<script lang="ts">
	import { Effect } from 'effect';
	import Map from '$lib/components/Map.svelte';
	import TitleOverlay from '$lib/components/TitleOverlay.svelte';
	import ControlsOverlay from '$lib/components/ControlsOverlay.svelte';
	import { sdk } from '@farcaster/frame-sdk/src';
	import { userStore } from '$lib/User.svelte';
	import { page } from '$app/state';
	import { mapStore } from '../lib/Map.svelte';
	import { farmapApi } from '../lib/services/farmap-api';
	import { AttachmentId } from '@farmap/domain/MapAttachments';

	const focusAttachment = $derived(page.url.searchParams.get('toAttachment'));

	$effect(() => {
		(async () => {
			if (focusAttachment) {
				if (!mapStore.hasAttachment(focusAttachment)) {
					const { attachment, creator } = await Effect.runPromise(
						farmapApi.getPhotoById(AttachmentId.make(parseInt(focusAttachment)))
					);

					await mapStore.addPhotoMarker(
						attachment.id.toString(),
						attachment.position.lat,
						attachment.position.long,
						attachment.fileUrl,
						creator.displayImage,
						false
					);

					mapStore.panToAttachment(attachment.id.toString());
				} else {
					mapStore.panToAttachment(focusAttachment);
				}
			}
		})();
	});

	const frame = {
		version: 'next',
		imageUrl: 'https://farmap.vercel.app/splash.png',
		button: {
			title: 'Upload to FarMap',
			action: {
				type: 'launch_frame',
				url: 'https://farmap.vercel.app/',
				name: 'FarMap',
				splashImageUrl: 'https://farmap.vercel.app/logo.png',
				splashBackgroundColor: '#f5f5f5'
			}
		}
	};
</script>

<svelte:head>
	<title>FarMap</title>
	<meta name="description" content="Upload everywhere" />
	<meta name="fc:frame" content={JSON.stringify(frame)} />
</svelte:head>

<TitleOverlay />
<Map />

{#if userStore.user}
	<ControlsOverlay />
{/if}

<!-- Display 'open in farcaster button overlay if there's no frame context -->
{#await sdk.context then context}
	{#if !context}
		<div class="fixed inset-0 z-[1000] flex items-center justify-center">
			<div class="rounded-3xl border-2 border-purple-400 bg-white">
				<button
					class="flex items-center gap-2 rounded-md px-4 py-2 text-lg font-medium text-purple-500"
					onclick={() => {
						window.open(
							`https://warpcast.com/~/developers/mini-apps/preview?url=${window.location.href}`,
							'_blank'
						);
					}}
				>
					Open app in Farcaster
				</button>
			</div>
		</div>
	{/if}
{/await}
