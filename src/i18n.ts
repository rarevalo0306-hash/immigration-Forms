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
  englishTitle: { es: 'Responda en inglés', en: 'Answer in English' },
  englishBody: {
    es: 'USCIS lee el formulario en inglés: escriba nombres, direcciones y lugares con letras latinas, sin traducir sus nombres.',
    en: 'USCIS reads the form in English: write names, addresses and places in Latin letters, without translating your names.',
  },
  legalTitle: { es: 'Esto no es asesoría legal', en: 'This is not legal advice' },
  legalBody: {
    es: 'Camino le ayuda a organizar sus respuestas. Si tiene dudas sobre su caso, hable con un abogado de inmigración o un representante acreditado por el Departamento de Justicia (DOJ).',
    en: 'Camino helps you organize your answers. If you have questions about your case, talk to an immigration attorney or a DOJ-accredited representative.',
  },
} satisfies Record<string, T>;

export function fmt(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
