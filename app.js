/**
 * app.js — DTP Rastreador D100
 * Lógica principal de la calculadora (con soporte para modo magia WSD)
 */

// ── Constantes ──────────────────────────────────────────────────────────────
const PIFIA_THRESHOLD   = 19;
const OPEN_THRESHOLD    = 95;
const MAX_ROLL          = 999;

const CRIT_MODIFIERS = { T: -50, A: -20, B: -10, C: 0, D: 10, E: 20 };

const ARMOR_NAMES = {
  sa:       'Sin Armadura',
  cuero:    'Cuero',
  cueroEnd: 'Cuero Endurecido',
  cmalla:   'Cota de Malla',
  coraza:   'Coraza',
  pdur:     'Piel Dura / Criatura',
};

// ── DOM refs ─────────────────────────────────────────────────────────────────
const elAttack      = document.getElementById('attack-type');
const elArmor       = document.getElementById('armor-type');
const elDice        = document.getElementById('dice-roll');
const elBonus1      = document.getElementById('bonus1');
const elBonus2      = document.getElementById('bonus2');
const elPenalty1    = document.getElementById('penalty1');
const elPenalty2    = document.getElementById('penalty2');
const elBtnRoll     = document.getElementById('btn-roll');
const elBtnClear    = document.getElementById('btn-clear');
const elBreakdown   = document.getElementById('roll-breakdown');
const elCritChip    = document.getElementById('critical-type-chip');
const elResultPanel = document.getElementById('result-panel');
const elFDice       = document.getElementById('f-dice');
const elFBonus      = document.getElementById('f-bonus');
const elFPenalty    = document.getElementById('f-penalty');
const elFTotal      = document.getElementById('f-total');
const elOutcome     = document.getElementById('result-outcome');
const elMagicPanel  = document.getElementById('magic-panel');
const elMagicTotal  = document.getElementById('magic-mod-total');
const elGroupArmor  = document.getElementById('group-armor');

// ── State ─────────────────────────────────────────────────────────────────
let rollBreakdownParts = [];

// Estado de modificadores de magia (WSD-1)
const magicMods = {
  tension:   0,
  distancia: 0,
  tamano:    0,
  prep:      -30,
  critType:  'Impacto + frío',
  crit:      'C',
};

