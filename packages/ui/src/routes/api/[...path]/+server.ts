import { PUBLIC_API_URL } from "$env/static/public"
import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ params, request }) => {
  // Handle specific redirects for path segments that might be IDs
  if (params.path) {
    const pathParts = params.path.split("/")
    const potentialId = parseInt(pathParts[pathParts.length - 1])

    if (!isNaN(potentialId)) {
      if (potentialId === 6) {
        pathParts[pathParts.length - 1] = "19"
        return Response.redirect(`${request.url.split("/api/")[0]}/api/${pathParts.join("/")}`, 301)
      }
      if (potentialId === 15) {
        pathParts[pathParts.length - 1] = "21"
        return Response.redirect(`${request.url.split("/api/")[0]}/api/${pathParts.join("/")}`, 301)
      }
    }
  }

  const response = await fetch(`${PUBLIC_API_URL}/${params.path}`, {
    method: request.method,
    headers: request.headers,
    credentials: "include"
  })

  // Create a new response with the same status and headers
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText
  })

  // Copy all headers, including Set-Cookie
  response.headers.forEach((value, key) => {
    newResponse.headers.set(key, value)
  })

  return newResponse
}

export const POST: RequestHandler = async ({ params, request }) => {
  // Handle specific redirects for path segments that might be IDs
  if (params.path) {
    const pathParts = params.path.split("/")
    const potentialId = parseInt(pathParts[pathParts.length - 1])

    if (!isNaN(potentialId)) {
      if (potentialId === 6) {
        pathParts[pathParts.length - 1] = "19"
        return Response.redirect(`${request.url.split("/api/")[0]}/api/${pathParts.join("/")}`, 301)
      }
      if (potentialId === 15) {
        pathParts[pathParts.length - 1] = "21"
        return Response.redirect(`${request.url.split("/api/")[0]}/api/${pathParts.join("/")}`, 301)
      }
    }
  }

  const response = await fetch(`${PUBLIC_API_URL}/${params.path}`, {
    method: request.method,
    headers: request.headers,
    credentials: "include",
    body: await request.arrayBuffer()
  })

  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText
  })

  response.headers.forEach((value, key) => {
    newResponse.headers.set(key, value)
  })

  return newResponse
}

export const DELETE: RequestHandler = async ({ params, request }) => {
  // Handle specific redirects for path segments that might be IDs
  if (params.path) {
    const pathParts = params.path.split("/")
    const potentialId = parseInt(pathParts[pathParts.length - 1])

    if (!isNaN(potentialId)) {
      if (potentialId === 6) {
        pathParts[pathParts.length - 1] = "19"
        return Response.redirect(`${request.url.split("/api/")[0]}/api/${pathParts.join("/")}`, 301)
      }
      if (potentialId === 15) {
        pathParts[pathParts.length - 1] = "21"
        return Response.redirect(`${request.url.split("/api/")[0]}/api/${pathParts.join("/")}`, 301)
      }
    }
  }

  const response = await fetch(`${PUBLIC_API_URL}/${params.path}`, {
    method: request.method,
    headers: request.headers,
    credentials: "include"
  })

  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText
  })

  response.headers.forEach((value, key) => {
    newResponse.headers.set(key, value)
  })

  return newResponse
}
