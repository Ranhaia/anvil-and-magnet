# Plano de Implementação — Gerador Bi-Nível Procedural Infinito & Variedade de Fase

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. Os passos utilizam a sintaxe de checkbox (`- [ ]`) para rastreamento.

**Goal:** Substituir o mapa estático e quadrado por um gerador procedural infinito bi-nível (superfície contínua + subterrâneo com rotas de retorno), integrando autotiling com os novos tiles 32x32, coletáveis animados, perigos de espinhos reais, altares e ambientação rica.

**Architecture:** Módulo de chunks desacoplado (`src/chunks.js`) com streaming horizontal dinâmico gerenciado por `GameMap` (`src/map.js`), sistema de coletáveis (`src/collectibles.js`) e perigos (`src/hazards.js`). O herói usa os novos sprites 48x64 e o parallax consome as artes de `assets/environment/`.

**Tech Stack:** JavaScript ES Modules, HTML5 Canvas 2D, Web Audio API, assets RGBA nativos em 24 FPS.

**Spec:** [`docs/superpowers/specs/2026-10-10-infinite-procedural-runner-design.md`](file:///c:/dev/GAME%20JAM/docs/superpowers/specs/2026-10-10-infinite-procedural-runner-design.md)

---

### Mapeamento de Arquivos
- **Criação:**
  - `src/chunks.js`: Catálogo de 8 arquétipos de chunks bi-nível e gerador procedural sequencial.
  - `src/collectibles.js`: Gerenciador de moedas de engrenagem (`scrap_coin`) e orbes de alma (`soul_orb`) com animação em spritesheet.
- **Modificação:**
  - `src/map.js`: Reescrito para suportar streaming de chunks, renderização com tiles 32x32 reais (`assets/tiles/`), santuários e altares.
  - `src/player.js`: Integração com sprites 48x64 (`assets/hero/`), remoção do kill-plane prematuro em Y=750 e reação a espinhos.
  - `src/parallax.js`: Integração das novas camadas (`sky_gradient.png`, `ridge_far.png`, `ridge_mid.png`, `moon_blood.png`).
  - `src/game.js`: Conexão do loop de jogo com chunks infinitos, coleta de itens e dano de espinhos.

---

## Tarefa 1: Arquitetura de Chunks & Gerador Procedural Bi-Nível (`src/chunks.js`)

- [ ] **Passo 1.1:** Criar `src/chunks.js` exportando o catálogo de arquétipos bi-nível de 640px de largura:
  - `CHUNK_START`: Santuário inicial, solo contínuo plano, sem fendas, seguro.
  - `CHUNK_RUNWAY`: Pista expressa com solo de alta velocidade e arcos de moedas.
  - `CHUNK_CHASM_DESCENT`: Fenda de 160px com plataformas de descida para o subterrâneo e vigas de metal suspensas.
  - `CHUNK_MAGNETIC_ASCENT`: Chaminé vertical de resgate com pilares condutores de metal e degraus em zig-zag para voltar à superfície.
  - `CHUNK_SPIKE_GAUNTLET`: Caverna profunda com fosso de espinhos (`tile_spikes`) e vigas elevadas.
  - `CHUNK_SHRINE_HAVEN`: Santuário sagrado na superfície com pilar de cura e registro de checkpoint de Recall [Q].
  - `CHUNK_SKY_RUINS`: Ruínas elevadas com pontes de vigas de aço suspensas.
  - `CHUNK_VAULT_TREASURE`: Câmara subterrânea repleta de orbes e botijões de gás.
- [ ] **Passo 1.2:** Implementar gerador determinístico/aleatório ponderado com base na distância em metros e escalada de perigo.
- [ ] **Passo 1.3:** Testar em node `node --check src/chunks.js`.
- [ ] **Passo 1.4:** Commitar `src/chunks.js`.

---

## Tarefa 2: Autotiling e Renderização dos Novos Tiles em `src/map.js`

- [ ] **Passo 2.1:** Carregar todas as texturas de `assets/tiles/` em `src/map.js`:
  - `tile_stone_top.png`, `tile_stone_mid.png`, `tile_stone_left.png`, `tile_stone_right.png`, `tile_stone_bot.png`.
  - `tile_metal_beam.png`, `tile_metal_post.png`, `tile_spikes.png`.
  - Elementos de cenário: `sanctuary_pillar.png`, `crystal_active.png`, `fortune_altar.png`, `deco_pillar.png`.
- [ ] **Passo 2.2:** Implementar rotina de renderização por tiles de 32x32:
  - Plataformas de pedra renderizam o topo com musgo, extremidades arredondadas nas bordas de fenda e miolo de pedra mármore.
  - Plataformas de metal renderizam textura de viga com rebites.
  - Espinhos renderizam dentes de ferro ensanguentados.
- [ ] **Passo 2.3:** Integrar streaming horizontal: gerar novos chunks quando `camera.x + 1800 > furthestX` e descartar chunks além de `camera.x - 1200`.
- [ ] **Passo 2.4:** Testar renderização no Canvas.
- [ ] **Passo 2.5:** Commitar `src/map.js`.

---

## Tarefa 3: Sistema de Coletáveis e Perigos (`src/collectibles.js` & `src/game.js`)

- [ ] **Passo 3.1:** Criar `src/collectibles.js` para gerenciar Moedas de Engrenagem e Orbes de Alma:
  - Spritesheet animado de 4 frames (16x16) com rotação suave a 24 FPS.
  - Detecção de colisão AABB com o jogador.
  - Efeitos: Moedas dão pontos/combo (`sound.playPowerup`); Orbes de Alma recarregam a barra de gás do especial (`player.addGasCharge(20)`).
- [ ] **Passo 3.2:** Integrar espinhos como perigo físico real:
  - Quando o jogador toca em um bloco de espinho, recebe 30 de dano, é arremessado para cima (`vy = -420`) e sofre screenshake.
- [ ] **Passo 3.3:** Atualizar `player.y > 950` como o único limite de abismo real (em vez de matar prematuramente a 750).
- [ ] **Passo 3.4:** Commitar `src/collectibles.js` e alterações em `src/game.js`.

---

## Tarefa 4: Sprites do Herói 48x64 e Parallax Oficial (`src/player.js` & `src/parallax.js`)

- [ ] **Passo 4.1:** Atualizar `src/player.js` para usar as artes de `assets/hero/`:
  - `hero_idle.png` (parado).
  - `hero_run_0.png` até `hero_run_7.png` (corrida a 24 FPS sincronizada com a velocidade).
  - `hero_jump.png` (impulso e subida).
  - `hero_fall_fast.png` (queda rápida).
  - `hero_anvil_ride.png` (surfando na bigorna para duplo salto).
- [ ] **Passo 4.2:** Atualizar `src/parallax.js` para usar:
  - `assets/environment/sky_gradient.png` (gradiente de céu noturno).
  - `assets/environment/ridge_far.png` (montanhas ao fundo, 0.04x).
  - `assets/environment/ridge_mid.png` (ruínas e torres, 0.12x).
  - `assets/environment/moon_blood.png` (lua vermelha com glow).
- [ ] **Passo 4.3:** Testar no navegador local e validar alinhamento e animação.
- [ ] **Passo 4.4:** Commitar melhorias visuais.

---

## Tarefa 5: Verificação Geral, Playtest & Deploy

- [ ] **Passo 5.1:** Validar sintaxe de todos os arquivos modificados via Node.
- [ ] **Passo 5.2:** Testar jogabilidade no servidor local em `http://localhost:3000`:
  - Correr na superfície e pegar moedas.
  - Cair em uma fenda e chegar ao subterrâneo sem morrer.
  - Usar a rota de escalada / bigorna para voltar à superfície.
  - Encontrar santuários que atualizam o Recall [Q].
- [ ] **Passo 5.3:** Commitar e publicar no Vercel.
