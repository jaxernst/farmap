import { PUBLIC_MAPBOX_ACCESS_TOKEN } from "$env/static/public"
import type { LngLat, LngLatLike, Map, Marker, Popup } from "mapbox-gl"
import { mount } from "svelte"
import PhotoPopup from "./components/PhotoPopup.svelte"

type AttachmentId = string

class MapboxMapStore {
  private mapboxgl: typeof import("mapbox-gl") | null = null
  private mapboxStyleId: string = "jaxernst/cm9wgpy3z001201slards22ph"

  map: Map | null = $state(null)
  clickMarker: Marker | null = $state(null)

  markers: Record<AttachmentId, {
    id: AttachmentId
    marker: Marker
    lat: number
    lng: number
    popupImageUrl: string
    markerIconUrl?: string | null
    isMine: boolean
    popup: Popup
  }> = $state({})

  private popupZoomThreshold = 11

  get mapboxMap() {
    return this.map
  }

  private async ensureMapbox() {
    if (!this.mapboxgl) {
      this.mapboxgl = await import("mapbox-gl")
      this.mapboxgl.default.accessToken = PUBLIC_MAPBOX_ACCESS_TOKEN
    }
    return this.mapboxgl
  }

  async initializeMap(elementId: string, center: LngLatLike = [-0.09, 51.505], zoom = 13) {
    const mapboxgl = await this.ensureMapbox()

    this.map = new mapboxgl.default.Map({
      container: elementId,
      style: `mapbox://styles/${this.mapboxStyleId}`,
      center,
      zoom,
      attributionControl: false,
      doubleClickZoom: false,
      // Disable rotation and pitch for better mobile UX
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: true, // Enable touch zoom but disable rotation below
      // Optimize for mobile performance
      renderWorldCopies: false,
      // Performance optimizations
      antialias: false, // Disable antialiasing for better mobile performance
      // Faster zoom transitions
      scrollZoom: true,
      // Optimize touch behavior for mobile
      touchPitch: false
    })

    // Enable faster zoom with higher scroll zoom speed
    this.map.scrollZoom.setWheelZoomRate(1 / 150) // Faster wheel zoom (default is 1/450)
    this.map.scrollZoom.setZoomRate(1 / 100) // Faster trackpad zoom (default is 1/100)

    // Enable faster touch zoom for mobile
    this.map.touchZoomRotate.disableRotation()

    // Better touch zoom sensitivity using wheel zoom rate
    // This affects both scroll and touch zoom behavior
    this.map.scrollZoom.setWheelZoomRate(1 / 100) // More sensitive than default 1/450

    this.map.on("click", (e) => {
      this.placeClickMarker([e.lngLat.lng, e.lngLat.lat])
    })

    // Custom double click listener with faster zoom
    this.map.on(
      "click",
      doubleClickListener((e) => {
        console.log("Double click detected")
        this.flyZoom([e.lngLat.lng, e.lngLat.lat], 3.0) // Increased zoom multiplier from 2.1 to 3.0
      })
    )

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
    const mapboxgl = await this.ensureMapbox()
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
        onDelete: () => this.removePhotoMarker(id),
        lat,
        lng,
        open: openPopup
      }
    })

    // Create popup
    const popup = new mapboxgl.default.Popup({
      closeButton: true,
      closeOnClick: false,
      className: "custom-popup"
    }).setDOMContent(popupContainer)

    // Create marker with custom icon if provided
    let marker: Marker
    if (markerIconUrl) {
      const markerElement = document.createElement("div")
      markerElement.className = "custom-photo-marker"
      markerElement.innerHTML = `<img src="${markerIconUrl}" alt="Pin" />`
      marker = new mapboxgl.default.Marker({ element: markerElement })
    } else {
      marker = new mapboxgl.default.Marker()
    }

    marker
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(this.map)

    // Handle double-click on marker with faster zoom
    marker.getElement().addEventListener(
      "click",
      doubleClickListener((_e) => {
        console.log("Double click on marker detected")
        this.flyZoom([lng, lat], 3.0) // Faster zoom on marker double-click
      })
    )

    if (openPopup) {
      marker.togglePopup()
    }

    this.markers[id] = { id, marker, lat, lng, popupImageUrl: dataUrl, markerIconUrl, isMine, popup }
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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        this.map?.flyTo({ center: [longitude, latitude], zoom: 14 })
      },
      (error) => {
        console.error("Error getting location:", error)
      }
    )
  }

  clearMarkers() {
    Object.values(this.markers).forEach(({ marker }) => marker.remove())
    this.markers = {}
  }

  flyTo(lat: number, lng: number, zoom?: number) {
    if (!this.map) return
    this.map.flyTo({
      center: [lng, lat],
      zoom: zoom ?? this.map.getZoom(),
      speed: 1.8, // Faster than default for better UX
      curve: 1.42
    })
  }

  flyToAttachment(attachmentId: string, zoom?: number) {
    if (!this.map) return
    const attachment = this.markers[attachmentId]
    if (attachment) {
      attachment.marker.togglePopup()
      this.flyTo(attachment.lat, attachment.lng, zoom)
    }
  }

  closeAllPopups() {
    if (!this.map) return
    Object.values(this.markers).forEach(({ popup }) => {
      if (popup.isOpen()) {
        popup.remove()
      }
    })
  }

  openAllPopups() {
    if (!this.map) return
    Object.values(this.markers).forEach(({ marker }) => {
      if (!marker.getPopup()?.isOpen()) {
        marker.togglePopup()
      }
    })
  }

  hasAttachment(attachmentId: string) {
    return this.markers[attachmentId] !== undefined
  }

  async placeClickMarker(lngLat: LngLatLike) {
    const mapboxgl = await this.ensureMapbox()
    if (!this.map) return

    if (this.clickMarker) {
      this.clickMarker.remove()
    }

    const ringElement = document.createElement("div")
    ringElement.className = "click-marker"
    ringElement.innerHTML = "<div class=\"ring\"></div>"

    this.clickMarker = new mapboxgl.default.Marker({ element: ringElement })
      .setLngLat(lngLat)
      .addTo(this.map)
  }

  getClickMarkerPosition(): LngLat | null {
    return this.clickMarker?.getLngLat() || null
  }

  setZoom(zoom: number) {
    if (!this.map) return
    this.map.setZoom(zoom)
  }

  flyZoom(lngLat?: LngLatLike, multiplier = 3.0) {
    if (!this.map) return
    const currentZoom = this.map.getZoom()
    const newZoom = Math.min(Math.round(currentZoom * multiplier), this.map.getMaxZoom())
    const center = lngLat || this.clickMarker?.getLngLat() || this.map.getCenter()
    this.map.flyTo({
      center,
      zoom: newZoom,
      speed: 2.2, // Faster animation speed (default is 1.2)
      curve: 1.42 // Slightly more aggressive curve for faster feel
    })
  }

  setupPopupVisibilityManager() {
    if (!this.map) return

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

  // Mapbox preloads tiles automatically with better performance
  async preloadTilesForLocation(
    lat: number,
    lng: number,
    zoomLevel: number,
    _padding = 2,
    _includeAdjacentZoomLevels = true
  ): Promise<string> {
    // Mapbox GL handles tile preloading automatically
    return `${lat.toFixed(5)}_${lng.toFixed(5)}_${zoomLevel}`
  }

  cleanupPreloadedTiles(_key?: string) {
    // Not needed with Mapbox GL
  }
}

export const mapStore = new MapboxMapStore()

// Utility function for double click detection
function doubleClickListener(
  onDoubleClick: (e: any) => void,
  options: {
    threshold?: number
    distance?: number
  } = {}
) {
  const { distance = 20, threshold = 300 } = options
  let lastClickTime = 0
  let lastClickPos: { x: number; y: number } | null = null

  return (e: any) => {
    const currentTime = new Date().getTime()
    const timeDiff = currentTime - lastClickTime

    const currentPos = { x: e.clientX || e.point?.x || 0, y: e.clientY || e.point?.y || 0 }

    if (
      timeDiff < threshold && lastClickPos &&
      Math.sqrt(
          Math.pow(currentPos.x - lastClickPos.x, 2) +
            Math.pow(currentPos.y - lastClickPos.y, 2)
        ) < distance
    ) {
      onDoubleClick(e)
    }

    lastClickTime = currentTime
    lastClickPos = currentPos
  }
}
