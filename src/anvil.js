import { Physics } from "./physics.js";
import { sound } from "./audio.js";

export class Anvil {
  constructor(x = 280, y = 300, type = "small") {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.type = type;
    this.setType(type);

    this.sparks = [];
    this.img = new Image();
    this.img.src = "assets/anvil.png";

    // Player collision lock & response
    this.hitLockCooldown = 0;
    this.isLockedToPlayer = false;
    this.lockSide = null; // "left", "right", "feet", "head"
  }

  setType(type) {
    this.type = type;
    if (type === "titan") {
      this.w = 64;
      this.h = 36;
      this.mass = 1.8;
      this.basePower = 1.4;
    } else if (type === "yoyo") {
      this.w = 42;
      this.h = 24;
      this.mass = 0.9;
      this.basePower = 1.7;
      this.ropeLength = 260;
    } else {
      // Small Anvil
      this.w = 46;
      this.h = 26;
      this.mass = 1.0;
      this.basePower = 1.6;
    }
  }

  // Magnetic force with high impact and responsive levitation
  applyMagneticForce(interaction, isPull, dt) {
    if (!interaction.inRange) return;

    // Pull attracts toward player (-dirToAnvil), Push repels (+dirToAnvil)
    const sign = isPull ? -1 : 1;

    // Significantly increased acceleration for strong tactile feedback
    const accel = (isPull ? 1900 : 2300) * this.basePower * interaction.strength * (1 / this.mass);

    this.vx += interaction.dirToAnvilX * accel * sign * dt;
    this.vy += interaction.dirToAnvilY * accel * sign * dt;

    // Strong anti-gravity levitation lift during PULL so anvil glides upwards effortlessly
    if (isPull) {
      this.vy -= (1080 + 420 * interaction.strength) * dt;
    }

    // High terminal velocity cap for forceful throws
    const speed = Math.hypot(this.vx, this.vy);
    const maxSpeed = isPull ? 720 : 940;
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    // Controlled smooth damping
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
    this.y = player.y - 110;
    this.vx = 0;
    this.vy = 80;
    sound.playTeleport();
    this.spawnSparks(this.x + this.w / 2, this.y + this.h / 2);
  }

  update(player, platforms, dt, isPulling = false) {
    // 1. Natural Gravity & Atmospheric Drag
    this.vy += 920 * dt;
    this.vx *= Math.pow(0.985, dt * 60);
    this.vy *= Math.pow(0.992, dt * 60);

    // 2. Yoyo Rope Constraint
    if (this.type === "yoyo") {
      const centerP = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
      const centerA = { x: this.x + this.w / 2, y: this.y + this.h / 2 };
      const dist = Physics.distance(centerP.x, centerP.y, centerA.x, centerA.y);

      if (dist > this.ropeLength) {
        const dx = centerP.x - centerA.x;
        const dy = centerP.y - centerA.y;
        const springForce = (dist - this.ropeLength) * 12;
        this.vx += (dx / dist) * springForce * dt;
        this.vy += (dy / dist) * springForce * dt;
      }
    }

    // 3. Platform Collisions with Anti-Stuck Corner Lifting
    // Move X
    this.x += this.vx * dt;
    let box = { x: this.x, y: this.y, w: this.w, h: this.h };
    for (const p of platforms) {
      if (Physics.checkAABB(box, p)) {
        if (Math.abs(this.vx) > 100) {
          sound.playMetalClang(Math.min(Math.abs(this.vx) / 300, 1.2));
          this.spawnSparks(this.vx > 0 ? p.x : p.x + p.w, this.y + this.h / 2);
        }
        if (this.vx > 0) this.x = p.x - this.w;
        else if (this.vx < 0) this.x = p.x + p.w;

        // Anti-stuck: if player is pulling and anvil is snagged against a platform ledge, pop it upward!
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
        if (Math.abs(this.vy) > 100) {
          sound.playMetalClang(Math.min(Math.abs(this.vy) / 300, 1.2));
          this.spawnSparks(this.x + this.w / 2, this.vy > 0 ? p.y : p.y + p.h);
        }
        if (this.vy > 0) this.y = p.y - this.h;
        else if (this.vy < 0) this.y = p.y + p.h;
        this.vy = -this.vy * 0.25; // Gentle bounce
        box.y = this.y;
      }
    }

    // 4. Solid collision lock with Player (Anvil cannot penetrate player)
    this.resolvePlayerCollision(player, dt);

    // Update Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) this.sparks.splice(i, 1);
    }

