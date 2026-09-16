/**
 * tables.js — DTP Rastreador D100
 * Tablas de ataque extraídas del MANUAL_DTP_REV_18_abril_2026.pdf
 *
 * Formato de cada fila: [min, max, resultado_por_armadura...]
 * Columnas de armadura (orden): Pdur | Coraza | C.malla | CueroEnd | Cuero | S/A
 *
 * Resultado: número = PV de daño (sin crítico)
 *            "P"    = Pifia
 *            "F"    = Ataque fallido (sin daño)
 *            "0"    = Tocado pero sin daño
 *            "<n><letra>" = PV + crítico (ej: "9A" = 9 PV + Crítico A)
 *            "<n>T" = PV + Crítico T (menor)
 *
 * Tipos de crítico según tabla del manual:
 *   T: -50  A: -20  B: -10  C: +0  D: +10  E: +20
 * (modificador a la tirada de la tabla de críticos)
 */

// ────────────────────────────────────────────────────────────────────────────
// ÍNDICE DE ARMADURAS
// ────────────────────────────────────────────────────────────────────────────
// Orden de columnas en WAT-1 al WAT-4 y WAT-7/8:
//   0: Pdur (Piel Dura)
//   1: Coraza
//   2: C.malla (Cota de malla)
//   3: CueroEnd (Cuero Endurecido)
//   4: Cuero
//   5: S/A (Sin Armadura)
//
// WAT-5 (Garras/Dientes) no tiene Pdur pero sí columnas propias — ver abajo
// WAT-6 (Agarrar) empieza en Coraza — ver abajo

const ARMOR_COLS = {
  // standard: Pdur, Coraza, C.malla, CueroEnd, Cuero, S/A
  standard: ['pdur','coraza','cmalla','cueroEnd','cuero','sa'],
  // WAT-5: Coraza, C.malla, CueroEnd, Cuero, Sin armadura
  wat5:     ['coraza','cmalla','cueroEnd','cuero','sa'],
  // WAT-6: Coraza, C.malla, CueroEnd, Cuero, Sin armadura
  wat6:     ['coraza','cmalla','cueroEnd','cuero','sa'],
};

// ────────────────────────────────────────────────────────────────────────────
// Función auxiliar: convierte string de resultado a objeto
// ────────────────────────────────────────────────────────────────────────────
function parseResult(val) {
  if (val === 'P')  return { type: 'pifia', pv: 0, crit: null };
  if (val === 'F')  return { type: 'fail',  pv: 0, crit: null };
  if (val === '0' || val === 0) return { type: 'hit',  pv: 0, crit: null };
  const s = String(val);
  const m = s.match(/^(\d+)([TABCDE]?)$/);
  if (!m) return { type: 'hit', pv: 0, crit: null };
  const pv   = parseInt(m[1], 10);
  const crit = m[2] || null;
  return { type: crit ? 'critical' : 'hit', pv, crit };
}

// ────────────────────────────────────────────────────────────────────────────
// Función auxiliar: busca la fila de la tabla para la tirada dada
// ────────────────────────────────────────────────────────────────────────────
function lookupTable(table, armorKey, armorCols, roll) {
  for (const row of table) {
    const [min, max, ...vals] = row;
    if (roll >= min && roll <= max) {
      const idx = armorCols.indexOf(armorKey);
      if (idx === -1) return { type: 'unknown', pv: 0, crit: null };
      return parseResult(vals[idx]);
    }
  }
  // Si supera el máximo de la tabla, tomar la última fila
  const lastRow = table[table.length - 1];
  const idx = armorCols.indexOf(armorKey);
  return parseResult(lastRow[2 + idx]);
}

// ────────────────────────────────────────────────────────────────────────────
// WAT-1: ARMAS DE FILO
// Crítico: Tajo
// Cols: Pdur | Coraza | C.malla | CueroEnd | Cuero | S/A
// ────────────────────────────────────────────────────────────────────────────
const WAT1 = [
  [1,  19,  'P',  'P',  'P',  'P',  'P',   'P'  ],
  [20, 50,  0,    0,    0,    0,    0,     0    ],
  [51, 55,  1,    1,    1,    0,    0,     0    ],
  [56, 60,  1,    2,    1,    0,    0,     0    ],
  [61, 65,  2,    2,    2,    0,    0,     0    ],
  [66, 70,  3,    3,    3,    2,    3,     0    ],
  [71, 75,  4,    3,    4,    3,    5,     0    ],
  [76, 80,  5,    4,    5,    5,    '7A',  0    ],
  [81, 85,  6,    5,    6,    6,    '9A',  '9A' ],
  [86, 90,  6,    5,    7,    '7A', '10B', '10A'],
  [91, 95,  7,    6,    8,    '9A', '12B', '11B'],
  [96, 100, 8,    6,    9,    '10B','13B', '13C'],
  [101,105, 9,    7,    '10A','11B','14C', '15C'],
  [106,110, 10,   8,    '11A','12B','15C', '17D'],
  [111,115, '10T','8A', '12B','13C','17C', '19D'],
  [116,120, '11T','9A', '13B','15C','18D', '20D'],
  [121,125, '12T','9A', '13C','16C','19D', '21E'],
  [126,130, '13T','10B','14C','17D','20D', '23E'],
  [131,135, '14A','11B','15C','18D','22D', '25E'],
  [136,140, '15A','11C','16D','20D','23E', '27E'],
  [141,145, '16A','12D','17D','21E','24E', '28E'],
  [146,999, '18A','12E','18E','22E','25E', '30E'],
];

// ────────────────────────────────────────────────────────────────────────────
// WAT-2: ARMAS CONTUNDENTES
// Crítico: Impacto / Aplastamiento
// Cols: Pdur | Coraza | C.malla | CueroEnd | Cuero | S/A
// ────────────────────────────────────────────────────────────────────────────
const WAT2 = [
  [1,  19,  'P',  'P',  'P',  'P',  'P',  'P' ],
  [20, 35,  0,    0,    0,    0,    0,    0   ],
  [36, 40,  0,    1,    0,    0,    0,    0   ],
  [41, 45,  1,    1,    1,    0,    0,    0   ],
  [46, 50,  1,    2,    2,    0,    0,    0   ],
  [51, 55,  2,    3,    3,    0,    0,    0   ],
  [56, 60,  2,    3,    4,    0,    0,    0   ],
  [61, 65,  3,    4,    5,    0,    0,    0   ],
  [66, 70,  4,    5,    6,    2,    3,    0   ],
  [71, 75,  5,    5,    7,    3,    5,    0   ],
  [76, 80,  6,    6,    8,    4,    6,    0   ],
  [81, 85,  7,    7,    9,    6,    '7A', 6   ],
  [86, 90,  7,    8,    10,   '7A', '8A', 8   ],
  [91, 95,  8,    8,    11,   '8A', '9A', '9A'],
  [96, 100, 9,    9,    '12A','9B', '10B','10B'],
  [101,105, 10,   10,   '13A','10B','11B','12C'],
  [106,110, '10T','10A','14B','11B','12B','13C'],
  [111,115, '11T','11A','15B','12C','13C','14D'],
  [116,120, '12T','12B','16C','13C','14C','15D'],
  [121,125, '13T','13B','17C','15C','15C','17D'],
  [126,130, '14T','13C','18C','16C','16D','18E'],
  [131,135, '15A','14C','19D','17D','17D','19E'],
  [136,140, '16A','15D','20D','18D','18E','21E'],
  [141,145, '18A','16D','21E','19E','19E','22E'],
  [146,999, '20A','16E','22E','20E','20E','23E'],
];

// ────────────────────────────────────────────────────────────────────────────
// WAT-3: ARMAS A 2 MANOS
// Crítico: Tajo / Aplastamiento (según arma)
// Cols: Pdur | Coraza | C.malla | CueroEnd | Cuero | S/A
// ────────────────────────────────────────────────────────────────────────────
const WAT3 = [
  [1,  19,  'P',  'P',  'P',  'P',  'P',  'P' ],
  [20, 55,  0,    0,    0,    0,    0,    0   ],
  [56, 60,  0,    2,    0,    0,    0,    0   ],
  [61, 65,  2,    3,    0,    0,    0,    0   ],
  [66, 70,  2,    4,    3,    0,    6,    0   ],
  [71, 75,  4,    5,    5,    2,    '8A', 0   ],
  [76, 80,  5,    6,    7,    '4A', '10A',0   ],
  [81, 85,  7,    7,    9,    '7A', '13B','10A'],
  [86, 90,  8,    8,    11,   '9B', '15B','13B'],
  [91, 95,  9,    9,    '12A','12B','17C','16C'],
  [96, 100, 10,   11,   '14A','14C','20C','19D'],
  [101,105, 11,   '12A','16B','17C','22C','22D'],
  [106,110, '11T','13A','18B','19C','24C','25D'],
  [111,115, '12T','14B','20C','22C','27D','28E'],
  [116,120, '13T','15B','22C','24D','29D','31E'],
  [121,125, '14T','16C','24C','27D','31D','33E'],
  [126,130, '15T','17C','26D','29D','33E','36E'],
  [131,135, '16A','19D','28D','32E','36E','39E'],
  [136,140, '18A','20D','29E','34E','38E','42E'],
  [141,145, '20A','21E','31E','37E','40E','45E'],
  [146,999, '23A','22E','33E','40E','43E','48E'],
];

