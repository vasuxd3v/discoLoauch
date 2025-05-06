import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAdminDb } from "@/lib/firebase/firebase-admin";

// Endpoint to check user's authorization status directly from Firebase
export async function GET(request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({
        authenticated: false,
        authorized: false,
        userId: null,
        message: "User is not authenticated",
      });
    }

    // Check if Discord ID exists
    if (!session.user.discord?.id) {
      return NextResponse.json({
        authenticated: true,
        authorized: false,
        userId: null,
        message: "Discord ID not found in session",
      });
    }

    const userId = session.user.discord.id;
    const db = getAdminDb();

    // Get direct authorization status from Firebase
    const snapshot = await db.ref(`users/${userId}/authorized`).once("value");
    const isAuthorized = snapshot.val() === true;

    // Get current session authorization status
    const sessionAuthorized = session.user.authorized === true;

    return NextResponse.json({
      authenticated: true,
      authorized: isAuthorized,
      sessionAuthorized: sessionAuthorized,
      userId: userId,
      username: session.user.discord.username,
      mismatch: isAuthorized !== sessionAuthorized,
      firebaseValue: snapshot.val(),
      message: isAuthorized ? "User is authorized" : "User is not authorized",
    });
  } catch (error) {
    console.error("Error checking authorization:", error);
    return NextResponse.json(
      {
        error: "Failed to check authorization status",
        errorDetails: error.message,
      },
      { status: 500 }
    );
  }
}
