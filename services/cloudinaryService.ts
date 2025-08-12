
const CLOUDINARY_CLOUD_NAME = 'imajinasilokal';
const CLOUDINARY_UPLOAD_PRESET = 'simpan_lokal';

export const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();
    if (data.secure_url) {
        return data.secure_url;
    } else {
        throw new Error(data.error?.message || 'Failed to upload image to Cloudinary.');
    }
};
