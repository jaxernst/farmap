import { error } from '@sveltejs/kit';
import { createCanvas, loadImage, type CanvasRenderingContext2D } from 'canvas';
import type { PageServerLoad } from './$types';
import { makeFarmapClient } from '$lib/services/farmap-api';
import { NodeHttpClient } from '@effect/platform-node';
import type { Attachment } from '@farmap/domain';


export const load: PageServerLoad = async ({ params }): Promise<{ socialPreview: string, attachment: Attachment }> => {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      throw error(400, 'Invalid ID parameter');
    }
    
    // Create server-side FarmapClient using the NodeHttpClient
    const farmapApi = makeFarmapClient('http://localhost:3001', NodeHttpClient.layer);
    
    // Get the social preview data for the specified ID
    const { url, attachment }= await farmapApi.getSocialPreview(id);
    
    return {
      socialPreview: url,
      attachment
    };
  } catch (err) {
    console.error('Error fetching social preview:', err);
    throw error(500, 'Failed to fetch social preview data');
  }
};