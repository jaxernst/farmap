<script lang="ts">
	import { page } from '$app/state';

	let imageUrl = $derived(page.data.socialPreview);
	let attachment = $derived(page.data.attachment);
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
	{/if}
</svelte:head>

<div class="container">
	<div class="photo-container">
		<img src={imageUrl} alt="Map" class="main-photo" />
	</div>

	<div class="info">
		<h1>Location Photo</h1>
		<p>
			Coordinates: {Number(attachment?.position.lat).toFixed(6)}°N,
			{Number(attachment?.position.long).toFixed(6)}°E
		</p>
		<a href="/" class="view-button">View on Map</a>
		<a href={attachment.fileUrl} class="view-button-secondary">View Original</a>
	</div>
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
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	}

	.main-photo {
		width: 100%;
		display: block;
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

	.view-button-secondary {
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
