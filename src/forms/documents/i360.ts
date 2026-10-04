import type { DocItem } from './types';
import { birthCert, fee, i94Copy, marriageCert, photos, priorMarriagesEnded, translations } from './common';
import { is, num } from '../helpers';
import { afghanEmployee, amerasian, armedForces, intlOrg, iraqiEmployee, panama, physician, religious, sij, translator, vawa, widow } from '../i360';
import type { Answers } from '../types';

// From the I-360 instructions: the evidence listed under "Who May File Form I-360?" for each
// classification the form covers (Amerasian, widow(er), Special Immigrant Juvenile, religious
// worker, Panama Canal, physician, G-4/NATO-6, armed forces, VAWA, Afghan or Iraqi translator,
// Iraqi and Afghan U.S. Government employees).
export const formId = 'i-360';

const vawaSpouse = is('classification', 'I');
const married = is('marital', 'M');
const siv = (a: Answers) => translator(a) || iraqiEmployee(a) || afghanEmployee(a);
const affiliated = (a: Answers) => religious(a) && a['rw.q7'] === 'yes' && a['rw.taxBasis'] === 'C';

export const docs: DocItem[] = [
  {
    ...fee,
    detail: {
      es: 'No pagan los amerasiáticos, VAWA, SIJ ni los traductores y empleados afganos o iraquíes; las demás categorías sí. Confirme el monto y la forma de pago en uscis.gov/g-1055.',
      en: 'Amerasians, VAWA, SIJ and Afghan or Iraqi translators and employees pay no fee; the other classifications do. Confirm the amount and how to pay at uscis.gov/g-1055.',
    },
    when: (a) => widow(a) || religious(a) || panama(a) || physician(a) || intlOrg(a) || armedForces(a),
  },

  // Amerasian
  {
    id: 'amerasianBirth',
    label: { es: 'Prueba de dónde y cuándo nació el/la amerasiático(a)', en: 'Evidence of where and when the Amerasian was born' },
    detail: {
      es: 'Que nació en Corea, Vietnam, Laos, Kampuchea o Tailandia entre el 1 de enero de 1951 y el 21 de octubre de 1982. Si nació en Vietnam, también su cédula de identidad vietnamita o una declaración de por qué no la tiene.',
      en: 'That they were born in Korea, Vietnam, Laos, Kampuchea or Thailand between January 1, 1951 and October 21, 1982. If born in Vietnam, also the Vietnamese identification card or a statement of why it is not available.',
    },
    when: amerasian,
  },
  {
    id: 'parentage',
    label: { es: 'Pruebas de quién es el padre y de que era ciudadano estadounidense', en: 'Evidence of parentage and that the father was a U.S. citizen' },
    detail: {
      es: 'Por ejemplo, actas de nacimiento o de bautizo, registros civiles, cartas o pruebas de dinero que mandó el padre, fotos del padre (mejor con el/la niño(a)) o, si no hay más, declaraciones de testigos que conozcan los hechos. Si puede, una declaración notariada del padre.',
      en: 'For example, birth or baptismal records, civil records, letters or evidence of financial support from the father, photos of the father (especially with the child) or, absent other documents, affidavits from knowledgeable witnesses. If possible, a notarized statement from the father.',
    },
    when: amerasian,
  },
  { ...photos(1), when: amerasian },
  {
    id: 'i361',
    label: { es: 'Formulario I-361 firmado por el patrocinador, con sus pruebas económicas', en: 'Form I-361 signed by the sponsor, with the financial evidence it asks for' },
    detail: {
      es: 'Puede enviarlo después, cuando USCIS lo pida, pero el trámite tardará más.',
      en: 'You may send it later, when USCIS asks for it, but processing will take longer.',
    },
    when: amerasian,
  },
  {
    id: 'sponsorStatus',
    label: { es: 'Prueba de que el patrocinador tiene 21 años o más y es ciudadano o residente', en: 'Proof that the sponsor is 21 or older and a U.S. citizen or permanent resident' },
    when: amerasian,
  },

  // Widow(er), and a married Amerasian
  {
    ...marriageCert,
    label: { es: 'Copia del acta de matrimonio', en: 'Copy of the marriage certificate' },
    detail: {
      es: 'Viudo(a): la de su matrimonio con su esposo(a) ciudadano(a). Amerasiático(a) casado(a): la de su matrimonio actual, y prueba de que terminó cada matrimonio anterior.',
      en: 'Widow(er): your marriage to your U.S. citizen spouse. Married Amerasian: the current marriage, and proof that each prior marriage ended.',
    },
    when: (a) => widow(a) || (amerasian(a) && married(a)),
  },
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

  // SIJ and armed forces
  {
    ...birthCert,
    label: { es: 'Copia de su acta de nacimiento o prueba de su edad', en: 'Copy of your birth certificate or proof of your age' },
    detail: {
      es: 'SIJ: el acta de nacimiento u otra prueba de la edad. Fuerzas Armadas: el acta de nacimiento.',
      en: 'SIJ: the birth certificate or other evidence of age. Armed forces: the birth certificate.',
    },
    when: (a) => sij(a) || armedForces(a),
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

  // Religious worker
  {
    id: 'irsLetter',
    label: { es: 'Carta vigente del IRS de que la organización está exenta de impuestos', en: 'Current IRS determination letter that the organization is tax exempt' },
    detail: {
      es: 'Si la exención es de grupo, la carta del IRS para el grupo.',
      en: 'For a group exemption, the IRS letter for the group.',
    },
    when: religious,
  },
  {
    id: 'religiousPurpose',
    label: { es: 'Documentos de la naturaleza y el propósito religioso de la organización', en: 'Documentation of the organization’s religious nature and purpose' },
    detail: {
      es: 'Por ejemplo, el acta constitutiva, y material de la organización (libros, artículos, folletos, calendarios) sobre sus actividades religiosas. La certificación de la denominación va firmada en la Parte 9.',
      en: 'For example, the organizing instrument, and organizational literature (books, articles, brochures, calendars) about its religious activities. The denomination certification is signed in Part 9.',
    },
    when: affiliated,
  },
  {
    id: 'compensation',
    label: { es: 'Pruebas verificables de cómo le pagará el empleador', en: 'Verifiable evidence of how the employer will compensate you' },
    detail: {
      es: 'Sueldo o pago en especie (vivienda, comida): por ejemplo, presupuestos, registros de pagos pasados, declaraciones de impuestos o W-2.',
      en: 'Salaried or non-salaried (housing, food): for example, budgets, past pay records, tax returns or W-2s.',
    },
    when: religious,
  },
  {
    id: 'membership',
    label: { es: 'Prueba de que es miembro de la denominación hace por lo menos 2 años', en: 'Evidence of at least 2 years of membership in the denomination' },
    when: religious,
  },
  {
    id: 'religiousWork',
    label: { es: 'Prueba de que trabajó 2 años seguidos en ese tipo de puesto', en: 'Evidence of 2 years of continuous work in that kind of position' },
    detail: {
      es: 'Después de cumplir 14 años, en EE.UU. o afuera, justo antes de presentar.',
      en: 'After turning 14, in the U.S. or abroad, immediately before filing.',
    },
    when: religious,
  },
  {
    id: 'religiousQualified',
    label: { es: 'Prueba de que está calificado(a) para el puesto', en: 'Evidence that you are qualified for the position' },
    detail: { es: 'Por ejemplo, títulos, ordenación o certificados.', en: 'For example, degrees, ordination or certificates.' },
    when: religious,
  },
  {
    id: 'priorRStays',
    label: { es: 'Copias de los I-94 o I-797 de sus estadías con visa R', en: 'Copies of the I-94s or I-797s for your stays in R status' },
    detail: { es: 'Y las de sus familiares, de los últimos 5 años.', en: 'And your family members’, for the last 5 years.' },
    when: (a) => religious(a) && a['rw.priorR'] === 'yes',
  },

  // Panama Canal
  {
    id: 'canalLetter',
    label: { es: 'Carta del empleador en la Zona del Canal', en: 'Letter from the employer in the Canal Zone' },
    detail: {
      es: 'De la Compañía del Canal de Panamá, del Gobierno de la Zona del Canal o de la agencia de EE.UU., con el tiempo y las condiciones del empleo y del retiro o la terminación.',
      en: 'From the Panama Canal Company, the Canal Zone Government or the U.S. agency, with the length and circumstances of the employment and any retirement or termination.',
    },
    when: panama,
  },
  {
    id: 'dangerEvidence',
    label: { es: 'Pruebas del peligro para la seguridad personal', en: 'Evidence of the danger to personal safety' },
    when: (a) => panama(a) && a['panama.basis'] === 'danger',
  },

  // Physician
  {
    id: 'physicianLetters',
    label: { es: 'Cartas de los empleadores desde el 8 de enero de 1978', en: 'Letters from employers since January 8, 1978' },
    detail: { es: 'Con el detalle de cada empleo, incluido el actual.', en: 'Detailing each employment, including the current one.' },
    when: physician,
  },
  {
    id: 'physicianCriteria',
    label: { es: 'Documentos que prueban cada requisito', en: 'Documents proving each requirement' },
    detail: {
      es: 'Por ejemplo, el título de medicina, la licencia de EE.UU. vigente el 9 de enero de 1978, la entrada como H o J y la presencia continua.',
      en: 'For example, the medical degree, the U.S. license in effect on January 9, 1978, the H or J entry and continuous presence.',
    },
    when: physician,
  },

  // G-4 / NATO-6
  {
    id: 'orgLetter',
    label: { es: 'Carta de la organización internacional o de la OTAN', en: 'Letter from the international organization or NATO' },
    detail: {
      es: 'Que muestre que es una organización que califica y explique el empleo y el estatus migratorio de la persona.',
      en: 'Showing that it is a qualifying organization and explaining the employment and the person’s immigration status.',
    },
    when: intlOrg,
  },
  {
    id: 'familyRelationship',
    label: { es: 'Prueba del parentesco con el/la empleado(a)', en: 'Evidence of the family relationship to the employee' },
    detail: { es: 'Acta de matrimonio o de nacimiento.', en: 'Marriage or birth certificate.' },
    when: (a) => intlOrg(a) && is('g4.role', 'g4Family', 'natoFamily')(a),
  },

  // Armed forces
  {
    id: 'serviceCertification',
    label: { es: 'Certificación de su servicio activo honorable', en: 'Certification of your honorable active duty service' },
    detail: {
      es: 'Emitida por el funcionario autorizado del departamento donde sirve o sirvió, con el servicio o el compromiso requerido.',
      en: 'Issued by the authorizing official of the department where you serve or served, showing the required service or commitment.',
    },
    when: armedForces,
  },

  // Afghan or Iraqi translators and U.S. Government employees
  {
    id: 'nationalityProof',
    label: { es: 'Prueba de que es ciudadano(a) de Afganistán o Irak', en: 'Proof that you are a national of Afghanistan or Iraq' },
    detail: { es: 'Pasaporte, acta de nacimiento o cédula nacional, con traducción certificada.', en: 'Passport, birth certificate or national ID card, with a certified translation.' },
    when: siv,
  },
  {
    id: 'recommendation',
    label: { es: 'La recomendación favorable por escrito', en: 'The favorable written recommendation' },
    detail: {
      es: 'Traductor(a): del Jefe de Misión o de un general u oficial de bandera de la unidad que apoyó. Empleado(a): de su supervisor principal (o de quien ocupa ese puesto o uno más alto), que confirme por lo menos 1 año de empleo.',
      en: 'Translator: from the Chief of Mission or a general or flag officer in the chain of command of the unit you supported. Employee: from your senior supervisor (or the person now in that position or a more senior one), confirming at least 1 year of employment.',
    },
    when: siv,
  },
  {
    id: 'translatorWork',
    label: { es: 'Prueba de que trabajó como traductor(a) o intérprete por lo menos 12 meses', en: 'Evidence that you worked as a translator or interpreter for at least 12 months' },
    detail: { es: 'Directamente con las Fuerzas Armadas de EE.UU. o bajo el Jefe de Misión.', en: 'Directly with the U.S. Armed Forces or under Chief of Mission authority.' },
    when: translator,
  },
  {
    id: 'backgroundCheck',
    label: { es: 'Prueba de que pasó la verificación de antecedentes', en: 'Evidence that you cleared the background check' },
    detail: { es: 'Según lo determinó el Jefe de Misión o el general u oficial de bandera.', en: 'As determined by the Chief of Mission or the general or flag officer.' },
    when: translator,
  },
  {
    id: 'comApproval',
    label: { es: 'Copia de la aprobación del Jefe de Misión', en: 'Copy of the Chief of Mission approval' },
    when: afghanEmployee,
  },
  {
    id: 'riskAssessment',
    label: { es: 'Prueba de la evaluación de riesgo del Jefe de Misión', en: 'Proof of the Chief of Mission’s risk assessment' },
    when: (a) => iraqiEmployee(a) || afghanEmployee(a),
  },
  {
    id: 'independentReview',
    label: { es: 'Prueba de la revisión independiente de los registros de su empleo', en: 'Proof of the independent review of your employment records' },
    detail: {
      es: 'Hecha por el Jefe de Misión, para confirmar su empleo y su servicio fiel y valioso.',
      en: 'Done by the Chief of Mission, confirming your employment and faithful and valuable service.',
    },
    when: (a) => iraqiEmployee(a) || afghanEmployee(a),
  },
  {
    ...i94Copy,
    detail: { es: 'Si está en EE.UU. Si es de papel, frente y reverso. Se descarga gratis en i94.cbp.dhs.gov.', en: 'If you are in the U.S. If it is on paper, front and back. Download it free at i94.cbp.dhs.gov.' },
    when: (a) => (iraqiEmployee(a) || afghanEmployee(a)) && a.inUS === 'yes',
  },
  translations,
];
