<script lang="ts">
	import { onMount } from 'svelte';
	let L: any; // Will hold the Leaflet library
	let map: any;
	let currentLocation: any;
	let photos: { id: string; lat: number; lng: number; url: string }[] = [];

	onMount(async () => {
		// Dynamically import Leaflet only on client-side
		const L = await import('leaflet');

		const latlng = L.latLng([51.505, -0.09]);
		map = L.map('map', {
			center: latlng,
			zoom: 13
		});

		// Replace the default OSM tiles with a cleaner style
		L.tileLayer(
			'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
			{
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
				subdomains: 'abcd',
				maxZoom: 19
			}
		).addTo(map);

		map.locate({ setView: true, maxZoom: 16 });

		// Handle location found
		map.on('locationfound', (e: any) => {
			currentLocation = e.latlng;
		});
	});

	async function handlePhotoUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files?.length || !currentLocation) return;

		const file = input.files[0];
		const reader = new FileReader();

		reader.onload = async (e) => {
			const photoUrl = e.target?.result as string;

			// In a real app, you would upload this to your backend
			// For now, we'll just store it in memory
			const newPhoto = {
				id: Date.now().toString(),
				lat: currentLocation.lat,
				lng: currentLocation.lng,
				url: photoUrl
			};

			photos = [...photos, newPhoto];

			// Add marker to map
			const L = await import('leaflet');
			const marker = L.marker([currentLocation.lat, currentLocation.lng])
				.addTo(map)
				.bindPopup(
					`
					<div class="rounded-full overflow-hidden" style="width: 200px; height: 200px;">
						<img src="${photoUrl}" class="w-full h-full object-cover" />
					</div>
				`,
					{
						className: 'custom-popup',
						autoPan: true,
						closeButton: true
					}
				)
				.openPopup();
		};

		reader.readAsDataURL(file);
	}
</script>

<div class="map-container">
	<div id="map"></div>
	<div class="upload-container">
		<label for="photo-upload" class="upload-button">
			Upload Photo
			<input
				type="file"
				id="photo-upload"
				accept="image/*"
				on:change={handlePhotoUpload}
				style="display: none;"
			/>
		</label>
	</div>
</div>

<style>
	.map-container {
		position: relative;
		width: 100%;
		height: 100vh;
	}

	#map {
		width: 100%;
		height: 100%;
	}

	.upload-container {
		position: absolute;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
	}

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

	/* Custom Leaflet popup styling */
	:global(.custom-popup .leaflet-popup-content-wrapper) {
		background: transparent;
		box-shadow: none;
	}

	:global(.custom-popup .leaflet-popup-content) {
		margin: 0;
		border-radius: 9999px;
		overflow: hidden;
	}

	:global(.custom-popup .leaflet-popup-tip) {
		display: none;
	}
</style>
