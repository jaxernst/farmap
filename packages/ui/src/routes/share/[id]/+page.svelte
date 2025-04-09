<script lang="ts">
	import { page } from '$app/stores';
	import { farmapApi } from '$lib/services/farmap-api';
	import { onMount } from 'svelte';
	import { error } from '@sveltejs/kit';
	import MiniMap from '$lib/components/MiniMap.svelte';
	import type { Attachment } from '@farmap/domain';

	let attachment: Attachment | null = $state(null);
	let loading = $state(true);
	let imageUrl = $state('');

	$inspect($page);

	onMount(async () => {
		try {
			const id = parseInt($page.params.id);
			if (isNaN(id)) {
				throw error(400, 'Invalid ID');
			}

			attachment = await farmapApi.getPhotoById(id);
			imageUrl = `data:${attachment.object.mimeType};base64,${attachment.object.data}`;
			loading = false;
		} catch (e) {
			console.error('Error loading photo:', e);
			loading = false;
			throw error(404, 'Photo not found');
		}
	});
</script>

<svelte:head>
	{#if attachment}
		<title>Photo on FarMap</title>
		<meta property="og:title" content="Photo on FarMap" />
		<meta property="og:description" content="View this location on FarMap" />
		<meta property="og:image" content={`/api/og-image/${$page.params.id}`} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta property="og:type" content="website" />
		<meta property="og:url" content={`${$page.url.origin}/share/${$page.params.id}`} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
</svelte:head>

<div class="container">
	{#if loading}
		<div class="loading">Loading...</div>
	{:else if attachment}
		<div class="photo-container">
			<img src={imageUrl} alt="Map" class="main-photo" />
			<div class="mini-map-container">
				{#if attachment.position}
					<MiniMap lat={Number(attachment.position.lat)} long={Number(attachment.position.long)} />
				{/if}
			</div>
		</div>
		<div class="info">
			<h1>Location Photo</h1>
			<p>
				Coordinates: {Number(attachment.position.lat).toFixed(6)}, {Number(
					attachment.position.long
				).toFixed(6)}
			</p>
			<a href="/" class="view-button">View on Map</a>
		</div>
	{:else}
		<div class="error">Photo not found</div>
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: sans-serif;
	}

	.loading,
	.error {
		text-align: center;
		padding: 2rem;
		font-size: 1.5rem;
	}

	.photo-container {
		position: relative;
		width: 100%;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	}

	.main-photo {
		width: 100%;
		display: block;
	}

	.mini-map-container {
		position: absolute;
		top: 16px;
		right: 16px;
		width: 150px;
		height: 150px;
		border-radius: 8px;
		overflow: hidden;
		border: 3px solid white;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
	}

	.info {
		margin-top: 1.5rem;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	p {
		color: #555;
		margin-bottom: 1.5rem;
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

	.view-button:hover {
		background-color: #45a049;
	}
</style>
