import { json } from "@sveltejs/kit"

export const GET = async () => {
  return json({
    name: "FarMap Upload",
    icon: "image",
    description: "Upload a photo to the interactive map and share it in your feed",
    action: {
      type: "post" as const,
      postUrl: "https://farmap.vercel.app/api/cast-action"
    }
  })
}

export const POST = async ({ request }: { request: Request }) => {
  try {
    const body = await request.json()

    // Generate a unique session ID for this upload
    const sessionId = crypto.randomUUID()

    // Create the frame URL that will open the mini app with upload context
    const frameUrl = `https://farmap.vercel.app/upload?session=${sessionId}&cast_id=${body.untrustedData.cast_id.hash}`

    return json({
      type: "frame" as const,
      frameUrl
    })
  } catch (error) {
    console.error("Cast action error:", error)
    return json(
      { message: "Something went wrong." },
      { status: 400 }
    )
  }
}
