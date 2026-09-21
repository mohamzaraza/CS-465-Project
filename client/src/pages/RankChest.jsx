import LiftRankForm from "../components/colosseum/LiftRankForm";
import liftConfigs from "../config/liftConfigs";

export default function RankChest() {
  return (
    <LiftRankForm
      muscle="chest"
      lifts={liftConfigs.chest}
      showResult
      errorClassName="text-red-400 mt-4 text-sm"
    />
  );
}
