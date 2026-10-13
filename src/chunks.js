// Horizontal Procedural Runner with Upward Platforming & Water Hazards
// No lower layer: Clean, continuous horizontal baseline (Y = 400px)
// Pits are filled with Water Hazards (type: "water")
// Obstacles are purely vertical/upward (high ledges, stone pillars, magnetic beams)
// Chunk Width: 640px (20 tiles of 32px)

export const CHUNK_WIDTH = 640;

export class ChunkGenerator {
  constructor() {
    this.types = [
      "RUN_PLAIN",
      "WATER_GAP_SINGLE",
      "PILLAR_ASCENT",
      "ELEVATED_LEDGE",
      "WATER_GAP_DOUBLE",
      "SPIKE_UPWARD_LEDGE",
      "HIGH_VAULT"
    ];
  }

  generateChunk(chunkIndex, startX, distanceMeters = 0) {
    if (chunkIndex === 0) {
      return this.buildStartChunk(startX);
    }

    // A shrine checkpoint every 4 chunks
    if (chunkIndex % 4 === 0) {
      return this.buildShrineChunk(chunkIndex, startX);
    }

    const type = this.types[Math.floor(Math.random() * this.types.length)];
    switch (type) {
      case "RUN_PLAIN":
        return this.buildRunPlainChunk(chunkIndex, startX);
      case "WATER_GAP_SINGLE":
        return this.buildWaterGapSingleChunk(chunkIndex, startX);
      case "PILLAR_ASCENT":
        return this.buildPillarAscentChunk(chunkIndex, startX);
      case "ELEVATED_LEDGE":
        return this.buildElevatedLedgeChunk(chunkIndex, startX);
      case "WATER_GAP_DOUBLE":
        return this.buildWaterGapDoubleChunk(chunkIndex, startX);
      case "SPIKE_UPWARD_LEDGE":
        return this.buildSpikeUpwardLedgeChunk(chunkIndex, startX);
      case "HIGH_VAULT":
        return this.buildHighVaultChunk(chunkIndex, startX);
      default:
        return this.buildRunPlainChunk(chunkIndex, startX);
    }
  }

  // 1. CHUNK START: Spawn seguro no Templo Central (Solo contínuo Y=400..540)
  buildStartChunk(startX) {
    return {
      index: 0,
      x: startX,
      w: CHUNK_WIDTH,
      type: "START",
      platforms: [
        // Superfície contínua de 640px até a base da tela
        { x: startX, y: 400, w: CHUNK_WIDTH, h: 140, type: "ground" },
        // Viga de treino para magnetismo suspensa no alto
        { x: startX + 340, y: 280, w: 160, h: 20, type: "metal" }
      ],
      hazards: [],
      collectibles: [
        { id: "c_0_1", x: startX + 370, y: 240, type: "coin", collected: false },
        { id: "c_0_2", x: startX + 420, y: 220, type: "coin", collected: false },
        { id: "c_0_3", x: startX + 470, y: 240, type: "coin", collected: false }
      ],
      sanctuaries: [
        { id: "central", x: startX + 220, y: 320, w: 48, h: 80, name: "Templo Central", active: true }
      ],
      props: [
        { x: startX + 220, y: 320, type: "sanctuary_pillar" },
        { x: startX + 232, y: 310, type: "crystal" }
      ]
    };
  }

  // 2. RUN_PLAIN: Pista contínua de corrida com viga elevada e arco de moedas
  buildRunPlainChunk(chunkIndex, startX) {
    return {
      index: chunkIndex,
      x: startX,
      w: CHUNK_WIDTH,
      type: "RUN_PLAIN",
      platforms: [
        // Solo firme de 640px
        { x: startX, y: 400, w: CHUNK_WIDTH, h: 140, type: "ground" },
        // Viga elevada de metal com moedas no topo
        { x: startX + 180, y: 270, w: 200, h: 20, type: "metal" }
      ],
      hazards: [],
      collectibles: [
        { id: `c_${chunkIndex}_1`, x: startX + 200, y: 230, type: "coin", collected: false },
        { id: `c_${chunkIndex}_2`, x: startX + 250, y: 210, type: "coin", collected: false },
        { id: `c_${chunkIndex}_3`, x: startX + 300, y: 210, type: "coin", collected: false },
        { id: `c_${chunkIndex}_4`, x: startX + 350, y: 230, type: "coin", collected: false },
        { id: `c_${chunkIndex}_5`, x: startX + 510, y: 350, type: "soul_orb", collected: false }
      ],
      sanctuaries: [],
      props: [
        { x: startX + 100, y: 304, type: "deco_pillar" },
        { x: startX + 460, y: 368, type: "mushroom" },
        { x: startX + 270, y: 238, type: "crystal" }
      ]
    };
  }

