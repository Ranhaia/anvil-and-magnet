// Parallax Background Renderer with Looping DevilBat and Blood Moon
export class ParallaxRenderer {
  constructor() {
    this.skyImg = new Image();
    this.skyImg.src = "assets/background_sky.png";

    // Load DevilBat animated frames (0..6)
    this.batFrames = [];
    for (let i = 0; i < 7; i++) {
      const img = new Image();
      img.src = `assets/devilbat_frame_${i}.png`;
      this.batFrames.push(img);
    }

    // Atmospheric bats flying in background
    this.bats = [
      { x: 200, y: 120, speed: -45, scale: 0.35, animOffset: 0 },
      { x: 800, y: 80, speed: -60, scale: 0.45, animOffset: 2 },
      { x: 1400, y: 160, speed: -50, scale: 0.3, animOffset: 4 }
    ];

    // Floating particles
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
      // loop around camera
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

    // --- CAMADA 0: CÉU (Velocidade 0.03x) ---
    const skyOffset = (camera.x * 0.03) % W;
    if (this.skyImg.complete && this.skyImg.naturalWidth > 0) {
      ctx.drawImage(this.skyImg, -skyOffset, 0, W, H);
      ctx.drawImage(this.skyImg, W - skyOffset, 0, W, H);
    } else {
      // Fallback celestial gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#080c16");
      grad.addColorStop(1, "#182236");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // Blood Moon Overlay Tint
    if (bloodMoonFactor > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(180, 10, 30, ${bloodMoonFactor * 0.45})`;
      ctx.fillRect(0, 0, W, H);

      // The Red Moon Disc
      const moonX = W * 0.72 - (camera.x * 0.015) % W;
      const moonY = 110 - camera.y * 0.02;
      const pulse = 1.0 + Math.sin(time * 3.5) * 0.06;

      // Glow
      const glowGrad = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 80 * pulse);
      glowGrad.addColorStop(0, `rgba(255, 30, 60, ${bloodMoonFactor * 0.8})`);
      glowGrad.addColorStop(0.5, `rgba(255, 0, 40, ${bloodMoonFactor * 0.4})`);
      glowGrad.addColorStop(1, "rgba(255, 0, 40, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 80 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = "#ff1744";
      ctx.beginPath();
      ctx.arc(moonX, moonY, 26 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // --- CAMADA 1: SILHUETAS DISTANTES & DEVILBAT (Velocidade 0.08x) ---
    ctx.save();
    const layer1Offset = (camera.x * 0.08) % 320;
    ctx.fillStyle = bloodMoonFactor > 0.5 ? "#240a12" : "#0d131f";

    // Draw procedural distant gothic spires / arches
    for (let x = -320; x < W + 320; x += 160) {
      const drawX = x - layer1Offset;
      // Spire 1
      ctx.beginPath();
      ctx.moveTo(drawX, H);
      ctx.lineTo(drawX + 30, 240);
      ctx.lineTo(drawX + 45, 180);
      ctx.lineTo(drawX + 60, 240);
      ctx.lineTo(drawX + 90, H);
      ctx.fill();

      // Arch 2
      ctx.fillRect(drawX + 90, 300, 70, H - 300);
      ctx.beginPath();
      ctx.arc(drawX + 125, 300, 35, Math.PI, 0);
      ctx.fill();
    }

    // Render Animated DevilBats in background
    const batFrameIdx = Math.floor(time * 12) % 7;
    this.bats.forEach(b => {
      const curFrame = (batFrameIdx + b.animOffset) % 7;
      const img = this.batFrames[curFrame];
      if (img && img.complete && img.naturalWidth > 0) {
        const screenX = b.x - camera.x * 0.08;
        const screenY = b.y - camera.y * 0.04;
        const w = 512 * b.scale * 0.4;
        const h = 256 * b.scale * 0.4;
        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.drawImage(img, screenX, screenY, w, h);
        ctx.restore();
      }
    });
    ctx.restore();

    // --- CAMADA 2: ESTRUTURAS MÉDIAS & NÉVOA (Velocidade 0.25x) ---
    ctx.save();
    const layer2Offset = (camera.x * 0.25) % 400;
    ctx.fillStyle = bloodMoonFactor > 0.5 ? "rgba(50, 10, 20, 0.85)" : "rgba(18, 25, 40, 0.85)";

    for (let x = -400; x < W + 400; x += 200) {
      const drawX = x - layer2Offset;
      // Massive ruined columns
      ctx.fillRect(drawX + 10, 280, 38, H - 280);
      ctx.fillRect(drawX + 2, 270, 54, 14);
      ctx.fillRect(drawX + 120, 340, 48, H - 340);
    }

    // Floating embers / dust particles
    ctx.fillStyle = bloodMoonFactor > 0.5 ? "#ff5252" : "#64b5f6";
    this.particles.forEach(p => {
      const px = p.x - camera.x * 0.3;
      const py = p.y - camera.y * 0.15;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc((px % W + W) % W, (py % H + H) % H, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}
