import { NextRequest, NextResponse } from "next/server";
import { AccessToken, VideoGrant, TrackSource } from "livekit-server-sdk";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const room = url.searchParams.get("room");
  const identity = url.searchParams.get("identity") ?? crypto.randomUUID();
  const name = url.searchParams.get("name") ?? "Guest";
  
  if (!room) {
    return NextResponse.json({ error: "Missing room" }, { status: 400 });
  }

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity, name }
  );
  
  at.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    canPublishSources: [TrackSource.MICROPHONE, TrackSource.SCREEN_SHARE],
  } as VideoGrant);

  return NextResponse.json(
    { token: await at.toJwt() },
    { headers: { "Cache-Control": "no-store" } }
  );
}

