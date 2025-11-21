import nodemailer from 'nodemailer';
import config from '../../../config/config';

interface EmailSenderOptions {
  subject?: string;
  senderName?: string;
}

const emailSender = async (
  receiverEmail: string,
  html: string,
  options?: EmailSenderOptions
) => {
   // Use SMTP config if available, otherwise fall back to legacy config
   const smtpHost = config.smtp?.host || 'smtp.gmail.com';
   const smtpPort = config.smtp?.port || 587;
   const smtpUser = config.smtp?.user || config.sender_email;
   const smtpPass = config.smtp?.pass || config.app_password;
   const emailFrom = config.smtp?.email_from;

   const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // Use `true` for port 465, `false` for all other ports
      auth: {
         user: smtpUser,
         pass: smtpPass,
      },
   });

   // Use EMAIL_FROM if available, otherwise construct from senderName and email
   let fromAddress: string;
   if (emailFrom) {
      fromAddress = emailFrom;
   } else {
      const senderName = options?.senderName || config.company_name || 'Company';
      const senderEmail = smtpUser;
      fromAddress = `"${senderName}" <${senderEmail}>`;
   }

   const subject = options?.subject || 'Reset Password Link';

   // send mail with defined transport object
   const info = await transporter.sendMail({
      from: fromAddress, // sender address
      to: receiverEmail, // list of receivers
      subject, // Subject line
      //   text: 'Hello world?', // plain text body
      html, // html body
   });

   console.log('Message sent: %s', info.messageId);
};

export default emailSender;
