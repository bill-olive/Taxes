// SSN encryption — runs server-side only via API route
// Uses AES-256-GCM with a random IV per encryption

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;

function getKey(): ArrayBuffer {
  const hex = process.env.SSN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("SSN_ENCRYPTION_KEY must be a 64-character hex string");
  }
  const bytes = new Uint8Array(hex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));
  return bytes.buffer as ArrayBuffer;
}

export async function encryptSSN(ssn: string): Promise<string> {
  const keyData = getKey();
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: ALGORITHM },
    false,
    ["encrypt"]
  );

  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(iv);
  const encoded = new TextEncoder().encode(ssn.replace(/-/g, ""));

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );

  const cipher = new Uint8Array(cipherBuffer);
  const ivB64 = Buffer.from(iv).toString("base64");
  const cipherB64 = Buffer.from(cipher).toString("base64");

  return `${ivB64}:${cipherB64}`;
}

export async function decryptSSN(encrypted: string): Promise<string> {
  const keyBuffer = getKey();
  const key = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: ALGORITHM },
    false,
    ["decrypt"]
  );

  const [ivB64, cipherB64] = encrypted.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const cipher = Buffer.from(cipherB64, "base64");

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    cipher
  );

  return new TextDecoder().decode(decryptedBuffer);
}

export function extractLastFour(ssn: string): string {
  const digits = ssn.replace(/-/g, "");
  return digits.slice(-4);
}
