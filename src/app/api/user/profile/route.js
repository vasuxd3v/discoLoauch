import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/firebase-admin";

// API endpoint to get user profile data from Firebase
export async function GET(request) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession();

    if (!session || !session.user?.discord?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.discord.id;
    const db = getAdminDb();

    // Get user data from Firebase
    const snapshot = await db.ref(`users/${userId}`).once("value");
    const userData = snapshot.val();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
