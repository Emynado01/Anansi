import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";

import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const signupSchema = z.object({
  name: z.string().min(2, "Nom trop court"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe trop court"),
  signupSecret: z.string().optional(),
});

export const POST = async (request: Request) => {
  try {
    const json = await request.json();
    const parsed = signupSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Paramètres invalides";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { name, email, password, signupSecret } = parsed.data;
    if (process.env.SIGNUP_SECRET && signupSecret !== process.env.SIGNUP_SECRET) {
      return NextResponse.json({ error: "Code administrateur invalide." }, { status: 403 });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingUser) {
      return NextResponse.json({ error: "Un utilisateur existe déjà avec cet email." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur interne lors de l'inscription." }, { status: 500 });
  }
};
