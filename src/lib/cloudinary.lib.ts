import { v2 as clodinary, UploadApiResponse } from 'cloudinary';
import fs from 'fs';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from './constant.lib';

clodinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
})

export const uploadOnCloudinary = async (localFilePath: string): Promise<UploadApiResponse | null> => {
    try {
        if (!localFilePath) return null;

        const response: UploadApiResponse = await clodinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null;
    }
}

export const removeFromCloudnary = async (imageUrl: string) => {
    try {
        const urlArray = imageUrl.split("/");
        const imageNameWithExtension = urlArray[urlArray.length - 1];
        const imageNameArray = imageNameWithExtension.split(".");
        const imageName = imageNameArray[0];

        await clodinary.uploader.destroy(imageName)
    } catch (error) {
         console.log("Cloudinary Error: ", error);
    }
}

