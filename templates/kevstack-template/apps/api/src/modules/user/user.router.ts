import { apiChangeUsernameRequestSchema, apiUserResponseSchema } from "@repo/contracts";
import { protectedProcedure, router } from "../../trpc/init.ts";
import { UserMapper } from "./user.mapper.ts";

export const userRouter = router({
  me: protectedProcedure.output(apiUserResponseSchema).query(async ({ ctx }) => {
    const user = await ctx.useCases.getCurrentUser.execute(ctx.session.user.id);
    return UserMapper.toResponse(user);
  }),

  changeUsername: protectedProcedure
    .input(apiChangeUsernameRequestSchema)
    .output(apiUserResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.useCases.changeUsername.execute(ctx.session.user.id, input.username);
      return UserMapper.toResponse(user);
    }),
});
