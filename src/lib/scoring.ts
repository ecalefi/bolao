type ScoreInput = {
  predictedHome: number;
  predictedAway: number;
  actualHome: number;
  actualAway: number;
  brazilIsHome: boolean;
  exactScore?: number;
  result?: number;
  brazilGoals?: number;
  opponentGoals?: number;
};

const matchResult = (home: number, away: number) => {
  if (home === away) return "draw";
  return home > away ? "home" : "away";
};

export const calculateBetPoints = ({
  predictedHome,
  predictedAway,
  actualHome,
  actualAway,
  brazilIsHome,
  exactScore = 10,
  result = 5,
  brazilGoals = 2,
  opponentGoals = 2,
}: ScoreInput) => {
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return exactScore;
  }

  let points = 0;

  if (matchResult(predictedHome, predictedAway) === matchResult(actualHome, actualAway)) {
    points += result;
  }

  const predictedBrazilGoals = brazilIsHome ? predictedHome : predictedAway;
  const actualBrazilGoals = brazilIsHome ? actualHome : actualAway;
  const predictedOpponentGoals = brazilIsHome ? predictedAway : predictedHome;
  const actualOpponentGoals = brazilIsHome ? actualAway : actualHome;

  if (predictedBrazilGoals === actualBrazilGoals) points += brazilGoals;
  if (predictedOpponentGoals === actualOpponentGoals) points += opponentGoals;

  return points;
};
