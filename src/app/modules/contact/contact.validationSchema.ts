import { z } from "zod";

const createContactSchema = z.object({
	body: z.object({
		fullName: z.string({
			message: "Full Name is required",
		}),
		email: z
			.string({
				message: "Email is required",
			})
			.email("Invalid email address"),
		whatsappNumber: z.string({
			message: "WhatsApp Number is required",
		}),
		serviceRequired: z.string({
			message: "Service Required is required",
		}),
		projectBudget: z.string({
			message: "Project Budget is required",
		}),
		projectDescription: z.string({
			message: "Project Description is required",
		}),
	}),
});

export const ContactValidation = {
	createContactSchema,
};
