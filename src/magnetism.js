import { sound } from "./audio.js";

// Magnetic Force Field and Animated Force Orbs Stream
export class Magnetism {
  constructor() {
    this.orbs = [];
    this.spawnTimer = 0;
  }

  // Calculate magnetic interaction between Player and Anvil
  calculateInteraction(player, anvil, isPull = false) {
    const pCenter = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
    const aCenter = { x: anvil.x + anvil.w / 2, y: anvil.y + anvil.h / 2 };

    const dx = aCenter.x - pCenter.x;
    const dy = aCenter.y - pCenter.y;
    const distance = Math.hypot(dx, dy);

    // Generous magnetic range (850 pixels); PULL can reach anywhere on the active screen
    const maxRange = isPull ? 1200 : 850;
    if (distance > maxRange || distance < 4) {
      return { inRange: false, distance, pCenter, aCenter };
    }

    // High responsive strength curve: minimum 0.35 even at range, peaking at 1.0
    const normalizedDist = Math.min(1.0, distance / maxRange);
    const strength = Math.max(0.35, Math.pow(1.0 - normalizedDist * 0.75, 0.75));

    // Normalized unit vector from Player to Anvil
    const dirToAnvilX = dx / distance;
    const dirToAnvilY = dy / distance;

    return {
      inRange: true,
      distance,
      strength,
      dirToAnvilX,
      dirToAnvilY,
      pCenter,
      aCenter
    };
  }

  spawnForceOrbs(interaction, isPull, dt) {
    if (!interaction.inRange) return;

    this.spawnTimer += dt;
    // Spawn force beads along the vector
    if (this.spawnTimer >= 0.035) {
      this.spawnTimer = 0;
      this.orbs.push({
        progress: isPull ? 1.0 : 0.0, // 1 = at anvil, 0 = at player
        speed: (isPull ? -1.9 : 1.9) * (1.0 + interaction.strength * 0.4),
        isPull,
        size: 3.5 + interaction.strength * 3.5
      });
      if (Math.random() < 0.25) {
        sound.playMagnetPulse(isPull);
      }
    }
  }

  update(interaction, dt) {
    // Update traveling orbs
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const orb = this.orbs[i];
      orb.progress += orb.speed * dt;
      if (orb.progress < 0 || orb.progress > 1) {
        this.orbs.splice(i, 1);
      }
    }
  }

  draw(ctx, camera, interaction, isPullActive = false, isPushActive = false) {
    const pScreen = { x: interaction.pCenter.x - camera.x, y: interaction.pCenter.y - camera.y };
    const aScreen = { x: interaction.aCenter.x - camera.x, y: interaction.aCenter.y - camera.y };

    ctx.save();

    // 1. Subtle magnetic field tether line
    if (interaction.inRange && (isPullActive || isPushActive)) {
      ctx.strokeStyle = isPullActive ? "rgba(0, 229, 255, 0.25)" : "rgba(255, 171, 0, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(pScreen.x, pScreen.y);
      ctx.lineTo(aScreen.x, aScreen.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Draw "Bolinhas de Força" (Magnetic energy beads streaming between Player and Anvil)
    this.orbs.forEach(orb => {
      const t = Math.max(0, Math.min(1, orb.progress));
      const ox = pScreen.x + (aScreen.x - pScreen.x) * t;
      const oy = pScreen.y + (aScreen.y - pScreen.y) * t;

      // Glow Aura
      ctx.fillStyle = orb.isPull ? "#00e5ff" : "#ffab00";
      ctx.shadowColor = orb.isPull ? "#00e5ff" : "#ffab00";
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.arc(ox, oy, orb.size, 0, Math.PI * 2);
      ctx.fill();

      // Bright Core
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(ox, oy, orb.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }
}
