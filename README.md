# Camino — formularios de inmigración, una pregunta a la vez

Camino ayuda a inmigrantes a llenar los formularios de USCIS en español (o inglés), paso a paso, sin jerga legal. Está publicado en **https://camino-formularios.vercel.app**. Por ahora tiene cuarenta y dos (cuarenta y uno de USCIS y uno de la corte de inmigración):

| Formulario | Edición | Qué es |
| --- | --- | --- |
| **I-765** | 08/21/25 | Solicitud de permiso de trabajo (EAD) |
| **I-765WS** | 08/21/25 | Hoja de ingresos y gastos que acompaña al I-765 en DACA y otras categorías |
| **I-821D** | 01/20/25 | DACA: renovación o solicitud inicial (va con el I-765) |
| **I-821** | 01/20/25 | TPS: solicitud inicial o nuevo registro (va con el I-765) |
| **I-130** | 04/01/24 | Petición para un familiar (la presenta el ciudadano o residente) |
| **I-130A** | 04/01/24 | Información del cónyuge beneficiario (acompaña al I-130 del cónyuge) |
| **I-129F** | 01/20/25 | Petición para prometido/a (visa K-1) o cónyuge (K-3) |
| **I-485** | 09/18/26 | Solicitud de residencia permanente desde EE.UU. (ajuste de estatus) |
| **I-485 Supl. A** | 09/18/26 | Ajuste de estatus bajo la sección 245(i) (va con el I-485) |
| **I-131** | 01/20/25 | Permiso de viaje (advance parole, reingreso, refugiado, TPS) y parole: desde fuera de EE.UU., parole in place y re-parole |
| **I-131A** | 01/20/25 | Documento para volver si perdió la tarjeta de residente estando fuera del país |
| **I-864** | 08/24/26 | Declaración de patrocinio económico (la presenta el patrocinador) |
| **I-864EZ** | 08/24/26 | Versión corta del I-864 (peticionario que patrocina a una sola persona con ingresos de W-2) |
| **I-864A** | 08/24/26 | Contrato entre el patrocinador y un familiar del hogar que suma sus ingresos |
| **I-865** | 11/10/20 | Cambio de dirección del patrocinador (I-864) |
| **I-751** | 04/01/24 | Quitar las condiciones de la residencia (tarjeta de 2 años por matrimonio) |
| **I-90** | 01/20/25 | Renovación o reemplazo de la tarjeta de residente (green card) |
| **AR-11** | 11/02/22 | Cambio de dirección (obligatorio dentro de 10 días) |
| **EOIR-33/IC** | feb. 2026 | Cambio de dirección ante la corte de inmigración (justice.gov) |
| **I-912** | 07/22/25 | Exención de tarifa (beneficios públicos, ingresos bajos o dificultad económica) |
| **I-134** | 01/20/25 | Declaración de apoyo económico (permisos humanitarios y algunas visas) |
| **I-589** | 07/28/26 | Solicitud de asilo y de suspensión de deportación |
| **I-730** | 01/20/25 | Pedir a su cónyuge o hijos si usted tiene asilo o es refugiado |
| **I-601A** | 01/20/25 | Perdón provisional por presencia ilegal (antes de la entrevista consular) |
| **I-601** | 01/20/25 | Perdón por causas de inadmisibilidad |
| **I-212** | 01/20/25 | Permiso para volver a pedir entrada después de una deportación |
| **I-918** | 01/20/25 | Visa U para víctimas de delitos |
| **I-918 Supl. A** | 01/20/25 | Visa U para un familiar de la víctima |
| **I-914** | 01/20/25 | Visa T para víctimas de trata de personas |
| **I-914 Supl. A** | 01/20/25 | Visa T para un familiar de la víctima |
| **I-360** | 01/20/25 | Viudos de ciudadanos, VAWA, jóvenes (SIJ), trabajadores religiosos, amerasiáticos, traductores y empleados afganos o iraquíes, y otros inmigrantes especiales |
| **I-290B** | 05/31/24 | Apelación o moción contra una decisión de USCIS |
| **I-539** | 08/28/24 | Extender o cambiar una visa de no inmigrante (turista, estudiante, etc.) |
| **I-539A** | 08/28/24 | Información de cada familiar incluido en el I-539 |
| **I-102** | 04/01/24 | Reemplazar el I-94 perdido, dañado o con errores |
| **I-824** | 04/01/24 | Otra copia de una aprobación, o enviarla al consulado (incluye seguir al familiar) |
| **I-407** | 09/25/24 | Renunciar a la residencia permanente |
| **G-1145** | 09/26/14 | Aviso por correo o texto cuando USCIS acepta su solicitud |
| **N-400** | 01/20/25 | Solicitud de ciudadanía (naturalización) |
| **N-336** | 04/01/24 | Pedir audiencia si le negaron la ciudadanía |
| **N-600** | 01/20/25 | Certificado de ciudadanía para hijos de ciudadanos |
| **N-565** | 02/27/25 | Reemplazo del certificado de naturalización o ciudadanía |

