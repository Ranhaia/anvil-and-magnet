import { Physics } from "./physics.js";
import { sound } from "./audio.js";

export class Player {
  constructor(spawnX = 250, spawnY = 335) {
    this.x = spawnX;
    this.y = spawnY;
    this.vx = 0;
    this.vy = 0;
    this.w = 42;
    this.h = 65;

    this.health = 100;
    this.maxHealth = 100;
    this.gasCharge = 0;
    this.maxGasCharge = 100;

    this.isGrounded = false;
    this.coyoteTime = 0;
    this.jumpBuffer = 0;
    
    // Upgrades & Anvil Jump
    this.hasDoubleJump = false;
    this.airJumpUsed = false;
    this.hasHoverboard = false;
    this.isHovering = false;
    this.hoverTime = 0;
    this.anvilAtFeetReady = false;
    this.anvilJumpUsed = false;
    this.doubleJumpEffectTimer = 0;

    // Recall Teleport
    this.teleportCooldown = 0;
    this.teleportMaxCooldown = 20.0;
    this.currentSanctuary = { x: 250, y: 390, name: "Templo Central" };
    this.lastSafeX = 250;
    this.lastSafeY = 356;

    this.facing = 1;
    this.animTime = 0;
    this.invulnerableTimer = 0;

    // Load new calibrated hero sprites (48 x 64 px)
    this.idleImg = new Image();
    this.idleImg.src = "assets/hero/hero_idle.png";

    this.jumpImg = new Image();
    this.jumpImg.src = "assets/hero/hero_jump.png";

    this.fallImg = new Image();
    this.fallImg.src = "assets/hero/hero_fall_fast.png";

    this.anvilRideImg = new Image();
    this.anvilRideImg.src = "assets/hero/hero_anvil_ride.png";

    this.runFrames = [];
    for (let i = 0; i < 8; i++) {
      const im = new Image();
      im.src = `assets/hero/hero_run_${i}.png`;
      this.runFrames.push(im);
    }
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0) return false;
    this.health = Math.max(0, this.health - amount);
    this.invulnerableTimer = 0.8;
    sound.playGore();
    return true;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  addGasCharge(amount) {
    this.gasCharge = Math.min(this.maxGasCharge, this.gasCharge + amount);
  }

  teleportToSanctuary() {
    if (this.teleportCooldown > 0) return false;
    this.x = this.currentSanctuary.x;
    this.y = this.currentSanctuary.y;
    this.vx = 0;
    this.vy = 0;
    this.teleportCooldown = this.teleportMaxCooldown;
    this.heal(35);
    sound.playTeleport();
    return true;
  }

  isAnvilAtFeet(anvil) {
    if (!anvil) return false;
    const pMidX = this.x + this.w / 2;
    const aMidX = anvil.x + anvil.w / 2;
    const footY = this.y + this.h;

    // Horizontal overlap or proximity (calibrated for 25% larger size)
    const hOverlap = Math.abs(aMidX - pMidX) <= 52;

    // Vertical proximity to feet: top of anvil between 20px above foot to 55px below foot
    const footDist = anvil.y - footY;
    const vNearFoot = (footDist >= -20 && footDist <= 55);

    // Or locked directly under feet by solid collision
    const isLockedUnderFeet = (anvil.isLockedToPlayer && anvil.lockSide === "feet");

    return (hOverlap && vNearFoot) || isLockedUnderFeet;
  }

