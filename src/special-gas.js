import { Physics } from "./physics.js";
import { sound } from "./audio.js";

export class GasTankSpecial {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.w = 36;
    this.h = 48;
    this.countdown = 1.8;
    this.img = new Image();
    this.img.src = "assets/gas_tank.png";
    this.shockwaves = [];
  }

  reset() {
    this.active = false;
    this.countdown = 1.8;
    this.shockwaves = [];
  }

  // Ativação mirando exatamente onde o cursor do mouse está
  activate(player, camera, targetX = null, targetY = null) {
    if (this.active) return false;
    this.active = true;
    this.countdown = 1.8;
    this.shockwaves = []; // Limpa detonações anteriores

    if (targetX !== null && targetY !== null) {
      // Posiciona exatamente no ponto do cursor em coordenadas do mundo
      this.x = targetX - this.w / 2;
      this.y = targetY - this.h / 2;
    } else {
      // Fallback à frente do herói se mouse não for fornecido
      this.x = player.x + (player.facing * 120);
      this.y = player.y - 40;
    }

    sound.playGasHiss();
    return true;
  }

  update(player, anvil, enemyManager, dt) {
    // 1. Atualiza e remove ondas de choque ativas por duração e transparência
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.age = (sw.age || 0) + dt;
      const progress = sw.age / sw.duration;
      sw.radius = sw.startRadius + (sw.maxRadius - sw.startRadius) * Math.min(1, progress);
      sw.alpha = Math.max(0, 1 - progress);

      // Descarte definitivo quando expira
      if (progress >= 1.0 || sw.alpha <= 0.01 || sw.age >= 0.5) {
        this.shockwaves.splice(i, 1);
      }
    }

    if (!this.active) return 0;

    this.countdown -= dt;
    let kills = 0;

    // Momento da Detonação
    if (this.countdown <= 0) {
      this.active = false;
      sound.playExplosion();

      const gasCenter = { x: this.x + this.w / 2, y: this.y + this.h / 2 };

      // O GÁS É UMA ARMA DO JOGADOR: NUNCA MAIS DÁ DANO NO PERSONAGEM!
      // Se a bigorna estiver próxima, gera faíscas metálicas de impacto cosmético
      if (anvil) {
        const anvilDist = Physics.distance(gasCenter.x, gasCenter.y, anvil.x + anvil.w / 2, anvil.y + anvil.h / 2);
        if (anvilDist < 260) {
          anvil.spawnSparks(anvil.x + anvil.w / 2, anvil.y + anvil.h / 2);
          sound.playMetalClang(1.4);
        }
      }

      // Elimina todos os inimigos na área de visão/impacto
      for (let i = enemyManager.enemies.length - 1; i >= 0; i--) {
        const e = enemyManager.enemies[i];
        enemyManager.spawnGore(e.x + e.w / 2, e.y + e.h / 2);
        enemyManager.enemies.splice(i, 1);
        kills++;
      }

      // Adiciona onda de choque com tempo de vida calibrado
      this.shockwaves.push({
        x: gasCenter.x,
        y: gasCenter.y,
        startRadius: 16,
        radius: 16,
        maxRadius: 440,
        age: 0,
        duration: 0.45,
        alpha: 1.0
      });
    }

    return kills;
  }

  draw(ctx, camera, mouse = null, isReady = false) {
    // 1. Mira tática onde o mouse está quando o Especial está carregado e pronto
    if (isReady && mouse && !this.active) {
      ctx.save();
      const mx = mouse.x;
      const my = mouse.y;

      ctx.strokeStyle = "rgba(255, 171, 0, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mx, my, 18, 0, Math.PI * 2);
      ctx.stroke();

      // Miras em cruz
      ctx.beginPath();
      ctx.moveTo(mx - 24, my);
      ctx.lineTo(mx - 8, my);
      ctx.moveTo(mx + 8, my);
      ctx.lineTo(mx + 24, my);
      ctx.moveTo(mx, my - 24);
      ctx.lineTo(mx, my - 8);
      ctx.moveTo(mx, my + 8);
      ctx.lineTo(mx, my + 24);
      ctx.stroke();

      // Rótulo
      ctx.fillStyle = "#ffd600";
      ctx.font = "bold 10px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("[E] LANÇAR GÁS", mx, my + 34);
      ctx.restore();
    }

    // 2. Desenhar Ondas de Choque
    for (const sw of this.shockwaves) {
      if (!sw || sw.alpha <= 0.01) continue;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 171, 0, ${sw.alpha.toFixed(3)})`;
      ctx.lineWidth = Math.max(0.5, 14 * sw.alpha);
      ctx.beginPath();
      ctx.arc(sw.x - camera.x, sw.y - camera.y, Math.max(1, sw.radius), 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 23, 68, ${(sw.alpha * 0.8).toFixed(3)})`;
      ctx.lineWidth = Math.max(0.5, 6 * sw.alpha);
      ctx.beginPath();
      ctx.arc(sw.x - camera.x, sw.y - camera.y, Math.max(1, sw.radius * 0.7), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (!this.active) return;

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    // Aura de perigo pulsante
    const blink = Math.sin(Date.now() / 60) > 0;
    if (blink) {
      ctx.fillStyle = "rgba(255, 23, 68, 0.4)";
      ctx.beginPath();
      ctx.arc(sx + this.w / 2, sy + this.h / 2, 34, 0, Math.PI * 2);
      ctx.fill();
    }

    // Desenha o botijão de gás
    if (this.img.complete && this.img.naturalWidth > 0) {
      ctx.drawImage(this.img, sx, sy, this.w, this.h);
    } else {
      ctx.fillStyle = "#1976d2";
      ctx.fillRect(sx, sy, this.w, this.h);
    }

    // Cronômetro flutuante sobre o botijão
    ctx.fillStyle = "#ffd600";
    ctx.font = "900 14px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${this.countdown.toFixed(1)}s`, sx + this.w / 2, sy - 8);
    ctx.restore();
  }
}
