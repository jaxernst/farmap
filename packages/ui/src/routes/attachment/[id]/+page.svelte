<script lang="ts">
	import { page } from '$app/state';
	import AttachmentPage from '$lib/components/AttachmentPage.svelte';
	import { farmapApi } from '$lib/services/farmap-api';
	import type { Attachment } from '@farmap/domain';
	import type { UserPreview } from '@farmap/domain/Users';
	import { Effect, pipe } from 'effect';

	const { id: attachmentId } = page.params;

	let attachmentPageProps = $state<null | {
		socialPreview: string;
		attachment: Attachment;
		creator: UserPreview;
	}>(null);

	$effect(() => {
		pipe(
			farmapApi.getSocialPreview(parseInt(attachmentId)),
			Effect.tap(({ url, attachment, creator }) => {
				attachmentPageProps = {
					socialPreview: url,
					attachment,
					creator
				};
			}),
			Effect.runPromise
		);
	});
</script>

{#if attachmentPageProps}
	<AttachmentPage
		socialPreview={attachmentPageProps.socialPreview}
		attachment={attachmentPageProps.attachment}
		creator={attachmentPageProps.creator}
	/>
{:else}
	<div class="flex h-screen items-center justify-center">
		<div
			class="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"
		></div>
	</div>
{/if}
