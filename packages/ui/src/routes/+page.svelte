<script lang="ts">
	import ControlsOverlay from '$lib/components/ControlsOverlay.svelte';
	import TitleOverlay from '$lib/components/TitleOverlay.svelte';
	import { userStore } from '$lib/User.svelte';

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

{#if userStore.user}
	<ControlsOverlay />
{/if}
