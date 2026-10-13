// Parallax Background Renderer with Subterranean Cavern Assets, Looping Flora & Blood Moon
// Fully optimized for 24 FPS retro-cinematic gameplay with deep layered parallax.

export class ParallaxRenderer {
  constructor() {
    // Layer 0: Sky Gradient / Deep Cavern Atmosphere
    this.skyImg = new Image();
    this.skyImg.src = "assets/environment/sky_gradient.png";

    this.cavernDeepImg = new Image();
    this.cavernDeepImg.src = "assets/cavern/cavern_bg_deep.png";

    // Layer 1: Blood Moon Disc
    this.moonImg = new Image();
    this.moonImg.src = "assets/environment/moon_blood.png";

    // Layer 2: Distant Ridge Silhouettes
    this.ridgeFarImg = new Image();
    this.ridgeFarImg.src = "assets/environment/ridge_far.png";

    // Layer 4: Gothic Cavern Mid-Arches & Rock Ceilings
    this.cavernArchesImg = new Image();
    this.cavernArchesImg.src = "assets/cavern/cavern_bg_mid_arches.png";

    // Layer 6: Mid-Ridge Rock Formations
    this.ridgeMidImg = new Image();
    this.ridgeMidImg.src = "assets/environment/ridge_mid.png";

    // Structural props
    this.stalactiteImg = new Image();
    this.stalactiteImg.src = "assets/cavern/stalactite.png";

    this.pillarImg = new Image();
    this.pillarImg.src = "assets/cavern/rock_pillar.png";

    // Layer 3: DevilBat Animated Loop (7 frames, 0..6)
    this.batFrames = [];
    for (let i = 0; i < 7; i++) {
      const img = new Image();
      img.src = `assets/enemies/devilbat/devilbat_${i}.png`;
      this.batFrames.push(img);
    }

    // Layer 5: Looping Cavern Flora & Minerals (8 frames each)
    this.crystalFrames = [];
    this.mushroomFrames = [];
    this.dripFrames = [];
    for (let i = 0; i < 8; i++) {
      const cImg = new Image();
      cImg.src = `assets/cavern/crystal_loop_${i}.png`;
      this.crystalFrames.push(cImg);

      const mImg = new Image();
      mImg.src = `assets/cavern/mushroom_loop_${i}.png`;
      this.mushroomFrames.push(mImg);

      const dImg = new Image();
      dImg.src = `assets/cavern/drip_loop_${i}.png`;
      this.dripFrames.push(dImg);
    }

    // Atmospheric bat flocks in background
    this.bats = [
      { x: 320, baseY: 90, speed: -48, scale: 0.75, animOffset: 0, sineSpeed: 2.2, sineAmp: 16 },
      { x: 740, baseY: 65, speed: -65, scale: 0.95, animOffset: 2, sineSpeed: 1.8, sineAmp: 22 },
      { x: 1180, baseY: 130, speed: -52, scale: 0.70, animOffset: 4, sineSpeed: 2.5, sineAmp: 18 },
      { x: 1620, baseY: 80, speed: -58, scale: 0.85, animOffset: 1, sineSpeed: 2.0, sineAmp: 25 },
      { x: 2100, baseY: 115, speed: -44, scale: 0.65, animOffset: 5, sineSpeed: 1.6, sineAmp: 15 }
    ];

    // Midground scenic landmarks repeating along the 1920px parallax track (ratio 0.16x)
    this.scenicCycleWidth = 1920;
    this.scenicSpots = [
      // Hanging stalactites with animated dripping water
      { type: "drip", localX: 160, y: 15, w: 28, h: 70, scale: 1.0 },
      { type: "drip", localX: 680, y: 25, w: 26, h: 65, scale: 0.9 },
      { type: "drip", localX: 1220, y: 10, w: 32, h: 80, scale: 1.1 },
      { type: "drip", localX: 1740, y: 20, w: 28, h: 70, scale: 1.0 },

      // Radiant Amethyst Crystals embedded in midground cave walls
      { type: "crystal", localX: 340, y: 290, w: 48, h: 48, color: "rgba(186, 104, 200, 0.4)", glowColor: "#ba68c8" },
      { type: "crystal", localX: 880, y: 340, w: 54, h: 54, color: "rgba(0, 229, 255, 0.45)", glowColor: "#00e5ff" },
      { type: "crystal", localX: 1440, y: 270, w: 50, h: 50, color: "rgba(186, 104, 200, 0.4)", glowColor: "#ba68c8" },

      // Bioluminescent Mushroom patches along midground shelves
      { type: "mushroom", localX: 480, y: 380, w: 52, h: 52, glowColor: "#1de9b6" },
      { type: "mushroom", localX: 1040, y: 400, w: 48, h: 48, glowColor: "#00e5ff" },
      { type: "mushroom", localX: 1600, y: 370, w: 56, h: 56, glowColor: "#1de9b6" }
    ];

    // Ambient floating bioluminescent spores & embers (40 particles)
    this.particles = [];
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * 2400,
        y: Math.random() * 540,
        size: Math.random() * 2.5 + 1.0,
        speedX: Math.random() * 16 - 8,
        speedY: Math.random() * -12 - 6,
        alpha: Math.random() * 0.65 + 0.25,
        pulseOffset: Math.random() * Math.PI * 2,
        colorType: Math.random() > 0.45 ? "cyan" : "magenta"
      });
    }
  }

  update(dt, camera) {
    // Update ambient bats with horizontal speed and wrap-around
    this.bats.forEach(b => {
      b.x += b.speed * dt;
      if (b.x < camera.x - 400) {
        b.x = camera.x + 1300 + Math.random() * 400;
        b.baseY = 50 + Math.random() * 120;
      }
    });

    // Update floating ambient spores
    this.particles.forEach(p => {
      p.x += p.speedX * dt;
      p.y += p.speedY * dt;
      if (p.y < -20) {
        p.y = 540 + Math.random() * 20;
        p.x = camera.x - 200 + Math.random() * 1360;
      }
      if (p.x < camera.x - 400) p.x = camera.x + 1100;
      if (p.x > camera.x + 1200) p.x = camera.x - 300;
    });
  }

  getBiome(distanceMeters = 0) {
    if (distanceMeters < 200) {
      return {
        id: "sapphire",
        skyGrad: ["#060913", "#0e1526", "#182236"],
        particleColors: ["#00e5ff", "#1de9b6"],
        ambientColor: null
      };
    } else if (distanceMeters < 450) {
      return {
        id: "amethyst",
        skyGrad: ["#0d0416", "#1a0b2c", "#2d1447"],
        particleColors: ["#ba68c8", "#ea80fc"],
        ambientColor: "rgba(186, 104, 200, 0.12)"
      };
    } else if (distanceMeters < 750) {
      return {
        id: "magma",
        skyGrad: ["#160700", "#270f02", "#3d1904"],
        particleColors: ["#ff9100", "#ffd600"],
        ambientColor: "rgba(255, 145, 0, 0.12)"
      };
    } else {
      return {
        id: "blood",
        skyGrad: ["#180006", "#2c000c", "#440012"],
        particleColors: ["#ff1744", "#ff5252"],
        ambientColor: "rgba(255, 23, 68, 0.16)"
      };
    }
  }

  draw(ctx, camera, time, bloodMoonFactor = 0.0, distanceMeters = 0) {
    const W = 960;
    const H = 540;
    const biome = this.getBiome(distanceMeters);

    // ==========================================
    // CAMADA 0: CÉU E PROFUNDIDADE DA CAVERNA (0.02x)
    // ==========================================
    const groundY = Math.round(400 - camera.y * 0.04);
    const grad = ctx.createLinearGradient(0, 0, 0, groundY);
    grad.addColorStop(0, biome.skyGrad[0]);
    grad.addColorStop(0.55, biome.skyGrad[1]);
    grad.addColorStop(0.92, biome.skyGrad[2]);
    grad.addColorStop(1, "#10162a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const skyOffset = ((camera.x * 0.02) % W + W) % W;
    if (this.skyImg.complete && this.skyImg.naturalWidth > 0 && !biome.ambientColor) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.drawImage(this.skyImg, -skyOffset, 0, W, groundY);
      ctx.drawImage(this.skyImg, W - skyOffset, 0, W, groundY);
      ctx.restore();
    }

    // Degradê de névoa atmosférica suave até o primeiro bloco de chão
    const fogGrad = ctx.createLinearGradient(0, groundY - 120, 0, groundY);
    fogGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    fogGrad.addColorStop(1, "rgba(10, 16, 32, 0.7)");
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, groundY - 120, W, 120);

    // Deep Cavern Vault Silhouettes (assets/cavern/cavern_bg_deep.png)
    if (this.cavernDeepImg.complete && this.cavernDeepImg.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.75;
      const deepOffset = ((camera.x * 0.03) % W + W) % W;
      const deepY = -camera.y * 0.015;
      ctx.drawImage(this.cavernDeepImg, -deepOffset, deepY, W, H);
      ctx.drawImage(this.cavernDeepImg, W - deepOffset, deepY, W, H);
      ctx.restore();
    }

    // ==========================================
    // CAMADA 1: LUA VERMELHA / NÚCLEO BIOLUMINESCENTE (0.015x)
    // ==========================================
    if (bloodMoonFactor > 0.01) {
      ctx.save();
      const moonX = W * 0.72 - ((camera.x * 0.015) % W);
      const moonY = 85 - camera.y * 0.012;
      const pulse = 1.0 + Math.sin(time * 3.5) * 0.06;

      // Atmospheric blood-red corona
      const glowGrad = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 100 * pulse);
      glowGrad.addColorStop(0, `rgba(255, 30, 60, ${bloodMoonFactor * 0.85})`);
      glowGrad.addColorStop(0.5, `rgba(255, 0, 40, ${bloodMoonFactor * 0.35})`);
      glowGrad.addColorStop(1, "rgba(255, 0, 40, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 100 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Moon Texture / Disc
      if (this.moonImg.complete && this.moonImg.naturalWidth > 0) {
        const mw = 84 * pulse;
        const mh = 84 * pulse;
        ctx.globalAlpha = Math.min(1.0, bloodMoonFactor + 0.2);
        ctx.drawImage(this.moonImg, moonX - mw / 2, moonY - mh / 2, mw, mh);
      } else {
        ctx.fillStyle = "#ff1744";
        ctx.beginPath();
        ctx.arc(moonX, moonY, 32 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cavern ambient red hue
      ctx.fillStyle = `rgba(180, 10, 30, ${bloodMoonFactor * 0.28})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // ==========================================
    // CAMADA 2: MONTANHAS DISTANTES / CRISTAS ROCHOSAS (0.05x)
    // ==========================================
    const farOffset = ((camera.x * 0.05) % W + W) % W;
    const farY = -camera.y * 0.03;
    if (this.ridgeFarImg.complete && this.ridgeFarImg.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.80;
      ctx.drawImage(this.ridgeFarImg, -farOffset, farY, W, H);
      ctx.drawImage(this.ridgeFarImg, W - farOffset, farY, W, H);
      ctx.restore();
    }

    // ==========================================
    // CAMADA 3: BANDO DE DEVILBATS EM VÔO (0.08x)
    // ==========================================
    const batFrameIdx = Math.floor(time * 12) % 7;
    this.bats.forEach(b => {
      const curFrame = (batFrameIdx + b.animOffset) % 7;
      const img = this.batFrames[curFrame];
      if (img && img.complete && img.naturalWidth > 0) {
        const screenX = b.x - camera.x * 0.08;
        const screenY = b.baseY + Math.sin(time * b.sineSpeed + b.animOffset) * b.sineAmp - camera.y * 0.04;
        const bw = 46 * b.scale;
        const bh = 34 * b.scale;
        if (screenX > -80 && screenX < W + 80) {
          ctx.save();
          ctx.globalAlpha = 0.82;
          ctx.drawImage(img, screenX, screenY, bw, bh);
          ctx.restore();
        }
      }
    });

    // ==========================================
    // CAMADA 4: ARCOS GÓTICOS E TETO DA CAVERNA (0.12x)
    // ==========================================
    const archesOffset = ((camera.x * 0.12) % W + W) % W;
    const archesY = -camera.y * 0.06;
    if (this.cavernArchesImg.complete && this.cavernArchesImg.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.drawImage(this.cavernArchesImg, -archesOffset, archesY, W, H);
      ctx.drawImage(this.cavernArchesImg, W - archesOffset, archesY, W, H);
      ctx.restore();
    }

    // ==========================================
    // CAMADA 5: ECOSSISTEMA VIVO EM LOOPING (0.16x)
    // (Gotas de estalactites, cristais brilhantes e cogumelos pulsantes)
    // ==========================================
    const midLifeScroll = camera.x * 0.16;
    const crystalFrameIdx = Math.floor(time * 10) % 8;
    const mushroomFrameIdx = Math.floor(time * 10) % 8;
    const dripFrameIdx = Math.floor(time * 8) % 8;

    this.scenicSpots.forEach(spot => {
      // Calculate wrapped screen position
      let screenX = ((spot.localX - midLifeScroll) % this.scenicCycleWidth + this.scenicCycleWidth) % this.scenicCycleWidth;
      // Center wrap window around screen [-200, 1160]
      if (screenX > W + 200) screenX -= this.scenicCycleWidth;

      if (screenX < -100 || screenX > W + 100) return;

      const screenY = spot.y - camera.y * 0.08;

      if (spot.type === "drip") {
        const img = this.dripFrames[dripFrameIdx];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.globalAlpha = 0.85;
          ctx.drawImage(img, screenX, screenY, spot.w, spot.h);
          ctx.restore();
        }
      } else if (spot.type === "crystal") {
        const img = this.crystalFrames[crystalFrameIdx];
        const pulse = 1.0 + Math.sin(time * 4 + spot.localX * 0.01) * 0.14;
        ctx.save();
        // Bioluminescent radial light glow
        const glowRadius = 36 * pulse;
        const radGrad = ctx.createRadialGradient(
          screenX + spot.w / 2, screenY + spot.h / 2, 6,
          screenX + spot.w / 2, screenY + spot.h / 2, glowRadius
        );
        radGrad.addColorStop(0, spot.color || "rgba(186, 104, 200, 0.4)");
        radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(screenX + spot.w / 2, screenY + spot.h / 2, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.globalAlpha = 0.90;
          ctx.drawImage(img, screenX, screenY, spot.w, spot.h);
        }
        ctx.restore();
      } else if (spot.type === "mushroom") {
        const img = this.mushroomFrames[mushroomFrameIdx];
        const pulse = 1.0 + Math.sin(time * 3 + spot.localX * 0.02) * 0.16;
        ctx.save();
        // Fungal bioluminescent halo
        const haloRadius = 40 * pulse;
        const radGrad = ctx.createRadialGradient(
          screenX + spot.w / 2, screenY + spot.h / 2, 6,
          screenX + spot.w / 2, screenY + spot.h / 2, haloRadius
        );
        radGrad.addColorStop(0, "rgba(0, 229, 255, 0.35)");
        radGrad.addColorStop(0.6, "rgba(29, 233, 182, 0.15)");
        radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(screenX + spot.w / 2, screenY + spot.h / 2, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.globalAlpha = 0.92;
          ctx.drawImage(img, screenX, screenY, spot.w, spot.h);
        }
        ctx.restore();
      }
    });

    // ==========================================
    // CAMADA 6: RUÍNAS ROCHOSAS MÉDIAS (0.20x)
    // ==========================================
    const midOffset = ((camera.x * 0.20) % W + W) % W;
    const midY = -camera.y * 0.10;
    if (this.ridgeMidImg.complete && this.ridgeMidImg.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(this.ridgeMidImg, -midOffset, midY, W, H);
      ctx.drawImage(this.ridgeMidImg, W - midOffset, midY, W, H);
      ctx.restore();
    }

    // ==========================================
    // CAMADA 7: ESPOROS BIOLUMINESCENTES & BRASAS FLUTUANTES (0.28x)
    // ==========================================
    ctx.save();
    this.particles.forEach(p => {
      const px = ((p.x - camera.x * 0.28) % W + W) % W;
      const py = ((p.y - camera.y * 0.12) % H + H) % H;
      const pulseAlpha = p.alpha * (0.8 + Math.sin(time * 2.5 + p.pulseOffset) * 0.2);

      ctx.globalAlpha = pulseAlpha;
      if (bloodMoonFactor > 0.4) {
        ctx.fillStyle = Math.random() > 0.3 ? "#ff3d00" : "#ff1744";
      } else {
        ctx.fillStyle = p.colorType === "cyan" ? biome.particleColors[0] : biome.particleColors[1];
      }

      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}
