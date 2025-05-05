import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { getAdminDb } from "@/lib/firebase/firebase-admin";

// Configure only the specific scopes we need
const scopes = ["identify", "guilds"]; // 'identify' for user profile, 'guilds' for servers

const handler = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: { params: { scope: scopes.join(" ") } },
    }),
  ],
  // Update JWT configuration for better compatibility
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    // Using JWT for session handling
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist only the data we need
      if (account) {
        token.accessToken = account.access_token;
        token.tokenType = account.token_type;

        // Only store the user information we need
        if (profile) {
          token.discord = {
            id: profile.id,
            username: profile.username,
            avatar: profile.avatar,
            // Store banner if available
            banner: profile.banner || null,
          };
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Send only the properties we need to the client
      session.accessToken = token.accessToken;
      session.user = session.user || {};
      session.user.discord = token.discord || {};

      // Fetch user's guilds (servers) when session is created
      if (token.accessToken) {
        try {
          const guildResponse = await fetch(
            "https://discord.com/api/users/@me/guilds",
            {
              headers: {
                Authorization: `${token.tokenType} ${token.accessToken}`,
              },
            }
          );

          if (guildResponse.ok) {
            const guilds = await guildResponse.json();
            // Just store basic server information
            const simplifiedGuilds = guilds.map((guild) => ({
              id: guild.id,
              name: guild.name,
              icon: guild.icon,
            }));

            session.user.guilds = simplifiedGuilds;

            // Save user data to Firebase
            if (session.user.discord?.id) {
              const db = getAdminDb();
              const userData = {
                id: session.user.discord.id,
                username: session.user.discord.username,
                avatar: session.user.discord.avatar,
                banner: session.user.discord.banner,
                lastLogin: new Date().toISOString(),
              };

              // Save user profile data
              await db.ref(`users/${session.user.discord.id}`).update(userData);

              // Save user's servers data
              await db
                .ref(`users/${session.user.discord.id}/servers`)
                .set(simplifiedGuilds);
            }
          }
        } catch (error) {
          console.error(
            "Error fetching Discord guilds or saving to Firebase:",
            error
          );
        }
      }

      return session;
    },
    async signIn({ user }) {
      // You can add additional validation here if needed
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  // Only enable debug mode in development and when explicitly requested
  debug:
    process.env.NODE_ENV === "development" &&
    process.env.NEXTAUTH_DEBUG === "true",
});

export { handler as GET, handler as POST };
