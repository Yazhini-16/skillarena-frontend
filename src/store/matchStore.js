import { create } from 'zustand';

export const useMatchStore = create((set) => ({
  match: null,
  opponent: null,
  problem: null,
  timer: null,
  opponentStatus: 'waiting',
  myScore: null,
  result: null,

  setMatch: (matchData) => set({
    match: matchData,
    opponent: matchData.opponent,
    problem: matchData.problem,
    timer: matchData.timer,
    opponentStatus: 'connected',
    result: null,
  }),

  setOpponentStatus: (status) => set({ opponentStatus: status }),
  setMyScore: (score) => set({ myScore: score }),
  setResult: (result) => set({ result }),

  clearMatch: () => set({
    match: null, opponent: null, problem: null,
    timer: null, opponentStatus: 'waiting',
    myScore: null, result: null,
  }),
}));