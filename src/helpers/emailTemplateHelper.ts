import fs from "fs";
import path from "path";

/**
 * Generates a welcome email HTML content by reading the template and replacing placeholders
 * @param userName - The name of the user
 * @param email - The email address of the user
 * @param password - The plain text password
 * @param role - The user role (CLIENT, ADMIN, EMPLOYEE, etc.)
 * @param loginUrl - The URL to the login page
 * @param companyName - The name of the company
 * @param companyLogoUrl - The URL to the company logo (optional)
 * @returns Promise<string> - The HTML content with replaced placeholders
 */
export const generateWelcomeEmail = async (
  userName: string,
  email: string,
  password: string,
  role: string,
  loginUrl: string,
  companyName: string,
  companyLogoUrl?: string
): Promise<string> => {
  try {
    // Get the path to the template file
    const templatePath = path.join(
      process.cwd(),
      "src",
      "templates",
      "welcome_email_template.html"
    );

    // Read the template file
    let template = fs.readFileSync(templatePath, "utf-8");

    // Handle conditional logo display
    const logoSection = companyLogoUrl
      ? `<div class="logo-container">
               <img src="${companyLogoUrl}" alt="${companyName} Logo" class="logo" />
            </div>`
      : "";

    // Replace placeholders with actual values
    const html = template
      .replace(/\{\{LOGO_SECTION\}\}/g, logoSection)
      .replace(/\{\{userName\}\}/g, userName)
      .replace(/\{\{email\}\}/g, email)
      .replace(/\{\{password\}\}/g, password)
      .replace(/\{\{role\}\}/g, role)
      .replace(/\{\{loginUrl\}\}/g, loginUrl)
      .replace(/\{\{companyName\}\}/g, companyName);

    return html;
  } catch (error) {
    console.error("Error generating welcome email template:", error);
    throw new Error("Failed to generate welcome email template");
  }
};

