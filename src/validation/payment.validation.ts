import { z } from "zod";

export const verifyPaymentSchema = z.object({
  paymentId: z.string().trim().min(1, "paymentId is required"),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
