import { NextResponse, type NextRequest } from "next/server";

import { isMarketingMode, isMarketingPath } from "@/lib/app-mode";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isMarketingMode() && isMarketingPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/mode-gate";
    return NextResponse.rewrite(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/collect|api/errors/collect|script\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
