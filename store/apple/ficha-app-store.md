# Ficha de Camino en el App Store

Textos listos para copiar en App Store Connect (**Apps → Camino → Información de la app** y **Versión 1.0**).
El idioma principal es **español (México)**; agregue **inglés (EE.UU.)** como segundo idioma con los textos de abajo.
Los límites de caracteres de Apple ya están respetados.

## Datos generales

| Campo | Valor |
| --- | --- |
| Nombre (máx. 30) | Camino: Formularios |
| Bundle ID | `com.caminoformularios.app` (el mismo de `capacitor.config.ts`; si lo cambia, cámbielo en los dos lugares y en Xcode) |
| SKU | camino-ios-1 |
| Categoría principal | Referencia |
| Categoría secundaria | Educación |
| Precio | Gratis |
| Clasificación por edad | 4+ (en el cuestionario conteste "Ninguno" en todo) |
| URL de privacidad | https://camino-formularios.vercel.app/privacidad.html |
| URL de soporte | https://github.com/rarevalo0306-hash/immigration-Forms/issues (mejor: una página o correo suyo de soporte) |
| URL de marketing (opcional) | https://camino-formularios.vercel.app |
| Copyright | 2026 (su nombre o el de su organización) |
| Dispositivos | Solo iPhone (el proyecto ya está configurado así; no hacen falta capturas de iPad) |

## Español

**Subtítulo (máx. 30):** Inmigración, paso a paso

**Texto promocional (máx. 170):**
Llene sus formularios de inmigración en español, una pregunta a la vez, y descargue el formulario oficial ya lleno. Gratis y privado: sus datos no salen de su teléfono.

**Descripción:**

Camino le ayuda a llenar los formularios de inmigración de Estados Unidos en español, sin jerga legal.

UNA PREGUNTA A LA VEZ
Camino le hace cada pregunta en español sencillo, le explica por qué se pide y le muestra solo lo que aplica a su caso. Al final descarga el formulario oficial ya lleno, listo para revisar, imprimir y firmar.

42 FORMULARIOS
Permiso de trabajo (I-765), residencia (I-485), petición familiar (I-130), ciudadanía (N-400), renovación de la green card (I-90), asilo (I-589), DACA (I-821D), TPS (I-821), permisos de viaje (I-131), patrocinio (I-864), perdones (I-601, I-601A), visas U y T, cambio de dirección (AR-11 y corte de inmigración) y muchos más.

TODO EL TRÁMITE EN ORDEN
Paquetes para casos comunes (matrimonio, asilo, ciudadanía, DACA, TPS, "me mudé") le dicen qué formularios necesita, en qué orden y quién llena cada uno. Lo que escribe en un formulario aparece en el siguiente.

QUÉ DOCUMENTOS JUNTAR Y A DÓNDE ENVIAR
Cada formulario trae su lista de documentos, tomada de las instrucciones oficiales, y los enlaces a las páginas oficiales para saber dónde enviarlo y cuánto pagar.

ESTUDIE PARA LA CIUDADANÍA
Las preguntas oficiales de educación cívica (examen 2025 y 2008) con sus respuestas, tarjetas de estudio, un simulacro de la entrevista y práctica del examen de inglés. Le lee las preguntas en voz alta.

PRIVADO Y SIN INTERNET
Sus respuestas se quedan en su teléfono: no hay cuentas, ni servidores, ni publicidad. Funciona sin conexión. Puede tener casos separados para cada familiar y guardar una copia de respaldo.

AVISO IMPORTANTE
Camino no es una agencia del gobierno y no está afiliada a USCIS, al Departamento de Justicia ni a ninguna otra agencia. Usa los formularios y la información pública de USCIS (uscis.gov) y de la Oficina Ejecutiva de Revisión de Casos de Inmigración (justice.gov/eoir). Camino no da asesoría legal: si su caso es complicado, consulte a un abogado de inmigración o a un representante acreditado.

**Palabras clave (máx. 100):**
inmigración,USCIS,formularios,ciudadanía,green card,residencia,N-400,I-765,asilo,DACA,TPS,examen

**Novedades de esta versión:**
Primera versión para iPhone.

## English

**Subtitle:** Immigration forms step by step

