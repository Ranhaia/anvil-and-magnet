// Infinite Procedural Runner World Map with Modular Tile Rendering & Biome Transitions
// Continuous Subterranean Bedrock Fill (No void beneath the ground!)
// Main Ground at Y=400 with lush top vegetation & cliff edges
// Elevated Platforms use sleek Stone Slabs (type: "stone_slab") with NO grass
// Pillars use carved rock architecture with stone capitals
// Hazards include animated Water in carved basins & Spikes
import { ChunkGenerator, CHUNK_WIDTH } from "./chunks.js?v=24";
import { CollectiblesManager } from "./collectibles.js";

export class GameMap {
  constructor() {
    this.chunkGen = new ChunkGenerator();
    this.collectiblesManager = new CollectiblesManager();

    // Sprite Cache
    this.sprites = {
      // Classical Stone & Metal Tiles
      stoneTop: this.loadImage("assets/tiles/tile_stone_top.png"),
      stoneMid: this.loadImage("assets/tiles/tile_stone_mid.png"),
      stoneLeft: this.loadImage("assets/tiles/tile_stone_left.png"),
      stoneRight: this.loadImage("assets/tiles/tile_stone_right.png"),
      stoneBot: this.loadImage("assets/tiles/tile_stone_bot.png"),
      metalBeam: this.loadImage("assets/tiles/tile_metal_beam.png"),
      metalPost: this.loadImage("assets/tiles/tile_metal_post.png"),
      spikes: this.loadImage("assets/tiles/tile_spikes.png"),

      // Cavern Assets
      rockPillar: this.loadImage("assets/cavern/rock_pillar.png"),
      stalactite: this.loadImage("assets/cavern/stalactite.png"),

      // Environment props
      sanctuaryPillar: this.loadImage("assets/environment/sanctuary_pillar.png"),
      crystalActive: this.loadImage("assets/environment/crystal_active.png"),
      fortuneAltar: this.loadImage("assets/environment/fortune_altar.png"),
      decoPillar: this.loadImage("assets/environment/deco_pillar.png")
    };

    // 8-Frame Animated Loops for Living Cavern Ecosystem
    this.crystalFrames = [];
    this.mushroomFrames = [];
    this.dripFrames = [];
    for (let i = 0; i < 8; i++) {
      this.crystalFrames.push(this.loadImage(`assets/cavern/crystal_loop_${i}.png`));
      this.mushroomFrames.push(this.loadImage(`assets/cavern/mushroom_loop_${i}.png`));
      this.dripFrames.push(this.loadImage(`assets/cavern/drip_loop_${i}.png`));
    }

    // World State
    this.chunks = [];
    this.platforms = [];
    this.hazards = [];
    this.collectibles = [];
    this.sanctuaries = [];
    this.props = [];
    this.upgrades = [];

    this.nextChunkIndex = 0;
    this.furthestX = -320;

    // Generate Initial World (from X = -320 to X ≈ 1600)
    for (let i = 0; i < 4; i++) {
      this.generateNextChunk(0);
    }
  }

  loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  // Variações de Arte e Cores por Distância (4 Biomas Progressivos)
  getBiome(distanceMeters = 0) {
    if (distanceMeters < 200) {
      return {
        id: "sapphire_cavern",
        name: "Caverna de Safira",
        waterSurface: "#00e5ff",
        waterDeep: "#006064",
        waterGlow: "rgba(0, 229, 255, 0.45)",
        primaryGlow: "#00e5ff",
        accentGlow: "#1de9b6",
        bedrockTop: "#10162a",
        bedrockBot: "#04060c",
        ambientTint: null
      };
    } else if (distanceMeters < 450) {
      return {
        id: "amethyst_grotto",
        name: "Gruta Ametista",
        waterSurface: "#ba68c8",
        waterDeep: "#4a148c",
        waterGlow: "rgba(186, 104, 200, 0.5)",
        primaryGlow: "#ba68c8",
        accentGlow: "#ea80fc",
        bedrockTop: "#180e28",
        bedrockBot: "#080310",
        ambientTint: "rgba(186, 104, 200, 0.12)"
      };
    } else if (distanceMeters < 750) {
      return {
        id: "magma_vault",
        name: "Forja de Titã",
        waterSurface: "#ff9100",
        waterDeep: "#e65100",
        waterGlow: "rgba(255, 145, 0, 0.5)",
        primaryGlow: "#ff9100",
        accentGlow: "#ffd600",
        bedrockTop: "#241006",
        bedrockBot: "#0a0401",
        ambientTint: "rgba(255, 145, 0, 0.12)"
      };
    } else {
      return {
        id: "abyssal_blood",
        name: "Abismo da Lua de Sangue",
        waterSurface: "#ff1744",
        waterDeep: "#b71c1c",
        waterGlow: "rgba(255, 23, 68, 0.55)",
        primaryGlow: "#ff1744",
        accentGlow: "#ff5252",
        bedrockTop: "#22040c",
        bedrockBot: "#090003",
        ambientTint: "rgba(255, 23, 68, 0.18)"
      };
    }
  }

