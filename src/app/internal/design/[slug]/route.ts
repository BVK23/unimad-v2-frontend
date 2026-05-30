import { canAccessInternalDesignDocs, getInternalDesignDocHtml } from "@/lib/internal-design-docs";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const allowed = await canAccessInternalDesignDocs(request);
  if (!allowed) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { slug } = await context.params;
  const html = getInternalDesignDocHtml(slug);
  if (!html) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
