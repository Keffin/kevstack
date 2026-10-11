import { z } from "zod";

export const apiHelloRequestSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
});
export type ApiHelloRequest = z.infer<typeof apiHelloRequestSchema>;

export const apiHelloResponseSchema = z.object({
  message: z.string(),
});
export type ApiHelloResponse = z.infer<typeof apiHelloResponseSchema>;
