import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/firebase-admin";

// API endpoint to get user's Discord servers from Firebase
export async function GET(request) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession();

    if (!session || !session.user?.discord?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.discord.id;
    const db = getAdminDb();

    // Get user servers from Firebase
    const snapshot = await db.ref(`users/${userId}/servers`).once("value");
    const servers = snapshot.val();

    if (!servers) {
      return NextResponse.json({ servers: [] });
    }

    return NextResponse.json({ servers });
  } catch (error) {
    console.error("Error fetching user servers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
