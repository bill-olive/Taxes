import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./config";

export function getStoragePath(uid: string, taxYear: number, fileName: string) {
  return `users/${uid}/documents/${taxYear}/${fileName}`;
}

export async function uploadDocument(
  uid: string,
  taxYear: number,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ storagePath: string; downloadURL: string }> {
  const storagePath = getStoragePath(uid, taxYear, `${Date.now()}_${file.name}`);
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(percent);
      },
      reject,
      async () => {
        const downloadURL = await getDownloadURL(task.snapshot.ref);
        resolve({ storagePath, downloadURL });
      }
    );
  });
}

export async function deleteDocument(storagePath: string): Promise<void> {
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
}
