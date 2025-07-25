<div id="map"></div>

<style>
	#map {
		width: 100%;
		height: 100%;
	}

	/* Custom Mapbox popup styling */
	:global(.mapboxgl-popup-content) {
		background: transparent;
		box-shadow: none;
		padding: 0;
	}

	:global(.custom-popup .mapboxgl-popup-content) {
		background: transparent;
		box-shadow: none;
		padding: 0;
	}

	:global(.mapboxgl-popup-tip) {
		display: none;
	}

	:global(.custom-photo-marker) {
		height: 32px;
		width: 32px;
		border-radius: 100%;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.custom-photo-marker img) {
		width: 32px;
		height: 32px;
		object-fit: cover;
		object-position: center;
	}

	:global(.mapboxgl-popup-close-button) {
		font-size: 16px !important;
		font-weight: bold;
		padding: 6px;
		background: rgba(255, 255, 255, 0.8);
		color: #ffffff !important;
		border-radius: 50%;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
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
