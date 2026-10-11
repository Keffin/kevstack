import { apiHelloRequestSchema, apiHelloResponseSchema } from "@repo/contracts";
import { publicProcedure, router } from "../../trpc/init.ts";

export const helloRouter = router({
  greet: publicProcedure
    .input(apiHelloRequestSchema)
    .output(apiHelloResponseSchema)
    .query(({ input }) => ({ message: `Hello, ${input.name ?? "world"}!` })),
});
