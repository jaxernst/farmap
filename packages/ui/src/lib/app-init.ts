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
    const attachmentId = AttachmentId.make(parseInt(focusAttachmentId))
    const res = await Effect.runPromise(
      farmapApi.getPhotoById(attachmentId).pipe(
        Effect.catchTag("AttachmentNotFound", () => {
          alert("Can't seem to find that photo, maybe it was deleted?")
          return Effect.succeed(undefined)
        })
      )
    )

    if (res) {
      focusAttachment = res.attachment
      focusAttachmentCreator = res.creator
      focusCenter = [focusAttachment.position.lat, focusAttachment.position.long]
    }
  }

  const map = await mapStore.initializeMap(mapElementId, focusCenter ?? DEFAULT_CENTER, DEFAULT_ZOOM)

  await sdk.actions.ready({ disableNativeGestures: true })

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

  // Initalize 'fly to' location
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

  // Load all public attachments
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
