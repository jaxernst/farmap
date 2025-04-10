<script lang="ts">
	export let imageUrl: string;
</script>

<div class="overflow-hidden rounded-2xl" style="width: 200px;">
	<img src={imageUrl} class="h-full w-full object-cover" alt="" />
</div>

<style>
	/* Add any specific styling for your popup */
	div {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}
</style>
