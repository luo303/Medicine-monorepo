import { NextRequest, NextResponse } from "next/server";

const WHITE_LIST = ["/login", "/register"];

function isWhiteListed(pathname: string): boolean {
  return WHITE_LIST.some(path => pathname.startsWith(path));
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(pathname);
  // 白名单页面直接放行
  if (isWhiteListed(pathname)) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get("token");
  console.log(cookie);
  if (!cookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (cookie && cookie.value) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/home", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
