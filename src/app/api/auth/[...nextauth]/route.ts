import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";

interface SessionUserData {
    id: string;
    isSubscribed?: boolean;
    name?: string | null;
    email?: string | null;
    roles?: string[];
}

export const authOptions: NextAuthOptions = {
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID || "",
            clientSecret: process.env.GITHUB_SECRET || "",
        }),
    ],
    callbacks: {
        async session({ session, user }) {
            if (!session.user) {
                return session;
            }

            const appUser = user as SessionUserData;

            // Pass the subscription data from the DB user to the session
            session.user.id = appUser.id;
            session.user.isSubscribed = appUser.isSubscribed || false;

            // Use the real name from GitHub (not username)
            // session.user.name contains the display name from GitHub
            session.user.displayName = appUser.name || session.user.name || appUser.email?.split("@")[0];
            session.user.username = appUser.email?.split("@")[0] || appUser.name || null;

            // Include user roles
            session.user.roles = appUser.roles || [];

            return session;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
