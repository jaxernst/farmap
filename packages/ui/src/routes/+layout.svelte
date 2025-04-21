<script lang="ts">
	import '../app.css';
	import 'leaflet/dist/leaflet.css';
	import { sdk } from '@farcaster/frame-sdk/src';
	import { initializeApp } from '$lib/app-init';
	import { page } from '$app/state';
	import Map from '../lib/components/Map.svelte';
	import { browser } from '$app/environment';
	import { mapStore } from '../lib/Map.svelte';

	let { children } = $props();

	let focusAttachmentId = $derived(page.url.searchParams.get('toAttachment'));
	let zoomLevel = $derived(page.url.searchParams.get('zoom'));

	let appInitFailed = $state(false);

	if (browser) {
		initializeApp({
			mapElementId: 'map',
			// svelte-ignore state_referenced_locally
			focusAttachmentId,
			popupZoomLevel: 11
		})
			.then(() => console.log('Initialized'))
			.catch((e) => {
				console.error(e);
				appInitFailed = true;
			});
	}

	$effect(() => {
		if (focusAttachmentId) {
			mapStore.flyToAttachment(focusAttachmentId, zoomLevel ? parseInt(zoomLevel) : 14);
		}
	});
</script>

{#if appInitFailed}
	<div class="fixed inset-0 flex items-center justify-center">Oops, something went wrong</div>
{/if}

<div class="isolate" class:invisible={page.url.pathname !== '/'}>
	<Map />
</div>

<!-- Display 'open in farcaster button overlay if there's no frame context -->
{#await sdk.context then context}
	{#if !context}
		<div
			class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-3xl border-2 border-purple-400 bg-white"
		>
			<a
				class="flex items-center gap-2 rounded-md px-4 py-2 text-lg font-medium text-purple-500"
				href="https://warpcast.com/~/mini-apps/launch?domain={window.location.host}"
			>
				Open app in Farcaster
			</a>
		</div>
	{/if}
{/await}

{@render children()}
