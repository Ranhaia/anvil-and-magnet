/**
 * Atmospheric Lightning Shader & Thunderstorm FX
 * Runs procedural electric arcs, lightning forks, and ambient sky illumination
 * behind the cavern silhouettes and the arcade cabinet.
 */

export class LightningShader {
  constructor(canvasId = "sky-shader-canvas") {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");

    this.bolts = [];
    this.skyFlash = 0; // 0 to 1 intensity
    this.ambientFlash = 0;
    this.nextStrikeTime = 1.5; // seconds until first strike
    this.time = 0;

    this.resize();
    window.addEventListener("resize", () => this.resize());

    // Sound integration when available
    this.onThunder = null;

    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    if (!this.canvas) return;
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  triggerStrike() {
    // Generate 1 or 2 lightning bolts originating from the clouds
    const numBolts = Math.random() < 0.35 ? 2 : 1;
    this.skyFlash = Math.random() * 0.4 + 0.6; // strong flash

    for (let b = 0; b < numBolts; b++) {
      const startX = Math.random() * (this.width * 0.7) + this.width * 0.15;
      const startY = Math.random() * 40;
      // Target towards lower anvil silhouettes
      const endX = startX + (Math.random() - 0.5) * (this.width * 0.4);
      const endY = this.height * (Math.random() * 0.35 + 0.45);

      const segments = this.generateBoltSegments(startX, startY, endX, endY, 7);
      this.bolts.push({
        segments,
        branches: this.generateBranches(segments),
        life: 1.0,
        decay: Math.random() * 0.04 + 0.03, // lingers 200-350ms
        color: Math.random() < 0.6 ? "#00e5ff" : "#b388ff", // cyan or plasma violet
      });
    }

    if (this.onThunder) {
      this.onThunder();
    }
  }

  generateBoltSegments(x1, y1, x2, y2, depth) {
    const segments = [];
    const points = [{ x: x1, y: y1 }, { x: x2, y: y2 }];

    for (let i = 0; i < depth; i++) {
      const newPoints = [];
      for (let j = 0; j < points.length - 1; j++) {
        const p1 = points[j];
        const p2 = points[j + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const normalX = -(p2.y - p1.y) / dist;
        const normalY = (p2.x - p1.x) / dist;

        const displacement = (Math.random() - 0.5) * dist * 0.45;
        const displacedMid = {
          x: midX + normalX * displacement,
          y: midY + normalY * displacement,
        };

        newPoints.push(p1);
        newPoints.push(displacedMid);
      }
      newPoints.push(points[points.length - 1]);
      points.length = 0;
      points.push(...newPoints);
    }

    for (let i = 0; i < points.length - 1; i++) {
      segments.push({
        x1: points[i].x,
        y1: points[i].y,
        x2: points[i + 1].x,
        y2: points[i + 1].y,
      });
    }

    return segments;
  }

  generateBranches(mainSegments) {
    const branches = [];
    // Pick 3-5 random junctions to fork off
    const branchCount = Math.floor(Math.random() * 3) + 2;
    for (let b = 0; b < branchCount; b++) {
      const idx = Math.floor(Math.random() * (mainSegments.length - 10)) + 5;
      const seg = mainSegments[idx];
      const startX = seg.x1;
      const startY = seg.y1;
      const angle = (Math.random() - 0.5) * 1.2 + 0.8; // fork outwards
      const len = Math.random() * 80 + 40;
      const endX = startX + Math.sin(angle) * len;
      const endY = startY + Math.cos(angle) * len;

      branches.push(this.generateBoltSegments(startX, startY, endX, endY, 3));
    }
    return branches;
  }

  update(dt) {
    this.time += dt;

    // Decay sky flash
    if (this.skyFlash > 0) {
      this.skyFlash = Math.max(0, this.skyFlash - dt * 4.5);
    }

    // Update active bolts
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const bolt = this.bolts[i];
      bolt.life -= bolt.decay * (dt * 60);
      if (bolt.life <= 0) {
        this.bolts.splice(i, 1);
      }
    }

    // Schedule next strike
    this.nextStrikeTime -= dt;
    if (this.nextStrikeTime <= 0) {
      this.triggerStrike();
      // Next strike in 3.5 to 8 seconds
      this.nextStrikeTime = Math.random() * 4.5 + 3.0;
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 1. Draw Night Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (this.skyFlash > 0.05) {
      // Flashed sky (electric cyan/white ambient surge)
      const f = this.skyFlash;
      skyGrad.addColorStop(0, `rgb(${Math.floor(12 + f * 120)}, ${Math.floor(20 + f * 170)}, ${Math.floor(40 + f * 215)})`);
      skyGrad.addColorStop(0.5, `rgb(${Math.floor(18 + f * 160)}, ${Math.floor(32 + f * 200)}, ${Math.floor(55 + f * 200)})`);
      skyGrad.addColorStop(1, `rgb(${Math.floor(8 + f * 80)}, ${Math.floor(14 + f * 110)}, ${Math.floor(28 + f * 130)})`);
    } else {
      // Normal dark atmospheric cavern night
      skyGrad.addColorStop(0, "#060912");
      skyGrad.addColorStop(0.45, "#0d1624");
      skyGrad.addColorStop(1, "#080c14");
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Draw Lightning Bolts with Glowing Passes
    if (this.bolts.length > 0) {
      ctx.save();
      for (const bolt of this.bolts) {
        const alpha = Math.max(0, Math.min(1, bolt.life));

        // Draw branches
        for (const branch of bolt.branches) {
          ctx.beginPath();
          for (let i = 0; i < branch.length; i++) {
            const seg = branch[i];
            if (i === 0) ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
          }
          ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.6})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Pass A: Outer Electric Aura Glow
        ctx.beginPath();
        for (let i = 0; i < bolt.segments.length; i++) {
          const seg = bolt.segments[i];
          if (i === 0) ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.strokeStyle = bolt.color;
        ctx.lineWidth = 14;
        ctx.shadowColor = bolt.color;
        ctx.shadowBlur = 30;
        ctx.globalAlpha = alpha * 0.4;
        ctx.stroke();

        // Pass B: Mid Intense Glow
        ctx.lineWidth = 5;
        ctx.globalAlpha = alpha * 0.8;
        ctx.strokeStyle = "#e0f7fa";
        ctx.stroke();

        // Pass C: Hot Core (Pure White Core)
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  animate(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.animate);
  }
}
