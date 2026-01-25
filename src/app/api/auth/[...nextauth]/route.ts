import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";

export const authOptions = {
    adapter: MongoDBAdapter(clientPromise) as any,
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID || "",
            clientSecret: process.env.GITHUB_SECRET || "",
        }),
    ],
    callbacks: {
        async session({ session, user }: any) {
            // Pass the subscription data from the DB user to the session
            session.user.id = user.id;
            session.user.isSubscribed = user.isSubscribed || false;

            // Use the real name from GitHub (not username)
            // session.user.name contains the display name from GitHub
            session.user.displayName = user.name || session.user.name || user.email?.split('@')[0];
            session.user.username = user.email?.split('@')[0] || user.name;

            // Include user roles
            session.user.roles = user.roles || [];

            return session;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
