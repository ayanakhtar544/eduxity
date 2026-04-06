// File: app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Wahi path jaha humne singleton banaya tha

// GET Request: Saare users fetch karne ke liye
export async function GET(request: NextRequest) {
  try {
    // Database se data fetch kar rahe hain
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }, // Naye users pehle aayenge
    });

    // Success response return karo
    return NextResponse.json({ success: true, data: users }, { status: 200 });
    
  } catch (error) {
    console.error("GET Users Error:", error);
    // Client ko secure error message bhejo (pura error object kabhi expose mat karna)
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" }, 
      { status: 500 }
    );
  }
}

// POST Request: Naya user banane ke liye
export async function POST(request: NextRequest) {
  try {
    // Request body ko parse karna (Next.js App Router me tarika)
    const body = await request.json();
    const { email, name } = body;

    // Basic Validation
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" }, 
        { status: 400 }
      );
    }

    // Prisma se naya record create karna
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
      },
    });

    // 201 status code (Created) ke sath response bhejna
    return NextResponse.json({ success: true, data: newUser }, { status: 201 });

  } catch (error: any) {
    console.error("POST User Error:", error);

    // Prisma ka unique constraint error handle karna (e.g., agar email pehle se exist karti ho)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: "Email already exists" },
        { status: 409 } // 409 Conflict
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}