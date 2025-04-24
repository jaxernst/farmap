<script lang="ts">
	import { mapStore } from '$lib/Map.svelte';
	import { farmapApi } from '$lib/services/farmap-api';
	import sdk from '@farcaster/frame-sdk/src';
	import { AttachmentId } from '@farmap/domain';
	import { Effect } from 'effect';
	import { GeocoderClient } from '../services/geocode-client';

	const { imageUrl, attachmentId, isMine = false, onDelete, lat, lng } = $props();

	let locationName = $state<string | null>(null);
	let popupOpen = $state(false);
	let popupObserver: MutationObserver;

	// Query for location name only once popup has been opened
	$effect(() => {
		if (!locationName && lat && lng && popupOpen) {
			Effect.runPromise(GeocoderClient.reverseSearchLocation(lat, lng)).then((result) => {
				console.log('Reverse geocoded popup location:', result);
				locationName = result;
			});
		}
	});

	function isPopupOpen() {
		const popupPane = document.querySelector('.leaflet-popup-pane');
		if (!popupPane) return false;

		return Array.from(popupPane.children).some((child) =>
			child.contains(document.querySelector(`[data-attachment-id="${attachmentId}"]`))
		);
	}

	$effect(() => {
		// Setup popup detection
		const popupPane = document.querySelector('.leaflet-popup-pane');
		if (popupPane) {
			popupObserver = new MutationObserver(() => {
				popupOpen = isPopupOpen();
			});

			popupObserver.observe(popupPane, { childList: true });
			popupOpen = isPopupOpen();
			return () => popupObserver.disconnect();
		}
	});

	async function handleDeletePhoto() {
		confirm('Are you sure you want to delete this photo?') && onDelete();

		try {
			// API call to delete photo
			console.log(`Deleting photo with ID: ${attachmentId}`);
			Effect.runPromise(farmapApi.deleteAttachment(AttachmentId.make(parseInt(attachmentId))));
			mapStore.removePhotoMarker(attachmentId.toString());
			onDelete();
		} catch (error) {
			console.error('Error deleting photo:', error);
			alert('Failed to delete photo. Please try again.');
		}
	}

	const handleShare = async (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		// Prepare share text with location if available

		const shareText = [`Check out my photo on FarMap: \n`];

		if (locationName) {
			shareText.push(`📍 ${locationName}`);
		}

		const shareLink = `${window.location.origin}/share/${attachmentId}`;
		shareText.push(shareLink);

		if (await sdk.context) {
			sdk.actions.composeCast({
				text: shareText.join('\n'),
				embeds: [`${window.location.origin}/share/${attachmentId}`]
			});
		} else {
			const url = new URL(window.location.href);
			url.pathname = `/share/${attachmentId}`;
			navigator.clipboard.writeText(url.toString());

			const button = e.target as HTMLButtonElement;
			button.innerText = 'Copied!';

			setTimeout(() => {
				button.innerText = 'Share';
			}, 2000);
		}
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

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="group relative overflow-hidden rounded-2xl"
	style="width: 200px;"
	onmouseenter={bringToFront}
	onclick={bringToFront}
	onmouseleave={resetZIndex}
	data-attachment-id={attachmentId}
>
	<!-- Delete button in top left -->
	{#if isMine}
		<button
			onclick={handleDeletePhoto}
			class="absolute left-1.5 top-1.5 z-10 rounded-full bg-red-500/70 p-1 text-white opacity-100 transition-opacity duration-200 hover:bg-red-600 group-hover:opacity-100 sm:opacity-0"
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
	{/if}

	<img src={imageUrl} class="h-full w-full object-cover" alt="" />
	<div class="absolute inset-0 -z-10 bg-white/60"></div>

	<div class="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
		{#if isMine}
			<button
				onclick={handleShare}
				class="rounded-full bg-purple-500 px-2 py-0.5 text-xs font-semibold text-white hover:bg-purple-600 sm:text-sm"
			>
				Share
			</button>
		{/if}
		<a
			href={`/attachment/${attachmentId}`}
			class="rounded-full bg-white/75 px-2 py-0.5 text-xs font-semibold text-purple-500 hover:bg-white/90 sm:text-sm"
		>
			Open
		</a>
	</div>
</div>
