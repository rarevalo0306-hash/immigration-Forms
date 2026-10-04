import type { Answers, Field, FormDefinition } from './types';
import type { T } from '../i18n';
import { all, anyAddress, date, is, nameFields, rows, sexField, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';

// Questions follow USCIS Form I-360, Petition for Amerasian, Widow(er), or Special Immigrant,
// edition 01/20/25. The PDF mapping lives in src/pdf/i360Pdf.ts.
//
// Scope: every classification a person files for themselves or for a family member. The
// classification is asked first and only its own questions follow:
// - Amerasian (Part 2, Item 1.A; Part 6), for yourself or for someone else,
// - Widow(er) of a U.S. citizen (Item 1.B; Part 7),
// - Special Immigrant Juvenile (Item 1.C; Part 8), for yourself or for someone else,
// - Special immigrant religious worker filing on their own behalf (Item 1.D; Part 9, including the
//   employer's attestation and the religious denomination certification, which they sign by hand),
// - Panama Canal employees (Item 1.E) and physicians (Item 1.F), for yourself or someone else,
// - G-4 international organization or NATO-6 employees and family members (Item 1.G), armed
//   forces members (Item 1.H), Afghan or Iraqi translators (Item 1.L), Iraqi U.S. Government
//   employees (Item 1.M) and Afghan U.S. Government or ISAF employees (Item 1.N): Part 2 only,
// - VAWA self-petitioning spouse, child or parent (Items 1.I, 1.J and 1.K; Part 10).
// Who signs: Part 11 when you file for yourself, Part 12 (Items 1-3 and 5-7) when you file for
// another person; then Part 1, Items 1-6 hold the petitioner and Part 3 the beneficiary.
// The interpreter's Part 13 and the preparer's Part 14 come from the shared assistance section.
// Out of scope, left blank: broadcasters (Item 1.O, filed only by the U.S. Agency for Global Media
// or its grantees) and "other" (Item 1.P); petitions filed by an organization (Part 1, Item 6
// organization name, Part 12, Item 4 signatory title). Also left for hand: every signature and
// date (Parts 9, 11, 12, 13 and 14), the attorney box and USCIS-only areas.

export const I360_EDITION = '01/20/25';

const t = (es: string, en: string): T => ({ es, en });

/** Whether a "select all that apply" answer includes a value. */
const has =
  (id: string, value: string) =>
  (a: Answers): boolean => {
    const v = a[id];
    return Array.isArray(v) && v.includes(value);
  };

const not =
  (test: (a: Answers) => boolean) =>
  (a: Answers): boolean =>
    !test(a);

/** Part 2 classification, by the PDF's export values. */
export const amerasian = is('classification', 'A');
export const widow = is('classification', 'B');
export const sij = is('classification', 'C');
export const religious = is('classification', 'D');
export const panama = is('classification', 'E');
export const physician = is('classification', 'F');
export const intlOrg = is('classification', 'G');
export const armedForces = is('classification', 'H');
export const vawa = is('classification', 'I', 'J', 'K');
export const translator = is('classification', 'L');
export const iraqiEmployee = is('classification', 'M');
export const afghanEmployee = is('classification', 'N');
const vawaSpouse = is('classification', 'I');
const selfPetitioner = (a: Answers) => vawa(a) || sij(a);

/** The classifications covered here, by their Part 2 letters. */
export const CLASSIFICATIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
/** Classifications the instructions let someone file for another person ("for a beneficiary"). */
export const FOR_OTHER = ['A', 'C', 'E', 'F'];
/** Filing for another person: the petitioner fills Part 1 and signs Part 12. */
export const forOther = (a: Answers) => is('classification', ...FOR_OTHER)(a) && a.filer === 'other';
/** Filing for yourself in a classification whose petitioner fills Part 1, Items 1-6 (all but VAWA and SIJ). */
export const ownPart1 = (a: Answers) => is('classification', ...CLASSIFICATIONS)(a) && !selfPetitioner(a) && !forOther(a);
/** Part 9, Item 7: an answer of No to any of Items 7-13 needs an explanation. */
export const RW_ATTEST = ['rw.q7', 'rw.q8', 'rw.q9', 'rw.q10', 'rw.q11', 'rw.q12', 'rw.q13'];
const rwNo = (a: Answers) => RW_ATTEST.some((id) => a[id] === 'no');

const noCovered = t(
  'No cubre locutores (Ítem 1.O: los pide solo la Agencia de EE.UU. para Medios Globales o sus beneficiarios) ni "otra" categoría (Ítem 1.P).',
  'It does not cover broadcasters (Item 1.O: only the U.S. Agency for Global Media or its grantees file for them) or "other" (Item 1.P).',
);

const usAddress = (prefix: string, ref: string): Field[] => [
  { id: `${prefix}.street`, type: 'text', label: { es: 'Número y calle', en: 'Street number and name' }, formRef: `${ref} · Street Number and Name`, maxLength: 34 },
  { id: `${prefix}.unit`, type: 'unit', label: { es: 'Apartamento, suite o piso', en: 'Apartment, suite or floor' }, formRef: `${ref} · Apt. / Ste. / Flr.` },
  { id: `${prefix}.city`, type: 'text', label: { es: 'Ciudad', en: 'City or town' }, formRef: `${ref} · City or Town`, maxLength: 20 },
  { id: `${prefix}.state`, type: 'state', label: { es: 'Estado', en: 'State' }, formRef: `${ref} · State` },
  { id: `${prefix}.zip`, type: 'zip', label: { es: 'Código postal ZIP', en: 'ZIP code' }, formRef: `${ref} · ZIP Code` },
];

const aliveOptions = [
  { value: 'unknown', label: t('No se sabe', 'Unknown') },
  { value: 'yes', label: t('Sí', 'Yes') },
  { value: 'no', label: t('No', 'No') },
];

const HOTLINE = t(
  'Si está en peligro, llame al 911. La Línea Nacional contra la Violencia Doméstica atiende en español, gratis y en confianza, las 24 horas: 1-800-799-7233 (o envíe START al 88788). Ellos también le pueden recomendar abogados u organizaciones que ayudan gratis con casos VAWA.',
  'If you are in danger, call 911. The National Domestic Violence Hotline is free, confidential and open 24/7, in Spanish too: 1-800-799-7233 (or text START to 88788). They can also refer you to free legal help for VAWA cases.',
);

export const i360: FormDefinition = {
  id: 'i-360',
  number: 'I-360',
  edition: I360_EDITION,
  title: t('Petición de amerasiático(a), viudo(a) o inmigrante especial', 'Petition for Amerasian, Widow(er), or Special Immigrant'),
  summary: {
    es: 'Pida la residencia como viudo(a) de un ciudadano, por VAWA, como joven con orden de una corte juvenil (SIJ), trabajador religioso, amerasiático(a), traductor o empleado afgano o iraquí, y otras categorías especiales, para usted o para un familiar.',
    en: 'Petition as the widow(er) of a U.S. citizen, under VAWA, as a young person with a juvenile court order (SIJ), religious worker, Amerasian, Afghan or Iraqi translator or employee, and other special immigrant classifications, for yourself or a family member.',
  },
  intro: {
    es: 'El I-360 sirve para muchos casos. Esta guía cubre los que una persona presenta para sí misma o para un familiar: amerasiático(a), viudo(a) de un ciudadano, Joven Inmigrante Especial (SIJ), trabajador religioso que se pide a sí mismo, empleados del Canal de Panamá, médicos, empleados de organizaciones internacionales G-4 o de la OTAN (NATO-6) y sus familiares, miembros de las Fuerzas Armadas, traductores afganos o iraquíes, empleados afganos o iraquíes del gobierno de EE.UU. y la autopetición VAWA. No cubre locutores ni "otra" categoría. Primero le preguntamos su categoría y luego solo lo que esa categoría necesita. Son casos legales: le recomendamos hablar con un abogado o una organización acreditada antes de presentar.',
    en: 'Form I-360 covers many cases. This guide covers the ones a person files for themselves or for a family member: Amerasian, widow(er) of a U.S. citizen, Special Immigrant Juvenile (SIJ), a religious worker filing on their own behalf, Panama Canal employees, physicians, G-4 international organization or NATO-6 employees and their family members, armed forces members, Afghan or Iraqi translators, Afghan or Iraqi U.S. Government employees and the VAWA self-petition. It does not cover broadcasters or "other". We ask your classification first and then only what it needs. These are legal cases: we recommend talking to an attorney or accredited organization before filing.',
  },
  minutes: 45,
  pdf: {
    path: 'forms/i-360.pdf',
    fileName: 'I-360-filled.pdf',
    load: () => import('../pdf/i360Pdf').then((m) => m.fillI360),
    signHere: {
      es: 'Parte 11, Ítem 6 (o Parte 12, Ítem 8, si la presenta por otra persona)',
      en: 'Part 11, Item 6 (or Part 12, Item 8, if you file for another person)',
    },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-360 que la edición {edition} sigue vigente, la tarifa y la dirección donde se envía su categoría.',
      'Amerasiático(a): adjunte prueba de que nació en Corea, Vietnam, Laos, Kampuchea o Tailandia entre el 1 de enero de 1951 y el 21 de octubre de 1982 (si nació en Vietnam, su cédula de identidad vietnamita o una declaración de por qué no la tiene), pruebas de quién es su padre y de que era ciudadano, una foto y, si está casado(a), el acta de matrimonio. También hacen falta el Formulario I-361 del patrocinador y prueba de que tiene 21 años o más y es ciudadano o residente; si no los envía ahora, USCIS se los pedirá y el trámite tardará más.',
      'Viudo(a): adjunte el acta de matrimonio, el acta de defunción de su cónyuge, prueba de que era ciudadano(a), prueba de que terminaron matrimonios anteriores y pruebas de que el matrimonio era real (renta, cuentas, hijos, fotos). Presente dentro de los 2 años de la muerte.',
      'VAWA: adjunte su declaración personal sobre el abuso, pruebas del abuso (reportes de policía, órdenes de protección, cartas de consejeros o refugios, fotos), prueba del parentesco y del estatus de quien le maltrató, prueba de que vivieron juntos y de su buen carácter moral. Los casos VAWA son confidenciales y se envían a una dirección especial: nunca use la de los demás I-360.',
      'SIJ: adjunte copia de la orden de la corte juvenil con las determinaciones requeridas, su acta de nacimiento y prueba de su edad. Debe presentar antes de cumplir 21 años. SIJ no paga tarifa.',
      'Trabajador religioso: un representante de su empleador firma a mano la certificación de la Parte 9, Ítem 14, y si el empleador está afiliado a una denominación, un representante de ella firma el Ítem 21. Adjunte la carta del IRS, pruebas del pago que recibirá, de que es miembro de la denominación hace 2 años, de que trabajó 2 años seguidos en ese tipo de puesto y de que está calificado(a).',
      'Canal de Panamá: adjunte la carta de la Compañía del Canal, del Gobierno de la Zona del Canal o de la agencia de EE.UU. con el tiempo y las condiciones del empleo y del retiro, y pruebas del peligro si ese es su caso. Médico: adjunte cartas de los empleadores desde el 8 de enero de 1978 y los documentos que prueban cada requisito.',
      'G-4 u OTAN (NATO-6): adjunte la carta de la organización que explique el empleo y el estatus; si es familiar, prueba del parentesco. Fuerzas Armadas: adjunte la certificación del servicio activo honorable emitida por su departamento y su acta de nacimiento.',
      'Traductor afgano o iraquí, o empleado del gobierno de EE.UU. en Irak o Afganistán: adjunte prueba de su nacionalidad (con traducción certificada), la recomendación, las pruebas de la aprobación del Jefe de Misión, de la evaluación de riesgo, de la revisión independiente o de la verificación de antecedentes que pidan las instrucciones para su caso, y su I-94 si está en EE.UU. Estas categorías no pagan tarifa.',
      'Si adjunta un I-485, póngalo junto con este formulario en el mismo paquete.',
      'Imprima el PDF y firme a mano con tinta negra la Parte 11, Ítem 6, o la Parte 12, Ítem 8, si la presenta por otra persona. Si un intérprete o preparador le ayudó, sus datos ya están en las Partes 13 y 14: ellos solo firman y ponen la fecha a mano.',
      'Si una explicación no cupo en la Parte 15, siga en una hoja aparte con su nombre, la página, parte e ítem, y fírmela.',
    ],
    en: [
      'Check at uscis.gov/i-360 that edition {edition} is still current, the fee and the filing address for your classification.',
      'Amerasian: attach proof of birth in Korea, Vietnam, Laos, Kampuchea or Thailand between January 1, 1951 and October 21, 1982 (if born in Vietnam, the Vietnamese identification card or a statement of why it is not available), evidence of who the father is and that he was a U.S. citizen, a photograph and, if married, the marriage certificate. The sponsor’s Form I-361 and proof that the sponsor is 21 or older and a citizen or permanent resident are also needed; if you don’t send them now, USCIS will ask for them and processing takes longer.',
      'Widow(er): attach your marriage certificate, your spouse’s death certificate, proof of their citizenship, proof that prior marriages ended and evidence the marriage was real (lease, accounts, children, photos). File within 2 years of the death.',
      'VAWA: attach your personal statement about the abuse, evidence of the abuse (police reports, protective orders, letters from counselors or shelters, photos), proof of the relationship and of the abuser’s status, proof you lived together and of your good moral character. VAWA cases are confidential and go to a special address: never use the one for other I-360s.',
      'SIJ: attach a copy of the juvenile court order with the required findings, your birth certificate and proof of age. You must file before you turn 21. SIJ has no filing fee.',
      'Religious worker: an official of your employer signs the attestation in Part 9, Item 14, by hand, and if the employer is affiliated with a denomination, a representative of the denomination signs Item 21. Attach the IRS letter and evidence of your compensation, of 2 years of membership in the denomination, of 2 years of continuous work in that kind of position and of your qualifications.',
      'Panama Canal: attach the letter from the Panama Canal Company, the Canal Zone Government or the U.S. agency stating the length and circumstances of employment and retirement, and evidence of danger if that is your case. Physician: attach letters from employers since January 8, 1978 and the documents that prove each requirement.',
      'G-4 or NATO-6: attach the organization’s letter explaining the employment and status; for a family member, proof of the relationship. Armed forces: attach the certification of honorable active duty service from your executive department and your birth certificate.',
      'Afghan or Iraqi translator, or U.S. Government employee in Iraq or Afghanistan: attach proof of nationality (with a certified translation), the recommendation, and the proof of Chief of Mission approval, risk assessment, independent review or background check that the instructions ask for in your case, and your I-94 if you are in the U.S. These classifications pay no fee.',
      'If you attach an I-485, send it together with this form in the same package.',
      'Print the PDF and sign by hand in black ink Part 11, Item 6, or Part 12, Item 8, if you file for another person. If an interpreter or preparer helped you, their details are already in Parts 13 and 14: they only sign and date by hand.',
      'If an explanation did not fit in Part 15, continue on a separate sheet with your name, the page, part and item, and sign it.',
    ],
  },
  sections: [
    {
      id: 'classification',
      part: 'Part 2',
      title: t('Su categoría', 'Your classification'),
      questions: [
        {
          id: 'classification',
          kind: 'choice',
          formRef: 'Part 2 · Item 1 · Classification Requested',
          question: t('¿Para qué categoría presenta esta petición?', 'Which classification are you filing for?'),
          why: {
            es: `Elija solo una. ${noCovered.es}`,
            en: `Choose only one. ${noCovered.en}`,
          },
          notice: {
            tone: 'legal',
            title: t('Hable con un abogado', 'Talk to an attorney'),
            body: t(
              'Cada categoría tiene requisitos estrictos y un error puede costarle el caso. Busque un abogado de inmigración o una organización acreditada por el Departamento de Justicia; muchas ayudan gratis en casos VAWA, SIJ y de traductores y empleados afganos o iraquíes.',
              'Each classification has strict requirements and a mistake can cost you the case. Look for an immigration attorney or a Department of Justice–accredited organization; many help for free with VAWA, SIJ and Afghan or Iraqi translator and employee cases.',
            ),
          },
          options: [
            { value: 'B', label: t('Viudo(a) de un ciudadano estadounidense', 'Widow(er) of a U.S. citizen') },
            { value: 'I', label: t('VAWA: esposo(a) que sufrió abuso de su cónyuge ciudadano o residente permanente', 'VAWA: abused spouse of a U.S. citizen or permanent resident') },
            { value: 'J', label: t('VAWA: hijo(a) que sufrió abuso de su padre o madre ciudadano o residente permanente', 'VAWA: abused child of a U.S. citizen or permanent resident') },
            { value: 'K', label: t('VAWA: padre o madre que sufrió abuso de su hijo(a) ciudadano', 'VAWA: abused parent of a U.S. citizen son or daughter') },
            { value: 'C', label: t('Joven Inmigrante Especial (SIJ), con orden de una corte juvenil', 'Special Immigrant Juvenile (SIJ), with a juvenile court order') },
            { value: 'A', label: t('Amerasiático(a): hijo(a) de un ciudadano estadounidense, nacido(a) en Corea, Vietnam, Laos, Kampuchea o Tailandia entre 1951 y 1982', 'Amerasian: child of a U.S. citizen, born in Korea, Vietnam, Laos, Kampuchea or Thailand between 1951 and 1982') },
            { value: 'D', label: t('Trabajador(a) religioso(a) (ministro, vocación u ocupación religiosa)', 'Religious worker (minister, religious vocation or occupation)') },
            { value: 'L', label: t('Afgano(a) o iraquí que trabajó como traductor(a) con las Fuerzas Armadas de EE.UU.', 'Afghan or Iraqi national who worked as a translator with the U.S. Armed Forces') },
            { value: 'M', label: t('Iraquí que trabajó para el gobierno de EE.UU. o en su nombre en Irak', 'Iraqi national employed by or on behalf of the U.S. Government in Iraq') },
            { value: 'N', label: t('Afgano(a) que trabajó para el gobierno de EE.UU. o la ISAF en Afganistán', 'Afghan national employed by or on behalf of the U.S. Government or ISAF in Afghanistan') },
            { value: 'E', label: t('Empleado(a) de la Compañía del Canal de Panamá, del Gobierno de la Zona del Canal o del gobierno de EE.UU. en la Zona del Canal', 'Employee of the Panama Canal Company, the Canal Zone Government or the U.S. Government in the Canal Zone') },
            { value: 'F', label: t('Médico(a) con licencia en EE.UU. desde antes del 9 de enero de 1978', 'Physician licensed in the U.S. before January 9, 1978') },
            { value: 'G', label: t('Empleado(a) de una organización internacional (G-4) o de la OTAN (NATO-6), o su familiar', 'G-4 international organization or NATO-6 employee, or a family member') },
            { value: 'H', label: t('Miembro de las Fuerzas Armadas de EE.UU. que se alistó en el extranjero por un tratado', 'U.S. Armed Forces member who enlisted abroad under a treaty') },
          ],
        },
        {
          id: 'filer',
          kind: 'choice',
          formRef: 'Part 1 · Information About Person or Organization Filing This Petition',
          showIf: is('classification', ...FOR_OTHER),
          question: t('¿Presenta esta petición para usted o para otra persona?', 'Are you filing this petition for yourself or for another person?'),
          why: t(
            'En esta categoría la petición la puede presentar la misma persona o alguien por ella, por ejemplo un familiar. Si la presenta por otra persona, usted es el peticionario: da sus datos en la Parte 1 y firma la Parte 12.',
            'In this classification the petition can be filed by the person or by someone for them, for example a family member. If you file for another person, you are the petitioner: you give your details in Part 1 and sign Part 12.',
          ),
          options: [
            { value: 'self', label: t('Para mí', 'For myself') },
            { value: 'other', label: t('Para un familiar u otra persona', 'For a family member or another person') },
          ],
        },
        {
          id: 'rw.kind',
          kind: 'choice',
          formRef: 'Part 2 · Item 1.D.(1) · Part 9 · Item 6.B',
          showIf: religious,
          question: t('¿En qué trabajará?', 'What will you be working as?'),
          why: t('Si trabajará como ministro, la petición lo marca en la Parte 2.', 'If you will work as a minister, the petition marks it in Part 2.'),
          notice: {
            tone: 'legal',
            title: t('Requisitos del trabajador religioso', 'Religious worker requirements'),
            body: t(
              'Debe haber sido miembro de la denominación por lo menos los 2 años antes de presentar y haber trabajado sin interrupción, después de cumplir 14 años, en ese tipo de puesto por esos 2 años, en EE.UU. o afuera. Su empleador debe ser una organización religiosa sin fines de lucro (o afiliada a la denominación) y llenar y firmar la certificación de la Parte 9, aunque usted presente la petición. Los trabajadores que no son ministros tienen una fecha límite que el Congreso renueva: confírmela en uscis.gov.',
              'You must have been a member of the denomination for at least the 2 years before filing and have worked continuously, after turning 14, in that kind of position for those 2 years, in the U.S. or abroad. Your employer must be a nonprofit religious organization (or one affiliated with the denomination) and must complete and sign the attestation in Part 9, even if you file the petition. Workers other than ministers have a sunset date that Congress renews: check it at uscis.gov.',
            ),
          },
          options: [
            { value: 'A', label: t('Como ministro(a)', 'As a minister') },
            { value: 'B', label: t('En una vocación religiosa', 'In a religious vocation') },
            { value: 'C', label: t('En una ocupación religiosa', 'In a religious occupation') },
          ],
        },
        {
          id: 'translator.country',
          kind: 'choice',
          formRef: 'Part 2 · Item 1.L',
          showIf: translator,
          question: t('¿De qué país es ciudadano(a)?', 'Which country are you a national of?'),
          notice: {
            tone: 'legal',
            title: t('Antes de presentar', 'Before you file'),
            body: t(
              'Debe haber trabajado directamente con las Fuerzas Armadas de EE.UU. o bajo el Jefe de Misión como traductor(a) o intérprete por lo menos 12 meses, tener una recomendación favorable por escrito del Jefe de Misión o de un general u oficial de bandera de la unidad que apoyó, y haber pasado una verificación de antecedentes antes de presentar.',
              'You must have worked directly with the U.S. Armed Forces or under Chief of Mission authority as a translator or interpreter for at least 12 months, have a favorable written recommendation from the Chief of Mission or a general or flag officer in the chain of command of the unit you supported, and have cleared a background check before filing.',
            ),
          },
          options: [
            { value: 'AF', label: t('Afganistán', 'Afghanistan') },
            { value: 'IQ', label: t('Irak', 'Iraq') },
          ],
        },
        {
          id: 'iraqi.com',
          kind: 'choice',
          formRef: 'Part 2 · Item 1.M',
          showIf: iraqiEmployee,
          question: t('¿El Jefe de Misión en Bagdad aprobó su empleo y su servicio?', 'Has the Chief of Mission in Baghdad approved your employment and service?'),
          notice: {
            tone: 'legal',
            title: t('Requisitos', 'Requirements'),
            body: t(
              'Debe haber trabajado para el gobierno de EE.UU. o en su nombre en Irak entre el 20 de marzo de 2003 y el 30 de septiembre de 2013 por lo menos 1 año, con servicio fiel y valioso y una amenaza seria por ese trabajo, todo aprobado por el Jefe de Misión. El plazo para pedir esa aprobación terminó el 30 de septiembre de 2014. Si su esposo(a) o padre/madre con petición aprobada falleció, consulte a un abogado: puede tener derecho como sobreviviente.',
              'You must have worked for or on behalf of the U.S. Government in Iraq between March 20, 2003 and September 30, 2013 for at least 1 year, with faithful and valuable service and a serious threat because of that work, all approved by the Chief of Mission. The deadline to ask for that approval was September 30, 2014. If your spouse or parent with an approved petition died, see an attorney: you may qualify as a survivor.',
            ),
          },
          options: yesNo,
        },
        {
          id: 'afghan.basis',
          kind: 'choice',
          formRef: 'Part 2 · Item 1.N',
          showIf: afghanEmployee,
          question: t('¿Cuál es su situación?', 'Which is your situation?'),
          notice: {
            tone: 'legal',
            title: t('Casi todos los casos ya van al Departamento de Estado', 'Most cases now go to the Department of State'),
            body: t(
              'El Formulario DS-157 que se envía con la solicitud de aprobación del Jefe de Misión reemplazó al I-360. Si empezó el trámite el 20 de julio de 2022 o después, NO presente el I-360: envíe todo a AfghanSIVApplication@state.gov. Use el I-360 solo en las situaciones de esta lista. Debe haber trabajado para el gobierno de EE.UU. o la ISAF en Afganistán entre el 7 de octubre de 2001 y el 31 de diciembre de 2023 por lo menos 1 año.',
              'Form DS-157, sent with the Chief of Mission application, has replaced Form I-360. If you started the process on or after July 20, 2022, do NOT file Form I-360: email everything to AfghanSIVApplication@state.gov. Use Form I-360 only in the situations listed here. You must have worked for the U.S. Government or ISAF in Afghanistan between October 7, 2001 and December 31, 2023 for at least 1 year.',
            ),
          },
          options: [
            { value: 'inUS', label: t('Estoy en EE.UU. y recibí la aprobación del Jefe de Misión', 'I am in the U.S. and received Chief of Mission approval') },
            { value: 'unsigned', label: t('Estoy en EE.UU., tengo la aprobación pero no firmé el DS-157 que presenté', 'I am in the U.S., have approval but did not sign the DS-157 I filed') },
            { value: 'noDS157', label: t('Tengo la aprobación del Jefe de Misión pero no presenté el DS-157 con mi solicitud', 'I have Chief of Mission approval but did not file a DS-157 with my application') },
          ],
        },
        {
          id: 'panama.basis',
          kind: 'choice',
          formRef: 'Part 2 · Item 1.E',
          showIf: panama,
          question: t('Cuando entró en vigor el Tratado del Canal de Panamá de 1977, la persona…', 'When the Panama Canal Treaty of 1977 entered into force, the person…'),
          options: [
            { value: 'resident', label: t('Vivía en la Zona del Canal y llevaba 1 año o más trabajando para la Compañía del Canal o el Gobierno de la Zona', 'Lived in the Canal Zone and had worked 1 year or more for the Panama Canal Company or the Canal Zone Government') },
            { value: 'retired', label: t('Era panameño(a) y se jubiló con honor del gobierno de EE.UU. en la Zona después de 15 años o más', 'Was a Panamanian national and honorably retired from U.S. Government employment in the Zone after 15 or more years') },
            { value: 'danger', label: t('Trabajaba allí (5 años o más de servicio, o 15 años y retirado) y su seguridad o la de su familia está en peligro por ese trabajo y el Tratado', 'Worked there (5 or more years of service, or 15 years and retired) and their safety or their family’s is in danger because of that work and the Treaty') },
          ],
        },
        {
          id: 'physician.meets',
          kind: 'choice',
          formRef: 'Part 2 · Item 1.F',
          showIf: physician,
          question: t('¿La persona cumple todos estos requisitos?', 'Does the person meet all of these requirements?'),
          why: t(
            'Se graduó de medicina o puede ejercer en otro país; tenía licencia completa y permanente y ejercía en un estado de EE.UU. el 9 de enero de 1978; entró como H o J antes de esa fecha; y desde entonces ha estado en EE.UU. sin interrupción ejerciendo o estudiando medicina.',
            'Graduated from medical school or may practice abroad; was fully and permanently licensed and practicing in a U.S. state on January 9, 1978; entered as an H or J nonimmigrant before that date; and has been continuously present in the U.S. practicing or studying medicine since.',
          ),
          options: [
            { value: 'yes', label: t('Sí, todos', 'Yes, all of them') },
            { value: 'no', label: t('No estoy seguro(a)', 'I am not sure') },
          ],
        },
        {
          id: 'g4.role',
          kind: 'choice',
          formRef: 'Part 2 · Item 1.G',
          showIf: intlOrg,
          question: t('¿Cuál es su caso?', 'Which is your case?'),
          notice: {
            tone: 'legal',
            title: t('Confirme que califica', 'Confirm that you qualify'),
            body: t(
              'Es para empleados G-4 de larga duración recién jubilados de una organización internacional que califica, empleados civiles de larga duración de la OTAN (NATO-6) y sus familiares. Hay requisitos de años en EE.UU. y de fechas: pregunte a la organización, a la oficina de la OTAN o a USCIS si califica.',
              'It is for recently retired long-term G-4 employees of a qualifying international organization, long-term civilian NATO-6 employees and their family members. There are requirements on years in the U.S. and on dates: ask the organization, the NATO office or USCIS whether you qualify.',
            ),
          },
          options: [
            { value: 'g4', label: t('Empleado(a) G-4 de una organización internacional', 'G-4 international organization employee') },
            { value: 'g4Family', label: t('Familiar de un(a) empleado(a) G-4', 'Family member of a G-4 employee') },
            { value: 'nato', label: t('Empleado(a) civil de la OTAN (NATO-6)', 'NATO-6 civilian employee') },
            { value: 'natoFamily', label: t('Familiar de un(a) empleado(a) NATO-6', 'Family member of a NATO-6 employee') },
          ],
        },
        {
          id: 'armed.service',
          kind: 'choice',
          formRef: 'Part 2 · Item 1.H',
          showIf: armedForces,
          question: t('¿Cuánto tiempo de servicio activo tiene?', 'How much active duty service do you have?'),
          notice: {
            tone: 'legal',
            title: t('Requisitos', 'Requirements'),
            body: t(
              'Debe haber servido con honor en servicio activo después del 15 de octubre de 1978, haberse alistado originalmente fuera de EE.UU. bajo un tratado vigente el 1 de octubre de 1991, ser ciudadano(a) de un país con ese tratado, y que su departamento le haya recomendado para esta categoría.',
              'You must have served honorably on active duty after October 15, 1978, have originally enlisted outside the U.S. under a treaty in effect on October 1, 1991, be a national of a country with that treaty, and have been recommended for this classification by your executive department.',
            ),
          },
          options: [
            { value: '12', label: t('12 años, y nunca me separaron sino en condiciones honorables', '12 years, and I was never separated except under honorable conditions') },
            { value: '6', label: t('6 años, sigo en servicio activo y me realisté para completar por lo menos 12', '6 years, I am on active duty and reenlisted for a total obligation of at least 12') },
          ],
        },
      ],
    },
    {
      id: 'petitioner',
      part: 'Part 1',
      title: t('Sus datos como peticionario', 'You, the petitioner'),
      questions: [
        {
          id: 'petitionerName',
          kind: 'fields',
          formRef: 'Part 1 · Item 1 · Your Full Name',
          showIf: forOther,
          question: t('Usted, quien presenta la petición: ¿cuál es su nombre completo?', 'You, the person filing: what is your full name?'),
          fields: nameFields('petitioner', 'Part 1 · Item 1'),
        },
        {
          id: 'petitionerIds',
          kind: 'fields',
          formRef: 'Part 1 · Items 2–5',
          showIf: forOther,
          question: t('Sus números (si los tiene)', 'Your numbers (if any)'),
          fields: [
            { id: 'petitioner.uscisAccount', type: 'uscisAccount', label: { es: 'Número de cuenta en línea de USCIS', en: 'USCIS online account number' }, formRef: 'Part 1 · Item 2' },
            { id: 'petitioner.ssn', type: 'ssn', label: { es: 'Número de Seguro Social', en: 'U.S. Social Security number' }, formRef: 'Part 1 · Item 3' },
            { id: 'petitioner.aNumber', type: 'aNumber', label: { es: 'A-Number', en: 'A-Number' }, formRef: 'Part 1 · Item 4' },
            { id: 'petitioner.itin', type: 'text', label: { es: 'Número de identificación del IRS (ITIN)', en: 'Individual IRS tax number' }, formRef: 'Part 1 · Item 5', maxLength: 9, hint: t('Solo los 9 dígitos.', 'Only the 9 digits.') },
          ],
        },
        {
          id: 'petitionerAddress',
          kind: 'fields',
          formRef: 'Part 1 · Item 6 · Mailing Address',
          showIf: forOther,
          question: t('¿Cuál es su dirección postal?', 'What is your mailing address?'),
          notice: {
            tone: 'info',
            title: t('Después, la otra persona', 'Next, the other person'),
            body: t(
              'Las preguntas que siguen son sobre la persona para quien es la petición (el beneficiario). Cuando digan "usted", conteste con los datos de esa persona. Al final volvemos a usted para la firma.',
              'The questions that follow are about the person the petition is for (the beneficiary). When they say "you", answer with that person’s details. At the end we come back to you for the signature.',
            ),
          },
          fields: anyAddress('petitioner', 'Part 1 · Item 6', { careOf: true }),
        },
      ],
    },
    {
      id: 'about',
      part: 'Part 3',
      title: t('Sus datos', 'About you'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 3 · Item 1 · Your Full Name',
          question: t('¿Cuál es su nombre completo?', 'What is your full name?'),
          why: t(
            'Escríbalo como en su pasaporte o acta de nacimiento. Si presenta por otra persona, desde aquí escriba los datos de esa persona.',
            'Write it as it appears on your passport or birth certificate. If you are filing for another person, from here on give that person’s details.',
          ),
          fields: nameFields('name', 'Part 3 · Item 1'),
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 3 · Item 2 · Mailing Address',
          question: t('¿Cuál es su dirección postal?', 'What is your mailing address?'),
          fields: anyAddress('mailing', 'Part 3 · Item 2', { careOf: true }),
        },
        {
          id: 'safeAddress',
          kind: 'choice',
          formRef: 'Part 1 · Item 7 · Alternate and/or Safe Mailing Address',
          showIf: selfPetitioner,
          question: t('¿Quiere que USCIS le mande el correo a otra dirección segura?', 'Do you want USCIS to send your mail to a different, safe address?'),
          why: t('Por ejemplo, la de su abogado, una organización de ayuda o una persona de confianza, si no quiere que las cartas lleguen a su casa.', 'For example, your attorney’s, a support organization’s or a trusted person’s, if you don’t want letters to arrive at your home.'),
          notice: { tone: 'legal', title: t('Su seguridad primero', 'Your safety first'), body: HOTLINE },
          options: yesNo,
        },
        {
          id: 'safe',
          kind: 'fields',
          formRef: 'Part 1 · Item 7',
          showIf: all(selfPetitioner, is('safeAddress', 'yes')),
          question: t('Dirección segura para su correo', 'Safe mailing address'),
          fields: anyAddress('safe', 'Part 1 · Item 7', { careOf: true }),
        },
        {
          id: 'ids',
          kind: 'fields',
          formRef: 'Part 3 · Items 3–6',
          question: t('Su nacimiento y sus números', 'Your birth and your numbers'),
          fields: [
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 3 · Item 3'),
            { id: 'birthCountry', type: 'text', required: true, label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: 'Part 3 · Item 4' },
            { id: 'ssn', type: 'ssn', label: { es: 'Número de Seguro Social (si tiene)', en: 'U.S. Social Security number (if any)' }, formRef: 'Part 3 · Item 5' },
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 3 · Item 6' },
          ],
        },
        {
          id: 'account',
          kind: 'fields',
          formRef: 'Part 1 · Item 2',
          showIf: ownPart1,
          question: t('¿Tiene cuenta en línea de USCIS?', 'Do you have a USCIS online account?'),
          fields: [{ id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Número de cuenta en línea de USCIS (si tiene)', en: 'USCIS online account number (if any)' }, formRef: 'Part 1 · Item 2' }],
        },
        {
          id: 'marital',
          kind: 'choice',
          formRef: 'Part 3 · Item 7 · Marital Status',
          question: t('¿Cuál es su estado civil hoy?', 'What is your marital status today?'),
          options: [
            { value: 'S', label: t('Soltero(a)', 'Single') },
            { value: 'M', label: t('Casado(a)', 'Married') },
            { value: 'D', label: t('Divorciado(a)', 'Divorced') },
            { value: 'W', label: t('Viudo(a)', 'Widowed') },
          ],
        },
        {
          id: 'inUS',
          kind: 'choice',
          formRef: 'Part 3 · Items 8–15',
          question: t('¿Está usted ahora en los Estados Unidos?', 'Are you in the United States now?'),
          options: yesNo,
        },
        {
          id: 'arrival',
          kind: 'fields',
          formRef: 'Part 3 · Items 8–15',
          showIf: is('inUS', 'yes'),
          question: t('Su última llegada a EE.UU.', 'Your last arrival in the U.S.'),
          why: t('Use los datos del pasaporte o documento con que entró la última vez. Si entró sin inspección o algo no aplica, déjelo en blanco.', 'Use the passport or document you used the last time you arrived. If you entered without inspection or something does not apply, leave it blank.'),
          fields: [
            date('arrival.date', 'Fecha de su última llegada', 'Date of last arrival', 'Part 3 · Item 8', false),
            { id: 'i94.number', type: 'i94', label: { es: 'Número I-94 (si tiene)', en: 'I-94 number (if any)' }, formRef: 'Part 3 · Item 9' },
            { id: 'passport.number', type: 'text', label: { es: 'Número de pasaporte', en: 'Passport number' }, formRef: 'Part 3 · Item 10', maxLength: 30 },
            { id: 'passport.travelDoc', type: 'text', label: { es: 'Número de documento de viaje (si no fue pasaporte)', en: 'Travel document number (if not a passport)' }, formRef: 'Part 3 · Item 11', maxLength: 30 },
            { id: 'passport.country', type: 'text', label: { es: 'País que emitió el pasaporte o documento', en: 'Country of issuance' }, formRef: 'Part 3 · Item 12' },
            date('passport.expires', 'Fecha de vencimiento del pasaporte o documento', 'Passport or travel document expiration date', 'Part 3 · Item 13', false, 'date'),
            { id: 'status.current', type: 'text', label: { es: 'Su estatus actual (en inglés)', en: 'Current nonimmigrant status' }, formRef: 'Part 3 · Item 14', placeholder: 'B-2 visitor', hint: t('Por ejemplo: B-2 visitor, F-1 student, parolee. Si no tiene estatus, déjelo en blanco.', 'For example: B-2 visitor, F-1 student, parolee. If you have no status, leave it blank.') },
            date('status.expires', 'Fecha en que vence (o venció) ese estatus, según su I-94', 'Date that status expires (or expired), per the I-94', 'Part 3 · Item 15', false, 'date'),
          ],
        },
      ],
    },
    {
      id: 'widow',
      part: 'Part 7',
      title: t('Su cónyuge fallecido(a)', 'Your late spouse'),
      questions: [
        {
          id: 'deceased',
          kind: 'fields',
          formRef: 'Part 7 · Items 1–4',
          showIf: widow,
          question: t('Datos de su esposo(a) que falleció', 'About your spouse who died'),
          notice: {
            tone: 'legal',
            title: t('Requisitos de viudo(a)', 'Widow(er) requirements'),
            body: t(
              'Debe presentar dentro de los 2 años de la muerte de su cónyuge, haber estado casados de buena fe al momento de la muerte y no haberse vuelto a casar. Si alguno no se cumple, consulte a un abogado antes de presentar.',
              'You must file within 2 years of your spouse’s death, have been married in good faith at the time of death and not have remarried. If any of these does not hold, see an attorney before filing.',
            ),
          },
          fields: [
            ...nameFields('deceased', 'Part 7 · Item 1'),
            date('deceased.dob', 'Fecha de nacimiento', 'Date of birth', 'Part 7 · Item 2', false),
            { id: 'deceased.birthCountry', type: 'text', label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: 'Part 7 · Item 3' },
            date('deceased.death', 'Fecha en que falleció', 'Date of death', 'Part 7 · Item 4'),
          ],
        },
        {
          id: 'deceased.status',
          kind: 'choice',
          formRef: 'Part 7 · Item 5',
          showIf: widow,
          question: t('Cuando falleció, su esposo(a) era…', 'At the time of death, your spouse was a…'),
          options: [
            { value: 'A', label: t('Ciudadano(a) nacido(a) en EE.UU.', 'U.S. citizen born in the United States') },
            { value: 'B', label: t('Ciudadano(a) nacido(a) en el extranjero de padres ciudadanos', 'U.S. citizen born abroad to U.S. citizen parents') },
            { value: 'C', label: t('Ciudadano(a) por naturalización', 'U.S. citizen through naturalization') },
            { value: 'D', label: t('Otro', 'Other') },
          ],
        },
        {
          id: 'deceasedNaturalized',
          kind: 'fields',
          formRef: 'Part 7 · Item 5.C.(1)',
          showIf: all(widow, is('deceased.status', 'C')),
          question: t('A-Number de su esposo(a)', 'Your spouse’s A-Number'),
          fields: [{ id: 'deceased.aNumber', type: 'aNumber', label: { es: 'A-Number (si lo sabe)', en: 'A-Number (if any)' }, formRef: 'Part 7 · Item 5.C.(1)' }],
        },
        {
          id: 'deceasedOther',
          kind: 'fields',
          formRef: 'Part 7 · Item 5.D',
          showIf: all(widow, is('deceased.status', 'D')),
          question: t('Explique la situación de su esposo(a)', 'Explain your spouse’s status'),
          fields: [{ id: 'deceased.statusOther', type: 'text', required: true, label: { es: 'Explicación (en inglés)', en: 'Explanation' }, formRef: 'Part 7 · Item 5.D', maxLength: 80 }],
        },
        {
          id: 'widowMarriage',
          kind: 'fields',
          formRef: 'Part 7 · Items 6–8',
          showIf: widow,
          question: t('Su matrimonio', 'Your marriage'),
          fields: [
            { id: 'timesMarried', type: 'number', required: true, label: { es: '¿Cuántas veces se ha casado usted? (incluya este matrimonio)', en: 'How many times have you been married? (include this marriage)' }, formRef: 'Part 7 · Item 6', maxLength: 3 },
            { id: 'deceased.timesMarried', type: 'number', label: { es: '¿Cuántas veces se casó su esposo(a)?', en: 'How many times was your spouse married?' }, formRef: 'Part 7 · Item 7', maxLength: 3 },
            date('marriage.date', 'Fecha del matrimonio', 'Date of marriage', 'Part 7 · Item 8.A'),
            { id: 'marriage.place', type: 'text', required: true, label: { es: 'Lugar del matrimonio (ciudad, estado o país)', en: 'Place of marriage (city, state or country)' }, formRef: 'Part 7 · Item 8.B', placeholder: 'Los Angeles, CA' },
          ],
        },
        {
          id: 'remarried',
          kind: 'choice',
          formRef: 'Part 7 · Item 9.A',
          showIf: widow,
          question: t('¿Se volvió a casar después de que murió su esposo(a)?', 'Did you remarry after your spouse died?'),
          notice: {
            tone: 'legal',
            title: t('Contestar con la verdad', 'Answer truthfully'),
            body: t('Si se volvió a casar, normalmente ya no puede pedir la residencia como viudo(a). Hable con un abogado antes de presentar.', 'If you remarried, you usually can no longer petition as a widow(er). Talk to an attorney before filing.'),
          },
          options: yesNo,
        },
        {
          id: 'remarriedWhen',
          kind: 'fields',
          formRef: 'Part 7 · Item 9.B',
          showIf: all(widow, is('remarried', 'yes')),
          question: t('¿Cuándo se volvió a casar?', 'When did you remarry?'),
          fields: [date('remarried.date', 'Fecha del nuevo matrimonio', 'Date you remarried', 'Part 7 · Item 9.B')],
        },
        {
          id: 'separated',
          kind: 'choice',
          formRef: 'Part 7 · Item 10',
          showIf: widow,
          question: t('¿Estaban legalmente separados cuando murió su esposo(a)?', 'Were you legally separated when your spouse died?'),
          why: t('"Legalmente" quiere decir con una orden de un juez, no solo vivir aparte.', '"Legally" means by a court order, not just living apart.'),
          options: yesNo,
        },
        {
          id: 'separatedExplain',
          kind: 'fields',
          formRef: 'Part 7 · Item 10 · Part 15',
          showIf: all(widow, is('separated', 'yes')),
          question: t('Explique la separación', 'Explain the separation'),
          fields: [{ id: 'separated.explain', type: 'longText', required: true, label: { es: 'Explicación (en inglés)', en: 'Explanation' }, formRef: 'Part 15 · Part 7, Item 10' }],
        },
      ],
    },
    {
      id: 'vawa',
      part: 'Part 10',
      title: t('La persona que le maltrató', 'The person who abused you'),
      questions: [
        {
          id: 'abuser',
          kind: 'fields',
          formRef: 'Part 10 · Items 1–4',
          showIf: vawa,
          question: t('Datos de la persona que le maltrató', 'About the person who abused you'),
          notice: {
            tone: 'legal',
            title: t('Su caso VAWA es confidencial', 'Your VAWA case is confidential'),
            body: {
              es: `La ley prohíbe que USCIS le dé información de su caso a quien le maltrató o use lo que esa persona diga en su contra. Su petición se envía a una dirección especial para casos VAWA (la verá en uscis.gov/i-360). ${HOTLINE.es}`,
              en: `The law forbids USCIS from sharing information about your case with your abuser or relying on what they say against you. Your petition goes to a special address for VAWA cases (see uscis.gov/i-360). ${HOTLINE.en}`,
            },
          },
          fields: [
            ...nameFields('abuser', 'Part 10 · Item 1'),
            date('abuser.dob', 'Fecha de nacimiento (si la sabe)', 'Date of birth (if known)', 'Part 10 · Item 2', false),
            { id: 'abuser.birthCountry', type: 'text', label: { es: 'País de nacimiento (si lo sabe)', en: 'Country of birth (if known)' }, formRef: 'Part 10 · Item 3' },
            date('abuser.death', 'Fecha de muerte (solo si falleció)', 'Date of death (only if deceased)', 'Part 10 · Item 4', false),
          ],
        },
        {
          id: 'abuser.status',
          kind: 'choice',
          formRef: 'Part 10 · Item 5',
          showIf: vawa,
          question: t('Esa persona es o era…', 'Your abuser is now, or was, a…'),
          options: [
            { value: 'A', label: t('Ciudadano(a) nacido(a) en EE.UU.', 'U.S. citizen born in the United States') },
            { value: 'B', label: t('Ciudadano(a) nacido(a) en el extranjero de padres ciudadanos', 'U.S. citizen born abroad to U.S. citizen parents') },
            { value: 'C', label: t('Ciudadano(a) por naturalización', 'U.S. citizen through naturalization') },
            { value: 'D', label: t('Residente permanente (tiene green card)', 'U.S. lawful permanent resident') },
            { value: 'E', label: t('Otro', 'Other') },
          ],
        },
        {
          id: 'abuserANumber',
          kind: 'fields',
          formRef: 'Part 10 · Item 5.C.(1) / 5.D.(1)',
          showIf: all(vawa, is('abuser.status', 'C', 'D')),
          question: t('A-Number de esa persona', 'Your abuser’s A-Number'),
          why: t('Aparece en su green card o certificado de naturalización. Si no lo sabe, déjelo en blanco.', 'It is on their green card or naturalization certificate. If you don’t know it, leave it blank.'),
          fields: [{ id: 'abuser.aNumber', type: 'aNumber', label: { es: 'A-Number (si lo sabe)', en: 'A-Number (if known)' }, formRef: 'Part 10 · Item 5.C.(1) / 5.D.(1)' }],
        },
        {
          id: 'abuserOther',
          kind: 'fields',
          formRef: 'Part 10 · Item 5.E',
          showIf: all(vawa, is('abuser.status', 'E')),
          question: t('Explique el estatus de esa persona', 'Explain your abuser’s status'),
          fields: [{ id: 'abuser.statusOther', type: 'text', required: true, label: { es: 'Explicación (en inglés)', en: 'Explanation' }, formRef: 'Part 10 · Item 5.E', maxLength: 80 }],
        },
        {
          id: 'vawaMarriages',
          kind: 'fields',
          formRef: 'Part 10 · Items 6–7',
          showIf: vawa,
          question: t('Matrimonios', 'Marriages'),
          fields: [
            { id: 'vawa.timesMarried', type: 'number', label: { es: '¿Cuántas veces se ha casado usted? (0 si nunca)', en: 'How many times have you been married? (0 if never)' }, formRef: 'Part 10 · Item 6', maxLength: 3 },
            { id: 'abuser.timesMarried', type: 'number', label: { es: '¿Cuántas veces se ha casado esa persona? (si lo sabe)', en: 'How many times was your abuser married? (if known)' }, formRef: 'Part 10 · Item 7', maxLength: 3 },
          ],
        },
        {
          id: 'vawaMarriage',
          kind: 'fields',
          formRef: 'Part 10 · Item 8',
          showIf: vawaSpouse,
          question: t('Su matrimonio con esa persona', 'Your marriage to your abuser'),
          fields: [
            date('vawa.marriageDate', 'Fecha del matrimonio', 'Date of marriage', 'Part 10 · Item 8.A'),
            { id: 'vawa.marriagePlace', type: 'text', required: true, label: { es: 'Lugar del matrimonio (ciudad, estado o país)', en: 'Place of marriage (city, state or country)' }, formRef: 'Part 10 · Item 8.B', placeholder: 'Houston, TX', maxLength: 120 },
          ],
        },
        {
          id: 'livedTogether',
          kind: 'fields',
          formRef: 'Part 10 · Item 9',
          showIf: vawa,
          question: t('¿Cuándo vivieron juntos?', 'When did you live with your abuser?'),
          why: t('Ponga el periodo principal. Si vivieron juntos en otras épocas, lo puede contar abajo.', 'Give the main period. If you lived together at other times, you can add them below.'),
          fields: [
            date('lived.from', 'Desde', 'From', 'Part 10 · Item 9 · From'),
            date('lived.to', 'Hasta (déjelo vacío si todavía viven juntos)', 'To (leave empty if you still live together)', 'Part 10 · Item 9 · To', false),
            { id: 'lived.other', type: 'longText', label: { es: 'Otras fechas en que vivieron juntos (opcional, en inglés)', en: 'Other dates you lived together (optional)' }, formRef: 'Part 15 · Part 10, Item 9' },
          ],
        },
        {
          id: 'lastTogether',
          kind: 'fields',
          formRef: 'Part 10 · Item 10',
          showIf: vawa,
          question: t('La última dirección donde vivieron juntos', 'The last address where you lived together'),
          fields: anyAddress('together', 'Part 10 · Item 10'),
        },
        {
          id: 'lastTogetherDates',
          kind: 'fields',
          formRef: 'Part 10 · Item 11',
          showIf: vawa,
          question: t('¿Cuándo vivieron juntos en esa dirección?', 'When did you live together at that address?'),
          fields: [
            date('together.from', 'Desde', 'From', 'Part 10 · Item 11 · From'),
            date('together.to', 'Hasta (déjelo vacío si todavía viven ahí)', 'To (leave empty if you still live there)', 'Part 10 · Item 11 · To', false),
          ],
        },
        {
          id: 'ead',
          kind: 'choice',
          formRef: 'Part 10 · Item 12',
          showIf: vawa,
          question: t('¿Vive en EE.UU. y quiere un permiso de trabajo?', 'Do you live in the U.S. and want a work permit?'),
          why: t('Con VAWA puede pedir el permiso de trabajo en este mismo formulario, sin presentar otro I-765 por ahora.', 'With VAWA you can request the work permit on this same form, without filing another I-765 for now.'),
          options: yesNo,
        },
      ],
    },
    {
      id: 'sij',
      part: 'Part 8',
      title: t('Su caso en la corte juvenil', 'Your juvenile court case'),
      questions: [
        {
          id: 'otherName.more0',
          kind: 'choice',
          formRef: 'Part 8 · Item 1 · Other Names Used',
          showIf: sij,
          question: t('¿Ha usado otros nombres (apodos, otro apellido)?', 'Have you used other names (nicknames, another last name)?'),
          notice: {
            tone: 'legal',
            title: t('Antes de presentar', 'Before you file'),
            body: t(
              'Para SIJ necesita primero una orden de una corte juvenil o familiar de EE.UU. que diga que no puede reunirse con uno o ambos padres por abuso, abandono o negligencia, y que no le conviene regresar a su país. Debe tener menos de 21 años y no estar casado(a). Un abogado o una organización para jóvenes inmigrantes le puede ayudar gratis.',
              'For SIJ you first need an order from a U.S. juvenile or family court finding that you cannot reunify with one or both parents due to abuse, abandonment or neglect, and that returning to your country is not in your best interest. You must be under 21 and unmarried. An attorney or an organization for immigrant youth can help you for free.',
            ),
          },
          options: yesNo,
        },
        ...rows({
          max: 2,
          id: 'otherName',
          first: all(sij, is('otherName.more0', 'yes')),
          question: (i) => (i === 1 ? t('Otro nombre que ha usado', 'Another name you have used') : t('Otro nombre más', 'One more name')),
          more: t('¿Ha usado otro nombre más?', 'Have you used another name?'),
          formRef: 'Part 8 · Item 1',
          fields: (i) => nameFields(`otherName${i}`, `Part 8 · Item 1.${'AB'[i - 1]}`),
          overflow: { es: 'Si son más de 2, escríbalos a mano en la Parte 15.', en: 'If there are more than 2, write them by hand in Part 15.' },
        }),
        {
          id: 'dependent',
          kind: 'choice',
          formRef: 'Part 8 · Item 2.A',
          showIf: sij,
          question: t('¿Una corte juvenil de EE.UU. lo/la declaró dependiente de la corte, o lo/la puso bajo la custodia de una agencia, del estado o de una persona?', 'Has a U.S. juvenile court declared you dependent on the court, or placed you in the custody of an agency, a state department, or a person?'),
          options: yesNo,
        },
        {
          id: 'dependentExplain',
          kind: 'fields',
          formRef: 'Part 8 · Item 2.A · Part 15',
          showIf: all(sij, is('dependent', 'no')),
          question: t('Explique su situación con la corte', 'Explain your situation with the court'),
          fields: [{ id: 'dependent.explain', type: 'longText', required: true, label: { es: 'Explicación (en inglés)', en: 'Explanation' }, formRef: 'Part 15 · Part 8, Item 2.A' }],
        },
        {
          id: 'placement',
          kind: 'fields',
          formRef: 'Part 8 · Item 2.B',
          showIf: sij,
          question: t('¿Con quién lo/la colocó la corte?', 'Who did the court place you with?'),
          why: t('El nombre de la agencia, del departamento del estado o de la persona (por ejemplo su tutor) que dice la orden.', 'The name of the agency, state department or person (for example your guardian) named in the order.'),
          fields: [{ id: 'placement.name', type: 'text', label: { es: 'Agencia o persona (como dice la orden)', en: 'Agency or person (as in the order)' }, formRef: 'Part 8 · Item 2.B', maxLength: 80 }],
        },
        {
          id: 'jurisdiction',
          kind: 'choice',
          formRef: 'Part 8 · Item 2.C',
          showIf: sij,
          question: t('¿Sigue usted bajo la autoridad de esa corte juvenil?', 'Are you still under the jurisdiction of that juvenile court?'),
          options: yesNo,
        },
        {
          id: 'residingPlacement',
          kind: 'choice',
          formRef: 'Part 8 · Item 3.A',
          showIf: all(sij, is('jurisdiction', 'yes')),
          question: t('¿Vive ahora donde la corte ordenó?', 'Do you currently live in the court-ordered placement?'),
          options: yesNo,
        },
        {
          id: 'jurisdictionEnded',
          kind: 'choice',
          formRef: 'Part 8 · Item 3.B',
          showIf: all(sij, is('jurisdiction', 'no')),
          question: t('¿Por qué ya no está bajo esa corte?', 'Why are you no longer under that court?'),
          options: [
            { value: 'A', label: t('Me adoptaron o me pusieron en tutela permanente u otro arreglo permanente (no con los padres abusivos)', 'I was adopted or placed in a permanent guardianship or other permanent arrangement (not with the abusive parents)') },
            { value: 'B', label: t('Cumplí la edad límite y la orden terminó por eso', 'I aged out and the order ended because of my age') },
            { value: 'C', label: t('Otra razón', 'Other reason') },
          ],
        },
        {
          id: 'jurisdictionExplain',
          kind: 'fields',
          formRef: 'Part 8 · Item 3.B · Part 15',
          showIf: all(sij, is('jurisdiction', 'no'), is('jurisdictionEnded', 'C')),
          question: t('Explique la otra razón', 'Explain the other reason'),
          fields: [{ id: 'jurisdiction.explain', type: 'longText', required: true, label: { es: 'Explicación (en inglés)', en: 'Explanation' }, formRef: 'Part 15 · Part 8, Item 3.B' }],
        },
        {
          id: 'reunification',
          kind: 'choice',
          formRef: 'Part 8 · Item 4.A',
          showIf: sij,
          question: t('Según la corte, ¿no es posible reunirse con uno o con ambos padres?', 'Did the court find that reunification is not viable with one or both of your parents?'),
          options: [
            { value: 'O', label: t('Con uno de mis padres', 'With one of my parents') },
            { value: 'B', label: t('Con ambos padres', 'With both parents') },
          ],
        },
        {
          id: 'grounds',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 8 · Item 4.A',
          showIf: sij,
          question: t('¿Por qué razón, según la orden? Marque todas las que apliquen.', 'For what reason, according to the order? Select all that apply.'),
          options: [
            { value: 'A', label: t('Abuso', 'Abuse') },
            { value: 'B', label: t('Negligencia (descuido)', 'Neglect') },
            { value: 'C', label: t('Abandono', 'Abandonment') },
            { value: 'D', label: t('Otra razón parecida según la ley del estado', 'A similar basis under state law') },
          ],
        },
        {
          id: 'groundsDetails',
          kind: 'fields',
          formRef: 'Part 8 · Item 4',
          showIf: all(sij, (a) => has('grounds', 'D')(a) || is('reunification', 'O')(a)),
          question: t('Detalles de la orden', 'Details of the order'),
          fields: [
            { id: 'grounds.other', type: 'text', label: { es: 'Razón según la ley del estado (si marcó "otra razón")', en: 'Basis under state law (if you chose "similar basis")' }, formRef: 'Part 8 · Item 4.A · Specify', maxLength: 60 },
            { id: 'reunification.parent', type: 'text', label: { es: 'Nombre del padre o madre (si es solo uno)', en: 'Name of the parent (if only one)' }, formRef: 'Part 8 · Item 4.B', maxLength: 80 },
          ],
        },
        {
          id: 'bestInterest',
          kind: 'choice',
          formRef: 'Part 8 · Item 5',
          showIf: sij,
          question: t('¿Una corte o agencia decidió que no le conviene regresar a su país o al de sus padres?', 'Was it decided in court or administrative proceedings that returning to your or your parents’ country is not in your best interest?'),
          options: yesNo,
        },
        {
          id: 'hhs',
          kind: 'choice',
          formRef: 'Part 8 · Item 6.A',
          showIf: sij,
          question: t('¿Está o estuvo alguna vez bajo custodia del Departamento de Salud y Servicios Humanos (HHS/ORR), por ejemplo en un albergue para menores?', 'Are you now, or were you ever, in the custody of the U.S. Department of Health and Human Services (HHS/ORR), for example in a shelter for minors?'),
          options: yesNo,
        },
        {
          id: 'hhsAltered',
          kind: 'choice',
          formRef: 'Part 8 · Item 6.B',
          showIf: all(sij, is('hhs', 'yes')),
          question: t('Si está ahora bajo custodia de HHS: ¿la orden de la corte juvenil decidió o cambió su custodia o colocación?', 'If you are in HHS custody now: did the juvenile court order determine or change your custody or placement?'),
          why: t('Si ya no está bajo custodia de HHS, conteste No o pregunte a su abogado.', 'If you are no longer in HHS custody, answer No or ask your attorney.'),
          options: yesNo,
        },
      ],
    },
    {
      id: 'amerasian',
      part: 'Part 6',
      title: t('La madre y el padre', 'The mother and father'),
      questions: [
        {
          id: 'mother',
          kind: 'fields',
          formRef: 'Part 6 · Item 1 · Mother’s Full Name',
          showIf: amerasian,
          question: t('¿Cómo se llama la madre del/de la amerasiático(a)?', 'What is the Amerasian’s mother’s name?'),
          notice: {
            tone: 'legal',
            title: t('Quién puede ser amerasiático(a)', 'Who qualifies as an Amerasian'),
            body: t(
              'La persona debe haber nacido en Corea, Vietnam, Laos, Kampuchea o Tailandia después del 31 de diciembre de 1950 y antes del 22 de octubre de 1982, y su padre biológico debe haber sido ciudadano estadounidense. Quien presenta debe tener 18 años o más. Además hace falta un patrocinador de 21 años o más, ciudadano o residente, que firme el Formulario I-361.',
              'The person must have been born in Korea, Vietnam, Laos, Kampuchea or Thailand after December 31, 1950 and before October 22, 1982, and their biological father must have been a U.S. citizen. Whoever files must be 18 or older. A sponsor who is 21 or older and a citizen or permanent resident must also sign Form I-361.',
            ),
          },
          fields: nameFields('mother', 'Part 6 · Item 1'),
        },
        {
          id: 'mother.alive',
          kind: 'choice',
          formRef: 'Part 6 · Item 2.A',
          showIf: amerasian,
          question: t('¿La madre sigue viva?', 'Is the mother still alive?'),
          options: aliveOptions,
        },
        {
          id: 'motherAddress',
          kind: 'fields',
          formRef: 'Part 6 · Item 2.B',
          showIf: all(amerasian, is('mother.alive', 'yes')),
          question: t('Dirección de la madre', 'The mother’s address'),
          fields: anyAddress('mother', 'Part 6 · Item 2.B', { careOf: true, streetRequired: false }),
        },
        {
          id: 'motherDeath',
          kind: 'fields',
          formRef: 'Part 6 · Item 2.C',
          showIf: all(amerasian, is('mother.alive', 'no')),
          question: t('¿Cuándo falleció la madre?', 'When did the mother die?'),
          fields: [date('mother.death', 'Fecha de muerte (si la sabe)', 'Date of death (if known)', 'Part 6 · Item 2.C', false)],
        },
        {
          id: 'father',
          kind: 'fields',
          formRef: 'Part 6 · Items 3–5',
          showIf: amerasian,
          question: t('Datos del padre', 'About the father'),
          why: t(
            'Si puede, adjunte una declaración notariada del padre sobre la paternidad. Lo que no sepa, déjelo en blanco.',
            'If possible, attach a notarized statement from the father about parentage. Leave blank what you don’t know.',
          ),
          fields: [
            ...nameFields('father', 'Part 6 · Item 3'),
            date('father.dob', 'Fecha de nacimiento (si la sabe)', 'Date of birth (if known)', 'Part 6 · Item 4', false),
            { id: 'father.birthCountry', type: 'text', label: { es: 'País de nacimiento (si lo sabe)', en: 'Country of birth (if known)' }, formRef: 'Part 6 · Item 5' },
          ],
        },
        {
          id: 'father.alive',
          kind: 'choice',
          formRef: 'Part 6 · Item 6.A',
          showIf: amerasian,
          question: t('¿El padre sigue vivo?', 'Is the father still alive?'),
          options: aliveOptions,
        },
        {
          id: 'fatherAddress',
          kind: 'fields',
          formRef: 'Part 6 · Item 6.B',
          showIf: all(amerasian, is('father.alive', 'yes')),
          question: t('Dirección del padre', 'The father’s address'),
          fields: anyAddress('father', 'Part 6 · Item 6.B', { careOf: true, streetRequired: false }),
        },
        {
          id: 'fatherDeath',
          kind: 'fields',
          formRef: 'Part 6 · Item 6.C',
          showIf: all(amerasian, is('father.alive', 'no')),
          question: t('¿Cuándo falleció el padre?', 'When did the father die?'),
          fields: [date('father.death', 'Fecha de muerte (si la sabe)', 'Date of death (if known)', 'Part 6 · Item 6.C', false)],
        },
        {
          id: 'fatherPhones',
          kind: 'fields',
          formRef: 'Part 6 · Items 6.D–6.E',
          showIf: all(amerasian, (a) => a['father.alive'] !== 'no'),
          question: t('Teléfonos del padre (si los tiene)', 'The father’s phone numbers (if any)'),
          fields: [
            { id: 'father.phone', type: 'phone', label: { es: 'Teléfono de día', en: 'Daytime telephone' }, formRef: 'Part 6 · Item 6.D' },
            { id: 'father.workPhone', type: 'phone', label: { es: 'Teléfono del trabajo', en: 'Work telephone' }, formRef: 'Part 6 · Item 6.E' },
          ],
        },
        {
          id: 'father.service',
          kind: 'choice',
          formRef: 'Part 6 · Item 7',
          showIf: amerasian,
          question: t('Cuando el/la amerasiático(a) fue concebido(a), el padre…', 'At the time the Amerasian was conceived, the father…'),
          options: [
            { value: 'military', label: t('Estaba en las Fuerzas Armadas de EE.UU.', 'Was in the U.S. military') },
            { value: 'civilian', label: t('Era empleado civil de EE.UU. en el extranjero', 'Was a U.S. civilian employed abroad') },
            { value: 'neither', label: t('No era militar ni empleado civil en el extranjero', 'Was neither in the military nor a civilian employed abroad') },
          ],
        },
        {
          id: 'fatherMilitary',
          kind: 'fields',
          formRef: 'Part 6 · Items 7.A–7.B',
          showIf: all(amerasian, is('father.service', 'military')),
          question: t('El servicio militar del padre', 'The father’s military service'),
          fields: [
            {
              id: 'father.branch',
              type: 'select',
              required: true,
              label: { es: 'Rama', en: 'Branch of service' },
              formRef: 'Part 6 · Item 7.A',
              options: [
                { value: 'A', label: t('Ejército (Army)', 'Army') },
                { value: 'F', label: t('Fuerza Aérea (Air Force)', 'Air Force') },
                { value: 'N', label: t('Marina (Navy)', 'Navy') },
                { value: 'M', label: t('Infantería de Marina (Marine Corps)', 'Marine Corps') },
                { value: 'C', label: t('Guardia Costera (Coast Guard)', 'Coast Guard') },
              ],
            },
            { id: 'father.serviceNumber', type: 'text', label: { es: 'Número de servicio (si lo sabe)', en: 'Service number (if known)' }, formRef: 'Part 6 · Item 7.B', maxLength: 40 },
          ],
        },
        {
          id: 'fatherExplain',
          kind: 'fields',
          formRef: 'Part 6 · Item 7.C · Part 15',
          showIf: all(amerasian, is('father.service', 'civilian', 'neither')),
          question: t('Explique la situación del padre', 'Explain the father’s circumstances'),
          why: t(
            'Quién era, dónde y para quién trabajaba y cómo conoció a la madre. Va en la Parte 15.',
            'Who he was, where and for whom he worked and how he met the mother. It goes in Part 15.',
          ),
          fields: [{ id: 'father.explain', type: 'longText', required: true, label: { es: 'Explicación (en inglés)', en: 'Explanation' }, formRef: 'Part 15 · Part 6, Item 7' }],
        },
      ],
    },
    {
      id: 'religious',
      part: 'Part 9',
      title: t('Su trabajo religioso', 'Your religious work'),
      questions: [
        {
          id: 'rwJob',
          kind: 'fields',
          formRef: 'Part 9 · Item 6.A, 6.C–6.E',
          showIf: religious,
          question: t('El puesto que le ofrecen', 'The position offered'),
          why: t('Escriba en inglés. Si un texto es largo, va completo en la Parte 15.', 'Write in English. If a text is long, it goes in full in Part 15.'),
          fields: [
            { id: 'rw.title', type: 'text', required: true, label: { es: 'Título del puesto', en: 'Title of the position' }, formRef: 'Part 9 · Item 6.A', placeholder: 'Pastor' },
            { id: 'rw.duties', type: 'longText', required: true, label: { es: 'Sus tareas diarias, en detalle', en: 'Detailed description of your daily duties' }, formRef: 'Part 9 · Item 6.C' },
            { id: 'rw.qualifications', type: 'longText', required: true, label: { es: 'Por qué está calificado(a) para el puesto', en: 'Your qualifications for the position' }, formRef: 'Part 9 · Item 6.D' },
            { id: 'rw.compensation', type: 'longText', required: true, label: { es: 'El pago que recibirá (sueldo, vivienda, comida u otro)', en: 'Proposed salaried and/or non-salaried compensation' }, formRef: 'Part 9 · Item 6.E' },
          ],
        },
        {
          id: 'rwSite',
          kind: 'fields',
          formRef: 'Part 9 · Item 6.F',
          showIf: religious,
          question: t('¿Dónde trabajará?', 'Where will you be working?'),
          why: t('Si trabajará en más de un lugar, ponga el principal y los demás en la Parte 15.', 'If you will work in more than one place, give the main one here and the others in Part 15.'),
          fields: [
            { id: 'rw.site.company', type: 'text', required: true, label: { es: 'Nombre de la organización', en: 'Company name' }, formRef: 'Part 9 · Item 6.F · Company Name', maxLength: 34 },
            ...anyAddress('rw.site', 'Part 9 · Item 6.F'),
          ],
        },
        {
          id: 'rwEmployer',
          kind: 'fields',
          formRef: 'Part 9 · Item 1.A–1.E',
          showIf: religious,
          question: t('Números del empleador', 'Numbers about the employer'),
          why: t('Pídaselos a su empleador. Ponga 0 si es ninguno.', 'Ask your employer for them. Enter 0 for none.'),
          fields: [
            { id: 'rw.members', type: 'number', label: { es: 'Miembros de la organización', en: 'Members of the employer’s organization' }, formRef: 'Part 9 · Item 1.A', maxLength: 6 },
            { id: 'rw.employees', type: 'number', label: { es: 'Empleados en el lugar donde trabajará', en: 'Employees at the location where you will work' }, formRef: 'Part 9 · Item 1.B', maxLength: 6 },
            { id: 'rw.rWorkers', type: 'number', label: { es: 'Trabajadores religiosos extranjeros (inmigrantes o R) empleados ahora o en los últimos 5 años', en: 'Special immigrant or R religious workers employed now or in the past 5 years' }, formRef: 'Part 9 · Item 1.C', maxLength: 6 },
            { id: 'rw.petitions', type: 'number', label: { es: 'Peticiones I-360 e I-129 de trabajador religioso que presentó el empleador en los últimos 5 años', en: 'Religious worker I-360 and I-129 petitions the employer filed in the past 5 years' }, formRef: 'Part 9 · Item 1.D', maxLength: 6 },
            { id: 'rw.selfPetitions', type: 'number', label: { es: 'Peticiones I-360 de trabajador religioso que usted presentó en los últimos 5 años', en: 'Religious worker I-360 petitions you filed in the last 5 years' }, formRef: 'Part 9 · Item 1.E', maxLength: 6 },
          ],
        },
        {
          id: 'rw.priorR',
          kind: 'choice',
          formRef: 'Part 9 · Item 2',
          showIf: religious,
          question: t('¿Usted o un familiar dependiente estuvo en EE.UU. con visa de trabajador religioso (R) en los últimos 5 años?', 'Have you or a dependent family member been in the U.S. in Religious Worker (R) status in the last 5 years?'),
          options: yesNo,
        },
        {
          id: 'rwPriorStay',
          kind: 'fields',
          formRef: 'Part 9 · Item 3',
          showIf: all(religious, is('rw.priorR', 'yes')),
          question: t('Su estadía con visa R', 'Your stay in R status'),
          why: t('Solo el tiempo que estuvo de verdad en EE.UU. con visa R. Adjunte copias del I-94 o I-797.', 'Only the time you were actually in the U.S. in R status. Attach copies of the I-94 or I-797.'),
          fields: [
            date('rw.stayFrom', 'Desde', 'From', 'Part 9 · Item 3 · From', false),
            date('rw.stayTo', 'Hasta', 'To', 'Part 9 · Item 3 · To', false),
            { id: 'rw.otherStays', type: 'longText', label: { es: 'Otras estadías suyas y las de sus familiares (nombre y fechas, en inglés)', en: 'Your other stays and your family members’ (name and dates)' }, formRef: 'Part 15 · Part 9, Item 2' },
          ],
        },
        {
          id: 'rwStaff',
          kind: 'fields',
          formRef: 'Part 9 · Items 4–5',
          showIf: religious,
          question: t('Los demás empleados y la organización', 'The other employees and the organization'),
          fields: [
            { id: 'rw.staffPosition', type: 'text', label: { es: 'Puesto de otros empleados en el mismo lugar', en: 'Position of other employees at the same location' }, formRef: 'Part 9 · Item 4 · Position' },
            { id: 'rw.staffSummary', type: 'longText', label: { es: 'Qué responsabilidades tienen (en inglés)', en: 'Summary of their responsibilities' }, formRef: 'Part 9 · Item 4 · Summary' },
            { id: 'rw.orgRelationship', type: 'longText', label: { es: 'Relación entre la organización en EE.UU. y la de afuera de la que usted es miembro (si hay)', en: 'Relationship between the U.S. organization and the one abroad you belong to (if any)' }, formRef: 'Part 9 · Item 5' },
          ],
        },
        {
          id: 'rw.attest',
          kind: 'yesNoList',
          formRef: 'Part 9 · Items 7–13',
          showIf: religious,
          question: t('Lo que su empleador certifica', 'What your employer attests'),
          why: t('Contéstelo con su empleador: firmará esta parte. Si alguna respuesta es No, se explica en la Parte 15.', 'Answer it with your employer: they will sign this part. If any answer is No, it is explained in Part 15.'),
          items: [
            { id: 'rw.q7', formRef: 'Part 9 · Item 7', label: t('Es una organización religiosa sin fines de lucro de buena fe, o una afiliada a la denominación, exenta de impuestos según la sección 501(c)(3).', 'It is a bona fide nonprofit religious organization, or one affiliated with the denomination, tax exempt under section 501(c)(3).') },
            { id: 'rw.q8', formRef: 'Part 9 · Item 8', label: t('Puede y quiere pagarle lo suficiente para que usted y su familia no dependan de ayuda pública.', 'It is willing and able to compensate you so that you and your dependents will not become a public charge.') },
            { id: 'rw.q9', formRef: 'Part 9 · Item 9', label: t('El dinero de su pago no viene de usted (salvo donaciones o diezmos razonables).', 'The funds for your compensation do not come from you (except reasonable donations or tithing).') },
            { id: 'rw.q10', formRef: 'Part 9 · Item 10', label: t('Usted no tendrá otro empleo no religioso, y el empleador le pagará.', 'You will not engage in secular employment, and the employer will compensate you.') },
            { id: 'rw.q11', formRef: 'Part 9 · Item 11', label: t('El puesto es de tiempo completo, con un promedio de por lo menos 35 horas por semana.', 'The position is full time, at least an average of 35 hours per week.') },
            { id: 'rw.q12', formRef: 'Part 9 · Item 12', label: t('Usted ha sido trabajador(a) religioso(a) por lo menos los 2 años antes de presentar y está calificado(a).', 'You have been a religious worker for at least the 2 years before filing and are qualified.') },
            { id: 'rw.q13', formRef: 'Part 9 · Item 13', label: t('Usted ha sido miembro de la denominación del empleador por lo menos los 2 años antes de presentar.', 'You have been a member of the employer’s denomination for at least the 2 years before filing.') },
          ],
        },
        {
          id: 'rwAttestExplain',
          kind: 'fields',
          formRef: 'Part 9 · Items 7–13 · Part 15',
          showIf: all(religious, rwNo),
          question: t('Explique las respuestas de No', 'Explain the No answers'),
          fields: [{ id: 'rw.attestExplain', type: 'longText', required: true, label: { es: 'Explicación (en inglés)', en: 'Explanation' }, formRef: 'Part 15 · Part 9, Items 7–13' }],
        },
        {
          id: 'rw.taxBasis',
          kind: 'choice',
          formRef: 'Part 9 · Item 7.A–7.C',
          showIf: all(religious, is('rw.q7', 'yes')),
          question: t('¿Qué prueba de la exención de impuestos adjuntará?', 'Which proof of tax exemption will you attach?'),
          options: [
            { value: 'A', label: t('Carta vigente del IRS que dice que la organización está exenta', 'A current IRS determination letter that the organization is tax exempt') },
            { value: 'B', label: t('Carta vigente del IRS de exención de grupo', 'A current IRS letter recognizing it under a group tax exemption') },
            { value: 'C', label: t('Es una organización afiliada a la denominación (necesita más documentos y la certificación de la denominación)', 'It is an organization affiliated with the denomination (needs more documents and the denomination certification)') },
          ],
        },
        {
          id: 'rw.affiliatedDocs',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 9 · Item 7.C.(1)–(4)',
          showIf: all(religious, is('rw.q7', 'yes'), is('rw.taxBasis', 'C')),
          question: t('¿Cuáles de estos documentos adjunta? Marque todos.', 'Which of these documents are you attaching? Select all.'),
          why: t('Hacen falta los cuatro.', 'All four are required.'),
          options: [
            { value: '1', label: t('Carta vigente del IRS de exención de impuestos', 'A current IRS tax-exemption determination letter') },
            { value: '2', label: t('Documento que muestra la naturaleza y el propósito religioso (por ejemplo, el acta constitutiva)', 'Documentation of the religious nature and purpose (for example, the organizing instrument)') },
            { value: '3', label: t('Material de la organización (folletos, artículos, calendarios) sobre sus actividades religiosas', 'Organizational literature (brochures, articles, calendars) about its religious activities') },
            { value: '4', label: t('La certificación de la denominación de este formulario, firmada', 'The religious denomination certification in this form, signed') },
          ],
        },
        {
          id: 'rwSigner',
          kind: 'fields',
          formRef: 'Part 9 · Items 15–16',
          showIf: religious,
          question: t('¿Quién firma por su empleador?', 'Who signs for your employer?'),
          why: t('Un(a) representante autorizado(a) del empleador firma a mano el Ítem 14.', 'An authorized official of the employer signs Item 14 by hand.'),
          fields: [
            ...nameFields('rw.signer', 'Part 9 · Item 15'),
            { id: 'rw.signer.title', type: 'text', required: true, label: { es: 'Cargo (en inglés)', en: 'Title' }, formRef: 'Part 9 · Item 16', placeholder: 'Senior Pastor' },
          ],
        },
        {
          id: 'rwEmployerAddress',
          kind: 'fields',
          formRef: 'Part 9 · Items 17–20',
          showIf: religious,
          question: t('Dirección y contacto del empleador', 'The employer’s address and contact'),
          fields: [
            { id: 'rw.employer.name', type: 'text', required: true, label: { es: 'Nombre del empleador', en: 'Employer or organization name' }, formRef: 'Part 9 · Item 17 · Employer/Organization Name', maxLength: 34 },
            ...usAddress('rw.employer', 'Part 9 · Item 17'),
            { id: 'rw.employer.phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime telephone' }, formRef: 'Part 9 · Item 18' },
            { id: 'rw.employer.fax', type: 'phone', label: { es: 'Fax (si tiene)', en: 'Fax (if any)' }, formRef: 'Part 9 · Item 19' },
            { id: 'rw.employer.email', type: 'email', label: { es: 'Correo electrónico (si tiene)', en: 'Email (if any)' }, formRef: 'Part 9 · Item 20' },
          ],
        },
        {
          id: 'rwDenomination',
          kind: 'fields',
          formRef: 'Part 9 · Religious Denomination Certification · Items 22–23',
          showIf: all(religious, is('rw.q7', 'yes'), is('rw.taxBasis', 'C')),
          question: t('La denominación religiosa', 'The religious denomination'),
          why: t('Un(a) representante de la denominación certifica que su empleador está afiliado y firma a mano el Ítem 21.', 'A representative of the denomination certifies that your employer is affiliated and signs Item 21 by hand.'),
          fields: [
            { id: 'rw.denomination', type: 'text', required: true, label: { es: 'Nombre de la denominación', en: 'Religious denomination' }, formRef: 'Part 9 · Religious Denomination Certification · Religious Denomination', maxLength: 34 },
            ...nameFields('rw.rd', 'Part 9 · Item 22'),
            { id: 'rw.rd.title', type: 'text', required: true, label: { es: 'Cargo de quien firma (en inglés)', en: 'Title of the signatory' }, formRef: 'Part 9 · Item 23' },
          ],
        },
        {
          id: 'rwAttesting',
          kind: 'fields',
          formRef: 'Part 9 · Items 24–29',
          showIf: all(religious, is('rw.q7', 'yes'), is('rw.taxBasis', 'C')),
          question: t('La organización religiosa que certifica, dentro de la denominación', 'The attesting religious organization within the denomination'),
          fields: [
            { id: 'rw.att.name', type: 'text', required: true, label: { es: 'Nombre', en: 'Name' }, formRef: 'Part 9 · Item 24', maxLength: 34 },
            ...usAddress('rw.att', 'Part 9 · Item 25'),
            { id: 'rw.att.phone', type: 'phone', label: { es: 'Teléfono de día', en: 'Daytime telephone' }, formRef: 'Part 9 · Item 26' },
            { id: 'rw.att.fax', type: 'phone', label: { es: 'Fax (si tiene)', en: 'Fax (if any)' }, formRef: 'Part 9 · Item 27' },
            { id: 'rw.att.email', type: 'email', label: { es: 'Correo electrónico (si tiene)', en: 'Email (if any)' }, formRef: 'Part 9 · Item 28' },
            { id: 'rw.att.irs', type: 'text', label: { es: 'Número de impuestos del IRS (EIN)', en: 'IRS tax number' }, formRef: 'Part 9 · Item 29', maxLength: 34 },
          ],
        },
      ],
    },
    {
      id: 'family',
      part: 'Part 5',
      title: t('Su esposo(a) e hijos', 'Your spouse and children'),
      questions: [
        {
          id: 'childrenFiled',
          kind: 'choice',
          formRef: 'Part 5 · Item 1',
          showIf: vawaSpouse,
          question: t('¿Alguno de sus hijos presentó su propia autopetición VAWA?', 'Have any of your children filed their own VAWA self-petitions?'),
          options: yesNo,
        },
        {
          id: 'relative.more0',
          kind: 'choice',
          formRef: 'Part 5 · Items 2–10',
          question: t('¿Tiene esposo(a) o hijos?', 'Do you have a spouse or children?'),
          why: t('Ponga a su esposo(a) actual y a todos sus hijos solteros menores de 21, vivan donde vivan. Si tiene dudas sobre a quién incluir, pregunte a su abogado.', 'List your current spouse and all your unmarried children under 21, wherever they live. If you are unsure who to include, ask your attorney.'),
          options: yesNo,
        },
        ...rows({
          max: 9,
          id: 'relative',
          first: is('relative.more0', 'yes'),
          question: (i) => (i === 1 ? t('Primera persona (si tiene esposo(a), póngalo/a aquí)', 'First person (if you have a spouse, list them here)') : t('Otro hijo o hija', 'Another child')),
          more: t('¿Tiene otro hijo o hija?', 'Do you have another child?'),
          formRef: 'Part 5',
          fields: (i) => [
            ...nameFields(`relative${i}`, `Part 5 · Item ${i + 1}`),
            date(`relative${i}.dob`, 'Fecha de nacimiento', 'Date of birth', `Part 5 · Item ${i + 1} · Date of Birth`),
            { id: `relative${i}.birthCountry`, type: 'text', required: true, label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: `Part 5 · Item ${i + 1} · Country of Birth` },
            ...(i === 1
              ? [
                  {
                    id: 'relative1.relationship',
                    type: 'select' as const,
                    required: true,
                    label: { es: 'Relación', en: 'Relationship' },
                    formRef: 'Part 5 · Item 2 · Relationship',
                    options: [
                      { value: 'S', label: t('Esposo(a)', 'Spouse') },
                      { value: 'C', label: t('Hijo(a)', 'Child') },
                    ],
                  },
                ]
              : []),
            { id: `relative${i}.aNumber`, type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: `Part 5 · Item ${i + 1} · A-Number` },
          ],
          overflow: { es: 'Si son más de 9, escriba los demás a mano en la Parte 15.', en: 'If there are more than 9, write the rest by hand in Part 15.' },
        }),
      ],
    },
    {
      id: 'processing',
      part: 'Part 4',
      title: t('Cómo seguirá su trámite', 'Processing information'),
      questions: [
        {
          id: 'processingPath',
          kind: 'choice',
          formRef: 'Part 4 · Items 1 and 7',
          question: t('¿Dónde va a pedir la residencia cuando aprueben esta petición?', 'Where will you apply for your green card once this petition is approved?'),
          why: t('Si está en EE.UU. y puede ajustar su estatus, puede enviar el I-485 junto con esta petición. Si no, lo hará en un consulado de EE.UU. afuera.', 'If you are in the U.S. and can adjust status, you can send Form I-485 with this petition. Otherwise you will apply at a U.S. consulate abroad.'),
          options: [
            { value: 'withI485', label: t('En EE.UU., y envío el I-485 junto con esta petición', 'In the U.S., and I am attaching Form I-485 to this petition') },
            { value: 'later', label: t('En EE.UU., pero enviaré el I-485 después', 'In the U.S., but I will file Form I-485 later') },
            { value: 'consulate', label: t('En un consulado de EE.UU. en otro país', 'At a U.S. consulate abroad') },
          ],
        },
        {
          id: 'consulate',
          kind: 'fields',
          formRef: 'Part 4 · Item 1 · U.S. Consulate',
          showIf: is('processingPath', 'consulate'),
          question: t('¿En qué consulado prefiere hacer el trámite?', 'Which consulate do you prefer?'),
          fields: [
            { id: 'consulate.city', type: 'text', required: true, label: { es: 'Ciudad', en: 'City or town' }, formRef: 'Part 4 · Item 1.A', placeholder: 'Ciudad Juarez', maxLength: 20 },
            { id: 'consulate.country', type: 'text', required: true, label: { es: 'País', en: 'Country' }, formRef: 'Part 4 · Item 1.B', placeholder: 'Mexico' },
          ],
        },
        {
          id: 'foreign',
          kind: 'fields',
          formRef: 'Part 4 · Item 2 · Foreign Address',
          showIf: (a) => /^(us|usa|u\.s\.a?\.?|united states( of america)?|estados unidos)$/i.test(String(a['mailing.country'] ?? '').trim()),
          question: t('Su dirección en otro país', 'Your address abroad'),
          why: t('Como su dirección es en EE.UU., USCIS pide la de afuera. Si ya no tiene una, ponga solo la ciudad y el país donde vivió por última vez.', 'Since your address is in the U.S., USCIS asks for one abroad. If you no longer have one, give only the city and country where you last lived.'),
          fields: [
            { id: 'foreign.street', type: 'text', label: { es: 'Número y calle', en: 'Street number and name' }, formRef: 'Part 4 · Item 2.B · Street Number and Name', maxLength: 34 },
            { id: 'foreign.unit', type: 'unit', label: { es: 'Apartamento, suite o piso', en: 'Apartment, suite or floor' }, formRef: 'Part 4 · Item 2.B · Apt. / Ste. / Flr.' },
            { id: 'foreign.city', type: 'text', label: { es: 'Ciudad', en: 'City or town' }, formRef: 'Part 4 · Item 2.B · City or Town', maxLength: 20 },
            { id: 'foreign.province', type: 'text', label: { es: 'Provincia o estado', en: 'Province' }, formRef: 'Part 4 · Item 2.B · Province', maxLength: 20 },
            { id: 'foreign.postal', type: 'text', label: { es: 'Código postal', en: 'Postal code' }, formRef: 'Part 4 · Item 2.B · Postal Code', maxLength: 9 },
            { id: 'foreign.country', type: 'text', label: { es: 'País', en: 'Country' }, formRef: 'Part 4 · Item 2.B · Country' },
          ],
        },
        {
          id: 'sexQ',
          kind: 'fields',
          formRef: 'Part 4 · Item 3',
          question: t('¿Cuál es su sexo?', 'What is your sex?'),
          fields: [sexField('sex', 'Part 4 · Item 3')],
        },
        {
          id: 'otherFilings',
          kind: 'choice',
          formRef: 'Part 4 · Item 4.A',
          question: t('¿Presenta otras solicitudes junto con esta (por ejemplo I-485, I-765, I-131)?', 'Are you filing any other applications with this one (for example I-485, I-765, I-131)?'),
          options: yesNo,
        },
        {
          id: 'otherFilingsCount',
          kind: 'fields',
          formRef: 'Part 4 · Item 4.B',
          showIf: is('otherFilings', 'yes'),
          question: t('¿Cuántas?', 'How many?'),
          fields: [{ id: 'otherFilings.count', type: 'number', required: true, label: { es: 'Número de solicitudes', en: 'Number of applications' }, formRef: 'Part 4 · Item 4.B', maxLength: 5 }],
        },
        {
          id: 'removal',
          kind: 'choice',
          formRef: 'Part 4 · Item 5',
          question: t('¿Está usted en un proceso de deportación (corte de inmigración)?', 'Are you in removal proceedings (immigration court)?'),
          notice: {
            tone: 'legal',
            title: t('Pregunta importante', 'Important question'),
            body: t('Si tiene o tuvo un caso en corte de inmigración, o una orden de deportación, hable con un abogado antes de presentar: puede cambiar dónde y cómo se pide la residencia.', 'If you have or had an immigration court case, or a removal order, talk to an attorney before filing: it can change where and how you apply for your green card.'),
          },
          options: yesNo,
        },
        {
          id: 'workedWithout',
          kind: 'choice',
          formRef: 'Part 4 · Item 6',
          showIf: not(sij),
          question: t('¿Ha trabajado alguna vez en EE.UU. sin permiso?', 'Have you ever worked in the U.S. without permission?'),
          options: yesNo,
        },
        {
          id: 'processingExplain',
          kind: 'fields',
          formRef: 'Part 4 · Items 5–6 · Part 15',
          showIf: (a) => a.removal === 'yes' || (!sij(a) && a.workedWithout === 'yes'),
          question: t('Explique sus respuestas de Sí', 'Explain your Yes answers'),
          why: t('Para la corte: la ciudad de la corte, su estado y fechas. Para el trabajo: dónde, cuándo y que no tenía permiso. Va en la Parte 15.', 'For court: the court’s city, the status and dates. For work: where, when, and that you had no permission. It goes in Part 15.'),
          fields: [{ id: 'processing.explain', type: 'longText', required: true, label: { es: 'Explicación (en inglés)', en: 'Explanation' }, formRef: 'Part 15 · Part 4, Items 5–6' }],
        },
      ],
    },
    {
      id: 'statement',
      part: 'Part 11 · Part 12',
      title: t('Declaración y contacto', 'Statement and contact'),
      questions: [
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 11 (or Part 12) · Item 1 · Petitioner’s Statement Regarding the Interpreter',
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          why: t('Si presenta por otra persona, conteste por usted: usted firma.', 'If you are filing for another person, answer for yourself: you sign.'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leerá', 'No, an interpreter will read it to me') },
          ],
        },
        {
          id: 'interpreterLanguage',
          kind: 'fields',
          formRef: 'Part 11 (or Part 12) · Item 1.B',
          showIf: is('readsEnglish', 'B'),
          question: t('¿En qué idioma se lo leerán?', 'What language will it be read in?'),
          fields: [{ id: 'fluentLanguage', type: 'text', required: true, label: { es: 'Idioma', en: 'Language' }, formRef: 'Part 11 (or Part 12) · Item 1.B', placeholder: 'Spanish', maxLength: 40 }],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 11 (or Part 12) · Item 2 · Petitioner’s Statement Regarding the Preparer',
          question: t('¿Alguien más (no usted) preparó esta petición?', 'Did someone else prepare this petition for you?'),
          why: t('Si es así, sus datos van en la Parte 14 y esa persona la firma a mano.', 'If so, their details go in Part 14 and that person signs it by hand.'),
          options: yesNo,
        },
        {
          id: 'preparerName',
          kind: 'fields',
          formRef: 'Part 11 (or Part 12) · Item 2',
          showIf: is('preparer', 'yes'),
          question: t('¿Quién la preparó?', 'Who prepared it?'),
          fields: [{ id: 'preparer.name', type: 'text', required: true, label: { es: 'Nombre del preparador', en: 'Preparer’s name' }, formRef: 'Part 11 (or Part 12) · Item 2', maxLength: 50 }],
        },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 11 · Items 3–5 (or Part 12 · Items 5–7) · Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          why: t(
            'Si presenta por otra persona, ponga sus propios datos: usted firma. En casos VAWA, dé solo un teléfono y correo seguros, a los que la persona que le maltrató no tenga acceso.',
            'If you are filing for another person, give your own details: you sign. In VAWA cases, give only a safe phone and email that your abuser cannot access.',
          ),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 11 · Item 3 (or Part 12 · Item 5)', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 11 · Item 4 (or Part 12 · Item 6)' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 11 · Item 5 (or Part 12 · Item 7)' },
          ],
        },
      ],
    },
    assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 13', preparerPart: 'Part 14' }),
  ],
};
