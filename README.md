🚀 Zone Escape Runner
A high-speed, 2D mobile survival game built with React Native, Expo, and Supabase.

📝 Project Overview
Zone Escape Runner is a battle-royale-themed endless runner designed to test the limits of lightweight rendering in React Native. Instead of relying on heavy image assets, the game dynamically renders the player and obstacles using pure React Native View components and state-driven styling.

This project was built to explore continuous game-loop mechanics, complex state management, and real-time database integration in a mobile environment.

🛠️ Tech Stack
Frontend: React Native, Expo

Backend / Database: Supabase (PostgreSQL)

Core Mechanics: Custom game loop, coordinate-based collision detection, local AsyncStorage

✨ Key Features
Optimized Rendering: Achieves smooth performance by utilizing geometric shapes and strict state-driven coordinate updates rather than external heavy assets.

Dynamic Obstacle Generation: Implements randomized algorithm-driven spawning for falling supply crates and shrinking zone barriers.

Global Leaderboards: Integrates a Supabase backend to push and fetch real-time high scores from players globally, moving beyond standard local storage.

Cross-Platform Ready: Fully developed and tested using Expo Application Services (EAS) for seamless Android (.aab) deployment.

🧠 Technical Challenges & Learnings
The Game Loop: Successfully engineered a continuous loop in React Native without relying on heavy game engines, ensuring the state updates seamlessly synchronized with the UI.

Collision Detection: Built a custom mathematical bounds-checking system to accurately detect when the player's coordinate matrix intersected with randomly generated falling obstacles.