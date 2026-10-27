import { NextResponse } from "next/server";

import { expireStaleBookings } from "@/server/actions/bookings";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expired = await expireStaleBookings();
  return NextResponse.json({ ok: true, expired });
}
