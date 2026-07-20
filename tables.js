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

// Exportar para uso en app.js
window.DTP = { TABLE_META, getAttackResult };
