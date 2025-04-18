import { makeServerClient } from "$lib/services/farmap-api.server"
import type { Attachment } from "@farmap/domain"
import type { UserPreview } from "@farmap/domain/Users"
import { error } from "@sveltejs/kit"
import { Effect, pipe } from "effect"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async (
  { params }
): Promise<{ socialPreview: string; attachment: Attachment; creator: UserPreview } | null> => {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      throw error(400, "Invalid ID parameter")
    }

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
