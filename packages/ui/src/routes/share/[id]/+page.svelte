<script lang="ts">
	import { page } from '$app/state';
	import sdk from '@farcaster/frame-sdk/src';
	import AttachmentPage from '$lib/components/AttachmentPage.svelte';

	let imageUrl = $derived(page.data.socialPreview);
	let attachment = $derived(page.data.attachment);
	let creator = $derived(page.data.creator);

	const frame = {
		version: 'next',
		imageUrl: imageUrl,
		button: {
			title: 'View on Map',
			action: {
				type: 'launch_frame',
				url: `https://farmap.vercel.app/?toAttachment=${attachment.id}`,
				name: 'FarMap',
				splashImageUrl: 'https://farmap.vercel.app/logo.png',
				splashBackgroundColor: '#f5f5f5'
			}
		}
	};

	const handleViewProfile = async () => {
		if (await sdk.context) {
			sdk.actions.viewProfile({ fid: creator.fid });
		}
	};
</script>

<svelte:head>
	{#if attachment}
		<title>Photo on FarMap</title>
		<meta property="og:title" content="Photo on FarMap" />
		<meta property="og:description" content="View this location on FarMap" />
		<meta property="og:image" content={imageUrl} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta property="og:type" content="website" />
		<meta property="og:url" content={`${page.url.origin}/share/${page.params.id}`} />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="fc:frame" content={JSON.stringify(frame)} />
	{/if}
</svelte:head>

<AttachmentPage {attachment} {creator} socialPreview={imageUrl} />
