// import { createTransport } from 'nodemailer'

// import {
//   NAME,
//   SMTP_FROM,
//   SMTP_HOST,
//   SMTP_PASS,
//   SMTP_PORT,
//   SMTP_REPLY_TO,
//   SMTP_SECURE,
//   SMTP_USER,
// } from './constant.lib'

// const transporter = createTransport({
//   host: SMTP_HOST,
//   secure: SMTP_SECURE,
//   port: SMTP_PORT,
//   auth: {
//     user: SMTP_USER,
//     pass: SMTP_PASS,
//   },
// })

// export const sendEmail = async (
//   to: string,
//   subject: string,
//   html: string
// ): Promise<void> => {
//   try {
//     await transporter.sendMail({
//       to,
//       html,
//       subject: `${subject} - ${NAME}`,
//       from: SMTP_FROM,
//       replyTo: SMTP_REPLY_TO,
//     })
//   } catch (error) {
//     console.error('Email Lib Send:-', error)
//     throw error
//   }
// }
