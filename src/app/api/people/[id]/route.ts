import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    const person = await prisma.person.findUnique({ where: { id } });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    return NextResponse.json(person);
  } catch (error) {
    console.error("GET /api/people/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch person" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    const body = await request.json();
    const { name, avatarColor, relationship, likes, dislikes, allergies, dietary, notes } = body;

    const person = await prisma.person.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(avatarColor !== undefined && { avatarColor }),
        ...(relationship !== undefined && { relationship }),
        ...(likes !== undefined && { likes: JSON.stringify(Array.isArray(likes) ? likes : []) }),
        ...(dislikes !== undefined && { dislikes: JSON.stringify(Array.isArray(dislikes) ? dislikes : []) }),
        ...(allergies !== undefined && { allergies: JSON.stringify(Array.isArray(allergies) ? allergies : []) }),
        ...(dietary !== undefined && { dietary: JSON.stringify(Array.isArray(dietary) ? dietary : []) }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(person);
  } catch (error) {
    console.error("PUT /api/people/[id] error:", error);
    return NextResponse.json({ error: "Failed to update person" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    await prisma.person.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/people/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete person" }, { status: 500 });
  }
}
