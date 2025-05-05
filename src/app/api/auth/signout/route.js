import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase/firebase-admin";
import { getServerSession } from "next-auth";

export async function GET(request) {
  // Get the session directly without authOptions
  const session = await getServerSession();

  // Parse URL to check for callbackUrl
  const url = new URL(request.url);
  const callbackPath = url.searchParams.get("callbackUrl") || "/";

  // Create an absolute URL for the redirect
  // Extract origin from the request URL
  const origin = url.origin;
  const absoluteCallbackUrl = new URL(callbackPath, origin).toString();

  // For NextAuth compatibility, check if the request wants a JSON response
  const json = url.searchParams.get("json");

  // Create a response object
  let response;

  if (json === "true") {
    // Create JSON response
    response = NextResponse.json({ url: callbackPath });
  } else {
    // Create redirect response with absolute URL
    response = NextResponse.redirect(absoluteCallbackUrl);
  }

  // Clear all next-auth cookies
  // This method doesn't use cookies().getAll() which is causing issues
  response.cookies.set("next-auth.session-token", "", {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  response.cookies.set("next-auth.callback-url", "", {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  response.cookies.set("next-auth.csrf-token", "", {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  // Add any other next-auth cookies you might be using

  return response;
}

// Handle POST requests as well for compatibility
export async function POST(request) {
  return GET(request);
}
