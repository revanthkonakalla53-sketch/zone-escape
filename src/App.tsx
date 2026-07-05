import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Play, RotateCcw } from 'lucide-react';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 30;
const PLAYER_SPEED = 7;
const OBSTACLE_SPEED_INITIAL = 4;
const SPAWN_RATE_INITIAL = 45;

type GameState = 'start' | 'playing' | 'gameover';

type Obstacle = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'crate' | 'barrier';
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [, setTick] = useState(0); // Force re-render on frame updates

  const requestRef = useRef<number>();
  const playerX = useRef(GAME_WIDTH / 2 - PLAYER_SIZE / 2);
  const obstacles = useRef<Obstacle[]>([]);
  const frameCount = useRef(0);
  const keys = useRef<{ [key: string]: boolean }>({});
  const scoreRef = useRef(0);

  // Initialize high score
  useEffect(() => {
    const stored = localStorage.getItem('zone_escape_highscore');
    if (stored) setHighScore(parseInt(stored, 10));
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keys.current[e.code] = true;
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keys.current[e.code] = false;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const update = useCallback(() => {
    if (gameState !== 'playing') return;

    // Movement
    if (keys.current['ArrowLeft']) {
      playerX.current = Math.max(0, playerX.current - PLAYER_SPEED);
    }
    if (keys.current['ArrowRight']) {
      playerX.current = Math.min(GAME_WIDTH - PLAYER_SIZE, playerX.current + PLAYER_SPEED);
    }

    // Spawn obstacles
    frameCount.current += 1;
    const currentSpawnRate = Math.max(15, SPAWN_RATE_INITIAL - Math.floor(scoreRef.current / 100) * 2);
    
    if (frameCount.current % currentSpawnRate === 0) {
      const isCrate = Math.random() > 0.5;
      const width = isCrate ? 40 : 80;
      const height = isCrate ? 40 : 20;
      const x = Math.random() * (GAME_WIDTH - width);
      
      obstacles.current.push({
        id: Date.now() + Math.random(),
        x,
        y: -height,
        width,
        height,
        color: isCrate ? '#ef4444' : '#f59e0b',
        type: isCrate ? 'crate' : 'barrier'
      });
    }

    // Move obstacles & Check collisions
    const speedMultiplier = 1 + Math.floor(scoreRef.current / 200) * 0.1;
    const currentSpeed = OBSTACLE_SPEED_INITIAL * speedMultiplier;
    
    let isGameOver = false;

    obstacles.current = obstacles.current.filter(obs => {
      obs.y += currentSpeed;

      // Collision logic
      const pX = playerX.current;
      const pY = GAME_HEIGHT - PLAYER_SIZE - 20; // Player Y position (bottom 20px)
      
      if (
        pX < obs.x + obs.width &&
        pX + PLAYER_SIZE > obs.x &&
        pY < obs.y + obs.height &&
        pY + PLAYER_SIZE > obs.y
      ) {
        isGameOver = true;
      }

      // Keep if on screen
      return obs.y < GAME_HEIGHT;
    });

    if (isGameOver) {
      setGameState('gameover');
      if (scoreRef.current > highScore) {
        setHighScore(Math.floor(scoreRef.current));
        localStorage.setItem('zone_escape_highscore', Math.floor(scoreRef.current).toString());
      }
      return; // Stop updating
    }

    // Update score
    scoreRef.current += 1 / 6; // roughly 10 points per second at 60fps
    setScore(Math.floor(scoreRef.current));

    // Force re-render for smooth animation
    setTick(t => (t + 1) % 100);

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, highScore]);

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, update]);

  const startGame = () => {
    playerX.current = GAME_WIDTH / 2 - PLAYER_SIZE / 2;
    obstacles.current = [];
    frameCount.current = 0;
    scoreRef.current = 0;
    setScore(0);
    setGameState('playing');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans select-none overflow-hidden">
      <div 
        className="relative bg-slate-900 rounded-xl overflow-hidden shadow-2xl shadow-indigo-900/20 ring-1 ring-slate-800"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* Game Canvas / Entities */}
        {gameState === 'playing' && (
          <>
            {/* Player */}
            <div 
              className="absolute bg-indigo-500 rounded-sm shadow-[0_0_15px_rgba(99,102,241,0.5)] will-change-transform"
              style={{
                width: PLAYER_SIZE,
                height: PLAYER_SIZE,
                transform: `translate(${playerX.current}px, ${GAME_HEIGHT - PLAYER_SIZE - 20}px)`
              }}
            />
            
            {/* Obstacles */}
            {obstacles.current.map(obs => (
              <div
                key={obs.id}
                className="absolute rounded-sm will-change-transform"
                style={{
                  width: obs.width,
                  height: obs.height,
                  transform: `translate(${obs.x}px, ${obs.y}px)`,
                  backgroundColor: obs.color,
                  boxShadow: `0 0 10px ${obs.color}80`
                }}
              />
            ))}

            {/* In-game Score */}
            <div className="absolute top-6 right-6 text-white/50 font-mono text-2xl font-bold tracking-tighter">
              {score}
            </div>
          </>
        )}

        {/* Start / Game Over Overlays */}
        {(gameState === 'start' || gameState === 'gameover') && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-10">
            <div className="mb-10">
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-500 mb-1 tracking-tighter">
                ZONE ESCAPE
              </h1>
              <h2 className="text-xl font-bold text-slate-400 tracking-[0.2em]">RUNNER</h2>
            </div>
            
            <div className="bg-slate-900/80 p-6 rounded-2xl w-full max-w-[280px] mb-8 ring-1 ring-white/10 shadow-xl">
              <div className="mb-4">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">Score</p>
                <p className="text-5xl font-mono font-bold text-white">{score}</p>
              </div>
              <div className="h-px w-full bg-slate-800 mb-4" />
              <div className="flex items-center justify-center gap-3 text-amber-400">
                <Trophy className="w-5 h-5" />
                <span className="font-mono font-bold text-xl">{highScore}</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="group relative flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white w-full max-w-[280px] py-4 rounded-xl font-bold text-lg transition-all active:scale-95 shadow-lg shadow-indigo-900/50"
            >
              {gameState === 'start' ? (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  START RUN
                </>
              ) : (
                <>
                  <RotateCcw className="w-5 h-5" />
                  PLAY AGAIN
                </>
              )}
            </button>

            <div className="mt-10 flex items-center gap-3 text-slate-500 text-sm">
              <kbd className="bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300 font-mono text-xs border-b-2 border-slate-700 shadow-sm">←</kbd>
              <span className="font-medium tracking-wide">MOVE</span>
              <kbd className="bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300 font-mono text-xs border-b-2 border-slate-700 shadow-sm">→</kbd>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
