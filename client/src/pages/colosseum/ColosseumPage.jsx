import { useEffect, useState } from "react";
import TotalLeaderboard from "../../components/colosseum/TotalLeaderboard";
import RankChestPanel from "../../components/colosseum/RankChestPanel";

export default function ColosseumPage() {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/leaderboard/chest")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        return res.json();
      })
      .then((data) => {
        console.log("LEADERBOARD DATA:", data);
        setLeaderboard(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#111] text-white pt-32 pb-20 px-6">

      <h1 className="text-5xl font-display text-red-600 text-center mb-12">
        THE COLOSSEUM
      </h1>

      {/* Leaderboard */}
      <div className="max-w-5xl mx-auto mb-20">
        <TotalLeaderboard data={leaderboard} />
      </div>

      {/* Ranking Panel */}
      <div className="max-w-4xl mx-auto">
        <RankChestPanel />
      </div>

    </div>
  );
}
