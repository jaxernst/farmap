<script lang="ts">
	import ControlsOverlay from '$lib/components/ControlsOverlay.svelte';
	import TitleOverlay from '$lib/components/TitleOverlay.svelte';
	import { userStore } from '$lib/User.svelte';
	import sdk from '@farcaster/frame-sdk/src';

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
