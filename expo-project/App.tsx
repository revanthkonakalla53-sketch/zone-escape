import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// PHASE 4: SUPABASE INTEGRATION
// ==========================================
// IMPORTANT: Replace these with your actual Supabase project URL and Anon Key
const supabaseUrl = 'https://YOUR_PROJECT.supabase.co';
const supabaseKey = 'YOUR_ANON_KEY';
// const supabase = createClient(supabaseUrl, supabaseKey);
// Note: Uncomment supabase and its methods below once you configure your Supabase backend

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PLAYER_SIZE = 40;
const PLAYER_Y_POS = SCREEN_HEIGHT - 220; // Positioned above the controls

type GameState = 'start' | 'playing' | 'gameover';

type Obstacle = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isCrate: boolean;
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [globalHighScore, setGlobalHighScore] = useState(0);
  const [, setTick] = useState(0);

  const playerX = useRef(SCREEN_WIDTH / 2 - PLAYER_SIZE / 2);
  const playerXAnim = useRef(new Animated.Value(playerX.current)).current;
  const obstacles = useRef<Obstacle[]>([]);
  const frameCount = useRef(0);
  const scoreRef = useRef(0);
  const requestRef = useRef<number>();

  // Fetch High Score on Mount
  useEffect(() => {
    fetchHighScore();
  }, []);

  const fetchHighScore = async () => {
    try {
      // Uncomment once Supabase is configured:
      /*
      const { data, error } = await supabase
        .from('leaderboard')
        .select('score')
        .order('score', { ascending: false })
        .limit(1)
        .single();
      if (data) setGlobalHighScore(data.score);
      */
      setGlobalHighScore(1250); // Mock score for now
    } catch (e) {
      console.log('Error fetching high score:', e);
    }
  };

  const updateHighScore = async (newScore: number) => {
    try {
      // Uncomment once Supabase is configured:
      /*
      await supabase.from('leaderboard').insert([{ score: newScore }]);
      fetchHighScore();
      */
      if (newScore > globalHighScore) {
        setGlobalHighScore(newScore);
      }
    } catch (e) {
      console.log('Error updating high score:', e);
    }
  };

  // ==========================================
  // PHASE 5: SMOOTH ANIMATION
  // ==========================================
  const moveLeft = () => {
    const newX = Math.max(20, playerX.current - 70);
    playerX.current = newX;
    Animated.spring(playerXAnim, {
      toValue: newX,
      useNativeDriver: true,
      tension: 120,
      friction: 9,
    }).start();
  };

  const moveRight = () => {
    const newX = Math.min(SCREEN_WIDTH - PLAYER_SIZE - 20, playerX.current + 70);
    playerX.current = newX;
    Animated.spring(playerXAnim, {
      toValue: newX,
      useNativeDriver: true,
      tension: 120,
      friction: 9,
    }).start();
  };

  // ==========================================
  // PHASE 3: GAME LOOP & COLLISIONS
  // ==========================================
  const gameLoop = () => {
    if (gameState !== 'playing') return;

    frameCount.current += 1;

    // Obstacle Generation
    if (frameCount.current % 35 === 0) {
      const isCrate = Math.random() > 0.5;
      const width = isCrate ? 45 : 90;
      const height = isCrate ? 45 : 25;
      const x = Math.random() * (SCREEN_WIDTH - width - 40) + 20; // Keep within padded bounds

      obstacles.current.push({
        id: Date.now() + Math.random(),
        x,
        y: -height,
        width,
        height,
        color: isCrate ? '#ef4444' : '#f59e0b',
        isCrate,
      });
    }

    // Move obstacles & increase difficulty over time
    const speed = 7 + Math.floor(scoreRef.current / 200);
    let isGameOver = false;

    obstacles.current = obstacles.current.filter((obs) => {
      obs.y += speed;

      // Collision Detection Logic
      const pX = playerX.current;
      const pY = PLAYER_Y_POS;

      if (
        pX < obs.x + obs.width &&
        pX + PLAYER_SIZE > obs.x &&
        pY < obs.y + obs.height &&
        pY + PLAYER_SIZE > obs.y
      ) {
        isGameOver = true;
      }

      // Keep if still visible on screen
      return obs.y < SCREEN_HEIGHT;
    });

    if (isGameOver) {
      setGameState('gameover');
      if (scoreRef.current > globalHighScore) {
        updateHighScore(Math.floor(scoreRef.current));
      }
      return; // Stop the loop
    }

    // Update Score smoothly
    scoreRef.current += 0.2;
    setScore(Math.floor(scoreRef.current));
    setTick((t) => t + 1);

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

  const startGame = () => {
    obstacles.current = [];
    scoreRef.current = 0;
    frameCount.current = 0;
    setScore(0);
    
    // Reset Player
    const startX = SCREEN_WIDTH / 2 - PLAYER_SIZE / 2;
    playerX.current = startX;
    playerXAnim.setValue(startX);
    
    setGameState('playing');
  };

  if (gameState === 'start' || gameState === 'gameover') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e1b4b', '#312e81']} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={styles.menuContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>ZONE ESCAPE</Text>
            <Text style={styles.subtitle}>RUNNER</Text>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>{gameState === 'gameover' ? 'FINAL SCORE' : 'SCORE'}</Text>
            <Text style={styles.scoreValue}>{score}</Text>
            <View style={styles.divider} />
            <Text style={styles.globalScoreLabel}>GLOBAL HIGH SCORE</Text>
            <Text style={styles.globalScoreValue}>{globalHighScore}</Text>
          </View>

          <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={startGame}>
            <LinearGradient colors={['#4f46e5', '#6366f1']} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>
                {gameState === 'gameover' ? 'TRY AGAIN' : 'START RUN'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={StyleSheet.absoluteFillObject} />
      
      <SafeAreaView style={styles.gameArea}>
        <Text style={styles.ingameScore}>{score}</Text>

        {/* Player */}
        <Animated.View
          style={[
            styles.player,
            {
              transform: [{ translateX: playerXAnim }],
              top: PLAYER_Y_POS,
            },
          ]}
        />

        {/* Obstacles */}
        {obstacles.current.map((obs) => (
          <View
            key={obs.id}
            style={[
              styles.obstacle,
              {
                left: obs.x,
                top: obs.y,
                width: obs.width,
                height: obs.height,
                backgroundColor: obs.color,
                shadowColor: obs.color,
                borderRadius: obs.isCrate ? 8 : 12,
              },
            ]}
          />
        ))}

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={moveLeft} activeOpacity={0.6}>
            <Text style={styles.controlText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={moveRight} activeOpacity={0.6}>
            <Text style={styles.controlText}>→</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ==========================================
// PHASE 5: VISUAL POLISH (Styles)
// ==========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#818cf8',
    letterSpacing: 2,
    textShadowColor: 'rgba(129, 140, 248, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#cbd5e1',
    letterSpacing: 8,
  },
  scoreContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 60,
    width: '85%',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  scoreLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  scoreValue: {
    color: '#ffffff',
    fontSize: 64,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    marginVertical: 20,
  },
  globalScoreLabel: {
    color: '#fcd34d',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  globalScoreValue: {
    color: '#fcd34d',
    fontSize: 28,
    fontWeight: 'bold',
  },
  button: {
    width: '85%',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  ingameScore: {
    position: 'absolute',
    top: 60,
    right: 30,
    fontSize: 36,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.3)',
    zIndex: 10,
  },
  player: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: '#6366f1',
    borderRadius: 10,
    shadowColor: '#818cf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 5,
  },
  obstacle: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  controlButton: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    width: 100,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  controlText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
});
