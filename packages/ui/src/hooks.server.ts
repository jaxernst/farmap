import { PUBLIC_API_URL } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const apiUrl = PUBLIC_API_URL;
	const response = await resolve(event);

	if (apiUrl) {
		response.headers.append('Access-Control-Allow-Origin', apiUrl);
		response.headers.append(
			'Access-Control-Allow-Methods',
			'GET, POST, PUT, DELETE, PATCH, OPTIONS'
		);
		response.headers.append('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		response.headers.append('Access-Control-Allow-Credentials', 'true');
	}

	return response;
};
