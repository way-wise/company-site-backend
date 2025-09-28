import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import { UploadedFile } from "../app/interfaces/file";
import s3Client from "../config/awsConfig";
import config from "../config/config";

const uploadImageS3 = async (file: UploadedFile): Promise<string> => {
  try {
    // Validate file
    if (!file || !file.path) {
      throw new Error("Invalid file provided");
    }

    const fileBuffer = fs.readFileSync(file.path);

    // Upload file to S3
    const params = {
      Bucket: config.aws_bucket_name,
      Key: file.filename,
      Body: fileBuffer,
      ContentType: file.mimetype,
    };

    await s3Client.send(new PutObjectCommand(params));
    const uploadUrl = `https://${config.aws_bucket_name}.s3.${config.aws_region}.amazonaws.com/${file.filename}`;

    // Clean up local file
    fs.unlinkSync(file.path);

    return uploadUrl;
  } catch (err) {
    console.error("S3 upload error:", err);
    // Clean up local file on error
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw new Error(`Failed to upload file to S3: ${err}`);
  }
};

export default uploadImageS3;
