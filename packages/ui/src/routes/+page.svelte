<script lang="ts">
	import Map from '$lib/components/Map.svelte';
	import PhotoUpload from '$lib/components/PhotoUpload.svelte';
	import { farmapApi } from '$lib/services/farmap-api';
	import { mapStore } from '$lib/Map.svelte';
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

		try {
			const { id } = await farmapApi.attachPhoto(
				{
					lat: Latitude.make(clickMarkerPosition.lat),
					long: Longitude.make(clickMarkerPosition.lng)
				},
				uploadedPhoto
			);

			// cache Ids to local storage list
			const photoIds = JSON.parse(localStorage.getItem('farmap-attached-ids') || '[]');
			localStorage.setItem('farmap-attached-ids', JSON.stringify([...photoIds, id]));

			await farmapApi.getPhotoById(id);

			// Create a URL for the uploaded image to display on the map
			const imageUrl = URL.createObjectURL(uploadedPhoto.file);
			mapStore.addPhotoMarker(
				id.toString(),
				clickMarkerPosition.lat,
				clickMarkerPosition.lng,
				imageUrl
			);

			// Reset state to allow for new uploads
			uploadedPhoto = null;
		} catch (error) {
			console.error('Error saving photo:', error);
			alert('Failed to save photo. Please try again.');
		} finally {
			uploadingPhoto = false;
		}
	}

	function resetUpload() {
		uploadedPhoto = null;
	}

	// Function to handle photo deletion
	async function handleDeletePhoto(photoId: string) {
		try {
			// Mock API call to delete photo
			console.log(`Deleting photo with ID: ${photoId}`);

			// Remove from local storage
			const photoIds = JSON.parse(localStorage.getItem('farmap-attached-ids') || '[]');
			const updatedIds = photoIds.filter((id) => id !== photoId);
			localStorage.setItem('farmap-attached-ids', JSON.stringify(updatedIds));

			// Remove from map
			mapStore.removePhotoMarker(photoId);

			console.log(`Photo ${photoId} successfully deleted`);
		} catch (error) {
			console.error('Error deleting photo:', error);
			alert('Failed to delete photo. Please try again.');
		}
	}

	$effect(() => {
		const photoIds = JSON.parse(localStorage.getItem('farmap-attached-ids') || '[]');
		if (photoIds.length === 0) return;

		for (const id of photoIds) {
			(async () => {
				const photo = await farmapApi.getPhotoById(id);
				mapStore.addPhotoMarker(
					id.toString(),
					photo.position.lat,
					photo.position.long,
					photo.fileUrl
				);
			})();
		}
	});

	$effect(() => {
		farmapApi.signInWithFarcaster(12163);
	});
</script>

<Map />

<div class="fixed top-2 right-2 z-[1000] flex flex-col items-center justify-center">
	<h1
		class="transform font-['Comic_Neue'] text-3xl leading-5 font-black text-purple-500 transition-transform duration-300 hover:scale-110"
	>
		Far Map
	</h1>
	<p class="text-xs leading-5 font-medium text-neutral-400">Upload Everywhere</p>
</div>

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
