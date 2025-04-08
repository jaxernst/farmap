import type L from 'leaflet';

class LeafletMapStore {
    private L: typeof import('leaflet') | null = null;

    map: L.Map | null = $state(null);
    currentLocation: L.LatLng | null = $state(null);
    markers: L.Marker[] = $state([]);
    clickMarker: L.Marker | null = $state(null);

    private async ensureLeaflet() {
      if (!this.L) {
        this.L = await import('leaflet');
      }
      return this.L
    }
   

    // Initialize the map
    async initializeMap(elementId: string, center: L.LatLngExpression = [51.505, -0.09], zoom = 13) {
        const L = await this.ensureLeaflet();
        
        this.map = L.map(elementId, {
            center,
            zoom
        });

        // Add default tile layer
        L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
            {
                subdomains: 'abcd',
                maxZoom: 19,
                minZoom: 3
            }
        ).addTo(this.map);

        // Setup location tracking
        this.requestLocation();
        
        this.map.on('locationfound', (e: L.LocationEvent) => {
            console.log('locationfound', { e });
            this.currentLocation = e.latlng;
        });

        // Add click handler for placing marker
        this.map.on('click', (e: L.LeafletMouseEvent) => {
            this.placeClickMarker(e.latlng);
        });

        return this.map;
    }

    // Add a marker with a photo popup
    async addPhotoMarker(lat: number, lng: number, photoUrl: string) {
        if (!this.map) return null;

        const L = await this.ensureLeaflet();
        const marker = L.marker([lat, lng])
            .addTo(this.map)
            .bindPopup(
                `
                <div class="rounded-2xl overflow-hidden" style="width: 200px;">
                    <img src="${photoUrl}" class="w-full h-full object-cover" />
                </div>
                `,
                {
                    className: 'custom-popup',
                    autoPan: true,
                    closeButton: true,
                    autoClose: false,
                    closeOnClick: false
                }
            ).openPopup();

        this.markers = [...this.markers, marker];
        return marker;
    }

    async requestLocation() {
        if (!this.map) return;
        this.map.locate({ setView: true, maxZoom: 16 });
    }


    // Clear all markers
    clearMarkers() {
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
    }

    // Pan to specific location
    panTo(lat: number, lng: number, zoom?: number) {
        if (!this.map) return;
        
        this.map.setView([lat, lng], zoom);
    }

    // Place a click marker at the specified location
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

        this.clickMarker = L.marker(latlng, { icon: ringIcon })
            .addTo(this.map);
    }

    // Get the current click marker position
    getClickMarkerPosition(): L.LatLng | null {
        return this.clickMarker?.getLatLng() || null;
    }
}

// Export a singleton instance
export const mapStore = new LeafletMapStore();
