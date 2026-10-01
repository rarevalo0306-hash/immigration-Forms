# Camino — formularios de inmigración, una pregunta a la vez

Camino ayuda a inmigrantes a llenar los formularios de USCIS en español (o inglés), paso a paso, sin jerga legal. El primer formulario es el **I-765, Solicitud de permiso de trabajo (EAD)**.

## Qué hace

- Una pregunta por pantalla, con una explicación de por qué se pide y la referencia en inglés al campo del formulario oficial (por ejemplo, "Part 2 · Date of Birth").
- Muestra solo las preguntas que aplican: sigue las respuestas de Sí/No y la categoría de elegibilidad ((c)(8), (c)(9), (c)(3)(C), (c)(26)…).
- Valida y normaliza fechas (MM/DD/AAAA), A-Number, Seguro Social, código postal, teléfono, estado, número de recibo e I-94.
- Guarda el progreso solo en el dispositivo (`localStorage`); nada se envía a ningún servidor.
- Termina con el **PDF oficial del I-765 ya lleno** (edición 08/21/25), generado en el navegador con [pdf-lib](https://pdf-lib.js.org), y una hoja de respuestas imprimible.

Camino **no es asesoría legal** y no envía nada a USCIS: la persona revisa el PDF, lo firma a mano (Parte 3, Ítem 7) y lo presenta. Las Partes 4 y 5 (intérprete y quien prepara el formulario) se llenan a mano.

## El PDF oficial

`public/forms/i-765.pdf` es el formulario de USCIS sin el cifrado con el que se publica (los formularios del gobierno de EE.UU. son de dominio público). `src/pdf/i765Pdf.ts` pasa cada respuesta a su campo, y `npm test` llena el PDF real y comprueba los valores.

Cuando USCIS publique una edición nueva:

1. Descargue el PDF de [uscis.gov/i-765](https://www.uscis.gov/i-765).
2. `pip install pypdf cryptography && python scripts/prepare-i765-pdf.py ruta/al/i-765.pdf`
3. Actualice `I765_EDITION` en `src/forms/i765.ts`, revise los nombres de campo en `src/pdf/i765Pdf.ts` y corra `npm test`.

## Desarrollo

```bash
npm install
npm run dev        # servidor local
npm test           # pruebas (vitest)
npm run typecheck
npm run build
```

## Estructura

| Ruta | Qué es |
| --- | --- |
| `src/design/` | Tokens y componentes del sistema de diseño Camino (Button, TextField, ChoiceGroup, ProgressSteps, QuestionCard, Notice, LanguageToggle, FormBadge) |
| `src/forms/i765.ts` | El contenido del I-765: secciones, preguntas en ES/EN, referencias al formulario y condiciones |
| `src/engine/` | Qué preguntas se muestran, validación y normalización (con pruebas) |
| `src/pdf/` | Llenado del PDF oficial del I-765 (con pruebas sobre el PDF real) |
| `src/screens/` | Bienvenida, pregunta y revisión |
| `public/forms/` | El PDF oficial del I-765 listo para llenar |
| `scripts/` | Preparación de una nueva edición del PDF |

Para agregar otro formulario (N-400, I-130…), cree un `FormDefinition` como `src/forms/i765.ts`.
