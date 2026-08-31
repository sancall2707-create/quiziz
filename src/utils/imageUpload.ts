import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Validate image file format and size
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'File gambar tidak ditemukan.' };
  }

  // Check MIME type or file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  const isValidType =
    ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) ||
    ['jpg', 'jpeg', 'png', 'webp'].includes(extension || '');

  if (!isValidType) {
    return {
      valid: false,
      error: 'Format file tidak didukung. Harap gunakan gambar berformat JPG, PNG, atau WebP.'
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Ukuran file (${sizeInMB} MB) melebihi batas maksimal 2 MB.`
    };
  }

  return { valid: true, file };
}

/**
 * Crop image to 1:1 square ratio with centered fit and output standard JPEG data URL & Blob
 */
export async function cropImageToSquare(file: File, targetSize: number = 320): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Gagal memproses gambar pada canvas.'));
          return;
        }

        // Calculate 1:1 center crop dimensions
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(
          img,
          startX,
          startY,
          minDim,
          minDim,
          0,
          0,
          targetSize,
          targetSize
        );

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ dataUrl, blob });
            } else {
              reject(new Error('Gagal mengonversi canvas ke blob.'));
            }
          },
          'image/jpeg',
          0.9
        );
      };
      img.onerror = () => reject(new Error('Gagal memuat file gambar.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload cropped avatar blob/dataUrl to Firebase Storage, with fallback to dataUrl
 */
export async function uploadAvatarToStorage(
  userId: string,
  blob: Blob,
  dataUrlFallback: string
): Promise<string> {
  const timestamp = Date.now();
  const storagePath = `avatars/${userId}_${timestamp}.jpg`;
  
  try {
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg'
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (storageError) {
    console.warn('Firebase Storage upload warning (using high-res data URL fallback):', storageError);
    // Fallback gracefully to dataUrl if storage bucket is inaccessible in preview
    return dataUrlFallback;
  }
}
