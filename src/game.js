import { sound } from "./audio.js";
import { Camera } from "./camera.js";
import { ParallaxRenderer } from "./parallax.js";
import { GameMap } from "./map.js";
import { Player } from "./player.js";
import { Magnetism } from "./magnetism.js";
import { Anvil } from "./anvil.js";
import { EnemyManager } from "./enemies.js";
import { GasTankSpecial } from "./special-gas.js";
import { BloodMoonSystem } from "./blood-moon.js";
import { FortuneSystem } from "./fortune.js";
import { Physics } from "./physics.js";

class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    // Subsystems
    this.camera = new Camera(960, 540);
    this.parallax = new ParallaxRenderer();
    this.map = new GameMap();
    this.player = new Player(250, 390);
    this.magnetism = new Magnetism();
    this.anvil = new Anvil(280, 300, "small");
    this.enemyManager = new EnemyManager();
    this.gasSpecial = new GasTankSpecial();
    this.bloodMoon = new BloodMoonSystem();
    this.fortuneSystem = new FortuneSystem();

    // State
    this.state = "title"; // "title" | "playing" | "game_over" | "fortune_modal"
    this.score = 0;
    this.kills = 0;
    this.highScore = parseInt(localStorage.getItem("anvil_magnet_high_score") || "0", 10);
    this.scoreMultiplierBonus = 0.0;
    this.gasChargeRate = 1.0;
    this.time = 0;

    // Input Tracking
    this.keys = {};
    this.mouse = { x: 480, y: 270, leftDown: false, rightDown: false };

    // DOM UI elements
    this.hudEl = document.getElementById("hud");
    this.titleScreenEl = document.getElementById("title-screen");
    this.gameOverEl = document.getElementById("game-over-screen");
    this.fortuneModalEl = document.getElementById("fortune-modal");
    this.fortuneOptionsEl = document.getElementById("fortune-options");
    this.bloodMoonBadgeEl = document.getElementById("blood-moon-indicator");

    this.healthBarFill = document.getElementById("health-bar-fill");
    this.gasBarFill = document.getElementById("gas-bar-fill");
    this.distanceReadout = document.getElementById("distance-readout");
    this.multiplierReadout = document.getElementById("multiplier-readout");
    this.scoreReadout = document.getElementById("score-readout");
    this.highScoreReadout = document.getElementById("high-score-readout");
    this.teleportStatus = document.getElementById("teleport-status");

    this.titleScreenEl.hidden = false;
    this.hudEl.hidden = true;
    this.gameOverEl.hidden = true;
    this.fortuneModalEl.hidden = true;

    // Blood Moon Survival callback
    this.bloodMoon.onSurviveCallback = () => {
      this.openFortuneModal();
    };

    // FPS Capping (Padrão: 24 FPS para visual cinematográfico/arcade retrô)
    this.targetFps = 24;
    this.fpsInterval = 1000 / this.targetFps;
    this.lastFrameTime = performance.now();

    this.setupListeners();
    this.highScoreReadout.textContent = this.highScore;

    // Start Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  setupListeners() {
    // Keyboard
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;

      // Handle shortcuts
      if (this.state === "title" && (e.code === "Enter" || e.code === "Space")) {
        this.startGame();
      } else if (this.state === "game_over" && (e.code === "Enter" || e.code === "Space")) {
        this.restartGame();
      } else if (this.state === "fortune_modal" && (e.code === "Escape" || e.code === "Space")) {
        this.fortuneModalEl.hidden = true;
        this.state = "playing";
      } else if (this.state === "playing") {
        if (e.code === "KeyQ") {
          this.player.teleportToSanctuary();
        } else if (e.code === "KeyR") {
          this.anvil.respawnNearPlayer(this.player);
        } else if (e.code === "KeyE") {
          if (this.player.gasCharge >= 90) {
            this.player.gasCharge = 0;
            this.gasSpecial.activate(this.player, this.camera);
          }
        } else if (e.code === "Digit1") {
          this.anvil.setType("small");
          sound.playMetalClang(0.8);
        } else if (e.code === "Digit2") {
          this.anvil.setType("titan");
          sound.playMetalClang(1.5);
        } else if (e.code === "Digit3") {
          this.anvil.setType("yoyo");
          sound.playMetalClang(1.0);
        } else if (e.code === "KeyF") {
          this.toggleFps();
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    // Mouse Tracking relative to Canvas viewport
    const updateMousePos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
    };

    this.canvas.addEventListener("mousemove", updateMousePos);
    this.canvas.addEventListener("mousedown", (e) => {
      sound.init();
      updateMousePos(e);
      if (e.button === 0) this.mouse.leftDown = true;
      if (e.button === 2) this.mouse.rightDown = true;
    });

    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.mouse.leftDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // UI Buttons
    document.getElementById("start-btn").addEventListener("click", () => {
      sound.init();
      this.startGame();
    });

    document.getElementById("restart-btn").addEventListener("click", () => {
      this.restartGame();
    });

    const fpsBtn = document.getElementById("fps-btn");
    if (fpsBtn) {
      fpsBtn.textContent = `🎞️ FPS: ${this.targetFps}`;
      fpsBtn.addEventListener("click", () => {
        this.toggleFps();
      });
    }

    document.getElementById("sound-btn").addEventListener("click", () => {
      sound.init();
      const muted = sound.toggleMute();
      document.getElementById("sound-btn").textContent = muted ? "🔇 SOM: MUDO" : "🔊 SOM: LIGADO";
    });

    document.getElementById("fullscreen-btn").addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  toggleFps() {
    if (this.targetFps === 24) {
      this.targetFps = 60;
    } else if (this.targetFps === 60) {
      this.targetFps = 30;
    } else {
      this.targetFps = 24;
    }
    this.fpsInterval = 1000 / this.targetFps;
    this.lastFrameTime = performance.now();
    const fpsBtn = document.getElementById("fps-btn");
    if (fpsBtn) {
      fpsBtn.textContent = `🎞️ FPS: ${this.targetFps}`;
    }
  }

  startGame() {
    this.state = "playing";
    this.titleScreenEl.hidden = true;
    this.hudEl.hidden = false;
    this.gameOverEl.hidden = true;
    this.enemyManager.spawnInitialEnemies();
    sound.playPowerup();
  }

  restartGame() {
    this.player = new Player(250, 390);
    this.anvil = new Anvil(280, 300, "small");
    this.enemyManager = new EnemyManager();
    this.gasSpecial = new GasTankSpecial();
    this.bloodMoon = new BloodMoonSystem();
    this.score = 0;
    this.kills = 0;
    this.scoreMultiplierBonus = 0;
    this.gameOverEl.hidden = true;
    this.hudEl.hidden = false;
    this.state = "playing";
    this.enemyManager.spawnInitialEnemies();
    sound.playPowerup();
  }

  triggerGameOver() {
    this.state = "game_over";
    this.hudEl.hidden = true;
    this.gameOverEl.hidden = false;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("anvil_magnet_high_score", this.highScore.toString());
    }

    const distMeters = Math.floor(Math.abs(this.player.x - 250) / 10);
    document.getElementById("go-dist").textContent = `${distMeters} m`;
    document.getElementById("go-kills").textContent = this.kills.toString();
    document.getElementById("go-score").textContent = this.score.toString();
    document.getElementById("go-high").textContent = this.highScore.toString();
    this.highScoreReadout.textContent = this.highScore.toString();
  }

  openFortuneModal() {
    this.state = "fortune_modal";
    this.fortuneModalEl.hidden = false;
    this.fortuneOptionsEl.innerHTML = "";

    const pair = this.fortuneSystem.getRandomPair();
    pair.forEach(card => {
      const btn = document.createElement("button");
      btn.className = "fortune-btn";
      btn.innerHTML = `<strong>${card.title}</strong><span>${card.desc}</span>`;
      btn.addEventListener("click", () => {
        card.apply(this);
        sound.playPowerup();
        this.fortuneModalEl.hidden = true;
        this.state = "playing";
      });
      this.fortuneOptionsEl.appendChild(btn);
    });

    const skipBtn = document.createElement("button");
    skipBtn.className = "fortune-btn";
    skipBtn.style.gridColumn = "1 / -1";
    skipBtn.style.textAlign = "center";
    skipBtn.innerHTML = `<strong>Continuar sem Modificador (ESC)</strong>`;
    skipBtn.addEventListener("click", () => {
      this.fortuneModalEl.hidden = true;
      this.state = "playing";
    });
    this.fortuneOptionsEl.appendChild(skipBtn);
  }

  loop(timestamp) {
    requestAnimationFrame((t) => this.loop(t));

    const elapsed = timestamp - this.lastFrameTime;
    if (elapsed < this.fpsInterval) {
      return;
    }

    // Compensate for drift
    this.lastFrameTime = timestamp - (elapsed % this.fpsInterval);

    // Dynamic dt based on elapsed time capped for stable physics
    const dt = Math.min(elapsed / 1000, 0.08);
    this.time += dt;

    if (this.state === "playing") {
      this.update(dt);
    }

    this.render();
  }

  update(dt) {
    const platforms = this.map.getColliders();

    // 1. Distance Calculation (relative to central temple at X = 250)
    const distanceMeters = Math.floor(Math.abs(this.player.x - 250) / 10);
    const multiplier = 1.0 + Math.floor(distanceMeters / 25) * 0.5 + this.scoreMultiplierBonus;

    // 2. Blood Moon System
    this.bloodMoon.update(dt);

    // 3. Player Update (supports solid anvil platform and double jump with anvil at feet)
    this.player.update(this.keys, platforms, this.anvil, this.mouse.leftDown, dt);

    // 4. Sanctuaries Interaction (check if player passes by sanctuary to heal & activate)
    this.map.sanctuaries.forEach(s => {
      const dist = Physics.distance(this.player.x, this.player.y, s.x + s.w / 2, s.y + s.h / 2);
      if (dist < 60) {
        if (!s.active) {
          s.active = true;
          this.player.currentSanctuary = s;
          sound.playPowerup();
        }
        this.player.heal(15 * dt); // gradual heal while near sanctuary
      }
    });

    // 5. Upgrades Pickup Interaction
    this.map.upgrades.forEach(u => {
      if (!u.collected) {
        const dist = Physics.distance(this.player.x, this.player.y, u.x + u.w / 2, u.y + u.h / 2);
        if (dist < 45) {
          u.collected = true;
          sound.playPowerup();
          if (u.id === "double_jump") this.player.hasDoubleJump = true;
          if (u.id === "hoverboard") this.player.hasHoverboard = true;
          if (u.id === "titan_anvil") this.anvil.setType("titan");
          if (u.id === "yoyo_anvil") this.anvil.setType("yoyo");
        }
      }
    });

    // 6. Magnetism & Anvil (Proximity-based with force orbs)
    this.currentInteraction = this.magnetism.calculateInteraction(this.player, this.anvil, this.mouse.leftDown);
    if (this.mouse.leftDown || this.mouse.rightDown) {
      const isPull = this.mouse.leftDown;
      this.anvil.applyMagneticForce(this.currentInteraction, isPull, dt);
      this.magnetism.spawnForceOrbs(this.currentInteraction, isPull, dt);
    }
    this.magnetism.update(this.currentInteraction, dt);
    this.anvil.update(this.player, platforms, dt, this.mouse.leftDown);

    // 7. Enemies Update & Score
    const newKills = this.enemyManager.update(this.player, this.anvil, platforms, distanceMeters, this.bloodMoon.isActive, dt);
    if (newKills > 0) {
      this.kills += newKills;
      this.score += Math.round(newKills * 100 * multiplier);
      this.camera.shake(4, 0.12);
    }

    // 8. Gas Special Update
    const gasKills = this.gasSpecial.update(this.player, this.anvil, this.enemyManager, dt);
    if (gasKills > 0) {
      this.kills += gasKills;
      this.score += Math.round(gasKills * 150 * multiplier);
      this.camera.shake(12, 0.4);
    }

    // 9. Camera & Parallax Update
    this.camera.update(this.player.x, this.player.y, dt);
    this.parallax.update(dt, this.camera);

    // 10. Check Game Over
    if (this.player.health <= 0) {
      this.triggerGameOver();
    }

    // 11. HUD DOM Update
    this.updateHUD(distanceMeters, multiplier);
  }

  updateHUD(distanceMeters, multiplier) {
    this.healthBarFill.style.width = `${(this.player.health / this.player.maxHealth) * 100}%`;
    this.gasBarFill.style.width = `${(this.player.gasCharge / this.player.maxGasCharge) * 100}%`;
    this.distanceReadout.textContent = `${distanceMeters} m`;
    this.multiplierReadout.textContent = `${multiplier.toFixed(1)}x`;
    this.scoreReadout.textContent = this.score.toString();
    this.bloodMoonBadgeEl.hidden = !this.bloodMoon.isActive;

    if (this.player.teleportCooldown <= 0) {
      this.teleportStatus.textContent = "🌀 RECALL [Q]: PRONTO";
      this.teleportStatus.className = "teleport-ready";
    } else {
      this.teleportStatus.textContent = `🌀 RECALL [Q]: ${this.player.teleportCooldown.toFixed(0)}s`;
      this.teleportStatus.className = "teleport-charging";
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw Parallax Background (with DevilBat loop & Blood Moon disc)
    this.parallax.draw(this.ctx, this.camera, this.time, this.bloodMoon.bloodFactor);

    // 2. Draw World Map (Platforms, Sanctuaries, Upgrades)
    this.map.draw(this.ctx, this.camera, this.time);

    // 3. Draw Enemies
    this.enemyManager.draw(this.ctx, this.camera, this.bloodMoon.isActive);

    // 4. Draw Gas Tank Special
    this.gasSpecial.draw(this.ctx, this.camera);

    // 5. Draw Anvil & Tether
    this.anvil.draw(this.ctx, this.camera, this.player);

    // 6. Draw Player
    this.player.draw(this.ctx, this.camera);

    // 7. Draw Magnetic Force Orbs
    if (this.currentInteraction) {
      this.magnetism.draw(this.ctx, this.camera, this.currentInteraction, this.mouse.leftDown, this.mouse.rightDown);
    }
  }
}

// Start Game on Page Load
window.addEventListener("DOMContentLoaded", () => {
  new Game();
});
