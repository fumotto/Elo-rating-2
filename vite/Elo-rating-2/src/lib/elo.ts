export interface EloRates {
  winner1: number;
  winner2: number;
  winner3: number;
  loser1: number;
  loser2: number;
  loser3: number;
}

export interface EloDelta {
  plus: number;
  minus: number;
}

export function calcEloDelta(
  winnerRates: [number, number, number],
  loserRates: [number, number, number],
  kFactor: number,
): EloDelta {
  const winnerAvg = (winnerRates[0] + winnerRates[1] + winnerRates[2]) / 3;
  const loserAvg = (loserRates[0] + loserRates[1] + loserRates[2]) / 3;
  const expectedWinner = 1 / (1 + 10 ** ((loserAvg - winnerAvg) / 400));
  const expectedLoser = 1 - expectedWinner;

  return {
    plus: Math.round(kFactor * (1 - expectedWinner)),
    minus: Math.round(kFactor * (0 - expectedLoser)),
  };
}

export function applyEloDelta(
  winnerRates: [number, number, number],
  loserRates: [number, number, number],
  delta: EloDelta,
): EloRates {
  return {
    winner1: winnerRates[0] + delta.plus,
    winner2: winnerRates[1] + delta.plus,
    winner3: winnerRates[2] + delta.plus,
    loser1: loserRates[0] + delta.minus,
    loser2: loserRates[1] + delta.minus,
    loser3: loserRates[2] + delta.minus,
  };
}

export function calcElo(
  winner1: number,
  winner2: number,
  winner3: number,
  loser1: number,
  loser2: number,
  loser3: number,
  kFactor: number,
): EloRates {
  const delta = calcEloDelta([winner1, winner2, winner3], [loser1, loser2, loser3], kFactor);
  return applyEloDelta([winner1, winner2, winner3], [loser1, loser2, loser3], delta);
}
