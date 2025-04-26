<script lang="ts">
	import '../app.css';
	import 'leaflet/dist/leaflet.css';

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
			focusZoomLevel: 14
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

{@render children()}
