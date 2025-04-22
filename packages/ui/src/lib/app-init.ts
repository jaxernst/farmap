import sdk from "@farcaster/frame-sdk/src"
import { type Attachment, AttachmentId } from "@farmap/domain/MapAttachments"
import type { UserId, UserPreview } from "@farmap/domain/Users"
import { Effect } from "effect"
import { mapStore } from "./Map.svelte"
import { farmapApi } from "./services/farmap-api"
import { userStore } from "./User.svelte"

const DEFAULT_CENTER: L.LatLngExpression = [39, -95]
const DEFAULT_ZOOM = 3

type InitOptions = {
  mapElementId: string
  focusAttachmentId?: string | null
  popupZoomLevel?: number
}

type CleanupFunction = () => void

export async function initializeApp(options: InitOptions): Promise<CleanupFunction> {
  const { focusAttachmentId, mapElementId, popupZoomLevel = 11 } = options
  const cleanupFunctions: Array<() => void> = []

  // If there's a attachment to focus on, get that attachment's position to initialize the map to
  let focusAttachment: Attachment | undefined
  let focusAttachmentCreator: UserPreview | undefined
  let focusCenter: L.LatLngExpression | undefined
  if (focusAttachmentId) {
    const res = await Effect.runPromise(
      farmapApi.getPhotoById(AttachmentId.make(parseInt(focusAttachmentId)))
    )

    focusAttachment = res.attachment
    focusAttachmentCreator = res.creator
    focusCenter = [focusAttachment.position.lat, focusAttachment.position.long]
  }

  const map = await mapStore.initializeMap(mapElementId, focusCenter ?? DEFAULT_CENTER, DEFAULT_ZOOM)

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
  if (focusAttachment) {
    const isMine = userId === focusAttachment.creatorId

    await mapStore.addPhotoMarker(
      focusAttachment.id.toString(),
      focusAttachment.position.lat,
      focusAttachment.position.long,
      focusAttachment.fileUrl,
      focusAttachmentCreator?.displayImage,
      isMine
    )

    mapStore.flyToAttachment(focusAttachment.id.toString(), 14)
  } else if (userId) {
    mapStore.requestLocation()
  } else {
    map.setZoom(map.getMinZoom())
  }

  farmapApi.getAllAttachments().pipe(
    Effect.tap((attachments) => {
      attachments.forEach(({ attachment, creator }) => {
        if (mapStore.hasAttachment(attachment.id.toString())) return

        mapStore.addPhotoMarker(
          attachment.id.toString(),
          attachment.position.lat,
          attachment.position.long,
          attachment.fileUrl,
          creator.displayImage,
          creator.userId === userId,
          false
        )
      })
    }),
    Effect.runPromise
  )

  return () => cleanupFunctions.forEach((fn) => fn())
}
