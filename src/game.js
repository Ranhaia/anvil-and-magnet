import { sound } from "./audio.js?v=23";
import { Camera } from "./camera.js?v=17";
import { ParallaxRenderer } from "./parallax.js?v=24";
import { GameMap } from "./map.js?v=24";
import { Player } from "./player.js?v=24";
import { Magnetism } from "./magnetism.js?v=17";
import { Anvil } from "./anvil.js?v=24";
import { EnemyManager } from "./enemies.js?v=23";
import { GasTankSpecial } from "./special-gas.js?v=17";
import { BloodMoonSystem } from "./blood-moon.js?v=17";
import { FortuneSystem } from "./fortune.js?v=17";
import { Physics } from "./physics.js?v=17";

class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    // Parallax subterranean cave background with looping flora and depth layers
    this.useParallax = true;

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
    this.menuOpen = false;
    this.menuPaused = false; // true when opening the menu is what paused the run

    // Teleporte Segurando para Baixo (1s Channeling) & Animação de Transição
    this.teleportHoldTimer = 0;
    this.teleportHoldDuration = 1.0;
    this.teleportTransitionTimer = 0;
    this.teleportOrigin = { x: 0, y: 0 };
    this.teleportTarget = { x: 0, y: 0 };
    this.teleportParticles = [];

    // Upgrades DOM & State
    this.activeUpgrades = [];
    this.upgradeToastEl = document.getElementById("upgrade-toast");
    this.toastTitleEl = document.getElementById("toast-title");
    this.toastDescEl = document.getElementById("toast-desc");
    this.upgradesChipText = document.getElementById("upgrades-chip-text");
    this.menuPanelEl = document.getElementById("menu-panel");
    this.menuBtn = document.getElementById("menu-btn");
    this.menuCloseBtn = document.getElementById("menu-close-btn");

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
    const SCROLL_KEYS = ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    window.addEventListener("keydown", (e) => {
      // Never let the page scroll while playing. Space is also the jump key, so while a run or the altar is
      // active it must not "click" whichever toolbar/card button happens to hold focus.
      const onControl = e.target instanceof HTMLElement && /^(BUTTON|A)$/.test(e.target.tagName);
      const spaceIsGameplay = this.state === "playing" || this.state === "fortune_modal";
      if (SCROLL_KEYS.includes(e.code) && !(onControl && e.code === "Space" && !spaceIsGameplay)) e.preventDefault();

      this.keys[e.code] = true;
      sound.init();

      // Key Z/X as Pull/Push
      if (e.code === "KeyZ") this.mouse.leftDown = true;
      if (e.code === "KeyX") this.mouse.rightDown = true;

      // One-shot actions must not fire from key auto-repeat
      if (e.repeat) return;

      // Unified Pause / Menu: P, Escape, Tab, H toggles it
      if (this.menuOpen) {
        if (e.code === "Escape" || e.code === "KeyP" || e.code === "KeyH" || e.code === "Tab") {
          e.preventDefault();
          this.toggleMenu(false);
          return;
        }
      } else if (this.state === "playing") {
        if (e.code === "Escape" || e.code === "KeyP" || e.code === "KeyH" || e.code === "Tab") {
          e.preventDefault();
          this.pauseGame();
          return;
        }
      } else if (this.state === "title" || this.state === "paused") {
        if (e.code === "Tab" || e.code === "KeyH") {
          e.preventDefault();
          this.toggleMenu(true);
          return;
        }
      }

      // Handle shortcuts
      if (this.state === "title" && (e.code === "Enter" || e.code === "Space") && !onControl) {
        this.startGame();
      } else if (this.state === "game_over" && (e.code === "Enter" || e.code === "Space") && !onControl) {
        this.restartGame();
      } else if (this.state === "fortune_modal") {
        // Space is the jump key, so it must never dismiss the altar by accident.
        if (e.code === "Escape") {
          this.closeFortuneModal();
        } else if (e.code === "Digit1" || e.code === "Digit2") {
          const btn = this.fortuneOptionsEl.querySelectorAll(".fortune-btn[data-pick]")[e.code === "Digit1" ? 0 : 1];
          if (btn) btn.click();
        }
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
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
      if (e.code === "KeyZ") this.mouse.leftDown = false;
      if (e.code === "KeyX") this.mouse.rightDown = false;
    });

    // Losing focus must release every input (otherwise the hero keeps running) and pause the run
    const releaseAll = () => {
      this.keys = {};
      this.mouse.leftDown = false;
      this.mouse.rightDown = false;
      this.resetTouchVisuals();
      if (this.state === "playing") this.pauseGame();
    };
    window.addEventListener("blur", releaseAll);
    document.addEventListener("visibilitychange", () => { if (document.hidden) releaseAll(); });

    // Mobile On-Screen Transparent Touch Controls
    this.setupMobileTouchControls();

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
    const startBtn = document.getElementById("start-btn");
    if (startBtn) {
      startBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        sound.init();
        this.startGame();
      });
    }

    if (this.titleScreenEl) {
      this.titleScreenEl.addEventListener("click", () => {
        sound.init();
        this.startGame();
      });
    }

    const restartBtn = document.getElementById("restart-btn");
    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        this.restartGame();
      });
    }

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

    // --- Unified menu: every setting lives here ---

    const soundBtn = document.getElementById("sound-btn");
    soundBtn.addEventListener("click", () => {
      sound.init();
      const muted = sound.toggleMute();
      this.setSetting("sound-btn", muted ? "DESLIGADO" : "LIGADO");
      soundBtn.setAttribute("aria-checked", String(!muted));
    });

    const fsBtn = document.getElementById("fullscreen-btn");
    fsBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
    document.addEventListener("fullscreenchange", () => {
      this.setSetting("fullscreen-btn", document.fullscreenElement ? "SAIR" : "ENTRAR");
    });

    this.touchMode = "auto"; // "auto" | "on" | "off"
    document.getElementById("touch-toggle-btn").addEventListener("click", () => {
      const next = { auto: "on", on: "off", off: "auto" }[this.touchMode];
      this.touchMode = next;
      document.body.classList.toggle("touch-enabled", next === "on");
      document.body.classList.toggle("touch-disabled", next === "off");
      this.setSetting("touch-toggle-btn", { auto: "AUTO", on: "LIGADO", off: "DESLIGADO" }[next]);
    });

    const resumeBtn = document.getElementById("menu-resume-btn");
    if (resumeBtn) resumeBtn.addEventListener("click", () => this.resumeGame());

    const menuRestartBtn = document.getElementById("menu-restart-btn");
    if (menuRestartBtn) menuRestartBtn.addEventListener("click", () => this.restartGame());

    this.menuBtn.addEventListener("click", () => this.toggleMenu(true));
    this.menuCloseBtn.addEventListener("click", () => this.toggleMenu(false));
  }

  // Updates the value label of a row in the unified menu
  setSetting(id, text) {
    const el = document.querySelector(`#${id} .setting-value`);
    if (el) el.textContent = text;
  }

  // Unified Menu & Pause: Opening mid-run freezes the game; closing resumes.
  toggleMenu(open = !this.menuOpen) {
    if (open === this.menuOpen) return;
    this.menuOpen = open;
    this.menuPanelEl.classList.toggle("open", open);
    this.menuPanelEl.setAttribute("aria-hidden", String(!open));
    this.menuPanelEl.inert = !open;
    this.menuBtn.setAttribute("aria-expanded", String(open));

    const pauseActions = document.getElementById("menu-pause-actions");
    const menuTitle = document.getElementById("menu-title");

    if (open) {
      this.resetTouchVisuals();
      this.keys = {};
      this.mouse.leftDown = false;
      this.mouse.rightDown = false;
      if (this.state === "playing") {
        this.state = "paused";
        this.menuPaused = true;
      }
      if (this.state === "paused") {
        if (menuTitle) menuTitle.textContent = "PAUSADO";
        if (pauseActions) pauseActions.hidden = false;
        const resumeBtn = document.getElementById("menu-resume-btn");
        if (resumeBtn) resumeBtn.focus({ preventScroll: true });
      } else {
        if (menuTitle) menuTitle.textContent = "AJUSTES";
        if (pauseActions) pauseActions.hidden = true;
        this.menuCloseBtn.focus({ preventScroll: true });
      }
    } else {
      if (this.menuPaused && this.state === "paused") {
        this.state = "playing";
        this.lastFrameTime = performance.now();
      }
      this.menuPaused = false;
      this.menuBtn.focus({ preventScroll: true });
    }
  }


  pauseGame() {
    this.toggleMenu(true);
  }

  resumeGame() {
    this.toggleMenu(false);
  }

  closeFortuneModal() {
    this.fortuneModalEl.hidden = true;
    this.lastFrameTime = performance.now();
    this.state = "playing";
  }

  startGame() {
    try {
      this.toggleMenu(false);
      this.state = "playing";
      document.body.classList.add("in-game");
      if (this.titleScreenEl) this.titleScreenEl.hidden = true;
      if (this.hudEl) this.hudEl.hidden = false;
      if (this.gameOverEl) this.gameOverEl.hidden = true;
      this.enemyManager.spawnInitialEnemies();
      sound.playPowerup();
      sound.playBgmGameplay();
    } catch (err) {
      console.error("Error in startGame:", err);
      this.state = "playing";
      document.body.classList.add("in-game");
      if (this.titleScreenEl) this.titleScreenEl.hidden = true;
      if (this.hudEl) this.hudEl.hidden = false;
    }
  }

  restartGame() {
    this.toggleMenu(false);
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
    document.body.classList.add("in-game");
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
      this.showUpgradeToast("PULO DUPLO", "Salte no ar sem precisar da bigorna.");
    } else if (u.id === "hoverboard") {
      this.player.hasHoverboard = true;
      this.showUpgradeToast("PRANCHA MAGNÉTICA", "Segure S ou Shift no ar para planar.");
    } else if (u.id === "magnet_boost") {
      this.anvil.basePower *= 1.4;
      this.showUpgradeToast("ÍMÃ TURBINADO +40%", "Atração e propulsão muito mais fortes.");
    } else if (u.id === "heart_container") {
      this.player.maxHealth += 30;
      this.player.heal(100);
      this.showUpgradeToast("CORAÇÃO DE TITÃ +30 HP", "Vida máxima maior e totalmente recuperada.");
    } else if (u.id === "gas_valve") {
      this.gasChargeRate *= 1.8;
      this.showUpgradeToast("VÁLVULA RÁPIDA", "O botijão carrega quase 2x mais rápido.");
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
    document.body.classList.remove("in-game");
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
    pair.forEach((card, i) => {
      const btn = document.createElement("button");
      btn.className = "fortune-btn";
      btn.dataset.pick = String(i + 1);
      btn.innerHTML = `<kbd>${i + 1}</kbd><strong>${card.title}</strong><span>${card.desc}</span>`;
      btn.addEventListener("click", () => {
        card.apply(this);
        sound.playPowerup();
        this.closeFortuneModal();
      });
      this.fortuneOptionsEl.appendChild(btn);
    });

    const skipBtn = document.createElement("button");
    skipBtn.className = "fortune-btn fortune-skip";
    skipBtn.innerHTML = `<strong>Continuar sem modificador</strong><kbd>Esc</kbd>`;
    skipBtn.addEventListener("click", () => this.closeFortuneModal());
    this.fortuneOptionsEl.appendChild(skipBtn);
    const first = this.fortuneOptionsEl.querySelector(".fortune-btn");
    if (first) first.focus({ preventScroll: true });
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

    // 5B. Teleporte Canalizado para o Santuário (Segurar para Baixo por 1 segundo)
    // REGRA: Só pode ser ativado quando estiver no chão (player.isGrounded)! No ar é o comando da prancha.
    const isHoldingDown = Boolean(this.keys["KeyS"] || this.keys["ArrowDown"]);
    const isTeleportReady = this.player.teleportCooldown <= 0;

    if (this.player.isGrounded && isHoldingDown && isTeleportReady) {
      this.teleportHoldTimer += dt;

      // Partículas convergindo para o herói durante a canalização
      if (Math.random() < 0.7) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 26;
        this.teleportParticles.push({
          x: this.player.x + this.player.w / 2 + Math.cos(angle) * dist,
          y: this.player.y + this.player.h / 2 + Math.sin(angle) * dist,
          targetX: this.player.x + this.player.w / 2,
          targetY: this.player.y + this.player.h / 2,
          life: 0.35,
          maxLife: 0.35,
          color: Math.random() > 0.3 ? "#00e5ff" : "#ffd600",
          size: 2 + Math.random() * 2.5
        });
      }

      // Ao completar 1 segundo de canalização: dispara o teleporte com transição!
      if (this.teleportHoldTimer >= this.teleportHoldDuration) {
        this.teleportOrigin = { x: this.player.x + this.player.w / 2, y: this.player.y + this.player.h / 2 };
        this.player.teleportToSanctuary();
        this.teleportTarget = { x: this.player.x + this.player.w / 2, y: this.player.y + this.player.h / 2 };
        this.teleportTransitionTimer = 0.55;
        this.camera.shake(8, 0.25);
        this.teleportHoldTimer = 0;

        // Partículas em explosão no santuário de chegada
        for (let i = 0; i < 35; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 60 + Math.random() * 140;
          this.teleportParticles.push({
            x: this.teleportTarget.x,
            y: this.teleportTarget.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 30,
            life: 0.5 + Math.random() * 0.3,
            maxLife: 0.8,
            color: Math.random() > 0.4 ? "#00e5ff" : "#ffd600",
            size: 2.5 + Math.random() * 3
          });
        }
      }
    } else {
      // Soltou o botão para baixo antes de completar 1s: zera o carregamento
      this.teleportHoldTimer = 0;
    }

    // Atualiza FX da transição
    if (this.teleportTransitionTimer > 0) {
      this.teleportTransitionTimer -= dt;
    }

    // Atualiza partículas ativas
    for (let i = this.teleportParticles.length - 1; i >= 0; i--) {
      const p = this.teleportParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.teleportParticles.splice(i, 1);
        continue;
      }
      if (p.targetX !== undefined) {
        p.x += (p.targetX - p.x) * (14 * dt);
        p.y += (p.targetY - p.y) * (14 * dt);
      } else if (p.vx !== undefined) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }

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
    if (this.useParallax) this.parallax.update(dt, this.camera);

    // 7. Magnetism & Anvil (Permanently tethered inside screen viewport)
    this.currentInteraction = this.magnetism.calculateInteraction(this.player, this.anvil, this.mouse.leftDown);
    if (this.mouse.leftDown || this.mouse.rightDown) {
      const isPull = this.mouse.leftDown;
      this.anvil.applyMagneticForce(this.currentInteraction, isPull, dt);
      this.magnetism.spawnForceOrbs(this.currentInteraction, isPull, dt);

      // Ação e Reação / Massa Combinada (3ª Lei de Newton):
      // Quando o jogador está no ar atraindo a bigorna abaixo dele,
      // a massa e atração da bigorna puxam o jogador PARA BAIXO em direção ao solo!
      // Isso impede que a atração magnética anule a gravidade ou permita flutuar no ar.
      if (isPull && !this.player.isGrounded && this.currentInteraction.dirToAnvilY > 0) {
        const pullDownOnPlayer = this.currentInteraction.dirToAnvilY * 750 * this.currentInteraction.strength;
        this.player.vy += pullDownOnPlayer * dt;
      }
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

    // Only touch the DOM when the visible value changes (HUD runs every frame)
    let tpText = "";
    let tpClass = "";
    if (this.player.teleportCooldown <= 0) {
      if (this.player.isGrounded && this.teleportHoldTimer > 0) {
        const pct = Math.min(100, Math.floor((this.teleportHoldTimer / this.teleportHoldDuration) * 100));
        tpText = `<span class="chip-dot" aria-hidden="true"></span><kbd>▼</kbd> Invocando... ${pct}%`;
        tpClass = "chip ready channeling";
      } else if (this.player.isGrounded) {
        tpText = '<span class="chip-dot" aria-hidden="true"></span><kbd>▼</kbd> Segure: Santuário';
        tpClass = "chip ready";
      } else {
        tpText = `<span class="chip-dot" aria-hidden="true"></span><kbd>▼</kbd> Prancha ${this.player.isHovering ? "(Ativa)" : ""}`;
        tpClass = this.player.isHovering ? "chip ready channeling" : "chip ready";
      }
    } else {
      tpText = `<span class="chip-dot" aria-hidden="true"></span><kbd>▼</kbd> Santuário ${Math.ceil(this.player.teleportCooldown)}s`;
      tpClass = "chip charging";
    }

    if (this._tpText !== tpText) {
      this._tpText = tpText;
      if (this.teleportStatus) {
        this.teleportStatus.innerHTML = tpText;
        this.teleportStatus.className = tpClass;
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const distanceMeters = Math.max(0, Math.floor((this.player.x - 250) / 10));

    // 1. Background: flat fill by default; parallax art only when enabled
    if (this.useParallax) {
      this.parallax.draw(this.ctx, this.camera, this.time, this.bloodMoon.bloodFactor, distanceMeters);
    } else {
      this.ctx.fillStyle = "#0b0f1a";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      if (this.bloodMoon.bloodFactor > 0.01) {
        this.ctx.fillStyle = `rgba(180, 10, 30, ${this.bloodMoon.bloodFactor * 0.25})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    // 2. Draw World Map (Platforms, Sanctuaries, Upgrades)
    this.map.draw(this.ctx, this.camera, this.time, distanceMeters);

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

    // 8. Barra de Loading de Teleporte (Quando segurando para baixo)
    if (this.teleportHoldTimer > 0) {
      const progress = Math.min(1.0, this.teleportHoldTimer / this.teleportHoldDuration);
      const pScreenX = this.player.x - this.camera.x;
      const pScreenY = this.player.y - this.camera.y;
      const barW = 76;
      const barH = 7;
      const barX = pScreenX + this.player.w / 2 - barW / 2;
      const barY = pScreenY - 26;

      this.ctx.save();
      // Anel rúnico mágico no chão sob os pés do herói
      const pulse = 1.0 + Math.sin(this.time * 18) * 0.12;
      this.ctx.strokeStyle = "rgba(0, 229, 255, 0.85)";
      this.ctx.lineWidth = 2.5;
      this.ctx.shadowColor = "#00e5ff";
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.ellipse(pScreenX + this.player.w / 2, pScreenY + this.player.h + 2, 22 * pulse, 7 * pulse, 0, 0, Math.PI * 2);
      this.ctx.stroke();

      // Fundo e moldura da barra de loading
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = "rgba(10, 14, 24, 0.9)";
      this.ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
      this.ctx.strokeStyle = "#00e5ff";
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);

      // Preenchimento animado gradiente ciano para dourado
      const fillGrad = this.ctx.createLinearGradient(barX, 0, barX + barW, 0);
      fillGrad.addColorStop(0, "#00e5ff");
      fillGrad.addColorStop(1, "#ffd600");
      this.ctx.fillStyle = fillGrad;
      this.ctx.fillRect(barX, barY, barW * progress, barH);

      // Texto de status acima da barra
      this.ctx.font = "bold 9px Outfit, sans-serif";
      this.ctx.fillStyle = "#f0f4fc";
      this.ctx.textAlign = "center";
      this.ctx.fillText(`SANTUÁRIO ${Math.floor(progress * 100)}%`, pScreenX + this.player.w / 2, barY - 4);
      this.ctx.restore();
    }

    // 9. Animação de Transição de Teleporte
    if (this.teleportTransitionTimer > 0) {
      const factor = this.teleportTransitionTimer / 0.55; // 1.0 -> 0.0
      this.ctx.save();

      // Flash suave de luz ciano na tela inteira
      this.ctx.fillStyle = `rgba(0, 229, 255, ${factor * 0.32})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Feixe de luz vertical celestial no santuário de destino
      const destScreenX = this.teleportTarget.x - this.camera.x;
      const beamW = 48 * factor;
      const beamGrad = this.ctx.createLinearGradient(destScreenX - beamW / 2, 0, destScreenX + beamW / 2, 0);
      beamGrad.addColorStop(0, "rgba(0, 229, 255, 0)");
      beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${factor * 0.95})`);
      beamGrad.addColorStop(1, "rgba(0, 229, 255, 0)");
      this.ctx.fillStyle = beamGrad;
      this.ctx.fillRect(destScreenX - beamW / 2, 0, beamW, this.canvas.height);

      // Anel de onda de choque expansiva
      const shockR = (1 - factor) * 90 + 8;
      this.ctx.strokeStyle = `rgba(0, 229, 255, ${factor})`;
      this.ctx.lineWidth = 4 * factor;
      this.ctx.beginPath();
      this.ctx.arc(destScreenX, this.teleportTarget.y - this.camera.y, shockR, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.restore();
    }

    // 10. Partículas de Teleporte
    if (this.teleportParticles.length > 0) {
      this.ctx.save();
      for (const p of this.teleportParticles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x - this.camera.x, p.y - this.camera.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }
  }

  // --- MOBILE ON-SCREEN TRANSPARENT TOUCH CONTROLS ---
  setupMobileTouchControls() {
    // 1. Movement Virtual Joystick (WASD / Space)
    const moveStick = document.getElementById("touch-move-stick");
    const moveKnob = document.getElementById("touch-move-knob");
    this.moveKnob = moveKnob;

    if (moveStick && moveKnob) {
      const updateMove = (e) => {
        const rect = moveStick.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let dx = e.clientX - centerX;
        let dy = e.clientY - centerY;
        const maxR = rect.width * 0.38;
        const dist = Math.hypot(dx, dy);
        if (dist > maxR) {
          dx = (dx / dist) * maxR;
          dy = (dy / dist) * maxR;
        }
        moveKnob.style.transform = `translate(${dx}px, ${dy}px)`;

        const normX = dx / (maxR || 1);
        const normY = dy / (maxR || 1);
        const DEAD = 0.25;

        this.keys["KeyA"] = normX < -DEAD;
        this.keys["KeyD"] = normX > DEAD;
        this.keys["KeyW"] = normY < -0.35;
        this.keys["Space"] = normY < -0.35; // Para cima: Pula
        this.keys["KeyS"] = normY > 0.35;   // Para baixo: Segure para carregar teleporte p/ o Santuário!
      };

      const releaseMove = () => {
        this.keys["KeyA"] = false;
        this.keys["KeyD"] = false;
        this.keys["KeyW"] = false;
        this.keys["KeyS"] = false;
        this.keys["Space"] = false;
        moveKnob.style.transform = "translate(0px, 0px)";
        moveStick.classList.remove("active");
      };

      moveStick.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        sound.init();
        moveStick.setPointerCapture(e.pointerId);
        moveStick.classList.add("active");
        updateMove(e);
      });

      moveStick.addEventListener("pointermove", (e) => {
        if (moveStick.hasPointerCapture(e.pointerId)) {
          e.preventDefault();
          updateMove(e);
        }
      });

      moveStick.addEventListener("pointerup", releaseMove);
      moveStick.addEventListener("pointercancel", releaseMove);
      moveStick.addEventListener("lostpointercapture", releaseMove);
    }

    // 2. Magnetic Force Analog Joystick (Pull Left vs. Push Right + Directional Aim)
    const magnetStick = document.getElementById("touch-magnet-stick");
    const magnetKnob = document.getElementById("touch-magnet-knob");
    const magnetBase = magnetStick ? magnetStick.querySelector(".magnet-base") : null;
    this.magnetKnob = magnetKnob;

    if (magnetStick && magnetKnob) {
      const updateMagnet = (e) => {
        const rect = magnetStick.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let dx = e.clientX - centerX;
        let dy = e.clientY - centerY;
        const maxR = rect.width * 0.38;
        const dist = Math.hypot(dx, dy);
        if (dist > maxR) {
          dx = (dx / dist) * maxR;
          dy = (dy / dist) * maxR;
        }
        magnetKnob.style.transform = `translate(${dx}px, ${dy}px)`;

        const normX = dx / (maxR || 1);
        const normY = dy / (maxR || 1);

        // Update simulated mouse targeting vector relative to player screen coordinates
        if (dist > 4) {
          const playerScreenX = (this.player.x - this.camera.x) + this.player.width / 2;
          const playerScreenY = (this.player.y - this.camera.y) + this.player.height / 2;
          const dirX = dx / (dist || 1);
          const dirY = dy / (dist || 1);
          this.mouse.x = playerScreenX + dirX * 180;
          this.mouse.y = playerScreenY + dirY * 180;
        }

        // Horizontal: Left/Inward = Pull (Atrair), Right/Outward = Push (Repelir)
        const DEAD = 0.22;
        if (normX < -DEAD) {
          this.mouse.leftDown = true;
          this.mouse.rightDown = false;
          if (magnetBase) {
            magnetBase.classList.add("pulling");
            magnetBase.classList.remove("pushing");
          }
        } else if (normX > DEAD) {
          this.mouse.rightDown = true;
          this.mouse.leftDown = false;
          if (magnetBase) {
            magnetBase.classList.add("pushing");
            magnetBase.classList.remove("pulling");
          }
        } else {
          this.mouse.leftDown = false;
          this.mouse.rightDown = false;
          if (magnetBase) {
            magnetBase.classList.remove("pulling", "pushing");
          }
        }
      };

      const releaseMagnet = () => {
        this.mouse.leftDown = false;
        this.mouse.rightDown = false;
        magnetKnob.style.transform = "translate(0px, 0px)";
        magnetStick.classList.remove("active");
        if (magnetBase) {
          magnetBase.classList.remove("pulling", "pushing");
        }
      };

      magnetStick.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        sound.init();
        magnetStick.setPointerCapture(e.pointerId);
        magnetStick.classList.add("active");
        updateMagnet(e);
      });

      magnetStick.addEventListener("pointermove", (e) => {
        if (magnetStick.hasPointerCapture(e.pointerId)) {
          e.preventDefault();
          updateMagnet(e);
        }
      });

      magnetStick.addEventListener("pointerup", releaseMagnet);
      magnetStick.addEventListener("pointercancel", releaseMagnet);
      magnetStick.addEventListener("lostpointercapture", releaseMagnet);
    }

    // 3. Floating Action Button: Gas Especial
    const gasBtn = document.getElementById("touch-gas-btn");
    if (gasBtn) {
      gasBtn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        sound.init();
        gasBtn.classList.add("held");
        if (this.state === "playing" && this.player.gasCharge >= 90) {
          this.player.gasCharge = 0;
          const targetX = this.mouse.x + this.camera.x;
          const targetY = this.mouse.y + this.camera.y;
          this.gasSpecial.activate(this.player, this.camera, targetX, targetY);
        }
      });
      gasBtn.addEventListener("pointerup", () => gasBtn.classList.remove("held"));
      gasBtn.addEventListener("pointercancel", () => gasBtn.classList.remove("held"));
    }
  }

  resetTouchVisuals() {
    if (this.moveKnob) this.moveKnob.style.transform = "translate(0px, 0px)";
    if (this.magnetKnob) this.magnetKnob.style.transform = "translate(0px, 0px)";
    document.querySelectorAll(".touch-btn.held").forEach((b) => b.classList.remove("held"));
    const magnetBase = document.querySelector(".magnet-base");
    if (magnetBase) magnetBase.classList.remove("pulling", "pushing");
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
