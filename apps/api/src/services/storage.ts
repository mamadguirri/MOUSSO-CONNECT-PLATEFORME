import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ACCOUNT_ID
    ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined,
  credentials: process.env.R2_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      }
    : undefined,
});

const BUCKET = process.env.R2_BUCKET_NAME || 'musso-connect';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

export async function uploadFile(buffer: Buffer, mimetype: string, folder: string): Promise<string> {
  const ext = mimetype.split('/')[1] === 'jpeg' ? 'jpg' : mimetype.split('/')[1];
  const key = `${folder}/${randomUUID()}.${ext}`;

  // En dev sans R2 configuré, retourner une URL placeholder
  if (!process.env.R2_ACCOUNT_ID) {
    console.log(`[DEV] Upload simulé: ${key}`);
    return `/uploads/${key}`;
  }

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  }));

  return `${PUBLIC_URL}/${key}`;
}

export async function deleteFile(url: string): Promise<void> {
  if (!process.env.R2_ACCOUNT_ID) {
    console.log(`[DEV] Suppression simulée: ${url}`);
    return;
  }

  const key = url.replace(`${PUBLIC_URL}/`, '');
  await s3.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));
}
