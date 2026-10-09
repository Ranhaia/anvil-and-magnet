import { Physics } from "./physics.js";
import { sound } from "./audio.js";

export class GasTankSpecial {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.w = 36;
    this.h = 48;
    this.countdown = 2.5;
    this.img = new Image();
    this.img.src = "assets/gas_tank.png";
    this.shockwaves = [];
  }

  activate(player, camera) {
    if (this.active) return false;
    this.active = true;
    this.countdown = 2.5;
    // Spawn gas tank in front of player
    this.x = player.x + (player.facing * 120);
    this.y = player.y - 40;
    sound.playGasHiss();
    return true;
  }

  update(player, anvil, enemyManager, dt) {
    if (!this.active) return 0;

    this.countdown -= dt;
    let kills = 0;

    // Detonation Moment
    if (this.countdown <= 0) {
      this.active = false;
      sound.playExplosion();

      const gasCenter = { x: this.x + this.w / 2, y: this.y + this.h / 2 };
      const playerCenter = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
      const anvilBox = { x: anvil.x, y: anvil.y, w: anvil.w, h: anvil.h };

      // Test Anvil Blast Shield (Occlusion test)
      const shielded = Physics.segmentIntersectsBox(gasCenter, playerCenter, anvilBox);

      if (shielded) {
        // Player successfully hid behind anvil!
        anvil.spawnSparks(anvil.x + anvil.w / 2, anvil.y + anvil.h / 2);
        sound.playMetalClang(2.0);
      } else {
        // Player got caught in blast!
        player.takeDamage(50);
      }

      // Obliterate all enemies currently on screen
      for (let i = enemyManager.enemies.length - 1; i >= 0; i--) {
        const e = enemyManager.enemies[i];
        enemyManager.spawnGore(e.x + e.w / 2, e.y + e.h / 2);
        enemyManager.enemies.splice(i, 1);
        kills++;
      }

      // Add visual shockwave
      this.shockwaves.push({
        x: gasCenter.x,
        y: gasCenter.y,
        radius: 10,
        maxRadius: 450,
        alpha: 1.0
      });
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += 800 * dt;
      sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
      if (sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
      }
    }

    return kills;
  }

  draw(ctx, camera) {
    // 1. Draw Shockwaves
    this.shockwaves.forEach(sw => {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 171, 0, ${sw.alpha})`;
      ctx.lineWidth = 14 * sw.alpha;
      ctx.beginPath();
      ctx.arc(sw.x - camera.x, sw.y - camera.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 23, 68, ${sw.alpha * 0.8})`;
      ctx.lineWidth = 6 * sw.alpha;
      ctx.beginPath();
      ctx.arc(sw.x - camera.x, sw.y - camera.y, sw.radius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    if (!this.active) return;

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    // Urgent blinking countdown aura
    const blink = Math.sin(Date.now() / 60) > 0;
    if (blink) {
      ctx.fillStyle = "rgba(255, 23, 68, 0.4)";
      ctx.beginPath();
      ctx.arc(sx + this.w / 2, sy + this.h / 2, 34, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Gas Cylinder Sprite
    if (this.img.complete && this.img.naturalWidth > 0) {
      ctx.drawImage(this.img, sx, sy, this.w, this.h);
    } else {
      ctx.fillStyle = "#1976d2";
      ctx.fillRect(sx, sy, this.w, this.h);
    }

    // Timer floating text
    ctx.fillStyle = "#ffd600";
    ctx.font = "900 14px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${this.countdown.toFixed(1)}s`, sx + this.w / 2, sy - 8);
    ctx.restore();
  }
}