  // 3. WATER_GAP_SINGLE: Fenda de 144px preenchida por ÁGUA com viga de apoio suspensa
  buildWaterGapSingleChunk(chunkIndex, startX) {
    const gapX = startX + 248;
    const gapW = 144;
    return {
      index: chunkIndex,
      x: startX,
      w: CHUNK_WIDTH,
      type: "WATER_GAP_SINGLE",
      platforms: [
        // Solo esquerdo e direito
        { x: startX, y: 400, w: 248, h: 140, type: "ground" },
        { x: gapX + gapW, y: 400, w: CHUNK_WIDTH - (gapX + gapW - startX), h: 140, type: "ground" },
        // Viga de metal suspensa sobre a água para pulo ou atração magnética
        { x: gapX + 12, y: 290, w: 120, h: 20, type: "metal" }
      ],
      hazards: [
        // O buraco é 100% ÁGUA
        { x: gapX, y: 420, w: gapW, h: 120, type: "water" }
      ],
      collectibles: [
        // Arco de moedas sobre a água
        { id: `c_${chunkIndex}_1`, x: gapX - 16, y: 350, type: "coin", collected: false },
        { id: `c_${chunkIndex}_2`, x: gapX + 28, y: 250, type: "coin", collected: false },
        { id: `c_${chunkIndex}_3`, x: gapX + 72, y: 230, type: "coin", collected: false },
        { id: `c_${chunkIndex}_4`, x: gapX + 116, y: 250, type: "coin", collected: false },
        { id: `c_${chunkIndex}_5`, x: gapX + gapW + 16, y: 350, type: "coin", collected: false }
      ],
      sanctuaries: [],
      props: [
        { x: gapX + 60, y: 40, type: "drip" },
        { x: gapX - 36, y: 368, type: "mushroom" },
        { x: gapX + gapW + 20, y: 368, type: "crystal" }
      ]
    };
  }

  // 4. PILLAR_ASCENT: Pilares verticais de rocha que sobem do chão e exigem saltar para cima
  buildPillarAscentChunk(chunkIndex, startX) {
    return {
      index: chunkIndex,
      x: startX,
      w: CHUNK_WIDTH,
      type: "PILLAR_ASCENT",
      platforms: [
        // Solo base
        { x: startX, y: 400, w: CHUNK_WIDTH, h: 140, type: "ground" },
        // Pilar 1 subindo para Y = 300 (altura 100px)
        { x: startX + 160, y: 300, w: 56, h: 100, type: "pillar" },
        // Laje de pedra suspensa sem grama
        { x: startX + 260, y: 220, w: 120, h: 24, type: "stone_slab" },
        // Pilar 2 subindo para Y = 280
        { x: startX + 420, y: 280, w: 56, h: 120, type: "pillar" }
      ],
      hazards: [],
      collectibles: [
        { id: `c_${chunkIndex}_1`, x: startX + 180, y: 260, type: "coin", collected: false },
        { id: `c_${chunkIndex}_2`, x: startX + 290, y: 180, type: "soul_orb", collected: false },
        { id: `c_${chunkIndex}_3`, x: startX + 340, y: 180, type: "coin", collected: false },
        { id: `c_${chunkIndex}_4`, x: startX + 440, y: 240, type: "coin", collected: false }
      ],
      sanctuaries: [],
      props: [
        { x: startX + 290, y: 188, type: "crystal" },
        { x: startX + 510, y: 368, type: "mushroom" }
      ]
    };
  }

