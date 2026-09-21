// Keys must match what the server's ranking controller reads from req.body.lifts,
// so a new muscle only needs an entry here plus its server-side ranking.
const liftConfigs = {
  chest: [
    { key: "bench", label: "Bench Press" },
    { key: "incline_db", label: "Incline DB Press" },
    { key: "cable", label: "Cable Fly" },
  ],
};

export default liftConfigs;
