import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { statsApi } from "#store/services/statsApi";
import type{ HallOfFameChampion, GlobalRankingEntry, HallOfFameResponse, GlobalStatsResponse } from "#types/entities";


interface LeaderBoardState {
  status: 'loading' | 'error' | 'success' | 'idle';
  champions: HallOfFameChampion[];
  globalRanks: GlobalRankingEntry[];
  message?: string;
  error?: unknown;
}

const initialState: LeaderBoardState = {
  status: 'idle',
  champions: [],
  globalRanks: [],
  message: '',
  error: null
}
export const stats = createSlice({
  name: "stats",
  initialState,
  reducers: {
    setHallOfFame: (state, action: PayloadAction<LeaderBoardState["champions"]>) => {
      state.champions = action.payload;
    },
    setGlobalRanks: (state, action: PayloadAction<LeaderBoardState["globalRanks"]>) => {
      state.globalRanks = action.payload;
    },
    clearMessage: (state) => {
      state.message = null;
      state.error = null;
      if (state.status === "error") state.status = "idle";
    },
  },

  // extraReducers
  extraReducers: (builder) => {
    builder
      .addMatcher(
        statsApi.endpoints.getGlobalRankings.matchPending,
        (state) => {
          state.status = "loading";
          state.message = null;
          state.error = null;
        },
      )
      .addMatcher(
        statsApi.endpoints.getHallOfFame.matchPending,
        (state) => {
          state.status = "loading";
          state.message = null;
          state.error = null;
        },
      )
      .addMatcher(
        statsApi.endpoints.getHallOfFame.matchFulfilled,
        (state, action: PayloadAction<HallOfFameResponse>) => {
          const {champions,message, error } = action.payload; 
          state.champions = champions;
          state.message = message;
          state.error = error as string; 
        },
      )
      .addMatcher(
        statsApi.endpoints.getGlobalRankings.matchFulfilled,
        (state, action: PayloadAction<GlobalStatsResponse>) => {
          const { globalRanks, error, message } = action.payload;
          state.globalRanks = globalRanks;
          state.message = message; 
          state.error = error as string ;
        },
      )
      .addMatcher(
        statsApi.endpoints.getGlobalRankings.matchRejected, (state, action) => {
          state.status = "error";
          state.error = action.error;
        },
      )
      .addMatcher(
        statsApi.endpoints.getHallOfFame.matchRejected,
        (state, action) => {
          state.status = "error";
          state.error = action.error;
        },
      );
  },
});

export const {setGlobalRanks, setHallOfFame, clearMessage } = stats.actions;
export default stats.reducer;
