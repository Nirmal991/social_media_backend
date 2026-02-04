// import crypto from 'node:crypto'
// import path from 'node:path'

// import ejs from 'ejs'
// import jwtToken from 'jsonwebtoken'

// import { JWT_SECRET } from './constant.lib'

// export async function verifyToken(
//   accessToken: string
// ): Promise<Record<string, any>> {
//   return new Promise((resolve, reject) => {
//     jwtToken.verify(accessToken, JWT_SECRET, (error, decoded) => {
//       if (error) {
//         reject(error)
//       }
//       resolve(decoded as Record<string, any>)
//     })
//   })
// }

// export const generateOtp = () => Math.floor(1000 + Math.random() * 9000)

// export const generateBase64Url = () =>
//   crypto.randomBytes(32).toString('base64url')
// export const generateCoupon = () => crypto.randomBytes(3).toString('hex')
// export const generatePassword = () => crypto.randomBytes(16).toString('hex')

// export const getHtml = async (
//   templateName: string,
//   data: ejs.Data,
//   options?: ejs.Options
// ) => {
//   try {
//     return await ejs.renderFile(
//       path.join(process.cwd(), 'assets', templateName),
//       data,
//       options
//     )
//   } catch (error) {
//     console.error('Email Lib getHtml:- ', error)
//     throw error
//   }
// }
