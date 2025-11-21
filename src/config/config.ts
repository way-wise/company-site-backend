import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  jwt: {
    jwt_secret: process.env.JWT_SECRET,
    expires_in: process.env.EXPIRES_IN,
    refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
    refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRES_IN,
    reset_password_token_secret: process.env.RESET_TOKEN_SECRET,
    reset_token_expires_in: process.env.RESET_TOKEN_EXPIRES_IN,
  },
  reset_pass_link: process.env.RESET_PASS_LINK,
  sender_email: process.env.SENDER_EMAIL,
  app_password: process.env.APP_PASSWORD,
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    email_from: process.env.EMAIL_FROM,
  },
  admin_email: process.env.ADMIN_EMAIL,
  login_url: process.env.LOGIN_URL || process.env.APP_URL,
  company_name: process.env.COMPANY_NAME || "Way Wise Tech",
  company_logo_url: process.env.COMPANY_LOGO_URL,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  blob_read_write_token: process.env.BLOB_READ_WRITE_TOKEN,
  blob_read_only_token: process.env.BLOB_READ_ONLY_TOKEN,
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY,
    publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
  },
};