// ────────────────────────────────────────────────────────────────────────────
// WAT-4: PROYECTILES
// Crítico: Perforación
// Cols: Pdur | Coraza | C.malla | CueroEnd | Cuero | S/A
// ────────────────────────────────────────────────────────────────────────────
const WAT4 = [
  [1,  19,  'P',  'P',  'P',  'P',  'P',  'P' ],
  [20, 55,  0,    0,    0,    0,    0,    0   ],
  [56, 60,  0,    1,    0,    0,    0,    0   ],
  [61, 65,  1,    2,    1,    0,    0,    0   ],
  [66, 70,  2,    4,    3,    0,    6,    0   ],
  [71, 75,  3,    5,    5,    2,    '7A', '10A'],
  [76, 80,  4,    6,    6,    '5A', '9A', '12B'],
  [81, 85,  5,    7,    7,    '6A', '10B','13B'],
  [86, 90,  6,    8,    8,    '8B', '12B','15C'],
  [91, 95,  7,    9,    10,   '12B','14C','18C'],
  [96, 100, 8,    10,   12,   '13C','16C','20C'],
  [101,105, 9,    '12A',13,   '15C','18C','23D'],
  [106,110, 10,   '13A',14,   '16C','20C','26D'],
  [111,115, 11,   '14B',15,   '18C','22D','29D'],
  [116,120, '11T','15B',16,   '20D','25D','31D'],
  [121,125, '12T','16C',18,   '22D','28D','33E'],
  [126,130, '14T','17C',20,   '25D','31E','36E'],
  [131,135, '15T','18D',22,   '28E','34E','39E'],
  [136,140, '16T','20D','24A','30E','36E','42E'],
  [141,145, '18A','21E','26A','32E','38E','44E'],
  [146,999, '20A','22E','28B','34E','40E','46E'],
];

// ────────────────────────────────────────────────────────────────────────────
// WAT-5: GARRAS Y DIENTES
// Crítico: Tajo / Perforación (según ataque)
// Cols: Coraza | C.malla | CueroEnd | Cuero | Sin armadura
// NOTA: No hay columna Pdur
// ────────────────────────────────────────────────────────────────────────────
const WAT5 = [
  [1,  19,  'P',  'P',  'P',  'P',  'P' ],
  [20, 45,  'F',  'F',  'F',  'F',  'F' ],
  [46, 50,  0,    0,    0,    0,    1   ],
  [51, 55,  0,    0,    0,    0,    2   ],
  [56, 60,  1,    0,    0,    1,    4   ],
  [61, 65,  1,    1,    1,    2,    '5T'],
  [66, 70,  2,    2,    2,    4,    '6T'],
  [71, 75,  3,    3,    3,    5,    '8T'],
  [76, 80,  4,    4,    5,    '7T', '9A'],
  [81, 85,  5,    5,    '7T', '9T', '10A'],
  [86, 90,  6,    '6T', '8T', '10A','12A'],
  [91, 95,  '6T', '7T', '9A', '11A','13B'],
  [96, 100, '7T', '8A', '10A','12A','14B'],
  [101,105, '7A', '9A', '11A','13B','15B'],
  // Máximo para animales pequeños
  [106,110, '8A', '10A','12B','15B','17C'],
  [111,115, '9A', '11B','13B','16C','19C'],
  [116,120, '10B','11B','14C','17C','20D'],
  // Máximo para animales medianos
  [121,125, '14B','15B','18C','20C','26D'],
  [126,130, '16B','18C','20C','23D','28E'],
  [131,135, '18C','20C','22D','25D','30E'],
  // Máximo para animales grandes
  [136,140, '20C','23D','26D','30E','36E'],
  [141,145, '22D','25D','29E','33E','38E'],
  [146,999, '24E','27E','32E','36E','40E'],
];

// ────────────────────────────────────────────────────────────────────────────
// WAT-6: AGARRAR Y DESEQUILIBRAR
// Crítico: Desequilibrio / Presa
// Cols: Coraza | C.malla | CueroEnd | Cuero | Sin armadura
// ────────────────────────────────────────────────────────────────────────────
const WAT6 = [
  [1,  2,   'P',  'P',  'P',  'P',  'P' ],
  [3,  19,  'P',  'P',  'P',  'P',  'P' ], // Pifia 01-02 según tabla
  [20, 45,  'F',  'F',  'F',  'F',  'F' ],
  [46, 50,  0,    0,    0,    0,    0   ],
  [51, 55,  0,    0,    0,    0,    0   ],
  [56, 60,  1,    0,    0,    0,    0   ],
  [61, 65,  1,    0,    0,    0,    1   ],
  [66, 70,  '2T', 1,    0,    1,    1   ],
  [71, 75,  '2A', '2T', 1,    3,    2   ],
  [76, 80,  '3A', '3T', 2,    '4T', 4   ],
  [81, 85,  '3A', '4A', '4T', '6T', 5   ],
  [86, 90,  '4A', '4A', '5T', '7T', '7T'],
  [91, 95,  '4A', '5A', '6T', '8A', '8T'],
  [96, 100, '5B', '6A', '7A', '9A', '10T'],
  [101,105, '5B', '7A', '8A', '10A','11A'],
  // Máximo para animales pequeños
  [106,110, '6C', '8B', '10A','12B','14A'],
  [111,115, '7C', '9C', '11B','13B','15A'],
  [116,120, '8C', '10C','12B','14C','16B'],
  // Máximo para animales medianos
  [121,125, '10D','11C','14B','16C','18B'],
  [126,130, '11D','13D','16C','18C','20B'],
  [131,135, '12D','15D','18C','20D','22C'],
  // Máximo para animales grandes
  [136,140, '14E','19D','22C','26D','28C'],
  [141,145, '16E','21E','25D','28D','30C'],
  [146,999, '18E','23E','27E','30E','33D'],
];

// ────────────────────────────────────────────────────────────────────────────
// WAT-7: SIN ARMAS (MANOS / PIES)
// Crítico: Impacto
// Cols: Pdur | Coraza | C.malla | CueroEnd | Cuero | S/A
// ────────────────────────────────────────────────────────────────────────────
const WAT7 = [
  [1,  19,  'P',  'P',  'P',  'P',  'P',  'P' ],
  [20, 35,  'F',  'F',  'F',  'F',  'F',  'F' ],
  [36, 40,  'F',  0,    0,    0,    0,    0   ],
  [41, 45,  'F',  0,    0,    0,    0,    0   ],
  [46, 50,  'F',  0,    0,    0,    0,    0   ],
  [51, 55,  0,    0,    0,    0,    0,    0   ],
  [56, 60,  0,    0,    0,    0,    0,    0   ],
  [61, 65,  0,    1,    0,    0,    0,    0   ],
  [66, 70,  0,    1,    1,    0,    0,    0   ],
  [71, 75,  1,    1,    1,    0,    0,    0   ],
  [76, 80,  1,    2,    2,    1,    2,    0   ],
  [81, 85,  1,    2,    2,    2,    3,    5   ],
  [86, 90,  2,    3,    3,    4,    5,    7   ],
  [91, 95,  2,    3,    4,    5,    7,    8   ],
  [96, 100, 2,    4,    4,    6,    '8A', '9A'],
  [101,105, 3,    4,    5,    '7A', '9A', '10A'],
  [106,110, 3,    5,    5,    '8A', '10B','12B'],
  [111,115, 4,    6,    6,    '9B', '11B','13B'],
  [116,120, 5,    6,    7,    '10B','13C','14C'],
  [121,125, 5,    7,    '8A', '11C','14C','15C'],
  [126,130, 6,    8,    '9A', '12C','15C','17D'],
  [131,135, 6,    '8A', '10A','13D','16D','18D'],
  [136,140, 7,    '9A', '11A','14D','17D','19D'],
  [141,145, '8T', '9A', '12B','15D','18D','20E'],
  [146,999, '9A', '10B','13B','16E','19E','22E'],
];

