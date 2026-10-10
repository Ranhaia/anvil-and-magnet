/**
 * Pre-Deploy & Game Integrity Validation Suite
 * Runs an exhaustive diagnostic check across:
 * 1. JavaScript Syntax & Parsing (all JS files)
 * 2. Module Import Graph & Integrity
 * 3. DOM Element ID Mapping (checks JS document.getElementById vs index.html)
 * 4. Assets Existence & Integrity (images, audio, tiles)
 * 5. Local Server HTTP Status & Cache Headers
 * 6. Git Status & Uncommitted Changes
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const errors = [];

function pass(msg) {
  totalChecks++;
  passedChecks++;
  console.log(`  \x1b[32m✔\x1b[0m ${msg}`);
}

function fail(msg, err) {
  totalChecks++;
  failedChecks++;
  console.error(`  \x1b[31m✖\x1b[0m ${msg}`);
  if (err) errors.push(`${msg}: ${err}`);
}

function header(title) {
  console.log(`\n\x1b[1m\x1b[36m=== ${title} ===\x1b[0m`);
}

// 1. Check JavaScript Syntax
header("1. Verificação de Sintaxe JavaScript");
const jsFiles = [
  'src/game.js',
  'src/player.js',
  'src/anvil.js',
  'src/special-gas.js',
  'src/enemies.js',
  'src/map.js',
  'src/chunks.js',
  'src/collectibles.js',
  'src/magnetism.js',
  'src/audio.js',
  'src/camera.js',
  'src/parallax.js',
  'src/blood-moon.js',
  'src/fortune.js',
  'src/physics.js',
  'src/lightning-shader.js'
];

for (const file of jsFiles) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    fail(`Arquivo não encontrado: ${file}`);
    continue;
  }
  try {
    cp.execSync(`node -c "${fullPath}"`, { stdio: 'pipe' });
    pass(`Sintaxe OK: ${file}`);
  } catch (e) {
    fail(`Erro de sintaxe em ${file}`, e.stderr.toString());
  }
}

// 2. Check Module Import Graph
header("2. Verificação de Grafo de Módulos (Imports)");
const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
for (const file of jsFiles) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) continue;
  const content = fs.readFileSync(fullPath, 'utf8');
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    let importPath = match[1];
    // Strip query parameters like ?v=7
    importPath = importPath.split('?')[0];
    const resolved = path.resolve(path.dirname(fullPath), importPath);
    if (fs.existsSync(resolved)) {
      pass(`${file} -> ${match[1]}`);
    } else {
      fail(`Import Quebrado em ${file}: ${match[1]} (não encontrado em ${resolved})`);
    }
  }
}

// 3. DOM Element IDs Cross-Reference
header("3. Mapeamento de IDs do DOM (JS vs index.html)");
const indexHtmlPath = path.join(ROOT, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

const idRegex = /document\.getElementById\(['"](.+?)['"]\)/g;
const foundIds = new Set();
for (const file of jsFiles) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) continue;
  const content = fs.readFileSync(fullPath, 'utf8');
  let match;
  while ((match = idRegex.exec(content)) !== null) {
    foundIds.add(match[1]);
  }
}

for (const id of foundIds) {
  if (indexHtml.includes(`id="${id}"`) || indexHtml.includes(`id='${id}'`)) {
    pass(`Elemento HTML presente: #${id}`);
  } else {
    fail(`Elemento ausente no index.html: #${id}`);
  }
}

// 4. Asset Integrity Check
header("4. Integridade de Assets (Imagens e Áudios)");
const assetPatterns = [
  'assets/anvils/anvil_titan.png',
  'assets/hero/hero_idle.png',
  'assets/hero/hero_jump.png',
  'assets/hero/hero_fall_fast.png',
  'assets/hero/hero_anvil_ride.png',
  'assets/hero/hero_run_0.png',
  'assets/gas_tank.png',
  'assets/tiles/tile_stone_top.png',
  'assets/tiles/tile_metal_beam.png',
  'assets/environment/sanctuary_pillar.png',
  'assets/collectibles/scrap_coin_strip.png',
  'assets/fx/soul_orb_strip.png',
  'assets/audio/jhou_menu.ogg',
  'assets/audio/jhontrilha.ogg',
  'assets/audio/smash.ogg'
];

for (const asset of assetPatterns) {
  const fullPath = path.join(ROOT, asset);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    if (stats.size > 0) {
      pass(`Asset válido (${(stats.size / 1024).toFixed(1)} KB): ${asset}`);
    } else {
      fail(`Asset vazio (0 bytes): ${asset}`);
    }
  } else {
    fail(`Asset ausente: ${asset}`);
  }
}

// 5. Check Local Server Connectivity
header("5. Conectividade do Servidor Local");
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/index.html', (res) => {
      if (res.statusCode === 200) {
        pass(`Servidor HTTP 200 OK em http://localhost:3000/`);
        const cacheControl = res.headers['cache-control'] || '';
        if (cacheControl.includes('no-store') || cacheControl.includes('no-cache')) {
          pass(`Cabeçalho Anti-Cache OK: ${cacheControl}`);
        } else {
          fail(`Cabeçalho Cache-Control fraco: ${cacheControl}`);
        }
      } else {
        fail(`Servidor retornou status ${res.statusCode}`);
      }
      resolve();
    });
    req.on('error', (err) => {
      fail(`Não foi possível conectar ao servidor http://localhost:3000/ (${err.message})`);
      resolve();
    });
  });
}

// 6. Check Git Status
header("6. Diagnóstico do Git");
try {
  const status = cp.execSync('git status --short', { encoding: 'utf8' }).trim();
  pass(`Repositório Git ativo`);
  const lines = status ? status.split('\n') : [];
  console.log(`  Arquivos modificados/pendentes: ${lines.length}`);
} catch (e) {
  fail("Erro ao executar git status", e.message);
}

// Run async and summarize
checkServer().then(() => {
  console.log("\n" + "=".repeat(50));
  if (failedChecks === 0) {
    console.log(`\x1b[1m\x1b[32m✔ TUDO VALIDADO COM SUCESSO! (${passedChecks}/${totalChecks} checks)\x1b[0m`);
    console.log(`O projeto está 100% pronto e íntegro para testes e deploy.`);
    process.exit(0);
  } else {
    console.error(`\x1b[1m\x1b[31m✖ FALHA NA VALIDAÇÃO: ${failedChecks} erro(s) encontrado(s)!\x1b[0m`);
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
});