  update(keys, platforms, anvil, isPulling, dt, hazards = []) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }
    if (this.teleportCooldown > 0) {
      this.teleportCooldown -= dt;
    }
    if (this.doubleJumpEffectTimer > 0) {
      this.doubleJumpEffectTimer -= dt;
    }

    this.anvilAtFeetReady = !this.isGrounded && !this.anvilJumpUsed && this.isAnvilAtFeet(anvil);

    // 1. Horizontal Movement
    const speed = 260;
    let moveDir = 0;
    if (keys["KeyA"] || keys["ArrowLeft"]) moveDir -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) moveDir += 1;

    if (moveDir !== 0) {
      this.vx = moveDir * speed;
      this.facing = moveDir;
      this.animTime += dt * 14;
    } else {
      this.vx = 0;
      this.animTime = 0;
    }

    // Comando da Prancha / Hoverboard no ar: segurar para baixo (S, ArrowDown, ShiftLeft ou joystick para baixo)
    const isDownHeld = Boolean(keys["KeyS"] || keys["ArrowDown"] || keys["ShiftLeft"]);
    if (isDownHeld && !this.isGrounded) {
      this.isHovering = true;
    } else {
      this.isHovering = false;
    }

    // 2. Vertical Movement & Gravity
    const gravity = this.isHovering ? 250 : 1200;
    this.vy += gravity * dt;

    if (this.isHovering && this.vy > 40) {
      this.vy = 40; // Planando suavemente para a frente na prancha!
    }

    // Jump Buffering & Coyote Time
    if (this.isGrounded) {
      this.coyoteTime = 0.12;
    } else {
      this.coyoteTime -= dt;
    }

    if (keys["KeyW"] || keys["Space"] || keys["ArrowUp"]) {
      if (!this._jumpKeyHeld) {
        this.jumpBuffer = 0.14;
        this._jumpKeyHeld = true;
      }
    } else {
      this._jumpKeyHeld = false;
    }

    if (this.jumpBuffer > 0) {
      this.jumpBuffer -= dt;
      if (this.coyoteTime > 0) {
        // Normal Jump from floor/platform
        this.vy = -560;
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
        sound.playJump();
      } else if (!this.isGrounded && !this.anvilJumpUsed && this.isAnvilAtFeet(anvil)) {
        // PULO NA BIGORNA (Limite rigoroso: 1x por pulo no ar!):
        this.vy = -620; // Salto vertical vigoroso
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
        this.anvilJumpUsed = true; // Consumido! Não pode ser usado novamente até tocar solo firme
        this.doubleJumpEffectTimer = 0.35;

        // Ação e Reação: pisão brutal que arremessa a bigorna para baixo
        anvil.vy = 850;
        anvil.vx += this.vx * 0.45;

        // Som e faíscas de impacto
        sound.playJump();
        sound.playMetalClang(1.4);
        anvil.spawnSparks(this.x + this.w / 2, this.y + this.h);
      } else if (!this.isGrounded && this.hasDoubleJump && !this.airJumpUsed) {
        // UPGRADE: Pulo Duplo Livre no Ar
        this.vy = -580;
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
        this.airJumpUsed = true;
        this.doubleJumpEffectTimer = 0.35;
        sound.playJump();
      }
    }

    // 3. Collision Resolution against Platforms
    // Move X
    this.x += this.vx * dt;
    let box = { x: this.x, y: this.y, w: this.w, h: this.h };
    for (const p of platforms) {
      if (Physics.checkAABB(box, p)) {
        if (this.vx > 0) {
          this.x = p.x - this.w;
        } else if (this.vx < 0) {
          this.x = p.x + p.w;
        }
        this.vx = 0;
        box.x = this.x;
      }
    }

    // Move Y against Platforms
    this.y += this.vy * dt;
    this.isGrounded = false;
    box = { x: this.x, y: this.y, w: this.w, h: this.h };
    for (const p of platforms) {
      if (Physics.checkAABB(box, p)) {
        if (this.vy > 0) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.isGrounded = true;
          this.airJumpUsed = false;
          this.anvilJumpUsed = false; // Reset do pulo na bigorna ao tocar plataforma sólida!
          // Registra última posição firme segura
          if (p.type === "ground") {
            this.lastSafeX = this.x;
            this.lastSafeY = this.y;
          }
        } else if (this.vy < 0) {
          this.y = p.y + p.h;
          this.vy = 0;
        }
        box.y = this.y;
      }
    }

    // Landing on Anvil as a solid moving surface
    if (anvil) {
      const footY = this.y + this.h;
      const anvilTop = anvil.y;
      const hOverlap = (this.x + this.w > anvil.x + 4) && (this.x < anvil.x + anvil.w - 4);

      if (this.vy >= 0 && footY >= anvilTop - 2 && footY <= anvilTop + 16 && hOverlap) {
        this.y = anvilTop - this.h;

        if (anvil.isGrounded) {
          // Bigorna firmemente apoiada em plataforma/solo: funciona como chão firme
          this.vy = 0;
          this.isGrounded = true;
          this.airJumpUsed = false;
          this.anvilJumpUsed = false; // Reset ao tocar bigorna que está apoiada no chão!
          this.coyoteTime = 0.12;
        } else {
          // Ambos no ar: massa combinada dos dois despenca pela gravidade somada!
          // NÃO concede isGrounded e NÃO reseta anvilJumpUsed
          const sharedVy = Math.max(this.vy, anvil.vy) + 1200 * dt;
          this.vy = sharedVy;
          anvil.vy = sharedVy;
        }
      }
    }

    // 4. Hazard (Spikes / Water) Collision
    if (hazards && hazards.length > 0 && this.invulnerableTimer <= 0) {
      for (const h of hazards) {
        if (Physics.checkAABB(box, h)) {
          if (h.type === "water") {
            // Queda na ÁGUA: perde um pouco de vida e é IMEDIATAMENTE RETIRADO DA ÁGUA
            this.takeDamage(15);
            sound.playWaterSplash();
            // Retira o jogador da água colocando-o de volta na margem sólida
            this.x = this.lastSafeX;
            this.y = this.lastSafeY;
            this.vx = 0;
            this.vy = 0;
            this.isGrounded = true;
            this.anvilJumpUsed = false;
            this.coyoteTime = 0.12;
            this.invulnerableTimer = 0.8;

            // Recoloca a bigorna no mapa ao lado do jogador
            if (anvil) {
              anvil.respawnNearPlayer(this);
            }
          } else {
            // Espinhos de ferro
            this.takeDamage(30);
            this.vy = -440; // knockback bounce
            sound.playMetalClang(1.5);
          }
          break;
        }
      }
    }

    // 5. Salvaguarda: se cair abaixo da linha do terreno, recoloca na última posição segura
    if (this.y > 460) {
      this.takeDamage(15);
      this.x = this.lastSafeX;
      this.y = this.lastSafeY;
      this.vx = 0;
      this.vy = 0;
      this.isGrounded = true;
      this.anvilJumpUsed = false;
      this.coyoteTime = 0.12;
      this.invulnerableTimer = 0.8;
      if (anvil) {
        anvil.respawnNearPlayer(this);
      }
    }
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    // Hoverboard effect
    if (this.isHovering) {
      ctx.fillStyle = "#78909c";
      ctx.fillRect(screenX - 8, screenY + this.h - 2, this.w + 16, 6);
      ctx.fillStyle = "#00e5ff";
      ctx.shadowColor = "#00e5ff";
      ctx.shadowBlur = 10;
      ctx.fillRect(screenX - 4, screenY + this.h + 4, this.w + 8, 3);
      ctx.shadowBlur = 0;
    }

    // Anvil Jump Ready indicator (Pulo Duplo disponível na sola do pé)
    if (this.anvilAtFeetReady) {
      ctx.strokeStyle = "#ffd600";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#ffd600";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(screenX + this.w / 2, screenY + this.h + 2, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Double Jump Shockwave Burst
    if (this.doubleJumpEffectTimer > 0) {
      const radius = (1 - this.doubleJumpEffectTimer / 0.35) * 28 + 6;
      ctx.strokeStyle = "rgba(0, 229, 255, 0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(screenX + this.w / 2, screenY + this.h, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Determine current sprite frame from calibrated 48x64 hero sprites
    let frame = this.idleImg;
    if (this.anvilAtFeetReady) {
      frame = this.anvilRideImg;
    } else if (!this.isGrounded) {
      frame = this.vy < 0 ? this.jumpImg : this.fallImg;
    } else if (Math.abs(this.vx) > 5 && this.runFrames.length > 0) {
      const idx = Math.floor(this.animTime) % this.runFrames.length;
      frame = this.runFrames[idx];
    }

    // Render Hero with Direction Mirroring (48 x 64 px)
    ctx.translate(screenX + this.w / 2, screenY + this.h / 2);
    ctx.scale(this.facing, 1);

    if (frame && frame.complete && frame.naturalWidth > 0) {
      // 25% larger sprite scale: 60 x 80 px
      ctx.drawImage(frame, -30, -40, 60, 80);
    } else {
      // Fallback Hero Rectangle
      ctx.fillStyle = "#00b0ff";
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    }

    ctx.restore();
  }
}