// ────────────────────────────────────────────────────────────────────────────
// WAT-8: LANZAMIENTO DE OBJETOS
// Crítico: Impacto / Aplastamiento
// Cols: Pdur | Coraza | C.malla | CueroEnd | Cuero | S/A
// ────────────────────────────────────────────────────────────────────────────
const WAT8 = [
  [1,  19,  'P',  'P',  'P',  'P',  'P',  'P' ],
  [20, 35,  'F',  0,    0,    0,    0,    'P' ],
  [36, 40,  'F',  0,    0,    0,    0,    0   ],
  [41, 45,  'F',  0,    0,    0,    0,    0   ],
  [46, 50,  0,    1,    0,    0,    0,    0   ],
  [51, 55,  0,    1,    1,    0,    0,    0   ],
  [56, 60,  0,    2,    1,    0,    0,    0   ],
  [61, 70,  0,    2,    2,    0,    0,    0   ],
  [71, 75,  1,    3,    2,    2,    3,    0   ],
  [76, 80,  1,    3,    3,    3,    4,    6   ],
  [81, 85,  1,    4,    3,    4,    5,    7   ],
  [86, 90,  2,    5,    4,    5,    6,    8   ],
  [91, 95,  2,    5,    5,    6,    7,    9   ],
  [96, 100, 2,    6,    6,    7,    '7A', '10A'],
  [101,105, 3,    6,    7,    '8A', '8A', '11B'],
  [106,110, 3,    7,    8,    '9A', '10B','12B'],
  [111,115, 4,    7,    9,    '10B','11B','12C'],
  [116,120, 5,    8,    '10A','12B','12C','13C'],
  [121,125, 5,    '8A', '11A','13C','14C','15D'],
  [126,130, 6,    '9A', '12B','13C','15D','16D'],
  [131,135, 6,    '9A', '12B','15D','16D','18D'],
  [136,140, 7,    '10B','13C','15D','18D','20E'],
  [141,145, '8T', '10C','13D','17E','20E','22E'],
  [146,999, '9A', '11D','14E','18E','22E','24E'],
];

// ────────────────────────────────────────────────────────────────────────────
// Metadatos de cada tabla
// ────────────────────────────────────────────────────────────────────────────
const TABLE_META = {
  wat1: {
    name:       'WAT-1 · Armas de Filo',
    shortName:  'Armas de Filo',
    critType:   'Tajo',
    critEmoji:  '🗡️',
    data:       WAT1,
    armorCols:  ARMOR_COLS.standard,
    pifiaTable: 'empuñada',
  },
  wat2: {
    name:       'WAT-2 · Armas Contundentes',
    shortName:  'Contundentes',
    critType:   'Impacto / Aplastamiento',
    critEmoji:  '🔨',
    data:       WAT2,
    armorCols:  ARMOR_COLS.standard,
    pifiaTable: 'empuñada',
  },
  wat3: {
    name:       'WAT-3 · Armas a 2 Manos',
    shortName:  'A 2 Manos',
    critType:   'Tajo / Aplastamiento',
    critEmoji:  '⚔️',
    data:       WAT3,
    armorCols:  ARMOR_COLS.standard,
    pifiaTable: 'empuñada',
  },
  wat4: {
    name:       'WAT-4 · Proyectiles',
    shortName:  'Proyectiles',
    critType:   'Perforación',
    critEmoji:  '🏹',
    data:       WAT4,
    armorCols:  ARMOR_COLS.standard,
    pifiaTable: 'proyectil',
  },
  wat5: {
    name:       'WAT-5 · Garras y Dientes',
    shortName:  'Garras / Dientes',
    critType:   'Tajo / Perforación',
    critEmoji:  '🐾',
    data:       WAT5,
    armorCols:  ARMOR_COLS.wat5,
    pifiaTable: 'empuñada',
    note:       'Sin columna Piel Dura. Seleccionar armadura sin Pdur.',
  },
  wat6: {
    name:       'WAT-6 · Agarrar / Desequilibrar',
    shortName:  'Agarrar',
    critType:   'Desequilibrio / Presa',
    critEmoji:  '🤼',
    data:       WAT6,
    armorCols:  ARMOR_COLS.wat6,
    pifiaTable: 'empuñada',
    note:       'Sin columna Piel Dura. Pifia en 01-02.',
  },
  wat7: {
    name:       'WAT-7 · Sin Armas (Manos/Pies)',
    shortName:  'Manos / Pies',
    critType:   'Impacto',
    critEmoji:  '👊',
    data:       WAT7,
    armorCols:  ARMOR_COLS.standard,
    pifiaTable: 'empuñada',
  },
  wat8: {
    name:       'WAT-8 · Lanzamiento de Objetos',
    shortName:  'Lanzamiento',
    critType:   'Impacto / Aplastamiento',
    critEmoji:  '🪨',
    data:       WAT8,
    armorCols:  ARMOR_COLS.standard,
    pifiaTable: 'proyectil',
    note:       'No suma BL sino MM + adolescencia de lanzamiento.',
  },
};

// ────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL: consultar resultado de ataque
//   tableKey : 'wat1'…'wat8'
//   armorKey : 'pdur'|'coraza'|'cmalla'|'cueroEnd'|'cuero'|'sa'
//   roll     : tirada final (número entero)
// ────────────────────────────────────────────────────────────────────────────
function getAttackResult(tableKey, armorKey, roll) {
  const meta = TABLE_META[tableKey];
  if (!meta) return { type: 'unknown', pv: 0, crit: null, meta: null };

  // WAT-5 y WAT-6 no tienen columna Pdur: redirigir a Coraza si se selecciona Pdur
  let effectiveArmor = armorKey;
  if ((tableKey === 'wat5' || tableKey === 'wat6') && armorKey === 'pdur') {
    effectiveArmor = 'coraza'; // fallback
  }

  const result = lookupTable(meta.data, effectiveArmor, meta.armorCols, roll);
  return { ...result, meta };
}

// ────────────────────────────────────────────────────────────────────────────
// WSD-3: TABLA DE SORTILEGIOS DIRIGIDOS
// Crítico: según tipo de hechizo (WSD-2): Impacto, Calor, Frío, Electricidad,
//          Aplastamiento, etc. Siempre nivel C.
// Cols: Pdur | Coraza | C.M. (Cota Malla) | C.E. (Cuero Endurecido) | C* (Cuero) | S.A.
//
// Regla: sumar (BM atacante - BDM defensor) + modificadores WSD-1 a la tirada d100.
//        Si la tirada SIN MODIFICAR es ≤19 → Pifia (tabla WFP-3)
// ────────────────────────────────────────────────────────────────────────────
const WSD3 = [
  [1,  19,  'P',  'P',  'P',  'P',  'P',  'P' ],
  [20, 20,  0,    2,    1,    0,    0,    1   ],
  [21, 24,  0,    2,    1,    0,    0,    1   ],
  [25, 28,  0,    3,    2,    1,    0,    2   ],
  [29, 32,  0,    4,    3,    2,    1,    3   ],
  [33, 36,  0,    '5A', 4,    3,    2,    4   ],
  [37, 40,  0,    '6A', '5A', 4,    3,    5   ],
  [41, 44,  1,    '7A', '6A', '5A', 4,    6   ],
  [45, 48,  1,    '8A', '7A', '6A', 5,    '7A'],
  [49, 52,  1,    '9A', '8A', '7A', '6A', '8A'],
  [53, 56,  2,    '10B','9A', '8A', '7A', '9A'],
  [57, 60,  2,    '11B','10B','9A', '8A', '10B'],
  [61, 64,  3,    '12B','11B','10B','9A', '11B'],
  [65, 68,  3,    '12B','11B','10B','10A','12B'],
  [69, 72,  4,    '13B','12B','11B','11A','13B'],
  [73, 76,  4,    '13C','12C','11B','11B','14C'],
  [77, 80,  '5A', '14C','12C','12C','12B','15C'],
  [81, 84,  '6A', '14C','13C','12C','12B','16C'],
  [85, 88,  '7A', '15C','14C','13C','13B','17C'],
  [89, 92,  '8A', '15D','14D','13C','13B','18C'],
  [93, 96,  '9A', '16D','15D','14D','14C','19C'],
  [97, 99,  '10B','16D','15D','14D','14C','19C'],
  [100,103, '11B','18D','16D','15D','14D','20C'],
  [104,107, '12B','19D','16D','15D','15D','21D'],
  [108,110, '12B','20D','18D','16D','15D','22D'],
  [111,113, '13B','22D','19D','16D','16D','24D'],
  [114,116, '13C','23D','20D','18D','17D','25D'],
  [117,118, '14C','24D','22D','19D','18D','28D'],
  [119,119, '14C','25D','23D','19D','19D','29D'],
  [120,999, '15C','25D','23D','20D','20D','30D'],
];

// Columnas WSD-3 usan las mismas keys que standard pero sin 'pdur' como tal
// El manual llama "Pdur" a criaturas de piel dura (mismo concepto)
const WSD3_COLS = ['pdur','coraza','cmalla','cueroEnd','cuero','sa'];

