// Animated Collectibles Manager — Scrap Coins & Soul Orbs
import { Physics } from "./physics.js";
import { sound } from "./audio.js";

export class CollectiblesManager {
  constructor() {
    this.coinStrip = new Image();
    this.coinStrip.src = "assets/collectibles/scrap_coin_strip.png";

    this.soulOrbStrip = new Image();
    this.soulOrbStrip.src = "assets/fx/soul_orb_strip.png";

    this.sparkles = [];
  }

  update(collectibles, player, dt, time) {
    let collectedPoints = 0;
    let gasRecovered = 0;

    // Player bounding box for collection
    const pBox = {
      x: player.x,
      y: player.y,
      w: player.w,
      h: player.h
    };

    // Update Sparkle particles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const sp = this.sparkles[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= dt;
      if (sp.life <= 0) {
        this.sparkles.splice(i, 1);
      }
    }

    // Check overlaps
    for (let i = 0; i < collectibles.length; i++) {
      const item = collectibles[i];
      if (item.collected) continue;

      const bobY = item.y + Math.sin(time * 5 + item.x * 0.05) * 4;
      const itemBox = {
        x: item.x - 10,
        y: bobY - 10,
        w: 20,
        h: 20
      };

      if (Physics.checkAABB(pBox, itemBox)) {
        item.collected = true;
        this.spawnCollectionSparkles(item.x, bobY, item.type === "soul_orb" ? "#00e5ff" : "#ffd600");
        sound.playPowerup();

        if (item.type === "coin") {
          collectedPoints += 75;
        } else if (item.type === "soul_orb") {
          collectedPoints += 150;
          gasRecovered += 22;
        }
      }
    }

    return { points: collectedPoints, gas: gasRecovered };
  }

  spawnCollectionSparkles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 120 + Math.random() * 80;
      this.sparkles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 2,
        life: 0.35,
        maxLife: 0.35
      });
    }
  }

  draw(ctx, collectibles, camera, time) {
    const frameIdx = Math.floor(time * 10) % 4;
    const fw = 16;
    const fh = 16;

    collectibles.forEach(item => {
      if (item.collected) return;

      const screenX = item.x - camera.x;
      const bobY = item.y + Math.sin(time * 5 + item.x * 0.05) * 4;
      const screenY = bobY - camera.y;

      // Frustum culling
      if (screenX < -32 || screenX > 992 || screenY < -32 || screenY > 572) {
        return;
      }

      ctx.save();
      const img = item.type === "soul_orb" ? this.soulOrbStrip : this.coinStrip;

      if (img.complete && img.naturalWidth > 0) {
        // Draw sprite from strip
        ctx.drawImage(img, frameIdx * fw, 0, fw, fh, screenX - 10, screenY - 10, 20, 20);
      } else {
        // Fallback pulsing dot
        ctx.fillStyle = item.type === "soul_orb" ? "#00e5ff" : "#ffd700";
        ctx.beginPath();
        ctx.arc(screenX, screenY, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bioluminescent Glow halo
      ctx.shadowBlur = 8;
      ctx.shadowColor = item.type === "soul_orb" ? "#00e5ff" : "#ffea00";
      ctx.restore();
    });

    // Draw Sparkles
    this.sparkles.forEach(sp => {
      const screenX = sp.x - camera.x;
      const screenY = sp.y - camera.y;
      const alpha = Math.max(0, sp.life / sp.maxLife);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = sp.color;
      ctx.shadowColor = sp.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(screenX, screenY, sp.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}
