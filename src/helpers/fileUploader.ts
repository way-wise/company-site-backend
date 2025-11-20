import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import { UploadedFile } from "../app/interfaces/file";
import config from "../config/config";

const uploadDirectory = path.join(process.cwd(), "/uploads");
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req: any, _file: any, cb: any) {
    cb(null, uploadDirectory);
  },
  filename: function (req: any, file: any, cb: any) {
    // Remove spaces, add a hyphen, and append a timestamp
    const sanitizedFilename = file.originalname.replace(/\s+/g, "-");
    const timestamp = Date.now();
    const filename = `${sanitizedFilename}-${timestamp}${path.extname(
      file.originalname
    )}`;
    cb(null, filename);
  },
});

const allowedMimeTypes = new Set([
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  // PDF
  "application/pdf",
  // Microsoft Office Documents
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-powerpoint", // .ppt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  // OpenDocument Formats
  "application/vnd.oasis.opendocument.text", // .odt
  "application/vnd.oasis.opendocument.spreadsheet", // .ods
  "application/vnd.oasis.opendocument.presentation", // .odp
  // Text files
  "text/plain",
  "text/csv",
  // Archives
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  // Other common formats
  "application/json",
  "application/xml",
  "text/xml",
]);

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error("Unsupported file type"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB - increased for larger documents
  },
});

cloudinary.config({
  cloud_name: "mizan-ph",
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

const saveToCloudinary = (
  file: UploadedFile
): Promise<UploadApiResponse | undefined> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      file.path,
      { public_id: file.originalname },
      (error: any, result: any) => {
        fs.unlinkSync(file.path);
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
};

export const fileUploader = {
  upload,
  saveToCloudinary,
};
