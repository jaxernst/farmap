<script lang="ts">
	import Map from '$lib/components/Map.svelte';
	import PhotoUpload from '$lib/components/PhotoUpload.svelte';
	import { farmapApi } from '$lib/services/farmap-api';
	import { mapStore } from '$lib/Map.svelte';
	import { type Blob, Latitude, Longitude } from '@farmap/domain';

	async function handleUploadImage(blob: Blob) {
		const clickMarkerPosition = mapStore.getClickMarkerPosition();
		const position = clickMarkerPosition || mapStore.currentLocation;

		if (!position) throw new Error('No position found');

		const { id } = await farmapApi.attachPhoto(
			{
				lat: Latitude.make(position.lat),
				long: Longitude.make(position.lng)
			},
			blob
		);

		// save Id to local storage list
		const photoIds = JSON.parse(localStorage.getItem('photoIds') || '[]');
		localStorage.setItem('photoIds', JSON.stringify([...photoIds, id]));

		await farmapApi.getPhotoById(id);

		mapStore.addPhotoMarker(position.lat, position.lng, blob);
	}

	$effect(() => {
		const photoIds = JSON.parse(localStorage.getItem('photoIds') || '[]');
		if (photoIds.length === 0) return;

		for (const id of photoIds) {
			(async () => {
				// const photo = await farmapApi.getPhotoById(id);
				// mapStore.addPhotoMarker(photo.position.lat, photo.position.long, photo.object);
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

<div class="fixed bottom-2 left-0 z-[1000] flex w-full items-center justify-center">
	{#if mapStore.currentLocation}
		<PhotoUpload onPhotoUpload={handleUploadImage} />
	{:else}
		<button class="upload-button" onclick={() => mapStore.requestLocation()}>
			Find Location
		</button>
	{/if}
</div>

<style>
	.upload-button {
		background-color: #4caf50;
		color: white;
		padding: 12px 24px;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: background-color 0.3s;
	}

	.upload-button:hover {
		background-color: #45a049;
	}
</style>
