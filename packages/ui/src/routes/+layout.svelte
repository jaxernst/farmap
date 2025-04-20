<script lang="ts">
	import '../app.css';
	import 'leaflet/dist/leaflet.css';
	import { sdk } from '@farcaster/frame-sdk/src';
	import { initializeApp } from '$lib/AppInit.svelte';
	import { page } from '$app/state';

	/** Scratch notes
	 Prod:
	 	- CDN for S3

  Map loading / initialization behavior: 
		- Should auto zoom all the way out when not signed in and just show jaxer.eth attachments
		
		On map load:
			if focus attachment, go there
			else wait to be signed in 

			if signed in: Go to user's last known location
			else: Zoom all the way out, show all public user markers

	 */

	let { children } = $props();

	let appInitFailed = $state(false);

	$effect(() => {
		console.log('initializing app');
		let cleanup = () => {};

		initializeApp({
			mapElementId: 'map',
			focusAttachmentId: page.url.searchParams.get('toAttachment'),
			popupZoomLevel: 11
		})
			.then((_cleanup) => (cleanup = _cleanup))
			.catch(() => (appInitFailed = true));

		return () => {
			cleanup?.();
		};
	});
</script>

{#if appInitFailed}
	<div class="fixed inset-0 flex items-center justify-center">Oops, something went wrong</div>
{/if}

{@render children()}
