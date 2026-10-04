/** The study section's screens and their hashes (#estudiar/<view>). Kept apart so App doesn't load the section. */
export type StudyView = '' | 'ajustes' | 'tarjetas' | 'entrevista' | 'preguntas' | 'ingles';

const VIEWS: StudyView[] = ['', 'ajustes', 'tarjetas', 'entrevista', 'preguntas', 'ingles'];

export const studyView = (path: string): StudyView => {
  const v = path.replace(/^estudiar\/?/, '') as StudyView;
  return VIEWS.includes(v) ? v : '';
};
