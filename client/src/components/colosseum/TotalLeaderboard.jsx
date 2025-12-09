import LeaderboardRow from "./LeaderboardRow";

export default function TotalLeaderboard({ data }) {
  return (
    <div className="max-w-5xl mx-auto mt-16 space-y-8">
      {data.map((user, i) => (
        <LeaderboardRow user={user} rank={i + 1} key={i} />
      ))}
    </div>
  );
}
