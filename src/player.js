import { Physics } from "./physics.js";
import { sound } from "./audio.js";

export class Player {
  constructor(spawnX = 250, spawnY = 390) {
    this.x = spawnX;
    this.y = spawnY;
    this.vx = 0;
    this.vy = 0;
    this.w = 34;
    this.h = 52;

    this.health = 100;
    this.maxHealth = 100;
    this.gasCharge = 0;
    this.maxGasCharge = 100;

    this.isGrounded = false;
    this.coyoteTime = 0;
    this.jumpBuffer = 0;
    
    // Upgrades & Anvil Jump
    this.hasDoubleJump = false;
    this.hasHoverboard = false;
    this.isHovering = false;
    this.hoverTime = 0;
    this.anvilAtFeetReady = false;
    this.doubleJumpEffectTimer = 0;

    // Recall Teleport
    this.teleportCooldown = 0;
    this.teleportMaxCooldown = 20.0;
    this.currentSanctuary = { x: 250, y: 390, name: "Templo Central" };

    this.facing = 1;
    this.animTime = 0;
    this.invulnerableTimer = 0;

    // Load sprite frames
    this.idleImg = new Image();
    this.idleImg.src = "assets/hero/Sprite_asset_12.png";

    this.jumpImg = new Image();
    this.jumpImg.src = "assets/hero/Sprite_asset_13.png";

    this.walkFrames = [];
    const walkNames = [
      "Sprite_asset_9.png",
      "Sprite_asset_10.png",
      "Sprite_asset_11.png",
      "Sprite_asset_14.png",
      "Sprite_asset_15.png",
      "Sprite_asset_18.png",
      "Sprite_asset_19.png",
      "Sprite_asset_20.png",
      "Sprite_asset_21.png",
      "Sprite_asset_17.png",
      "Sprite_asset_22.png",
      "Sprite_asset_23.png"
    ];
    walkNames.forEach(fn => {
      const im = new Image();
      im.src = `assets/hero/${fn}`;
      this.walkFrames.push(im);
    });
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

    // Horizontal overlap or proximity
    const hOverlap = Math.abs(aMidX - pMidX) <= 42;

    // Vertical proximity to feet: top of anvil between 20px above foot to 55px below foot
    const footDist = anvil.y - footY;
    const vNearFoot = (footDist >= -20 && footDist <= 55);

    // Or locked directly under feet by solid collision
    const isLockedUnderFeet = (anvil.isLockedToPlayer && anvil.lockSide === "feet");

    return (hOverlap && vNearFoot) || isLockedUnderFeet;
  }

  update(keys, platforms, anvil, isPulling, dt) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }
    if (this.teleportCooldown > 0) {
      this.teleportCooldown -= dt;
    }
    if (this.doubleJumpEffectTimer > 0) {
      this.doubleJumpEffectTimer -= dt;
    }

    this.anvilAtFeetReady = !this.isGrounded && this.isAnvilAtFeet(anvil);

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

    // Hoverboard toggle (Hold Space/Down or dedicated trigger)
    if (this.hasHoverboard && (keys["ShiftLeft"] || keys["KeyS"]) && !this.isGrounded) {
      this.isHovering = true;
    } else {
      this.isHovering = false;
    }

    // 2. Vertical Movement & Gravity
    const gravity = this.isHovering ? 250 : 1200;
    this.vy += gravity * dt;

    if (this.isHovering && this.vy > 40) {
      this.vy = 40; // Gliding downwards gently!
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
      } else if (!this.isGrounded && this.isAnvilAtFeet(anvil)) {
        // DOUBLE JUMP: Powerful spring leap with high kinetic reaction!
        this.vy = -620; // Strong spring-loaded leap upward
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
        this.doubleJumpEffectTimer = 0.35;

        // Action & Reaction: Stomp down the anvil with brutal force!
        anvil.vy = 760;
        anvil.vx += this.vx * 0.45;

        // Sound & feedback
        sound.playJump();
        sound.playMetalClang(1.4);
        anvil.spawnSparks(this.x + this.w / 2, this.y + this.h);
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

      if (this.vy >= 0 && footY >= anvilTop - 2 && footY <= anvilTop + 14 && hOverlap) {
        this.y = anvilTop - this.h;
        this.vy = Math.max(0, anvil.vy);
        this.isGrounded = true;
        this.coyoteTime = 0.12;
      }
    }

    // Kill plane safeguard (if falls below screen abyss)
    if (this.y > 750) {
      this.takeDamage(40);
      this.x = this.currentSanctuary.x;
      this.y = this.currentSanctuary.y;
      this.vy = 0;
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

    // Determine current sprite frame
    let frame = this.idleImg;
    if (!this.isGrounded) {
      frame = this.jumpImg;
    } else if (this.vx !== 0 && this.walkFrames.length > 0) {
      const idx = Math.floor(this.animTime) % this.walkFrames.length;
      frame = this.walkFrames[idx];
    }

    // Render Hero with Direction Mirroring
    ctx.translate(screenX + this.w / 2, screenY + this.h / 2);
    ctx.scale(this.facing, 1);

    if (frame && frame.complete && frame.naturalWidth > 0) {
      ctx.drawImage(frame, -22, -28, 44, 56);
    } else {
      // Fallback Hero Rectangle
      ctx.fillStyle = "#00b0ff";
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    }

    ctx.restore();
  }
}
