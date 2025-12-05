import { z } from "zod";

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({
        message: "Email is required",
      })
      .email("Invalid email format"),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z
      .string({
        message: "Reset token is required",
      })
      .min(1, "Reset token is required"),
    newPassword: z
      .string({
        message: "New password is required",
      })
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string({
        message: "Current password is required",
      })
      .min(1, "Current password is required"),
    newPassword: z
      .string({
        message: "New password is required",
      })
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z
      .string({
        message: "Email is required",
      })
      .email("Invalid email format"),
    password: z
      .string({
        message: "Password is required",
      })
      .min(1, "Password is required"),
  }),
});

export const authValidationSchemas = {
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  loginSchema,
};
