<script lang="ts">
	import { page } from '$app/stores';
	import ControlsOverlay from '$lib/components/ControlsOverlay.svelte';
	import TitleOverlay from '$lib/components/TitleOverlay.svelte';
	import PhotoUpload from '$lib/components/PhotoUpload.svelte';
	import { userStore } from '$lib/User.svelte';
	import { mapStore } from '$lib/Map.svelte';
	import sdk from '@farcaster/frame-sdk/src';
	import { Effect, pipe } from 'effect';
	import { farmapApi } from '$lib/services/farmap-api';
	import { Latitude, Longitude } from '@farmap/domain';

	// Get session and cast_id from URL params
	const session = $page.url.searchParams.get('session');
	const cast_id = $page.url.searchParams.get('cast_id');

	let uploadedPhoto: {
		filename: string;
		contentType: string;
		size: number;
		file: File;
	} | null = $state(null);

	let uploadingPhoto = $state(false);
	let castComposed = $state(false);

	async function handleUploadImage(upload: {
		filename: string;
		contentType: string;
		size: number;
		file: File;
	}) {
		uploadedPhoto = upload;
	}

	async function handleSelectLocation() {
		if (!uploadedPhoto) return;

		const clickMarkerPosition = mapStore.getClickMarkerPosition();
		if (!clickMarkerPosition) {
			alert('Please click on the map to select a location');
			return;
		}

		uploadingPhoto = true;
		const result = await Effect.runPromise(
			pipe(
				farmapApi.attachPhoto(
					{
						lat: Latitude.make(clickMarkerPosition.lat),
						long: Longitude.make(clickMarkerPosition.lng)
					},
					uploadedPhoto
				),
				Effect.andThen((result) => farmapApi.getPhotoById(result.id)),
				Effect.catchAll((error) => {
					alert('Failed to save photo. Please try again.');
					console.error('Upload error:', error);
					return Effect.succeed(null);
				})
			)
		);

		uploadingPhoto = false;
		if (!result) return;

		// Compose the cast with the uploaded photo
		await composeCast(result.attachment.id.toString(), result.attachment.fileUrl);
	}

	async function composeCast(attachmentId: string, imageUrl: string) {
		try {
			const context = await sdk.context;
			if (context) {
				// Use the Farcaster SDK to compose a cast
				sdk.actions.composeCast({
					text: `📍 Just uploaded a photo to the map! Check it out: https://farmap.vercel.app/attachment/${attachmentId}`,
					embeds: [`https://farmap.vercel.app/attachment/${attachmentId}`]
				});
				castComposed = true;
			}
		} catch (error) {
			console.error('Failed to compose cast:', error);
			alert('Photo uploaded successfully, but failed to compose cast. You can share it manually!');
		}
	}

	function resetUpload() {
		uploadedPhoto = null;
		castComposed = false;
	}
</script>

<svelte:head>
	<title>Upload to FarMap</title>
	<meta name="description" content="Upload a photo to the interactive map" />
</svelte:head>

<TitleOverlay />

{#await sdk.context then context}
	{#if context && userStore.user}
		<div class="fixed bottom-5 left-0 z-[1000] flex w-full items-center justify-center gap-2">
			{#if uploadingPhoto}
				<button class="action-button select-button disabled:cursor-not-allowed" disabled>
					Uploading...
				</button>
			{:else if castComposed}
				<div class="flex flex-col items-center gap-2">
					<div class="font-bold text-green-600">✅ Photo uploaded and cast composed!</div>
					<button class="action-button select-button" onclick={resetUpload}>
						Upload Another
					</button>
				</div>
			{:else if uploadedPhoto}
				<button class="action-button select-button" onclick={handleSelectLocation}>
					Select Location
				</button>
				<button class="action-button cancel-button" onclick={resetUpload}> Cancel </button>
			{:else}
				<PhotoUpload onPhotoUpload={handleUploadImage} />
			{/if}
		</div>
	{:else if !context}
		<div class="flex h-screen items-center justify-center">
			<div class="text-center">
				<h2 class="mb-4 text-xl font-bold">Please open in Farcaster</h2>
				<p class="text-gray-600">This feature requires the Farcaster app.</p>
			</div>
		</div>
	{:else}
		<div class="flex h-screen items-center justify-center">
			<div class="text-center">
				<h2 class="mb-4 text-xl font-bold">Please sign in to upload photos</h2>
				<p class="text-gray-600">You need to be signed in with Farcaster to use this feature.</p>
			</div>
		</div>
	{/if}
{/await}

<style>
	.action-button {
		padding: 12px 24px;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: background-color 0.3s;
	}

	.select-button {
		background-color: #4caf50;
		color: white;
	}

	.select-button:hover {
		background-color: #45a049;
	}

	.cancel-button {
		background-color: #f44336;
		color: white;
	}

	.cancel-button:hover {
		background-color: #d32f2f;
	}
</style>
