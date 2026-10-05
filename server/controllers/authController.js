import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { BCRYPT_ROUNDS, JWT_EXPIRES_IN } from "../config/constants.js";
import { validateLogin, validateRegistration } from "../utils/validateInputs.js";

export async function register(req, res) {
  const problem = validateRegistration(req.body);
  if (problem) {
    return res.status(400).json({ error: problem });
  }

  // Stored lowercase so "A@x.com" and "a@x.com" are one account; the database
  // also enforces this with a CHECK constraint, which would turn a mixed-case
  // address into a 500 if it ever got this far.
  const email = req.body.email.toLowerCase();
  const { password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    await prisma.user.create({
      data: { email, password: hashed },
    });
  } catch (err) {
    // Two sign-ups for the same email can both pass the check above; the
    // database's unique constraint (Prisma code P2002) then rejects the second,
    // which is the same "email taken" case, not a server fault.
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Email already in use" });
    }
    throw err;
  }

  res.status(201).json({ message: "User created" });
}


export async function login(req, res) {
  try {
    const problem = validateLogin(req.body);
    if (problem) {
      return res.status(400).json({ error: problem });
    }

    // Matched the way it was stored at registration, so the address can be
    // typed in any case.
    const email = req.body.email.toLowerCase();
    const { password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }


    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      user: { id: user.id, email: user.email },
      token,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Login failed" });
  }
}


export async function getMe(req, res) {
  try {
    // req.user comes from auth middleware
    res.json({
      id: req.user.id,
      email: req.user.email,
      createdAt: req.user.createdAt,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

