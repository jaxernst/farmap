import type L from 'leaflet';
import { mount } from 'svelte';
import PhotoPopup from './components/PhotoPopup.svelte';

class LeafletMapStore {
	private L: typeof import('leaflet') | null = null;
	private noLabelTileLayer: string =
		'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png';

	map: L.Map | null = $state(null);
	currentLocation: L.LatLng | null = $state(null);
	markers: Array<{ id: string; marker: L.Marker }> = $state([]);
	clickMarker: L.Marker | null = $state(null);

	private async ensureLeaflet() {
		if (!this.L) {
			this.L = await import('leaflet');
		}
		return this.L;
	}

	async initializeMap(elementId: string, center: L.LatLngExpression = [51.505, -0.09], zoom = 13) {
		const L = await this.ensureLeaflet();

		this.map = L.map(elementId, {
			center,
			zoom
		});

		// Add default tile layer
		L.tileLayer(this.noLabelTileLayer, {
			subdomains: 'abcd',
			maxZoom: 19,
			minZoom: 3
		}).addTo(this.map);

		this.requestLocation();

		this.map.on('locationfound', (e: L.LocationEvent) => {
			console.log('locationfound', { e });
			this.currentLocation = e.latlng;
		});

		this.map.on('click', (e: L.LeafletMouseEvent) => {
			this.placeClickMarker(e.latlng);
		});

		return this.map;
	}

	async addPhotoMarker(
		id: string,
		lat: number,
		lng: number,
		dataUrl: string,
		markerIconUrl?: string | null
	) {
		if (!this.map) return null;

		const L = await this.ensureLeaflet();

		const popupContainer = document.createElement('div');
		mount(PhotoPopup, {
			target: popupContainer,
			props: {
				imageUrl: dataUrl,
				attachmentId: id,
				onDelete: () => this.removePhotoMarker(id)
			}
		});

		// Create custom div icon if markerIconUrl is provided
		const markerOptions: L.MarkerOptions = {};
		if (markerIconUrl) {
			markerOptions.icon = L.divIcon({
				className: 'custom-photo-marker',
				html: ` <img src="${markerIconUrl}" alt="" class="rounded-full w-[32px] h-[32px]" /> `,
				iconSize: [32, 32],
				iconAnchor: [16, 16],
				popupAnchor: [0, -16]
			});
		}

		const marker = L.marker([lat, lng], markerOptions)
			.addTo(this.map)
			.bindPopup(popupContainer, {
				className: 'custom-popup',
				autoPan: true,
				closeButton: true,
				autoClose: false,
				closeOnClick: false
			})
			.openPopup();

		this.markers = [...this.markers, { id, marker }];
		return id;
	}

	removePhotoMarker(id: string) {
		if (!this.map) return;

		console.log('removing marker', { id });

		const markerToRemove = this.markers.find((m) => m.id === id);
		if (markerToRemove) {
			// Remove the marker from the map
			markerToRemove.marker.remove();
			this.markers = this.markers.filter((m) => m.id !== id);

			console.log(`Marker ${id} removed successfully`);
		} else {
			console.warn(`No marker found with ID: ${id}`);
		}
	}

	async requestLocation() {
		if (!this.map) return;
		this.map.locate({ setView: true, maxZoom: 16 });
	}

	clearMarkers() {
		this.markers.forEach(({ marker }) => marker.remove());
		this.markers = [];
	}

	panTo(lat: number, lng: number, zoom?: number) {
		if (!this.map) return;

		console.log('set view', { lat, lng, zoom });
		this.map.setView([lat, lng], zoom);
	}

	panToAttachment(attachmentId: string) {
		if (!this.map) return;
		const attachment = this.markers.find((m) => m.id === attachmentId);
		if (attachment) {
			attachment.marker.openPopup();
			this.panTo(attachment.marker.getLatLng().lat, attachment.marker.getLatLng().lng);
		}
	}

	async placeClickMarker(latlng: L.LatLng) {
		if (!this.map) return;

		const L = await this.ensureLeaflet();

		// Remove existing click marker if any
		if (this.clickMarker) {
			this.clickMarker.remove();
		}

		// Create new click marker with a ring icon
		const ringIcon = L.divIcon({
			className: 'click-marker',
			html: '<div class="ring"></div>',
			iconSize: [20, 20]
		});

		this.clickMarker = L.marker(latlng, { icon: ringIcon }).addTo(this.map);
	}

	getClickMarkerPosition(): L.LatLng | null {
		return this.clickMarker?.getLatLng() || null;
	}
}

export const mapStore = new LeafletMapStore();
