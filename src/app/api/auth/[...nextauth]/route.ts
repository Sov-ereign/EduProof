import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID || "",
            clientSecret: process.env.GITHUB_SECRET || "",
        }),
    ],
    callbacks: {
        async session({ session, token, user }: any) {
            // Pass the username to the client
            session.user.username = token.username;
            return session;
        },
        async jwt({ token, account, profile }: any) {
            // Persist the GitHub username to the token
            if (profile) {
                token.username = profile.login;
            }
            return token;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
