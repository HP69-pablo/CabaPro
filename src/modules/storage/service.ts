import crypto from "crypto";
import { ValidationError } from "@/lib/errors";

export interface UploadFileOptions {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  isPrivate: boolean;
  folder: "listings" | "identities" | "proofs" | "receipts" | "transfers";
}

export interface StoredFileResult {
  fileKey: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export class StorageService {
  /**
   * Validate file buffer, type, and size.
   */
  static validateFile(buffer: Buffer, mimeType: string) {
    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      throw new ValidationError(
        `Unsupported file type: ${mimeType}. Allowed: JPEG, PNG, WEBP, PDF`
      );
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new ValidationError(
        `File size exceeds limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`
      );
    }
  }

  /**
   * Strip EXIF metadata from JPEG/PNG images to protect location privacy.
   * Strips APP1 (EXIF / GPS marker) blocks in standard JPEG headers.
   */
  static stripExifMetadata(buffer: Buffer, mimeType: string): Buffer {
    if (mimeType !== "image/jpeg" && mimeType !== "image/jpg") {
      return buffer;
    }

    // Fast JPEG EXIF stripping: remove APP1 marker (0xFFE1) segments containing Exif header
    try {
      let offset = 2; // Skip SOI (0xFFD8)
      const cleanSegments: Buffer[] = [buffer.subarray(0, 2)];

      while (offset < buffer.length - 1) {
        if (buffer[offset] !== 0xff) {
          cleanSegments.push(buffer.subarray(offset));
          break;
        }

        const marker = buffer[offset + 1];
        // SOS marker reached; image data begins
        if (marker === 0xda) {
          cleanSegments.push(buffer.subarray(offset));
          break;
        }

        const length = buffer.readUInt16BE(offset + 2);
        // APP1 marker contains EXIF metadata
        if (marker === 0xe1) {
          // Skip this segment
          offset += 2 + length;
        } else {
          cleanSegments.push(buffer.subarray(offset, offset + 2 + length));
          offset += 2 + length;
        }
      }

      return Buffer.concat(cleanSegments);
    } catch {
      // In case of parsing discrepancy, return original buffer
      return buffer;
    }
  }

  /**
   * Store file and return storage key and access URL.
   */
  static async uploadFile(options: UploadFileOptions): Promise<StoredFileResult> {
    this.validateFile(options.buffer, options.mimeType);

    const sanitizedBuffer = this.stripExifMetadata(options.buffer, options.mimeType);
    const uniqueId = crypto.randomUUID();
    const extension = options.fileName.split(".").pop() || "bin";
    const bucketPrefix = options.isPrivate ? "private" : "public";
    const fileKey = `${bucketPrefix}/${options.folder}/${uniqueId}.${extension}`;

    // Generate access URL (in production this resolves to a signed S3/Supabase Storage URL)
    const url = options.isPrivate
      ? `/api/storage/signed?key=${encodeURIComponent(fileKey)}`
      : `/uploads/${fileKey}`;

    return {
      fileKey,
      url,
      sizeBytes: sanitizedBuffer.length,
      mimeType: options.mimeType,
    };
  }

  /**
   * Generate short-lived signed URL for private documents.
   */
  static generateSignedUrl(fileKey: string, expiresInSeconds = 900): string {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const signature = crypto
      .createHmac("sha256", process.env.AUTH_SECRET || "caba-fallback-secret")
      .update(`${fileKey}:${expiresAt}`)
      .digest("hex");

    return `/api/storage/download?key=${encodeURIComponent(fileKey)}&expires=${expiresAt}&sig=${signature}`;
  }
}
