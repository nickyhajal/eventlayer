<script lang="ts">
	import FileUpload from 'sveltefileuploadcomponent'
	import Modal from '../Modal.svelte'
	import { CloudArrowUp, XMark, CloudArrowDown, Pencil } from '@steeze-ui/heroicons'
	import { getMediaUrl, v4 } from '@matterloop/util'
	import prettyBytes from 'pretty-bytes'
	import imageCompression from 'browser-image-compression'
	import HeroIcon from '../HeroIcon.svelte'
	import { tw } from 'src/lib/tw'
	import { createEventDispatcher } from 'svelte'
	import Animate from '../Animate.svelte'
	import Input from './Input.svelte'
	import { getMeContext } from '$lib/state/getContexts'
	import { trpc } from '$lib/trpc/client'
	import { fade, fly } from 'svelte/transition'

	// Perhaps we can use this to resize/compress prior to upload?
	// https://github.com/WangYuLue/image-conversion

	interface UploadParent {
		id: string
		type: string
	}
	interface File {
		name: string
		size: number
		type: string
		lastModified: number
		lastModifiedDate: Date
		webkitRelativePath: string
	}
	interface Upload {
		id: string
		file: File
		src: string
		compressing: boolean
		uuid: string
		webshot: string
	}
	interface UploadStatus {
		id: string
		progressStr: string
		progress: number
		error?: string
		uuid: string
	}

	let className = 'mb-4'
	export let placeholder =
		"Drop Photos Here or <div class='text-blue inline underline'>Browse Files</div>"
	export { className as class }
	export let showPreview = true
	export let uploads: Upload[] = []
	export let parent: UploadParent
	export let attachToFeedItemId = ''
	export let allowEditing = true
	export let loadExisting = true
	export let allowUrl = false
	const dispatch = createEventDispatcher()
	let url = ''
	let urlTitle = ''
	let urlError = ''
	let checkedUrl: string | false = false
	let abort
	let processingWebshot = false
	let shell
	let loaded = ''
	let uploadStatus: { [key: string]: UploadStatus } = {}
	let draggingOver: Date | false = false
	let dragHint
	let error = ''
	let openUUID: string
	let openItem = false
	let itemIsOpen = false
	let currrentEditorUtil = 'redact'
	const me = getMeContext()
	$: {
		if (!url) {
			checkedUrl = false
		}
		if (url.includes('https://docs.google.com') && checkedUrl !== url) {
			checkGoogleDocUrl()
		}
		checkedUrl = url
	}
	$: {
		const ignoreTypes = ['user']
		if (loadExisting && parent && parent.id && parent.type && !ignoreTypes.includes(parent.type)) {
			if (loaded !== `${parent.id}-${parent.type}`) {
				getExistingRemoteMedia()
			}
		}
	}
	async function getExistingRemoteMedia() {
		if (typeof window === 'undefined') return
		loaded = `${parent.id}-${parent.type}`
		const existing = await trpc().media.get.query({
			parentType: parent.type,
			parentId: parent.id,
			userId: $me.id
		})
		if (existing?.length) {
			uploads = [
				...existing
					.filter(({ id }) => uploads.find((u) => u.id === id))
					.map((m) => ({
						remote: true,
						id: m.id,
						uuid: m.id,
						src: getMediaUrl(m),
						file: { name: 'Already uploaded' }
					})),
				...uploads
			]
		}
	}
	async function gotFile(fs) {
		dispatch('fileStart')
		endDrag('complete')
		const files = fs.detail.files
		const len = uploads.length
		if (Array.isArray(files)) {
			files.forEach((f, i) => processFile(f, len + i))
		} else {
			processFile(files, len)
		}
	}
	async function processFile(file, inx, method = 'insert') {
		if (file.name.match(/\.icloud$/)) {
			error = 'Make sure to sync any iCloud files before uploading'
		} else if (file.type.includes('pdf')) {
			error = 'Please screenshot PDFs and upload images'
		} else if (
			![
				'image/png',
				'image/jpeg',
				'image/gif',
				'image/tiff',
				'image/svg+xml',
				'image/webp'
			].includes(file.type)
		) {
			error = "This filetype isn't supported but you can take a screenshot and upload that"
		}
		if (!error) {
			try {
				// Initial file load
				var reader = new FileReader()
				reader.onload = function (e) {
					const newRow = {
						src: e.target.result,
						file,
						compressing: true,
						uuid: v4(),
						inx
					}
					if (method === 'insert') {
						uploads.splice(inx, 0, newRow)
					} else {
						uploads[inx] = newRow
					}
					// uploads = [
					//   ...uploads,
					//   {
					//     src: e.target.result,
					//     file,
					//     compressing: true,
					//     uuid: v4(),
					//     inx,
					//   },
					// ]
					// setShellHeight()
					dispatch('fileChange', { files: uploads })
				}
				let url = reader.readAsDataURL(file) // convert to base64 string

				// Compress
				var compressor = new FileReader()
				const options = {
					maxSizeMB: 0.8,
					maxWidthOrHeight: 1920,
					useWebWorker: true
				}
				const compressedFile = await imageCompression(file, options)
				compressor.onload = function (e) {
					uploads[inx].file = compressedFile
					uploads[inx].compressing = false
					dispatch('fileReady', { file: compressedFile })
					const existing = Object.keys(uploadStatus)
					uploads
						.filter(({ uuid, remote }) => !existing.includes(uuid) && !remote)
						.forEach((u) => uploadImage(u))
				}
				let compurl = compressor.readAsDataURL(compressedFile) // convert to base64 string
			} catch (error) {
				console.log('problem', error)
			}
		} else {
			setTimeout(() => (error = ''), 9000)
		}
	}
	async function uploadImage(img) {
		if (parent) {
			const rsp = await trpc().media.getUploadUrl.mutate({
				parentId: parent.id,
				parentType: parent.type,
				attachToFeedItemId,
				mimetype: img.file.type
				// feedItemId,
			})
			uploadStatus[img.uuid] = {
				progressStr: 'Processing...',
				progress: 0
			}
			console.log(rsp)
			if (rsp) {
				uploadStatus[img.uuid] = {
					progressStr: 'Uploading',
					progress: 0
				}
				await uploadToSignedUrl({ url: rsp.url, file: img.file })
				console.log(' do upload ')
				// uploads[img.inx].id = rsp.data.uploadMedia.id
				// // uploads[img.inx].src = getMediaUrl(rsp.data.uploadMedia)
				uploadStatus[img.uuid].progress = 1
				dispatch('fileUploaded', { file: rsp.media })
			}
		}
	}
	async function uploadToSignedUrl({ url, file }: { url: string; file: File }) {
		var myHeaders = new Headers()
		var requestOptions = {
			method: 'PUT',
			body: file,
			headers: {
				'Content-Type': 'application/octet-stream',
				'Content-Length': file.size
			}
		}

		return fetch(url, requestOptions)
			.then((response) => {
				console.log(response)
			})
			.catch((error) => {
				console.log('error', error)
			})
	}
	// function setShellHeight() {
	//   if (shell) {
	//     shell.style.height = ''
	//     setTimeout(() => {
	//       shell.style.height = `${shell.clientHeight}px`
	//     }, 5)
	//   }
	// }
	function remoteDelete(id: string) {
		trpc().media.delete.mutate({ id })
	}
	function deleteUpload(uuid: string) {
		// if (shell) {
		//   const shift = uploads.length === 1 ? 32 : 65
		//   shell.style.height = `${shell.clientHeight - shift}px`
		// }
		uploads = uploads.filter((upload) => {
			if (upload.uuid === uuid) {
				if (upload.id) {
					remoteDelete(upload.id)
				}
				return false
			}
			return true
		})
	}
	async function handleUrlSubmission() {
		if (processingWebshot) return false
		if (!checkedUrl || checkedUrl !== url || urlError) {
			await checkGoogleDocUrl()
		}
		if (!urlError) {
			processingWebshot = true
			const uuid = v4()
			let inx = uploads.length
			uploads = [
				...uploads,
				{
					remote: true,
					webshot: true,
					uuid,
					file: { name: urlTitle || url }
				}
			]
			uploadStatus[uuid] = {
				progressStr: 'Processing...',
				progress: 0
			}
			setTimeout(() => (url = ''), 50)
			const rsp = await mutate({
				mutation: UploadMediaMutation,
				variables: {
					url,
					parentId: parent.id,
					attachToFeedItemId,
					parentType: parent.type
				}
			})
			if (rsp.data.uploadMedia) {
				uploads[inx].src = getMediaUrl(rsp.data.uploadMedia)
				uploadStatus[uuid].progressStr = false
				uploadStatus[uuid].progress = 1
			} else {
				uploadStatus[uuid].progressStr = 'Error...'
			}
			processingWebshot = false
		}
	}
	async function checkGoogleDocUrl() {
		const res = await rest.get('isvalid-gdoc', { url })
		if (res.data.isValid) {
			urlError = ''
			if (res.data.title) {
				urlTitle = res.data.title
			}
		} else {
			if (res.data.redirect.includes('ServiceLogin')) {
				urlError = "It seems that doc hasn't been made public. Update and try again."
			} else {
				urlError = 'This URL is not a valid Google Doc URL'
			}
		}
	}

	// Handle Drag Hints
	async function dragStart(e) {
		if (!draggingOver) {
			console.log('start drag')
			draggingOver = new Date()
		}
	}
	async function mousemove(e) {
		if (dragHint) {
			if (!dragHint.classList.contains('appeared')) {
				dragHint.classList.add('appeared')
			}
			dragHint.style.transform = `translateX(${e.layerX - dragHint.clientWidth / 2}px) translateY(${
				e.layerY - dragHint.clientHeight / 2
			}px)`
		}
	}
	function endDrag(type) {
		if (dragHint) {
			if (type === 'complete') {
				dragHint.classList.add('completed')
				dragHint.style.transform += ' scale(15)'
			}
			dragHint.classList.remove('appeared')
		}
		setTimeout(() => {
			draggingOver = false
		}, 1000)
	}
	function openEditor(uuid) {
		// open pintura image editor
		openUUID = uuid
		openItem = uploads.find((item) => item.uuid === openUUID)
		itemIsOpen = true
	}
	function handlePinturaProcess(event) {
		const exportedFile = event.detail.dest
		let atIndex
		uploads.forEach((item, i) => {
			if (item.uuid === openUUID) {
				remoteDelete(item.id)
				atIndex = i
				return false
			}
			return true
		})
		processFile(exportedFile, atIndex, 'replace')
		openItem = false
		itemIsOpen = false
	}
