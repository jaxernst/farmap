<script lang="ts">
	import { onMount } from 'svelte';
	import type L from 'leaflet';

	export let lat: number;
	export let long: number;
	export let zoom = 13;
	export let size = '100%';

	let mapElement: HTMLElement;
	let map: L.Map | null = null;

	onMount(() => {
		const initMap = async () => {
			// Import Leaflet dynamically
			const L = await import('leaflet');

			// Initialize a separate map for the mini-map
			map = L.map(mapElement, {
				center: [lat, long],
				zoom: zoom,
				zoomControl: false,
				attributionControl: false,
				dragging: false,
				scrollWheelZoom: false,
				doubleClickZoom: false,
				touchZoom: false
			});

			// Add a simple tile layer
			L.tileLayer(
				'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
				{
					subdomains: 'abcd',
					maxZoom: 19,
					minZoom: 3
				}
			).addTo(map);

			// Add a marker at the specified location
			const marker = L.marker([lat, long]).addTo(map);

			// Make sure the map is resized properly
			setTimeout(() => {
				map?.invalidateSize();
			}, 100);
		};

		initMap();

		return () => {
			if (map) {
				map.remove();
			}
		};
	});
</script>

<div bind:this={mapElement} class="mini-map" style="width: {size}; height: {size};">
	<!-- Map will be injected here -->
</div>

<style>
	.mini-map {
		width: 100%;
		height: 100%;
		border-radius: inherit;
	}
</style>
