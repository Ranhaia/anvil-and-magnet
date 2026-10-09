# Especificação de Design — Micro-Metroidvania Magnético em HTML5 Canvas

**Data:** 2026-10-09  
**Status:** Aprovado  
**Pilha Tecnológica:** HTML5 Canvas (Vanilla JS), Web Audio API, CSS3  
**Inspiração & Referências:** *Supremo Tribunal Fighter* (`stf.fepache.co`), *TowerFall*, *Celeste*, *Downwell*  

---

## 1. Visão Geral do Produto

O projeto é a reconstrução e evolução do jogo da Global Game Jam (`GGJ - IFRJ`), originalmente desenvolvido em Unity 5.5, transformando-o em um **Micro-Metroidvania Roguelite de Sobrevivência e Ação em HTML5 Canvas**.

O jogador controla um herói com poderes de atração e repulsão magnética sobre uma **bigorna física**, enfrentando hordas de monstros em um mapa interconectado com escalada de intensidade, eventos periódicos de sobrevivência (*Lua Vermelha*), armas magnéticas variadas, mobilidade expansível e uma mecânica especial com um **botijão de gás explosivo**.

---

## 2. Pilares de Design e Requisitos

1. **Web Nativo Leve e Instantâneo:** Roda diretamente em qualquer navegador moderno sem frameworks pesados ou processos de compilação complexos (< 3 MB de peso total).
2. **Game Feel Ágil (TowerFall / Celeste):** Resposta imediata de pulo, *coyote time*, *jump buffering*, inércia precisa e impacto físico marcante (*freeze frame* de impacto e *screenshake*).
3. **Escalada de Risco vs. Recompensa:** Quanto mais metros o jogador se afasta do Templo Central Seguro, maior a agressividade dos monstros e maior o multiplicador de pontos.
4. **Permadeath Roguelite:** Morreu = fim da run com gravação de recorde (*High Score*). Cada partida é única devido aos modificadores de "Sorte ou Revés".
5. **Cenário Vivo em Parallax e Looping:** Múltiplas camadas de profundidade com rolagem suave contínua e o morcego `DevilBat` animado voando em loop no fundo.

---

## 3. Arquitetura do Sistema

```
c:\dev\GAME JAM\
├── index.html                   # Shell da página com canvas 960x540 e viewport responsivo
├── style.css                    # Estilos arcade, centralização e reset visual
├── src\
│   ├── engine.js                # Game Loop (60 FPS, delta-time fixo, requestAnimationFrame)
│   ├── camera.js                # Câmera focada single-player com amortecimento (lerp) e screenshake
│   ├── parallax.js              # 4 camadas de profundidade + DevilBat em loop
│   ├── physics.js               # Colisão AABB de plataforma e cálculo de forças vetoriais
│   ├── player.js                # Movimentação, pulo, pulo alto/duplo, estado de hoverboard
│   ├── magnetism.js             # Vetores de atração/repulsão proporcionais à distância do mouse
│   ├── anvil.js                 # Tipos de bigorna (Pequena, Titânica, Yoyo com corda)
│   ├── enemies.js               # IA de solo com saltos, patrulha e explosão de gore
│   ├── special-gas.js           # Botijão de gás, contagem regressiva e raio de escudo da bigorna
│   ├── blood-moon.js            # Ciclo periódico da Lua Vermelha e modo frenesi
│   ├── map.js                   # Zonas interconectadas, barreiras, santuários e templos
│   ├── fortune.js               # Sistema de "Sorte ou Revés" (modificadores aleatórios)
│   └── audio.js                 # Sintetizador via Web Audio API para impactos, ímã e explosões
└── assets\                      # Sprites otimizados (extraídos de Arquivos de imagem/)
```

---

## 4. Detalhamento de Mecânicas

### 4.1. Controles e Movimentação
* `A` / `D` ou `Setas`: Andar esquerda/direita com aceleração instantânea.
* `W` / `Espaço` / `Seta Cima`: Pulo (com 6 frames de *coyote time* e 5 frames de *jump buffer*).
* `Pulo Alto / Pulo Duplo`: Desbloqueado ao encontrar o upgrade nas Catacumbas.
* `Q` ou `R`: Canalizar o **Teleporte de Retorno** para o Templo Central Seguro (recarrega por tempo/abates).
* `E` ou `Shift`: Ativar o Especial **"Olha o Gás!"** (requer barra de pressão cheia).

### 4.2. Física Magnética e Balestra do Mouse
* O vetor de força magnética é dado pela posição do cursor relativa ao jogador:
  $$\vec{F} = (\vec{P}_{\text{mouse}} - \vec{P}_{\text{jogador}})$$
