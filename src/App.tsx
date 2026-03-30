import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RefreshCw } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 100;

const TRACKS = [
  { id: 1, title: "SYS.ERR_01", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "MEM_LEAK_DETECTED", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "NULL_POINTER_EXCEPTION", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

export default function App() {
  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);

  // Music State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const directionRef = useRef(direction);
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setIsGameStarted(true);
    spawnFood(INITIAL_SNAKE);
  };

  const spawnFood = useCallback((currentSnake: {x: number, y: number}[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // eslint-disable-next-line no-loop-func
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    setFood(newFood);
  }, []);

  const moveSnake = useCallback(() => {
    if (gameOver || !isGameStarted) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: head.x + directionRef.current.x,
        y: head.y + directionRef.current.y
      };

      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        spawnFood(newSnake);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [gameOver, isGameStarted, food, score, highScore, spawnFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && gameOver) {
        resetGame();
        return;
      }

      if (!isGameStarted && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(e.key)) {
        setIsGameStarted(true);
        if (!isPlaying && audioRef.current) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (directionRef.current.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
          if (directionRef.current.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
          if (directionRef.current.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          if (directionRef.current.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, isGameStarted, isPlaying]);

  useEffect(() => {
    const intervalId = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(intervalId);
  }, [moveSnake]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
  }, [currentTrackIndex, isPlaying]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 font-digital text-cyan-400 selection:bg-fuchsia-500/30 relative overflow-hidden">
      <div className="noise"></div>
      
      <div className="screen-tear relative z-10 flex flex-col items-center w-full max-w-[500px]">
        {/* Header */}
        <div className="text-center mb-6 w-full">
          <h1 className="text-6xl md:text-7xl font-bold mb-2 text-fuchsia-500 tracking-tighter uppercase glitch-text" data-text="FATAL_SNAKE">
            FATAL_SNAKE
          </h1>
          <div className="flex gap-12 justify-center text-3xl md:text-5xl font-digital text-cyan-400 border-y-4 border-fuchsia-500 py-2 bg-black/50">
            <p className="glitch-text" data-text={`SCORE:${score}`}>SCORE:{score}</p>
            <p className="glitch-text" data-text={`HIGH:${highScore}`}>HIGH:{highScore}</p>
          </div>
        </div>

        {/* Game Board */}
        <div className="relative w-full aspect-square bg-black border-4 border-cyan-400 shadow-[8px_8px_0px_#ff00ff] overflow-hidden mb-8">
          {/* Grid Lines */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'linear-gradient(to right, #00ffff 1px, transparent 1px), linear-gradient(to bottom, #00ffff 1px, transparent 1px)',
            backgroundSize: '5% 5%'
          }}></div>

          {/* Snake */}
          {snake.map((segment, index) => (
            <div
              key={`${segment.x}-${segment.y}-${index}`}
              className={`absolute ${index === 0 ? 'bg-fuchsia-500 z-10' : 'bg-cyan-400'}`}
              style={{
                left: `${segment.x * 5}%`,
                top: `${segment.y * 5}%`,
                width: '5%',
                height: '5%',
                boxShadow: index === 0 ? '0 0 10px #ff00ff' : 'none'
              }}
            />
          ))}

          {/* Food */}
          <div
            className="absolute bg-yellow-400 animate-pulse"
            style={{
              left: `${food.x * 5}%`,
              top: `${food.y * 5}%`,
              width: '5%',
              height: '5%',
              boxShadow: '0 0 15px #ffff00'
            }}
          />

          {/* Overlays */}
          {!isGameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
              <p className="text-fuchsia-500 text-3xl font-bold animate-pulse glitch-text" data-text="AWAITING_INPUT...">
                AWAITING_INPUT...
              </p>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20">
              <p className="text-red-500 text-6xl font-bold mb-6 glitch-text" data-text="SYSTEM_FAILURE">SYSTEM_FAILURE</p>
              <button
                onClick={resetGame}
                className="flex items-center gap-2 px-6 py-2 bg-black border-4 border-cyan-400 text-cyan-400 text-2xl hover:bg-cyan-400 hover:text-black transition-colors cursor-pointer uppercase shadow-[4px_4px_0px_#ff00ff]"
              >
                <RefreshCw size={24} />
                REBOOT_SEQUENCE
              </button>
            </div>
          )}
        </div>

        {/* Music Player */}
        <div className="w-full bg-black border-4 border-fuchsia-500 p-4 shadow-[8px_8px_0px_#00ffff]">
          <div className="flex items-center justify-between mb-4 border-b-2 border-cyan-400/30 pb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-fuchsia-500 font-bold uppercase tracking-widest mb-1 animate-pulse">AUDIO_STREAM_ACTIVE</p>
              <p className="text-cyan-400 text-2xl font-bold truncate glitch-text" data-text={TRACKS[currentTrackIndex].title}>
                {TRACKS[currentTrackIndex].title}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-fuchsia-500 hover:text-fuchsia-300 transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="w-24 h-2 bg-cyan-900 appearance-none cursor-pointer accent-fuchsia-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-8">
            <button
              onClick={prevTrack}
              className="p-2 text-cyan-400 hover:text-fuchsia-500 transition-colors cursor-pointer"
            >
              <SkipBack size={32} />
            </button>
            <button
              onClick={togglePlay}
              className="p-3 bg-black border-4 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-colors cursor-pointer shadow-[4px_4px_0px_#ff00ff]"
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
            </button>
            <button
              onClick={nextTrack}
              className="p-2 text-cyan-400 hover:text-fuchsia-500 transition-colors cursor-pointer"
            >
              <SkipForward size={32} />
            </button>
          </div>

          <audio
            ref={audioRef}
            src={TRACKS[currentTrackIndex].url}
            onEnded={handleTrackEnd}
            loop={false}
          />
        </div>
        
        <div className="mt-6 text-center text-fuchsia-500/70 text-lg uppercase tracking-widest">
          <p>INPUT: [W,A,S,D] OR [ARROWS]</p>
        </div>
      </div>
    </div>
  );
}
