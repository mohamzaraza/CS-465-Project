import LiftRankForm from "./LiftRankForm";
import liftConfigs from "../../config/liftConfigs";

// The Colosseum panel updates the "Current Chest Rank" box only; the separate
// "New Tier" block is specific to the standalone /rank/chest page.
export default function RankChestPanel() {
  return <LiftRankForm muscle="chest" lifts={liftConfigs.chest} />;
}
