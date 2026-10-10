import { sound } from "./audio.js?v=7";
import { Camera } from "./camera.js?v=7";
import { ParallaxRenderer } from "./parallax.js?v=7";
import { GameMap } from "./map.js?v=7";
import { Player } from "./player.js?v=7";
import { Magnetism } from "./magnetism.js?v=7";
import { Anvil } from "./anvil.js?v=7";
import { EnemyManager } from "./enemies.js?v=7";
import { GasTankSpecial } from "./special-gas.js?v=7";
import { BloodMoonSystem } from "./blood-moon.js?v=7";
import { FortuneSystem } from "./fortune.js?v=7";
import { Physics } from "./physics.js?v=7";
import { LightningShader } from "./lightning-shader.js?v=7";

class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    // Background Lightning Shader
    this.lightningShader = new LightningShader("sky-shader-canvas");

    // Subsystems
    this.camera = new Camera(960, 540);
    this.parallax = new ParallaxRenderer();
    this.map = new GameMap();
    this.player = new Player(250, 335);
    this.magnetism = new Magnetism();
    this.anvil = new Anvil(280, 290);
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
    this.healthValueText = document.getElementById("health-value-text");
    this.gasBarFill = document.getElementById("gas-bar-fill");
    this.gasReadyBadge = document.getElementById("gas-ready-badge");
    this.distanceReadout = document.getElementById("distance-readout");
    this.multiplierReadout = document.getElementById("multiplier-readout");
    this.scoreReadout = document.getElementById("score-readout");
    this.highScoreReadout = document.getElementById("high-score-readout");
    this.teleportStatus = document.getElementById("teleport-status");
    this.arcadeStage = document.getElementById("arcade-stage");
    this.cameraBtn = document.getElementById("camera-btn");
    this.isZoomed = false;

    // Upgrades DOM & State
    this.activeUpgrades = [];
    this.upgradeToastEl = document.getElementById("upgrade-toast");
    this.toastTitleEl = document.getElementById("toast-title");
    this.toastDescEl = document.getElementById("toast-desc");
    this.upgradesChipText = document.getElementById("upgrades-chip-text");

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
    this.highScoreReadout.textContent = this.highScore.toString().padStart(6, "0");

    // Start Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  setupListeners() {
    // Keyboard
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      sound.init();

      // Key Z/X as Pull/Push
      if (e.code === "KeyZ") this.mouse.leftDown = true;
      if (e.code === "KeyX") this.mouse.rightDown = true;

      // Update physical control deck visual feedback
      this.updateArcadeDeckVisuals(e.code, true);

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
            const targetX = this.mouse.x + this.camera.x;
            const targetY = this.mouse.y + this.camera.y;
            this.gasSpecial.activate(this.player, this.camera, targetX, targetY);
          }
        } else if (e.code === "KeyF") {
          this.toggleFps();
        } else if (e.code === "KeyC") {
          this.toggleCameraZoom();
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
      if (e.code === "KeyZ") this.mouse.leftDown = false;
      if (e.code === "KeyX") this.mouse.rightDown = false;
      this.updateArcadeDeckVisuals(e.code, false);
    });

    // Arcade Deck Buttons Mouse / Touch Bindings
    this.setupArcadeDeckDeckListeners();

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

    if (this.gasReadyBadge) {
      this.gasReadyBadge.addEventListener("click", () => {
        sound.init();
        if (this.player.gasCharge >= 90) {
          this.player.gasCharge = 0;
          const targetX = this.mouse.x + this.camera.x;
          const targetY = this.mouse.y + this.camera.y;
          this.gasSpecial.activate(this.player, this.camera, targetX, targetY);
        }
      });
    }

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

    const cameraBtn = document.getElementById("camera-btn");
    if (cameraBtn) {
      cameraBtn.addEventListener("click", () => {
        this.toggleCameraZoom();
      });
    }
  }

  zoomIn() {
    this.isZoomed = true;
    document.body.classList.add("in-game");
    if (this.arcadeStage) {
      this.arcadeStage.classList.add("zoomed-in");
      this.arcadeStage.classList.remove("cabinet-overview");
    }
    if (this.cameraBtn) {
      this.cameraBtn.textContent = "🎥 CÂMERA: GERAL";
    }
  }

  zoomOut() {
    this.isZoomed = false;
    document.body.classList.remove("in-game");
    if (this.arcadeStage) {
      this.arcadeStage.classList.remove("zoomed-in");
      this.arcadeStage.classList.add("cabinet-overview");
    }
    if (this.cameraBtn) {
      this.cameraBtn.textContent = "🎥 CÂMERA: JOGO";
    }
  }

  toggleCameraZoom() {
    if (this.isZoomed) {
      this.zoomOut();
    } else {
      this.zoomIn();
    }
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
    this.zoomIn();
    this.state = "playing";
    this.titleScreenEl.hidden = true;
    this.hudEl.hidden = false;
    this.gameOverEl.hidden = true;
    this.enemyManager.spawnInitialEnemies();
    sound.playPowerup();
    sound.playBgmGameplay();
  }

  restartGame() {
    this.zoomIn();
    this.map = new GameMap();
    this.player = new Player(250, 335);
    this.anvil = new Anvil(280, 290);
    this.enemyManager = new EnemyManager();
    this.gasSpecial = new GasTankSpecial();
    this.bloodMoon = new BloodMoonSystem();
    this.score = 0;
    this.kills = 0;
    this.scoreMultiplierBonus = 0;
    this.gasChargeRate = 1.0;
    this.activeUpgrades = [];
    this.updateUpgradesHUD();
    if (this.upgradeToastEl) this.upgradeToastEl.hidden = true;
    this.gameOverEl.hidden = true;
    this.hudEl.hidden = false;
    this.state = "playing";
    this.enemyManager.spawnInitialEnemies();
    sound.playPowerup();
    sound.playBgmGameplay();
  }

  applyUpgrade(u) {
    sound.playPowerup();
    this.camera.shake(6, 0.2);

    if (!this.activeUpgrades.includes(u.name)) {
      this.activeUpgrades.push(u.name);
    }

    if (u.id === "double_jump") {
      this.player.hasDoubleJump = true;
      this.showUpgradeToast("🥾 PULO DUPLO DESBLOQUEADO!", "Salte no ar livremente sem precisar da bigorna!");
    } else if (u.id === "hoverboard") {
      this.player.hasHoverboard = true;
      this.showUpgradeToast("🛹 PRANCHA MAGNÉTICA!", "Segure [S] ou [Shift] no ar para planar suavemente!");
    } else if (u.id === "magnet_boost") {
      this.anvil.basePower *= 1.4;
      this.showUpgradeToast("🧲 ÍMÃ TURBINADO (+40%)!", "Atração e propulsão de ferro brutais!");
    } else if (u.id === "heart_container") {
      this.player.maxHealth += 30;
      this.player.heal(100);
      this.showUpgradeToast("❤️ CORAÇÃO DE TITÃ (+30 HP)!", "Vida máxima expandida e recuperada!");
    } else if (u.id === "gas_valve") {
      this.gasChargeRate *= 1.8;
      this.showUpgradeToast("🔥 VÁLVULA DE GÁS RÁPIDO!", "Especial do botijão carrega quase 2x mais rápido!");
    }

    this.updateUpgradesHUD();
  }

  showUpgradeToast(title, desc) {
    if (!this.upgradeToastEl) return;
    this.toastTitleEl.textContent = title;
    this.toastDescEl.textContent = desc;
    this.upgradeToastEl.hidden = false;
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      if (this.upgradeToastEl) this.upgradeToastEl.hidden = true;
    }, 3000);
  }

  updateUpgradesHUD() {
    if (!this.upgradesChipText) return;
    if (this.activeUpgrades.length === 0) {
      this.upgradesChipText.textContent = "UPGRADES: NENHUM";
    } else {
      this.upgradesChipText.textContent = `UPGRADES: ${this.activeUpgrades.join(" · ")}`;
    }
  }

  triggerGameOver() {
    this.state = "game_over";
    this.hudEl.hidden = true;
    this.gameOverEl.hidden = false;
    sound.playBgmMenu();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("anvil_magnet_high_score", this.highScore.toString());
    }

    const distMeters = Math.floor(Math.abs(this.player.x - 250) / 10);
    document.getElementById("go-dist").textContent = `${distMeters} m`;
    document.getElementById("go-kills").textContent = this.kills.toString();
    document.getElementById("go-score").textContent = this.score.toString().padStart(6, "0");
    document.getElementById("go-high").textContent = this.highScore.toString().padStart(6, "0");
    this.highScoreReadout.textContent = this.highScore.toString().padStart(6, "0");
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
    const hazards = this.map.getHazards ? this.map.getHazards() : [];

    // 1. Distance Calculation (relative to central temple at X = 250)
    const distanceMeters = Math.max(0, Math.floor((this.player.x - 220) / 10));
    const multiplier = 1.0 + Math.floor(distanceMeters / 25) * 0.5 + this.scoreMultiplierBonus;

    // 2. Procedural World Streaming & Collectibles Update
    const loot = this.map.update(this.player, dt, this.time, distanceMeters);
    if (loot && loot.points > 0) {
      this.score += Math.round(loot.points * multiplier);
    }
    if (loot && loot.gas > 0) {
      this.player.addGasCharge(loot.gas * this.gasChargeRate);
    }

    // 3. Blood Moon System
    this.bloodMoon.update(dt);

    // 4. Player Update (supports solid anvil platform, double jump, and hazards)
    this.player.update(this.keys, platforms, this.anvil, this.mouse.leftDown, dt, hazards);

    // 5. Sanctuaries Interaction (check if player passes by sanctuary to heal & activate)
    this.map.sanctuaries.forEach(s => {
      const dist = Physics.distance(this.player.x, this.player.y, s.x + s.w / 2, s.y + s.h / 2);
      if (dist < 70) {
        if (!s.active) {
          s.active = true;
          this.player.currentSanctuary = s;
          sound.playPowerup();
        }
        this.player.heal(18 * dt); // gradual heal while near sanctuary
      }
    });

    // 6. Roguelite Upgrades Pickup Interaction
    this.map.upgrades.forEach(u => {
      if (!u.collected) {
        const dist = Physics.distance(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, u.x + u.w / 2, u.y + u.h / 2);
        if (dist < 48) {
          u.collected = true;
          this.applyUpgrade(u);
        }
      }
    });

    // 5. Camera & Parallax Update (tracks player position smoothly)
    this.camera.update(this.player.x, this.player.y, dt);
    this.parallax.update(dt, this.camera);

    // 7. Magnetism & Anvil (Permanently tethered inside screen viewport)
    this.currentInteraction = this.magnetism.calculateInteraction(this.player, this.anvil, this.mouse.leftDown);
    if (this.mouse.leftDown || this.mouse.rightDown) {
      const isPull = this.mouse.leftDown;
      this.anvil.applyMagneticForce(this.currentInteraction, isPull, dt);
      this.magnetism.spawnForceOrbs(this.currentInteraction, isPull, dt);
    }
    this.magnetism.update(this.currentInteraction, dt);
    this.anvil.update(this.player, platforms, dt, this.mouse.leftDown, this.camera);

    // 8. Enemies Update & Score (strictly off-screen spawning)
    const newKills = this.enemyManager.update(this.player, this.anvil, platforms, distanceMeters, this.bloodMoon.isActive, dt, this.camera);
    if (newKills > 0) {
      this.kills += newKills;
      this.score += Math.round(newKills * 100 * multiplier);
      this.camera.shake(4, 0.12);
    }

    // 9. Gas Special Update
    const gasKills = this.gasSpecial.update(this.player, this.anvil, this.enemyManager, dt);
    if (gasKills > 0) {
      this.kills += gasKills;
      this.score += Math.round(gasKills * 150 * multiplier);
      this.camera.shake(12, 0.4);
    }

    // 10. Check Game Over
    if (this.player.health <= 0) {
      this.triggerGameOver();
    }

    // 11. HUD DOM Update
    this.updateHUD(distanceMeters, multiplier);
  }

  updateHUD(distanceMeters, multiplier) {
    const hpPercent = Math.max(0, Math.min(100, (this.player.health / this.player.maxHealth) * 100));
    this.healthBarFill.style.width = `${hpPercent}%`;
    if (this.healthValueText) {
      this.healthValueText.textContent = `${Math.max(0, Math.ceil(this.player.health))} / ${this.player.maxHealth}`;
    }

    const gasPercent = Math.max(0, Math.min(100, (this.player.gasCharge / this.player.maxGasCharge) * 100));
    this.gasBarFill.style.width = `${gasPercent}%`;
    if (this.gasReadyBadge) {
      this.gasReadyBadge.hidden = this.player.gasCharge < 90;
    }

    this.distanceReadout.textContent = `${distanceMeters.toString().padStart(4, "0")} m`;
    this.multiplierReadout.textContent = `${multiplier.toFixed(1)}x`;
    this.scoreReadout.textContent = this.score.toString().padStart(6, "0");
    this.bloodMoonBadgeEl.hidden = !this.bloodMoon.isActive;

    if (this.player.teleportCooldown <= 0) {
      this.teleportStatus.innerHTML = '<span class="chip-dot">●</span> RECALL SANTUÁRIO [Q]: PRONTO';
      this.teleportStatus.className = "status-chip ready";
    } else {
      this.teleportStatus.innerHTML = `<span class="chip-dot" style="color:#ff5252">○</span> RECALL [Q]: ${this.player.teleportCooldown.toFixed(0)}s`;
      this.teleportStatus.className = "status-chip teleport-charging";
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

    // 4. Draw Gas Tank Special & Targeting Reticle
    this.gasSpecial.draw(this.ctx, this.camera, this.mouse, this.player.gasCharge >= 90);

    // 5. Draw Anvil & Tether
    this.anvil.draw(this.ctx, this.camera, this.player);

    // 6. Draw Player
    this.player.draw(this.ctx, this.camera);

    // 7. Draw Magnetic Force Orbs
    if (this.currentInteraction) {
      this.magnetism.draw(this.ctx, this.camera, this.currentInteraction, this.mouse.leftDown, this.mouse.rightDown);
    }
  }

  // --- PHYSICAL ARCADE DECK BINDINGS ---
  setupArcadeDeckDeckListeners() {
    // 1. Arcade Start Button in Console
    const deckStart = document.getElementById("deck-start-btn");
    if (deckStart) {
      deckStart.addEventListener("click", () => {
        sound.init();
        if (this.state === "title") this.startGame();
        else if (this.state === "game_over") this.restartGame();
      });
    }

    // 2. Action Buttons (Pull, Push, Jump, Gas, Recall, Teleport)
    const buttons = document.querySelectorAll(".arcade-button");
    buttons.forEach(btn => {
      const action = btn.getAttribute("data-action");
      const key = btn.getAttribute("data-key");

      const onPress = () => {
        sound.init();
        btn.classList.add("held");
        if (action === "pull") this.mouse.leftDown = true;
        if (action === "push") this.mouse.rightDown = true;
        if (key) {
          this.keys[key] = true;
          // Trigger special logic immediately if applicable
          if (key === "KeyE" && this.player.gasCharge >= 90) {
            this.player.gasCharge = 0;
            const targetX = this.mouse.x + this.camera.x;
            const targetY = this.mouse.y + this.camera.y;
            this.gasSpecial.activate(this.player, this.camera, targetX, targetY);
          } else if (key === "KeyQ") {
            this.player.teleportToSanctuary();
          } else if (key === "KeyR") {
            this.anvil.respawnNearPlayer(this.player);
          }
        }
      };

      const onRelease = () => {
        btn.classList.remove("held");
        if (action === "pull") this.mouse.leftDown = false;
        if (action === "push") this.mouse.rightDown = false;
        if (key) this.keys[key] = false;
      };

      btn.addEventListener("mousedown", onPress);
      btn.addEventListener("mouseup", onRelease);
      btn.addEventListener("mouseleave", onRelease);
      btn.addEventListener("touchstart", (e) => { e.preventDefault(); onPress(); });
      btn.addEventListener("touchend", (e) => { e.preventDefault(); onRelease(); });
    });

    // 3. Joystick D-Pad buttons
    const padButtons = document.querySelectorAll(".dpad-buttons button");
    padButtons.forEach(btn => {
      const key = btn.getAttribute("data-key");
      const onPress = () => {
        sound.init();
        btn.classList.add("held");
        if (key) {
          this.keys[key] = true;
          this.updateJoystickTilt();
        }
      };
      const onRelease = () => {
        btn.classList.remove("held");
        if (key) {
          this.keys[key] = false;
          this.updateJoystickTilt();
        }
      };
      btn.addEventListener("mousedown", onPress);
      btn.addEventListener("mouseup", onRelease);
      btn.addEventListener("mouseleave", onRelease);
      btn.addEventListener("touchstart", (e) => { e.preventDefault(); onPress(); });
      btn.addEventListener("touchend", (e) => { e.preventDefault(); onRelease(); });
    });
  }

  updateArcadeDeckVisuals(code, isDown) {
    // 1. Tilt Joystick physically based on direction keys
    this.updateJoystickTilt();

    // 2. Button Visual Depression on Keyboard Press
    const keyMap = {
      "KeyZ": document.querySelector(".arcade-button[data-action='pull']"),
      "KeyX": document.querySelector(".arcade-button[data-action='push']"),
      "Space": document.querySelector(".arcade-button[data-key='Space']"),
      "KeyE": document.querySelector(".arcade-button[data-key='KeyE']"),
      "KeyR": document.querySelector(".arcade-button[data-key='KeyR']"),
      "KeyQ": document.querySelector(".arcade-button[data-key='KeyQ']")
    };

    const targetBtn = keyMap[code];
    if (targetBtn) {
      if (isDown) targetBtn.classList.add("held");
      else targetBtn.classList.remove("held");
    }
  }

  updateJoystickTilt() {
    const joystick = document.getElementById("joystick");
    if (!joystick) return;

    let sx = 0;
    let sy = 0;
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) sx -= 12;
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) sx += 12;
    if (this.keys["KeyW"] || this.keys["ArrowUp"]) sy -= 10;
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) sy += 10;

    joystick.style.setProperty("--stick-x", `${sx}px`);
    joystick.style.setProperty("--stick-y", `${sy}px`);
  }
}

// Start Game on Page Load (safe for deferred ES modules)
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", () => {
    new Game();
  });
} else {
  new Game();
}
