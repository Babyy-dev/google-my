import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const gclid = searchParams.get("gclid");
  const lpurl = searchParams.get("lpurl");
  const ip_address = request.headers.get("x-forwarded-for");
  const user_agent = request.headers.get("user-agent");

  if (!lpurl) {
    return new Response("Landing page URL is missing.", { status: 400 });
  }

  // Log the click data to Supabase (don't wait for it to complete)
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

  // Immediately redirect the user to the final landing page
  return NextResponse.redirect(lpurl);
}
