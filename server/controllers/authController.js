import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET;

export async function register(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { email, password: hashed },
  });

  res.status(201).json({ message: "User created" });
}


export async function login(req, res) {
  try {
    const { email, password } = req.body;

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
      { expiresIn: "7d" }
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
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

