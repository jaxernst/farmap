<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from "$env/static/public"
	import type { Map } from 'mapbox-gl';

	export let lat: number;
	export let long: number;
	export let zoom = 13;
	export let size = '100%';

	let mapElement: HTMLElement;
	let map: Map | null = null;

	onMount(() => {
		const initMap = async () => {
			// Import Mapbox GL dynamically
			const mapboxgl = await import('mapbox-gl');
			mapboxgl.default.accessToken = PUBLIC_MAPBOX_ACCESS_TOKEN;

			// Initialize a separate map for the mini-map
			map = new mapboxgl.default.Map({
				container: mapElement,
				style: 'mapbox://styles/mapbox/streets-v12', // Simple style for mini-map
				center: [long, lat],
				zoom: zoom,
				interactive: false, // Disable all interactions
				attributionControl: false
			});

			// Add a marker at the specified location
			new mapboxgl.default.Marker()
				.setLngLat([long, lat])
				.addTo(map);

			// Make sure the map is resized properly
			setTimeout(() => {
				map?.resize();
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