// ── Particles background ──────────────────────────────────────────────────
(function initParticles() {
  const container = document.getElementById('particles');
  const COUNT = 22;
  for (let i = 0; i < COUNT; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    const size = Math.random() * 3 + 1;
    el.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      animation-duration:${12 + Math.random()*20}s;
      animation-delay:${-Math.random()*30}s;
      opacity:${0.1 + Math.random()*0.3};
    `;
    container.appendChild(el);
  }
})();

// ── Magic panel: inicializar botones de píldora ───────────────────────────
function initMagicButtons() {
  // Grupos con valor numérico: tension, distancia, tamano, prep
  ['tension', 'distancia', 'tamano', 'prep'].forEach(group => {
    const container = document.getElementById(`mg-${group}`);
    if (!container) return;
    container.addEventListener('click', e => {
      const btn = e.target.closest('.magic-opt');
      if (!btn) return;
      container.querySelectorAll('.magic-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      magicMods[group] = parseInt(btn.dataset.val, 10);
      updateMagicTotal();
      calculate();
    });
  });

  // Tipo de sortilegio (WSD-2) — sin valor numérico, solo critType
  const tipoContainer = document.getElementById('mg-tipo');
  if (tipoContainer) {
    tipoContainer.addEventListener('click', e => {
      const btn = e.target.closest('.magic-opt');
      if (!btn) return;
      tipoContainer.querySelectorAll('.magic-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      magicMods.critType = btn.dataset.crittype;
      magicMods.crit     = btn.dataset.crit || 'C';
      calculate();
    });
  }
}

function updateMagicTotal() {
  const total = magicMods.tension + magicMods.distancia + magicMods.tamano + magicMods.prep;
  const sign  = total >= 0 ? '+' : '';
  elMagicTotal.textContent = sign + total;
  elMagicTotal.style.color = total < 0 ? '#e85c4d' : total > 0 ? '#58d6a4' : '#c39bd3';
}

function getMagicModTotal() {
  return magicMods.tension + magicMods.distancia + magicMods.tamano + magicMods.prep;
}

// ── Tirada abierta ─────────────────────────────────────────────────────────
function rollOpenDice() {
  let total = 0;
  const parts = [];
  let iter = 0;
  do {
    const r = Math.floor(Math.random() * 100) + 1;
    parts.push({ value: r, isOpen: r >= OPEN_THRESHOLD });
    total = Math.min(total + r, MAX_ROLL);
    iter++;
    if (iter > 20) break;
  } while (parts[parts.length - 1].isOpen && total < MAX_ROLL);
  return { total, parts };
}

// ── Actualizar breakdown visual de la tirada ──────────────────────────────
function renderBreakdown(parts) {
  elBreakdown.innerHTML = '';
  if (!parts || parts.length === 0) return;
  parts.forEach((p, i) => {
    if (i > 0) {
      const plus = document.createElement('span');
      plus.className = 'roll-plus';
      plus.textContent = '+';
      elBreakdown.appendChild(plus);
    }
    const span = document.createElement('span');
    span.className = 'roll-part' + (p.isOpen ? ' open' : '');
    span.textContent = p.value + (p.isOpen ? ' 🔥' : '');
    elBreakdown.appendChild(span);
  });
  if (parts.length > 1) {
    const eq = document.createElement('span');
    eq.className = 'roll-plus';
    eq.textContent = '= ' + parts.reduce((a, b) => a + b.value, 0);
    elBreakdown.appendChild(eq);
  }
}

// ── Detectar modo magia y mostrar/ocultar paneles ──────────────────────────
function isMagicMode() {
  return elAttack.value === 'wsd';
}

function updateMode() {
  if (isMagicMode()) {
    elMagicPanel.style.display = 'block';
    updateMagicTotal();
  } else {
    elMagicPanel.style.display = 'none';
  }
}

// ── Actualizar chip de tipo de crítico ───────────────────────────────────
function updateAttackMeta() {
  const key  = elAttack.value;
  const meta = window.DTP.TABLE_META[key];
  if (!meta) return;
  if (isMagicMode()) {
    elCritChip.textContent = '✨ Sortilegio · Crítico según WSD-2';
  } else {
    elCritChip.textContent = meta.critEmoji + ' Crítico: ' + meta.critType;
  }
}

// ── Calcular y renderizar resultado ──────────────────────────────────────
function calculate() {
  const diceVal      = parseInt(elDice.value, 10);
  const b1           = parseInt(elBonus1.value,   10) || 0;
  const b2           = parseInt(elBonus2.value,   10) || 0;
  const p1           = parseInt(elPenalty1.value, 10) || 0;
  const p2           = parseInt(elPenalty2.value, 10) || 0;
  const totalBonus   = b1 + b2;
  const totalPenalty = p1 + p2;

  // En modo magia los modificadores WSD-1 se suman automáticamente como bonus
  const magicBonus   = isMagicMode() ? getMagicModTotal() : 0;
  const displayBonus = totalBonus + magicBonus;

  elFBonus.textContent   = displayBonus;
  elFPenalty.textContent = totalPenalty;

  if (isNaN(diceVal) || elDice.value === '') {
    elFDice.textContent  = '—';
    elFTotal.textContent = '—';
    renderOutcomePlaceholder();
    elResultPanel.className = 'result-panel';
    return;
  }

  const finalRoll = Math.max(1, diceVal + displayBonus - totalPenalty);
  elFDice.textContent  = diceVal;
  elFTotal.textContent = finalRoll;

  const tableKey = elAttack.value;
  const armorKey = elArmor.value;

  // Pifia: se detecta con la tirada SM (dado puro) ≤19
  if (diceVal <= PIFIA_THRESHOLD) {
    renderPifia(window.DTP.TABLE_META[tableKey]);
    elResultPanel.className = 'result-panel glow-pifia';
    return;
  }

  const resultFinal = window.DTP.getAttackResult(tableKey, armorKey, finalRoll);

  if (resultFinal.type === 'pifia') {
    renderPifia(resultFinal.meta);
    elResultPanel.className = 'result-panel glow-pifia';
  } else if (resultFinal.type === 'fail' || (resultFinal.type === 'hit' && resultFinal.pv === 0)) {
    renderHit(resultFinal, armorKey, finalRoll);
    elResultPanel.className = 'result-panel glow-fail';
  } else {
    // En modo magia, el tipo de crítico lo da WSD-2 (tipo de sortilegio)
    if (isMagicMode() && resultFinal.crit) {
      resultFinal.critTypeOverride = magicMods.critType;
    }
    renderHit(resultFinal, armorKey, finalRoll);
    elResultPanel.className = resultFinal.crit ? 'result-panel glow-crit' : 'result-panel';
  }
}

// ── Renders de resultado ──────────────────────────────────────────────────
function renderOutcomePlaceholder() {
  elOutcome.innerHTML = `
    <div class="outcome-placeholder">
      <p>Introduce una tirada para ver el resultado</p>
    </div>`;
}

function renderPifia(meta) {
  const isMagic = meta?.isMagic;
  elOutcome.innerHTML = `
    <div class="outcome-main">
      <div class="status-row">
        <span class="status-badge badge-pifia">💀 ¡PIFIA!</span>
        <span class="status-badge badge-fail">Tirada en tabla de ${isMagic ? 'fallos de hechizo' : 'pifias'}</span>
      </div>
      <div class="outcome-detail">
        Tirada sin modificar ≤ 19 = <strong>Pifia automática</strong>.
        ${isMagic
          ? `Tira en la tabla <strong>WFP-3 (Fallos de Hechizos)</strong>.<br>
             <em>Mod. al fallo por tensión:</em>
             Muy alta: −10 · Alta: −5 · Media: ±0 · Baja: +5 · Muy baja: +15`
          : `Tira en la tabla <strong>WFP-${meta?.pifiaTable === 'proyectil' ? '2 (Proyectil)' : '1 (Empuñada)'}</strong>.<br>
             <em>Mod. a la pifia:</em>
             Contundente: −20 · Filo: −10 · 2 manos: ±0 · Asta: +10 · Montado: +20`
        }
      </div>
    </div>`;
}

function renderHit(result, armorKey, finalRoll) {
  const armorName = ARMOR_NAMES[armorKey] || armorKey;
  const critType  = result.critTypeOverride ||
    (isMagicMode()
      ? magicMods.critType
      : window.DTP.TABLE_META[elAttack.value]?.critType) || '';

  if (result.type === 'fail') {
    elOutcome.innerHTML = `
      <div class="outcome-main">
        <div class="status-row">
          <span class="status-badge badge-fail">🛡️ Ataque fallido</span>
        </div>
        <div class="outcome-detail">
          La armadura <strong>${armorName}</strong> absorbe completamente el impacto.
          Sin daño ni crítico. Tirada final: <strong>${finalRoll}</strong>.
        </div>
      </div>`;
    return;
  }

  if (result.pv === 0 && !result.crit) {
    elOutcome.innerHTML = `
      <div class="outcome-main">
        <div class="status-row">
          <span class="status-badge badge-fail">💨 Sin daño</span>
        </div>
        <div class="outcome-detail">
          Impacto rozante. La armadura <strong>${armorName}</strong> neutraliza el golpe.
          Tirada final: <strong>${finalRoll}</strong>.
        </div>
      </div>`;
    return;
  }

  const critClass  = result.crit ? `badge-crit-${result.crit}` : '';
  const critMod    = result.crit ? CRIT_MODIFIERS[result.crit] : null;
  const critModStr = critMod !== null ? (critMod >= 0 ? `+${critMod}` : `${critMod}`) : '';

  const critBadge = result.crit
    ? `<span class="status-badge badge-critical ${critClass}">⚡ Crítico ${result.crit} <small>(${critModStr} a la tirada de críticos)</small></span>`
    : '';

  const pvDisplay = result.pv > 0
    ? `<span class="status-badge badge-damage">🩸 ${result.pv} PV</span>`
    : '';

  const critDetail = result.crit
    ? `<br><br>Tirar en la tabla de críticos de <strong>${critType}</strong>
       con modificador <strong>${critModStr}</strong> (Crítico ${result.crit}).`
    : '';

  elOutcome.innerHTML = `
    <div class="outcome-main">
      <div class="status-row">
        ${pvDisplay}
        ${critBadge}
      </div>
      <div class="outcome-detail">
        Armadura: <strong>${armorName}</strong> · Tirada final: <strong>${finalRoll}</strong>
        ${critDetail}
      </div>
    </div>`;
}

// ── Event listeners ───────────────────────────────────────────────────────
elAttack.addEventListener('change', () => {
  updateMode();
  updateAttackMeta();
  calculate();
});

elArmor.addEventListener('change', calculate);

elDice.addEventListener('input', () => {
  rollBreakdownParts = [];
  elBreakdown.innerHTML = '';
  calculate();
});

[elBonus1, elBonus2, elPenalty1, elPenalty2].forEach(el => {
  el.addEventListener('input', calculate);
});

elBtnRoll.addEventListener('click', () => {
  const { total, parts } = rollOpenDice();
  rollBreakdownParts = parts;
  elDice.value = total;
  renderBreakdown(parts);
  const face = document.getElementById('dice-face');
  face.style.transform = 'rotate(720deg) scale(1.3)';
  setTimeout(() => { face.style.transform = ''; }, 500);
  calculate();
});

elBtnClear.addEventListener('click', () => {
  elDice.value     = '';
  elBonus1.value   = '0';
  elBonus2.value   = '0';
  elPenalty1.value = '0';
  elPenalty2.value = '0';
  rollBreakdownParts = [];
  elBreakdown.innerHTML = '';
  calculate();
  elDice.style.transition = 'border-color .1s';
  elDice.style.borderColor = 'rgba(192,57,43,.6)';
  setTimeout(() => { elDice.style.borderColor = ''; }, 400);
});

// ── Tab Navigation (App / TC / MM) ────────────────────────────────────────
function switchTab(tabId) {
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-view-content').forEach(view => {
    view.style.display = (view.id === `view-tab-${tabId}`) ? 'block' : 'none';
  });
  if (tabId === 'tc') {
    renderFullTCTable();
  }
}

function renderFullTCTable() {
  const tbody = document.getElementById('tc-table-body');
  if (!tbody) return;
  const key = document.getElementById('tc-table-select')?.value || 'tajo';
  const critData = window.DTP?.CRIT_TABLES ? window.DTP.CRIT_TABLES[key] : null;
  if (!critData) return;

  tbody.innerHTML = '';
  critData.rows.forEach(row => {
    const tr = document.createElement('tr');
    const minVal = row[0] > 0 ? row[0] : '≤ ' + row[1];
    const rangeStr = (row[0] === row[1]) ? `${row[0]}` : `${minVal} – ${row[1]}`;
    tr.innerHTML = `
      <td><strong>${rangeStr}</strong></td>
      <td>${row[2]}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.querySelectorAll('.nav-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.querySelectorAll('.btn-nav-back').forEach(btn => {
  btn.addEventListener('click', () => switchTab('app'));
});

const elTCSelect = document.getElementById('tc-table-select');
if (elTCSelect) {
  elTCSelect.addEventListener('change', renderFullTCTable);
}

// ── Init ──────────────────────────────────────────────────────────────────
initMagicButtons();
updateMode();
updateAttackMeta();
calculate();