  generateNextChunk(distanceMeters = 0) {
    const chunk = this.chunkGen.generateChunk(this.nextChunkIndex, this.furthestX, distanceMeters);
    this.chunks.push(chunk);

    // Accumulate colliders, hazards, sanctuaries and props
    this.platforms.push(...chunk.platforms);
    this.hazards.push(...chunk.hazards);
    this.collectibles.push(...chunk.collectibles);
    this.sanctuaries.push(...chunk.sanctuaries);
    this.props.push(...chunk.props);
    if (chunk.upgrades) {
      this.upgrades.push(...chunk.upgrades);
    }

    this.nextChunkIndex++;
    this.furthestX += CHUNK_WIDTH;
  }

  getColliders() {
    return this.platforms;
  }

  getHazards() {
    return this.hazards;
  }

  update(player, dt, time, distanceMeters = 0) {
    // 1. Procedural Streaming: generate chunks ahead
    if (this.furthestX < player.x + 1600) {
      this.generateNextChunk(distanceMeters);
    }

    // 2. Prune old platforms far behind the player (prevent memory growth)
    const pruneBoundaryX = player.x - 1400;
    if (this.platforms.length > 80 && this.platforms[0].x + this.platforms[0].w < pruneBoundaryX) {
      this.platforms = this.platforms.filter(p => p.x + p.w >= pruneBoundaryX);
      this.hazards = this.hazards.filter(h => h.x + h.w >= pruneBoundaryX);
      this.collectibles = this.collectibles.filter(c => c.x >= pruneBoundaryX);
      this.props = this.props.filter(pr => pr.x >= pruneBoundaryX);
      this.upgrades = this.upgrades.filter(u => u.x >= pruneBoundaryX);
    }

    // 3. Update Animated Collectibles
    const loot = this.collectiblesManager.update(this.collectibles, player, dt, time);
    return loot;
  }

