import type { DocItem } from './types';
import { fee, translations } from './common';
import { is } from '../helpers';

// From the I-290B instructions: "What Evidence Must You Submit?" and Part 3, "Basis for the Appeal or Motion".
export const formId = 'i-290b';

const isMotion = is('filingType', 'reopen', 'reconsider', 'both');

export const docs: DocItem[] = [
  fee,
  {
    id: 'decisionCopy',
    label: { es: 'Copia de la carta de decisión', en: 'Copy of the decision notice' },
    detail: {
      es: 'La decisión que quiere apelar o que revisen.',
      en: 'The decision you want appealed or reviewed.',
    },
  },
  {
    id: 'brief',
    label: { es: 'Su escrito (brief) y las pruebas adicionales', en: 'Your brief and additional evidence' },
    detail: {
      es: 'Si los envía ahora con la apelación. Si los enviará después, mándelos directo a la AAO dentro de 30 días.',
      en: 'If you are sending them now with the appeal. If later, send them directly to the AAO within 30 days.',
    },
    when: (a) => a.filingType === 'appeal' && a.appealBrief !== 'C' && a.appealBrief !== 'B',
  },
  {
    id: 'newFactsEvidence',
    label: { es: 'Documentos que prueban los hechos nuevos', en: 'Documents proving the new facts' },
    detail: {
      es: 'Deben mostrar que usted ya calificaba cuando presentó la solicitud. Se envían junto con este formulario.',
      en: 'They must show you were eligible when you filed the application. Send them together with this form.',
    },
    when: is('filingType', 'reopen', 'both'),
  },
  {
    id: 'reconsiderBrief',
    label: { es: 'Su escrito con las leyes o decisiones que se aplicaron mal', en: 'Your brief citing the law or decisions that were misapplied' },
    detail: {
      es: 'Con las decisiones precedentes que apoyan su argumento, si las hay. Se envía junto con este formulario.',
      en: 'With any precedent decisions that support your argument. Send it together with this form.',
    },
    when: is('filingType', 'reconsider', 'both'),
  },
  {
    id: 'judicialStatement',
    label: { es: 'Declaración sobre casos en la corte federal', en: 'Statement about any federal court case' },
    detail: {
      es: 'Diga si la decisión está o estuvo en un juicio y, si es así, la corte, de qué trata, la fecha y en qué va o terminó.',
      en: 'Say whether the decision is or was the subject of a court case and, if so, the court, what it is about, the date and its status or result.',
    },
    when: isMotion,
  },
  translations,
];
