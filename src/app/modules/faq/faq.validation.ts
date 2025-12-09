import { z } from "zod";

const createFaqZodSchema = z.object({
	body: z.object({
		question: z.string({
			message: "Question is required",
		}),
		answer: z.string({
			message: "Answer is required",
		}),
		category: z.string().optional(),
		order: z.number().optional(),
		isShow: z.boolean().optional(),
	}),
});

const updateFaqZodSchema = z.object({
	body: z.object({
		question: z.string().optional(),
		answer: z.string().optional(),
		category: z.string().optional(),
		order: z.number().optional(),
		isShow: z.boolean().optional(),
	}),
});

export const FaqValidation = {
	createFaqZodSchema,
	updateFaqZodSchema,
};
