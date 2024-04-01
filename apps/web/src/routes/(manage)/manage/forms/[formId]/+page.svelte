<script lang="ts">
import { writable } from 'svelte/store'

import FormBuilder from '../FormBuilder.svelte'
import FormInfoForm from '../FormInfoForm.svelte'

export let data

let loading = false
</script>

<FormBuilder form={data.form} />
