import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const adminPrefix = "/admin";

export const config = {
  matcher: ["/admin/:path*"],
};

export const middleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (pathname.startsWith(adminPrefix)) {
    if (!token || token.role !== "ADMIN") {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
};

