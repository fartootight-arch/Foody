import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const people = await prisma.person.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(people);
  } catch (error) {
    console.error("GET /api/people error:", error);
    return NextResponse.json({ error: "Failed to fetch people" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, avatarColor, relationship, likes, dislikes, allergies, dietary, notes } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const person = await prisma.person.create({
      data: {
        name,
        avatarColor: avatarColor ?? "#3B82F6",
        relationship: relationship ?? "family",
        likes: JSON.stringify(Array.isArray(likes) ? likes : []),
        dislikes: JSON.stringify(Array.isArray(dislikes) ? dislikes : []),
        allergies: JSON.stringify(Array.isArray(allergies) ? allergies : []),
        dietary: JSON.stringify(Array.isArray(dietary) ? dietary : []),
        notes: notes ?? null,
      },
    });

    return NextResponse.json(person, { status: 201 });
  } catch (error) {
    console.error("POST /api/people error:", error);
    return NextResponse.json({ error: "Failed to create person" }, { status: 500 });
  }
}
