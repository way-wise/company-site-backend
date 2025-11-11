import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { UploadedFile } from "../app/interfaces/file";
import config from "../config/config";

export interface BlobUploadOptions {
  prefix?: string;
  access?: "public";
}

export interface BlobUploadResult {
  url: string;
  pathname: string;
  size: number;
  contentType: string;
}

const sanitizeFilename = (originalName: string) => {
  const basename = path.basename(originalName);
  return basename.replace(/\s+/g, "-").toLowerCase();
};

const buildBlobName = (file: UploadedFile, prefix?: string) => {
  const sanitized = sanitizeFilename(file.originalname);
  const extension = path.extname(sanitized);
  const base = path.basename(sanitized, extension);
  const uniqueSuffix = `${Date.now()}-${randomUUID()}`;
  const finalName = `${base}-${uniqueSuffix}${extension || ""}`;

  if (!prefix) {
    return finalName;
  }

  return `${prefix.replace(/^\/+|\/+$/g, "")}/${finalName}`;
};

export const uploadFileToBlob = async (
  file: UploadedFile,
  options: BlobUploadOptions = {}
): Promise<BlobUploadResult> => {
  if (!file || !file.path) {
    throw new Error("Invalid file provided");
  }

  const token = config.blob_read_write_token;

  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }

  const blobName = buildBlobName(file, options.prefix);

  try {
    const fileStream = fs.createReadStream(file.path);

    const result = await put(blobName, fileStream, {
      access: options.access ?? "public",
      token,
      contentType: file.mimetype,
    });

    return {
      url: result.url,
      pathname: result.pathname,
      size: file.size,
      contentType: file.mimetype,
    };
  } catch (error) {
    throw new Error("Failed to upload file to Vercel Blob");
  } finally {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
};

