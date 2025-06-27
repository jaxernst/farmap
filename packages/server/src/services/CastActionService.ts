import { Effect } from "effect"

export interface CastActionRequest {
  untrustedData: {
    frame_url: string
    button_index: number
    cast_id: {
      fid: number
      hash: string
    }
  }
  trustedData: {
    messageBytes: string
  }
}

export class CastActionService extends Effect.Service<CastActionService>()("api/CastAction", {
  effect: Effect.succeed({
    handleAction: (request: CastActionRequest) => {
      // Generate a unique session ID for this upload
      const sessionId = crypto.randomUUID()

      // Create the frame URL that will open the mini app with upload context
      const frameUrl =
        `https://farmap.vercel.app/upload?session=${sessionId}&cast_id=${request.untrustedData.cast_id.hash}`

      return Effect.succeed({
        type: "frame" as const,
        frameUrl
      })
    }
  })
}) {}
