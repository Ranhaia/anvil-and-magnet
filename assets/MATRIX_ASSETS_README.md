# Catálogo Completo de Assets do Jogo (Matriz Expandida)

Todos os assets foram gerados e salvos com **canal alfa (RGBA)**, calibrados na paleta do jogo (**Mármore Azul Pixar 128**, turquesa bioluminescente, aço magnético e roxo de ametista).

---

## A. Personagem & Mobilidade (`assets/hero/`) — 48 × 64 px

| Arquivo | Resolução | Função no Jogo |
|---|---|---|
| `hero_idle.png` | 48 × 64 px | Herói parado em silhueta estilizada. |
| `hero_run.png` / `hero_run_strip.png` | 384 × 64 px (8 frames) | Ciclo de corrida rápida com capa/casaco ao vento. |
| `hero_run_0..7.png` | 48 × 64 px | Frames individuais da corrida. |
| `hero_jump.png` | 48 × 64 px | Subida de pulo (impulso vertical). |
| `hero_fall_fast.png` | 48 × 64 px | Queda rápida (Fast-Fall). |
| `hero_anvil_ride.png` | 48 × 64 px | Equilíbrio surfando sobre a bigorna nos pés (pulo duplo / levitação). |

---

## B. Variações de Bigorna para Upgrades (`assets/anvils/` e `assets/`)

| Arquivo | Dimensão | Tipo de Bigorna & Upgrade |
|---|---|---|
| `anvil_standard.png` (e `assets/anvil.png`) | 46 × 26 px | **Bigorna Clássica Inicial:** Ferro forjado equilibrado, face de impacto polida. |
| `anvil_titan.png` | 64 × 36 px | **Bigorna Titânica:** Massa pesada (+40% impacto), borda dourada e runas de ametista pulsantes. |
| `anvil_yoyo.png` | 42 × 24 px | **Bigorna Yoyo (com Corda):** Chassi curvo aerodinâmico, ilhós/anel central para cabo elástico e filamento magnético ciano. |
| `anvil_blood_frenzy.png` | 52 × 30 px | **Bigorna do Frenesi Carmim:** Obsidiana vulcânica com veios de magma e corte carmesim incandescente. |

---

## C. Bestiário de Inimigos (`assets/enemies/`)

* **Tier 1 — A Monstrenga (`assets/enemies/monstrenga/`):** 7 frames (32 × 44 px). Paleta púrpura e magenta (`#8e24aa`, `#4a148c`) com olhos amarelos.
* **Tier 2 — O Dark Enemy / Null (`assets/enemies/null/`):** 7 frames (34 × 44 px). Preto ébano (`#0a0814`) com silhueta predatória.
* **Tier 3 — Red Enemy (`assets/enemies/red/`):** 7 frames (32 × 44 px). Vermelho carmesim para eventos de perigo.
* **Tier 4 — O DevilBat Aéreo (`assets/enemies/devilbat/`):** `devilbat_0..6.png` e `devilbat_strip.png` (48 × 36 px). Bater de asas contínuo para voo em rasante no parallax.

---

## D. Camadas de Parallax e Atmosfera (`assets/environment/`) — 960 × 540 px

| Arquivo | Resolução | Uso no Parallax |
|---|---|---|
| `sky_gradient.png` | 960 × 540 px | Gradiente vertical do céu noturno (azul meia-noite `#060818` ao carmesim `#2a0b1d`). |
| `ridge_far.png` | 960 × 540 px | Silhuetas distantes de picos montanhosos e espirais góticas (Parallax 0.05x). |
| `ridge_mid.png` | 960 × 540 px | Ruínas de castelos, torres e arcos de catedrais quebradas (Parallax 0.15x). |
| `moon_blood.png` | 120 × 120 px | Disco lunar detalhado com relevo de crateras e eclipse avermelhado. |
| `sanctuary_pillar.png` | 48 × 80 px | Totem gótico sagrado de descanso com runas ciano entalhadas. |
| `crystal_active.png` | 24 × 24 px | Luz esmeralda/ciano acesa no topo do santuário com halo alfa. |
| `fortune_altar.png` | 48 × 64 px | Altar da Fortuna com ametistas brotando na bacia cerimonial. |
| `deco_pillar.png` | 32 × 96 px | Coluna de ruína para segundo plano e profundidade. |

---

## E. Tiles de Terreno Rítmico (`assets/tiles/`) — 32 × 32 px

* `tile_stone_top.png` — Chão de pedra rústica para corrida contínua com musgo turquesa.
* `tile_stone_mid.png` — Miolo de pedra mármore azul profundo tileable em X e Y.
* `tile_stone_left.png` & `tile_stone_edge_left.png` — Borda esquerda arredondada com musgo curvo.
* `tile_stone_right.png` & `tile_stone_edge_right.png` — Borda direita arredondada com musgo curvo.
* `tile_stone_bot.png` — Dentes de rocha e micro-estalactites na base inferior.
* `tile_metal_beam.png` & `tile_metal_conductor.png` — Viga de metal condutora magnética com rebites.
* `tile_metal_post.png` — Pilar vertical de aço magnético.
* `tile_spikes.png` — Espinhos de ferro com pontas ensanguentadas para abismos.
* `tileset_stone_3x3.png` (96 × 96 px) — Spritesheet completo de 9 blocos para autotiling.
* `tileset_metal.png` (64 × 32 px) — Tira de metal.

---

## F. Coletáveis e Efeitos (`assets/fx/` e `assets/collectibles/`)

* `assets/fx/soul_orb.png` / `soul_orb_strip.png` (16 × 16 px, 4 frames) — Orbe de alma flutuante ciano elétrico (`#00e5ff`) para guiar as parábolas de pulo.
* `assets/collectibles/magnetic_orb.png` (16 × 16 px) — Faísca de energia magnética.
* `assets/collectibles/scrap_coin.png` / `scrap_coin_strip.png` (16 × 16 px, 4 frames) — Moedas de engrenagem de latão girando.
* `assets/fx/gas_tank.png` (e `assets/gas_tank.png`) (36 × 48 px) — Botijão de gás azul industrial com válvula de latão, faixa laranja e LED/manômetro.
