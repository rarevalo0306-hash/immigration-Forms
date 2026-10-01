# Camino — formularios de inmigración, una pregunta a la vez

Camino ayuda a inmigrantes a llenar los formularios de USCIS en español (o inglés), paso a paso, sin jerga legal. Por ahora tiene cuatro:

| Formulario | Edición | Qué es |
| --- | --- | --- |
| **I-765** | 08/21/25 | Solicitud de permiso de trabajo (EAD) |
| **I-130** | 04/01/24 | Petición para un familiar (la presenta el ciudadano o residente) |
| **I-130A** | 04/01/24 | Información del cónyuge beneficiario (acompaña al I-130 del cónyuge) |
| **N-400** | 01/20/25 | Solicitud de ciudadanía (naturalización) |

## Qué hace

- Una pregunta por pantalla, con una explicación de por qué se pide y la referencia en inglés al campo del formulario oficial (por ejemplo, "Part 2 · Item 16 · Date of Birth"). Las preguntas largas de Sí/No del N-400 (Parte 9) se agrupan por tema.
- Muestra solo las preguntas que aplican: sigue las respuestas de Sí/No, la categoría de elegibilidad y la base de la solicitud. Las tablas (direcciones, trabajos, viajes, hijos, delitos) se llenan fila por fila preguntando "¿hay otra?".
- En el N-400, pide una explicación para cada respuesta que el formulario manda explicar y la escribe en la Parte 14.
- Valida y normaliza fechas (MM/DD/AAAA), A-Number, Seguro Social, código postal, teléfono, estado, recibos, I-94, SEVIS y el largo de cada campo del PDF.
- Guarda el progreso solo en el dispositivo (`localStorage`); nada se envía a ningún servidor.
- Termina con el **PDF oficial ya lleno**, generado en el navegador con [pdf-lib](https://pdf-lib.js.org), y una hoja de respuestas imprimible.

Camino **no es asesoría legal** y no envía nada a USCIS: la persona revisa el PDF, lo firma a mano y lo presenta. Lo que se llena a mano: las partes del intérprete y de quien prepara el formulario, y lo que no cabe en el PDF (más filas o explicaciones, en la Parte 14 del N-400).

## El PDF oficial

`public/forms/*.pdf` son los formularios de USCIS sin el cifrado con el que se publican (los formularios del gobierno de EE.UU. son de dominio público). `src/pdf/<formulario>Pdf.ts` pasa cada respuesta a su campo, y `npm test` llena los PDF reales y comprueba los valores.

En el N-400, los nombres internos de los campos no siguen el orden impreso, así que cada campo se ubicó por su posición en la página, y las casillas se eligen por su valor ("Y", "N", "APT"…), no por su índice.

Cuando USCIS publique una edición nueva:

1. Descargue el PDF de uscis.gov (por ejemplo [uscis.gov/n-400](https://www.uscis.gov/n-400)).
2. `pip install pypdf cryptography && python scripts/prepare-uscis-pdf.py ruta/al/n-400.pdf public/forms/n-400.pdf`
3. Actualice la edición en `src/forms/<formulario>.ts`, revise los nombres de campo en `src/pdf/<formulario>Pdf.ts` y corra `npm test`.

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
| `src/forms/` | El contenido de cada formulario (`i765.ts`, `i130.ts`, `i130a.ts`, `n400.ts`): secciones, preguntas en ES/EN, referencias al formulario y condiciones; `helpers.ts` con piezas comunes |
| `src/engine/` | Qué preguntas se muestran, validación y normalización (con pruebas) |
| `src/pdf/` | Llenado de cada PDF oficial (con pruebas sobre los PDF reales) |
| `src/screens/` | Inicio, bienvenida, preguntas y revisión |
| `public/forms/` | Los PDF oficiales listos para llenar |
| `scripts/` | Preparación de una nueva edición de un PDF |

Para agregar otro formulario (I-485, I-864…), cree un `FormDefinition` como `src/forms/n400.ts`, su llenado en `src/pdf/`, y agréguelo a `src/forms/index.ts`.
