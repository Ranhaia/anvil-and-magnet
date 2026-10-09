# Micro-Metroidvania Magnético em HTML5 Canvas — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir e disponibilizar para teste imediato no navegador o jogo Micro-Metroidvania Roguelite 2D em HTML5 Canvas com física magnética, bigornas variadas, especial do botijão de gás, paralaxe com o DevilBat em looping, eventos de Lua Vermelha e permadeath.

**Architecture:** Motor web modular em Vanilla JS puro (Canvas 2D + Web Audio API) inspirado na arquitetura limpa do *Supremo Tribunal Fighter* (`stf.fepache.co`), integrando os assets originais recuperados da Unity 5.5 em uma experiência arcade a 60 FPS.

**Tech Stack:** HTML5 Canvas, Vanilla JavaScript (ES6 Modules), Web Audio API, CSS3.

**Spec:** [docs/superpowers/specs/2026-10-09-micro-metroidvania-canvas-design.md](file:///c:/dev/GAME%20JAM/docs/superpowers/specs/2026-10-09-micro-metroidvania-canvas-design.md)

## Global Constraints
- Sem frameworks pesados (React, Phaser) — Vanilla JS e Canvas 2D nativo.
- Viewport base interno de 960x540 com escala responsiva mantendo proporção 16:9.
- `imageSmoothingEnabled = false` para preservar pixel art nítida.
- Carregamento de todos os assets originais da pasta `assets/`.
- Permadeath por run com registro de recorde (High Score).

---

### Task 1: Shell HTML5, Estilos Arcade e Servidor Local de Teste

**Files:**
- Create: `c:\dev\GAME JAM\index.html`
- Create: `c:\dev\GAME JAM\style.css`

**Interfaces:**
- Produces: `<canvas id="game-canvas">`, overlay de HUD, tela de início estilizada com `title_screen.png`, favicon configurado e container responsivo.

- [ ] **Step 1: Criar index.html com canvas e overlays**
- [ ] **Step 2: Criar style.css com estética de gabinete arcade e layout responsivo**
- [ ] **Step 3: Testar carregamento no navegador e validar favicon**

---

### Task 2: Sintetizador de Áudio Retrô (Web Audio API)

**Files:**
- Create: `c:\dev\GAME JAM\src\audio.js`

**Interfaces:**
- Produces: `SoundFx.playMetalClang()`, `SoundFx.playMagnetHum(volume)`, `SoundFx.playGasHiss()`, `SoundFx.playExplosion()`, `SoundFx.playBloodMoonAlarm()`, `SoundFx.playJump()`, `SoundFx.playGore()`.

- [ ] **Step 1: Implementar sintetizador de frequências e ruídos para impactos e eventos**
- [ ] **Step 2: Integrar controle de mudo e desbloqueio por interação do usuário**

---

### Task 3: Renderizador de Paralaxe Multi-Camadas e Looping do DevilBat

**Files:**
- Create: `c:\dev\GAME JAM\src\parallax.js`

**Interfaces:**
- Consumes: `assets/background_sky.png`, `assets/devilbat.gif`
- Produces: `Parallax.draw(ctx, cameraX, cameraY, isBloodMoon, time)`

- [ ] **Step 1: Implementar Camada 0 (céu e transição dinâmica da Lua Vermelha)**
- [ ] **Step 2: Implementar Camada 1 (silhuetas distantes e patrulha do DevilBat em 7 frames)**
- [ ] **Step 3: Implementar Camada 2 (névoa e estruturas intermediárias)**

---

### Task 4: Motor de Física e Mapa Micro-Metroidvania

**Files:**
- Create: `c:\dev\GAME JAM\src\physics.js`
- Create: `c:\dev\GAME JAM\src\map.js`

**Interfaces:**
- Produces: `Physics.checkAABB()`, `Physics.raycast()`, `GameMap.getColliders()`, `GameMap.zones`, santuários de cura e teleporte de retorno.

- [ ] **Step 1: Criar detector de colisão AABB sólido para plataformas e paredes**
- [ ] **Step 2: Gerar layout do mundo (Templo Central, Catacumbas, Abismo dos Pilares)**
- [ ] **Step 3: Implementar santuários de cura e teleporte de Recall**

---

### Task 5: Herói, Animações e Movimentação com Game Feel Ágil

**Files:**
- Create: `c:\dev\GAME JAM\src\player.js`

**Interfaces:**
- Consumes: `assets/hero/*.png`
- Produces: `Player.update(keys, dt)`, `Player.draw(ctx, camera)` com coyote time e jump buffer.

- [ ] **Step 1: Carregar frames de caminhada e idle do herói**
- [ ] **Step 2: Implementar física de plataforma (pulo, coyote time, pulo duplo, hoverboard)**
- [ ] **Step 3: Integrar teleporte e telemetria de distância em metros**

---

### Task 6: Sistema de Magnetismo, Tipos de Bigorna e Esmagamento

**Files:**
- Create: `c:\dev\GAME JAM\src\magnetism.js`
- Create: `c:\dev\GAME JAM\src\anvil.js`

**Interfaces:**
- Consumes: `assets/anvil.png`, cursor do mouse
- Produces: `Anvil.update(magnetVector, mouseDist, dt)`, `Anvil.draw(ctx, camera)`, tipos Pequena / Titânica / Yoyo.

- [ ] **Step 1: Implementar balestra do mouse (força proporcional à distância)**
- [ ] **Step 2: Implementar Bigorna Pequena, Grande e Bigorna Yoyo com corda elástica**
- [ ] **Step 3: Implementar detecção de esmagamento com faíscas metálicas e screenshake**

---

### Task 7: Inimigos com IA de Salto e Hordas Escalonadas

**Files:**
- Create: `c:\dev\GAME JAM\src\enemies.js`

**Interfaces:**
- Produces: `EnemyManager.update(player, anvil, dt)`, `EnemyManager.draw(ctx, camera)` e partículas de gore.

- [ ] **Step 1: Implementar monstros terrestres com inversão de marcha e saltos**
- [ ] **Step 2: Integrar escalonamento de dificuldade por distância da base**
- [ ] **Step 3: Implementar sistema de partículas de gore na colisão com a bigorna**

---

### Task 8: O Especial "Olha o Gás!", Lua Vermelha e Sorte ou Revés

**Files:**
- Create: `c:\dev\GAME JAM\src\special-gas.js`
- Create: `c:\dev\GAME JAM\src\blood-moon.js`
- Create: `c:\dev\GAME JAM\src\fortune.js`

**Interfaces:**
- Consumes: `assets/gas_tank.png`
- Produces: Invocação do botijão, raio de oclusão da bigorna, detonação, ciclo da Lua Vermelha e cartas de Sorte ou Revés.

- [ ] **Step 1: Implementar botijão com chiado e contagem regressiva de 2.5s**
- [ ] **Step 2: Implementar cálculo de raio de sombra/escudo atrás da bigorna**
- [ ] **Step 3: Implementar o ciclo de Lua Vermelha e cartas de Sorte ou Revés**

---

### Task 9: Game Loop Principal, HUD e Entrega para Teste

**Files:**
- Create: `c:\dev\GAME JAM\src\camera.js`
- Create: `c:\dev\GAME JAM\src\engine.js`
- Create: `c:\dev\GAME JAM\src\game.js`

**Interfaces:**
- Conecta todos os subsistemas, estado de Menu, Jogo, Game Over e inicia servidor local HTTP.

- [ ] **Step 1: Integrar câmera focada com amortecimento e screenshake**
- [ ] **Step 2: Ligar o HUD com medidor de distância, vida, especial e multiplicador**
- [ ] **Step 3: Iniciar servidor local e validar o jogo funcionando no navegador**