  // 5. ELEVATED_LEDGE: Degraus e plataformas escalonadas subindo em direção ao teto
  buildElevatedLedgeChunk(chunkIndex, startX) {
    return {
      index: chunkIndex,
      x: startX,
      w: CHUNK_WIDTH,
      type: "ELEVATED_LEDGE",
      platforms: [
        // Solo base contínuo
        { x: startX, y: 400, w: CHUNK_WIDTH, h: 140, type: "ground" },
        // Degrau 1: laje de pedra
        { x: startX + 120, y: 320, w: 130, h: 24, type: "stone_slab" },
        // Degrau 2: laje de pedra
        { x: startX + 280, y: 240, w: 140, h: 24, type: "stone_slab" },
        // Viga de topo
        { x: startX + 450, y: 180, w: 110, h: 20, type: "metal" }
      ],
      hazards: [],
      collectibles: [
        { id: `c_${chunkIndex}_1`, x: startX + 160, y: 280, type: "coin", collected: false },
        { id: `c_${chunkIndex}_2`, x: startX + 320, y: 200, type: "coin", collected: false },
        { id: `c_${chunkIndex}_3`, x: startX + 370, y: 200, type: "soul_orb", collected: false },
        { id: `c_${chunkIndex}_4`, x: startX + 500, y: 140, type: "coin", collected: false }
      ],
      sanctuaries: [],
      props: [
        { x: startX + 20, y: 304, type: "deco_pillar" },
        { x: startX + 330, y: 208, type: "crystal" },
        { x: startX + 580, y: 368, type: "mushroom" }
      ]
    };
  }

  // 6. WATER_GAP_DOUBLE: Duas fendas de água com stepping stone central
  buildWaterGapDoubleChunk(chunkIndex, startX) {
    const gap1X = startX + 160;
    const gap1W = 120;
    const stoneX = startX + 280;
    const stoneW = 100;
    const gap2X = startX + 380;
    const gap2W = 120;
    const rightX = startX + 500;
    const rightW = 140;

    return {
      index: chunkIndex,
      x: startX,
      w: CHUNK_WIDTH,
      type: "WATER_GAP_DOUBLE",
      platforms: [
        // Solo esquerdo
        { x: startX, y: 400, w: 160, h: 140, type: "ground" },
        // Ilha de pedra central (stepping stone)
        { x: stoneX, y: 400, w: stoneW, h: 140, type: "ground" },
        // Solo direito
        { x: rightX, y: 400, w: rightW, h: 140, type: "ground" },
        // Viga suspensa no alto cobrindo a segunda fenda
        { x: gap2X + 10, y: 270, w: 100, h: 20, type: "metal" }
      ],
      hazards: [
        // Fenda 1: Água
        { x: gap1X, y: 420, w: gap1W, h: 120, type: "water" },
        // Fenda 2: Água
        { x: gap2X, y: 420, w: gap2W, h: 120, type: "water" }
      ],
      collectibles: [
        { id: `c_${chunkIndex}_1`, x: gap1X + 50, y: 330, type: "coin", collected: false },
        { id: `c_${chunkIndex}_2`, x: stoneX + 40, y: 350, type: "soul_orb", collected: false },
        { id: `c_${chunkIndex}_3`, x: gap2X + 50, y: 230, type: "coin", collected: false }
      ],
      sanctuaries: [],
      props: [
        { x: stoneX + 34, y: 368, type: "mushroom" },
        { x: rightX + 20, y: 368, type: "crystal" }
      ]
    };
  }

  // 7. SPIKE_UPWARD_LEDGE: Espinhos no solo forçando a superar obstáculos pulando para cima
  buildSpikeUpwardLedgeChunk(chunkIndex, startX) {
    return {
      index: chunkIndex,
      x: startX,
      w: CHUNK_WIDTH,
      type: "SPIKE_UPWARD_LEDGE",
      platforms: [
        // Solo base
        { x: startX, y: 400, w: CHUNK_WIDTH, h: 140, type: "ground" },
        // Lajes de pedra suspensas para passar por cima dos espinhos
        { x: startX + 180, y: 310, w: 130, h: 24, type: "stone_slab" },
        { x: startX + 340, y: 250, w: 140, h: 24, type: "stone_slab" }
      ],
      hazards: [
        // Faixa de espinhos no solo
        { x: startX + 190, y: 376, w: 260, h: 24, type: "spikes" }
      ],
      collectibles: [
        { id: `c_${chunkIndex}_1`, x: startX + 220, y: 270, type: "coin", collected: false },
        { id: `c_${chunkIndex}_2`, x: startX + 260, y: 270, type: "coin", collected: false },
        { id: `c_${chunkIndex}_3`, x: startX + 380, y: 210, type: "soul_orb", collected: false },
        { id: `c_${chunkIndex}_4`, x: startX + 430, y: 210, type: "coin", collected: false }
      ],
      sanctuaries: [],
      props: [
        { x: startX + 60, y: 304, type: "deco_pillar" },
        { x: startX + 380, y: 218, type: "crystal" }
      ]
    };
  }

