import { useState } from 'react';

interface GameplayArenaProps {
  isOwner: boolean;
  status: string;
  timeLeft?: number;
  round?: number;
  message?: string;
  scramble?: string;
  onStart: () => void;
  onPause: () => void;
  onRestart: () => void;
  onLeave: () => void;
  onSubmit: (word: string) => void;
}

export const GameplayArena = ({ isOwner, status, timeLeft = 0, round = 0, scramble, onStart, onPause, onRestart, onLeave, onSubmit }: GameplayArenaProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft < 10;

  return (
    <section className="md:col-span-7 h-fit rounded-2xl border-4 border-deep-ink bg-paper-white/70 p-2 shadow-[8px_8px_0px_0px_rgba(18,23,33,1)] backdrop-blur-sm sm:p-4 lg:p-4 space-y-md flex flex-col items-center">
      {/* Game Clock */}
      <div className="w-full grid grid-cols-1 gap-md md:grid-cols-[1fr_auto]">
        <div className={`text-paper-white px-lg py-md border-4 border-deep-ink neubrutal-shadow ${isLowTime ? 'bg-action-red' : 'bg-deep-ink'}`}>
          <span className="font-label-mono text-label-mono uppercase tracking-[0.2em]">{`Round ${round}/${3} • ${status}`}</span>
          <div className="text-display-lg font-display-lg-mobile md:text-display-lg leading-none">
            {formatTime(timeLeft)}
          </div>
          {/*{message && <div className="text-xs font-bold">{message}</div>}*/}
        </div>

        <div className="text-paper-white px-md py-md border-4 border-deep-ink neubrutal-shadow bg-green-800">
          {status === 'FINISHED' && isOwner ? (
            <div className="grid grid-cols-[2fr_1fr] gap-2">
              <button className="px-4 py-2 text-sm font-display-lg-mobile md:text-lg leading-none border-2 border-deep-ink bg-paper-white text-deep-ink transition-transform active:scale-95" onClick={onRestart}>
                ARRANGE ANOTHER MATCH
              </button>
              <button className="px-4 py-2 text-sm font-display-lg-mobile md:text-lg leading-none border-2 border-deep-ink bg-action-red text-paper-white transition-transform active:scale-95" onClick={onLeave}>
                RETURN TO LOBBY
              </button>
            </div>
          ) : isOwner ? (
            <div className="flex flex-col gap-2">
              <button
                className="px-4 py-2 text-sm font-display-lg-mobile md:text-lg leading-none border-2 border-deep-ink bg-paper-white text-deep-ink transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onStart}
                disabled={status !== 'WAITING'}
              >
                START GAME
              </button>
              <button
                className="px-4 py-2 text-sm font-display-lg-mobile md:text-lg leading-none border-2 border-deep-ink bg-action-red text-paper-white transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onPause}
                disabled={!['COUNTDOWN', 'PLAYING', 'PAUSED'].includes(status)}
              >
                {status === 'PAUSED' ? 'RESUME GAME' : 'PAUSE GAME'}
              </button>
            </div>
          ) : (
            <div className="flex min-h-20 min-w-48 flex-col items-center justify-center gap-1 px-4 text-center">
              <span className="text-xs font-label-mono uppercase tracking-[0.15em]">
                Game status
              </span>
              <span className="text-lg font-headline-md leading-none">
                {status === 'FINISHED' ? 'MATCH COMPLETE' : status === 'PAUSED' ? 'GAME PAUSED' : status === 'WAITING' ? 'WAITING' : 'GAME STARTED'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* The Scrambled Word */}
      <div className="w-full rounded-xl border-2 border-deep-ink/20 bg-sky-blue/60 flex flex-wrap justify-center gap-sm md:gap-sm py-xl min-h-40 items-center">
        {(scramble || '------').split('').map((letter, index) => (
          <LetterTile key={`${letter}-${index}`} letter={letter} delay={`${index / 10}s`} />
        ))}
      </div>

      {/* Input Field */}
      <div className="w-fit max-w-2xl relative group">
        <input
          autoFocus
          type="text"
          value={inputValue}
          required
          disabled={status !== 'PLAYING'}
          onChange={handleInputChange}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && status === 'PLAYING') {
              onSubmit(inputValue);
              setInputValue('');
            }
          }}
          placeholder="TYPE YOUR ANSWER..."
          className="w-full bg-paper-white border-4 border-deep-ink px-lg py-xl font-headline-md text-headline-md uppercase placeholder:opacity-20 focus:outline-none focus:border-action-red neubrutal-shadow transition-all group-active:translate-x-1 group-active:translate-y-1 group-active:shadow-none"
        />
        <button type="button" disabled={status !== 'PLAYING'} onClick={() => { onSubmit(inputValue); setInputValue(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-action-red text-paper-white border-2 border-deep-ink px-md py-sm font-label-bold text-label-bold neubrutal-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
          SUBMIT
        </button>
      </div>

      {/* Hint Button */}
      <button className="group flex items-center gap-sm bg-sky-blue border-4 border-deep-ink px-lg py-md font-label-bold text-label-bold neubrutal-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:scale-95">
        <span className="material-symbols-outlined">lightbulb</span>
        NEED A HINT? (-50 PTS)
      </button>
    </section>
  );
}

const LetterTile = ({ letter, delay }: { letter: string; delay: string }) => (
  <div
    className="word-tile w-16 h-16 md:w-20 md:h-20 bg-paper-white border-[3px] border-deep-ink rounded-lg neubrutal-shadow flex items-center justify-center float-animation"
    style={{ animationDelay: delay }}
  >
    <span className="font-headline-md text-headline-md md:text-headline-lg">{letter}</span>
  </div>
);