  draw(ctx, camera, time, distanceMeters = 0) {
    const biome = this.getBiome(distanceMeters);

    // =========================================================================
    // 0. FUNDAÇÃO SUBTERRÂNEA CONTÍNUA COM DEGRADÊ
    // Elimina o "precipício sem fim": toda a faixa abaixo de Y=400 é solo rochoso
    // =========================================================================
    const groundScreenY = Math.round(400 - camera.y);
    if (groundScreenY < 540) {
      const topFillY = Math.max(0, groundScreenY);
      const bedGrad = ctx.createLinearGradient(0, topFillY, 0, 540);
      bedGrad.addColorStop(0, biome.bedrockTop || "#10162a");
      bedGrad.addColorStop(0.35, "#0b0f1e");
      bedGrad.addColorStop(1, biome.bedrockBot || "#04060c");
      ctx.fillStyle = bedGrad;
      ctx.fillRect(0, topFillY, 960, 540 - topFillY);
    }

    // 1. Draw Platforms (Solo com grama, lajes de pedra, pilares, vigas)
    this.platforms.forEach(p => {
      const screenX = Math.round(p.x - camera.x);
      const screenY = Math.round(p.y - camera.y);

      // Frustum culling
      if (screenX + p.w < -64 || screenX > 1024 || screenY + p.h < -64 || screenY > 604) {
        return;
      }

      if (p.type === "metal") {
        this.drawMetalPlatform(ctx, p, screenX, screenY, biome);
      } else if (p.type === "pillar") {
        this.drawPillarPlatform(ctx, p, screenX, screenY, biome);
      } else if (p.type === "stone_slab") {
        // Lajes elevadas de pedra: acabamento limpo sem grama
        this.drawStoneSlab(ctx, p, screenX, screenY, biome);
      } else {
        // Solo principal em Y=400: topo com vegetação e laterais cortadas
        this.drawGroundPlatform(ctx, p, screenX, screenY, biome);
      }
    });

    // 2. Draw Hazards (Water in basins & Spikes)
    this.hazards.forEach(h => {
      const screenX = Math.round(h.x - camera.x);
      const screenY = Math.round(h.y - camera.y);

      if (screenX + h.w < -64 || screenX > 1024) return;

      if (h.type === "water") {
        this.drawWaterHazard(ctx, h, screenX, screenY, time, biome);
      } else {
        this.drawSpikeHazard(ctx, h, screenX, screenY);
      }
    });

    // 3. Draw Background / Foreground Props
    this.props.forEach(pr => {
      const screenX = Math.round(pr.x - camera.x);
      const screenY = Math.round(pr.y - camera.y);

      if (screenX < -100 || screenX > 1060) return;

      if (pr.type === "sanctuary_pillar") {
        const img = this.sprites.sanctuaryPillar;
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, screenX, screenY, 48, 80);
        }
      } else if (pr.type === "crystal") {
        const frameIdx = Math.floor(time * 10) % 8;
        const img = this.crystalFrames[frameIdx];
        const pulse = 1.0 + Math.sin(time * 4) * 0.14;
        ctx.save();
        const radGrad = ctx.createRadialGradient(screenX + 16, screenY + 16, 4, screenX + 16, screenY + 16, 28 * pulse);
        radGrad.addColorStop(0, biome.waterGlow || "rgba(0, 229, 255, 0.45)");
        radGrad.addColorStop(0.6, "rgba(186, 104, 200, 0.2)");
        radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(screenX + 16, screenY + 16, 28 * pulse, 0, Math.PI * 2);
        ctx.fill();

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, screenX, screenY, 32, 32);
        } else {
          ctx.fillStyle = biome.primaryGlow;
          ctx.beginPath();
          ctx.arc(screenX + 16, screenY + 16, 10, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (pr.type === "mushroom") {
        const frameIdx = Math.floor(time * 10) % 8;
        const img = this.mushroomFrames[frameIdx];
        const pulse = 1.0 + Math.sin(time * 3 + screenX * 0.02) * 0.16;
        ctx.save();
        const radGrad = ctx.createRadialGradient(screenX + 16, screenY + 16, 4, screenX + 16, screenY + 16, 26 * pulse);
        radGrad.addColorStop(0, "rgba(29, 233, 182, 0.45)");
        radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(screenX + 16, screenY + 16, 26 * pulse, 0, Math.PI * 2);
        ctx.fill();

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, screenX, screenY, 32, 32);
        }
        ctx.restore();
      } else if (pr.type === "drip") {
        const frameIdx = Math.floor(time * 8) % 8;
        const img = this.dripFrames[frameIdx];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, screenX, screenY, 24, 60);
        }
      } else if (pr.type === "fortune_altar") {
        const img = this.sprites.fortuneAltar;
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, screenX, screenY, 48, 64);
        }
      } else if (pr.type === "deco_pillar") {
        const img = this.sprites.decoPillar;
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, screenX, screenY, 32, 96);
        }
      }
    });

    // 4. Draw Animated Collectibles
    this.collectiblesManager.draw(ctx, this.collectibles, camera, time);

    // 5. Draw Roguelite Upgrades
    this.upgrades.forEach(u => {
      if (u.collected) return;
      const ux = Math.round(u.x - camera.x);
      const uy = Math.round(u.y - camera.y + Math.sin(time * 5 + u.x * 0.05) * 6);

      // Frustum culling
      if (ux < -50 || ux > 1010 || uy < -50 || uy > 590) return;

      ctx.save();
      const grad = ctx.createRadialGradient(ux + u.w / 2, uy + u.h / 2, 4, ux + u.w / 2, uy + u.h / 2, 28);
      grad.addColorStop(0, u.color || "rgba(255, 214, 0, 0.9)");
      grad.addColorStop(0.5, "rgba(255, 171, 0, 0.35)");
      grad.addColorStop(1, "rgba(255, 171, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ux + u.w / 2, uy + u.h / 2, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = u.color || "#ffd600";
      ctx.lineWidth = 2;
      ctx.save();
      ctx.translate(ux + u.w / 2, uy + u.h / 2);
      ctx.rotate(time * 2.2);
      ctx.strokeRect(-16, -16, 32, 32);
      ctx.restore();

      ctx.font = "20px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(u.icon || "★", ux + u.w / 2, uy + u.h / 2);
      ctx.restore();
    });
  }

  // =========================================================================
  // SOLO PRINCIPAL (Y = 400): Topo com vegetação cavernosa e laterais cortadas
  // =========================================================================
  drawGroundPlatform(ctx, p, screenX, screenY, biome) {
    const stoneTop = this.sprites.stoneTop;
    const stoneMid = this.sprites.stoneMid;
    const stoneLeft = this.sprites.stoneLeft;
    const stoneRight = this.sprites.stoneRight;
    const tileSz = 32;

    const hasImages = stoneTop.complete && stoneTop.naturalWidth > 0;

    if (hasImages) {
      // 1. Linha de Superfície com Vegetação (Y = 0..32)
      for (let bx = 0; bx < p.w; bx += tileSz) {
        const sliceW = Math.min(tileSz, p.w - bx);
        const isLeft = bx === 0;
        const isRight = bx + tileSz >= p.w;

        let img = stoneTop;
        if (isLeft && stoneLeft.complete) img = stoneLeft;
        else if (isRight && stoneRight.complete) img = stoneRight;

        ctx.drawImage(img, 0, 0, sliceW, tileSz, screenX + bx, screenY, sliceW, tileSz);
      }

      // 2. Miolo e Paredões Laterais (Y = 32..p.h)
      if (p.h > tileSz) {
        for (let by = tileSz; by < p.h; by += tileSz) {
          const sliceH = Math.min(tileSz, p.h - by);
          for (let bx = 0; bx < p.w; bx += tileSz) {
            const sliceW = Math.min(tileSz, p.w - bx);
            ctx.drawImage(stoneMid, 0, 0, sliceW, sliceH, screenX + bx, screenY + by, sliceW, sliceH);
          }
        }
      }
    } else {
      ctx.fillStyle = "#1e2838";
      ctx.fillRect(screenX, screenY, p.w, p.h);
      ctx.fillStyle = biome ? biome.primaryGlow : "#00e5ff";
      ctx.fillRect(screenX, screenY, p.w, 4);
    }
  }

  // =========================================================================
  // LAJES ELEVADAS DE PEDRA (Sem Grama! Acabamento chanfrado de rocha arquitetônica)
  // =========================================================================
  drawStoneSlab(ctx, p, screenX, screenY, biome) {
    const stoneMid = this.sprites.stoneMid;
    const tileSz = 32;

    ctx.save();

    // 1. Corpo da laje em alvenaria de ardósia escura
    if (stoneMid.complete && stoneMid.naturalWidth > 0) {
      for (let bx = 0; bx < p.w; bx += tileSz) {
        const sliceW = Math.min(tileSz, p.w - bx);
        ctx.drawImage(stoneMid, 0, 0, sliceW, p.h, screenX + bx, screenY, sliceW, p.h);
      }
    } else {
      ctx.fillStyle = "#263238";
      ctx.fillRect(screenX, screenY, p.w, p.h);
    }

    // 2. Acabamento chanfrado superior (Borda de pedra lapidada sem vegetação!)
    const edgeHighlight = biome ? biome.accentGlow : "#78909c";
    ctx.fillStyle = edgeHighlight;
    ctx.fillRect(screenX + 2, screenY, p.w - 4, 3);

    // 3. Quinas chanfradas nas pontas esquerda e direita
    ctx.fillStyle = "#37474f";
    ctx.fillRect(screenX, screenY, 3, p.h);
    ctx.fillRect(screenX + p.w - 3, screenY, 3, p.h);

    // 4. Sombra inferior da laje
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(screenX, screenY + p.h - 3, p.w, 3);

    ctx.restore();
  }

  // =========================================================================
  // PILARES VERTICAIS DE ROCHA (Estrutura arquitetônica com capitel de pedra)
  // =========================================================================
  drawPillarPlatform(ctx, p, screenX, screenY, biome) {
    const pillarImg = this.sprites.rockPillar;
    const stoneMid = this.sprites.stoneMid;

    ctx.save();
    if (pillarImg.complete && pillarImg.naturalWidth > 0) {
      ctx.drawImage(pillarImg, screenX, screenY, p.w, p.h);
    } else if (stoneMid.complete && stoneMid.naturalWidth > 0) {
      for (let by = 0; by < p.h; by += 32) {
        const sliceH = Math.min(32, p.h - by);
        ctx.drawImage(stoneMid, 0, 0, p.w, sliceH, screenX, screenY + by, p.w, sliceH);
      }
    } else {
      ctx.fillStyle = "#263238";
      ctx.fillRect(screenX, screenY, p.w, p.h);
    }

    // Capitel de pedra no topo do pilar (sem grama!)
    ctx.fillStyle = "#455a64";
    ctx.fillRect(screenX - 2, screenY, p.w + 4, 5);
    ctx.fillStyle = biome ? biome.primaryGlow : "#90a4ae";
    ctx.fillRect(screenX, screenY, p.w, 2);

    ctx.restore();
  }

  // =========================================================================
  // ÁGUA NOS VÃOS (Bacia rochosa escavada no leito com ondas e bolhas)
  // =========================================================================
  drawWaterHazard(ctx, h, screenX, screenY, time, biome) {
    const waterColor = biome ? biome.waterSurface : "#00e5ff";
    const deepColor = biome ? biome.waterDeep : "#006064";
    const glowColor = biome ? biome.waterGlow : "rgba(0, 229, 255, 0.45)";

    ctx.save();

    // 1. Fundo da bacia rochosa abaixo da água
    ctx.fillStyle = "#070b14";
    ctx.fillRect(screenX, screenY + 70, h.w, h.h - 70);

    // Paredões verticais rochosos na entrada e saída da água
    ctx.fillStyle = "#1e2838";
    ctx.fillRect(screenX, screenY, 4, 70);
    ctx.fillRect(screenX + h.w - 4, screenY, 4, 70);

    // 2. Superfície líquida ondulada
    const waveH = 5;
    const waveFreq = 0.045;
    const waveSpeed = time * 4.8;

    const grad = ctx.createLinearGradient(0, screenY, 0, screenY + 70);
    grad.addColorStop(0, glowColor);
    grad.addColorStop(0.4, deepColor);
    grad.addColorStop(1, "rgba(5, 10, 20, 0.95)");
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(screenX, screenY + 70);
    ctx.lineTo(screenX, screenY + Math.sin(screenX * waveFreq + waveSpeed) * waveH);

    for (let x = 0; x <= h.w; x += 8) {
      const wy = screenY + Math.sin((screenX + x) * waveFreq + waveSpeed) * waveH;
      ctx.lineTo(screenX + x, wy);
    }

    ctx.lineTo(screenX + h.w, screenY + 70);
    ctx.closePath();
    ctx.fill();

    // 3. Crista de espuma luminosa animada
    ctx.strokeStyle = waterColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 0; x <= h.w; x += 6) {
      const wy = screenY + Math.sin((screenX + x) * waveFreq + waveSpeed) * waveH;
      if (x === 0) ctx.moveTo(screenX + x, wy);
      else ctx.lineTo(screenX + x, wy);
    }
    ctx.stroke();

    // 4. Bolhas de efervescência
    for (let b = 0; b < 3; b++) {
      const bx = screenX + ((b * 47 + Math.sin(time + screenX * 0.05) * 20 + 25) % Math.max(10, h.w - 10));
      const by = screenY + 65 - ((time * 28 + b * 22) % 55);
      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      ctx.beginPath();
      ctx.arc(bx, by, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // =========================================================================
  // ESPINHOS
  // =========================================================================
  drawSpikeHazard(ctx, h, screenX, screenY) {
    const spImg = this.sprites.spikes;
    if (spImg.complete && spImg.naturalWidth > 0) {
      for (let bx = 0; bx < h.w; bx += 32) {
        const sliceW = Math.min(32, h.w - bx);
        ctx.drawImage(spImg, 0, 0, sliceW, 32, screenX + bx, screenY, sliceW, 32);
      }
    } else {
      ctx.fillStyle = "#d50000";
      for (let bx = 0; bx < h.w; bx += 16) {
        ctx.beginPath();
        ctx.moveTo(screenX + bx, screenY + h.h);
        ctx.lineTo(screenX + bx + 8, screenY);
        ctx.lineTo(screenX + bx + 16, screenY + h.h);
        ctx.fill();
      }
    }
  }

  // =========================================================================
  // VIGAS METÁLICAS
  // =========================================================================
  drawMetalPlatform(ctx, p, screenX, screenY, biome) {
    const beamImg = this.sprites.metalBeam;
    const postImg = this.sprites.metalPost;
    const isVertical = p.h > p.w;

    const img = isVertical ? postImg : beamImg;
    if (img.complete && img.naturalWidth > 0) {
      const tileSz = 32;
      for (let by = 0; by < p.h; by += tileSz) {
        const sliceH = Math.min(tileSz, p.h - by);
        for (let bx = 0; bx < p.w; bx += tileSz) {
          const sliceW = Math.min(tileSz, p.w - bx);
          ctx.drawImage(img, 0, 0, sliceW, sliceH, screenX + bx, screenY + by, sliceW, sliceH);
        }
      }
    } else {
      ctx.fillStyle = "#37474f";
      ctx.fillRect(screenX, screenY, p.w, p.h);
      ctx.fillStyle = "#90a4ae";
      ctx.fillRect(screenX, screenY, p.w, 3);
    }
  }
}
