import { NextResponse } from "next/server"
import { CANONICAL_HOST } from "@/src/lib/constants.js"

export function proxy(request) {
  const host = request.headers.get("host") || ""

  if (process.env.NODE_ENV === "development" && host.includes("localhost")) {
    return NextResponse.next()
  }

  if (host !== CANONICAL_HOST && !host.startsWith(`${CANONICAL_HOST}:`)) {
    const url = request.nextUrl.clone()
    url.host = CANONICAL_HOST
    url.protocol = "https:"

    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
