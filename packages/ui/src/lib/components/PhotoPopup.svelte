<script lang="ts">
	import { mapStore } from '$lib/Map.svelte';

	export let imageUrl: string;
	export let attachmentId: string;
	export let open = true;
	export let onDelete: () => void = () => {};

	async function handleDeletePhoto() {
		confirm('Are you sure you want to delete this photo?') && onDelete();

		try {
			// API call to delete photo
			console.log(`Deleting photo with ID: ${attachmentId}`);
			mapStore.removePhotoMarker(attachmentId);
			onDelete();
		} catch (error) {
			console.error('Error deleting photo:', error);
			alert('Failed to delete photo. Please try again.');
		}
	}

	const handleShare = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const url = new URL(window.location.href);
		url.pathname = `/share/${attachmentId}`;
		navigator.clipboard.writeText(url.toString());

		const button = e.target as HTMLButtonElement;
		button.innerText = 'Copied!';

		setTimeout(() => {
			button.innerText = 'Share';
		}, 2000);
	};

	const bringToFront = (event: MouseEvent) => {
		const popup = (event.currentTarget as HTMLElement).closest('.leaflet-popup');
		if (popup) {
			(popup as HTMLElement).style.zIndex = '1000';
		}
	};

	const resetZIndex = (event: MouseEvent) => {
		const popup = (event.currentTarget as HTMLElement).closest('.leaflet-popup');
		if (popup) {
			(popup as HTMLElement).style.zIndex = '';
		}
	};
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="group relative overflow-hidden rounded-2xl"
		style="width: 200px;"
		onmouseenter={bringToFront}
		onclick={bringToFront}
		onmouseleave={resetZIndex}
	>
		<!-- Delete button in top left -->
		<button
			onclick={handleDeletePhoto}
			class="absolute top-1.5 left-1.5 z-10 rounded-full bg-red-500/70 p-1 text-white opacity-100 transition-opacity duration-200 group-hover:opacity-100 hover:bg-red-600 sm:opacity-0"
			aria-label="Delete photo"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-2 w-2 md:h-3 md:w-3"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
				/>
			</svg>
		</button>

		<img src={imageUrl} class="h-full w-full object-cover" alt="" />
		<div class="absolute inset-0 -z-10 bg-white/60"></div>

		<!-- Share button - slides in from bottom on desktop hover, always visible on mobile -->
		<div
			class="absolute right-0 bottom-0 left-0 transform bg-purple-500/80 py-1 text-white transition-transform duration-300 ease-in-out sm:py-2
                    md:translate-y-full md:group-hover:translate-y-0"
		>
			<button
				onclick={handleShare}
				class="flex h-full w-full cursor-pointer items-center justify-center space-x-1"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-3 w-3"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
					/>
				</svg>
				<span class="text-xs sm:text-sm">Share</span>
			</button>
		</div>
	</div>
{/if}

<style>
	/* Add any specific styling for your popup */
	div {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}
</style>
