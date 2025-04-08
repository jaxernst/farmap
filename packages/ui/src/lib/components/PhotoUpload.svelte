<script lang="ts">
	import { mapStore } from '$lib/Map.svelte';
	import { type Blob, type Position } from '@farmap/domain';

	let {
		onPhotoUpload
	}: {
		onPhotoUpload?: (blob: Blob) => void;
	} = $props();

	async function handlePhotoUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files?.length) return alert('No file selected');

		const file = input.files[0];

		const reader = new FileReader();

		try {
			// Read the file as a data URL
			const dataUrl = await new Promise<string>((resolve, reject) => {
				reader.onload = () => resolve(reader.result as string);
				reader.onerror = () => reject(reader.error);
				reader.readAsDataURL(file);
			});

			// Extract the base64 data and mime type from the dataURL
			const [header, base64Data] = dataUrl.split(',');
			const mimeType = header.match(/data:(.*?);/)?.[1] || file.type;

			const blobData = {
				tag: file.name.split('.').pop() || 'unknown', // file extension as tag
				mimeType,
				data: base64Data
			};

			onPhotoUpload?.(blobData);
		} catch (error) {
			console.error('Error reading file:', error);
		}
	}
</script>

<label for="photo-upload" class="upload-button">
	Upload Photo
	<input
		type="file"
		id="photo-upload"
		accept="image/png, image/jpeg, image/jpg, image/webp"
		onchange={handlePhotoUpload}
		style="display: none;"
	/>
</label>

<style>
	.upload-button {
		background-color: #4caf50;
		color: white;
		padding: 12px 24px;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: background-color 0.3s;
	}

	.upload-button:hover {
		background-color: #45a049;
	}
</style>
