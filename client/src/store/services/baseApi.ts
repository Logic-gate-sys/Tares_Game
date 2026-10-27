import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "#store/store";

const baseUrl = (import.meta.env.VITE_BASE_URL as string | undefined)?.replace(/\/+$/, "");
if (!baseUrl) throw new Error("VITE_BASE_URL is not set");

export const baseApi = createApi({
  reducerPath: 'baseApi',
  tagTypes: ['Rooms'],
  baseQuery: fetchBaseQuery({
    baseUrl,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    }
  }),

  endpoints: () => ({})
});
