import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tag } = body;

    if (!tag) {
      return NextResponse.json({ error: "Tag is required" }, { status: 400 });
    }

    revalidateTag(tag, "default");

    return NextResponse.json({
      success: true,
      message: `Cache tag '${tag}' revalidated`
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json({ error: "Failed to revalidate cache" }, { status: 500 });
  }
}
