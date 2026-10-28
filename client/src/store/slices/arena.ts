import type { Room } from "#types/entities";
import type { ClientMessage } from "#types/messages";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";


export type GameState = {
  status: "room:out" | "room:in" | "idle"; // socket connection status
  gameState?:  "WAITING" | "COUNTDOWN" | "PLAYING" | "ROUND_OVER" | "FINISHED" | "PAUSED" | "error";
  room?: Room; // users active room
  playersStats: {name: string,scramble?: string, cumlativeScore: number}[]// participants active stats 
  activeUserStats?: { score?: number, rank?: string, accuracy?:string, words?: string , scrambles?: string[]};
  scramble: string; // scramble all players are to answer
  round?: { roundNo?: number, winner?: string, totalRound?:number, scramble?:string};
  timer?: number;// how much time transpired
  scores?: Record<string, number>;
  wordCounts?: Record<string, number>;
  // current words submitted by user and it's associated score 
  liveFeed: { id: number, user: string, word: string, score: number }[];
  message?: string;
}

const initGameState: GameState = {
  status: "idle",
  playersStats: [],
  scramble: '',
  liveFeed: [],
  round: {roundNo:0, winner:"", totalRound:5}
}

export const gameSlice = createSlice({
  // state
  name: 'arena',
  initialState: initGameState,
  reducers: {
    // set available players 
    addPlayer: (state, action: PayloadAction<{ name: string, scramble?: string, cumlativeScore: number }>) => {
        if (!state.playersStats.some((player) => player.name === action.payload.name)) {
          state.playersStats.push({ ...action.payload, scramble:'', cumlativeScore:0})
        }
    },
  
    addLiveFeed: (state, action: PayloadAction<{ user: string, word: string, score: number }>) => {
      state.liveFeed = [
        { ...action.payload, id: Date.now() },
        ...state.liveFeed,
      ].slice(0, 6);
    },
    // all set changes are carried by this
    applyGameState: (state, action: PayloadAction<Partial<GameState>>) => {
      // Object.assign apply changes by comparing state versus action.payload 
      Object.assign(state, action.payload);
    },
    applyActiveUserStats: (state, action: PayloadAction<GameState['activeUserStats']>) => {
      state.activeUserStats = { ...state.activeUserStats, ...action.payload };
    },
    applyPlayersStats:(state, action: PayloadAction<GameState['playersStats']>) => {
      state.playersStats = { ...state.playersStats, ...action.payload };
    }, 
    updateRound:(state, action: PayloadAction<GameState['round']>) => {
      state.round = { ...state.round, ...action.payload };
    },  
    pushToGameRoom: (_state, _action: PayloadAction<ClientMessage>) => { }, // handles all clinet --> server messages sending
  }
})

export const {
  applyGameState, pushToGameRoom, addPlayer, addLiveFeed,
  applyActiveUserStats, applyPlayersStats, updateRound
} = gameSlice.actions;
export default gameSlice.reducer;
