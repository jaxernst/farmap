<script lang="ts">
	import { mapStore } from '$lib/Map.svelte';

	const TOGGLE_POPUPS_ZOOM = 11;

	$effect(() => {
		mapStore.initializeMap('map').then(() => {
			let lastZoom = 0;
			mapStore.lMap?.on('zoomend', (x) => {
				const zoom = x.target.getZoom();
				if (zoom === TOGGLE_POPUPS_ZOOM) {
					if (lastZoom === TOGGLE_POPUPS_ZOOM - 1) mapStore.openAllPopups();
					if (lastZoom === TOGGLE_POPUPS_ZOOM + 1) mapStore.closeAllPopups();
				}

				lastZoom = zoom;
			});
		});
	});
</script>

<div id="map"></div>

<style>
	#map {
		width: 100%;
		height: 100%;
	}

	/* Custom Leaflet popup styling */
	:global(.custom-popup .leaflet-popup-content-wrapper) {
		background: transparent;
		box-shadow: none;
	}

	:global(.custom-popup .leaflet-popup-content) {
		margin: 0;
		overflow: hidden;
	}

	:global(.custom-popup .leaflet-popup-tip) {
		display: none;
	}

	:global(.click-marker .ring) {
		width: 20px;
		height: 20px;
		border: 3px solid #4caf50;
		border-radius: 50%;
		background-color: rgba(76, 175, 80, 0.2);
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.2);
			opacity: 0.7;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
</style>
