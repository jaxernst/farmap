<script lang="ts">
	import { userStore } from '$lib/User.svelte';

	let {
		onPhotoUpload
	}: {
		onPhotoUpload?: (upload: {
			filename: string;
			contentType: string;
			size: number;
			file: File;
		}) => void;
	} = $props();

	async function handleUploadClick() {
		// Sign in first if not already signed in
		if (!userStore.user) {
			try {
				await userStore.signIn();
				await userStore.initAttachments();
			} catch (error) {
				alert('Please sign in through Farcaster to upload photos');
				return;
			}
		}
		
		// Trigger file input
		const input = document.getElementById('photo-upload') as HTMLInputElement;
		input?.click();
	}

	async function handlePhotoUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files?.length) return alert('No file selected');

		const file = input.files[0];

		const upload = {
			filename: file.name,
			contentType: file.type,
			size: file.size,
			file: file
		};

		onPhotoUpload?.(upload);
	}
</script>

<button class="upload-button" onclick={handleUploadClick}>
	📷
</button>
<input
	type="file"
	id="photo-upload"
	accept="image/png, image/jpeg, image/jpg, image/webp, image/avif, image/heic, image/heif"
	onchange={handlePhotoUpload}
	style="display: none;"
/>

<style>
	.upload-button {
		background-color: #4caf50;
		color: white;
		padding: 10px;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		cursor: pointer;
		font-size: 20px;
		border: none;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.upload-button:hover {
		background-color: #45a049;
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.upload-button:active {
		transform: scale(0.95);
	}
</style>
