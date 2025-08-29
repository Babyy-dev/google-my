// app/api/track-click/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const gclid = searchParams.get("gclid");
  const lpurl = searchParams.get("lpurl");

  // FIX: Get the IP address reliably from headers.
  const ip_address =
    request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");

  const user_agent = request.headers.get("user-agent");

  if (!lpurl) {
    return new Response("Landing page URL (lpurl) is missing.", {
      status: 400,
    });
  }

  supabase
    .from("ad_clicks")
    .insert({
      gclid,
      ip_address,
      user_agent,
      landing_page_url: lpurl,
    })
    .then(({ error }) => {
      if (error) {
        console.error("Error logging click:", error);
      }
    });

  return NextResponse.redirect(lpurl);
}
