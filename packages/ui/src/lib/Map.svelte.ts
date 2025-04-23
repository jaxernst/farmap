import { PUBLIC_MAPBOX_ACCESS_TOKEN } from "$env/static/public"
import type L from "leaflet"
import { mount } from "svelte"
import PhotoPopup from "./components/PhotoPopup.svelte"

type AttachmentId = string

class LeafletMapStore {
  private L: typeof L | null = null
  private tileLayer: string =
    `https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${PUBLIC_MAPBOX_ACCESS_TOKEN}`
  private mapboxStyleId: string = "mapbox/streets-v11"

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
      attributionControl: false,
      maxBounds: L.latLngBounds(
        L.latLng(-90, -180),
        L.latLng(90, 180)
      ),
      maxBoundsViscosity: .1,
      center,
      zoom
    })

    L.tileLayer(this.tileLayer, {
      attribution: "© <a href=\"https://www.mapbox.com/about/maps/\">Mapbox</a>",
      id: this.mapboxStyleId,
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 19,
      minZoom: 3
    }).addTo(this.map)

    this.map.on("click", (e: L.LeafletMouseEvent) => {
      this.placeClickMarker(e.latlng)
    })

    await this.recreateMarkers()
    return this.map
  }

  private async recreateMarkers() {
    if (!this.map) return

    this.clearMarkers()

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
    isMine = true,
    openPopup = true
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

    if (openPopup) {
      marker.openPopup()
    }

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
    this.map.locate({ setView: true, maxZoom: 4 })
  }

  clearMarkers() {
    Object.values(this.markers).forEach(({ marker }) => marker.remove())
    this.markers = {}
  }

  flyTo(lat: number, lng: number, zoom?: number) {
    if (!this.map) return
    this.map.flyTo([lat, lng], zoom)
  }

  flyToAttachment(attachmentId: string, zoom?: number) {
    if (!this.map) return
    const attachment = this.markers[attachmentId]
    if (attachment) {
      attachment.marker.openPopup()
      this.flyTo(attachment.marker.getLatLng().lat, attachment.marker.getLatLng().lng, zoom)
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

    if (this.clickMarker) {
      this.clickMarker.remove()
    }

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
