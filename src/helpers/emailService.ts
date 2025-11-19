import nodemailer from "nodemailer";
import config from "../config/config";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

const createTransporter = () => {
  if (!config.smtp.user || !config.smtp.pass) {
    throw new Error("SMTP credentials are not configured");
  }

  // Log configuration (without password) for debugging
  console.log("SMTP Configuration:", {
    host: config.smtp.host,
    port: config.smtp.port,
    user: config.smtp.user,
    secure: config.smtp.port === 465,
    requireTLS: config.smtp.port === 587,
  });

  const transporterConfig = {
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465, // true for 465, false for other ports
    requireTLS: config.smtp.port === 587, // For Gmail on port 587, require TLS
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  };

  return nodemailer.createTransport(transporterConfig);
};

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: options.from || config.email_from,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    
    // Provide more detailed error information
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      // Check for common SMTP errors
      if (
        errorMessage.includes("invalid login") ||
        errorMessage.includes("authentication failed") ||
        errorMessage.includes("535-5.7.8") ||
        errorMessage.includes("username and password not accepted")
      ) {
        throw new Error(
          "SMTP authentication failed. Please check your SMTP credentials. " +
          "For Gmail: Make sure you're using an App Password (not your regular password). " +
          "Generate one at: https://myaccount.google.com/apppasswords"
        );
      } else if (errorMessage.includes("econnrefused") || errorMessage.includes("etimedout")) {
        throw new Error(`SMTP connection failed. Unable to connect to ${config.smtp.host}:${config.smtp.port}`);
      } else if (errorMessage.includes("enotfound")) {
        throw new Error(`SMTP host not found: ${config.smtp.host}`);
      } else if (errorMessage.includes("econnreset")) {
        throw new Error("SMTP connection was reset. This might be due to firewall or network issues.");
      } else {
        throw new Error(`Failed to send email: ${error.message}`);
      }
    }
    
    throw new Error("Failed to send email: Unknown error occurred");
  }
};

export default sendEmail;