    // 5. Anti-Lost Safeguard: if fell deep into abyss (> 580) or thrown ultra-far (> 1100px), recall safely
    const distFromPlayer = Physics.distance(this.x, this.y, player.x, player.y);
    if (this.y > 580 || distFromPlayer > 1150) {
      this.respawnNearPlayer(player);
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
        // Below feet
        this.y = player.y + player.h;
        if (this.vy < 0) this.vy = 0;
        this.lockSide = "feet";
      } else {
        // Above head
        this.y = player.y - this.h;
        if (this.vy > 0) this.vy = 0;
        this.lockSide = "head";
      }
    }

    this.isLockedToPlayer = true;

    // Play clang and sparks on impactful collision
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

    // Draw Yoyo Rope
    if (this.type === "yoyo") {
      const pScreenX = player.x + player.w / 2 - camera.x;
      const pScreenY = player.y + player.h / 2 - camera.y;
      ctx.save();
      ctx.strokeStyle = "#ffd600";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(pScreenX, pScreenY);
      ctx.lineTo(screenX + this.w / 2, screenY + this.h / 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Sparks
    ctx.save();
    this.sparks.forEach(s => {
      ctx.fillStyle = "#ffd600";
      ctx.beginPath();
      ctx.arc(s.x - camera.x, s.y - camera.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Draw Anvil Body
    ctx.save();
    if (this.img.complete && this.img.naturalWidth > 0) {
      ctx.drawImage(this.img, screenX, screenY, this.w, this.h);
    } else {
      ctx.fillStyle = "#455a64";
      ctx.fillRect(screenX, screenY, this.w, this.h);
    }

    // Subtle magnetic aura when moving
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > 160) {
      ctx.strokeStyle = "rgba(0, 229, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX - 2, screenY - 2, this.w + 4, this.h + 4);
    }
    ctx.restore();

    // 4. Direction & Distance Beacon (HUD Radar & Targeter)
    this.drawBeacon(ctx, camera, player, screenX, screenY);
  }

  drawBeacon(ctx, camera, player, screenX, screenY) {
    const anvilMidX = this.x + this.w / 2;
    const anvilMidY = this.y + this.h / 2;
    const playerMidX = player.x + player.w / 2;
    const playerMidY = player.y + player.h / 2;

    const dx = anvilMidX - playerMidX;
    const dy = anvilMidY - playerMidY;
    const distPx = Math.hypot(dx, dy);
    const distMeters = (distPx / 10).toFixed(1) + "m";

    const isOffScreen = (
      screenX < 24 ||
      screenX > 960 - 24 - this.w ||
      screenY < 24 ||
      screenY > 540 - 24 - this.h
    );

    ctx.save();

    if (isOffScreen) {
      // OFF-SCREEN RADAR BEACON: Clamped to screen perimeter
      const cx = 480;
      const cy = 270;
      const camTargetX = anvilMidX - camera.x;
      const camTargetY = anvilMidY - camera.y;
      const angle = Math.atan2(camTargetY - cy, camTargetX - cx);

      const padX = 56;
      const padY = 46;
      const hw = 480 - padX;
      const hh = 270 - padY;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      let edgeX = cx;
      let edgeY = cy;
      if (Math.abs(cos * hh) > Math.abs(sin * hw)) {
        edgeX = cx + Math.sign(cos) * hw;
        edgeY = cy + Math.sign(cos) * hw * Math.tan(angle);
      } else {
        edgeX = cx + Math.sign(sin) * hh / Math.tan(angle);
        edgeY = cy + Math.sign(sin) * hh;
      }

      // Radar Pulse Wave
      const pulsePhase = (Date.now() % 1200) / 1200;
      ctx.strokeStyle = `rgba(255, 214, 0, ${1 - pulsePhase})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(edgeX, edgeY, 14 + pulsePhase * 18, 0, Math.PI * 2);
      ctx.stroke();

      // Badge Container
      ctx.fillStyle = "rgba(10, 22, 38, 0.92)";
      ctx.strokeStyle = "#ffd600";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#ffd600";
      ctx.shadowBlur = 10;

      const badgeW = 104;
      const badgeH = 28;
      ctx.beginPath();
      ctx.roundRect(edgeX - badgeW / 2, edgeY - badgeH / 2, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Directional Arrow Indicator
      ctx.save();
      ctx.translate(edgeX - badgeW / 2 + 14, edgeY);
      ctx.rotate(angle);
      ctx.fillStyle = "#00e5ff";
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-5, -6);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-5, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Distance & Name Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`BIGORNA ${distMeters}`, edgeX - badgeW / 2 + 25, edgeY);

    } else {
      // ON-SCREEN TACTICAL HUD: Floating Distance & Targeter above Anvil
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      // Distance tag
      ctx.fillStyle = "rgba(10, 22, 38, 0.75)";
      ctx.fillRect(screenX + this.w / 2 - 24, screenY - 20, 48, 14);
      ctx.strokeStyle = "rgba(255, 214, 0, 0.7)";
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX + this.w / 2 - 24, screenY - 20, 48, 14);

      ctx.fillStyle = "#ffd600";
      ctx.fillText(distMeters, screenX + this.w / 2, screenY - 8);

      // Mini chevron pointing down
      ctx.fillStyle = "#00e5ff";
      ctx.beginPath();
      ctx.moveTo(screenX + this.w / 2, screenY - 2);
      ctx.lineTo(screenX + this.w / 2 - 4, screenY - 6);
      ctx.lineTo(screenX + this.w / 2 + 4, screenY - 6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}
