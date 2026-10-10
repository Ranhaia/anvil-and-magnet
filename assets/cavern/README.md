# Catálogo de Assets da Caverna (Fake Pixel Art & Looping Alfa)

Todos os assets abaixo foram gerados, otimizados e salvos com **canal alfa (RGBA transparente)** em `assets/cavern/`, prontos para consumo direto no HTML5 Canvas (`ctx.drawImage`) ou em spritesheets.

---

## 1. Plataformas Rochosas Arredondadas (Mármore Azul + Musgo)

As plataformas contam com extremidades arredondadas orgânicas, textura de Mármore Azul Pixar 128 e contorno superior de musgo/cristal turquesa:

| Arquivo | Dimensões | Descrição |
|---|---|---|
| `platform_cap_left.png` | 48 × 48 px | Ponta esquerda arredondada com queda orgânica de rocha |
| `platform_middle.png` | 64 × 48 px | Segmento central que se repete infinitamente (`repeat-x`) |
| `platform_cap_right.png` | 48 × 48 px | Ponta direita arredondada com queda orgânica de rocha |
| `rock_pillar.png` | 48 × 128 px | Coluna/pilar de pedra para apoiar plataformas no chão |
| `stalactite.png` | 32 × 80 px | Estalactite de teto com textura mineral |

### Exemplo de Montagem da Plataforma no Canvas:
```javascript
// Desenhar plataforma arredondada de largura W e altura H na posição (X, Y)
function drawLedge(ctx, x, y, width) {
  const capW = 48;
  const h = 48;
  // 1. Ponta esquerda
  ctx.drawImage(imgCapLeft, x, y, capW, h);
  // 2. Miolo texturizado repetido
  const midW = width - (capW * 2);
  for (let sx = 0; sx < midW; sx += 64) {
    const chunkW = Math.min(64, midW - sx);
    ctx.drawImage(imgMid, 0, 0, chunkW, h, x + capW + sx, y, chunkW, h);
  }
  // 3. Ponta direita
  ctx.drawImage(imgCapRight, x + width - capW, y, capW, h);
}
```

---

## 2. Animações em Looping com Canal Alfa (8 Quadros)

Loopings perfeitos de 8 quadros a 10–12 FPS, com transparência alfa e iluminação:

| Asset | Arquivos | Resolução | Efeito |
|---|---|---|---|
| **Cogumelos Bioluminescentes** | `mushroom_loop_0.png` ... `mushroom_loop_7.png` | 64 × 64 px | Respiração senoidal do anel de luz ciano |
| **Cristais de Ametista** | `crystal_loop_0.png` ... `crystal_loop_7.png` | 64 × 64 px | Brilho das facetas roxas e glint/centelha branca |
| **Gotas da Estalactite** | `drip_loop_0.png` ... `drip_loop_7.png` | 32 × 80 px | Formação da gota na ponta e queda sob gravidade |

### Exemplo de Ciclo de Animação:
```javascript
// frameRate = 10 FPS (ciclo de 8 quadros)
const frameIndex = Math.floor(time * 10) % 8;
const currentMushroomImg = mushroomFrames[frameIndex];
ctx.drawImage(currentMushroomImg, x, y - 64, 64, 64);
```

---

## 3. Camadas de Parallax Subterrâneo (960 × 540)

Para compor a caverna sem sensação de blocos soltos no vácuo:

| Arquivo | Resolução | Uso no Parallax |
|---|---|---|
| `cavern_bg_deep.png` | 960 × 540 px | Camada 0 (Fundo distante, velocidade `0.02x`) |
| `cavern_bg_mid_arches.png` | 960 × 540 px | Camada 1 (Arcos e estalactites com transparência alfa, velocidade `0.06x`) |

---

## 4. Texturas Brutas Processadas da Biblioteca Pixar 128
* `blue_marble_cavern_tint.png` (512 × 512) — Textura primária de Mármore Azul calibrada para a caverna.
* `granite_cavern_tint.png` (512 × 512) — Granito preto mineral para catacumbas.
* `pebbles_cavern_tint.png` (512 × 512) — Seixos subterrâneos para áreas de cascalho.
