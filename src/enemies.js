import { Physics } from "./physics.js";
import { sound } from "./audio.js";

// ============================================================================
// BASE ENEMY
// ============================================================================
class BaseEnemy {
  constructor(x, y, w, h, levelMultiplier = 1.0, scale = 1.0) {
    this.scale = scale;
    this.w = Math.round(w * scale);
    this.h = Math.round(h * scale);
    this.x = x;
    this.y = y;
    this.levelMultiplier = levelMultiplier;
    this.health = 1;
    this.facing = -1;
    this.animTime = Math.random() * 10;
    this.type = "base";
  }

  update(platforms, dt, player, anvil) {}
  draw(ctx, camera, isBloodMoon, framesMap) {}
}

// ============================================================================
// 1. GROUND ENEMY — O Bruto Terrestre (Monstrenga / Null)
// ============================================================================
export class GroundEnemy extends BaseEnemy {
  constructor(x, y, levelMultiplier = 1.0, scale = 1.0) {
    super(x, y, 34, 44, levelMultiplier, scale);
    // Velocidade calibrada e orgânica (não acelerada em excesso)
    this.vx = (Math.random() > 0.5 ? 1 : -1) * (85 * levelMultiplier);
    this.vy = 0;
    this.facing = this.vx >= 0 ? 1 : -1;
    this.isGrounded = false;
    this.jumpTimer = Math.random() * 3 + 2;
    this.variant = levelMultiplier > 1.3 ? "null" : "monstrenga";
    this.type = "ground";
  }

  update(platforms, dt, player, anvil) {
    // Salto ocasional sobre vãos e plataformas
    this.jumpTimer -= dt;
    if (this.jumpTimer <= 0 && this.isGrounded) {
      this.vy = -380 * this.levelMultiplier;
      this.jumpTimer = Math.random() * 4 + 2.5;
      this.isGrounded = false;
    }

    // Gravidade
    this.vy += 1050 * dt;

    // Movimentação X com colisão e inversão de marcha
    this.x += this.vx * dt;
    if (Math.abs(this.vx) > 5) {
      this.facing = this.vx > 0 ? 1 : -1;
      this.animTime += dt * 8; // Animação cadenciada a 8 FPS
    }

    let box = { x: this.x, y: this.y, w: this.w, h: this.h };
    for (const p of platforms) {
      if (Physics.checkAABB(box, p)) {
        if (this.vx > 0) {
          this.x = p.x - this.w;
          this.vx = -this.vx;
        } else if (this.vx < 0) {
          this.x = p.x + p.w;
          this.vx = -this.vx;
        }
        box.x = this.x;
      }
    }

    // Movimentação Y e contato com o solo
    this.y += this.vy * dt;
    this.isGrounded = false;
    box = { x: this.x, y: this.y, w: this.w, h: this.h };
    for (const p of platforms) {
      if (Physics.checkAABB(box, p)) {
        if (this.vy > 0) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.isGrounded = true;
        } else if (this.vy < 0) {
          this.y = p.y + p.h;
          this.vy = 0;
        }
        box.y = this.y;
      }
    }
  }

  draw(ctx, camera, isBloodMoon, framesMap) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    let frames = framesMap ? framesMap.monstrenga : null;
    if (isBloodMoon && framesMap) {
      frames = framesMap.red;
    } else if (this.variant === "null" && framesMap) {
      frames = framesMap.null;
    }

    ctx.save();
    ctx.translate(sx + this.w / 2, sy + this.h / 2);
    ctx.scale(this.facing * this.scale, this.scale);

    if (frames && frames.length > 0) {
      const idx = Math.floor(this.animTime) % frames.length;
      const frame = frames[idx];
      if (frame && frame.complete && frame.naturalWidth > 0) {
        ctx.drawImage(frame, -24, -28, 48, 56);
        ctx.restore();
        return;
      }
    }

    // Fallback estilizado para o Bruto Terrestre
    ctx.fillStyle = isBloodMoon ? "#d50000" : (this.variant === "null" ? "#212121" : "#8e24aa");
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);

    // Olhos brilhantes
    ctx.fillStyle = isBloodMoon ? "#ff1744" : "#ffd600";
    ctx.fillRect(4, -8, 6, 6);
    ctx.fillRect(12, -8, 4, 6);
    ctx.restore();
  }
}

