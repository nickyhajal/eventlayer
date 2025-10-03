import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { B2_ACCESS_ID, B2_ACCESS_KEY } from '$env/static/private'

export const getSignedUploadUrl = async (keyPath: string, type: string) => {
  try {
    const client = new S3Client({
      endpoint: 'https://s3.us-east-005.backblazeb2.com',
      region: 'us-east-005',
      credentials: {
        accessKeyId: B2_ACCESS_ID,
        secretAccessKey: B2_ACCESS_KEY,
      },
    })
    const command = new PutObjectCommand({
      Bucket: 'eventlayer',
      Key: keyPath,
    })
    return getSignedUrl(client, command, { expiresIn: 3600 })
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message)
    }
  }
}
