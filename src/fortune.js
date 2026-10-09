import { sound } from "./audio.js";

export class FortuneSystem {
  constructor() {
    this.deck = [
      {
        id: "titanic",
        title: "Impacto Titânico",
        desc: "A bigorna ganha +40% de força de impacto e área, mas seu peso reduz o pulo em 10%.",
        apply: (game) => {
          game.anvil.basePower *= 1.4;
        }
      },
      {
        id: "supersonic",
        title: "Ímã Supersônico",
        desc: "A velocidade de tração magnética aumenta em 50%, com faíscas azuis elétricas contínuas.",
        apply: (game) => {
          game.anvil.basePower *= 1.5;
        }
      },
      {
        id: "blood_pact",
        title: "Pacto de Sangue",
        desc: "Todos os pontos conquistados são multiplicados por 2x, mas você perde 15 de vida máxima.",
        apply: (game) => {
          game.scoreMultiplierBonus += 1.0;
          game.player.maxHealth = Math.max(40, game.player.maxHealth - 15);
          game.player.health = Math.min(game.player.health, game.player.maxHealth);
        }
      },
      {
        id: "quick_gas",
        title: "Válvula de Alta Pressão",
        desc: "O Especial do Botijão de Gás carrega 2x mais rápido para você limpar salas inteiras.",
        apply: (game) => {
          game.gasChargeRate = 2.0;
        }
      },
      {
        id: "speed_demon",
        title: "Passos Relâmpago",
        desc: "O herói move-se 25% mais rápido no chão e no ar.",
        apply: (game) => {
          game.playerSpeedBonus = 1.25;
        }
      }
    ];
  }

  getRandomPair() {
    const shuffled = [...this.deck].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }
}
