export async function uploadImage(file: File, signedUrl: string) {
	// upload file to signed s3 url multipart

	const response = await fetch(signedUrl, {
		method: 'PUT',
		headers: {
			'Content-Type': 'multipart/form-data',
		},
		body: file,
	})
	if (!response.ok) {
		throw new Error('Failed to upload image')
	}
}
