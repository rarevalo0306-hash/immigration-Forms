import type { Answers, FormDefinition } from './types';
import type { T } from '../i18n';
import { all, anyAddress, date, is, nameFields, rows, sexField, yesNo } from './helpers';

// Questions follow USCIS Form I-360, Petition for Amerasian, Widow(er), or Special Immigrant,
// edition 01/20/25. The PDF mapping lives in src/pdf/i360Pdf.ts.
//
// Scope: the three classifications people most often file for themselves:
// - Widow(er) of a U.S. citizen (Part 2, Item 1.B; Part 7),
// - VAWA self-petitioning spouse, child or parent of an abusive U.S. citizen or permanent resident
//   (Part 2, Items 1.I, 1.J and 1.K; Part 10),
// - Special Immigrant Juvenile (Part 2, Item 1.C; Part 8).
// Out of scope, left blank: Amerasians (Part 6), religious workers (Part 9) and every other
// special immigrant classification (Part 2, Items 1.A, 1.D-1.H, 1.L-1.P: Panama Canal, physicians,
// G-4/NATO-6, armed forces, Afghan/Iraqi translators and employees, broadcasters, "other").
// Also left for hand: Part 1, Item 5 (IRS tax number) and the organization name, which are for
// organizations; Part 12 (filing for another person or for an organization); the interpreter's and
// preparer's Parts 13 and 14; signatures and dates; the attorney box and USCIS-only areas.

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
export const widow = is('classification', 'B');
export const sij = is('classification', 'C');
export const vawa = is('classification', 'I', 'J', 'K');
const vawaSpouse = is('classification', 'I');
const selfPetitioner = (a: Answers) => vawa(a) || sij(a);

const HOTLINE = t(
  'Si está en peligro, llame al 911. La Línea Nacional contra la Violencia Doméstica atiende en español, gratis y en confianza, las 24 horas: 1-800-799-7233 (o envíe START al 88788). Ellos también le pueden recomendar abogados u organizaciones que ayudan gratis con casos VAWA.',
  'If you are in danger, call 911. The National Domestic Violence Hotline is free, confidential and open 24/7, in Spanish too: 1-800-799-7233 (or text START to 88788). They can also refer you to free legal help for VAWA cases.',
);

