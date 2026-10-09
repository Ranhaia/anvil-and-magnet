import { Physics } from "./physics.js";
import { sound } from "./audio.js";

class Enemy {
  constructor(x, y, levelMultiplier = 1.0) {
    this.x = x;
    this.y = y;
    this.w = 32;
    this.h = 42;
    this.vx = (Math.random() > 0.5 ? 1 : -1) * (110 * levelMultiplier);
    this.vy = 0;
    this.isGrounded = false;
    this.jumpTimer = Math.random() * 3 + 2;
    this.health = 1;
    this.levelMultiplier = levelMultiplier;
  }

  update(platforms, dt) {
    // Jump timer
    this.jumpTimer -= dt;
    if (this.jumpTimer <= 0 && this.isGrounded) {
      this.vy = -420 * this.levelMultiplier;
      this.jumpTimer = Math.random() * 4 + 2;
      this.isGrounded = false;
    }

    // Gravity
    this.vy += 1050 * dt;

    // Move X
    this.x += this.vx * dt;
    let box = { x: this.x, y: this.y, w: this.w, h: this.h };
    for (const p of platforms) {
      if (Physics.checkAABB(box, p)) {
        if (this.vx > 0) {
          this.x = p.x - this.w;
          this.vx = -this.vx; // turn around
        } else if (this.vx < 0) {
          this.x = p.x + p.w;
          this.vx = -this.vx; // turn around
        }
        box.x = this.x;
      }
    }

    // Move Y
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
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    // Monster Body
    ctx.fillStyle = this.levelMultiplier > 1.3 ? "#d50000" : "#b71c1c";
    ctx.fillRect(sx, sy, this.w, this.h);

    // Horns / Spikes
    ctx.fillStyle = "#212121";
    ctx.beginPath();
    ctx.moveTo(sx + 4, sy);
    ctx.lineTo(sx + 10, sy - 8);
    ctx.lineTo(sx + 14, sy);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(sx + 18, sy);
    ctx.lineTo(sx + 22, sy - 8);
    ctx.lineTo(sx + 28, sy);
    ctx.fill();

    // Glowing Eyes
    ctx.fillStyle = "#ffd600";
    ctx.fillRect(sx + (this.vx > 0 ? 18 : 6), sy + 12, 6, 6);
    ctx.fillRect(sx + (this.vx > 0 ? 24 : 12), sy + 12, 4, 6);
    ctx.restore();
  }
}

export class EnemyManager {
  constructor() {
    this.enemies = [];
    this.goreParticles = [];
    this.spawnTimer = 0;
  }

  spawnInitialEnemies() {
    this.enemies.push(new Enemy(600, 410, 1.0));
    this.enemies.push(new Enemy(1100, 410, 1.2));
    this.enemies.push(new Enemy(1500, 410, 1.4));
    this.enemies.push(new Enemy(-500, 410, 1.2));
    this.enemies.push(new Enemy(-1400, 410, 1.5));
  }

  spawnGore(x, y) {
    for (let i = 0; i < 18; i++) {
      this.goreParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 360,
        vy: (Math.random() - 0.7) * 320,
        size: Math.random() * 4 + 2,
        life: 0.55,
        maxLife: 0.55,
        color: Math.random() > 0.3 ? "#d50000" : "#212121"
      });
    }
  }

  update(player, anvil, platforms, distanceMeters, isBloodMoon, dt) {
    // 1. Spawning scaled by distance and Blood Moon
    this.spawnTimer += dt;
    const baseSpawnInterval = isBloodMoon ? 1.8 : 4.0;
    const distanceScale = Math.max(0.4, 1.0 - (distanceMeters / 150) * 0.4);
    const targetInterval = baseSpawnInterval * distanceScale;

    if (this.spawnTimer >= targetInterval && this.enemies.length < 16) {
      this.spawnTimer = 0;
      // Spawn just outside camera view
      const spawnSide = Math.random() > 0.5 ? 1 : -1;
      const spawnX = player.x + spawnSide * (550 + Math.random() * 150);
      const mult = 1.0 + (distanceMeters / 100) * 0.3 + (isBloodMoon ? 0.4 : 0);
      this.enemies.push(new Enemy(spawnX, 380, mult));
    }

    // 2. Update existing enemies
    // Anvil hitbox strictly 1:1 with its visual dimensions
    const anvilBox = { x: anvil.x, y: anvil.y, w: anvil.w, h: anvil.h };
    const playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };

    let killsThisFrame = 0;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(platforms, dt);

      const eBox = { x: e.x, y: e.y, w: e.w, h: e.h };

      // Check Anvil crushing Enemy - dies on any touch
      if (Physics.checkAABB(anvilBox, eBox)) {
        this.spawnGore(e.x + e.w / 2, e.y + e.h / 2);
        sound.playGore();
        sound.playMetalClang(1.2);
        this.enemies.splice(i, 1);
        player.addGasCharge(14);
        killsThisFrame++;
        continue;
      }

      // Check Enemy hitting Player
      if (Physics.checkAABB(playerBox, eBox)) {
        player.takeDamage(20);
      }

      // Cull enemies that fall off world
      if (e.y > 800) {
        this.enemies.splice(i, 1);
      }
    }

    // 3. Update Gore Particles
    for (let i = this.goreParticles.length - 1; i >= 0; i--) {
      const g = this.goreParticles[i];
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.vy += 900 * dt; // gravity on blood
      g.life -= dt;
      if (g.life <= 0) this.goreParticles.splice(i, 1);
    }

    return killsThisFrame;
  }

  draw(ctx, camera) {
    // Draw enemies
    this.enemies.forEach(e => e.draw(ctx, camera));

    // Draw gore
    ctx.save();
    this.goreParticles.forEach(g => {
      ctx.fillStyle = g.color;
      ctx.globalAlpha = g.life / g.maxLife;
      ctx.fillRect(g.x - camera.x, g.y - camera.y, g.size, g.size);
    });
    ctx.restore();
  }
}
