export const ISE = 'Something went wrong'
export const LIMIT = 10
// export const PAGE = 0
// export const EMAIL_REGEX =
//   /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
// export enum ROLE {
//   'USER' = 'user',
//   'ADMIN' = 'admin',
// }

// export const BASE_URL = process.env.BASE_URL || 'https://api.ecocrest.in'
// export const IS_PRODUCTION = process.env.NODE_ENV === 'production'
export const NAME = process.env.NAME || 'ecocrest'
export const PORT = parseInt(process.env.PORT || '3000')
export const HOST = process.env.HOST || '0.0.0.0'

// export const SMTP_FROM = process.env.SMTP_FROM as string
// export const SMTP_REPLY_TO = process.env.SMTP_REPLY_TO as string
export const SMTP_USER = process.env.SMTP_USER as string
export const SMTP_PASS = process.env.SMTP_PASS as string
export const SMTP_HOST = process.env.SMTP_HOST as string
export const SMTP_PORT = parseInt(process.env.SMTP_PORT as string)
export const SMTP_SECURE = process.env.SMTP_SECURE === 'true'
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY 
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

export const MONGO_URI = process.env.MONGO_URI as string
export const JWT_SECRET = process.env.JWT_SECRET as string
export const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY as string
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string
export const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY as string
// export const BUCKET_NAME = process.env.BUCKET_NAME || 'ecocrest-dev'
// export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID as string
// export const RAZORPAY_KEY_SECRETE = process.env.RAZORPAY_KEY_SECRETE as string
// export const RAZORPAY_WEBHOOK_SECRETE = process.env
//   .RAZORPAY_WEBHOOK_SECRETE as string

// export const SHIPROCKET_API_EMAIL = process.env.SHIPROCKET_API_EMAIL as string
// export const SHIPROCKET_API_PASSWORD = process.env.SHIPROCKET_API_PASSWORD as string

// export const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID as string
// export const ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY as string
