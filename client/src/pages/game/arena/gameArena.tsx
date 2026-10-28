import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '#store/store';
import { pushToGameRoom } from '#store/slices/arena';
import { LiveFeed, GameplayArena } from '#components/game/arena'
import { PlayerStats } from '#components/player/stats';




export function Arena() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { room, gameState, timer, round, message, scramble, scores, wordCounts,
    liveFeed, playersStats } = useSelector((state: RootState) => state.arena);
  const { user } = useSelector((state: RootState) => state.auth);
  const playerId = user?.id !== undefined ? String(user.id) : '';
  const playerScore = scores?.[playerId] ?? 0;
  const playerWords = wordCounts?.[playerId] ?? 0;
  const totalWords = Object.values(wordCounts ?? {}).reduce((total, count) => total + count, 0);
  const rank = Object.values(scores ?? {})
    .filter((score) => score > playerScore)
    .length + 1;

  // Apply body classes on mount if not handled globally in index.html
  useEffect(() => {
    document.documentElement.classList.add('light');
    document.body.className = "bg-surface text-deep-ink font-body-md overflow-x-hidden min-h-screen bg-grid";
  }, []);

  const sortedPlayers = useMemo(() => [...playersStats].sort((a, b) => a.cumlativeScore - b.cumlativeScore),
    [playersStats]
  );
  return (
    <>
      <main className="max-h-screen max-w-screen mx-fit px-margin-mobile md:px-margin-desktop py-4 md:py-4 relative">
        <div className="relative grid grid-cols-1 md:grid-cols-13 gap-6 items-start">
          <LiveFeed feed={liveFeed} players={sortedPlayers} />
          <GameplayArena
            isOwner={room?.ownerId !== undefined && user?.id !== undefined && String(room.ownerId) === String(user.id)}
            status={gameState ?? 'WAITING'}
            timeLeft={timer}
            round={round?.roundNo}
            message={message}
            scramble={scramble}
            onStart={() => {
              if (user?.id === undefined) return;
              dispatch(pushToGameRoom({ type: 'in:game', payload: { action: 'START_GAME', value: { userId: user.id } } }));
            }}
            onPause={() => {
              if (user?.id === undefined) return;
              dispatch(pushToGameRoom({
                type: 'in:game',
                payload: {
                  action: gameState === 'PAUSED' ? 'RESUME_GAME' : 'PAUSE_GAME',
                  value: { userId: user.id },
                },
              }));
            }}
            onRestart={() => {
              if (user?.id === undefined) return;
              dispatch(pushToGameRoom({
                type: 'in:game',
                payload: { action: 'RESTART_GAME', value: { userId: user.id } },
              }));
            }}
            onLeave={() => {
              if (user?.id === undefined) return;
              dispatch(pushToGameRoom({
                type: 'in:game',
                payload: { action: 'LEAVE_GAME', value: { userId: user.id } },
              }));
              navigate('/game/lobby');
            }}
            onSubmit={(word) => dispatch(pushToGameRoom({ type: 'in:game', payload: { action: 'SEND_WORD', value: { word } } }))}
          />
          <PlayerStats score={playerScore} rank={playerScore > 0 ? rank : 0} words={playerWords} totalWords={totalWords} />
        </div>
      </main>
    </>
  );
}



