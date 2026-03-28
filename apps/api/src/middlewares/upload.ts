import multer from 'multer';

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const AUDIO_MIMES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'];
const DOC_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ALL_ALLOWED_MIMES = [...IMAGE_MIMES, ...AUDIO_MIMES, ...DOC_MIMES];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALL_ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Formats acceptés : images, audio, PDF, Word, Excel'));
    }
  },
});
