import crypto from "crypto";
 
/**
 * Cloudinary direct (signed) upload: the client uploads straight to
 * Cloudinary using a short-lived signature generated here, so the API
 * secret never reaches the browser and the file never round-trips through
 * our own server (sec 2.3 check-in photo_url / sec 2.8 media storage).
 *
 * Docs: https://cloudinary.com/documentation/signatures
 */
export interface SignedUploadParams {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}
 
export function createSignedUploadParams(folder: string): SignedUploadParams {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
 
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("CLOUDINARY_NOT_CONFIGURED");
  }
 
  const timestamp = Math.round(Date.now() / 1000);
 
  // Cloudinary signs the alphabetically-sorted set of params (excluding
  // file/api_key/resource_type), appended with the API secret, then SHA-1'd.
  const paramsToSign: Record<string, string | number> = { folder, timestamp };
  const toSign = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join("&");
 
  const signature = crypto
    .createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");
 
  return { cloudName, apiKey, timestamp, signature, folder };
}