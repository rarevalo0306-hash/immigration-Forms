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
  optional: { es: '(opcional)', en: '(optional)' },
  notAnswered: { es: 'Sin respuesta', en: 'Not answered' },
  step: { es: 'Paso {c} de {t}', en: 'Step {c} of {t}' },
  progress: { es: 'Progreso', en: 'Progress' },
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
