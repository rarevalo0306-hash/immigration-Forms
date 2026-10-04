# Camino en el App Store: paso a paso

El código de la app para iPhone ya está listo en `ios/` (hecho con Capacitor, con el mismo código del sitio web). Lo que falta lo hace usted, porque pide su nombre, su pago o una Mac.

## 1. Cuenta de desarrollador de Apple (una vez)

1. Entre a **developer.apple.com/programs/enroll** con su Apple ID (de preferencia uno con verificación en dos pasos). Lo más fácil es desde la app **Apple Developer** en un iPhone.
2. Elija cómo inscribirse:
   - **Como persona:** su nombre aparece en la tienda como vendedor.
   - **Como organización (LLC o sin fines de lucro):** aparece el nombre de la organización. Necesita un número **D-U-N-S** gratis (dnb.com; tarda unos días) y un sitio web de la organización.
   - **Recomendación:** si puede, hágalo como organización. Apple pide que las apps que manejan datos delicados (A-Number, Seguro Social) las publique una entidad, no una persona (regla 5.1.1 de Apple). Camino no recoge esos datos, porque se quedan en el teléfono, pero una cuenta de organización evita que el revisor lo cuestione.
3. Pague **$99 al año**. La aprobación tarda de 1 a 2 días (más si es organización).

## 2. Registrar la app (una vez)

1. En **developer.apple.com → Certificates, IDs & Profiles → Identifiers**, cree un **App ID** con el Bundle ID `com.caminoformularios.app`.
   - Si prefiere otro (por ejemplo, con su dominio), dígamelo y lo cambio en `capacitor.config.ts` y en el proyecto.
2. En **appstoreconnect.apple.com → Apps → +**, cree la app:
   - plataforma iOS;
   - nombre **Camino: Formularios** (si está ocupado, pruebe "Camino: Inmigración");
   - idioma principal español (México);
   - el Bundle ID de arriba;
   - SKU `camino-ios-1`.
3. Llene la ficha con los textos de `store/apple/ficha-app-store.md` y suba las capturas de `store/apple/screenshots/`.

## 3. Compilar la app y subirla (cada versión)

Elija una de las dos opciones.

### Opción A: con una Mac

1. Instale **Xcode** (gratis, en la App Store de la Mac) y **Node.js 22** (nodejs.org).
2. En la Terminal:
   ```bash
   git clone https://github.com/rarevalo0306-hash/immigration-Forms.git
   cd immigration-Forms
   npm ci
   npm run ios        # construye el sitio y lo copia al proyecto de iPhone
   npm run ios:open   # abre el proyecto en Xcode
   ```
3. En Xcode, en el proyecto **App** → pestaña **Signing & Capabilities**: marque "Automatically manage signing" y elija su equipo (Team).
4. Para probar: conecte su iPhone y presione ▶. Revise:
   - que un formulario se llene;
   - que "Descargar formulario lleno" abra el menú para compartir;
   - que el audio de la sección de estudio funcione.
5. Para subir: menú **Product → Archive**. Cuando termine, **Distribute App → App Store Connect → Upload**.

### Opción B: sin Mac (en la nube, con Codemagic)

1. Cree una cuenta en **codemagic.io** con su cuenta de GitHub. El plan gratis da 500 minutos de Mac al mes, y cada compilación tarda unos 15.
2. Agregue el repositorio `immigration-Forms`. Codemagic encuentra el archivo `codemagic.yaml` que ya está en el proyecto.
3. En **App Store Connect → Usuarios y acceso → Integraciones → Claves de API de App Store Connect**:
   - cree una clave con el rol **App Manager**;
   - descargue el archivo `.p8` (solo se puede bajar una vez) y anote el Issuer ID y el Key ID.
4. En Codemagic, **Teams → Integrations → Developer Portal**: agregue la clave con el nombre **Camino ASC** (exactamente así, como dice `codemagic.yaml`).
5. Inicie el flujo **"iOS: TestFlight"**. Codemagic:
   - corre las pruebas;
   - construye la app;
   - crea los certificados con la clave;
   - sube la app a TestFlight.

## 4. Probar con TestFlight y enviar a revisión

1. En App Store Connect → **TestFlight**, agréguese como probador y pruebe la app con la app **TestFlight** del iPhone. Puede invitar a familiares y amigos por correo.
2. Cuando esté conforme, en la versión 1.0 elija esa compilación y presione **Enviar para revisión**.
3. Apple revisa en 1 a 3 días, normalmente. Si rechaza algo, el mensaje explica por qué. Mándemelo y lo corregimos.

## Actualizaciones

Cada cambio del sitio (una edición nueva de un formulario, un funcionario nuevo en el examen de ciudadanía) llega a la web sola, pero a la app de iPhone solo con una versión nueva:

1. suba el número de versión en Xcode (o en `MARKETING_VERSION` del proyecto);
2. compile y suba la versión (paso 3);
3. envíela a revisión.

## Lo que ya está hecho en el código

- El proyecto de iPhone (`ios/`), solo para iPhone, en español e inglés.
- El icono (logo B) y la pantalla de arranque.
- Al descargar un PDF o la copia de respaldo, se abre el menú para compartir del iPhone (guardar en Archivos, imprimir, WhatsApp, correo).
- La app funciona sin internet, con todos los formularios adentro (pesa unos 50 MB).
- Se ajusta a la muesca y a la barra de abajo del iPhone.
- El archivo de privacidad de Apple (`PrivacyInfo.xcprivacy`) declara que no recoge datos ni rastrea.
- La página de privacidad: https://camino-formularios.vercel.app/privacidad.html