export const i360: FormDefinition = {
  id: 'i-360',
  number: 'I-360',
  edition: I360_EDITION,
  title: t('Petición de viudo(a), VAWA o joven inmigrante especial', 'Petition for Amerasian, Widow(er), or Special Immigrant'),
  summary: {
    es: 'Pida la residencia por su cuenta si es viudo(a) de un ciudadano, si sufrió abuso de un familiar ciudadano o residente (VAWA), o si es un joven con orden de una corte juvenil (SIJ).',
    en: 'Petition for yourself as the widow(er) of a U.S. citizen, as an abused family member of a citizen or resident (VAWA), or as a young person with a juvenile court order (SIJ).',
  },
  intro: {
    es: 'El I-360 sirve para muchos casos. Esta guía cubre solo los tres que la gente presenta por sí misma: viudo(a) de un ciudadano estadounidense, la autopetición VAWA (esposo(a), hijo(a) o padre/madre que sufrió abuso de un ciudadano o residente permanente) y el Joven Inmigrante Especial (SIJ). No cubre a trabajadores religiosos, amerasiáticos, médicos, traductores o empleados afganos o iraquíes ni otras categorías: esas partes quedan en blanco. Primero le preguntamos su categoría y luego solo lo que esa categoría necesita. Son casos legales: le recomendamos hablar con un abogado o una organización acreditada antes de presentar.',
    en: 'Form I-360 covers many cases. This guide covers only the three people file for themselves: widow(er) of a U.S. citizen, the VAWA self-petition (abused spouse, child or parent of a U.S. citizen or permanent resident) and Special Immigrant Juvenile (SIJ). It does not cover religious workers, Amerasians, physicians, Afghan or Iraqi translators or employees, or other classifications: those parts stay blank. We ask your classification first and then only what it needs. These are legal cases: we recommend talking to an attorney or accredited organization before filing.',
  },
  minutes: 45,
  pdf: {
    path: 'forms/i-360.pdf',
    fileName: 'I-360-filled.pdf',
    load: () => import('../pdf/i360Pdf').then((m) => m.fillI360),
    signHere: { es: 'Parte 11, Ítem 6', en: 'Part 11, Item 6' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-360 que la edición {edition} sigue vigente, la tarifa y la dirección donde se envía su categoría.',
      'Viudo(a): adjunte el acta de matrimonio, el acta de defunción de su cónyuge, prueba de que era ciudadano(a), prueba de que terminaron matrimonios anteriores y pruebas de que el matrimonio era real (renta, cuentas, hijos, fotos). Presente dentro de los 2 años de la muerte.',
      'VAWA: adjunte su declaración personal sobre el abuso, pruebas del abuso (reportes de policía, órdenes de protección, cartas de consejeros o refugios, fotos), prueba del parentesco y del estatus de quien le maltrató, prueba de que vivieron juntos y de su buen carácter moral. Los casos VAWA son confidenciales y se envían a una dirección especial: nunca use la de los demás I-360.',
      'SIJ: adjunte copia de la orden de la corte juvenil con las determinaciones requeridas, su acta de nacimiento y prueba de su edad. Debe presentar antes de cumplir 21 años. SIJ no paga tarifa.',
      'Si adjunta un I-485, póngalo junto con este formulario en el mismo paquete.',
      'Imprima el PDF y firme la Parte 11, Ítem 6, a mano con tinta negra. Si un intérprete o preparador le ayudó, ellos llenan y firman a mano las Partes 13 y 14.',
      'Si una explicación no cupo en la Parte 15, siga en una hoja aparte con su nombre, la página, parte e ítem, y fírmela.',
    ],
    en: [
      'Check at uscis.gov/i-360 that edition {edition} is still current, the fee and the filing address for your classification.',
      'Widow(er): attach your marriage certificate, your spouse’s death certificate, proof of their citizenship, proof that prior marriages ended and evidence the marriage was real (lease, accounts, children, photos). File within 2 years of the death.',
      'VAWA: attach your personal statement about the abuse, evidence of the abuse (police reports, protective orders, letters from counselors or shelters, photos), proof of the relationship and of the abuser’s status, proof you lived together and of your good moral character. VAWA cases are confidential and go to a special address: never use the one for other I-360s.',
      'SIJ: attach a copy of the juvenile court order with the required findings, your birth certificate and proof of age. You must file before you turn 21. SIJ has no filing fee.',
      'If you attach an I-485, send it together with this form in the same package.',
      'Print the PDF and sign Part 11, Item 6, by hand in black ink. If an interpreter or preparer helped you, they complete and sign Parts 13 and 14 by hand.',
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
          why: t('Elija solo una. Si su caso es otro (trabajador religioso, amerasiático, médico, traductor afgano o iraquí, etc.), esta guía no lo cubre.', 'Choose only one. If your case is another one (religious worker, Amerasian, physician, Afghan or Iraqi translator, etc.), this guide does not cover it.'),
          notice: {
            tone: 'legal',
            title: t('Hable con un abogado', 'Talk to an attorney'),
            body: t(
              'Cada categoría tiene requisitos estrictos y un error puede costarle el caso. Busque un abogado de inmigración o una organización acreditada por el Departamento de Justicia; muchas ayudan gratis en casos VAWA y SIJ.',
              'Each classification has strict requirements and a mistake can cost you the case. Look for an immigration attorney or a Department of Justice–accredited organization; many help for free with VAWA and SIJ cases.',
            ),
          },
          options: [
            { value: 'B', label: t('Viudo(a) de un ciudadano estadounidense', 'Widow(er) of a U.S. citizen') },
            { value: 'I', label: t('VAWA: esposo(a) que sufrió abuso de su cónyuge ciudadano o residente permanente', 'VAWA: abused spouse of a U.S. citizen or permanent resident') },
            { value: 'J', label: t('VAWA: hijo(a) que sufrió abuso de su padre o madre ciudadano o residente permanente', 'VAWA: abused child of a U.S. citizen or permanent resident') },
            { value: 'K', label: t('VAWA: padre o madre que sufrió abuso de su hijo(a) ciudadano', 'VAWA: abused parent of a U.S. citizen son or daughter') },
            { value: 'C', label: t('Joven Inmigrante Especial (SIJ), con orden de una corte juvenil', 'Special Immigrant Juvenile (SIJ), with a juvenile court order') },
          ],
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
          why: t('Escríbalo como en su pasaporte o acta de nacimiento.', 'Write it as it appears on your passport or birth certificate.'),
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
          showIf: widow,
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
      part: 'Part 11',
      title: t('Declaración y contacto', 'Statement and contact'),
      questions: [
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 11 · Item 1 · Petitioner’s Statement Regarding the Interpreter',
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leerá', 'No, an interpreter will read it to me') },
          ],
        },
        {
          id: 'interpreterLanguage',
          kind: 'fields',
          formRef: 'Part 11 · Item 1.B',
          showIf: is('readsEnglish', 'B'),
          question: t('¿En qué idioma se lo leerán?', 'What language will it be read in?'),
          fields: [{ id: 'fluentLanguage', type: 'text', required: true, label: { es: 'Idioma', en: 'Language' }, formRef: 'Part 11 · Item 1.B', placeholder: 'Spanish', maxLength: 40 }],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 11 · Item 2 · Petitioner’s Statement Regarding the Preparer',
          question: t('¿Alguien más (no usted) preparó esta petición?', 'Did someone else prepare this petition for you?'),
          why: t('Si es así, esa persona también debe llenar y firmar la Parte 14 a mano.', 'If so, that person must also complete and sign Part 14 by hand.'),
          options: yesNo,
        },
        {
          id: 'preparerName',
          kind: 'fields',
          formRef: 'Part 11 · Item 2',
          showIf: is('preparer', 'yes'),
          question: t('¿Quién la preparó?', 'Who prepared it?'),
          fields: [{ id: 'preparer.name', type: 'text', required: true, label: { es: 'Nombre del preparador', en: 'Preparer’s name' }, formRef: 'Part 11 · Item 2', maxLength: 50 }],
        },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 11 · Items 3–5 · Petitioner’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          why: t('En casos VAWA, dé solo un teléfono y correo seguros, a los que la persona que le maltrató no tenga acceso.', 'In VAWA cases, give only a safe phone and email that your abuser cannot access.'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 11 · Item 3', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 11 · Item 4' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 11 · Item 5' },
          ],
        },
      ],
    },
  ],
};
