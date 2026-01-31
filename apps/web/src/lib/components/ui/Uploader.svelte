<script lang="ts">
	import { trpc } from '$lib/trpc/client'
	import { getMediaUrl } from '$lib/util/getMediaUrl'
	// Import the Image EXIF Orientation and Image Preview plugins
	// Note: These need to be installed separately
	// `npm i filepond-plugin-image-preview filepond-plugin-image-exif-orientation --save`
	import type { LoadServerConfigFunction, ProcessServerConfigFunction } from 'filepond'
	import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation'
	// import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
	import FilePond, { registerPlugin, supported } from 'svelte-filepond'

	import type { Media } from '@matterloop/db'

	export let parentId = ''
	export let path = ''
	export let parentType = ''
	export let defaultMessage =
		'Drag & Drop your file or <span class="filepond--label-action"> Browse </span>'
	export let existingMedia: Media[] = []
	export let onSuccess: (mediaId: string) => void

	// Register the plugins
	registerPlugin(FilePondPluginImageExifOrientation)
	// registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview)

	// a reference to the component, used to call FilePond methods
	let pond

	// pond.getFiles() will return the active files

	// the name to use for the internal file input
	let name = 'filepond'

	// handle filepond events
	function handleInit() {
		console.log('FilePond has initialised')
	}

	function handleAddFile(err, fileItem) {
		console.log('A file has been added', fileItem)
	}

	const server: { process: ProcessServerConfigFunction; load: LoadServerConfigFunction } = {
		load: (source, load, error, progress, abort, headers) => {
			// Should request a file object from the server here
			// ...

			// Can call the error method if something is wrong, should exit after
			fetch(source)
				.then((res) => res.blob())
				.then(load)
			// error('oh my goodness');

			// Can call the header method to supply FilePond with early response header string
			// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/getAllResponseHeaders
			// headers(headersString);

			// Should call the progress method to update the progress to 100% before calling load
			// (endlessMode, loadedSize, totalSize)
			// progress(true, 0, 1024);

			// Should call the load method with a file object or blob when done

			// Should expose an abort method so the request can be cancelled
			return {
				abort: () => {
					// User tapped cancel, abort our ongoing actions here

					// Let FilePond know the request has been cancelled
					abort()
				},
			}
		},
		process: async (fieldName, file, metadata, load, error, progress, abort, transfer, options) => {
			// fieldName is the name of the input field
			// file is the actual file object to send

			const res = await trpc().media.getUploadUrl.mutate({
				parentId,
				parentType,
				path,
				mimetype: file.type,
			})
			let width = 0
			let height = 0
			const img = new Image()
			img.src = URL.createObjectURL(file)
			img.onload = () => {
				width = img.width
				height = img.height
			}

			if (!res?.media?.id) return abort()
			const request = new XMLHttpRequest()
			request.open('PUT', res.url)
			// request.setRequestHeader('Content-Type', file.type)

			// Should call the progress method to update the progress to 100% before calling load
			// Setting computable to false switches the loading indicator to infinite mode
			request.upload.onprogress = (e) => {
				progress(e.lengthComputable, e.loaded, e.total)
			}

			// Should call the load method when done and pass the returned server file id
			// this server file id is then used later on when reverting or restoring a file
			// so your server knows which file to return without exposing that info to the client
			request.onload = async function () {
				if (request.status >= 200 && request.status < 300) {
					// the load method accepts either a string (id) or an object
					await trpc().media.update.mutate({
						id: res.media.id,
						width,
						height,
						status: 'uploaded',
					})
					onSuccess(res.media.id)
					load(request.responseText)
				} else {
					// Can call the error method if something is wrong, should exit after
					error('oh no')
				}
			}

			console.log(file)
			request.send(file)

			// Should expose an abort method so the request can be cancelled
			return {
				abort: () => {
					// This function is entered if the user has tapped the cancel button
					request.abort()

					// Let FilePond know the request has been cancelled
					abort()
				},
			}
		},
	}
</script>

<div class="">
	<FilePond
		bind:this={pond}
		{name}
		{server}
		files={existingMedia.map(
			(m) => (
				console.log('x', getMediaUrl(m)), { source: getMediaUrl(m), options: { type: 'local' } }
			),
		)}
		allowMultiple={false}
		allowReplace={true}
		labelIdle={defaultMessage}
		allowRevert={false}
		credits={false}
		oninit={handleInit}
		onaddfile={handleAddFile}
	/>
</div>

<style global lang="postcss">
	@import 'filepond/dist/filepond.css';
	@import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
	.filepond--root {
		margin-bottom: 0;
	}
	.filepond--drop-label label {
		font-size: 0.9rem;
		@apply font-medium text-stone-700;
	}
</style>
