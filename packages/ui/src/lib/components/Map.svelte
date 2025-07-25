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
		padding: 0 !important;
		margin: 0 !important;
		background: rgba(0, 0, 0, 0.7) !important;
		color: #ffffff !important;
		border-radius: 50%;
		width: 24px !important;
		height: 24px !important;
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
		border: none;
		cursor: pointer;
		text-decoration: none;
		line-height: 1 !important;
		top: 8px;
		right: 8px;
		text-align: center !important;
	}

	:global(.mapboxgl-popup-close-button:hover) {
		background: rgba(0, 0, 0, 0.9) !important;
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
