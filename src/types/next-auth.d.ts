import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      isSubscribed?: boolean;
      displayName?: string | null;
      username?: string | null;
      roles?: string[];
    };
  }
}
