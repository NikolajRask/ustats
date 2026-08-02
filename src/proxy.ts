import { NextResponse, type NextRequest } from "next/server";

import {
  canServeMarketingPages,
  canServeProductPages,
  isMarketingPath,
  isProductPath,
} from "@/lib/app-mode";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!canServeMarketingPages() && isMarketingPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/mode-gate";
    return NextResponse.rewrite(url);
  }

  if (!canServeProductPages() && isProductPath(pathname)) {
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
