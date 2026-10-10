import { Physics } from "./physics.js";
import { sound } from "./audio.js";

export class Anvil {
  constructor(x = 280, y = 300) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.vRot = 0;

    // Big Titan Anvil permanently
    this.w = 64;
    this.h = 36;
    this.mass = 1.6;
    this.basePower = 1.7;

    this.sparks = [];
    this.img = new Image();
    this.img.src = "assets/anvils/anvil_titan.png";

    // Player collision lock & response
    this.hitLockCooldown = 0;
    this.isLockedToPlayer = false;
    this.lockSide = null; // "left", "right", "feet", "head"
  }

  // Magnetic force with rotational torque
  applyMagneticForce(interaction, isPull, dt) {
    if (!interaction.inRange) return;

    // Pull attracts toward player (-dirToAnvil), Push repels (+dirToAnvil)
    const sign = isPull ? -1 : 1;

    // Acceleration
    const accel = (isPull ? 2100 : 2500) * this.basePower * interaction.strength * (1 / this.mass);

    this.vx += interaction.dirToAnvilX * accel * sign * dt;
    this.vy += interaction.dirToAnvilY * accel * sign * dt;

    // Rotational torque from magnetic pull/push
    const torque = (interaction.dirToAnvilX * this.vy - interaction.dirToAnvilY * this.vx) * 0.005;
    this.vRot += (torque + (isPull ? -2.5 : 2.5) * interaction.strength) * dt;
    this.vRot = Math.max(-14, Math.min(14, this.vRot));

    // Anti-gravity lift during PULL
    if (isPull) {
      this.vy -= (1100 + 400 * interaction.strength) * dt;
    }

    // Terminal velocity cap
    const speed = Math.hypot(this.vx, this.vy);
    const maxSpeed = isPull ? 750 : 980;
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    this.vx *= Math.pow(0.985, dt * 60);
    this.vy *= Math.pow(0.988, dt * 60);
  }

  spawnSparks(x, y) {
    for (let i = 0; i < 7; i++) {
      this.sparks.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.7) * 160,
        life: 0.25,
        maxLife: 0.25
      });
    }
  }

  respawnNearPlayer(player) {
    this.x = player.x + (player.facing || 1) * 35;
    this.y = player.y - 100;
    this.vx = 0;
    this.vy = 80;
    this.vRot = 0;
    sound.playTeleport();
    this.spawnSparks(this.x + this.w / 2, this.y + this.h / 2);
  }

  update(player, platforms, dt, isPulling = false, camera = null) {
    // 1. Gravity & Friction
    this.vy += 950 * dt;
    this.vx *= Math.pow(0.985, dt * 60);
    this.vy *= Math.pow(0.992, dt * 60);

    // 2. Rotational Physics Integration
    this.angle += this.vRot * dt;
    this.vRot *= Math.pow(0.965, dt * 60);

    // 3. Platform Collisions with Impact Rotation
    // Move X
    this.x += this.vx * dt;
    let box = { x: this.x, y: this.y, w: this.w, h: this.h };
    for (const p of platforms) {
      if (Physics.checkAABB(box, p)) {
        if (Math.abs(this.vx) > 70) {
          sound.playMetalClang(Math.min(Math.abs(this.vx) / 300, 1.2));
          this.spawnSparks(this.vx > 0 ? p.x : p.x + p.w, this.y + this.h / 2);
          // Spin on side collision
          this.vRot = (this.vy * 0.02) + (this.vx > 0 ? 4 : -4);
        }
        if (this.vx > 0) this.x = p.x - this.w;
        else if (this.vx < 0) this.x = p.x + p.w;

        if (isPulling) {
          this.vy = Math.min(this.vy, -380);
        } else {
          this.vx = -this.vx * 0.35; // Gentle bounce
        }
        box.x = this.x;
      }
    }

    // Move Y
    this.y += this.vy * dt;
    box = { x: this.x, y: this.y, w: this.w, h: this.h };
    for (const p of platforms) {
      if (Physics.checkAABB(box, p)) {
        if (Math.abs(this.vy) > 80) {
          sound.playMetalClang(Math.min(Math.abs(this.vy) / 300, 1.2));
          this.spawnSparks(this.x + this.w / 2, this.vy > 0 ? p.y : p.y + p.h);
          // Spin on floor impact
          this.vRot = (this.vx * 0.025) + (Math.random() - 0.5) * 5;
        }
        if (this.vy > 0) {
          this.y = p.y - this.h;
          // Smooth settling on flat surface when stationary
          if (Math.abs(this.vx) < 25 && Math.abs(this.vy) < 45) {
            this.vRot *= 0.8;
            const nearestFlat = Math.round(this.angle / Math.PI) * Math.PI;
            this.angle += (nearestFlat - this.angle) * Math.min(1.0, 12 * dt);
          }
        } else if (this.vy < 0) {
          this.y = p.y + p.h;
        }
        this.vy = -this.vy * 0.25; // Gentle bounce
        box.y = this.y;
      }
    }

    // 5. Solid Collision Lock with Player
    this.resolvePlayerCollision(player, dt);

    // 6. SCREEN VIEWPORT LOCK: A bigorna NUNCA sai da tela!
    if (camera) {
      const pad = 12;
      const minX = camera.x + pad;
      const maxX = camera.x + 960 - this.w - pad;
      const minY = camera.y + pad;
      const maxY = camera.y + 540 - this.h - pad;

      if (this.x < minX) {
        this.x = minX;
        this.vx = Math.abs(this.vx) * 0.45;
        this.vRot = -this.vRot * 0.6 + 2.5;
      } else if (this.x > maxX) {
        this.x = maxX;
        this.vx = -Math.abs(this.vx) * 0.45;
        this.vRot = -this.vRot * 0.6 - 2.5;
      }

      if (this.y < minY) {
        this.y = minY;
        this.vy = Math.abs(this.vy) * 0.45;
        this.vRot = -this.vRot * 0.5;
      } else if (this.y > maxY) {
        this.y = maxY;
        this.vy = -Math.abs(this.vy) * 0.45;
        this.vRot = -this.vRot * 0.5;
      }
    }

    // Update Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) this.sparks.splice(i, 1);
    }
  }

  resolvePlayerCollision(player, dt) {
    if (this.hitLockCooldown > 0) {
      this.hitLockCooldown -= dt;
    }

    const pBox = { x: player.x, y: player.y, w: player.w, h: player.h };
    const aBox = { x: this.x, y: this.y, w: this.w, h: this.h };

    if (!Physics.checkAABB(aBox, pBox)) {
      this.isLockedToPlayer = false;
      this.lockSide = null;
      return false;
    }

    const pMidX = player.x + player.w / 2;
    const pMidY = player.y + player.h / 2;
    const aMidX = this.x + this.w / 2;
    const aMidY = this.y + this.h / 2;

    const dx = aMidX - pMidX;
    const dy = aMidY - pMidY;

    const halfW = (this.w + player.w) / 2;
    const halfH = (this.h + player.h) / 2;

    const overlapX = halfW - Math.abs(dx);
    const overlapY = halfH - Math.abs(dy);

    const relVx = this.vx - player.vx;
    const relVy = this.vy - player.vy;
    const impactSpeed = Math.hypot(relVx, relVy);

    if (overlapX < overlapY) {
      // Horizontal Lock (hit side of player)
      if (dx > 0) {
        this.x = player.x + player.w;
        if (this.vx < 0) this.vx = 0;
        this.lockSide = "right";
      } else {
        this.x = player.x - this.w;
        if (this.vx > 0) this.vx = 0;
        this.lockSide = "left";
      }
    } else {
      // Vertical Lock (feet or head)
      if (dy > 0) {
        this.y = player.y + player.h;
        if (this.vy < 0) this.vy = 0;
        this.lockSide = "feet";
      } else {
        this.y = player.y - this.h;
        if (this.vy > 0) this.vy = 0;
        this.lockSide = "head";
      }
    }

    this.isLockedToPlayer = true;

    if (impactSpeed > 65 && this.hitLockCooldown <= 0) {
      sound.playMetalClang(Math.min(impactSpeed / 260, 1.1));
      const sparkX = Math.max(player.x, Math.min(player.x + player.w, this.x + this.w / 2));
      const sparkY = Math.max(player.y, Math.min(player.y + player.h, this.y + this.h / 2));
      this.spawnSparks(sparkX, sparkY);
      this.hitLockCooldown = 0.16;
    }

    return true;
  }

  draw(ctx, camera, player) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    // Draw Sparks
    ctx.save();
    this.sparks.forEach(s => {
      ctx.fillStyle = "#ffd600";
      ctx.beginPath();
      ctx.arc(s.x - camera.x, s.y - camera.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Draw Anvil Body with Physical Rotation
    ctx.save();
    ctx.translate(screenX + this.w / 2, screenY + this.h / 2);
    ctx.rotate(this.angle);

    if (this.img.complete && this.img.naturalWidth > 0) {
      ctx.drawImage(this.img, -this.w / 2, -this.h / 2, this.w, this.h);
    } else {
      ctx.fillStyle = "#455a64";
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    }

    // Magnetic kinetic aura when moving fast
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > 160) {
      ctx.strokeStyle = "rgba(0, 229, 255, 0.65)";
      ctx.lineWidth = 2;
      ctx.strokeRect(-this.w / 2 - 2, -this.h / 2 - 2, this.w + 4, this.h + 4);
    }

    ctx.restore();
  }
}
