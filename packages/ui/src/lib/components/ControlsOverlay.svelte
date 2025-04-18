<script lang="ts">
	import { mapStore } from '$lib/Map.svelte';
	import { farmapApi } from '$lib/services/farmap-api';
	import PhotoUpload from './PhotoUpload.svelte';
	import { Effect, pipe } from 'effect';
	import { Latitude, Longitude } from '@farmap/domain';

	let uploadedPhoto: {
		filename: string;
		contentType: string;
		size: number;
		file: File;
	} | null = $state(null);

	let uploadingPhoto = $state(false);

	async function handleUploadImage(upload: {
		filename: string;
		contentType: string;
		size: number;
		file: File;
	}) {
		// Store the uploaded photo temporarily
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

		const imageUrl = URL.createObjectURL(uploadedPhoto.file);
		uploadedPhoto = null;

		mapStore.addPhotoMarker(
			result.attachment.id.toString(),
			clickMarkerPosition.lat,
			clickMarkerPosition.lng,
			imageUrl,
			result.creator.displayImage
		);
	}

	function resetUpload() {
		uploadedPhoto = null;
	}
</script>

<div class="fixed bottom-2 left-0 z-[1000] flex w-full items-center justify-center gap-2">
	{#if uploadingPhoto}
		<button class="action-button select-button disabled:cursor-not-allowed" disabled
			>Uploading...</button
		>
	{:else if uploadedPhoto}
		<button class="action-button select-button" onclick={handleSelectLocation}>
			Select Location
		</button>
		<button class="action-button cancel-button" onclick={resetUpload}> Cancel </button>
	{:else}
		<PhotoUpload onPhotoUpload={handleUploadImage} />
	{/if}
</div>

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