  // 8. HIGH_VAULT: Estrutura aérea de alta altitude para escalada com bigorna
  buildHighVaultChunk(chunkIndex, startX) {
    return {
      index: chunkIndex,
      x: startX,
      w: CHUNK_WIDTH,
      type: "HIGH_VAULT",
      platforms: [
        // Solo base
        { x: startX, y: 400, w: CHUNK_WIDTH, h: 140, type: "ground" },
        // Lajes de pedra e vigas suspensas
        { x: startX + 100, y: 300, w: 100, h: 24, type: "stone_slab" },
        { x: startX + 230, y: 220, w: 110, h: 24, type: "stone_slab" },
        { x: startX + 370, y: 160, w: 140, h: 20, type: "metal" },
        { x: startX + 470, y: 260, w: 110, h: 24, type: "stone_slab" }
      ],
      hazards: [],
      collectibles: [
        { id: `c_${chunkIndex}_1`, x: startX + 140, y: 260, type: "coin", collected: false },
        { id: `c_${chunkIndex}_2`, x: startX + 280, y: 180, type: "coin", collected: false },
        { id: `c_${chunkIndex}_3`, x: startX + 420, y: 120, type: "soul_orb", collected: false },
        { id: `c_${chunkIndex}_4`, x: startX + 460, y: 120, type: "coin", collected: false }
      ],
      sanctuaries: [],
      props: [
        { x: startX + 270, y: 188, type: "crystal" },
        { x: startX + 50, y: 368, type: "mushroom" }
      ]
    };
  }

  getUpgradeForChunk(chunkIndex, x, y) {
    const list = [
      { id: "double_jump", name: "Botas de Pulo Duplo", icon: "🥾", color: "#00e5ff", desc: "Pule no ar livremente!" },
      { id: "magnet_boost", name: "Ímã Turbinado (+40%)", icon: "🧲", color: "#ffd600", desc: "Força magnética brutal da bigorna!" },
      { id: "hoverboard", name: "Prancha Magnética", icon: "🛹", color: "#76ff03", desc: "Segure [S] no ar para flutuar!" },
      { id: "gas_valve", name: "Válvula de Gás Rápido", icon: "🔥", color: "#ff3d00", desc: "Especial carrega muito mais rápido!" },
      { id: "heart_container", name: "Coração de Titã (+30 HP)", icon: "❤️", color: "#e040fb", desc: "Vida máxima expandida e curada!" }
    ];
    const cycle = Math.floor(chunkIndex / 4) - 1;
    const up = list[Math.max(0, cycle) % list.length];
    return {
      ...up,
      x,
      y,
      w: 36,
      h: 36,
      collected: false
    };
  }

  // 9. SHRINE_CHECKPOINT: Santuário sagrado na superfície com altar de restauração
  buildShrineChunk(chunkIndex, startX) {
    const shrineX = startX + 280;
    const shrineY = 320;
    return {
      index: chunkIndex,
      x: startX,
      w: CHUNK_WIDTH,
      type: "SHRINE",
      platforms: [
        // Superfície sagrada contínua
        { x: startX, y: 400, w: CHUNK_WIDTH, h: 140, type: "ground" }
      ],
      hazards: [],
      collectibles: [
        { id: `c_${chunkIndex}_1`, x: startX + 160, y: 360, type: "coin", collected: false },
        { id: `c_${chunkIndex}_2`, x: shrineX + 24, y: 280, type: "soul_orb", collected: false },
        { id: `c_${chunkIndex}_3`, x: startX + 440, y: 360, type: "coin", collected: false }
      ],
      upgrades: [
        this.getUpgradeForChunk(chunkIndex, shrineX + 100, 320)
      ],
      sanctuaries: [
        {
          id: `shrine_${chunkIndex}`,
          x: shrineX,
          y: shrineY,
          w: 48,
          h: 80,
          name: `Santuário ${Math.floor(startX / 10)}m`,
          active: false
        }
      ],
      props: [
        { x: shrineX, y: shrineY, type: "sanctuary_pillar" },
        { x: shrineX + 12, y: shrineY - 10, type: "crystal" },
        { x: shrineX + 100, y: 352, type: "fortune_altar" },
        { x: shrineX - 60, y: 368, type: "mushroom" }
      ]
    };
  }
}
