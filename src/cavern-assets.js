// Cavern Assets & Procedural Fake Pixel Art Engine (v2)
// Rounded organic ledges, structural cavern architecture (no floating voids), and biome variations.

export class CavernAssets {
  constructor() {
    this.textures = {};
    this.currentTextureKey = "blue_marble_tint"; // Blue Marble as preferred default!
    this.textureReady = false;

    // Load available cavern textures
    const textureFiles = {
      blue_marble_tint: "assets/cavern/blue_marble_cavern_tint.png",
      blue_marble: "assets/cavern/blue_marble.png",
      granite_tint: "assets/cavern/granite_cavern_tint.png",
      granite: "assets/cavern/granite.png",
      pebbles_tint: "assets/cavern/pebbles_cavern_tint.png",
      blue_gravel_tint: "assets/cavern/blue_gravel_cavern_tint.png"
    };

    let loadedCount = 0;
    const total = Object.keys(textureFiles).length;

    for (const [key, path] of Object.entries(textureFiles)) {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        this.textures[key] = img;
        loadedCount++;
        if (loadedCount >= total) {
          this.textureReady = true;
        }
      };
      this.textures[key] = img;
    }

    // Ambient Floating Spores / Dust Particles
    this.particles = [];
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: Math.random() * 960,
        y: Math.random() * 540,
        radius: Math.random() * 2.2 + 0.8,
        speedX: Math.random() * 18 - 9,
        speedY: Math.random() * -14 - 4,
        baseAlpha: Math.random() * 0.6 + 0.25,
        pulseOffset: Math.random() * Math.PI * 2,
        color: Math.random() > 0.4 ? "#00e5ff" : "#ba68c8"
      });
    }

    // Water Droplets
    this.drips = [];
  }

  setTexture(key) {
    if (this.textures[key]) {
      this.currentTextureKey = key;
    }
  }

  update(dt, width = 960, height = 540) {
    for (const p of this.particles) {
      p.x += p.speedX * dt;
      p.y += p.speedY * dt;
      if (p.y < 0) {
        p.y = height;
        p.x = Math.random() * width;
      }
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
    }

    for (let i = this.drips.length - 1; i >= 0; i--) {
      const d = this.drips[i];
      d.y += d.vy * dt;
      d.vy += 700 * dt;
      if (d.y > d.targetY) {
        this.drips.splice(i, 1);
      }
    }
  }

  spawnDrip(x, y, targetY) {
    this.drips.push({ x, y, targetY, vy: 50 });
  }

  // --- DRAWING: PLATFORMS WITH ORGANIC ROUNDED SHELF CAPS ---
  // Ends curve downward naturally with rock thickness, avoiding floating boxes
  drawPlatform(ctx, x, y, w, h, options = {}) {
    ctx.save();

    const radius = Math.min(options.radius ?? 14, h / 2, w / 4);
    const roundLeft = options.roundLeft ?? true;
    const roundRight = options.roundRight ?? true;
    const rL = roundLeft ? radius : 0;
    const rR = roundRight ? radius : 0;

    // 1. Build organic rounded polygon path for the ledge
    ctx.beginPath();
    ctx.moveTo(x + rL, y);
    ctx.lineTo(x + w - rR, y);

    // Right rounded drop-off
    if (roundRight) {
      ctx.quadraticCurveTo(x + w + 4, y + radius * 0.5, x + w - 2, y + h * 0.7);
      ctx.quadraticCurveTo(x + w - 6, y + h, x + w - rR, y + h);
    } else {
      ctx.lineTo(x + w, y + h);
    }

    // Bottom edge with subtle jagged rock dips
    ctx.lineTo(x + rL, y + h);

    // Left rounded drop-off
    if (roundLeft) {
      ctx.quadraticCurveTo(x - 6, y + h * 0.8, x - 4, y + radius * 0.5);
      ctx.quadraticCurveTo(x - 2, y, x + rL, y);
    } else {
      ctx.lineTo(x, y);
    }
    ctx.closePath();

    // 2. Base Dark Bedrock Fill
    ctx.fillStyle = options.baseColor || "#090d20";
    ctx.fill();

    // 3. Texture Pattern Overlay clipped to the organic path
    ctx.save();
    ctx.clip();
    const activeImg = this.textures[this.currentTextureKey];
    if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
      ctx.globalAlpha = options.textureAlpha ?? 0.52;
      const pattern = ctx.createPattern(activeImg, "repeat");
      ctx.fillStyle = pattern;
      ctx.fillRect(x - 10, y - 5, w + 20, h + 10);
    }
    ctx.restore();

    // 4. Top Bevel & Luminous Moss/Crystal Contour (Curves with the rounded edge!)
    ctx.save();
    ctx.beginPath();
    if (roundLeft) {
      ctx.moveTo(x - 2, y + radius * 0.7);
      ctx.quadraticCurveTo(x, y + 1, x + rL, y + 1);
    } else {
      ctx.moveTo(x, y + 1);
    }
    ctx.lineTo(x + w - rR, y + 1);
    if (roundRight) {
      ctx.quadraticCurveTo(x + w, y + 1, x + w + 2, y + radius * 0.7);
    }

    // Outer luminous highlight rim (Turquoise/Teal)
    ctx.lineWidth = 3;
    ctx.strokeStyle = options.edgeColor || "#1de9b6";
    ctx.stroke();

    // Secondary slate-blue bevel under the rim
    ctx.lineWidth = 2;
    ctx.strokeStyle = options.bevelColor || "#384770";
    ctx.stroke();
    ctx.restore();

    // 5. Pixelated moss drops along top contour
    ctx.fillStyle = options.mossDripColor || "#00bfa5";
    for (let bx = x + rL + 4; bx < x + w - rR - 4; bx += 14) {
      ctx.fillRect(bx, y, 4, 3);
      if (bx % 28 === 0) {
        ctx.fillRect(bx + 1, y + 3, 2, 2); // subtle moss drip
      }
    }

    // 6. Deep bottom shadow curve
    ctx.save();
    ctx.strokeStyle = "rgba(4, 3, 10, 0.85)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // --- DRAWING: SOLID SUPPORT ROCK PILLARS & ARCHES (No floating voids!) ---
  drawRockPillar(ctx, x, topY, bottomY, width = 36, options = {}) {
    ctx.save();
    const h = bottomY - topY;

    // Build naturally tapering rocky column
    ctx.beginPath();
    ctx.moveTo(x - width * 0.4, topY);
    ctx.quadraticCurveTo(x - width * 0.6, topY + h * 0.5, x - width * 0.7, bottomY);
    ctx.lineTo(x + width * 0.7, bottomY);
    ctx.quadraticCurveTo(x + width * 0.6, topY + h * 0.5, x + width * 0.4, topY);
    ctx.closePath();

    ctx.fillStyle = options.baseColor || "#060918";
    ctx.fill();

    // Texture clip
    ctx.save();
    ctx.clip();
    const activeImg = this.textures[this.currentTextureKey];
    if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
      ctx.globalAlpha = 0.4;
      const pattern = ctx.createPattern(activeImg, "repeat");
      ctx.fillStyle = pattern;
      ctx.fillRect(x - width, topY, width * 2, h);
    }
    ctx.restore();

    // Side edge contours (depth)
    ctx.strokeStyle = "#1b2545";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - width * 0.4, topY);
    ctx.quadraticCurveTo(x - width * 0.6, topY + h * 0.5, x - width * 0.7, bottomY);
    ctx.stroke();

    ctx.strokeStyle = "#04050d";
    ctx.beginPath();
    ctx.moveTo(x + width * 0.4, topY);
    ctx.quadraticCurveTo(x + width * 0.6, topY + h * 0.5, x + width * 0.7, bottomY);
    ctx.stroke();

    ctx.restore();
  }

  // --- DRAWING: ENCLOSED CAVERN FRAME (Ceiling, Walls, Undulating Floor) ---
  drawEnclosedCavernFrame(ctx, width = 960, height = 540, time = 0, options = {}) {
    ctx.save();

    // 1. Solid Massive Ceiling Vault with Stalactites
    this.drawPlatform(ctx, -20, -10, width + 40, 55, {
      ...options,
      roundLeft: false,
      roundRight: false,
      edgeColor: "#223157",
      bevelColor: "#11182c"
    });

    // Hanging Stalactites along the ceiling
    const ceilingStalactites = [
      { x: 120, w: 24, h: 72, drip: true },
      { x: 260, w: 32, h: 96, drip: false },
      { x: 420, w: 20, h: 60, drip: true },
      { x: 580, w: 36, h: 104, drip: false },
      { x: 740, w: 28, h: 84, drip: true },
      { x: 880, w: 22, h: 68, drip: false }
    ];
    ceilingStalactites.forEach(s => {
      this.drawStalactite(ctx, s.x, 45, s.w, s.h, s.drip, time);
    });

    // 2. Solid Cavern Left Wall with Cave Arch Mouth
    ctx.fillStyle = "#070b1a";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(70, 0);
    ctx.quadraticCurveTo(110, 160, 50, 270);
    ctx.quadraticCurveTo(120, 380, 80, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // 3. Solid Cavern Right Wall with Buttress
    ctx.beginPath();
    ctx.moveTo(width, 0);
    ctx.lineTo(width - 70, 0);
    ctx.quadraticCurveTo(width - 120, 180, width - 60, 310);
    ctx.quadraticCurveTo(width - 130, 420, width - 90, height);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // 4. Solid Continuous Bedrock Floor (Undulating, grounded)
    this.drawPlatform(ctx, -20, height - 75, width + 40, 95, {
      ...options,
      roundLeft: false,
      roundRight: false,
      radius: 0
    });

    ctx.restore();
  }

  // --- DRAWING: BIOLUMINESCENT MUSHROOMS WITH SMOOTH PULSE ---
  drawMushroom(ctx, x, y, scale = 1.0, time = 0, options = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const glowIntensity = options.glowIntensity ?? 1.2;
    const pulseSpeed = options.pulseSpeed ?? 2.8;
    const pulse = 0.88 + Math.sin(time * pulseSpeed) * 0.22;

    // Glowing Radial Aura (Alpha Screen mode)
    if (glowIntensity > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const rad = 46 * pulse * glowIntensity;
      const glowGrad = ctx.createRadialGradient(0, -18, 4, 0, -18, rad);
      glowGrad.addColorStop(0, "rgba(0, 229, 255, 0.85)");
      glowGrad.addColorStop(0.35, "rgba(0, 180, 216, 0.4)");
      glowGrad.addColorStop(1, "rgba(0, 180, 216, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, -18, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Curved Stalk
    ctx.fillStyle = "#121a36";
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.quadraticCurveTo(-5, -12, -2, -18);
    ctx.lineTo(2, -18);
    ctx.quadraticCurveTo(5, -12, 3, 0);
    ctx.closePath();
    ctx.fill();

    // Stalk spine highlight
    ctx.fillStyle = "#273663";
    ctx.fillRect(-1, -16, 2, 14);

    // Bioluminescent Cap Underbelly
    ctx.fillStyle = "#005b64";
    ctx.beginPath();
    ctx.ellipse(0, -18, 14, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main Luminous Cyan Cap
    ctx.fillStyle = "#00e5ff";
    ctx.beginPath();
    ctx.arc(0, -19, 13, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();

    // Bright White-Cyan Top Glaze
    ctx.fillStyle = "#e0f7fa";
    ctx.beginPath();
    ctx.arc(0, -21, 9, Math.PI * 1.1, Math.PI * 1.9, false);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#e0f7fa";
    ctx.stroke();

    // Spore Spots on cap
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-6, -24, 2, 2);
    ctx.fillRect(4, -23, 2, 2);
    ctx.fillRect(-1, -27, 3, 2);

    ctx.restore();
  }

  drawMushroomCluster(ctx, x, y, time = 0, options = {}) {
    this.drawMushroom(ctx, x, y, 1.15, time, options);
    this.drawMushroom(ctx, x - 13, y, 0.75, time + 1.2, options);
    this.drawMushroom(ctx, x + 14, y, 0.6, time + 2.4, options);
  }

  // --- DRAWING: AMETHYST CRYSTALS WITH SPARKLE LOOP ---
  drawCrystalCluster(ctx, x, y, scale = 1.0, time = 0, options = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const glowIntensity = options.glowIntensity ?? 1.2;
    const glintCycle = (time * 1.6) % Math.PI;
    const glintAlpha = Math.pow(Math.sin(glintCycle), 14);

    if (glowIntensity > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const rad = 38 * glowIntensity;
      const glowGrad = ctx.createRadialGradient(0, -14, 2, 0, -14, rad);
      glowGrad.addColorStop(0, "rgba(224, 64, 251, 0.75)");
      glowGrad.addColorStop(0.4, "rgba(156, 39, 176, 0.3)");
      glowGrad.addColorStop(1, "rgba(156, 39, 176, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, -14, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const drawShard = (ox, oy, w, h, tiltAngle, baseColor, litColor) => {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(tiltAngle);

      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.lineTo(0, -h);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = litColor;
      ctx.beginPath();
      ctx.moveTo(0, -h);
      ctx.lineTo(w / 2, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#f8bbd0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -h);
      ctx.lineTo(0, 0);
      ctx.stroke();

      if (glintAlpha > 0.05) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = `rgba(255, 255, 255, ${glintAlpha * 0.95})`;
        ctx.fillRect(-1, -h + 2, 3, 3);
        ctx.restore();
      }

      ctx.restore();
    };

    drawShard(0, 0, 11, 30, -0.06, "#4a148c", "#ba68c8");
    drawShard(-8, 0, 8, 21, -0.36, "#311b92", "#9c27b0");
    drawShard(7, 0, 8, 23, 0.29, "#4a148c", "#ab47bc");
    drawShard(-1, 0, 6, 13, 0.12, "#6a1b9a", "#ce93d8");

    ctx.restore();
  }

  // --- DRAWING: STALACTITES (Teto) ---
  drawStalactite(ctx, x, y, w = 18, h = 48, hasDrip = false, time = 0) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = "#0a0e22";
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(0, h);
    ctx.lineTo(w / 2, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#192245";
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(0, h);
    ctx.lineTo(-w / 6, 0);
    ctx.closePath();
    ctx.fill();

    if (hasDrip) {
      const dropCycle = (time * 1.3) % 3.0;
      if (dropCycle < 2.4) {
        const dropSize = (dropCycle / 2.4) * 2.8;
        ctx.fillStyle = "#00e5ff";
        ctx.beginPath();
        ctx.arc(0, h + dropSize, dropSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // --- DRAWING: SPORES & ATMOSPHERE ---
  drawSpores(ctx, time = 0) {
    ctx.save();
    for (const p of this.particles) {
      const alpha = p.baseAlpha + Math.sin(time * 2 + p.pulseOffset) * 0.2;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0.1, Math.min(1.0, alpha));
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.radius, p.radius);
    }
    ctx.restore();
  }

  // --- DRAWING: DYNAMIC FAKE TORCH LIGHT ---
  drawTorchLight(ctx, lightX, lightY, radius = 220, width = 960, height = 540) {
    ctx.save();
    const darknessCanvas = document.createElement("canvas");
    darknessCanvas.width = width;
    darknessCanvas.height = height;
    const dctx = darknessCanvas.getContext("2d");

    // Deep ambient night veil
    dctx.fillStyle = "rgba(4, 3, 12, 0.7)";
    dctx.fillRect(0, 0, width, height);

    // Carve luminous hole
    dctx.globalCompositeOperation = "destination-out";
    const lightGrad = dctx.createRadialGradient(lightX, lightY, 25, lightX, lightY, radius);
    lightGrad.addColorStop(0, "rgba(0, 0, 0, 1.0)");
    lightGrad.addColorStop(0.65, "rgba(0, 0, 0, 0.65)");
    lightGrad.addColorStop(1, "rgba(0, 0, 0, 0.0)");
    dctx.fillStyle = lightGrad;
    dctx.beginPath();
    dctx.arc(lightX, lightY, radius, 0, Math.PI * 2);
    dctx.fill();

    ctx.drawImage(darknessCanvas, 0, 0);
    ctx.restore();
  }
}
