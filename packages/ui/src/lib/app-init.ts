import sdk from "@farcaster/frame-sdk/src"
import { AttachmentId } from "@farmap/domain/MapAttachments"
import type { UserId } from "@farmap/domain/Users"
import { Effect } from "effect"
import { mapStore } from "./Map.svelte"
import { farmapApi } from "./services/farmap-api"
import { userStore } from "./User.svelte"

type InitOptions = {
  mapElementId: string
  focusAttachmentId?: string | null
  popupZoomLevel?: number
}

type CleanupFunction = () => void

export async function initializeApp(options: InitOptions): Promise<CleanupFunction> {
  const { focusAttachmentId, mapElementId, popupZoomLevel = 11 } = options
  const cleanupFunctions: Array<() => void> = []

  const map = await mapStore.initializeMap(mapElementId)

  await sdk.actions.ready({ disableNativeGestures: true })

  // Setup popup management
  let popupsVisible = false
  const updatePopupVisibility = () => {
    const currentZoom = map.getZoom()
    const shouldShowPopups = currentZoom >= popupZoomLevel

    if (shouldShowPopups && !popupsVisible) {
      mapStore.openAllPopups()
      popupsVisible = true
    } else if (!shouldShowPopups && popupsVisible) {
      mapStore.closeAllPopups()
      popupsVisible = false
    }
  }

  // Register event listeners
  map.on("zoomend", updatePopupVisibility)
  map.on("moveend", updatePopupVisibility)
  cleanupFunctions.push(() => {
    map.off("zoomend", updatePopupVisibility)
    map.off("moveend", updatePopupVisibility)
  })

  let userId: UserId | undefined

  // Attempt sign in only if their is a Farcaster frame context
  if (await sdk.context) {
    try {
      userId = (await userStore.signIn()).userId
      userStore.initAttachments()
    } catch {
      console.warn("No Sign in")
    }
  }

  // Handle focus attachment if specified
  if (focusAttachmentId) {
    const { attachment, creator } = await Effect.runPromise(
      farmapApi.getPhotoById(AttachmentId.make(parseInt(focusAttachmentId)))
    )

    const isMine = userId === attachment.creatorId

    await mapStore.addPhotoMarker(
      attachment.id.toString(),
      attachment.position.lat,
      attachment.position.long,
      attachment.fileUrl,
      creator.displayImage,
      isMine
    )

    mapStore.flyToAttachment(attachment.id.toString(), 14)
  } else if (userId) {
    mapStore.requestLocation()
  } else {
    map.setZoom(map.getMinZoom())
  }

  return () => cleanupFunctions.forEach((fn) => fn())
}
