import type { DocItem } from './types';
import { birthCert, fee, marriageCert, priorMarriagesEnded, translations } from './common';
import { is, num } from '../helpers';
import { sij, vawa, widow } from '../i360';

// From the I-360 instructions: the evidence listed under "Widow or Widower of a U.S. Citizen",
// "Special Immigrant Juvenile" and "VAWA Self-Petitioning Spouse or Child ... or Parent".
export const formId = 'i-360';

const vawaSpouse = is('classification', 'I');

export const docs: DocItem[] = [
  {
    ...fee,
    detail: {
      es: 'Solo los viudos(as) pagan tarifa. Confirme el monto y la forma de pago en uscis.gov/g-1055.',
      en: 'Only widow(er)s pay a fee. Confirm the amount and how to pay at uscis.gov/g-1055.',
    },
    when: widow,
  },

  // Widow(er)
  { ...marriageCert, label: { es: 'Copia de su acta de matrimonio con su esposo(a) ciudadano(a)', en: 'Copy of your marriage certificate to your U.S. citizen spouse' }, when: widow },
  {
    id: 'deathCert',
    label: { es: 'Copia del acta de defunción de su esposo(a)', en: 'Copy of your spouse’s death certificate' },
    when: widow,
  },
  {
    id: 'spouseCitizenship',
    label: { es: 'Prueba de que su esposo(a) era ciudadano(a)', en: 'Proof your spouse was a U.S. citizen' },
    detail: {
      es: 'Su acta de nacimiento de EE.UU., certificado de naturalización o de ciudadanía, FS-240, o un pasaporte de EE.UU. vigente cuando falleció.',
      en: 'Their U.S. birth certificate, naturalization or citizenship certificate, FS-240, or a U.S. passport valid at the time of death.',
    },
    when: widow,
  },
  {
    ...priorMarriagesEnded,
    detail: {
      es: 'De usted o de su esposo(a): sentencia de divorcio, acta de defunción o anulación.',
      en: 'Yours or your spouse’s: divorce decree, death certificate or annulment.',
    },
    when: (a) =>
      (widow(a) && (num(a, 'timesMarried') !== 1 || num(a, 'deceased.timesMarried') > 1)) ||
      (vawaSpouse(a) && (num(a, 'vawa.timesMarried') > 1 || num(a, 'abuser.timesMarried') > 1)),
  },

  // VAWA
  {
    id: 'abuserStatus',
    label: { es: 'Prueba del estatus de la persona que le maltrató', en: 'Proof of your abuser’s status' },
    detail: {
      es: 'De que es ciudadano(a) o residente: por ejemplo, copia de su acta de nacimiento, certificado de naturalización, pasaporte o tarjeta de residente. Envíe lo que tenga; si no lo consigue, dé su A-Number o los datos que sepa.',
      en: 'That they are a citizen or resident: for example, a copy of their birth certificate, naturalization certificate, passport or green card. Send what you have; if you can’t get it, give their A-Number or what you know.',
    },
    when: vawa,
  },
  {
    id: 'vawaRelationship',
    label: { es: 'Prueba del parentesco con esa persona', en: 'Proof of your relationship to that person' },
    detail: {
      es: 'Acta de matrimonio, sentencia de divorcio o actas de nacimiento, según el caso.',
      en: 'Marriage certificate, divorce decree or birth certificates, depending on the relationship.',
    },
    when: vawa,
  },
  {
    id: 'livedTogether',
    label: { es: 'Pruebas de que vivieron juntos', en: 'Evidence that you lived together' },
    detail: {
      es: 'Uno o más: contrato de renta o hipoteca, recibos de servicios, registros escolares o médicos, seguros, actas de nacimiento de los hijos o declaraciones juradas.',
      en: 'One or more: lease or mortgage, utility bills, school or medical records, insurance, children’s birth certificates or sworn statements.',
    },
    when: vawa,
  },
  {
    id: 'abuseEvidence',
    label: { es: 'Pruebas del abuso', en: 'Evidence of the abuse' },
    detail: {
      es: 'Lo que tenga: reportes de policía, órdenes de protección, cartas de médicos, consejeros, refugios, la iglesia o la escuela, fotos o su propia declaración. Puede enviar cualquier prueba creíble.',
      en: 'Whatever you have: police reports, protection orders, letters from doctors, counselors, shelters, clergy or school, photos, or your own statement. You may send any credible evidence.',
    },
    when: vawa,
  },
  {
    id: 'goodMoralCharacter',
    label: { es: 'Su declaración de buen carácter moral y cartas de antecedentes', en: 'Your good moral character statement and police clearances' },
    detail: {
      es: 'Si tiene 14 años o más: su declaración firmada y una constancia de la policía o del estado de cada lugar donde vivió 6 meses o más en los últimos 3 años.',
      en: 'If you are 14 or older: your signed statement and a police or state clearance from each place you lived 6 months or more in the last 3 years.',
    },
    when: vawa,
  },
  {
    id: 'goodFaithMarriage',
    label: { es: 'Pruebas de que se casó de buena fe', en: 'Evidence that you married in good faith' },
    detail: {
      es: 'Por ejemplo, seguros, renta, impuestos o cuentas de banco a nombre de los dos, fotos, o declaraciones de quienes conocieron su noviazgo y su boda.',
      en: 'For example, insurance, leases, taxes or bank accounts in both names, photos, or statements from people who knew your courtship and wedding.',
    },
    when: vawaSpouse,
  },

  // SIJ
  {
    ...birthCert,
    label: { es: 'Copia de su acta de nacimiento o prueba de su edad', en: 'Copy of your birth certificate or proof of your age' },
    when: sij,
  },
  {
    id: 'courtOrder',
    label: { es: 'Copia de la orden de la corte juvenil', en: 'Copy of the juvenile court order' },
    detail: {
      es: 'Con las determinaciones requeridas (dependencia o custodia, que no puede reunirse con su padre o madre, y que no le conviene regresar a su país) y los hechos en que se basan.',
      en: 'With the required findings (dependency or custody, that reunification with a parent is not viable, and that returning to your country is not in your best interest) and the facts behind them.',
    },
    when: sij,
  },
  {
    id: 'hhsConsent',
    label: { es: 'Consentimiento por escrito de HHS', en: 'Written consent from HHS' },
    detail: {
      es: 'Si está bajo custodia de HHS (la Oficina de Reasentamiento de Refugiados) y la orden cambió esa custodia o su lugar de vivienda.',
      en: 'If you are in HHS (Office of Refugee Resettlement) custody and the order changed that custody or placement.',
    },
    when: (a) => sij(a) && a.hhs === 'yes' && a.hhsAltered !== 'no',
  },
  translations,
];
