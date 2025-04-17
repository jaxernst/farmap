import { PUBLIC_API_URL } from '$env/static/public';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, request, url }) => {
	return await forwardRequest(url, params, request);
};

export const POST: RequestHandler = async ({ params, request, url }) => {
	return await forwardRequest(url, params, request);
};

export const PUT: RequestHandler = async ({ params, request, url }) => {
	return await forwardRequest(url, params, request);
};

export const PATCH: RequestHandler = async ({ params, request, url }) => {
	return await forwardRequest(url, params, request);
};

export const DELETE: RequestHandler = async ({ params, request, url }) => {
	return await forwardRequest(url, params, request);
};

async function forwardRequest(url: URL, params: { path?: string }, request: Request) {
	try {
		const apiUrl = PUBLIC_API_URL;
		if (!apiUrl) {
			throw error(500, 'API URL not configured');
		}

		// Build the target URL - using the path parameter if it exists
		const path = params.path || '';
		const targetUrl = `${apiUrl}/${path}${url.search}`;

		// Create a new request with the same method, headers, and body
		const forwardRequest = new Request(targetUrl, {
			method: request.method,
			headers: request.headers,
			body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.blob() : undefined
		});

		// Forward the request to the API
		const response = await fetch(forwardRequest);

		// Return the response from the API
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers
		});
	} catch (err) {
		console.error('API proxy error:', err);
		return json({ error: 'Failed to fetch data from API' }, { status: 500 });
	}
}
