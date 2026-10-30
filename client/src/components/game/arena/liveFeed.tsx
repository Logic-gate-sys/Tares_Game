type FeedItem = {
  id: number;
  user: string;
  word: string;
  score: number;
};
type LivePlayers = { name: string, scramble?: string, cumlativeScore: number };

export const LiveFeed = ({ feed, players}: { feed: FeedItem[], players:LivePlayers[]  }) => {
  return (
    <aside className="md:col-span-3 space-y-md">
      <div className="bg-sky-blue border-4 border-deep-ink neubrutal-shadow p-md">
        <h2 className="font-headline-md text-headline-md border-b-4 border-deep-ink -mx-md -mt-md p-md mb-md bg-deep-ink text-paper-white">
          LIVE FEED
        </h2>
        <div className="space-y-sm max-h-100 overflow-y-auto pr-2 custom-scrollbar">
          {feed.length === 0 ? (
            <p className="bg-paper-white p-sm border-2 border-deep-ink font-label-bold text-deep-ink">
              No words submitted yet
            </p>
          ) : feed.map((item, idx) => (
            <div key={idx} className="flex items-center gap-sm bg-paper-white p-sm border-2 border-deep-ink animate-bounce">
              <span className="material-symbols-outlined text-action-red" style={{ fontVariationSettings: "'FILL' 1" }}>
                bolt
              </span>
              <p className="text-label-bold font-label-bold text-deep-ink">
                {item.user} unscrambled <span className="text-primary">{item.word.toUpperCase()}</span>
                <span className="ml-1 text-xs">+{item.score}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
      {/* -- live player stats -- */}
      <aside className="md:col-span-3 space-y-md">
        {/* Current Stats */}
        <div className="bg-paper-white border-4 border-deep-ink neubrutal-shadow">
          <div className="bg-red-500 p-sm text-paper-white flex justify-between items-center">
            <span className="font-label-bold text-label-bold">LIVE STATS</span>
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
          <div className="p-md space-y-sm">
            {players.map((pl, idx) => (
              <div key={idx} className="flex justify-between border-b-2 border-deep-ink/10 pb-xs">
                <span className="text-label-mono font-label-mono uppercase opacity-60">{pl.name}</span>
                <span className="font-headline-md text-xl">{pl.cumlativeScore }</span>
              </div>
            ))
            }
          </div>
        </div>
      </aside>

    </aside>
  );
};
