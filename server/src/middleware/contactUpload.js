import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

const serverDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const uploadDirectory = path.join(serverDirectory, 'uploads', 'contacts');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, uploadDirectory),
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`);
  }
});

const fileFilter = (_request, file, callback) => {
  if (file.mimetype.startsWith('image/')) callback(null, true);
  else callback(new Error('Only image files are allowed.'));
};

export const contactImageUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});