## Qué hace

- Una pregunta por pantalla, con una explicación de por qué se pide y la referencia en inglés al campo del formulario oficial (por ejemplo, "Part 2 · Item 16 · Date of Birth"). Las preguntas largas de Sí/No del N-400 (Parte 9) se agrupan por tema.
- Muestra solo las preguntas que aplican: sigue las respuestas de Sí/No, la categoría de elegibilidad y la base de la solicitud. Las tablas (direcciones, trabajos, viajes, hijos, delitos) se llenan fila por fila preguntando "¿hay otra?".
- En el N-400, el I-485 y el I-821, pide una explicación para cada respuesta que el formulario manda explicar y la escribe en la parte de información adicional (Parte 14, o Parte 11 en el I-821).
- Valida y normaliza fechas (MM/DD/AAAA), A-Number, Seguro Social, código postal, teléfono, estado, recibos, I-94, SEVIS y el largo de cada campo del PDF.
- En el I-864 suma solo el tamaño del hogar, el ingreso del hogar y el total de bienes.
- Avisa cuando una respuesta escrita con las propias palabras de la persona (explicaciones, declaraciones) parece estar en español, porque USCIS pide el formulario en inglés: en la pregunta y en la revisión, sin impedir seguir (`src/engine/language.ts`).
- **Documentos para juntar**: cada formulario tiene su lista, tomada de la sección de pruebas de sus instrucciones oficiales (`src/forms/documents/`), y muestra solo lo que aplica según las respuestas (por ejemplo, la prueba de que terminó un matrimonio anterior solo si lo hubo). Aparece en la revisión con casillas para marcar, que se guardan y salen en la hoja impresa; cada paquete junta las listas de sus formularios y dice qué formulario pide cada documento.
- **Dónde y cómo enviarlo**: la revisión enlaza la página oficial de cada formulario en uscis.gov (sección "Where to File", con la dirección según la categoría), la calculadora de tarifas si el formulario tiene tarifa, y la lista oficial de formularios que se pueden presentar en línea (`src/forms/filing.ts`). No se copian direcciones ni montos porque cambian seguido.
- Guarda el progreso solo en el dispositivo (`localStorage`); nada se envía a ningún servidor.
- **Funciona sin conexión y se instala como app** (`public/sw.js`, `public/manifest.webmanifest`): después de la primera visita, la app y los formularios abiertos funcionan sin internet, y el navegador ofrece "Agregar a la pantalla de inicio". Cada formulario se carga solo al abrirlo (`src/forms/load.ts`), así la primera carga es liviana.
- **Accesible**: cada pregunta es el título principal de la pantalla y recibe el foco al aparecer (los lectores de pantalla la anuncian), el texto crece con el tamaño de letra del teléfono o navegador sin salirse de la pantalla, y las pantallas pasan la revisión automática de axe-core.
- Varios casos en el mismo dispositivo ("¿Para quién es?" en la pantalla de inicio): cada caso, por ejemplo cada familiar, guarda sus propias respuestas, y "Usar mis datos" y los paquetes solo miran el caso activo. El primer caso usa las claves de siempre, así que el progreso guardado antes sigue ahí. Cada formulario muestra en qué caso se está trabajando.
- En la pantalla de inicio, "Sus datos en este dispositivo" permite descargar una copia de respaldo del caso activo (un archivo JSON con las respuestas de todos sus formularios), cargarla en otro dispositivo y borrar todos los datos del dispositivo, por ejemplo en un dispositivo prestado (`src/engine/backup.ts`, `src/screens/MyData.tsx`).
- **Paquetes** (`src/forms/packages.ts`): los formularios de un trámite completo, en orden y diciendo quién llena cada uno: matrimonio con ciudadano/a dentro de EE.UU. (I-130, I-130A, I-485, I-864 y, si aplica, I-864A, I-765, I-131 y G-1145), matrimonio por el consulado, prometido/a K-1, renovación de DACA, TPS, asilo, ciudadanía y "Me mudé" (AR-11 y, si tiene caso en corte, EOIR-33). Cada paquete marca qué formularios están listos, abre cada uno con lo que el paquete ya sabe (por ejemplo, el I-130 para un esposo/a o la categoría (c)(9) del I-765) y, al terminar uno, lleva al siguiente.
- Reutiliza los datos entre formularios: al abrir un formulario nuevo ofrece "Usar mis datos" con lo que la persona ya contestó en otros (nombre, A-Number, fecha y lugar de nacimiento, teléfono, correo, direcciones, datos biográficos). Cada formulario dice quién es quién (`src/engine/profile.ts`): el beneficiario del I-130 es quien llena el I-485 y el inmigrante principal del I-864; el peticionario del I-130 es el patrocinador del I-864. Solo pasa valores que el formulario acepta, y siempre se pueden cambiar.
- Termina con el **PDF oficial ya lleno**, generado en el navegador con [pdf-lib](https://pdf-lib.js.org), y una hoja de respuestas imprimible.

Camino **no es asesoría legal** y no envía nada a USCIS: la persona revisa el PDF, lo firma a mano y lo presenta. Las partes del intérprete y de quien prepara el formulario se llenan con sus datos (y se reutilizan en el siguiente formulario); se llenan a mano todas las firmas y fechas, y lo que no cabe en el PDF (más filas o explicaciones, en la Parte 14 del N-400).

## El PDF oficial

`public/forms/*.pdf` son los formularios de USCIS sin el cifrado con el que se publican (los formularios del gobierno de EE.UU. son de dominio público). `src/pdf/<formulario>Pdf.ts` pasa cada respuesta a su campo, y `npm test` llena los PDF reales y comprueba los valores.

En el I-131, varios campos comparten nombre en distintas páginas (cada casilla del tipo de solicitud se llama `CB_AppType[n]`), así que el llenado escribe en todos los campos con el mismo nombre y elige las casillas por su valor. En el I-129F, casi todas las casillas Apt./Ste./Flr. exportan el valor de otra, así que se eligen por su posición; `src/pdf/units.test.ts` revisa ese orden en todos los PDF.

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

Cada push y cada pull request corren en GitHub Actions el chequeo de tipos, las pruebas y el build (`.github/workflows/ci.yml`).

Cada lunes, el flujo "Ediciones USCIS" (`.github/workflows/editions.yml`) compara la edición de cada formulario con la que muestra su página en uscis.gov (`npm run check-editions`) y, si alguna cambió, abre un issue con la etiqueta `ediciones-uscis` que dice cuáles y cómo actualizarlas. También se puede correr a mano desde la pestaña Actions.

## Publicación

El sitio está en Vercel (proyecto `camino-formularios`, conectado a este repositorio). Cada push a `main` publica la versión nueva en https://camino-formularios.vercel.app; los pushes a otras ramas crean una vista previa privada. Es un sitio estático: no hay servidor ni base de datos, y las respuestas nunca salen del navegador de la persona.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `src/design/` | Tokens y componentes del sistema de diseño Camino (Button, TextField, ChoiceGroup, ProgressSteps, QuestionCard, Notice, LanguageToggle, FormBadge) |
| `src/forms/` | El contenido de cada formulario (`i765.ts`, `i765ws.ts`, `i821d.ts`, `i821.ts` con `i821Part7.ts`, `i130.ts`, `i130a.ts`, `i129f.ts`, `i485.ts` con `i485Part9.ts`, `i485supa.ts`, `i131.ts`, `i131a.ts`, `i864.ts`, `i864ez.ts`, `i864a.ts`, `i865.ts`, `i751.ts`, `i90.ts`, `ar11.ts`, `eoir33.ts` con `eoir33Courts.ts`, `i912.ts`, `i134.ts`, `i589.ts`, `i730.ts`, `i601a.ts`, `i601.ts`, `i212.ts`, `i918.ts`, `i918supa.ts`, `i914.ts`, `i914supa.ts`, `i360.ts`, `i290b.ts`, `i539.ts` con `i539Status.ts`, `i539a.ts`, `i102.ts`, `i824.ts`, `i407.ts`, `g1145.ts`, `n400.ts`, `n336.ts`, `n600.ts`, `n565.ts`): secciones, preguntas en ES/EN, referencias al formulario y condiciones; `helpers.ts` y `assistance.ts` (intérprete y preparador) con piezas comunes; `catalog.ts` con lo que la pantalla de inicio necesita sin cargar los formularios (`npm run gen-catalog` lo regenera) |
| `src/engine/` | Qué preguntas se muestran, validación y normalización (con pruebas) |
| `src/pdf/` | Llenado de cada PDF oficial (con pruebas sobre los PDF reales) |
| `src/screens/` | Inicio, bienvenida, preguntas y revisión |
| `public/forms/` | Los PDF oficiales listos para llenar |
| `scripts/` | Preparación de una nueva edición de un PDF, revisión de ediciones y generación del catálogo |

Para agregar otro formulario (por ejemplo, otro de USCIS), cree un `FormDefinition` como `src/forms/n400.ts`, su llenado en `src/pdf/`, agréguelo a `src/forms/index.ts` y corra `npm run gen-catalog`.
