import type { Lang } from '../../i18n';

/** A card pointing to the study section, for the N-400 review page and the citizenship package. */
export function StudyLink({ lang }: { lang: Lang }) {
  return (
    <a className="cm-card app-form-card app-study-home no-print" href="#estudiar">
      <span className="app-form-title">{lang === 'es' ? 'Mientras espera la entrevista: estudie para el examen' : 'While you wait for the interview: study for the test'}</span>
      <span className="cm-card-why">
        {lang === 'es'
          ? 'Las preguntas oficiales de educación cívica, tarjetas de estudio, un simulacro de la entrevista y práctica del examen de inglés.'
          : 'The official civics questions, flash cards, a practice interview and English test practice.'}
      </span>
    </a>
  );
}
