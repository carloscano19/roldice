/**
 * app.js — DTP Rastreador D100
 * Lógica principal de la calculadora
 */

// ── Constantes ──────────────────────────────────────────────────────────────
const PIFIA_THRESHOLD   = 19;  // 01-19 = Pifia (tirada SM sin modificar)
const OPEN_THRESHOLD    = 95;  // 95+ = tirada abierta (volver a tirar y sumar)
const MAX_ROLL          = 999;

// Modificadores de tirada de críticos según letra
const CRIT_MODIFIERS = { T: -50, A: -20, B: -10, C: 0, D: 10, E: 20 };

// Nombres de armadura para mostrar
const ARMOR_NAMES = {
  sa:       'Sin Armadura',
  cuero:    'Cuero',
  cueroEnd: 'Cuero Endurecido',
  cmalla:   'Cota de Malla',
  coraza:   'Coraza',
  pdur:     'Piel Dura',
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

// ── State ─────────────────────────────────────────────────────────────────
let rollBreakdownParts = [];  // historial de sub-tiradas para mostrar

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
    if (iter > 20) break; // safety
  } while (parts[parts.length - 1].isOpen && total < MAX_ROLL);

  return { total, parts };
}

// ── Actualizar breakdown visual ────────────────────────────────────────────
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

// ── Actualizar chip de tipo de crítico ───────────────────────────────────
function updateAttackMeta() {
  const key = elAttack.value;
  const meta = window.DTP.TABLE_META[key];
  if (!meta) return;
  elCritChip.textContent = meta.critEmoji + ' Crítico: ' + meta.critType;
}

// ── Calcular y renderizar resultado ──────────────────────────────────────
function calculate() {
  const diceVal   = parseInt(elDice.value, 10);
  const b1        = parseInt(elBonus1.value, 10)   || 0;
  const b2        = parseInt(elBonus2.value, 10)   || 0;
  const p1        = parseInt(elPenalty1.value, 10) || 0;
  const p2        = parseInt(elPenalty2.value, 10) || 0;
  const totalBonus   = b1 + b2;
  const totalPenalty = p1 + p2;

  // Actualizar fórmula
  elFBonus.textContent   = totalBonus;
  elFPenalty.textContent = totalPenalty;

  if (isNaN(diceVal) || elDice.value === '') {
    elFDice.textContent  = '—';
    elFTotal.textContent = '—';
    renderOutcomePlaceholder();
    elResultPanel.className = 'result-panel';
    return;
  }

  const finalRoll = Math.max(1, diceVal + totalBonus - totalPenalty);
  elFDice.textContent  = diceVal;
  elFTotal.textContent = finalRoll;

  // Consultar tabla
  const tableKey = elAttack.value;
  const armorKey = elArmor.value;
  const result   = window.DTP.getAttackResult(tableKey, armorKey, diceVal); // la tirada SM (sin modificar) determina pifia
  const resultFinal = window.DTP.getAttackResult(tableKey, armorKey, finalRoll); // resultado final para daño

  // La pifia se detecta con la tirada sin modificar (SM)
  // Si la tirada SM (dado puro) es ≤ 19 → Pifia independientemente del final
  const isRawPifia = diceVal <= PIFIA_THRESHOLD;

  if (isRawPifia || result.type === 'pifia') {
    renderPifia(result.meta);
    elResultPanel.className = 'result-panel glow-pifia';
  } else if (resultFinal.type === 'fail' || resultFinal.type === 'hit' && resultFinal.pv === 0) {
    renderHit(resultFinal, armorKey, finalRoll);
    elResultPanel.className = 'result-panel glow-fail';
  } else {
    renderHit(resultFinal, armorKey, finalRoll);
    if (resultFinal.crit) {
      elResultPanel.className = 'result-panel glow-crit';
    } else {
      elResultPanel.className = 'result-panel';
    }
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
  elOutcome.innerHTML = `
    <div class="outcome-main">
      <div class="status-row">
        <span class="status-badge badge-pifia">💀 ¡PIFIA!</span>
        <span class="status-badge badge-fail">Tirada en tabla de pifias</span>
      </div>
      <div class="outcome-detail">
        Tirada sin modificar ≤ 19 = <strong>Pifia automática</strong>.
        Tira en la tabla <strong>WFP-${meta?.pifiaTable === 'proyectil' ? '2 (Proyectil)' : '1 (Empuñada)'}</strong>
        con los modificadores correspondientes.
        <br><br>
        <em>Modificadores a la pifia:</em>
        Arma contundente: −20 · Arma de filo: −10 · A 2 manos: ±0 · Asta: +10 · Montado/Trabuquete: +20
      </div>
    </div>`;
}

function renderHit(result, armorKey, finalRoll) {
  const armorName = ARMOR_NAMES[armorKey] || armorKey;

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

  // Daño normal o crítico
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
    ? `<br><br>Tirar en la tabla de críticos correspondiente
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

  // Animate dice
  const face = document.getElementById('dice-face');
  face.style.transform = 'rotate(720deg) scale(1.3)';
  setTimeout(() => { face.style.transform = ''; }, 500);

  calculate();
});

elBtnClear.addEventListener('click', () => {
  elDice.value    = '';
  elBonus1.value  = '0';
  elBonus2.value  = '0';
  elPenalty1.value = '0';
  elPenalty2.value = '0';
  rollBreakdownParts = [];
  elBreakdown.innerHTML = '';
  calculate();
  // Flash effect
  elDice.style.transition = 'border-color .1s';
  elDice.style.borderColor = 'rgba(192,57,43,.6)';
  setTimeout(() => { elDice.style.borderColor = ''; }, 400);
});

// ── Init ──────────────────────────────────────────────────────────────────
updateAttackMeta();
calculate();
