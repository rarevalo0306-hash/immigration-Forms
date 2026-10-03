import type { DocItem } from './types';
import { translations } from './common';
import { is, num } from '../helpers';

// From the I-864A instructions (edition 08/24/26): Specific Instructions for Parts 2, 3 and 4.
export const formId = 'i-864a';

export const docs: DocItem[] = [
  {
    id: 'memberTaxReturn',
    label: { es: 'La declaración federal de impuestos más reciente del familiar', en: 'The household member’s most recent federal tax return' },
    detail: {
      es: 'Una transcripción del IRS (gratis en irs.gov/individuals/get-transcript) o una copia con todos sus W-2, 1099 y anexos. Puede agregar los 3 últimos años si ayuda.',
      en: 'An IRS transcript (free at irs.gov/individuals/get-transcript) or a copy with all its W-2s, 1099s and schedules. The last 3 years may be added if it helps.',
    },
  },
  {
    id: 'selfEmployedSchedules',
    label: { es: 'Los anexos de su negocio (Schedule C, D, E o F)', en: 'Business schedules (Schedule C, D, E or F)' },
    detail: { es: 'Todos los anexos del formulario 1040 que presentó con su declaración.', en: 'Every Form 1040 schedule filed with the return.' },
    when: is('employment', 'self'),
  },
  {
    id: 'noTaxExplanation',
    label: { es: 'Explicación de por qué no presentó impuestos', en: 'Explanation of why taxes weren’t filed' },
    detail: {
      es: 'Escrita y firmada. Si no tenía que declarar por otra razón que ingresos bajos, agregue pruebas. Si tenía que declarar, presente primero las declaraciones atrasadas y envíe su copia o transcripción.',
      en: 'Typed or printed. If filing wasn’t required for a reason other than low income, add proof. If it was required, file the late returns first and send their copy or transcript.',
    },
    when: is('filedTaxes', 'no'),
  },
  {
    id: 'incomeContinues',
    label: { es: 'Prueba de que su ingreso seguirá después de inmigrar', en: 'Proof that your income will continue after immigrating' },
    detail: { es: 'Que seguirá recibiendo ese ingreso de una fuente legal, por ejemplo una carta de su empleador.', en: 'That you will keep receiving that income from a lawful source, for example a letter from your employer.' },
    when: (a) => is('relationship', 'A', 'B')(a) || !a.relationship,
  },
  {
    id: 'sameResidence',
    label: { es: 'Prueba de que vive con el patrocinador', en: 'Proof that you live with the sponsor' },
    detail: { es: 'Por ejemplo, un contrato de renta, recibos de servicios o correspondencia a nombre suyo en la misma dirección.', en: 'For example, a lease, utility bills or mail in your name at the same address.' },
    when: (a) => is('relationship', 'B')(a) || (is('relationship', 'C')(a) && !is('relative', '1', '5')(a)) || !a.relationship,
  },
  {
    id: 'relationshipProof',
    label: { es: 'Prueba de su parentesco con el patrocinador', en: 'Proof of your relationship to the sponsor' },
    detail: { es: 'Por ejemplo, actas de nacimiento que muestren que son padre e hijo o hermanos.', en: 'For example, birth certificates showing you are parent and child or siblings.' },
    when: (a) => is('relationship', 'C')(a) && !is('relative', '1', '5')(a),
  },
  {
    id: 'incomeProof',
    label: { es: 'Prueba de sus ingresos de este año (opcional)', en: 'Proof of this year’s income (optional)' },
    detail: {
      es: 'Por ejemplo, una carta reciente del empleador con su sueldo anual, o talones de pago de los últimos 6 meses.',
      en: 'For example, a recent employer letter with your annual salary, or pay stubs from the last 6 months.',
    },
  },
  {
    id: 'assetsProof',
    label: { es: 'Pruebas de los bienes que suma', en: 'Proof of the assets you add' },
    detail: {
      es: 'Para cada uno: qué es, prueba de que es suyo y de su valor (por ejemplo, estados de cuenta), y lo que debe sobre él.',
      en: 'For each one: what it is, proof that you own it and of its value (for example, account statements), and any debts against it.',
    },
    when: is('useAssets', 'yes'),
  },
  {
    id: 'homeValue',
    label: { es: 'Pruebas del valor de su casa', en: 'Proof of your home’s value' },
    detail: {
      es: 'Prueba de que es dueño, un avalúo reciente de un tasador con licencia, y el saldo de cada hipoteca o préstamo sobre la casa.',
      en: 'Proof that you own it, a recent appraisal by a licensed appraiser, and the balance of every mortgage or loan on it.',
    },
    when: (a) => is('useAssets', 'yes')(a) && num(a, 'assets.realEstate') > 0,
  },
  translations,
];
