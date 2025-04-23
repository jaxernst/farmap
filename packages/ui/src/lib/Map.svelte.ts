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

  private popupZoomThreshold = 11

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
      center,
      zoom,
      bounceAtZoomLimits: false,
      worldCopyJump: true,
      inertia: true,
      inertiaDeceleration: 1000,
      tapTolerance: 15,
      tapHold: true,
      wheelPxPerZoomLevel: 300,
      doubleClickZoom: false
    })

    L.tileLayer(this.tileLayer, {
      attribution: "© <a href=\"https://www.mapbox.com/about/maps/\">Mapbox</a>",
      id: this.mapboxStyleId,
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 19,
      minZoom: 2.5
    }).addTo(this.map)

    this.map.on("click", (e) => {
      this.placeClickMarker(e.latlng)
    })

    // Use a custom double click listener (leaflet's is bad)
    this.map.on(
      "click",
      doubleClickListener(
        (e) => {
          if (!this.map) return
          console.log("Double click detected")
          this.flyZoom(e.latlng)
        }
      )
    )

    this.setupPopupVisibilityManager()

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
        html: ` <img src="${markerIconUrl}" alt="Pin" /> `,
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

    // Apply double-click zoom-in handling to the marker
    marker.on(
      "click",
      doubleClickListener((e) => {
        console.log("Double click on marker detected")
        this.flyZoom(e.latlng)
      })
    )

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

    this.map.once("locationfound", (e: L.LocationEvent) => {
      this.map?.flyTo(e.latlng, 14)
    })

    this.map.locate({ setView: false })
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

  flyZoom(latlng?: L.LatLng, multiplier = 1.8) {
    if (!this.map) return
    const currentZoom = this.map.getZoom()
    const newZoom = Math.min(Math.round(currentZoom * multiplier), this.map.getMaxZoom())
    this.map.flyTo(latlng || this.clickMarker?.getLatLng() || this.map.getCenter(), newZoom)
  }

  setupPopupVisibilityManager() {
    if (!this.map) return

    // Track last 'open all' or 'close all' action to prevent reopening/closing popups
    let popupsVisible = false

    const updatePopupVisibility = () => {
      if (!this.map) return

      const currentZoom = this.map.getZoom()
      const shouldShowPopups = currentZoom >= this.popupZoomThreshold

      if (shouldShowPopups && !popupsVisible) {
        this.openAllPopups()
        popupsVisible = true
      } else if (!shouldShowPopups && popupsVisible) {
        this.closeAllPopups()
        popupsVisible = false
      }
    }

    updatePopupVisibility()

    this.map.on("zoomend", updatePopupVisibility)
    this.map.on("moveend", updatePopupVisibility)

    return () => {
      if (this.map) {
        this.map.off("zoomend", updatePopupVisibility)
        this.map.off("moveend", updatePopupVisibility)
      }
    }
  }
}

export const mapStore = new LeafletMapStore()

//

//

//

//

//

//

//  Util

function doubleClickListener(
  onDoubleClick: (e: L.LeafletMouseEvent) => void,
  options: {
    threshold?: number // Time in ms between clicks (default: 300)
    distance?: number // Max distance between clicks in pixels (default: 20)
  } = {}
) {
  const { distance = 20, threshold = 300 } = options
  let lastClickTime = 0
  let lastClickLatlng: L.LatLng | null = null

  return (e: L.LeafletMouseEvent) => {
    const currentTime = new Date().getTime()
    const timeDiff = currentTime - lastClickTime

    if (
      timeDiff < threshold && lastClickLatlng &&
      e.latlng.distanceTo(lastClickLatlng) < distance
    ) {
      onDoubleClick(e)
    }

    lastClickTime = currentTime
    lastClickLatlng = e.latlng
  }
}