TABLE_META['wsd'] = {
  name:      'WSD · Sortilegios Dirigidos',
  shortName: 'Sortilegios',
  critType:  'Según tipo de hechizo (WSD-2)',
  critEmoji: '✨',
  data:      WSD3,
  armorCols: WSD3_COLS,
  pifiaTable:'hechizo',
  isMagic:   true,
  note:      'Suma BM atacante − BDM defensor + modificadores WSD-1 a la tirada. Pifia en ≤19 → tabla WFP-3.',
};

// --- CRITICAL TABLES DATA FROM MANUAL (WCT-1 TO WCT-12) ---
const CRIT_TABLES = {
  tajo: {
    name: 'WCT-6 · Críticos de Tajo',
    rows: [
      [-49, 5, 'Sin cortes, 0 pv extra.'],
      [6, 20, 'Herida leve en la pantorrilla, 1pv/a.'],
      [21, 35, 'Corte en la parte superior de la pierna, 5 pv. Sin grebas, 2 pv/a.'],
      [36, 49, 'Herida leve en el pecho, 3pv, 1pv/a y -5 ACT hasta final de la lucha.'],
      [50, 50, 'Cortada la mano secundaria, 12 pv.'],
      [51, 65, 'Herida leve en el antebrazo, 4pv y 2pv/a hasta recibir cura.'],
      [66, 79, 'Herida moderada en el muslo. 6 pv y 2 pv/a hasta final de la lucha. Aturdido 2 as. y -10 ACT 10 minutos. 50 % de probabilidad de que el arma se rompa.'],
      [80, 80, 'Un tajo en el cuello secciona la arteria carótida. Cuello roto. Muere tras 2 as. de intensa agonía. Aplicar tratamiento supone MM media y 3v20.'],
      [81, 86, 'Tajo en músculos y tendones del brazo primario. Si no se llevan grebas, brazo inutilizado durante toda la partida, 10 pv.'],
      [87, 89, 'Un ojo ensartado, 10 pv y aturdido 1 asalto. Si llevas casco, salvas el ojo, pero se rompen casco y arma atacante.'],
      [90, 90, 'Destripado. Muerte instantánea, 25 % de probabilidad de que el arma se quede atascada en el contrincante 2 asaltos.'],
      [91, 96, 'Inconsciente 6 horas por un tajo en un lado de la cabeza. 15 pv. El yelmo lo evita pero se rompe. Reanimar supone al menos 4 v20.'],
      [97, 99, 'Pierna izquierda cortada bajo la rodilla. 20 pv y 10 pv/a hasta recibir cura. Cae y se desmaya. MM reducida a 0 para siempre.'],
      [100, 100, 'Tajo abierto en el costado. Inconsciente y muerte en 3 asaltos por daños masivos.'],
      [101, 106, 'Grave tajo en el abdomen, 10 pv y 8pv/a hasta recibir cura. Aturdido 4 asaltos.'],
      [107, 109, 'Brazo primario cortado, saliendo despedido haciendo un C de impacto al PJ más cercano. 20 pv.'],
      [110, 110, 'Corazón empalado. Muerte instantánea, 75 % de probabilidad de que el arma se rompa.'],
      [111, 116, 'Mano primaria cortada, 12 pv/a hasta recibir cura. Aturdido 6 asaltos. El tratamiento para salvar la mano implica MM difícil y 6v20.'],
      [117, 119, 'Tajo en la espina dorsal. Colapso inmediato y parálisis de cintura para abajo durante 1 hora.'],
      [120, 999, 'El filo pasa como un cuchillo en mantequilla por el cuello. La cabeza sale despedida aplicando un C de impacto al PJ más cercano.']
    ]
  },
  impacto: {
    name: 'WCT-4 · Críticos de Impacto',
    rows: [
      [-49, 5, 'Ni un rasguño, 0 pv.'],
      [6, 20, 'Golpe sesgado, 5 pv.'],
      [21, 35, 'Golpe tambaleante en el costado, 10 pv y aturdido 1 asalto.'],
      [36, 49, 'Golpe fuerte en el hombro, gira y retrocede 3 cuadros. 12 pv y aturdido 2 asaltos.'],
      [50, 50, 'Porrazo en el brazo del escudo, que se rompe. Si no lleva escudo, brazo inmovilizado 10 minutos.'],
      [51, 65, 'Golpe en la pierna. Derribado, 8 pv y grebas rotas si lleva.'],
      [66, 79, 'Golpe en las costillas. 15 pv y dificultad para respirar, -20 MM durante 10 minutos cronometrados.'],
      [80, 80, 'Golpe a la cabeza. 20 pv y casco roto. Sin casco, secuelas internas que reducen la INT a 0 para siempre.'],
      [81, 86, 'Golpe en la parte superior de la pierna. 15 y -10 ACT hasta fin de combate. Sin grebas, MM a la mitad hasta fin de partida. 50 % de probabilidad de que el arma se rompa.'],
      [87, 89, 'Impacto en el cuello. 12 pv, aturdido 5 asaltos y sin habla toda la partida. Si no lleva armadura, pérdida de habla permanente.'],
      [90, 90, 'Golpe en la sien. 20 minutos paralizado de cuello para abajo.'],
      [91, 96, 'Rodilla dislocada por el golpe, 15 pv y -15 ACT hasta final de mapa.'],
      [97, 99, 'Impacto en el abdomen, 18 pv y 8 asaltos aturdido. Sin armadura, muerte en 6 asaltos salvo recibir, al menos, 2 v20.'],
      [100, 100, 'La cabeza se convierte en una pelota de baseball, que sale despedida haciendo un C de impacto al PJ más cercano.'],
      [101, 106, 'Golpe a la mandíbula, que se rompe. No podrá hablar ni tomar pociones durante 30 minutos. 75% de que el arma se rompa con el golpe.'],
      [107, 109, 'Hueso clavado en órgano interno por fuerte golpe. Muerte en 6 asaltos si no restablece sus PV a 100.'],
      [110, 110, 'Pecho destrozado. Estallan pulmones y corazón. Muerte instantánea que lo deja todo hecho un asco... El inventario revienta también.'],
      [111, 116, 'Gira sobre sí mismo por el impacto, cae al suelo y se rompe los 2 brazos. -40 ACT toda la partida (salvo sello de regeneración).'],
      [117, 119, 'El porrazo destroza el cráneo en miles de partículas. Muerte instantánea y el arma homicida destruída.'],
      [120, 999, 'El porrazo aniquila todo el esqueleto. El blanco queda reducido a una pulpa gelatinosa (y su inventario también).']
    ]
  },
  aplastamiento: {
    name: 'WCT-5 · Críticos de Aplastamiento',
    rows: [
      [-49, 5, 'Ni un rasguño, 0 pv.'],
      [6, 20, 'Fractura leve en las costillas, 5 pv y -5 ACT hasta fin de combate.'],
      [21, 35, 'Golpe en el costado, 4 pv y -40 ACT hasta el siguiente asalto.'],
      [36, 49, 'Golpe en el antebrazo, 5 pv y 2 asaltos aturdido. 50% de probabilidad de que el arma atacante se rompa.'],
      [50, 50, 'Golpe duro al brazo secundario. Si lleva escudo se rompe; si no, brazo inútil 30 minutos.'],
      [51, 65, 'Golpe al hombro del brazo secundario, que rompe el escudo o lo que lleve. Si no lleva escudo, hombro roto y brazo inutilizado hasta el final de la lucha.'],
      [66, 79, 'Hueso de la pierna roto, 12 pv y -40 ACT durante 30 minutos. Aturdido 2 asaltos. 50% de probabilidad de que el arma se rompa.'],
      [80, 80, 'Golpe en la frente, 30 pv y un ojo destruído, que reduce PRE a la mitad. Aturdido el resto del combate. Si llevas casco, evitas el daño, se rompe y 20 pv.'],
      [81, 86, 'El golpe aplasta el brazo principal, que queda inutilizado hasta recibir, al menos, 2 v20. 8pv y aturdido 2 asaltos.'],
      [87, 89, 'Rodilla hecha trizas, 9 pv y -60 MM hasta recibir una RE o cura mágica. 70 % de probabilidad de que el arma se rompa.'],
      [90, 90, 'Vértebras del cuello aplastadas. Paralizado de hombros hacia abajo 30 minutos. 25 pv y 1 asalto inconsciente.'],
      [91, 96, 'Craneo aplastado que reduce tu INT a la mitad. Se evita llevando casco, pero se rompe.'],
      [97, 99, 'Golpe tremendo al pecho hace que las costillas perforen los pulmones. Cae y muere en 6 as. salvo recibir, al menos, 3 v20.'],
      [100, 100, 'Golpe en la mandíbula, que se hunde hasta el cerebro. Muerte instantánea.'],
      [101, 106, 'El golpe rompe la cadera, 15 pv y -50 ACT; aún curado, arrastrará un -25 ACT toda la partida.'],
      [107, 109, 'Un golpe en el cuello aplasta la garganta. Dificultad para respirar y -30 ACT 30 minutos, 25 pv.'],
      [110, 110, 'Cadera aplastada, 35 pv y aturdido 2 asaltos. Activo los siguientes 4 asaltos; después muere por fallo interno salvo recibir, al menos, 60 pv en pociones.'],
      [111, 116, 'Brazo principal aplastado y fino como el papel. Brazo inutilizado (obviamente), 20 pv y aturdido 2 asatos. Se rompe el arma.'],
      [117, 119, 'Una presión brutal aplasta la cavidad torácica. 25 pv. Cae y muere en 3 asaltos salvo restaurar sus pv a 100.'],
      [120, 999, 'Presión insoportable en el pecho. El corazón queda destruído y el sujeto muere en el acto. Buen trabajo.']
    ]
  },
  perforacion: {
    name: 'WCT-7 · Críticos de Perforación',
    rows: [
      [-49, 5, 'Golpe oblicuo sin daño extra.'],
      [6, 20, 'Pinchazo leve, 3 pv.'],
      [21, 35, 'Pinchazo en el muslo. 3 pv. Si no lleva armadura, 3 pv/a hasta fin de lucha.'],
      [36, 49, 'Herida leve en el antebrazo, 2 pv y aturdido 1 asalto.'],
      [50, 50, 'Diana en el centro de la mano secundaria, que queda inutilizada, 15 pv.'],
      [51, 65, 'Impacto en un lado del pecho, 5 pv y 1pv/a. Aturdido 1 asalto.'],
      [66, 79, 'Impacto en la parte superior de la pierna. Tendones desgarrados, 8 pv y -25 ACT 20 minutos.'],
      [80, 80, 'Impacto en el cuello, nervios y vasos sanguíneos seccionados. Muerte por fallo en el corazón. Cae dejando un gran charco de sangre.'],
      [81, 86, 'Perforado el brazo primaro, 12 pv y aturdido 3 asaltos. -15 ACT hasta recibir, al menos, 3 v20.'],
      [87, 89, 'Rodilla perforada. Derribado y aturdido 3 asaltos. -20 MM para siempre; 50% de probabilidad de que el arma (no arco) se rompa.'],
      [90, 90, 'Impacto en los pulmones. Cae y queda inconsciente; muerte en 2 asaltos si no recibe, al menos, 80 pv en pociones o cura mágica.'],
      [91, 96, 'Impacto en un lado de la cabeza. Inconsciente 6 horas y después muere. El casco evita esto, pero se rompe, y 15 pv.'],
      [97, 99, 'El proyectil entra por el ano. El fuerte grito de dolor infringe a todos los presentes un B de desequilibrio. 25 pv y 20 minutos sin poder andar.'],
      [100, 100, 'El proyectil entra por el ojo. Muerte instantánea, una auténtica diana.'],
      [101, 106, 'Herida grave en el abdomen. 10 pv y aturdido 4 asaltos. 6 pv/a y -20 ACT hasta recibir, al menos, 3 v20.'],
      [107, 109, 'Estocada que revienta la mano primaria. Mano inutilizada, 25 pv y aturdido 2 asaltos.'],
      [110, 110, 'Estocada que atraviesa el corazón. Retrocede girando sobre sí mismo 3 cuadros hasta fallecer. 70 % de que el arma (no arco) se rompa.'],
      [111, 116, 'Estocada en la pierna, tendón tocado. Derribado y aturdido 2 asaltos. Las secuelas dejan -20 MM toda la partida.'],
      [117, 119, 'Impacto en el vientre, 9 pv, derribado. Muere en 6 asaltos de intensa agonía si no recibe, al menos, 80 pv en pociones (o cura mágica).'],
      [120, 999, 'Atravesado de oreja a oreja. BULL.']
    ]
  },
  calor: {
    name: 'WCT-1 · Críticos de Calor',
    rows: [
      [-49, 5, 'Aire caliente, 0 pv.'],
      [6, 20, 'Fuerte calor con poco efecto, 3 pv.'],
      [21, 35, 'Quemadura leve, 8 pv.'],
      [36, 49, 'Cegado 3 asaltos por humo ardiente. 12 pv.'],
      [50, 50, 'Mano secundaria carbonizada. 15 pv.'],
      [51, 58, 'La ropa comienza a arder y tarda 2 as. en apagarse. 8pv/a.'],
      [59, 65, 'Un fuerte fogonazo carboniza el arma que lleves equipada. 10 pv.'],
      [66, 79, 'Derribado por tremendo impacto. Se te cae el arma, y destruída la defensa que tengas en las piernas. 12 pv.'],
      [80, 80, 'Impacto en la cabeza. Rostro quemado. Pierdes tu casco; si no llevas, inconsciente y 15 pv/a hasta recibir curación.'],
      [81, 86, 'El fuego se apodera de la espalda. Pierdes un objeto de defensa aleatorio de la ficha. 2pv/a hasta recibir curación.'],
      [87, 89, 'Cegado hasta terminar el combate por un tremendo fogonazo. Pierdes tu casco. Si no llevas casco, 25 pv.'],
      [90, 90, 'Impacto directo en el pecho, 20 pv. Pierdes tu armadura, y si no llevas, otros 20 pv e inconsciente 2 asaltos.'],
      [91, 96, 'Tu casco se rompe. Si no llevas casco, pierdes un ojo y tu PRE se ve reducida a la mitad para siempre. Aturdido 3 asaltos.'],
      [97, 99, 'El fuego se apodera de una pierna. Si no llevas grebas, que se rompen, una pierna prácticamente inutilizada, lo que reduce tu MM a la mitad para siempre.'],
      [100, 100, 'Impacto en el cuello que funde las vértebras y pega la piel a la ropa. Paralizado de cuello para abajo durante 30 minutos cronometrados. 35 pv.'],
      [101, 106, 'Impacto en una pierna, 15 pv. Si no llevas grebas, -70 act durante 10 minutos.'],
      [107, 109, 'Impacto en la cabeza. Si no llevas casco, que se rompe, cegado durante 30 minutos cronometrados. 20 pv y aturdido 3 asaltos.'],
      [110, 110, 'Cintura carbonizada. El sujeto queda partido por la mitad, y todos sus objetos son destruídos. Se evita llevando armadura pero esta, junto con todo el inventario, queda carbonizada.'],
      [111, 116, 'Mano dominante carbonizada. 20 pv y aturdido 3 asaltos.'],
      [117, 119, 'El fuego se apodera del cuerpo. Todo el inventario destruído y muerte en 6 asaltos salvo que se apague el fuego. 25 pv.'],
      [120, 999, '¿Llevas cabeza? Pues ya no la llevas. Si llevas casco sobrevives, pero se rompe y pierdes la mitad de tus PV redondeando hacia arriba. -80 ACT. durante una hora cronometrada.']
    ]
  },
  frio: {
    name: 'WCT-2 · Críticos de Frío',
    rows: [
      [-49, 5, 'Fresca brisa, 0 pv.'],
      [6, 20, 'Golpe frío y seco, 1 asalto aturdido.'],
      [21, 35, 'Congelación leve. 1 asalto congelado.'],
      [36, 49, 'Mucho frío, 10 pv.'],
      [50, 50, 'Mano secundaria cristalizada. Después explota de forma muy bonita. 15 pv.'],
      [51, 58, 'Fuerte ráfaga helada, congelado 3 asaltos. 8 pv por asalto congelado.'],
      [59, 65, 'Fuerte viento helado rompe el arma que lleves equipada. 10 pv.'],
      [66, 79, 'Derribado por tremendo impacto. Se te cae el arma, y destruída la defensa que tengas en las piernas. 12 pv.'],
      [80, 80, 'Impacto en la cabeza. Pierdes la nariz, así como el olfato. Pierdes tu casco, que evita la pérdida de la nariz. 12 pv.'],
      [81, 86, 'Congelado 3 asaltos de cuello para abajo. Pierdes un objeto aleatorio de ataque o defensa. 15 pv.'],
      [87, 89, 'Ambos brazos congelados durante 1d4 asaltos + 1. Se rompe todo lo que lleves en las manos. 20 pv.'],
      [90, 90, 'Impacto directo en el pecho, 20 pv. Pierdes tu armadura, y si no llevas, otros 20 pv y congelado 3 asaltos.'],
      [91, 96, 'Tu casco se rompe. Si no llevas casco, pierdes un ojo y tu PRE se ve reducida a la mitad para siempre. Aturdido 3 asaltos.'],
      [97, 99, 'El frío se apodera de tu mano dominante. El fuerte trauma reduce la movilidad de esa mano a la mitad durante toda la partida.'],
      [100, 100, 'Impacto en el cuello que congela la espina dorsal. Congelado de cuello para abajo durante 30 minutos cronometrados. 30 pv.'],
      [101, 106, 'Impacto en una pierna, 15 pv. Si no llevas grebas, -70 act durante 10 minutos.'],
      [107, 109, 'Impacto directo. Si no llevas armadura, que se rompe, congelado 30 minutos cronometrados. 20 pv.'],
      [110, 110, 'Congelación total. Todos los objetos del inventario destruídos. Se evita llevando armadura, pero se rompe junto con todo el inventario.'],
      [111, 116, 'Mano dominante cristalizada. 20 pv y aturdido 3 asaltos. Mano inservible.'],
      [117, 119, 'Torrente sanguíneo congelado. Todo el inventario destruído y muerte en 6 asaltos salvo que se le aplique calor.'],
      [120, 999, '¿Llevas cabeza? Pues ya no la llevas. Si llevas casco sobrevives, pero se rompe y pierdes la mitad de tus PV redondeando hacia arriba. -80 a la actividad durante una hora cronometrada.']
    ]
  },
  electricidad: {
    name: 'WCT-3 · Críticos de Electricidad',
    rows: [
      [-49, 5, 'Pelos de punta. 0 pv.'],
      [6, 20, 'Pequeña descarga. Si lleva cota de malla, aturdido 1 asalto.'],
      [21, 35, 'Explosión de luz. Cegado 1 asalto.'],
      [36, 49, 'Descarga moderada. 6 pv. Si lleva cota de malla aturdido 2 asaltos.'],
      [50, 50, 'La descarga destruye los tendones del brazo secundario, que queda inservible.'],
      [51, 65, 'Descarga potente, 9 pv y 10 a la actividad 3 asaltos.'],
      [66, 79, 'Impacto en el brazo secundario, que queda inservible 30 minutos.'],
      [80, 80, 'Impacto en el costado que colapsa el sistema nervioso. -60 a la actividad durante una hora cronometrada. Si lleva armadura evita el daño, pero se rompe.'],
      [81, 86, 'Golpe en el brazo del arma, que se rompe estallando en mil pedazos, haciendo un C de impacto a todo PJ o PNJ cercano.'],
      [87, 89, 'Completamente cubierto por electricidad. Cae en shock y muere en 5 asaltos si no recibe cura. Durante 30 minutos, todo PJ o PNJ que toque recibirá un C de elect.'],
      [90, 90, 'Impacto en la cabeza. Muerte directa si no lleva casco. Si lleva, se rompe y -50 a la actividad toda la partida.'],
      [91, 96, 'Impacto en el pecho. Si lleva cota de malla, se funde con el torso y no se la podrá quitar. Si no, inconsciente 6 horas o hasta recibir tratamiento.'],
      [97, 99, 'El fuerte impacto destroza 2 armas o defensas al azar de tu inventario.'],
      [100, 100, 'El sistema nervioso actúa como superconductor. La inmediata muerte proporciona a los presentes un espectáculo de luces.'],
      [101, 106, 'Impacto en la cara. Pierde la nariz y el olfato. Si llevas casco se evita, pero se rompe y quedas cegado 3 asaltos.'],
      [107, 109, 'Ambos brazos paralizados por el shock durante una hora. Además, se rompe todo lo que llevara en las manos.'],
      [110, 110, 'La cabeza ya no está disponible para su uso. Humo y ozono rodean el cuerpo sin vida.'],
      [111, 116, 'El brazo dominante queda destruído por dentro. Inservible para siempre.'],
      [117, 119, 'El impacto parte por la mitad al sujeto. La descarga se extiende e infringe un A de elect. a los que estén en un radio de 3 cuadros.'],
      [120, 999, 'La descarga deshace la estructura celular. Todo el cuerpo se convierte en polvo.']
    ]
  },
  desequilibrio: {
    name: 'WCT-8 · Críticos de Desequilibrio',
    rows: [
      [-49, 5, 'Demasiado débil.'],
      [6, 20, 'Golpe leve al brazo, 2 pv y -5 ACT durante 2 asaltos.'],
      [21, 35, 'Golpe leve en la pierna. 4 pv; si no lleva grebas, aturdido 1 asalto.'],
      [36, 49, 'Golpe al brazo secundario, que rompe lo que lleves. 5 pv y -10 ACT 2 asaltos.'],
      [50, 50, 'La caída rompe el brazo secundario, así como lo que lleve equipado en él. Brazo inútil 30 minutos.'],
      [51, 65, 'Golpetazo en el pecho, reculando 1 cuadro. -10 ACT 3 asaltos.'],
      [66, 79, 'Golpe en el codo primario. Brazo dormido 3 asaltos y al suelo lo que lleve en él.'],
      [80, 80, 'Brutal golpe en la cadera. Blanco derribado. Una pierna inutilizada toda la partida con -60 MM.'],
      [81, 86, 'Golpe en el costado. Desplazado 2 cuadros. Se le cae todo lo que lleve en las manos y aturdido 2 asaltos.'],
      [87, 89, 'El tropiezo le hace caer en una posición embarazosa. Sus compañeros pierden su siguiente asalto por un ataque de risa.'],
      [90, 90, 'Golpe en la espalda te hace volar 3 cuadros hacia delante. Grave daño, paralizado de cintura para abajo 30 minutos.'],
      [91, 96, 'Duro golpe en la cabeza. Rebota 3 cuadros hacia atrás y aturdido 6 asaltos. Si no lleva casco, inconsciente 15 minutos.'],
      [97, 99, 'Golpe terrible al caer de rodillas. El arma sale disparada infringiendo el crítico correspondiente a su compañero más cercano, 15 pv.'],
      [100, 100, 'Golpetazo en el pecho. Desplazado 3 cuadros lateralmente. Cae y se rompe ambos brazos. -30 ACT hasta final de la partida.'],
      [101, 106, 'El golpe rompe una pierna, 12 pv y -50 ACT hasta recibir al menos 3 v20.'],
      [107, 109, 'Golpe a la cabeza. Despedido 3 cuadros hacia atrás, 12 pv, aturdido 3 asaltos y casco roto si tuviera.'],
      [110, 110, 'Golpe salvaje en la cabeza. Cae y muere en 6 asaltos si no recibe, al menos, 120 pv (o 2 curas mágicas). Tendrá toda la partida -20 ACT por terrible dolor de cabeza.'],
      [111, 116, 'Tremendo golpe lateral. Rompe su brazo primario y lo que lleve equipado en él. -20 con ese brazo 30 minutos.'],
      [117, 119, 'La caída aparatosa hace que se rompan tus 2 brazos y un arma y defensa al azar. 20 pv, aturdido 3 asaltos y -40 ACT 30 minutos.'],
      [120, 999, 'Horrible golpe en la sien. Desplazado 6 cuadros hacia atrás. Muerte instantánea, nada bonito.']
    ]
  },
  presa: {
    name: 'WCT-9 · Críticos de Presa',
    rows: [
      [-49, 5, 'Sin agarre.'],
      [6, 20, 'Golpe superficial, 2 pv.'],
      [21, 35, 'Ataque rechazado, 3pv y aturdido 1 asalto.'],
      [36, 49, 'Presa en la pierna, se suelta pero queda aturdido 2 asaltos.'],
      [50, 50, 'Brazo secundario atrapado y torcido. Se rompe el equipo de ese brazo, 12 pv.'],
      [51, 65, 'Brazo secundario atrapado durante 1d4 asaltos. Pierdes el equipo en ese brazo.'],
      [66, 79, 'Atrapado el brazo primario, -25 ACT 3 asaltos.'],
      [80, 80, 'Ambas piernas trabadas, cae y se hace un C de impacto. Inconsciente 2 asaltos.'],
      [81, 86, 'Brazo del arma inmovilizado, ligamentos y lo que lleve en ese brazo y mano rotos. -40 ACT 10 minutos.'],
      [87, 89, 'Completamente atrapado e inmovilizado durante 2 asaltos.'],
      [90, 90, 'Peligrosa presa en el cuello. Inconsciente 1d4 asaltos. -60 ACT 3 asaltos tras despertar.'],
      [91, 96, 'Presa en la cabeza, aturdido 4 asaltos. Casco roto; si no lleva casco, 25 pv inconsciente 3 asaltos.'],
      [97, 99, 'Ambos brazos atrapados y pegados al pecho. Si lleva algo en los brazos se rompe. -75 ACT mientras dura la presa.'],
      [100, 100, 'Estrangulado. Cambiará de color durante 3 asaltos hasta morado profundo. Para librarse debe superar MM difícil, que le dejará -50 ACT 30 minutos.'],
      [101, 106, 'Costillas fisuradas por presa en el pecho. Aturdido 3 asaltos y -10 ACT hasta final de mapa.'],
      [107, 109, 'La presa rompe por varias partes el brazo principal, rompiendo lo que lleve equipado. -15 ACT hasta final de partida.'],
      [110, 110, 'La presa rompe todo el inventario del personaje, 20 pv.'],
      [111, 116, 'Pie trabajo, tropieza, cae y se le rompe el arma equipada. Recibe además un D de aplastamiento.'],
      [117, 119, 'Tropieza por tener las piernas trabadas, y queda paralizado de cintura para abajo durante 30 minutos. 30 pv.'],
      [120, 999, 'Tráquea aplastada. Muerte inmediata por traumatismo y asfixia.']
    ]
  },
  corrosion: {
    name: 'WCT-12 · Críticos de Corrosión',
    rows: [
      [-49, 5, 'Demasiado débil.'],
      [6, 20, 'Quemadura leve sin consecuencias. 3 PV.'],
      [21, 35, 'El ácido te salpica un poco a la cara, 2PV y un asalto aturdido.'],
      [36, 49, 'El ácido te da de lleno en el brazo secundario y rompe lo que lleves. Si no, 12 pv.'],
      [50, 50, 'El brazo secundario se disuelve parcialmente. Rompe lo que lleves en él, y brazo inservible toda la partida.'],
      [51, 65, 'Salpicón de ácido que hace que te gires, salpicando al PJ más cercano en 4 cuadros con un A de corrosión.'],
      [66, 79, 'El ácido quema parte de la cadera y un equipo al azar. -50 MM toda la partida o hasta descanso largo.'],
      [80, 80, 'El ácido disuelve tus partes pudendas. Despídete de toda acción sexual para siempre... 20 PV.'],
      [81, 86, 'Explosión de ácido que te infringe 10pv y 1d4 críticos B de perforación.'],
      [87, 89, 'Un chorro a presión de ácido entra por el ano y desestabiliza tu sistema intestinal. Durante toda la partida, cada 4 turnos tendrás que perder ese turno haciendo de vientre de malas maneras.'],
      [90, 90, 'El ácido te alcanza la cara, disolviendo toda la piel de nariz y boca. 25 PV y tu PRS (presencia) se reduce a -20 para siempre, salvo para intimidar, donde sumará +20 en su BE. El casco evita todo, pero se rompe.'],
      [91, 96, 'El ácido cae en los brazos. 20 pv y destruido todo lo que lleves equipado en ellos. Además, tus brazos quedarán dañados, con -30 durante toda la partida.'],
      [97, 99, 'El ácido alcanza las piernas. 25 pv y destruida toda la defensa en ellas. El fuerte dolor te infringe un B de desequlibrio. Además, tendrás -30 a cualquier MM atlética durante una hora.'],
      [100, 100, 'El fuerte tóxico penetra hasta el pecho y disuelve en segundos corazón, pulmones y otros órganos. Muerte instantánea que lo deja todo hecho unos zorros.'],
      [101, 106, 'El ácido disuelve el brazo secundario, 25 pv y 2 asaltos inconsciente.'],
      [107, 109, 'Tremendo salpicón que destruye 1d6 de tarjetas de tu inventario. 15 pv.'],
      [110, 110, 'Todo tu inventario se volatiliza por el fuerte ácido. Recibes además un C de calor por la fuerte corrosión. 30 pv y 3 asaltos aturdido. Buena suerte...'],
      [111, 116, 'El ácido llega a las orejas y al oído, dañando los tímpanos. Recibes un C de desequilibrio por el shock, y a partir de ahora tu percepción será nula. Además, tu MM se ve reducida en -30 para siempre.'],
      [117, 119, 'La explosión de ácido alcanza tus dos brazos, que desaparecen como si fueran de arena, junto con todo lo que llevaras en ellos. Aturdido 3 asaltos, y te vas divertir mucho a partir de ahora...'],
      [120, 999, 'Tu cuerpo se convierte, junto a todo tu inventario, en una pulpa gelatinosa en cuestión de segundos. En el charco aún se distinguen los dos ojos, que parecen mirar con cara de no saber qué ha pasado...']
    ]
  }
};

