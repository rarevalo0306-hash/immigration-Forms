import type { DocItem } from './types';
import { fee, translations } from './common';

// From the N-336 instructions: Part 4 (reasons, with documents or briefs), "Attorney or Accredited
// Representative" and "Processing Information" (fee or I-912).
export const formId = 'n-336';

export const docs: DocItem[] = [
  {
    ...fee,
    detail: {
      es: 'Confirme el monto en uscis.gov/g-1055. Si presentó el N-400 por servicio militar, no se paga. Si no puede pagar, adjunte el Formulario I-912.',
      en: 'Confirm the amount at uscis.gov/g-1055. If you filed your N-400 based on military service, there is no fee. If you can’t pay, attach Form I-912.',
    },
    when: (a) => a['n400.military'] !== 'yes',
  },
  {
    id: 'denialNotice',
    label: { es: 'Copia de la carta de negación de su N-400', en: 'Copy of your N-400 denial notice' },
  },
  {
    id: 'hearingEvidence',
    label: { es: 'Las pruebas o el escrito (brief) que apoyan su pedido (si los tiene)', en: 'Evidence or a brief supporting your request (if you have them)' },
    detail: {
      es: 'Documentos que respondan a las razones de la negación. Si no los tiene listos, puede llevarlos a la audiencia.',
      en: 'Documents that answer the reasons for the denial. If they aren’t ready, you can bring them to the hearing.',
    },
  },
  {
    id: 'g28',
    label: { es: 'Formulario G-28 (si tiene abogado o representante)', en: 'Form G-28 (if you have an attorney or representative)' },
    detail: { es: 'Lo llena y firma su abogado o representante acreditado.', en: 'Your attorney or accredited representative completes and signs it.' },
  },
  translations,
];
