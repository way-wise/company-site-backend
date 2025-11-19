import fs from "fs";
import path from "path";
import config from "../../../config/config";
import { sendEmail } from "../../../helpers/emailService";
import { IContactFormData } from "./contact.interface";

const getServiceLabel = (value: string): string => {
  const serviceMap: Record<string, string> = {
    "web-development": "Web Development",
    "mobile-app": "Mobile App Development",
    "ui-ux-design": "UI/UX Design",
    consulting: "AI/ML",
    "digital-marketing": "Digital Marketing",
    "graphics-design": "Graphics Design",
    iot: "Internet of Things",
    "cloud-engineering": "Cloud Engineering",
    other: "Other",
  };
  return serviceMap[value] || value;
};

const getBudgetLabel = (value: string): string => {
  const budgetMap: Record<string, string> = {
    "under-1k": "Under $1,000",
    "1k-5k": "$1,000 - $5,000",
    "5k-10k": "$5,000 - $10,000",
    "10k-25k": "$10,000 - $25,000",
    "25k-plus": "$25,000+",
  };
  return budgetMap[value] || value;
};

const loadEmailTemplate = (templateName: string): string => {
  // Try multiple possible paths for development and production
  const possiblePaths = [
    path.join(process.cwd(), "src", "templates", `${templateName}.html`),
    path.join(process.cwd(), "dist", "templates", `${templateName}.html`),
    path.join(__dirname, "..", "..", "..", "templates", `${templateName}.html`),
  ];

  for (const templatePath of possiblePaths) {
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, "utf-8");
    }
  }

  throw new Error(
    `Email template not found: ${templateName}.html. Tried paths: ${possiblePaths.join(", ")}`
  );
};

const replaceTemplateVariables = (
  template: string,
  variables: Record<string, string>
): string => {
  let result = template;
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, variables[key]);
  });
  return result;
};

const submitContactForm = async (data: IContactFormData): Promise<void> => {
  try {
    const serviceLabel = getServiceLabel(data.serviceRequired);
    const budgetLabel = getBudgetLabel(data.projectBudget);

    // Load email templates
    let userTemplate: string;
    let adminTemplate: string;

    try {
      userTemplate = loadEmailTemplate("contact-confirmation");
      adminTemplate = loadEmailTemplate("contact-notification");
    } catch (templateError) {
      console.error("Error loading email templates:", templateError);
      throw new Error(
        `Failed to load email templates: ${templateError instanceof Error ? templateError.message : "Unknown error"}`
      );
    }

    // Prepare user confirmation email
    const userEmailHtml = replaceTemplateVariables(userTemplate, {
      fullName: data.fullName,
      serviceRequired: serviceLabel,
      projectBudget: budgetLabel,
      projectDescription: data.projectDescription,
    });

    // Prepare admin notification email
    const adminEmailHtml = replaceTemplateVariables(adminTemplate, {
      fullName: data.fullName,
      email: data.email,
      whatsappNumber: data.whatsappNumber,
      serviceRequired: serviceLabel,
      projectBudget: budgetLabel,
      projectDescription: data.projectDescription,
      submittedAt: new Date().toLocaleString("en-US", {
        dateStyle: "long",
        timeStyle: "short",
      }),
    });

    // Send emails in parallel
    try {
      await Promise.all([
        sendEmail({
          to: data.email,
          subject: "Thank You for Contacting Way-Wise Tech",
          html: userEmailHtml,
        }),
        sendEmail({
          to: config.admin_email,
          subject: `New Contact Form Submission from ${data.fullName}`,
          html: adminEmailHtml,
        }),
      ]);
    } catch (emailError) {
      console.error("Error sending emails:", emailError);
      throw new Error(
        `Failed to send email: ${emailError instanceof Error ? emailError.message : "Unknown error"}`
      );
    }
  } catch (error) {
    console.error("Error in submitContactForm:", error);
    throw error;
  }
};

export const ContactService = {
  submitContactForm,
};

