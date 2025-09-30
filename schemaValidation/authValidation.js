import { z } from "zod";

export const loginSchemaValidation = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])/,
      "Password must include uppercase, lowercase, number, and special character"
    ),
});

export const registerSchemaValidation = loginSchemaValidation.extend({
  first_name: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters")
    .regex(/^[A-Za-z\s'-]+$/, "First name can only contain letters, spaces, hyphens, or apostrophes"),
  last_name: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters")
    .regex(/^[A-Za-z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, or apostrophes"),
  company_name: z
    .string()
    .min(5, "Company name must be at least 5 characters")
    .max(255, "Company name cannot exceed 255 characters"),
  country_code: z
    .string()
    .regex(/^\+[1-9]\d{0,3}$/, "Invalid country code format"),
  phone_number: z
    .string()
    .regex(/^[0-9]{6,14}$/, "Invalid phone number format")
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});
