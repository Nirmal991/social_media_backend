// import { PassThrough } from 'node:stream'
// import { join } from 'node:path'

// import { Storage } from '@google-cloud/storage'
// import { extension } from 'mime-types'

// import { generateBase64Url } from './common.lib'
// import { BUCKET_NAME } from './constant.lib'

// const config = {
//   projectId: 'ecocrest-in',
//   keyFile: join(process.cwd(), 'gcp-sa.json'),
// }
// const storage = new Storage(
//   process.env.NODE_ENV === 'production' ? undefined : config
// )
// const bucket = storage.bucket(BUCKET_NAME)

// export type ImageType = { baseUrl: string; key: string }

// export const uploadToCloudStorage = (base64: string, prefix: string) =>
//   new Promise<ImageType>((resolve, reject) => {
//     const match = base64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)
//     if (!match) {
//       return reject(new Error('mime type not found'))
//     }
//     const MIME_TYPE = match[1]
//     const FILE_NAME = `${prefix}/${generateBase64Url()}.${extension(MIME_TYPE)}`

//     // trim off the part of the payload that is not part of the base64 string
//     const base64Img = base64.replace(/^data:(.*,)?/, '')
//     const imageBuffer = Buffer.from(base64Img, 'base64')
//     const bufferStream = new PassThrough()
//     bufferStream.end(imageBuffer)

//     // Define file and fileName
//     const file = bucket.file(FILE_NAME)

//     bufferStream
//       .pipe(
//         file.createWriteStream({
//           contentType: MIME_TYPE,
//           metadata: {
//             contentDisposition: 'inline',
//             cacheControl: 'public, max-age=604800',
//             contentLanguage: 'en',
//             customTime: new Date().toISOString(),
//           },
//         })
//       )
//       .on('error', async (e: Error) => {
//         reject(e)
//       })
//       .on('finish', async () => {
//         resolve({
//           baseUrl: `https://storage.googleapis.com/${BUCKET_NAME}/`,
//           key: file.name,
//         })
//       })
//   })

// export async function deleteFromCloudStorage(key: string) {
//   await bucket.file(key).delete()
// }
