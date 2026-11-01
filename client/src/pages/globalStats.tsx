import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetGlobalRankingsQuery,
  useGetHallOfFameQuery,
  type RankingPeriod,
} from "#store/services/statsApi";
import type { GlobalRankingEntry, HallOfFameChampion } from "#types/entities";

const PAGE_SIZE = 50;

function formatWords(words: number) {
  return new Intl.NumberFormat().format(words);
}

function formatWinRate(winRate: number) {
  return `${winRate.toFixed(1)}%`;
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="border-4 border-[#121721] bg-[#ffdad4] p-6 font-bold">
      {message}
    </div>
  );
}

export function GlobalStats() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<RankingPeriod>("weekly");
  const [page, setPage] = useState(1);
  const rankingsQuery = useGetGlobalRankingsQuery({ period, page, limit: PAGE_SIZE });
  const championsQuery = useGetHallOfFameQuery();
  const rankings = rankingsQuery.data?.globalRanks ?? [];
  const champions = championsQuery.data?.champions ?? [];
  const canGoNext = rankings.length === PAGE_SIZE;

  const changePeriod = (nextPeriod: RankingPeriod) => {
    setPeriod(nextPeriod);
    setPage(1);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f9f9ff] text-[#171c26]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;700;800&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48; }
        .neubrutal-shadow { box-shadow: 4px 4px 0 rgba(18, 23, 33, 1); }
        .neubrutal-shadow-lg { box-shadow: 8px 8px 0 rgba(18, 23, 33, 1); }
        .bricolage { font-family: 'Bricolage Grotesque', sans-serif; }
        .space-mono { font-family: 'Space Mono', monospace; }
      `}</style>

      <main className="mx-auto max-w-7xl px-4 py-12 md:px-10">
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-4">
            <div className="neubrutal-shadow rotate-[-2deg] border-4 border-[#121721] bg-[#EC2513] px-6 py-2 text-white">
              <h2 className="bricolage text-2xl font-black uppercase">Hall of Fame</h2>
            </div>
            <div className="hidden h-1 flex-grow bg-[#121721] md:block" />
          </div>

          {championsQuery.isError ? (
            <ErrorState message="Unable to load champions." />
          ) : championsQuery.isLoading ? (
            <p className="space-mono font-bold uppercase">Loading champions...</p>
          ) : champions.length === 0 ? (
            <p className="space-mono font-bold uppercase">No champions yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {champions.map((champion, index) => (
                <ChampionCard key={`${champion.id}-${champion.season}`} champion={champion} index={index} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="neubrutal-shadow-lg overflow-hidden border-4 border-[#121721] bg-white">
            <div className="flex flex-col items-start justify-between gap-4 bg-[#121721] p-6 text-white sm:flex-row sm:items-center">
              <h2 className="bricolage text-3xl font-black uppercase tracking-tight">Global Rankings</h2>
              <div className="flex gap-2">
                {(["weekly", "all-time"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => changePeriod(option)}
                    className={`border-2 px-4 py-2 space-mono text-sm font-bold uppercase ${
                      period === option
                        ? "border-white bg-[#EC2513] text-white"
                        : "border-[#121721] bg-white text-[#121721]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {rankingsQuery.isError ? (
              <div className="p-6">
                <ErrorState message="Unable to load rankings." />
              </div>
            ) : rankingsQuery.isLoading ? (
              <p className="p-6 space-mono font-bold uppercase">Loading rankings...</p>
            ) : rankings.length === 0 ? (
              <p className="p-6 space-mono font-bold uppercase">No rankings available for this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="border-b-4 border-[#121721] bg-[#e9edfc]">
                    <tr className="space-mono text-sm font-bold uppercase">
                      <th className="border-r-4 border-[#121721] p-6">Rank</th>
                      <th className="border-r-4 border-[#121721] p-6">Player</th>
                      <th className="border-r-4 border-[#121721] p-6 text-center">Words Unscrambled</th>
                      <th className="p-6 text-center">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bricolage text-xl">
                    {rankings.map((player) => (
                      <PlayerRow key={player.id} player={player} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col items-center justify-between gap-4 border-t-4 border-[#121721] bg-[#e9edfc] p-6 md:flex-row">
              <p className="space-mono font-bold uppercase">
                Page {page} · Showing up to {PAGE_SIZE} players
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={page === 1 || rankingsQuery.isFetching}
                  onClick={() => setPage((current) => current - 1)}
                  className="neubrutal-shadow border-4 border-[#121721] bg-white p-3 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={!canGoNext || rankingsQuery.isFetching}
                  onClick={() => setPage((current) => current + 1)}
                  className="neubrutal-shadow border-4 border-[#121721] bg-[#EC2513] p-3 text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 text-center">
          <button
            type="button"
            onClick={() => navigate("/game/lobby")}
            className="neubrutal-shadow-lg border-4 border-[#121721] bg-[#EC2513] px-12 py-6 bricolage text-2xl font-black uppercase tracking-widest text-white"
          >
            Improve My Rank
          </button>
          <p className="mt-8 space-mono text-sm font-bold uppercase text-[#121721]/60">
            Ready to climb the ladder? Start a new game now!
          </p>
        </section>
      </main>
    </div>
  );
}

function ChampionCard({ champion, index }: { champion: HallOfFameChampion; index: number }) {
  const backgrounds = ["bg-[#BFE6F7]", "bg-white", "bg-[#e9edfc]"];
  return (
    <article className={`neubrutal-shadow-lg border-4 border-[#121721] p-6 ${backgrounds[index % backgrounds.length]}`}>
      <div className="flex flex-col items-center">
        <Avatar src={champion.avatarUrl} alt={champion.avatarAlt} className="mb-4 h-24 w-24" />
        <h3 className="bricolage mb-1 text-2xl font-black">{champion.name}</h3>
        <p className="mb-4 bg-[#121721] px-2 space-mono text-sm uppercase text-white">Season {champion.season} Champion</p>
        <div className="flex w-full justify-between border-t-2 border-[#121721] pt-4 space-mono text-xs font-bold">
          <span>WIN RATE: {formatWinRate(champion.winRate)}</span>
          <span>WORDS: {formatWords(champion.words)}</span>
        </div>
      </div>
    </article>
  );
}

function PlayerRow({ player }: { player: GlobalRankingEntry }) {
  return (
    <tr className={`border-b-4 border-[#121721] ${player.isCurrentUser ? "bg-[#BFE6F7]/40" : "hover:bg-[#BFE6F7]/20"}`}>
      <td className="border-r-4 border-[#121721] p-6 text-3xl font-black italic">{player.rank}</td>
      <td className="border-r-4 border-[#121721] p-6">
        <div className="flex items-center gap-4">
          <Avatar src={player.avatarUrl} alt={player.avatarAlt ?? `${player.name} avatar`} className="h-12 w-12" />
          <span className="font-bold">{player.name}</span>
          {player.isCurrentUser && <span className="text-sm font-bold text-[#ba0900]">(YOU)</span>}
        </div>
      </td>
      <td className="border-r-4 border-[#121721] p-6 text-center space-mono font-bold">{formatWords(player.words)}</td>
      <td className="p-6 text-center">
        <span className="border-2 border-[#121721] bg-[#3e6372] px-3 py-1 space-mono font-bold text-white">
          {formatWinRate(player.winRate)}
        </span>
      </td>
    </tr>
  );
}

function Avatar({ src, alt, className }: { src: string | null; alt: string; className: string }) {
  return (
    <div className={`flex-shrink-0 border-4 border-[#121721] bg-[#BFE6F7] ${className}`}>
      {src ? (
        <img className="h-full w-full object-cover" alt={alt} src={src} />
      ) : (
        <span className="material-symbols-outlined flex h-full w-full items-center justify-center text-3xl">person</span>
      )}
    </div>
  );
}
