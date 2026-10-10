import { Physics } from "./physics.js";
import { sound } from "./audio.js";

class Enemy {
  constructor(x, y, levelMultiplier = 1.0) {
    this.x = x;
    this.y = y;
    this.w = 34;
    this.h = 44;
    this.vx = (Math.random() > 0.5 ? 1 : -1) * (110 * levelMultiplier);
    this.vy = 0;
    this.facing = this.vx >= 0 ? 1 : -1;
    this.isGrounded = false;
    this.jumpTimer = Math.random() * 3 + 2;
    this.health = 1;
    this.levelMultiplier = levelMultiplier;
    this.type = levelMultiplier > 1.25 ? "null" : "monstrenga";
    this.animTime = Math.random() * 10;
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
    if (Math.abs(this.vx) > 5) {
      this.facing = this.vx > 0 ? 1 : -1;
      this.animTime += dt * 10;
    }

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

  draw(ctx, camera, isBloodMoon, framesMap) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    let frames = framesMap ? framesMap.monstrenga : null;
    if (isBloodMoon && framesMap) {
      frames = framesMap.red;
    } else if (this.type === "null" && framesMap) {
      frames = framesMap.null;
    }

    ctx.save();
    ctx.translate(sx + this.w / 2, sy + this.h / 2);
    ctx.scale(this.facing, 1);

    if (frames && frames.length > 0) {
      const idx = Math.floor(this.animTime) % frames.length;
      const frame = frames[idx];
      if (frame && frame.complete && frame.naturalWidth > 0) {
        ctx.drawImage(frame, -24, -28, 48, 56);
        ctx.restore();
        return;
      }
    }

    // Fallback Monster Shape
    ctx.fillStyle = isBloodMoon ? "#d50000" : (this.type === "null" ? "#212121" : "#8e24aa");
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);

    // Glowing Eyes
    ctx.fillStyle = isBloodMoon ? "#ff1744" : "#ffd600";
    ctx.fillRect(4, -8, 6, 6);
    ctx.fillRect(12, -8, 4, 6);
    ctx.restore();
  }
}

export class EnemyManager {
  constructor() {
    this.enemies = [];
    this.goreParticles = [];
    this.spawnTimer = 0;

    // Preload monster sprite frames
    this.frames = {
      monstrenga: [
        "Sprite_asset_56.png",
        "Sprite_asset_34.png",
        "Sprite_asset_48.png",
        "Sprite_asset_54.png",
        "Sprite_asset_36.png",
        "Sprite_asset_40.png",
        "Sprite_asset_41.png"
      ].map(fn => {
        const img = new Image();
        img.src = `assets/enemies/monstrenga/${fn}`;
        return img;
      }),
      null: [
        "Sprite_asset_44.png",
        "Sprite_asset_27.png",
        "Sprite_asset_46.png",
        "Sprite_asset_58.png",
        "Sprite_asset_63.png",
        "Sprite_asset_35.png",
        "Sprite_asset_42.png"
      ].map(fn => {
        const img = new Image();
        img.src = `assets/enemies/null/${fn}`;
        return img;
      }),
      red: [
        "Sprite_asset_56.png",
        "Sprite_asset_34.png",
        "Sprite_asset_48.png",
        "Sprite_asset_54.png",
        "Sprite_asset_36.png",
        "Sprite_asset_40.png",
        "Sprite_asset_41.png"
      ].map(fn => {
        const img = new Image();
        img.src = `assets/enemies/red/${fn}`;
        return img;
      })
    };
  }

  spawnInitialEnemies() {
    // Only spawn well ahead of opening screen (camera starts around x ≈ -230..730)
    this.enemies.push(new Enemy(980, 356, 1.0));
    this.enemies.push(new Enemy(1360, 356, 1.2));
    this.enemies.push(new Enemy(1820, 356, 1.4));
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

  update(player, anvil, platforms, distanceMeters, isBloodMoon, dt, camera = null) {
    // 1. Spawning scaled by distance and Blood Moon
    this.spawnTimer += dt;
    const baseSpawnInterval = isBloodMoon ? 1.8 : 3.8;
    const distanceScale = Math.max(0.4, 1.0 - (distanceMeters / 150) * 0.4);
    const targetInterval = baseSpawnInterval * distanceScale;

    if (this.spawnTimer >= targetInterval && this.enemies.length < 14) {
      this.spawnTimer = 0;
      // Guaranteed off-screen spawning: always at least 120px past right edge of screen
      const minOffScreenX = camera ? camera.x + 960 + 120 : player.x + 750;
      const spawnX = minOffScreenX + Math.random() * 240;

      // Align spawn height to underlying platform if available
      let spawnY = 356;
      for (const p of platforms) {
        if (p.type === "ground" && spawnX >= p.x && spawnX <= p.x + p.w) {
          spawnY = p.y - 44;
          break;
        }
      }

      const mult = 1.0 + (distanceMeters / 100) * 0.3 + (isBloodMoon ? 0.4 : 0);
      this.enemies.push(new Enemy(spawnX, spawnY, mult));
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

      // Cull enemies that fall off world or are left far behind the screen
      const leftCullBound = camera ? camera.x - 350 : player.x - 650;
      if (e.y > 850 || e.x < leftCullBound) {
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

  draw(ctx, camera, isBloodMoon = false) {
    // Draw enemies with animated sprite frames
    this.enemies.forEach(e => e.draw(ctx, camera, isBloodMoon, this.frames));

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