function lookupCritTable(tableKey, roll) {
  const table = CRIT_TABLES[tableKey] || CRIT_TABLES.tajo;
  for (const row of table.rows) {
    if (roll >= row[0] && roll <= row[1]) {
      return { range: `${row[0] > 0 ? row[0] : '≤' + row[1]} - ${row[1]}`, text: row[2], tableTitle: table.name };
    }
  }
  const last = table.rows[table.rows.length - 1];
  return { range: `> ${last[0]}`, text: last[2], tableTitle: table.name };
}

// --- PIFIA TABLES (WFP-1, WFP-2, WFP-4) ---
const PIFIA_TABLES = {
  empunada: {
    name: 'WFP-1 · Pifias de Armas Empuñadas',
    modifiers: [
      { name: 'Arma contundente', mod: -20 },
      { name: 'Arma de filo', mod: -10 },
      { name: 'Arma a 2 manos', mod: 0 },
      { name: 'Arma de asta', mod: 10 },
      { name: 'Montado', mod: 20 }
    ],
    rows: [
      [-49, 5, 'Pierdes el control. No haces nada más este asalto.'],
      [6, 20, 'Resbalas, si tu arma es de una sola mano y no mágica, se rompe.'],
      [21, 35, 'Mala continuación. Pierdes tu oportunidad y 2 pv.'],
      [36, 50, 'Se te cae el arma. 2 asaltos en cogerla o 1 en desenvainar otra.'],
      [51, 65, 'Pierdes el hilo y te das cuenta de que tienes que relajarte. -40 a la actividad durante 2 asaltos.'],
      [66, 79, 'Tropiezas. La falta de estilo te deja aturdido 2 asaltos. Tu arma se rompe. Con suerte sobrevivirás.'],
      [80, 80, 'Movimiento increíblemente inepto. Te haces a tí mismo un crítico B en la tabla correspondiente. Si el oponente está usando un arma de tajo, tu arma se rompe.'],
      [81, 86, 'Con los nervios te muerdes la lengua. Aturdido 2 asaltos.'],
      [87, 89, 'Pierdes el control de tu arma y de la realidad. Aturdido 3 asaltos.'],
      [90, 90, 'Mala maniobra. Rompes tu arma y te automutilas con un crítico C en la tabla correspondiente.'],
      [91, 96, 'Increíble maniobra. Cualquier combatiente de tu bando cercano recibe un crítico B de tajo.'],
      [97, 99, 'Tropiezas con un objeto imaginario. 5 pv y aturdido 3 asaltos.'],
      [100, 100, 'El peor movimiento visto. -60 a la actividad por tirón en la ingle. El enemigo queda 2 asaltos aturdido por un ataque de risa.'],
      [101, 106, 'Te caes en un aparente intento de suicidio. Aturdido 3 asaltos. Tu arma se rompe.'],
      [107, 109, 'Rompes tu arma por inepto. Aturdido 3 asaltos.'],
      [110, 110, 'Tropiezas y clavas la punta de tu arma en el suelo. 3 asaltos aturdido. Si vas montado, saltas 9 m. y crítico C de aplastamiento.'],
      [111, 116, 'Sin saber cómo, el ataque dirigido al rival lo diriges a tí mismo, cortando o aplastando tu mano secundaria. 20 pv.'],
      [117, 119, 'De forma incomprensible, cortas o revientes tu propia mano principal. 25 pv y 3 asaltos aturdido. Buena suerte...'],
      [120, 999, 'Te caes de tu montura, y si no tienes parecerá lo mismo. Te infringes a tí mismo un crítico D de aplastamiento en la tabla correspondiente.']
    ]
  },
  proyectil: {
    name: 'WFP-2 · Pifias de Armas de Proyectil',
    modifiers: [
      { name: 'Arrojadizo', mod: -20 },
      { name: 'Arco corto', mod: -10 },
      { name: 'Arco largo', mod: 0 },
      { name: 'Ballesta', mod: 20 },
      { name: 'Trabuquete', mod: 20 }
    ],
    rows: [
      [-49, 5, 'Pierdes el control. No haces nada más este asalto.'],
      [6, 20, 'Eres tan manazas que no aciertas a recargar. Pierdes este asalto.'],
      [21, 35, 'Pifia con la munición. Pierdes este asalto y -50 a la actividad el siguiente.'],
      [36, 50, 'Se te rompe la munición. -30 a la actividad durante 3 asaltos.'],
      [51, 65, 'Se te cae la munición. Aturdido este asalto y el siguiente intentando decidir si la recuperas.'],
      [66, 79, 'Te haces un lío con el arma, que acaba rota en el suelo. Aturdido 2 asaltos.'],
      [80, 80, 'Falta de criterio. Pierdes 5 pv. Si no usas una ballesta, se te escapa una flecha, te arrancas una oreja y pierdes 2pv/a. Además tu arma se rompe. Espectacular.'],
      [81, 86, 'Se rompe la cuerda de tu arma. Tardarás 2 asaltos en recuperarla.'],
      [87, 89, 'Pifia con la munición al recargar. Esparces tu munición en una superficie de 3m. Tardas 2 asaltos en recuperla.'],
      [90, 90, 'Tu arma se hace añicos. Aturdido 4 asaltos en combate. Que tengas suerte...'],
      [91, 96, 'Maniobra maestra. El proyectil alcanza a tu compañero más cercano infringiéndole un crítico C de perforación.'],
      [97, 99, 'Usas el arma como batuta. Se te resbala y al intentar recogerla va a parar a un metro y medio delante de ti. Inviertes un asalto en recogerla.'],
      [100, 100, 'Se te resbala la munición a disparar. El proyectil te atraviesa la mano que queda inservible. -30 a la actividad.'],
      [101, 106, 'Resbalas y caes al suelo, rompiendo tu arma. Aturdido 3 asaltos.'],
      [107, 109, 'El proyectil te corta en 2 el ojo al disparar. 5 pv y PRE reducida a la mitad para siempre. Suerte.'],
      [110, 110, 'La punta del arma se engancha en el objeto más próximo y se rompe. Si es aplicable, el objeto recibe un crítico A de perforación.'],
      [111, 116, 'Se dispara el seguro al alzar tu arma, haciéndote a tí mismo un C de perforación.'],
      [117, 119, 'Mientras sueñas despierto, pones la mano delante del pivote al disparar. Tendones desgarrados y mano principal inservible. Gran jugada.'],
      [120, 999, 'Resbalas y te clavas un pie al suelo con un pivote. 10 pv y 2 asaltos sin poder moverte del sitio. Tu arma se rompe al liberarte.']
    ]
  },
  maniobra: {
    name: 'WFP-4 · Fallos de Maniobras de Movimiento y Ataques sin Armas',
    modifiers: [
      { name: 'Rutinaria', mod: -50 },
      { name: 'Muy fácil', mod: -35 },
      { name: 'Fácil', mod: -20 },
      { name: 'Dificultad media', mod: -10 },
      { name: 'Difícil', mod: 0 },
      { name: 'Muy difícil', mod: 5 },
      { name: 'Extrem. difícil', mod: 10 },
      { name: 'Locura completa', mod: 15 },
      { name: 'Absurdo', mod: 20 }
    ],
    rows: [
      [-49, 5, 'Dudas y no aciertas a actuar.'],
      [6, 20, 'Tienes segundas intenciones y decides esperar un asalto.'],
      [21, 35, 'Resbalas. -20 a la actividad durante 2 asaltos.'],
      [36, 50, 'Tropiezas. -30 a la actividad durante 2 asaltos.'],
      [51, 65, 'Tropiezas con tu dedo gordo. 3pv y -10 a la actividad durante 3 asaltos.'],
      [66, 79, 'Resbalas. 75 % de probabilidad de caer y recibir 10 pv. Aturdido 2 asaltos.'],
      [80, 80, 'Te rompes el tobillo por varias partes. 5pv y -10 MM perenne.'],
      [81, 86, 'Te caes. 3pv y -20 a la actividad hasta recibir tratamiento. Aturdido 3 asaltos.'],
      [87, 89, 'Te tuerces el tobillo, desgarrándote algunos tendones. 7 pv y -20 a la actividad hasta recibir cura. Aturdido 1 asalto.'],
      [90, 90, 'Te rompes la pierna al caer. 8 pv. -20 a la MM por secuelas físicas. Aturdido 3 asaltos.'],
      [91, 96, 'Te rompes la muñeca al caer. 12 pv y -20 a la actividad hasta ser curado. Aturdido 2 asaltos.'],
      [97, 99, 'Tu brazo principal se rompe al caer sobre él con todo tu peso. 14 pv y -30 a cualquier actividad de forma permanente.'],
      [100, 100, 'En un intento de frenar tu caída, te rompes ambos brazos. 30 pv. Aturdido 3 asaltos y -60 a la actividad hasta recibir cura.'],
      [101, 106, 'Al caer, tu pierna se tuerce y se rompe. 15 pv y -50 a la actividad hasta recibir cura. Aturdido 3 asaltos.'],
      [107, 109, 'Tu rodilla choca al caer y se hace añicos. 10 pv y -80 a la actividad hasta ser curado. Aturdido 3 asaltos.'],
      [110, 110, 'Caes y la conmoción te provoca una semana de coma. Aplicar curación los 2 primeros asaltos supone una MM difícil.'],
      [111, 116, 'Caes y aterrizas sobre la parte baja de la espina dorsal. Paralizado de cintura para abajo. 30 pv.'],
      [117, 119, 'Caes y quedas paralizado de cuello para abajo. 20 pv.'],
      [120, 999, 'Tu caída se convierte en un picado. Te abres el cráneo y mueres.']
    ]
  }
};

