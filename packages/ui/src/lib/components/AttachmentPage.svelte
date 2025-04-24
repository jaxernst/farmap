<script lang="ts">
	import { goto } from '$app/navigation';
	import sdk from '@farcaster/frame-sdk/src';
	import { GeocoderClient } from '../services/geocode-client';
	import { Effect } from 'effect';

	const { socialPreview, attachment, creator } = $props();
	let imageUrl = $derived(socialPreview);
	let showOriginal = $state(false);
	let locationName = $state<string | null>(null);

	$effect(() => {
		Effect.runPromise(
			GeocoderClient.reverse(attachment.position.lat, attachment.position.long)
		).then((name) => {
			locationName = name;
		});
	});

	const handleViewProfile = async () => {
		if (await sdk.context) {
			sdk.actions.viewProfile({ fid: creator.fid });
		}
	};
</script>

<div class="container bg-white">
	<div class="photo-container shadow-lg">
		<img src={imageUrl} alt="Map" class="main-photo" />
	</div>

	<div class="mt-6 flex flex-col gap-4">
		<div class="flex flex-col">
			<h1 class="text-[24px] leading-7">
				{#if locationName}
					{locationName} <span class="text-base">📍</span>
				{:else}
					Location Photo
				{/if}
			</h1>

			<p class="text-sm text-black/50">
				{Number(attachment?.position.lat).toFixed(6)}°N,
				{Number(attachment?.position.long).toFixed(6)}°E
			</p>

			{#if locationName}
				<p class=" text-sm"></p>
			{/if}

			<button onclick={handleViewProfile} class="my-3 flex cursor-pointer items-center gap-1">
				<img src={creator.displayImage} alt="Avatar" class="h-5 w-5 rounded-full" />
				{creator.displayName}
			</button>
		</div>

		<div>
			<button class="view-button" onclick={() => goto(`/?toAttachment=${attachment.id}&zoom=14`)}>
				View on Map
			</button>

			<button class="view-button-secondary" onclick={() => (showOriginal = !showOriginal)}>
				{showOriginal ? 'Hide Original' : 'View Original'}
			</button>
		</div>
	</div>

	{#if showOriginal}
		<img src={attachment.fileUrl} class="mt-20" alt="Original" />
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: sans-serif;
	}

	.photo-container {
		position: relative;
		width: 100%;
		border-radius: 12px;
		overflow: hidden;
	}

	.main-photo {
		width: 100%;
		display: block;
	}

	.view-button {
		display: inline-block;
		background-color: #4caf50;
		color: white;
		padding: 10px 20px;
		text-decoration: none;
		border-radius: 4px;
		font-weight: bold;
		transition: background-color 0.3s;
	}

	.view-button-secondary {
		background: none;
		border: none;
		cursor: pointer;
		color: #4caf50;
		padding: 10px 20px;
		text-decoration: none;
		border-radius: 4px;
		font-weight: semibold;
		transition: background-color 0.3s;
	}

	.view-button:hover {
		background-color: #45a049;
	}
</style>
