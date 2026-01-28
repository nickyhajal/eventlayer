<script lang="ts">
	import AdminScreen from '../AdminScreen.svelte'
	import ApiKeyManager from './ApiKeyManager.svelte'

	export let data
</script>

<AdminScreen title="Advanced Settings">
	<div class="max-w-2xl">
		<ApiKeyManager apiKeys={data.apiKeys} />
	</div>
</AdminScreen>
