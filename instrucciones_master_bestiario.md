# 📋 Instrucciones para el Máster — Bestiario DTP

Esto te explica cómo subir los monstruos al sistema para que aparezcan automáticamente en la app.

---

## 🔧 PASO 1 — Crear el Google Sheet

1. Ve a [sheets.google.com](https://sheets.google.com) e inicia sesión con tu cuenta de Google.
2. Crea una hoja nueva en blanco.
3. En la **fila 1** (cabecera), escribe exactamente estas columnas, **una en cada celda**, en este orden:

```
nombre | imagen | descripcion | movimiento | acciones | bo_min | bd_min | bl_min | bm_min | bdm_min | mm_min | be_min | bi_min | ini_min | pv_min_min | pv_max_min | coste_enemigo_min | coste_jugador_min | efecto_jugador_min | bo_max | bd_max | bl_max | bm_max | bdm_max | mm_max | be_max | bi_max | ini_max | pv_min_max | pv_max_max | coste_enemigo_max | coste_jugador_max | efecto_jugador_max
```

> ⚠️ Importante: Los nombres de columna deben estar **en minúsculas y sin tildes**, exactamente como aparecen arriba.

---

## 🖼️ PASO 2 — Subir las imágenes a Google Drive

Para cada monstruo que quieras meter:

1. Sube la imagen (JPG o PNG) a tu **Google Drive** (en la carpeta que tengas para el bestiario).
2. Haz **clic derecho** sobre la imagen → **Compartir** → cambia a **"Cualquiera con el enlace"** → pulsa **Copiar enlace**.
3. Pega ese enlace en la columna **imagen** del Sheet correspondiente a ese monstruo.

> 💡 El enlace que te da Drive es del tipo:  
> `https://drive.google.com/file/d/1AbCdEfGhIjKl/view?usp=sharing`  
> La app lo convierte sola al formato correcto. No tienes que tocar nada más.

---

## 📝 PASO 3 — Rellenar los datos de cada monstruo

A partir de la **fila 2**, cada fila es un monstruo. Rellena cada columna:

| Columna | Qué poner | Ejemplo |
|---|---|---|
| **nombre** | Nombre del monstruo | `Trasgo` |
| **imagen** | URL de Google Drive | `https://drive.google.com/file/d/...` |
| **descripcion** | Texto descriptivo | `Criatura pequeña y rastrera que ataca por sorpresa` |
| **movimiento** | Velocidad | `7 pasos por turno` |
| **acciones** | Ataques y reglas especiales. Si hay varias, sepáralas con el símbolo `\|` dentro de la misma celda | `Ataque de garras\|Puede envenenar si saca crítico A o superior` |
| **bo_min** | Bonificación Ofensiva en nivel mínimo | `10` |
| **bd_min** | Bonificación Defensiva en nivel mínimo | `15` |
| **bl_min** | Bonificación de Lanzamiento en nivel mínimo | `20` |
| **bm_min** | Bonificación Mágica en nivel mínimo | `0` |
| **bdm_min** | Defensa Mágica en nivel mínimo | `10` |
| **mm_min** | Maniobra y Movimiento en nivel mínimo | `15` |
| **be_min** | Nivel de Elocuencia mínimo | `Normal` |
| **bi_min** | Nivel de Intimidación mínimo | `Intimidante` |
| **ini_min** | Iniciativa en nivel mínimo (normalmente 0) | `0` |
| **pv_min_min** | PV mínimos en nivel mínimo | `15` |
| **pv_max_min** | PV máximos en nivel mínimo | `20` |
| **coste_enemigo_min** | Tirada que necesita el enemigo para su coste de oportunidad | `80` |
| **coste_jugador_min** | Tirada que necesita el jugador para contratacarlo | `30` |
| **efecto_jugador_min** | Daño si el jugador tiene éxito | `1d20 pv` |
| **bo_max** | Bonificación Ofensiva en nivel máximo | `120` |
| *(y el resto de columnas _max igual que las _min pero para el nivel "Demasiado Fuerte")* | | |

> 💡 Si un monstruo no tiene alguna estadística (por ejemplo, una estatua que no se mueve y no tiene BO), **deja la celda vacía**. La app lo mostrará como `—`.

---

## 📤 PASO 4 — Publicar el Sheet como CSV

1. En la barra superior del Sheet: **Archivo → Compartir → Publicar en la web**.
2. Selecciona:
   - Primer desplegable: **"Hoja 1"** (o el nombre de tu hoja).
   - Segundo desplegable: **"Valores separados por comas (.csv)"**.
3. Pulsa **Publicar** y confirma.
4. **Copia la URL** que aparece. Será algo así:  
   `https://docs.google.com/spreadsheets/d/1ABC.../pub?gid=0&single=true&output=csv`

---

## 📲 PASO 5 — Cargar en la App

1. Abre la app → pestaña **🐉 Bestiario**.
2. En el recuadro superior **"Importar Bestiario desde Google Sheets"**, pega la URL del paso anterior.
3. Pulsa **⬇️ Cargar**.
4. ¡Listo! Todos los monstruos aparecerán en el desplegable.

---

## ➕ Si añades más monstruos más adelante

Solo tienes que:
1. Añadir nuevas filas al mismo Sheet con los datos del nuevo monstruo.
2. Volver a la app → **🐉 Bestiario** → pegar la URL → **⬇️ Cargar**.

La app actualizará la lista completa.

---

## 🗑️ Borrar un monstruo

En la ficha de cualquier monstruo aparece el botón **🗑️ Borrar esta Criatura** en la parte inferior. Al pulsarlo se elimina de la lista de la app (sin tocar el Sheet).

---

> 📌 **Niveles de Elocuencia válidos para be_min / be_max:**  
> `Inútil` · `Tonto` · `Normal` · `Listo` · `Muy listo` · `Brillante` · `Excelso`

> 📌 **Niveles de Intimidación válidos para bi_min / bi_max:**  
> `Gallina` · `Asustadizo` · `Normal` · `Intimidante` · `Muy intimidante` · `Terrible` · `Terrorífico`
