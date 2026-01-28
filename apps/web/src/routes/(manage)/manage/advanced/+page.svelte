<script lang="ts">
	import AdminScreen from '../AdminScreen.svelte'
	import ApiKeyManager from './ApiKeyManager.svelte'
	import CustomFieldManager from './CustomFieldManager.svelte'

	export let data
</script>

<AdminScreen title="Advanced Settings">
	<div class="max-w-2xl space-y-12">
		<CustomFieldManager customFields={data.customFields} />
		<ApiKeyManager apiKeys={data.apiKeys} />
	</div>
</AdminScreen>
