import type { DocItem } from './types';
import { fee, translations } from './common';
import { is } from '../helpers';

// From the Supplement A instructions: "What Evidence Must You Submit to Establish Your Eligibility for
// Adjustment of Status under INA Section 245(i)?" and "Filing Fee"; the I-485 receipt tip is from
// uscis.gov/i-485supa ("Form Filing Tips").
export const formId = 'i-485supa';

const derivative = is('basis245i', 'C', 'D');
const familyNow = is('basis245i', 'E');

export const docs: DocItem[] = [
  {
    ...fee,
    detail: {
      es: 'El Suplemento A tiene su propia tarifa, aparte de la del I-485. Confirme el monto actual y la forma de pago en uscis.gov/g-1055.',
      en: 'Supplement A has its own fee, separate from the I-485 fee. Confirm the current amount and how to pay at uscis.gov/g-1055.',
    },
  },
  {
    id: 'qualifyingPetition',
    label: { es: 'Prueba de la petición o certificación laboral que le da derecho a la 245(i)', en: 'Proof of the petition or labor certification that qualifies you for 245(i)' },
    detail: {
      es: 'El aviso I-797 de recibo o aprobación con el nombre del/de la beneficiario/a principal, o el ETA-750 con el sello de fecha de la agencia estatal (o la certificación del Departamento de Trabajo). Debe mostrar que se presentó el 30 de abril de 2001 o antes. Si no fue aprobada, envíe lo que tenga que muestre que se podía aprobar cuando se presentó.',
      en: 'The I-797 receipt or approval notice with the principal beneficiary’s name, or the ETA-750 with the state agency’s date stamp (or the Department of Labor certification). It must show it was filed on or before April 30, 2001. If it was not approved, send what you have showing it was approvable when filed.',
    },
  },
  {
    id: 'relationshipAtFiling',
    label: { es: 'Prueba de su relación con el/la principal cuando se presentó la petición', en: 'Proof of your relationship to the principal when the petition was filed' },
    detail: {
      es: 'Acta de matrimonio (si es cónyuge) o acta de nacimiento (si es hijo/a). Debe mostrar que la relación ya existía en esa fecha; no hace falta probar que sigue hoy.',
      en: 'Marriage certificate (spouse) or birth certificate (child). It must show the relationship existed on that date; you do not need to show it still exists.',
    },
    when: derivative,
  },
  {
    id: 'relationshipNow',
    label: { es: 'Prueba de su relación actual con el/la solicitante principal', en: 'Proof of your current relationship to the principal applicant' },
    detail: {
      es: 'Por ejemplo su acta de matrimonio o su acta de nacimiento.',
      en: 'For example your marriage certificate or birth certificate.',
    },
    when: familyNow,
  },
  {
    id: 'presenceDec2000',
    label: { es: 'Pruebas de que el/la principal estaba en EE.UU. el 21 de diciembre de 2000', en: 'Proof that the principal was in the U.S. on December 21, 2000' },
    detail: {
      es: 'Mejor si son del gobierno: I-94 o visa en el pasaporte, cartas de agencias, licencia de manejar, impuestos. También sirven recibos de renta o servicios, récords escolares, médicos, de trabajo o del banco de esas fechas. Una declaración jurada sola no basta.',
      en: 'Government documents carry the most weight: I-94 or passport visa, agency letters, driver’s license, tax records. Lease or utility receipts, school, medical, employment or bank records from that time also help. A personal affidavit alone is not enough.',
    },
    // Needed for 1.b and 1.d; a 1.e spouse or child may also need it when the principal's petition was filed after January 14, 1998.
    when: is('basis245i', 'B', 'D', 'E'),
  },
  {
    id: 'i485Receipt',
    label: { es: 'Copia del recibo de su I-485 pendiente (I-797)', en: 'Copy of your pending I-485 receipt notice (I-797)' },
    detail: { es: 'Solo si su I-485 ya está presentado y presenta el Suplemento A después.', en: 'Only if your I-485 is already filed and you send Supplement A later.' },
    when: is('supa.timing', 'pending'),
  },
  translations,
];