// --- FALLOS ELOCUENCIA (WBE2) E INTIMIDACIÓN (WBI2) ---
const SOCIAL_FAIL_TABLES = {
  elocuencia: {
    name: 'WBE2 · Tabla de Fallos en Elocuencia',
    rows: [
      [10, 39, 'Balbuceas y tu acción no surte efecto.'],
      [40, 59, 'Sea lo que sea lo que intentabas, ha superado tu coeficiente mental. Tu BE se reduce un nivel si lo vuelves a intentar.'],
      [60, 60, 'Lamentable discurso. No podrás volver a usar BE con este objetivo esta partida.'],
      [61, 79, 'Te muerdes la lengua mientras hablas. Pierdes 1d10 pv y tu BE se reduce un nivel si lo vuelves a intentar.'],
      [80, 80, 'Tu discurso se convierte en un chiste. No solo no tienes éxito, sino que tus compañeros obtienen -20 a la actividad durante 15 minutos por la vergüenza tras tu bochornosa actuación.'],
      [81, 99, 'Tu cerebro se funde. Tu BE baja 2 niveles durante esta partida y no podrás volver a usar BE con este objetivo esta partida.'],
      [100, 100, 'Varias neuronas se sueltan... No podrás usar tu BE durante esta partida, y durante 10 minutos ni siquiera podrás hablar.']
    ]
  },
  intimidacion: {
    name: 'WBI2 · Tabla de Fallos en Intimidación',
    rows: [
      [10, 39, 'Balbuceas y tu acción no surte efecto.'],
      [40, 59, 'Sea lo que sea lo que intentabas, has conseguido lo opuesto. La BI del objetivo sube un nivel para todo el mundo.'],
      [60, 60, 'Lamentable discurso. No podrás volver a usar BI con este objetivo esta partida.'],
      [61, 79, 'Te muerdes la lengua mientras hablas. Pierdes 1d10 pv y tu BI se reduce un nivel si lo vuelves a intentar.'],
      [80, 80, 'Tu discurso se convierte en un chiste. No solo no tienes éxito, sino que tus compañeros obtienen -20 a la actividad durante 15 minutos por la vergüenza tras tu bochornosa actuación.'],
      [81, 99, 'Te acabas asustando a tí mismo... Tu BI baja 2 niveles esta partida y no podrás intimidar al objetivo esta partida.'],
      [100, 100, 'Varias neuronas se sueltan... No podrás usar tu BI durante esta partida, y durante 10 minutos ni siquiera podrás hablar.']
    ]
  }
};

