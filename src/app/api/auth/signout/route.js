import { NextResponse } from "next/server";

export async function GET(request) {
  // Parse URL to check for callbackUrl
  const url = new URL(request.url);
  const callbackPath = url.searchParams.get("callbackUrl") || "/";

  // Create an absolute URL for the redirect
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

  // Clear NextAuth cookies
  const isProduction = process.env.NODE_ENV === "production";

  const cookiesToClear = [
    "next-auth.session-token",
    "next-auth.callback-url",
    "next-auth.csrf-token",
  ];

  cookiesToClear.forEach((cookieName) => {
    response.cookies.set(cookieName, "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
    });
  });

  return response;
}

// Handle POST requests as well for compatibility
export async function POST(request) {
  return GET(request);
}