* **Aceleração Dinâmica por Distância:** Quanto maior a distância da mira até o jogador, maior a força de ejeção/tração aplicada sobre a bigorna.
* **Botão Esquerdo do Mouse:** Puxa a bigorna (PULL).
* **Botão Direito do Mouse:** Lança a bigorna violentamente na direção oposta (PUSH).

### 4.3. Variedade de Bigornas
1. **Bigorna Pequena (Inicial):**
   * Massa baixa, aceleração ágil, ótima para ataques rápidos e rebatidas sucessivas.
2. **Bigorna Titânica:**
   * Massa pesada, alta inércia. Área de impacto 2.5x maior, esmaga grupos de inimigos simultâneos e oferece uma "sombra de escudo" muito mais ampla para o Especial.
3. **Bigorna Yoyo (com Corda Elástica):**
   * Presa ao herói por um raio máximo de corda ($R_{\text{max}} = 180\text{px}$). Ao atingir o limite da corda, sofre tração elástica imediata de volta, permitindo combos circulares e chicotadas devastadoras.

### 4.4. Placa de Ferro Flutuante (Hoverboard)
* Ao pisar sobre uma placa metálica especial, o herói pode ativá-la para flutuar e planar sobre abismos.
* **Equilíbrio inicial:** Durante o voo da placa, o jogador não pode disparar ataques com a bigorna (foco estrito na navegação).
* **Upgrade:** Permite lançar a bigorna mesmo durante o voo planado.

### 4.5. O Especial: "Olha o Gás!" 💥
1. O herói puxa magneticamente um botijão de gás de aço azul para o centro da arena.
2. O botijão emite chiado sonoro e pisca por 2.5 segundos em contagem regressiva.
3. **A Mecânica de Sombra/Escudo:**
   * Uma linha de visão (Raycast) é calculada do centro do botijão até o herói.
   * Se a caixa de colisão da bigorna interceptar esse raio ($P_{\text{botijão}} \to P_{\text{bigorna}} \to P_{\text{herói}}$), a bigorna absorve 100% da onda de choque.
   * Se o herói estiver desprotegido, toma 50% de dano na vida.
4. **Detonação:** Todos os monstros na tela são aniquilados em partículas de chamas e fumaça, gerando bônus massivo de pontuação.

### 4.6. Evento "Lua Vermelha" (Blood Moon)
* Ocorre periodicamente a cada 90–120 segundos.
* Céu e iluminação transicionam para vermelho carmesim em 3 segundos.
* Inimigos ganham +40% de velocidade de corrida, olhos brilhantes e surgem em dobro.
* Força o jogador a avaliar se arrisca a sobrevivência ou usa o teleporte para o Templo Seguro.

### 4.7. Sistema de "Sorte ou Revés" (Modifiers Roguelite)
Ao interagir com Altares da Fortuna pelo mapa, o jogador recebe pares de benefícios com custos:
* *Fúria Pesada:* Bigorna com 2x de impacto, porém velocidade de salto reduzida em 15%.
* *Ímã Caótico:* Força de repulsão 2x maior, mas a bigorna ricocheteia descontroladamente.
* *Pacto de Sangue:* Dobra os pontos por abate, mas o jogador não recupera vida no próximo santuário.

---

## 5. Renderização em Parallax e Looping de Fundo

* **Viewport Base:** 960 × 540 pixels, fixo internamente com proporção mantida e tela cheia responsiva.
* `ctx.imageSmoothingEnabled = false` para preservação da nitidez de pixel art.
* **Camada 0 ($0.02\times$):** Gradiente de céu com ciclo dia/noite e efeito carmesim da Lua Vermelha.
* **Camada 1 ($0.06\times$):** Silhuetas de ruínas e o **DevilBat** animado em loop (7 quadros) voando em altitude variável.
* **Camada 2 ($0.15\times$):** Estruturas góticas intermediárias e partículas de névoa ambiental.
* **Camada 3 ($1.0\times$):** Plataformas ativas, herói, monstros, bigorna e partículas de combate.

---

## 6. Critérios de Sucesso e Verificação

1. Jogo abre instantaneamente em navegador web local sem falhas de console.
2. Bigorna responde fielmente aos botões esquerdo e direito do mouse com inércia visível.
3. Distância do mouse para o boneco modula a intensidade do arremesso.
4. Esmagamento de inimigos gera partículas de gore e soma pontuação escalonada por distância.
5. Especial do botijão de gás explode com sucesso, e a bigorna protege o herói quando posicionada na frente.
6. Evento de Lua Vermelha ativa visualmente e acentua o perigo da partida.
7. Teleporte retorna o jogador ao Templo Central.
8. Ao zerar a vida, a tela de Game Over surge com a pontuação final e opção de reinício imediato.
