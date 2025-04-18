import type L from "leaflet"
import { mount } from "svelte"
import PhotoPopup from "./components/PhotoPopup.svelte"

type AttachmentId = string

class LeafletMapStore {
  private L: typeof L | null = null
  private tileLayer: string = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"

  map: L.Map | null = $state(null)
  clickMarker: L.Marker | null = $state(null)

  markers: Record<AttachmentId, {
    id: AttachmentId
    marker: L.Marker
    lat: number
    lng: number
    popupImageUrl: string
    markerIconUrl?: string | null
    isMine: boolean
  }> = $state({})

  get lMap() {
    return this.map
  }

  private async ensureLeaflet() {
    if (!this.L) {
      this.L = await import("leaflet")
    }

    return this.L
  }

  async initializeMap(elementId: string, center: L.LatLngExpression = [51.505, -0.09], zoom = 13) {
    const L = await this.ensureLeaflet()

    this.map = L.map(elementId, {
      center,
      zoom
    })

    // Add default tile layer
    L.tileLayer(this.tileLayer, {
      subdomains: "abcd",
      maxZoom: 19,
      minZoom: 3
    }).addTo(this.map)

    this.map.on("click", (e: L.LeafletMouseEvent) => {
      this.placeClickMarker(e.latlng)
    })

    // Add any existing markers to the map
    await this.recreateMarkers()
    return this.map
  }

  private async recreateMarkers() {
    if (!this.map) return

    // Clear existing markers
    this.clearMarkers()

    // Recreate all markers from stored data
    for (const data of Object.values(this.markers)) {
      await this.addPhotoMarker(
        data.id,
        data.lat,
        data.lng,
        data.popupImageUrl,
        data.markerIconUrl,
        data.isMine
      )
    }
  }

  async addPhotoMarker(
    id: string,
    lat: number,
    lng: number,
    dataUrl: string,
    markerIconUrl?: string | null,
    isMine = true
  ) {
    const L = await this.ensureLeaflet()
    if (!this.map) return null
    if (this.markers[id]) {
      this.removePhotoMarker(id)
    }

    const popupContainer = document.createElement("div")
    mount(PhotoPopup, {
      target: popupContainer,
      props: {
        imageUrl: dataUrl,
        attachmentId: id,
        isMine,
        onDelete: () => this.removePhotoMarker(id)
      }
    })

    // Create custom icon image tag if markerIconUrl is provided
    const markerOptions: L.MarkerOptions = {}
    if (markerIconUrl) {
      markerOptions.icon = L.divIcon({
        className: "custom-photo-marker",
        html: ` <img src="${markerIconUrl}" alt="" class="rounded-full w-[32px] h-[32px]" /> `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      })
    }

    const marker = L.marker([lat, lng], markerOptions)
      .addTo(this.map)
      .bindPopup(popupContainer, {
        className: "custom-popup",
        autoPan: false,
        closeButton: true,
        autoClose: false,
        closeOnClick: false
      })
      .openPopup()

    this.markers[id] = { id, marker, lat, lng, popupImageUrl: dataUrl, markerIconUrl, isMine }
    return id
  }

  removePhotoMarker(id: string) {
    if (!this.map) return

    const markerToRemove = this.markers[id]
    if (markerToRemove) {
      markerToRemove.marker.remove()
      delete this.markers[id]
    }
  }

  async requestLocation() {
    if (!this.map) return
    this.map.locate({ setView: true, maxZoom: 16 })
  }

  clearMarkers() {
    Object.values(this.markers).forEach(({ marker }) => marker.remove())
    this.markers = {}
  }

  panTo(lat: number, lng: number, zoom?: number) {
    if (!this.map) return
    this.map.setView([lat, lng], zoom)
  }

  panToAttachment(attachmentId: string) {
    if (!this.map) return
    const attachment = this.markers[attachmentId]
    if (attachment) {
      attachment.marker.openPopup()
      this.panTo(attachment.marker.getLatLng().lat, attachment.marker.getLatLng().lng)
    }
  }

  closeAllPopups() {
    if (!this.map) return
    Object.values(this.markers).forEach(({ marker }) => {
      marker.closePopup()
    })
  }

  openAllPopups() {
    if (!this.map) return
    Object.values(this.markers).forEach(({ marker }) => {
      marker.openPopup()
    })
  }

  hasAttachment(attachmentId: string) {
    return this.markers[attachmentId] !== undefined
  }

  async placeClickMarker(latlng: L.LatLng) {
    const L = await this.ensureLeaflet()
    if (!this.map) return

    // Remove existing click marker if any
    if (this.clickMarker) {
      this.clickMarker.remove()
    }

    // Create new click marker with a ring icon
    const ringIcon = L.divIcon({
      className: "click-marker",
      html: "<div class=\"ring\"></div>",
      iconSize: [20, 20]
    })

    this.clickMarker = L.marker(latlng, { icon: ringIcon }).addTo(this.map)
  }

  getClickMarkerPosition(): L.LatLng | null {
    return this.clickMarker?.getLatLng() || null
  }

  setZoom(zoom: number) {
    if (!this.map) return
    this.map.setZoom(zoom)
  }
}

export const mapStore = new LeafletMapStore()
