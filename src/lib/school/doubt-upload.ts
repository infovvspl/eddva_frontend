import axios from 'axios';
import api, { unwrapSchoolData } from '@/lib/api/school-client';

const s3Client = axios.create({ withCredentials: false });
delete s3Client.defaults.headers.common.Accept;
delete s3Client.defaults.headers.common.Authorization;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function uploadDoubtImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG, PNG, etc.)');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image must be 5 MB or smaller');
  }

  const presignRes = await api.post('/doubts/upload-url', {
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  });
  const { uploadUrl, fileUrl } = unwrapSchoolData(presignRes, { uploadUrl: '', fileUrl: '' });
  if (!uploadUrl || !fileUrl) {
    throw new Error('Could not prepare image upload');
  }

  await s3Client.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
  });

  return fileUrl;
}
