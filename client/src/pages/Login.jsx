import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { setUser } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    try {
      const data = await apiRequest("/auth/login", "POST", {
        email,
        password,
      });

      localStorage.setItem("token", data.token);
      setUser(data.user);

      setTimeout(() => {
      navigate("/colosseum");
    }, 0);

    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0b0b] text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-black/40 border border-red-700/40 p-10 rounded-xl w-[400px]"
      >
        <h1 className="text-3xl font-display text-red-500 mb-6">
          Enter LiftLogic
        </h1>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 bg-black border border-gray-700 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 bg-black border border-gray-700 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full py-3 bg-red-600 text-black font-display rounded hover:scale-105 transition">
          Login
        </button>

        <p className="mt-4 text-sm text-gray-400">
          Don’t have an account?{" "}
          <Link to="/register" className="text-red-500 underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
