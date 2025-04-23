import { makeServerClient } from "$lib/services/farmap-api.server"
import type { Attachment } from "@farmap/domain"
import type { UserPreview } from "@farmap/domain/Users"
import { error, redirect } from "@sveltejs/kit"
import { Effect, pipe } from "effect"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async (
  { params, setHeaders }
): Promise<{ socialPreview: string; attachment: Attachment; creator: UserPreview } | null> => {
  const id = parseInt(params.id)
  if (id === 6) throw redirect(301, "/share/19")
  if (id === 15) throw redirect(301, "/share/21")

  try {
    if (isNaN(id)) {
      throw error(400, "Invalid ID parameter")
    }

    // Cache for 1 day (86400 seconds) on CDN and in browsers
    setHeaders({
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "CDN-Cache-Control": "public, max-age=86400",
      "Vercel-CDN-Cache-Control": "public, max-age=86400"
    })

    const farmapApi = makeServerClient()

    return await Effect.runPromise(
      pipe(
        farmapApi.getSocialPreview(id),
        Effect.andThen(({ attachment, creator, url }) => Effect.succeed({ socialPreview: url, attachment, creator })),
        Effect.catchAll((err) => {
          console.error("Error fetching social preview:", err)
          return Effect.succeed(null)
        })
      )
    )
  } catch (err) {
    console.error("Error fetching social preview:", err)
    throw error(500, "Failed to fetch social preview data")
  }
}
