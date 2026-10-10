// Clean, Robust Procedural Level Generator — Inspired by Demon-Runner & Platformer-Gen-2D
// Baseline Surface: Y = 400px
// Subterranean Safety Floor: Y = 640px (Continuous across ALL chunks so nothing falls into void)
// Chunk Width: 640px (20 tiles of 32px)

export const CHUNK_WIDTH = 640;

export class ChunkGenerator {
  constructor() {
    this.types = [
      "RUN_PLAIN",
      "GAP_SINGLE",
      "ELEVATED_LEDGE",
      "GAP_DOUBLE",
      "RUN_PLAIN"
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
      case "GAP_SINGLE":
        return this.buildGapSingleChunk(chunkIndex, startX);
      case "ELEVATED_LEDGE":
        return this.buildElevatedLedgeChunk(chunkIndex, startX);
      case "GAP_DOUBLE":
        return this.buildGapDoubleChunk(chunkIndex, startX);
      default:
        return this.buildRunPlainChunk(chunkIndex, startX);
    }
  }

  // 1. CHUNK START: Spawn seguro no Templo Central
  buildStartChunk(startX) {
    return {
      index: 0,
      x: startX,
      w: CHUNK_WIDTH,
      type: "START",
      platforms: [
        // Superfície contínua de 640px
        { x: startX, y: 400, w: CHUNK_WIDTH, h: 80, type: "ground" },
        // Viga de treino para magnetismo
        { x: startX + 340, y: 300, w: 160, h: 20, type: "metal" },
        // Chão subterrâneo contínuo de segurança
        { x: startX, y: 640, w: CHUNK_WIDTH, h: 96, type: "ground" }
      ],
      hazards: [],
      collectibles: [
        { id: "c_0_1", x: startX + 370, y: 260, type: "coin", collected: false },
        { id: "c_0_2", x: startX + 420, y: 240, type: "coin", collected: false },
        { id: "c_0_3", x: startX + 470, y: 260, type: "coin", collected: false }
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

  // 2. RUN_PLAIN: Pista contínua de corrida com viga elevada e moedas
  buildRunPlainChunk(chunkIndex, startX) {
    return {
      index: chunkIndex,
      x: startX,
      w: CHUNK_WIDTH,
      type: "RUN_PLAIN",
      platforms: [
        // Superfície plana firme de 640px
        { x: startX, y: 400, w: CHUNK_WIDTH, h: 80, type: "ground" },
        // Viga elevada de metal com moedas
        { x: startX + 180, y: 280, w: 200, h: 20, type: "metal" },
        // Chão subterrâneo contínuo de segurança
        { x: startX, y: 640, w: CHUNK_WIDTH, h: 96, type: "ground" }
      ],
      hazards: [],
      collectibles: [
        { id: `c_${chunkIndex}_1`, x: startX + 200, y: 240, type: "coin", collected: false },
        { id: `c_${chunkIndex}_2`, x: startX + 250, y: 220, type: "coin", collected: false },
        { id: `c_${chunkIndex}_3`, x: startX + 300, y: 220, type: "coin", collected: false },
        { id: `c_${chunkIndex}_4`, x: startX + 350, y: 240, type: "coin", collected: false },
        // Orbe no subterrâneo
        { id: `c_${chunkIndex}_5`, x: startX + 300, y: 590, type: "soul_orb", collected: false }
      ],
      sanctuaries: [],
      props: [
        { x: startX + 120, y: 304, type: "deco_pillar" }
      ]
    };
  }

  // 3. GAP_SINGLE: Fenda de 128px com degraus de retorno fáceis no subterrâneo
  buildGapSingleChunk(chunkIndex, startX) {
    const gapX = startX + 256;
    const gapW = 128;
    return {
      index: chunkIndex,
      x: startX,
      w: CHUNK_WIDTH,
      type: "GAP_SINGLE",
      platforms: [
        // Superfície dividida por uma fenda limpa
        { x: startX, y: 400, w: 256, h: 80, type: "ground" },
        { x: gapX + gapW, y: 400, w: 256, h: 80, type: "ground" },
        // Chão subterrâneo contínuo (garante que nada cai no vazio)
        { x: startX, y: 640, w: CHUNK_WIDTH, h: 96, type: "ground" },
        // Escada de retorno fácil sob a fenda
        { x: gapX + 16, y: 520, w: 140, h: 24, type: "ground" },
        { x: gapX + 96, y: 450, w: 120, h: 24, type: "ground" }
      ],
      hazards: [],
      collectibles: [
        // Arco de moedas sobre a fenda
        { id: `c_${chunkIndex}_1`, x: gapX - 20, y: 370, type: "coin", collected: false },
        { id: `c_${chunkIndex}_2`, x: gapX + 25, y: 320, type: "coin", collected: false },
        { id: `c_${chunkIndex}_3`, x: gapX + 64, y: 300, type: "coin", collected: false },
        { id: `c_${chunkIndex}_4`, x: gapX + 103, y: 320, type: "coin", collected: false },
        { id: `c_${chunkIndex}_5`, x: gapX + 148, y: 370, type: "coin", collected: false }
      ],
      sanctuaries: [],
      props: []
    };
  }

  // 4. ELEVATED_LEDGE: Chão contínuo com plataforma de pedra elevada no meio
  buildElevatedLedgeChunk(chunkIndex, startX) {
    return {
      index: chunkIndex,
      x: startX,
      w: CHUNK_WIDTH,
      type: "ELEVATED_LEDGE",
      platforms: [
        // Chão base contínuo
        { x: startX, y: 400, w: CHUNK_WIDTH, h: 80, type: "ground" },
        // Plataforma de pedra elevada no alto
        { x: startX + 160, y: 320, w: 280, h: 32, type: "ground" },
        // Chão subterrâneo contínuo
        { x: startX, y: 640, w: CHUNK_WIDTH, h: 96, type: "ground" }
      ],
      hazards: [],
      collectibles: [
        { id: `c_${chunkIndex}_1`, x: startX + 190, y: 280, type: "coin", collected: false },
        { id: `c_${chunkIndex}_2`, x: startX + 250, y: 280, type: "coin", collected: false },
        { id: `c_${chunkIndex}_3`, x: startX + 310, y: 280, type: "coin", collected: false },
        { id: `c_${chunkIndex}_4`, x: startX + 370, y: 280, type: "coin", collected: false }
      ],
      sanctuaries: [],
      props: [
        { x: startX + 490, y: 304, type: "deco_pillar" }
      ]
    };
  }

  // 5. GAP_DOUBLE: Duas fendas com ilha central e viga suspensa
  buildGapDoubleChunk(chunkIndex, startX) {
    return {
      index: chunkIndex,
      x: startX,
      w: CHUNK_WIDTH,
      type: "GAP_DOUBLE",
      platforms: [
        // Superfície com ilha central
        { x: startX, y: 400, w: 200, h: 80, type: "ground" },
        { x: startX + 300, y: 400, w: 160, h: 80, type: "ground" },
        { x: startX + 540, y: 400, w: 100, h: 80, type: "ground" },
        // Viga de apoio na primeira fenda
        { x: startX + 210, y: 350, w: 80, h: 20, type: "metal" },
        // Chão subterrâneo contínuo
        { x: startX, y: 640, w: CHUNK_WIDTH, h: 96, type: "ground" },
        // Rampa de subida no subterrâneo
        { x: startX + 430, y: 520, w: 140, h: 24, type: "ground" }
      ],
      hazards: [],
      collectibles: [
        { id: `c_${chunkIndex}_1`, x: startX + 250, y: 310, type: "coin", collected: false },
        { id: `c_${chunkIndex}_2`, x: startX + 380, y: 360, type: "soul_orb", collected: false },
        { id: `c_${chunkIndex}_3`, x: startX + 480, y: 330, type: "coin", collected: false }
      ],
      sanctuaries: [],
      props: []
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

  // 6. SHRINE_CHECKPOINT: Santuário de descanso na superfície
  buildShrineChunk(chunkIndex, startX) {
    const shrineX = startX + 280;
    const shrineY = 320;
    return {
      index: chunkIndex,
      x: startX,
      w: CHUNK_WIDTH,
      type: "SHRINE",
      platforms: [
        // Superfície plana sagrada
        { x: startX, y: 400, w: CHUNK_WIDTH, h: 80, type: "ground" },
        // Chão subterrâneo contínuo
        { x: startX, y: 640, w: CHUNK_WIDTH, h: 96, type: "ground" }
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
        { x: shrineX + 100, y: 352, type: "fortune_altar" }
      ]
    };
  }
}
