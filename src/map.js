// Infinite Procedural Bi-Level World Map with Real Tile Rendering
import { ChunkGenerator, CHUNK_WIDTH } from "./chunks.js";
import { CollectiblesManager } from "./collectibles.js";

export class GameMap {
  constructor() {
    this.chunkGen = new ChunkGenerator();
    this.collectiblesManager = new CollectiblesManager();

    // Sprite Cache
    this.sprites = {
      stoneTop: this.loadImage("assets/tiles/tile_stone_top.png"),
      stoneMid: this.loadImage("assets/tiles/tile_stone_mid.png"),
      stoneLeft: this.loadImage("assets/tiles/tile_stone_left.png"),
      stoneRight: this.loadImage("assets/tiles/tile_stone_right.png"),
      stoneBot: this.loadImage("assets/tiles/tile_stone_bot.png"),
      metalBeam: this.loadImage("assets/tiles/tile_metal_beam.png"),
      metalPost: this.loadImage("assets/tiles/tile_metal_post.png"),
      spikes: this.loadImage("assets/tiles/tile_spikes.png"),
      sanctuaryPillar: this.loadImage("assets/environment/sanctuary_pillar.png"),
      crystalActive: this.loadImage("assets/environment/crystal_active.png"),
      fortuneAltar: this.loadImage("assets/environment/fortune_altar.png"),
      decoPillar: this.loadImage("assets/environment/deco_pillar.png")
    };

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

  draw(ctx, camera, time) {
    // 1. Draw Platforms (Stone with moss, metal beams, edges)
    this.platforms.forEach(p => {
      const screenX = Math.round(p.x - camera.x);
      const screenY = Math.round(p.y - camera.y);

      // Frustum culling
      if (screenX + p.w < -64 || screenX > 1024 || screenY + p.h < -64 || screenY > 604) {
        return;
      }

      if (p.type === "metal") {
        this.drawMetalPlatform(ctx, p, screenX, screenY);
      } else {
        this.drawStonePlatform(ctx, p, screenX, screenY);
      }
    });

    // 2. Draw Hazards (Spikes)
    this.hazards.forEach(h => {
      const screenX = Math.round(h.x - camera.x);
      const screenY = Math.round(h.y - camera.y);

      if (screenX + h.w < -64 || screenX > 1024) return;

      const spImg = this.sprites.spikes;
      if (spImg.complete && spImg.naturalWidth > 0) {
        for (let bx = 0; bx < h.w; bx += 32) {
          const sliceW = Math.min(32, h.w - bx);
          ctx.drawImage(spImg, 0, 0, sliceW, 32, screenX + bx, screenY, sliceW, 32);
        }
      } else {
        // Fallback procedural spikes
        ctx.fillStyle = "#d50000";
        for (let bx = 0; bx < h.w; bx += 16) {
          ctx.beginPath();
          ctx.moveTo(screenX + bx, screenY + h.h);
          ctx.lineTo(screenX + bx + 8, screenY);
          ctx.lineTo(screenX + bx + 16, screenY + h.h);
          ctx.fill();
        }
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
        const img = this.sprites.crystalActive;
        const pulse = 1.0 + Math.sin(time * 4) * 0.12;
        ctx.save();
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 12 * pulse;
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, screenX, screenY, 24, 24);
        } else {
          ctx.fillStyle = "#00e5ff";
          ctx.beginPath();
          ctx.arc(screenX + 12, screenY + 12, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
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
      // Glowing radial aura
      const grad = ctx.createRadialGradient(ux + u.w / 2, uy + u.h / 2, 4, ux + u.w / 2, uy + u.h / 2, 28);
      grad.addColorStop(0, u.color || "rgba(255, 214, 0, 0.9)");
      grad.addColorStop(0.5, "rgba(255, 171, 0, 0.35)");
      grad.addColorStop(1, "rgba(255, 171, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ux + u.w / 2, uy + u.h / 2, 28, 0, Math.PI * 2);
      ctx.fill();

      // Rotating diamond frame
      ctx.strokeStyle = u.color || "#ffd600";
      ctx.lineWidth = 2;
      ctx.save();
      ctx.translate(ux + u.w / 2, uy + u.h / 2);
      ctx.rotate(time * 2.2);
      ctx.strokeRect(-12, -12, 24, 24);
      ctx.restore();

      // Core orb
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ux + u.w / 2, uy + u.h / 2, 7, 0, Math.PI * 2);
      ctx.fill();

      // Name & Icon Tag
      ctx.fillStyle = u.color || "#ffd600";
      ctx.font = "bold 11px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${u.icon || "⭐"} ${u.name}`, ux + u.w / 2, uy - 18);
      ctx.restore();
    });
  }

  drawStonePlatform(ctx, p, screenX, screenY) {
    const topImg = this.sprites.stoneTop;
    const midImg = this.sprites.stoneMid;
    const leftImg = this.sprites.stoneLeft;
    const rightImg = this.sprites.stoneRight;
    const botImg = this.sprites.stoneBot;

    const hasImages = topImg.complete && topImg.naturalWidth > 0;

    if (!hasImages) {
      // Fallback styling
      ctx.fillStyle = "#1e2838";
      ctx.fillRect(screenX, screenY, p.w, p.h);
      ctx.fillStyle = "#00e5ff";
      ctx.fillRect(screenX, screenY, p.w, 4);
      return;
    }

    const tileSz = 32;

    // Draw Top Layer (Y: 0..32)
    for (let bx = 0; bx < p.w; bx += tileSz) {
      const sliceW = Math.min(tileSz, p.w - bx);
      const isLeft = bx === 0;
      const isRight = bx + tileSz >= p.w;

      let img = topImg;
      if (isLeft && leftImg.complete) img = leftImg;
      else if (isRight && rightImg.complete) img = rightImg;

      ctx.drawImage(img, 0, 0, sliceW, tileSz, screenX + bx, screenY, sliceW, tileSz);
    }

    // Draw Filler Layers (Y: 32..p.h)
    for (let by = tileSz; by < p.h; by += tileSz) {
      const sliceH = Math.min(tileSz, p.h - by);
      const isBottom = by + tileSz >= p.h;

      for (let bx = 0; bx < p.w; bx += tileSz) {
        const sliceW = Math.min(tileSz, p.w - bx);
        const img = isBottom && botImg.complete ? botImg : midImg;
        ctx.drawImage(img, 0, 0, sliceW, sliceH, screenX + bx, screenY + by, sliceW, sliceH);
      }
    }
  }

  drawMetalPlatform(ctx, p, screenX, screenY) {
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
      // Fallback metal texture
      ctx.fillStyle = "#37474f";
      ctx.fillRect(screenX, screenY, p.w, p.h);
      ctx.fillStyle = "#90a4ae";
      ctx.fillRect(screenX, screenY, p.w, 3);
    }
  }
}
