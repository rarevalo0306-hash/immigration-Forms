# Camino — formularios de inmigración, una pregunta a la vez

Camino ayuda a inmigrantes a llenar los formularios de USCIS en español (o inglés), paso a paso, sin jerga legal. El primer formulario es el **I-765, Solicitud de permiso de trabajo (EAD)**.

## Qué hace

- Una pregunta por pantalla, con una explicación de por qué se pide y la referencia en inglés al campo del formulario oficial (por ejemplo, "Part 2 · Date of Birth").
- Muestra solo las preguntas que aplican: sigue las respuestas de Sí/No y la categoría de elegibilidad ((c)(8), (c)(9), (c)(3)(C), (c)(26)…).
- Valida y normaliza fechas (MM/DD/AAAA), A-Number, Seguro Social, código postal, teléfono, estado, número de recibo e I-94.
- Guarda el progreso solo en el dispositivo (`localStorage`); nada se envía a ningún servidor.
- Termina en una hoja de respuestas imprimible, ordenada por las partes del formulario, con los siguientes pasos.

Camino **no es asesoría legal** y todavía no llena ni envía el PDF oficial: la persona copia sus respuestas a la edición vigente de [uscis.gov/i-765](https://www.uscis.gov/i-765).

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
| `src/screens/` | Bienvenida, pregunta y revisión |

Para agregar otro formulario (N-400, I-130…), cree un `FormDefinition` como `src/forms/i765.ts`.
