import { helloRouter } from "../modules/hello/hello.router.ts";
import { userRouter } from "../modules/user/user.router.ts";
import { createCallerFactory, router } from "./init.ts";

export const appRouter = router({
  hello: helloRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
