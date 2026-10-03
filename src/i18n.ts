export type Lang = 'es' | 'en';

/** A string in every language the app speaks. */
export type T = Record<Lang, string>;

export const ui = {
  appName: { es: 'Camino', en: 'Camino' },
  back: { es: 'Atrás', en: 'Back' },
  next: { es: 'Continuar', en: 'Continue' },
  start: { es: 'Empezar', en: 'Start' },
  resume: { es: 'Continuar donde lo dejé', en: 'Pick up where I left off' },
  startOver: { es: 'Empezar de nuevo', en: 'Start over' },
  confirmStartOver: { es: '¿Borrar todas sus respuestas y empezar de nuevo?', en: 'Erase all your answers and start over?' },
  review: { es: 'Revisar respuestas', en: 'Review answers' },
  edit: { es: 'Editar', en: 'Edit' },
  print: { es: 'Imprimir hoja de respuestas', en: 'Print answer sheet' },
  downloadPdf: { es: 'Descargar formulario lleno (PDF)', en: 'Download filled form (PDF)' },
  preparingPdf: { es: 'Preparando el PDF…', en: 'Preparing the PDF…' },
  pdfError: {
    es: 'No pudimos preparar el PDF. Revise su conexión e intente de nuevo; su hoja de respuestas sigue disponible.',
    en: 'We couldn’t prepare the PDF. Check your connection and try again; your answer sheet is still available.',
  },
  pdfTitle: { es: 'Su formulario oficial, ya lleno', en: 'Your official form, already filled in' },
  pdfBody: {
    es: 'Descargue el formulario de USCIS (edición {edition}) con sus respuestas. Ábralo y revise cada página antes de enviarlo. Firme la {sign} a mano con tinta negra: el formulario no acepta firmas escritas a máquina.',
    en: 'Download the USCIS form (edition {edition}) with your answers. Open it and check every page before you file. Sign {sign} by hand in black ink: the form does not accept typed signatures.',
  },
  optional: { es: '(opcional)', en: '(optional)' },
  notAnswered: { es: 'Sin respuesta', en: 'Not answered' },
  step: { es: 'Paso {c} de {t}', en: 'Step {c} of {t}' },
  progress: { es: 'Progreso', en: 'Progress' },
  packageWord: { es: 'Paquete', en: 'Package' },
  packageProgress: { es: '{done} de {total} listos', en: '{done} of {total} ready' },
  packageTips: { es: 'Antes de enviar', en: 'Before you file' },
  ifApplies: { es: '(si aplica)', en: '(if it applies)' },
  filledBy: { es: 'Lo llena: {who}', en: 'Filled in by: {who}' },
  backToPackage: { es: 'Volver al paquete', en: 'Back to the package' },
  nextInPackage: { es: 'Siguiente del paquete: {form}', en: 'Next in the package: {form}' },
  packageDone: { es: 'Ya llenó todos los formularios necesarios del paquete.', en: 'You filled in every required form in the package.' },
  writeEnglish: { es: 'Escríbalo en inglés.', en: 'Write it in English.' },
  looksSpanishTitle: { es: 'Parece que esto está en español', en: 'This looks like Spanish' },
  looksSpanishBody: {
    es: 'USCIS pide que el formulario se llene en inglés. Si no puede escribirlo en inglés, pida ayuda a alguien que lo traduzca; esa persona debe llenar y firmar a mano la parte del intérprete del formulario. Puede continuar y cambiarlo después.',
    en: 'USCIS asks for the form to be filled in in English. If you can’t write it in English, ask someone to translate it; that person must fill in and sign the interpreter part of the form by hand. You can continue and change it later.',
  },
  englishTitle: { es: 'Lo que escriba, en inglés', en: 'What you write, in English' },
  englishBody: {
    es: 'Casi todo se responde eligiendo opciones o con datos como fechas y direcciones. Lo que escriba con sus propias palabras (explicaciones, declaraciones) debe ir en inglés, porque USCIS pide los formularios en inglés. Sus nombres y los de lugares se escriben tal como son, sin traducirlos.',
    en: 'Most answers are choices or details like dates and addresses. Anything you write in your own words (explanations, statements) must be in English, because USCIS asks for forms in English. Write names of people and places as they are, without translating them.',
  },
  spanishInReviewOne: {
    es: 'Una respuesta parece estar en español. Está marcada abajo: cámbiela al inglés antes de descargar el PDF, o pida a alguien que la traduzca y firme la parte del intérprete.',
    en: 'One answer looks like Spanish. It is marked below: change it to English before downloading the PDF, or ask someone to translate it and sign the interpreter part.',
  },
  spanishInReview: {
    es: '{n} respuestas parecen estar en español. Están marcadas abajo: cámbielas al inglés antes de descargar el PDF, o pida a alguien que las traduzca y firme la parte del intérprete.',
    en: '{n} answers look like Spanish. They are marked below: change them to English before downloading the PDF, or ask someone to translate them and sign the interpreter part.',
  },
  spanishMark: { es: 'Parece estar en español', en: 'Looks like Spanish' },
  myDataTitle: { es: 'Sus datos en este dispositivo', en: 'Your data on this device' },
  myDataBody: {
    es: 'Sus respuestas se guardan solo en este navegador. Si borra el historial o cambia de teléfono, se pierden. Descargue una copia de respaldo para guardarlas o seguir en otro dispositivo.',
    en: 'Your answers are saved only in this browser. If you clear your history or change phones, they are lost. Download a backup copy to keep them or continue on another device.',
  },
  myDataCount: { es: 'Tiene respuestas guardadas en {forms}.', en: 'You have saved answers in {forms}.' },
  myDataNone: { es: 'Todavía no tiene respuestas guardadas.', en: 'You have no saved answers yet.' },
  formsCount: { es: '{n} formularios', en: '{n} forms' },
  formsOne: { es: '1 formulario', en: '1 form' },
  myDataCautionTitle: { es: 'Proteja sus datos', en: 'Protect your data' },
  myDataCaution: {
    es: 'La copia tiene datos personales, como su A-Number o su Seguro Social. Guárdela en un lugar seguro y no la comparta. Si usa un dispositivo prestado o compartido, borre sus datos al terminar.',
    en: 'The copy has personal data, such as your A-Number or Social Security number. Keep it somewhere safe and don’t share it. On a borrowed or shared device, erase your data when you finish.',
  },
  backupDownload: { es: 'Descargar copia de respaldo', en: 'Download backup copy' },
  backupLoad: { es: 'Cargar una copia', en: 'Load a copy' },
  clearAllButton: { es: 'Borrar todos mis datos', en: 'Erase all my data' },
  confirmClearAll: {
    es: '¿Borrar las respuestas de todos los formularios en este dispositivo? No se puede deshacer. Si quiere conservarlas, descargue antes una copia de respaldo.',
    en: 'Erase the answers to every form on this device? This can’t be undone. To keep them, download a backup copy first.',
  },
  confirmImport: {
    es: 'Esta copia trae {forms}. Si ya tiene respuestas en alguno de ellos, se reemplazarán por las de la copia. ¿Continuar?',
    en: 'This copy has {forms}. If you already have answers in any of them, they will be replaced by the copy’s. Continue?',
  },
  importDone: { es: 'Listo: copia cargada ({forms}).', en: 'Done: copy loaded ({forms}).' },
  importSkipped: { es: 'Quedaron sin cargar: {forms} del archivo.', en: 'Not loaded from the file: {forms}.' },
  importBad: { es: 'Ese archivo no es una copia de respaldo de Camino.', en: 'That file is not a Camino backup copy.' },
  importFailed: { es: 'No se pudo guardar la copia en este navegador.', en: 'The copy couldn’t be saved in this browser.' },
  clearDone: { es: 'Se borraron todos sus datos de este dispositivo.', en: 'All your data on this device was erased.' },
  reuseTitle: { es: 'Ya tenemos algunos datos', en: 'We already have some details' },
  reuseBody: {
    es: 'Usted ya nos dio nombres, fechas, direcciones y otros datos en: {forms}. Podemos ponerlos aquí para que no los escriba otra vez. Igual verá cada pregunta y podrá cambiar lo que quiera.',
    en: 'You already gave us names, dates, addresses and other details in: {forms}. We can put them here so you don’t type them again. You’ll still see every question and can change anything.',
  },
  reuseYes: { es: 'Usar mis datos', en: 'Use my details' },
  reuseNo: { es: 'Empezar en blanco', en: 'Start blank' },
  savedTitle: { es: 'Su progreso se guarda solo', en: 'Your progress saves automatically' },
  savedBody: {
    es: 'Las respuestas se guardan solo en este dispositivo. Puede cerrar la app y continuar después.',
    en: 'Answers are saved only on this device. You can close the app and continue later.',
  },
  missingTitle: { es: 'Falta información', en: 'Some information is missing' },
  missingBody: { es: 'Revise los campos marcados antes de continuar.', en: 'Check the marked fields before continuing.' },
  required: { es: 'Esta respuesta es necesaria.', en: 'This answer is required.' },
  pickOne: { es: 'Elija una opción.', en: 'Choose an option.' },
  legalTitle: { es: 'Esto no es asesoría legal', en: 'This is not legal advice' },
  legalBody: {
    es: 'Camino le ayuda a organizar sus respuestas. Si tiene dudas sobre su caso, hable con un abogado de inmigración o un representante acreditado por el Departamento de Justicia (DOJ).',
    en: 'Camino helps you organize your answers. If you have questions about your case, talk to an immigration attorney or a DOJ-accredited representative.',
  },
} satisfies Record<string, T>;

export function fmt(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
