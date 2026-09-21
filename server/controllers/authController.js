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

  const { email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.user.create({
    data: { email, password: hashed },
  });

  res.status(201).json({ message: "User created" });
}


export async function login(req, res) {
  try {
    const problem = validateLogin(req.body);
    if (problem) {
      return res.status(400).json({ error: problem });
    }

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
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

