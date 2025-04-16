<script lang="ts">
	import Map from '$lib/components/Map.svelte';
	import TitleOverlay from '$lib/components/TitleOverlay.svelte';
	import ControlsOverlay from '$lib/components/ControlsOverlay.svelte';
	import { sdk } from '@farcaster/frame-sdk/src';
	import { userStore } from '$lib/User.svelte';

	$effect(() => {
		sdk.actions.ready({ disableNativeGestures: true });
		userStore.signIn().then((user) => {
			userStore.initAttachments();
		});
	});
</script>

<svelte:head>
	<title>FarMap</title>
	<meta name="description" content="Upload everywhere" />
</svelte:head>

<TitleOverlay />
<Map />

{#if userStore.user}
	<ControlsOverlay />
{/if}