// --- COFRE ALEATORIO DATA (WCA) ---
const COFRE_DATA = {
  general: [
    { roll: '0', result: 'Arma legendaria al azar' },
    { roll: '9', result: 'Espada o cuero a elegir' },
    { roll: '1-2', result: '1d4+1 pociones v20' },
    { roll: '3-4-5', result: 'Arma (tira en subtabla de armas)' },
    { roll: '6-7-8', result: 'Defensa (tira en subtabla de defensas)' }
  ],
  armas: [
    { roll: '1-4', result: 'Espada' },
    { roll: '5-6-7', result: 'Arco' },
    { roll: '8-9-10', result: 'Bastón' }
  ],
  defensas: [
    { roll: '1-2', result: 'Escudo' },
    { roll: '3-4', result: 'Casco' },
    { roll: '5-6', result: 'Armadura (tira en subtabla de armaduras)' },
    { roll: '7-8', result: 'Grebas' },
    { roll: '9-0', result: 'Brazales' }
  ],
  armaduras: [
    { roll: '1-2-3', result: 'Cuero' },
    { roll: '4-5-6', result: 'Cuero endurecido' },
    { roll: '7-8', result: 'Cota de malla' },
    { roll: '9-0', result: 'Coraza' }
  ]
};

// Exportar todo para uso global
window.DTP = { TABLE_META, CRIT_TABLES, PIFIA_TABLES, SOCIAL_FAIL_TABLES, COFRE_DATA, lookupCritTable, getAttackResult };