</script>

<FileUpload multiple={true} on:input={gotFile}>
	<div
		class={tw(
			`dropzone transition duration-500  relative bg-emerald-50 border-2 border-dashed border-emerald-200 ${className}`
		)}
		on:dragenter={dragStart}
		on:dragover={mousemove}
		on:dragend={(() => console.log('dragend'), endDrag())}
		on:dragleave={(() => console.log('dragleave'), endDrag())}
		on:mouseup={(() => console.log('mouseup'), endDrag())}
		bind:this={shell}
	>
		{#if draggingOver}
			<div
				class="dragHint pointer-events-none absolute top-0 left-0 m-auto h-0 w-0 rounded-full bg-gradient-to-bl from-brightgreen to-emerald-500 opacity-0"
				bind:this={dragHint}
			/>
		{/if}
		<div
			class={`w-full h-full placeholder flex-col flex ${draggingOver ? 'pointer-events-none' : ''}`}
		>
			<Animate>
				<div
					class={`flex flex-col items-center w-full placeholder transition-all duration-500 ${
						uploads.length && showPreview ? 'slide-away' : ''
					}`}
				>
					<HeroIcon src={CloudArrowUp} size="30" class={`opacity-70 mx-auto mb-3 mt-2`} />
				</div>
				{#if uploads.length && showPreview}
					<div class="uploads mb-5 w-full flex-col space-y-2" transition:fade|local>
						{#each uploads as { id, file, src, compressing, uuid, webshot }, i}
							<div
								class="flex w-full items-center justify-between rounded-lg border border-emerald-100 bg-white bg-opacity-80 p-2"
								transition:fly|local={{ x: 0, y: -20, duration: 300 }}
							>
								<div class="flex items-center space-x-2">
									{#if webshot && !src}
										<div class="imgwrap flex items-center justify-center">
											<HeroIcon
												src={CloudArrowDown}
												class={`animate-bounce text-emerald-500 w-6 relative top-0.5`}
											/>
										</div>
									{:else}
										<div class="imgwrap rounded" style={`background-image: url(${src});`} />
									{/if}
									<div class="flex flex-col items-start text-black">
										<div class="text-left text-xs font-semibold opacity-90 md:text-sm">
											{file.name}
										</div>
										<div class="text-xs italic opacity-70">
											{compressing ? 'Optimizing...' : file.size ? prettyBytes(file.size) : '-'}
										</div>
									</div>
								</div>
								<div class="flex items-center space-x-2">
									{#if allowEditing && id}
										<div
											class="flex h-8 w-8 items-center justify-center gap-2 rounded-full border border-emerald-100 bg-white text-sm"
											on:click|stopPropagation|preventDefault={() => openEditor(uuid)}
										>
											<HeroIcon src={Pencil} size="16" class={``} solid />
										</div>
									{:else if uploadStatus[uuid]}
										{#if uploadStatus[uuid].progressStr}
											<div class="text-xs">
												{uploadStatus[uuid].progressStr}
											</div>
										{:else}
											<div class="flex items-center space-x-1">
												<span class="text-xs">{Math.ceil(uploadStatus[uuid].progress * 100)}%</span>
												<div class="relative h-2 w-12 overflow-hidden rounded-xl bg-white">
													<div
														class="absolute top-0 left-0 h-full bg-emerald-500"
														style={`width: ${uploadStatus[uuid].progress * 100}%`}
													/>
												</div>
											</div>
										{/if}
									{/if}
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-100 bg-white"
										on:click|stopPropagation|preventDefault={() => deleteUpload(uuid)}
									>
										<HeroIcon src={XMark} size="16" class={``} />
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Animate>
			<h4 class="pb-3">
				{@html placeholder}
			</h4>
		</div>
	</div>
	{#if error.length}
		<div class="error">{error}</div>
	{/if}
</FileUpload>
{#if allowUrl}
	<form
		on:submit|stopPropagation|preventDefault={handleUrlSubmission}
		class="border-t-1 relative z-10 -mt-5 overflow-hidden rounded-b border-2 border-dashed border-emerald-200 bg-white"
	>
		<input
			bind:value={url}
			class={`focus:bg-yellow-100 focus:bg-opacity-50 focus:py-5 text-mdsm w-full px-2 ${
				url.length ? 'pr-32' : ''
			} py-3 font-medium text-center text-gray-600 transition-all duration-200`}
			placeholder="Or paste a link to a website or photo here"
		/>
		<button
			class="absolute top-0 bottom-0 right-2 my-1.5 flex items-center justify-center rounded border border-slate-600 bg-white px-3 py-1 text-sm font-medium text-slate-700 transition-all duration-200 hover:text-green"
			style={`transform: translateX(${url.length ? '0rem' : '7rem'})`}
			><HeroIcon src={CloudArrowUp} solid class="mr-1 w-5 fill-current" />{urlError
				? 'Try Again'
				: 'Upload'}</button
		>
	</form>
	{#if urlError}
		<div
			class="rounded-b-llg rounded-b-lg border-2 border-t-0 border-dashed border-red-100 bg-red-50 p-3 text-sm text-red"
		>
			{urlError}
		</div>
	{/if}
{/if}
<Modal bind:open={itemIsOpen}>
	<PinturaEditor
		{...getEditorDefaults({
			imageWriter: createDefaultImageWriter({
				renameFile: (file) => openItem.file.name
			})
		})}
		src={openItem.src}
		utils={['redact', 'crop', 'annotate', 'sticker', 'filter', 'finetune']}
		stickers={['🎉', '😄', '🏆', '🍾', '🥂', '👍', '👎', '😅', '🥵', '🤬', '😡', '😴', '🕵️‍♂️', '🤤']}
		on:process={handlePinturaProcess}
	/>
</Modal>

<style lang="postcss">
	.dragHint {
		transition: width 0.1s, height 0.1s, opacity 0.1s;
		transform-origin: center;
		&.appeared {
			opacity: 0.2;
			width: 6rem;
			height: 6rem;
			transform: translateX(50%), translateY(50%);
			transition: width 0.2s, height 0.2s, opacity 0.4s;
		}
		&.completed {
			opacity: 0;
			width: 6rem;
			height: 6rem;
			transition: width 0.2s, height 0.2s, opacity 0.4s, transform 0.8s;
		}
	}
	.placeholder.slide-away {
		margin-top: -5.002rem;
	}
	.dropzone {
		min-height: 6.375rem;
		overflow: hidden;
		padding: 0.75rem 0.75rem 0.75rem;
		@apply rounded-xl text-green;
		h4 {
			font-size: 0.9rem;
			margin: 0 auto;
			text-align: center;
			:global(span) {
				display: block;
				font-size: 0.85rem;
				font-weight: 600;
				margin-top: 0.4rem;
				@apply text-gray-700;
				opacity: 0.85;
			}
		}
		.imgwrap {
			width: 3.5rem;
			height: 3.5rem;
			background-size: cover;
		}
	}
	.error {
		@apply bg-red rounded-b-xl;
		padding: 1rem;
		font-size: 0.85rem;
		font-weight: 600;
		position: relative;
		text-align: center;
		z-index: 1;
	}
	:global(.pintura-editor) {
		height: 600px;
	}
</style>
