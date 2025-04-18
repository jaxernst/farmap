<script lang="ts">
	import '../app.css';
	import 'leaflet/dist/leaflet.css';
	import { sdk } from '@farcaster/frame-sdk/src';
	import { userStore } from '$lib/User.svelte';

	let { children } = $props();
	let initialized = $state(false);

	$effect(() => {
		(async () => {
			if (initialized) return;
			console.log('initializing app');

			sdk.actions.ready({ disableNativeGestures: true });
			await userStore.signIn();
			await userStore.initAttachments();
			initialized = true;
		})();
	});
</script>

{@render children()}
