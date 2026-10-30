import type { Room } from "#types/entities";
import type { ClientMessage, GameStatePayload } from "#types/messages";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";


export type GameState = {
  status: "room:out" | "room:in" | "idle"; // socket connection status
  gameState?:  "WAITING" | "COUNTDOWN" | "PLAYING" | "ROUND_OVER" | "FINISHED" | "PAUSED" | "error";
  room?: Room; // users active room
  playersStats: { id:number, name: string, scramble?: string, cumlativeScore: number}[]// participants active stats 
  activeUserStats?: { score?: number, rank?: string, accuracy?:string, words?: string , scrambles?: string[]};
  scramble: string; // scramble all players are to answer
  round?: { roundNo?: number, winner?: string, totalRound?:number, scramble?:string};
  timer?: number;// how much time transpired
  wordCounts?: Record<string, number>;
  // current words submitted by user and it's associated score 
  liveFeed: { id?: number, user: string, word: string, score: number}[];
}
// {roomId, round, scores, scrambleWord, status, timeLeft, wordCount, message, which }

const initGameState: GameState = {
  status: "idle",
  playersStats: [],
  activeUserStats: {score:0, rank:"unkown"},
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
    addPlayer: (state, action: PayloadAction<{ id:number, name: string, cumlativeScore: number }>) => {
        if (!state.playersStats.some((player) => player.name === action.payload.name)) {
          state.playersStats.push({ ...action.payload, scramble:''})
        }
    },
    // all set changes are carried by this
    applyGameState: (state, action: PayloadAction<Partial<GameStatePayload>>) => {
      // Object.assign apply changes by comparing state versus action.payload 
      Object.assign(state, action.payload);
    },
    addLiveFeed: (state, action: PayloadAction<{id?: number, user: string, word: string, score: number}>) => { 
      state.liveFeed.push({ ...action.payload });
    },
    // handles all clinet --> server messages sending
    pushToGameRoom: (_state, _action: PayloadAction<ClientMessage>) => { }, 
  }
})

export const {addPlayer, applyGameState, pushToGameRoom, addLiveFeed} = gameSlice.actions;
export default gameSlice.reducer;
