<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import sdk from '@farcaster/frame-sdk/src';

	let imageUrl = $derived(page.data.socialPreview);
	let attachment = $derived(page.data.attachment);
	let creator = $derived(page.data.creator);
	let showOriginal = $state(false);

	const frame = {
		version: 'next',
		imageUrl: imageUrl,
		button: {
			title: 'View on FarMap',
			action: {
				type: 'launch_frame',
				url: `https://farmap.vercel.app/?toAttachment=${attachment.id}`,
				name: 'FarMap',
				splashImageUrl: 'https://farmap.vercel.app/logo.png',
				splashBackgroundColor: '#f5f5f5'
			}
		}
	};

	const handleViewProfile = async () => {
		if (await sdk.context) {
			sdk.actions.viewProfile({ fid: creator.fid });
		}
	};
</script>

<svelte:head>
	{#if attachment}
		<title>Photo on FarMap</title>
		<meta property="og:title" content="Photo on FarMap" />
		<meta property="og:description" content="View this location on FarMap" />
		<meta property="og:image" content={imageUrl} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta property="og:type" content="website" />
		<meta property="og:url" content={`${page.url.origin}/share/${page.params.id}`} />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="fc:frame" content={JSON.stringify(frame)} />
	{/if}
</svelte:head>

<div class="container bg-white">
	<div class="photo-container shadow-lg">
		<img src={imageUrl} alt="Map" class="main-photo" />
	</div>

	<div class="mt-6 flex flex-col gap-4">
		<div class="flex flex-col gap-3">
			<h1 class="leading-2 text-[28px]">Location Photo</h1>

			<button
				onclick={handleViewProfile}
				class="mt-2 flex cursor-pointer items-center gap-1 text-sm font-medium"
			>
				<img src={creator.displayImage} alt="Avatar" class="h-4 w-4 rounded-full" />
				{creator.displayName}
			</button>

			<p class="text-sm">
				Coordinates: {Number(attachment?.position.lat).toFixed(6)}°N,
				{Number(attachment?.position.long).toFixed(6)}°E
			</p>
		</div>

		<div>
			<button class="view-button" onclick={() => goto(`/?toAttachment=${attachment.id}`)}>
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
