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
