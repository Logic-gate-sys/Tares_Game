import { baseApi } from "./baseApi";
import type{ HallOfFameChampion, GlobalRankingEntry, GlobalStatsResponse, HallOfFameResponse } from "#types/entities";


export type RankingPeriod = "weekly" | "all-time";

export interface GetRankingsArgs {
  period: RankingPeriod;
  page?: number;
  limit?: number;
}

export const statsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHallOfFame: builder.query<HallOfFameResponse, void>({
      query: () => ({
        url: "/stats/global/champions",
        method: "GET",
      }),
    }),

    getGlobalRankings: builder.query<GlobalStatsResponse, GetRankingsArgs>({
      query: ({ period, page = 1, limit = 50 }) => ({
        url: "/stats/leaderboard",
        method: "GET",
        params: { period, page, limit },
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetHallOfFameQuery, useGetGlobalRankingsQuery } = statsApi;