import { error } from '@sveltejs/kit';
import { createCanvas, loadImage, type CanvasRenderingContext2D } from 'canvas';
import type { PageServerLoad } from './$types';
import { makeFarmapClient } from '$lib/services/farmap-api';
import { NodeHttpClient } from '@effect/platform-node';


export const load: PageServerLoad = async ({ params }) => {
	try {
		const id = parseInt(params.id);
		if (isNaN(id)) {
			throw error(400, 'Invalid ID');
		}

		const client = makeFarmapClient("http://localhost:3001", NodeHttpClient.layer);

		const attachment = await client.getPhotoById(id);
		if (!attachment) {
			throw error(404, 'Photo not found');
		}

		const canvas = createCanvas(1200, 630);
		const ctx = canvas.getContext('2d');

		// Draw background
		ctx.fillStyle = '#f5f5f5';
		ctx.fillRect(0, 0, 1200, 630);

		// Load the photo
		const photo = await loadImage(`data:${attachment.object.mimeType};base64,${attachment.object.data}`);
		
		// Calculate dimensions to maintain aspect ratio but fit within canvas
		const photoWidth = photo.width;
		const photoHeight = photo.height;
		const scale = Math.min(1200 / photoWidth, 630 / photoHeight);
		const scaledWidth = photoWidth * scale;
		const scaledHeight = photoHeight * scale;
		const x = (1200 - scaledWidth) / 2;
		const y = (630 - scaledHeight) / 2;
		
		// Draw the photo
		ctx.drawImage(photo, x, y, scaledWidth, scaledHeight);

		// Add mini-map overlay in top-right corner
		await drawMiniMap(ctx, attachment.position.lat, attachment.position.long);

		// Add branding
		ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
		ctx.fillRect(0, 580, 1200, 50);
		ctx.fillStyle = '#ffffff';
		ctx.font = 'bold 24px Arial';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.fillText('FarMap - Location Photo', 20, 605);

		// Add coordinates
		ctx.font = '18px Arial';
		ctx.textAlign = 'right';
		ctx.fillText(
			`Coordinates: ${Number(attachment.position.lat).toFixed(6)}, ${Number(
				attachment.position.long
			).toFixed(6)}`,
			1180,
			605
		);

		// Return an object instead of a Response
		return {
			image: canvas.toBuffer().toString('base64'), // Convert buffer to base64 string
			contentType: 'image/png',
			cacheControl: 'public, max-age=86400'
		};
	} catch (e) {
		console.error('Error generating OG image:', e);
		throw error(500, 'Failed to generate image');
	}
};

async function drawMiniMap(ctx: CanvasRenderingContext2D, lat: number, long: number) {
	// Create a simple representation of a map
	ctx.save();
	
	// Position and size of the mini-map
	const mapX = 1050;
	const mapY = 30;
	const mapSize = 120;
	
	// Draw map background
	ctx.fillStyle = '#e0e0e0';
	ctx.beginPath();
	ctx.roundRect(mapX, mapY, mapSize, mapSize, 10);
	ctx.fill();
	
	// Draw map grid lines
	ctx.strokeStyle = '#cecece';
	ctx.lineWidth = 1;
	
	for (let i = 0; i <= 3; i++) {
		// Horizontal lines
		ctx.beginPath();
		ctx.moveTo(mapX, mapY + (mapSize / 3) * i);
		ctx.lineTo(mapX + mapSize, mapY + (mapSize / 3) * i);
		ctx.stroke();
		
		// Vertical lines
		ctx.beginPath();
		ctx.moveTo(mapX + (mapSize / 3) * i, mapY);
		ctx.lineTo(mapX + (mapSize / 3) * i, mapY + mapSize);
		ctx.stroke();
	}
	
	// Draw location marker
	const markerX = mapX + mapSize / 2;
	const markerY = mapY + mapSize / 2;
	
	// Outer circle
	ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
	ctx.beginPath();
	ctx.arc(markerX, markerY, 10, 0, Math.PI * 2);
	ctx.fill();
	
	// Inner circle
	ctx.fillStyle = '#4caf50';
	ctx.beginPath();
	ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
	ctx.fill();
	
	// Draw border
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.roundRect(mapX, mapY, mapSize, mapSize, 10);
	ctx.stroke();
	
	ctx.restore();
} 