// ============================================================================
// 2. DEVILBAT — O Único Voador (Rasante a 45º, Proporção Nítida 1.7:1 sem Deformação)
// ============================================================================
export class DevilBatEnemy extends BaseEnemy {
  constructor(x, y, levelMultiplier = 1.0, scale = 1.0) {
    // Hitbox central equilibrada: 64x34 px (envergadura e corpo)
    super(x, y, 64, 34, levelMultiplier, scale);
    this.type = "devilbat";

    // Velocidades equilibradas com telegrafia justa
    this.cruiseSpeed = 75 * levelMultiplier;
    this.diveSpeed = 160 * levelMultiplier;

    this.state = "cruise"; // "cruise" | "dive" | "climb"
    // O sprite original já tem a cabeça voltada para a ESQUERDA naturalmente (facing = 1 para voar p/ esquerda)
    this.facing = 1;
    this.diveAngle = 0;
    this.targetY = 360;
    this.cooldownTimer = Math.random() * 1.5;
    this.sineOffset = Math.random() * Math.PI * 2;
  }

  update(platforms, dt, player, anvil) {
    // Bate as asas a 9 FPS constante e fluido
    this.animTime += dt * 9;

    const dx = player ? this.x - player.x : 999;

    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
    }

    switch (this.state) {
      case "cruise": {
        // Voo horizontal ondulado nas abóbadas superiores da caverna
        this.x -= this.cruiseSpeed * dt;
        this.y += Math.sin(this.animTime * 2.2 + this.sineOffset) * 28 * dt;
        // Leve inclinação sutil de planeio sem inverter a cabeça
        this.diveAngle = Math.sin(this.animTime * 2.2 + this.sineOffset) * 0.05;
        this.facing = 1; // Cabeça voltada para a esquerda (direção do voo)

        // Gatilho do Rasante a 45º: ao entrar no campo de caça do jogador
        if (this.cooldownTimer <= 0 && dx > 60 && dx < 420 && this.y < 260) {
          this.state = "dive";
          this.targetY = player ? Math.min(410, Math.max(260, player.y - 12)) : 360;
        }
        break;
      }

      case "dive": {
        // Rasante descendente estritamente a 45º: |vx| === |vy|
        const speedComponent = this.diveSpeed * Math.SQRT1_2;
        this.x -= speedComponent * dt;
        this.y += speedComponent * dt;

        // Cabeça inclinada para a frente e para BAIXO na direção do mergulho rasante
        this.diveAngle = -0.42; // ~ -24º apontando para baixo e para a frente
        this.facing = 1;

        // Ao alcançar a altura do jogador ou próximo ao solo, inicia a subida em 45º
        if (this.y >= this.targetY || this.y >= 390 || (dx < 20 && dx > -60)) {
          this.state = "climb";
        }
        break;
      }

      case "climb": {
        // Rasante ascendente estritamente a 45º para recuperar altitude
        const speedComponent = this.diveSpeed * Math.SQRT1_2;
        this.x -= speedComponent * dt;
        this.y -= speedComponent * dt;

        // Cabeça inclinada para CIMA e para a frente na direção da ascensão
        this.diveAngle = 0.35; // ~ +20º apontando para o teto da caverna
        this.facing = 1;

        // Ao recuperar altitude segura no teto da caverna, volta a patrulhar
        if (this.y <= 130) {
          this.state = "cruise";
          this.cooldownTimer = 2.4;
        }
        break;
      }
    }
  }

  draw(ctx, camera, isBloodMoon, framesMap) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    const frames = framesMap ? framesMap.devilbat : null;

    ctx.save();
    ctx.translate(sx + this.w / 2, sy + this.h / 2);
    ctx.scale(this.facing * this.scale, this.scale);
    ctx.rotate(this.diveAngle);

    if (frames && frames.length > 0) {
      const idx = Math.floor(this.animTime) % frames.length;
      const frame = frames[idx];
      if (frame && frame.complete && frame.naturalWidth > 0) {
        // Tamanho imponente e proporcional: 92x54 px (proporção limpa 1.7:1 dos frames desfrisados de 345x204)
        // Zero achatamento, zero bordas brancas, cabeça liderando o movimento para a frente
        ctx.drawImage(frame, -46, -27, 92, 54);

        // Brilho ameaçador nos olhos durante o rasante ou Blood Moon
        if (this.state === "dive" || isBloodMoon) {
          ctx.fillStyle = isBloodMoon ? "#ff1744" : "#00e5ff";
          ctx.beginPath();
          ctx.arc(-10, -7, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
        return;
      }
    }

    // Fallback estilizado proporcional (92x54 px)
    ctx.fillStyle = isBloodMoon ? "#b71c1c" : "#1a237e";
    ctx.beginPath();
    ctx.moveTo(-44, 0);
    ctx.lineTo(-8, -20);
    ctx.lineTo(44, 0);
    ctx.lineTo(0, 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// ============================================================================
// 3. CHAMELEON ENEMY — O Monstro Raro, Menor, Errático que Troca de Cor
// ============================================================================
// Utiliza os assets reais indicados pelo usuário:
// Frame 0: Sprite_asset_32.png (Amarelo)
// Frame 1: Sprite_asset_38.png (Vermelho)
// Frame 2: Sprite_asset_38.png (Vermelho)
// Frame 3: Sprite_asset_38.png (Vermelho)
// Frame 4: Sprite_asset_59.png (Cinza)
// Frame 5: Sprite_asset_64.png (Cinza)
// ============================================================================
export class ChameleonEnemy extends BaseEnemy {
  constructor(x, y, levelMultiplier = 1.0, scale = 1.0) {
    // Menor que os outros monstros (Hitbox proporcional ao scale)
    super(x, y, 26, 32, levelMultiplier, scale);
    this.type = "chameleon";

    // Velocidade de deslocamento cadenciada (não acelerada em excesso)
    this.vx = (Math.random() > 0.5 ? 1 : -1) * (85 * levelMultiplier);
    this.vy = 0;
    this.facing = this.vx >= 0 ? 1 : -1;
    this.isGrounded = false;

    // Comportamento errático / twitchy ("pequeno errado")
    this.twitchTimer = Math.random() * 1.4 + 1.0;
    this.isTwitching = false;
    this.twitchPause = 0;
    this.twitchGlitchX = 0;
    this.twitchGlitchY = 0;
  }

  update(platforms, dt, player, anvil) {
    // Ciclo de animação de 6 quadros a 6 FPS (1.0s para transição completa Amarelo -> Vermelho -> Cinza)
    this.animTime += dt * 6;

    // 1. Comportamento errático / "pequeno errado"
    if (this.twitchPause > 0) {
      this.twitchPause -= dt;
      this.twitchGlitchX = (Math.random() - 0.5) * 4;
      this.twitchGlitchY = (Math.random() - 0.5) * 3;
    } else {
      this.twitchGlitchX *= 0.7;
      this.twitchGlitchY *= 0.7;
    }

    this.twitchTimer -= dt;
    if (this.twitchTimer <= 0) {
      this.twitchTimer = Math.random() * 1.8 + 1.2;
      const roll = Math.random();

      if (roll < 0.4) {
        // Breve pausa espasmódica com micro-vibração
        this.twitchPause = 0.25;
      } else if (roll < 0.75) {
        // Arrancada repentina ou mudança de direção cadenciada
        this.vx = (Math.random() > 0.5 ? 1 : -1) * (105 * this.levelMultiplier);
      } else if (this.isGrounded) {
        // Pequeno salto errático
        this.vy = -310;
        this.isGrounded = false;
      }
    }

    // 2. Reflexo de pânico se a bigorna estiver próxima (< 130px)
    if (anvil) {
      const distToAnvil = Math.hypot(anvil.x - this.x, anvil.y - this.y);
      if (distToAnvil < 130) {
        const fleeDir = this.x < anvil.x ? -1 : 1;
        this.vx = fleeDir * 125 * this.levelMultiplier;
        if (this.isGrounded && Math.random() < 0.25) {
          this.vy = -340;
          this.isGrounded = false;
        }
      }
    }

    // Gravidade
    this.vy += 1050 * dt;

    // Movimentação X quando não estiver travado na micro-pausa
    if (this.twitchPause <= 0) {
      this.x += this.vx * dt;
      if (Math.abs(this.vx) > 5) {
        this.facing = this.vx > 0 ? 1 : -1;
      }
    }

    // Colisão horizontal com blocos/paredes
    let box = { x: this.x, y: this.y, w: this.w, h: this.h };
    for (const p of platforms) {
      if (Physics.checkAABB(box, p)) {
        if (this.vx > 0) {
          this.x = p.x - this.w;
          this.vx = -this.vx;
        } else if (this.vx < 0) {
          this.x = p.x + p.w;
          this.vx = -this.vx;
        }
        box.x = this.x;
      }
    }

    // Movimentação Y e contato com o solo
    this.y += this.vy * dt;
    this.isGrounded = false;
    box = { x: this.x, y: this.y, w: this.w, h: this.h };
    for (const p of platforms) {
      if (Physics.checkAABB(box, p)) {
        if (this.vy > 0) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.isGrounded = true;
        } else if (this.vy < 0) {
          this.y = p.y + p.h;
          this.vy = 0;
        }
        box.y = this.y;
      }
    }
  }

  draw(ctx, camera, isBloodMoon, framesMap) {
    const sx = this.x - camera.x + this.twitchGlitchX;
    const sy = this.y - camera.y + this.twitchGlitchY;

    const frames = framesMap ? framesMap.chameleon : null;
    const frameIdx = frames && frames.length > 0 ? Math.floor(this.animTime) % frames.length : 0;

    ctx.save();
    ctx.translate(sx + this.w / 2, sy + this.h / 2);
    ctx.scale(this.facing * this.scale, this.scale);

    // Aura bioluminescente sutil que acompanha a cor do quadro ativo
    // Frame 0: Amarelo (#ffea00)
    // Frames 1-3: Vermelho (#ff1744)
    // Frames 4-5: Cinza/Ciano espectral (#00e5ff)
    let auraColor = "rgba(0, 229, 255, 0.3)";
    let eyeColor = "#00e5ff";
    if (frameIdx === 0) {
      auraColor = "rgba(255, 234, 0, 0.35)";
      eyeColor = "#ffee58";
    } else if (frameIdx >= 1 && frameIdx <= 3) {
      auraColor = "rgba(255, 23, 68, 0.4)";
      eyeColor = "#ff1744";
    }

    if (isBloodMoon) {
      auraColor = "rgba(255, 23, 68, 0.55)";
      eyeColor = "#ff1744";
    }

    ctx.save();
    const radGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
    radGrad.addColorStop(0, auraColor);
    radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (frames && frames.length > 0) {
      const frame = frames[frameIdx];
      if (frame && frame.complete && frame.naturalWidth > 0) {
        // Desenhado em escala proporcional (34x38 px vs 119x128 original): menor, nítido e sem distorção
        ctx.drawImage(frame, -17, -19, 34, 38);

        // Brilho dos olhos que pulsa acompanhando a mutação cromática
        ctx.fillStyle = eyeColor;
        ctx.fillRect(3, -5, 3, 3);
        ctx.fillRect(8, -5, 3, 3);

        ctx.restore();
        return;
      }
    }

    // Fallback minúsculo colorido caso as imagens ainda estejam carregando
    ctx.fillStyle = frameIdx === 0 ? "#ffd600" : (frameIdx >= 1 && frameIdx <= 3 ? "#ff1744" : "#9e9e9e");
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    ctx.restore();
  }
}

// ============================================================================
// ENEMY MANAGER
// ============================================================================
export class EnemyManager {
  constructor() {
    this.enemies = [];
    this.goreParticles = [];
    this.spawnTimer = 0;

    // Pré-carregamento dos sprites de todos os monstros
    this.frames = {
      monstrenga: [
        "Sprite_asset_56.png",
        "Sprite_asset_34.png",
        "Sprite_asset_48.png",
        "Sprite_asset_54.png",
        "Sprite_asset_36.png",
        "Sprite_asset_40.png",
        "Sprite_asset_41.png"
      ].map(fn => this.loadImage(`assets/enemies/monstrenga/${fn}`)),

      null: [
        "Sprite_asset_44.png",
        "Sprite_asset_27.png",
        "Sprite_asset_46.png",
        "Sprite_asset_58.png",
        "Sprite_asset_63.png",
        "Sprite_asset_35.png",
        "Sprite_asset_42.png"
      ].map(fn => this.loadImage(`assets/enemies/null/${fn}`)),

      red: [
        "Sprite_asset_56.png",
        "Sprite_asset_34.png",
        "Sprite_asset_48.png",
        "Sprite_asset_54.png",
        "Sprite_asset_36.png",
        "Sprite_asset_40.png",
        "Sprite_asset_41.png"
      ].map(fn => this.loadImage(`assets/enemies/red/${fn}`)),

      // O Camaleão: sequência estrita dos 6 frames que alternam as cores (Amarelo -> Vermelho -> Cinza)
      chameleon: [
        "Sprite_asset_32.png",
        "Sprite_asset_38.png",
        "Sprite_asset_38.png",
        "Sprite_asset_38.png",
        "Sprite_asset_59.png",
        "Sprite_asset_64.png"
      ].map(fn => this.loadImage(`assets/enemies/chameleon/${fn}`)),

      // O DevilBat: frames de alta resolução 512x256 (2:1 nativo) na camada da fase
      devilbat: [0, 1, 2, 3, 4, 5, 6].map(i => {
        return this.loadImage(`assets/enemies/devilbat/devilbat_frame_${i}.png`);
      })
    };
  }

  loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  spawnInitialEnemies() {
    // Começa leve e convidativo: apenas 1 jovem monstro pequeno na frente (escala 0.65)
    this.enemies.push(new GroundEnemy(980, 368, 0.9, 0.65));
  }

  spawnGore(x, y, enemyType = "ground") {
    const count = enemyType === "devilbat" ? 14 : (enemyType === "chameleon" ? 20 : 18);
    for (let i = 0; i < count; i++) {
      let color = "#d50000";
      if (enemyType === "chameleon") {
        // Gore cromático multicolorido (amarelo, vermelho e ciano/cinza)
        const cRoll = Math.random();
        color = cRoll < 0.35 ? "#ffea00" : (cRoll < 0.70 ? "#ff1744" : "#00e5ff");
      } else if (enemyType === "devilbat") {
        // Sangue sombrio e fragmentos de asas azuis/púrpuras
        color = Math.random() > 0.4 ? "#311b92" : "#b71c1c";
      } else {
        color = Math.random() > 0.3 ? "#d50000" : "#212121";
      }

      this.goreParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 360,
        vy: (Math.random() - 0.7) * 320,
        size: Math.random() * 4 + 2,
        life: 0.55,
        maxLife: 0.55,
        color
      });
    }
  }

  update(player, anvil, platforms, distanceMeters, isBloodMoon, dt, camera = null) {
    // 1. Spawning progressivo calibrado por distância:
    // Começam raros e pequenos, depois aumentam de tamanho e frequência!
    this.spawnTimer += dt;

    let targetInterval = 5.2; // Espaçado no início (0m)
    let maxEnemies = 2;
    let enemyScale = 0.65; // Pequeno no início

    if (distanceMeters < 90) {
      targetInterval = 5.2;
      maxEnemies = 2;
      enemyScale = 0.65 + (distanceMeters / 90) * 0.12; // 0.65 -> 0.77
    } else if (distanceMeters < 220) {
      targetInterval = 3.6;
      maxEnemies = 4;
      enemyScale = 0.78 + ((distanceMeters - 90) / 130) * 0.18; // 0.78 -> 0.96
    } else if (distanceMeters < 450) {
      targetInterval = 2.4;
      maxEnemies = 7;
      enemyScale = 1.0;
    } else if (distanceMeters < 750) {
      targetInterval = 1.8;
      maxEnemies = 9;
      enemyScale = 1.05;
    } else {
      targetInterval = 1.35;
      maxEnemies = 12;
      enemyScale = 1.12;
    }

    if (isBloodMoon) {
      targetInterval *= 0.6;
      maxEnemies += 2;
    }

    if (this.spawnTimer >= targetInterval && this.enemies.length < maxEnemies) {
      this.spawnTimer = 0;
      const minOffScreenX = camera ? camera.x + 960 + 120 : player.x + 750;
      const spawnX = minOffScreenX + Math.random() * 240;
      const mult = 1.0 + (distanceMeters / 100) * 0.22 + (isBloodMoon ? 0.35 : 0);

      // Distribuição por distância:
      // Início (0-90m): Apenas terrestres pequenos / camaleões
      // 90m+: Começam a surgir DevilBats no ar
      const roll = Math.random();

      if (roll < 0.35 && distanceMeters >= 90) {
        // DevilBat: nasce alto no céu sem precisar de chão
        const spawnY = 110 + Math.random() * 90;
        this.enemies.push(new DevilBatEnemy(spawnX, spawnY, mult, enemyScale));
      } else if (roll < 0.60) {
        // O Camaleão: nasce alinhado às plataformas
        let groundY = 370;
        for (const p of platforms) {
          if ((p.type === "ground" || p.type === "pillar") && spawnX >= p.x && spawnX <= p.x + p.w) {
            groundY = p.y - Math.round(32 * enemyScale);
            break;
          }
        }
        this.enemies.push(new ChameleonEnemy(spawnX, groundY, mult, enemyScale));
      } else {
        // Bruto Terrestre (Monstrenga / Null)
        let groundY = 356;
        for (const p of platforms) {
          if ((p.type === "ground" || p.type === "pillar") && spawnX >= p.x && spawnX <= p.x + p.w) {
            groundY = p.y - Math.round(44 * enemyScale);
            break;
          }
        }
        this.enemies.push(new GroundEnemy(spawnX, groundY, mult, enemyScale));
      }
    }

    // 2. Atualização e colisões
    const anvilBox = { x: anvil.x, y: anvil.y, w: anvil.w, h: anvil.h };
    const playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };

    let killsThisFrame = 0;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(platforms, dt, player, anvil);

      const eBox = { x: e.x, y: e.y, w: e.w, h: e.h };

      // Impacto da Bigorna esmagando o inimigo (em terra ou em pleno ar contra o DevilBat!)
      if (Physics.checkAABB(anvilBox, eBox)) {
        this.spawnGore(e.x + e.w / 2, e.y + e.h / 2, e.type);
        sound.playGore();
        sound.playMetalClang(1.2);
        this.enemies.splice(i, 1);

        // Bônus especial de gás ao abater o monstro raro (+25%) ou o voador (+18%)
        const gasBonus = e.type === "chameleon" ? 25 : (e.type === "devilbat" ? 18 : 14);
        player.addGasCharge(gasBonus);
        killsThisFrame++;
        continue;
      }

      // Colisão do Inimigo causando dano ao jogador
      if (Physics.checkAABB(playerBox, eBox)) {
        const damage = e.type === "devilbat" ? 16 : (e.type === "chameleon" ? 18 : 20);
        player.takeDamage(damage);
      }

      // Descarte de inimigos que caíram no abismo ou ficaram muito para trás da câmera
      const leftCullBound = camera ? camera.x - 380 : player.x - 650;
      if (e.y > 880 || e.x < leftCullBound) {
        this.enemies.splice(i, 1);
      }
    }

    // 3. Atualização das partículas de sangue/gore
    for (let i = this.goreParticles.length - 1; i >= 0; i--) {
      const g = this.goreParticles[i];
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.vy += 920 * dt;
      g.life -= dt;
      if (g.life <= 0) this.goreParticles.splice(i, 1);
    }

    return killsThisFrame;
  }

  draw(ctx, camera, isBloodMoon = false) {
    // Desenha todos os inimigos ativos com suas respectivas animações
    this.enemies.forEach(e => e.draw(ctx, camera, isBloodMoon, this.frames));

    // Desenha partículas de impacto/gore
    ctx.save();
    this.goreParticles.forEach(g => {
      ctx.fillStyle = g.color;
      ctx.globalAlpha = g.life / g.maxLife;
      ctx.fillRect(g.x - camera.x, g.y - camera.y, g.size, g.size);
    });
    ctx.restore();
  }
}
