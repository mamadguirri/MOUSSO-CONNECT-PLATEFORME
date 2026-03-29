import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

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

// Dossier local pour stocker les uploads en dev
const LOCAL_UPLOAD_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'apps', 'web', 'public', 'uploads');

function ensureUploadDir(folder: string) {
  const dir = path.join(LOCAL_UPLOAD_DIR, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getExtension(mimetype: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/webm': 'webm',
    'video/x-matroska': 'mkv',
  };
  return map[mimetype] || mimetype.split('/')[1] || 'bin';
}

export async function uploadFile(buffer: Buffer, mimetype: string, folder: string): Promise<string> {
  const ext = getExtension(mimetype);
  const filename = `${randomUUID()}.${ext}`;

  // En dev sans R2 configuré, sauvegarder sur le disque local
  if (!process.env.R2_ACCOUNT_ID) {
    const dir = ensureUploadDir(folder);
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`[DEV] Photo sauvegardée: /uploads/${folder}/${filename}`);
    return `/uploads/${folder}/${filename}`;
  }

  const key = `${folder}/${filename}`;
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
    // Supprimer le fichier local
    const localPath = path.join(LOCAL_UPLOAD_DIR, '..', url);
    try {
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log(`[DEV] Photo supprimée: ${url}`);
      }
    } catch {
      // Ignorer les erreurs de suppression en dev
    }
    return;
  }

  const key = url.replace(`${PUBLIC_URL}/`, '');
  await s3.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));
}
