<script lang="ts">
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

<label for="photo-upload" class="upload-button">
	Upload Photo
	<input
		type="file"
		id="photo-upload"
		accept="image/png, image/jpeg, image/jpg, image/webp, image/avif, image/heic, image/heif"
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