**Promotional text:**
Fill in U.S. immigration forms in Spanish or English, one question at a time, and download the official form filled in. Free and private: your data stays on your phone.

**Description:**

Camino helps you fill in U.S. immigration forms in Spanish or English, without legal jargon.

ONE QUESTION AT A TIME
Camino asks each question in plain language, explains why it's asked and shows only what applies to your case. At the end you download the official form already filled in, ready to check, print and sign.

42 FORMS
Work permit (I-765), green card (I-485), family petition (I-130), citizenship (N-400), green card renewal (I-90), asylum (I-589), DACA (I-821D), TPS (I-821), travel documents (I-131), affidavit of support (I-864), waivers (I-601, I-601A), U and T visas, change of address (AR-11 and immigration court) and many more.

THE WHOLE CASE, IN ORDER
Packages for common cases (marriage, asylum, citizenship, DACA, TPS, moving) tell you which forms you need, in what order and who fills each one. What you write in one form shows up in the next.

WHAT TO GATHER AND WHERE TO SEND IT
Each form has its document checklist, taken from the official instructions, and links to the official pages on where to file and how much to pay.

STUDY FOR CITIZENSHIP
The official civics questions (2025 and 2008 tests) with their answers, flash cards, a practice interview and English test practice. Questions are read aloud.

PRIVATE AND OFFLINE
Your answers stay on your phone: no accounts, no servers, no ads. It works offline. Keep separate cases for each family member and save a backup copy.

IMPORTANT NOTICE
Camino is not a government agency and is not affiliated with USCIS, the Department of Justice or any other agency. It uses the public forms and information of USCIS (uscis.gov) and the Executive Office for Immigration Review (justice.gov/eoir). Camino is not legal advice: if your case is complicated, talk to an immigration attorney or accredited representative.

**Keywords:**
immigration,USCIS,forms,citizenship,green card,N-400,I-765,asylum,DACA,TPS,civics test,Spanish

**What's new:** First iPhone release.

## Privacidad de la app (App Store Connect → Privacidad de la app)

- ¿Recoge datos de esta app? **No, no recogemos datos.** (Resultado: "Datos no recopilados".)
- Rastreo: **No**.
- El proyecto incluye `ios/App/App/PrivacyInfo.xcprivacy`, que declara lo mismo.

## Cumplimiento de exportación

La app no usa cifrado propio. `Info.plist` ya tiene `ITSAppUsesNonExemptEncryption = NO`, así que App Store Connect no lo preguntará en cada versión.

## Notas para el revisor de Apple (App Review Information → Notes)

> Camino is a free app that helps Spanish-speaking immigrants fill in official U.S. immigration forms (USCIS and EOIR). It asks one question at a time in plain Spanish or English and fills the official public-domain PDF on the device.
>
> - No account or login is needed. No data is collected: answers are stored only on the device, and the app works offline (all forms are bundled).
> - To try it: tap a form (for example "Solicitud de permiso de trabajo", I-765), answer a few questions, go to the review page and tap "Descargar formulario lleno (PDF)". The iOS share sheet opens to save or share the filled PDF. The "Estudie para el examen de ciudadanía" section has flash cards and a practice interview with audio.
> - The app is not affiliated with any government agency and says so on its home screen and store page. It links to the official sources (uscis.gov, justice.gov/eoir) for every form, and it does not provide legal advice.
> - Language toggle (ES/EN) is at the top right.

Información de contacto para la revisión: su nombre, teléfono y correo (Apple solo los usa si tiene preguntas).

## Capturas de pantalla

En `store/apple/screenshots/`: cinco capturas de iPhone de 6.9" (1320 × 2868), en este orden:

1. `1-inicio.png`: la pantalla de inicio.
2. `2-paquete.png`: el paquete de ciudadanía.
3. `3-pregunta.png`: una pregunta del I-765.
4. `4-revision.png`: la revisión con el botón para descargar el PDF.
5. `5-estudiar.png`: una tarjeta de estudio para la ciudadanía.

Súbalas en "Vista previa y capturas de pantalla" → iPhone 6.9". El icono para la tienda sale del proyecto; también está en `store/apple/icon-1024.png`.
