// Parallax Background Renderer with High-Def Art, Looping DevilBats and Blood Moon
export class ParallaxRenderer {
  constructor() {
    this.skyImg = new Image();
    this.skyImg.src = "assets/environment/sky_gradient.png";

    this.ridgeFarImg = new Image();
    this.ridgeFarImg.src = "assets/environment/ridge_far.png";

    this.ridgeMidImg = new Image();
    this.ridgeMidImg.src = "assets/environment/ridge_mid.png";

    this.moonImg = new Image();
    this.moonImg.src = "assets/environment/moon_blood.png";

    // Load DevilBat animated frames (0..6)
    this.batFrames = [];
    for (let i = 0; i < 7; i++) {
      const img = new Image();
      img.src = `assets/enemies/devilbat/devilbat_${i}.png`;
      this.batFrames.push(img);
    }

    // Atmospheric bats flying in background
    this.bats = [
      { x: 300, y: 120, speed: -45, scale: 0.8, animOffset: 0 },
      { x: 800, y: 80, speed: -60, scale: 1.0, animOffset: 2 },
      { x: 1400, y: 160, speed: -50, scale: 0.7, animOffset: 4 }
    ];

    // Floating particles (dust & embers)
    this.particles = [];
    for (let i = 0; i < 35; i++) {
      this.particles.push({
        x: Math.random() * 2000,
        y: Math.random() * 540,
        size: Math.random() * 2.5 + 1,
        speedX: Math.random() * 15 - 7.5,
        speedY: Math.random() * -10 - 5,
        alpha: Math.random() * 0.6 + 0.2
      });
    }
  }

  update(dt, camera) {
    // Update ambient bats
    this.bats.forEach(b => {
      b.x += b.speed * dt;
      if (b.x < camera.x - 300) {
        b.x = camera.x + 1200 + Math.random() * 400;
        b.y = 60 + Math.random() * 140;
      }
    });

    // Update floating ambient particles
    this.particles.forEach(p => {
      p.x += p.speedX * dt;
      p.y += p.speedY * dt;
      if (p.y < 0) {
        p.y = 540;
        p.x = camera.x + Math.random() * 960;
      }
    });
  }

  draw(ctx, camera, time, bloodMoonFactor = 0.0) {
    const W = 960;
    const H = 540;

    // --- CAMADA 0: CÉU (Velocidade 0.02x) ---
    const skyOffset = (camera.x * 0.02) % W;
    if (this.skyImg.complete && this.skyImg.naturalWidth > 0) {
      ctx.drawImage(this.skyImg, -skyOffset, 0, W, H);
      ctx.drawImage(this.skyImg, W - skyOffset, 0, W, H);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#080c16");
      grad.addColorStop(1, "#182236");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // --- CAMADA 1: LUA VERMELHA (Blood Moon) ---
    if (bloodMoonFactor > 0.01) {
      ctx.save();
      const moonX = W * 0.72 - (camera.x * 0.01) % W;
      const moonY = 85 - camera.y * 0.015;
      const pulse = 1.0 + Math.sin(time * 3.5) * 0.06;

      // Glow halo
      const glowGrad = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 90 * pulse);
      glowGrad.addColorStop(0, `rgba(255, 30, 60, ${bloodMoonFactor * 0.85})`);
      glowGrad.addColorStop(0.5, `rgba(255, 0, 40, ${bloodMoonFactor * 0.35})`);
      glowGrad.addColorStop(1, "rgba(255, 0, 40, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 90 * pulse, 0, Math.PI * 2);
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

      // Red atmosphere tint
      ctx.fillStyle = `rgba(180, 10, 30, ${bloodMoonFactor * 0.35})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // --- CAMADA 2: MONTANHAS DISTANTES (RIDGE FAR - 0.05x) ---
    const farOffset = (camera.x * 0.05) % W;
    if (this.ridgeFarImg.complete && this.ridgeFarImg.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(this.ridgeFarImg, -farOffset, 0, W, H);
      ctx.drawImage(this.ridgeFarImg, W - farOffset, 0, W, H);
      ctx.restore();
    }

    // --- CAMADA 3: DEVILBATS VOANDO NO CÉU (0.09x) ---
    const batFrameIdx = Math.floor(time * 12) % 7;
    this.bats.forEach(b => {
      const curFrame = (batFrameIdx + b.animOffset) % 7;
      const img = this.batFrames[curFrame];
      if (img && img.complete && img.naturalWidth > 0) {
        const screenX = b.x - camera.x * 0.09;
        const screenY = b.y - camera.y * 0.03;
        const bw = 48 * b.scale;
        const bh = 36 * b.scale;
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.drawImage(img, screenX, screenY, bw, bh);
        ctx.restore();
      }
    });

    // --- CAMADA 4: RUÍNAS MÉDIAS (RIDGE MID - 0.15x) ---
    const midOffset = (camera.x * 0.15) % W;
    if (this.ridgeMidImg.complete && this.ridgeMidImg.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.drawImage(this.ridgeMidImg, -midOffset, 0, W, H);
      ctx.drawImage(this.ridgeMidImg, W - midOffset, 0, W, H);
      ctx.restore();
    }

    // --- CAMADA 5: PARTÍCULAS / BRASAS FLUTUANTES ---
    ctx.save();
    ctx.fillStyle = bloodMoonFactor > 0.5 ? "#ff5252" : "#00e5ff";
    this.particles.forEach(p => {
      const px = p.x - camera.x * 0.25;
      const py = p.y - camera.y * 0.1;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc((px % W + W) % W, (py % H + H) % H, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}
