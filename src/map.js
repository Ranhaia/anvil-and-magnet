// Micro-Metroidvania Map: Interconnected Platforms, Sanctuaries, Barriers & Upgrades
export class GameMap {
  constructor() {
    this.floorImg = new Image();
    this.floorImg.src = "assets/floor.png";
    this.wallImg = new Image();
    this.wallImg.src = "assets/wall.png";

    // Platforms (x, y, w, h, type: 'ground' | 'wall' | 'metal' | 'jump_thru')
    this.platforms = [
      // === TEMPLO CENTRAL (Zona Segura / Spawn) ===
      { x: -200, y: 460, w: 1000, h: 80, type: "ground" },
      { x: 100, y: 350, w: 200, h: 24, type: "metal" },
      { x: 450, y: 310, w: 180, h: 24, type: "ground" },

      // Paredes e colunas do templo
      { x: -220, y: 0, w: 20, h: 540, type: "wall" },
      { x: 380, y: 220, w: 30, h: 140, type: "metal" },

      // === SETOR LESTE: AS CATACUMBAS (Requer Pulo Duplo) ===
      { x: 800, y: 460, w: 500, h: 80, type: "ground" },
      { x: 1050, y: 360, w: 160, h: 20, type: "ground" },
      { x: 1250, y: 270, w: 140, h: 20, type: "metal" },
      { x: 1450, y: 190, w: 160, h: 20, type: "ground" },
      { x: 1650, y: 130, w: 220, h: 24, type: "metal" }, // Altar de Salto Duplo!
      
      // Chão inferior das Catacumbas
      { x: 1300, y: 460, w: 900, h: 80, type: "ground" },
      { x: 1900, y: 340, w: 240, h: 24, type: "metal" }, // Onde fica a Bigorna Titânica!
      { x: 2200, y: 0, w: 40, h: 540, type: "wall" },

      // === SETOR OESTE: O ABISMO DOS PILARES (Requer Hoverboard / Grappling Hook) ===
      { x: -700, y: 460, w: 400, h: 80, type: "ground" },
      // O Abismo entre -700 e -1200 (sem chão!)
      { x: -950, y: 320, w: 60, h: 24, type: "metal" }, // Pilar magnético no ar
      { x: -1600, y: 460, w: 500, h: 80, type: "ground" },
      { x: -1400, y: 300, w: 180, h: 24, type: "metal" }, // Onde fica a Bigorna Yoyo!
      { x: -1900, y: 460, w: 300, h: 80, type: "ground" },
      { x: -1920, y: 0, w: 40, h: 540, type: "wall" }
    ];

    // Sanctuaries (Heal & Checkpoints)
    this.sanctuaries = [
      { id: "central", x: 250, y: 400, w: 40, h: 60, name: "Templo Central", active: true },
      { id: "east", x: 1550, y: 400, w: 40, h: 60, name: "Santuário Leste", active: false },
      { id: "west", x: -1450, y: 400, w: 40, h: 60, name: "Santuário Oeste", active: false }
    ];

    // Upgrades no mapa (desbloqueáveis)
    this.upgrades = [
      { id: "double_jump", x: 1730, y: 90, w: 32, h: 32, collected: false, name: "Botas de Pulo Duplo" },
      { id: "titan_anvil", x: 1980, y: 300, w: 40, h: 40, collected: false, name: "Bigorna Titânica" },
      { id: "yoyo_anvil", x: -1330, y: 260, w: 36, h: 36, collected: false, name: "Bigorna Yoyo" },
      { id: "hoverboard", x: -620, y: 420, w: 40, h: 20, collected: false, name: "Placa Flutuante" }
    ];
  }

  getColliders() {
    return this.platforms;
  }

  draw(ctx, camera, time) {
    // 1. Draw Platforms
    this.platforms.forEach(p => {
      const screenX = p.x - camera.x;
      const screenY = p.y - camera.y;

      // Cull offscreen
      if (screenX + p.w < -50 || screenX > 1010 || screenY + p.h < -50 || screenY > 600) {
        return;
      }

      if (p.type === "metal") {
        ctx.fillStyle = "#37474f";
        ctx.fillRect(screenX, screenY, p.w, p.h);

        // Metallic highlights & rivets
        ctx.fillStyle = "#78909c";
        ctx.fillRect(screenX, screenY, p.w, 3);
        ctx.fillStyle = "#cfd8dc";
        for (let rx = 10; rx < p.w; rx += 30) {
          ctx.beginPath();
          ctx.arc(screenX + rx, screenY + p.h / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Stone platform with floor texture pattern
        ctx.fillStyle = "#263238";
        ctx.fillRect(screenX, screenY, p.w, p.h);

        // Top grass/stone trim
        ctx.fillStyle = "#455a64";
        ctx.fillRect(screenX, screenY, p.w, 4);

        // Stone brick seams
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.lineWidth = 1;
        for (let bx = 0; bx < p.w; bx += 40) {
          ctx.strokeRect(screenX + bx, screenY + 4, 40, p.h - 4);
        }
      }
    });

    // 2. Draw Sanctuaries
    this.sanctuaries.forEach(s => {
      const sx = s.x - camera.x;
      const sy = s.y - camera.y;
      const pulse = Math.sin(time * 3) * 0.15 + 0.85;

      // Stone Pillar
      ctx.fillStyle = "#1e2838";
      ctx.fillRect(sx, sy, s.w, s.h);

      // Holy Crystal / Light
      const crystalColor = s.active ? "#00e676" : "#2979ff";
      ctx.fillStyle = crystalColor;
      ctx.beginPath();
      ctx.arc(sx + s.w / 2, sy + 15, 10 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Light beam
      ctx.fillStyle = s.active ? "rgba(0, 230, 118, 0.15)" : "rgba(41, 121, 255, 0.15)";
      ctx.fillRect(sx - 10, sy - 80, s.w + 20, s.h + 80);

      // Label
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(s.name, sx + s.w / 2, sy - 10);
    });

    // 3. Draw Upgrades
    this.upgrades.forEach(u => {
      if (u.collected) return;
      const ux = u.x - camera.x;
      const uy = u.y - camera.y + Math.sin(time * 4) * 6;

      ctx.save();
      // Glowing orb
      const grad = ctx.createRadialGradient(ux + u.w/2, uy + u.h/2, 2, ux + u.w/2, uy + u.h/2, 24);
      grad.addColorStop(0, "rgba(255, 214, 0, 0.9)");
      grad.addColorStop(0.6, "rgba(255, 171, 0, 0.4)");
      grad.addColorStop(1, "rgba(255, 171, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ux + u.w/2, uy + u.h/2, 24, 0, Math.PI * 2);
      ctx.fill();

      // Icon core
      ctx.fillStyle = "#ffd600";
      ctx.beginPath();
      ctx.arc(ux + u.w/2, uy + u.h/2, 9, 0, Math.PI * 2);
      ctx.fill();

      // Name label
      ctx.fillStyle = "#ffd600";
      ctx.font = "bold 10px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(u.name, ux + u.w/2, uy - 12);
      ctx.restore();
    });
  }
}
