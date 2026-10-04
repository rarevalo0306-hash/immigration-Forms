import type { Answers, Field, FormDefinition, Option, Question } from './types';
import type { T } from '../i18n';
import { all, anyAddress, date, is, nameFields, rows, sexField, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';

// Questions follow USCIS Form N-600, Application for Certificate of Citizenship, edition 01/20/25.
// The PDF mapping lives in src/pdf/n600Pdf.ts. Part 2 is always about the child, whether the child
// or a parent fills it in; the U.S. citizen parent is "parent1" (Part 3) and the other parent
// "parent2" (Part 4). The interpreter's Part 9 and the preparer's Part 10 are filled from the shared
// questions in src/forms/assistance.ts; every signature and its date is left for hand.

export const N600_EDITION = '01/20/25';

const t = (es: string, en: string): T => ({ es, en });

const text = (id: string, es: string, en: string, formRef: string, opts: Partial<Field> = {}): Field => ({ id, type: 'text', required: true, label: { es, en }, formRef, ...opts });

const options = (pairs: [string, string, string][]): Option[] => pairs.map(([value, es, en]) => ({ value, label: t(es, en) }));

/** Marital status, by the PDF's export values (E is "Separated"). */
export const MARITAL: Option[] = options([
  ['S', 'Soltero(a), nunca casado(a)', 'Single, never married'],
  ['M', 'Casado(a)', 'Married'],
  ['D', 'Divorciado(a)', 'Divorced'],
  ['W', 'Viudo(a)', 'Widowed'],
  ['E', 'Separado(a)', 'Separated'],
  ['A', 'Matrimonio anulado', 'Marriage annulled'],
  ['O', 'Otro', 'Other'],
]);

/** How a parent is a U.S. citizen. */
const CITIZEN_BY: Option[] = options([
  ['birth', 'Nació en EE.UU.', 'Birth in the United States'],
  ['acquisition', 'Por la naturalización de sus padres, después de nacer', 'Acquisition after birth through naturalization of parent(s)'],
  ['abroad', 'Nació en el extranjero de padre o madre ciudadano', 'Birth abroad to U.S. citizen parent(s)'],
  ['naturalization', 'Se naturalizó', 'Naturalization'],
]);

const SPOUSE_STATUS: Option[] = options([
  ['US', 'Ciudadano(a) de EE.UU.', 'U.S. citizen'],
  ['L', 'Residente permanente', 'Lawful permanent resident'],
  ['O', 'Otro', 'Other'],
]);

/** Whether the child was born before October 10, 1952 (Item 25 applies only then). */
export const bornBefore1952 = (a: Answers) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(a.dob ?? ''));
  if (!m) return false;
  return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2])) < new Date(1952, 9, 10);
};

/** Parts 3 and 4: a parent, how they are a citizen, and their marriage. */
function parentQuestions(p: string, part: string, first: { citizenItem: number; lostItem: number; maritalItem: number; spouseItem: number }, shown: (a: Answers) => boolean = () => true, isOther = false): Question[] {
  const ref = (n: number | string) => `${part} · Item ${n}`;
  const citizen = isOther ? all(shown, is(`${p}.isCitizen`, 'yes')) : shown;
  const married = all(shown, is(`${p}.marital`, 'M'));
  const spouse = all(married, is(`${p}.spouseIsParent`, 'no'));
  return [
    {
      id: p,
      kind: 'fields',
      formRef: `${part} · Items 1–${isOther ? 5 : 4}`,
      showIf: shown,
      question: isOther ? t('Su otro padre o madre', 'Your other parent') : t('Su padre o madre ciudadano de EE.UU.', 'Your U.S. citizen parent'),
      fields: [
        ...nameFields(p, ref(1)),
        date(`${p}.dob`, 'Fecha de nacimiento', 'Date of birth', ref(2)),
        {
          id: `${p}.role`,
          type: 'select',
          required: true,
          label: { es: 'Es su…', en: 'This parent is your' },
          formRef: ref(3),
          options: options([
            ['mother', 'Madre', 'Mother'],
            ['father', 'Padre', 'Father'],
          ]),
        },
        text(`${p}.birthCountry`, 'País de nacimiento', 'Country of birth', ref(4)),
        ...(isOther ? [text(`${p}.citizenship`, 'País de ciudadanía o nacionalidad', 'Country of citizenship or nationality', ref(5))] : []),
      ],
    },
    {
      id: `${p}Address`,
      kind: 'fields',
      formRef: `${ref(isOther ? 6 : 5)} · Current Physical Address`,
      showIf: shown,
      question: t('¿Dónde vive ahora?', 'Where does this parent live now?'),
      why: t('Si falleció, escriba en la calle "Deceased" y la fecha de fallecimiento, y en ciudad y país los de su último domicilio.', 'If deceased, write "Deceased" and the date of death as the street, and the last city and country.'),
      fields: anyAddress(`${p}.address`, ref(isOther ? 6 : 5)),
    },
    ...(isOther
      ? [{ id: `${p}.isCitizen`, kind: 'choice', formRef: ref(7), showIf: shown, question: t('¿Es ciudadano(a) de EE.UU.?', 'Is this parent a U.S. citizen?'), options: yesNo } as Question]
      : []),
    {
      id: `${p}.citizenBy`,
      kind: 'choice',
      formRef: ref(first.citizenItem),
      showIf: citizen,
      question: t('¿Cómo es ciudadano(a)?', 'How is this parent a U.S. citizen?'),
      options: CITIZEN_BY,
    },
    {
      id: `${p}Certificate`,
      kind: 'fields',
      formRef: ref(first.citizenItem),
      showIf: all(citizen, is(`${p}.citizenBy`, 'acquisition', 'abroad')),
      question: t('Su certificado de ciudadanía', 'Their Certificate of Citizenship'),
      fields: [
        text(`${p}.certificate`, 'Número del certificado de ciudadanía (si tiene)', 'Certificate of Citizenship number (if any)', ref(first.citizenItem), { required: false, maxLength: 20 }),
        { id: `${p}.aNumber`, type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: ref(first.citizenItem) },
      ],
    },
    {
      id: `${p}Naturalization`,
      kind: 'fields',
      formRef: `${ref(first.citizenItem)} · Naturalization`,
      showIf: all(citizen, is(`${p}.citizenBy`, 'naturalization')),
      question: t('Su naturalización', 'Their naturalization'),
      fields: [
        text(`${p}.natPlace`, 'Corte u oficina de USCIS donde se naturalizó', 'Place of naturalization (court or USCIS office)', ref(first.citizenItem)),
        text(`${p}.natCity`, 'Ciudad', 'City or town', ref(first.citizenItem), { maxLength: 20 }),
        { id: `${p}.natState`, type: 'state', label: { es: 'Estado', en: 'State' }, formRef: ref(first.citizenItem) },
        text(`${p}.natCertificate`, 'Número del certificado de naturalización', 'Certificate of Naturalization number', ref(first.citizenItem), { required: false, maxLength: 20 }),
        { id: `${p}.natANumber`, type: 'aNumber', label: { es: 'A-Number', en: 'A-Number' }, formRef: ref(first.citizenItem) },
        date(`${p}.natDate`, 'Fecha de naturalización', 'Date of naturalization', ref(first.citizenItem)),
      ],
    },
    {
      id: `${p}.lost`,
      kind: 'choice',
      formRef: ref(first.lostItem),
      showIf: citizen,
      question: t('¿Alguna vez perdió la ciudadanía o hizo algo que pudiera hacerle perderla?', 'Has this parent ever lost U.S. citizenship or taken any action that would cause loss of U.S. citizenship?'),
      options: yesNo,
    },
    {
      id: `${p}LostExplain`,
      kind: 'fields',
      formRef: `${ref(first.lostItem)} · Part 11`,
      showIf: all(citizen, is(`${p}.lost`, 'yes')),
      question: t('Explique qué pasó', 'Explain what happened'),
      fields: [{ id: `${p}.lost.explain`, type: 'longText', required: true, label: t('Explicación (en inglés)', 'Explanation'), formRef: 'Part 11' }],
    },
    {
      id: `${p}Marital`,
      kind: 'fields',
      formRef: `${ref(first.maritalItem)}.A · Marital History`,
      showIf: shown,
      question: t('¿Cuántas veces se ha casado?', 'How many times has this parent been married?'),
      why: t('Cuente los matrimonios anulados y los repetidos con la misma persona.', 'Include annulled marriages and marriages to the same person.'),
      fields: [{ id: `${p}.timesMarried`, type: 'number', required: true, label: t('Número de matrimonios', 'Number of marriages'), formRef: `${ref(first.maritalItem)}.A`, maxLength: 2, placeholder: '1' }],
    },
    { id: `${p}.marital`, kind: 'choice', formRef: `${ref(first.maritalItem)}.B`, showIf: shown, question: t('¿Cuál es su estado civil actual?', 'What is this parent’s current marital status?'), options: MARITAL },
    {
      id: `${p}MaritalOther`,
      kind: 'fields',
      formRef: `${ref(first.maritalItem)}.B · Other`,
      showIf: all(shown, is(`${p}.marital`, 'O')),
      question: t('Explique su estado civil', 'Explain the marital status'),
      fields: [text(`${p}.maritalOther`, 'Estado civil (en inglés)', 'Marital status', `${ref(first.maritalItem)}.B`)],
    },
    {
      id: `${p}.spouseIsParent`,
      kind: 'choice',
      formRef: ref(first.spouseItem - 1),
      showIf: married,
      question: isOther ? t('¿Está casado(a) con su padre o madre ciudadano (el de la Parte 3)?', 'Is this parent married to your U.S. citizen parent (Part 3)?') : t('¿Su cónyuge actual es su otro padre o madre?', 'Is this parent’s current spouse your other parent?'),
      options: yesNo,
    },
    {
      id: `${p}Spouse`,
      kind: 'fields',
      formRef: `${ref(first.spouseItem)}.A–D, F–G · Current Spouse`,
      showIf: spouse,
      question: t('Su cónyuge actual', 'This parent’s current spouse'),
      fields: [
        ...nameFields(`${p}.spouse`, `${ref(first.spouseItem)}.A`),
        date(`${p}.spouse.dob`, 'Fecha de nacimiento', 'Date of birth', `${ref(first.spouseItem)}.B`),
        text(`${p}.spouse.birthCountry`, 'País de nacimiento', 'Country of birth', `${ref(first.spouseItem)}.C`),
        text(`${p}.spouse.citizenship`, 'País de ciudadanía o nacionalidad', 'Country of citizenship or nationality', `${ref(first.spouseItem)}.D`),
        date(`${p}.spouse.marriageDate`, 'Fecha de matrimonio', 'Date of marriage', `${ref(first.spouseItem)}.F`),
        text(`${p}.spouse.marriageCity`, 'Ciudad del matrimonio', 'City of marriage', `${ref(first.spouseItem)}.G`, { maxLength: 20 }),
        { id: `${p}.spouse.marriageState`, type: 'state', label: { es: 'Estado (si fue en EE.UU.)', en: 'State (if in the U.S.)' }, formRef: `${ref(first.spouseItem)}.G` },
        text(`${p}.spouse.marriageCountry`, 'País del matrimonio', 'Country of marriage', `${ref(first.spouseItem)}.G`),
      ],
    },
    {
      id: `${p}SpouseAddress`,
      kind: 'fields',
      formRef: `${ref(first.spouseItem)}.E`,
      showIf: spouse,
      question: t('¿Dónde vive su cónyuge?', 'Where does the spouse live?'),
      fields: anyAddress(`${p}.spouse.address`, `${ref(first.spouseItem)}.E`),
    },
    { id: `${p}.spouse.status`, kind: 'choice', formRef: `${ref(first.spouseItem)}.H`, showIf: spouse, question: t('¿Cuál es el estatus migratorio de su cónyuge?', 'What is the spouse’s immigration status?'), options: SPOUSE_STATUS },
    {
      id: `${p}SpouseStatusOther`,
      kind: 'fields',
      formRef: `${ref(first.spouseItem)}.H · Other`,
      showIf: all(spouse, is(`${p}.spouse.status`, 'O')),
      question: t('Explique su estatus', 'Explain the status'),
      fields: [text(`${p}.spouse.statusOther`, 'Estatus (en inglés)', 'Status', `${ref(first.spouseItem)}.H`)],
    },
  ];
}

const yesExplain = (id: string, formRef: string, question: T, shown: (a: Answers) => boolean = () => true): Question[] => [
  { id, kind: 'choice', formRef, question, showIf: shown, options: yesNo },
  {
    id: `${id}Explain`,
    kind: 'fields',
    formRef,
    showIf: all(shown, is(id, 'yes')),
    question: t('Explique', 'Explain'),
    fields: [text(`${id}.explain`, 'Explicación breve (en inglés)', 'Short explanation', formRef, { placeholder: 'Filed in 2019, denied' })],
  },
];

export const n600: FormDefinition = {
  id: 'n-600',
  number: 'N-600',
  edition: N600_EDITION,
  title: t('Solicitud de certificado de ciudadanía', 'Application for Certificate of Citizenship'),
  summary: {
    es: 'Para hijos de ciudadanos que ya son ciudadanos (por nacer de padre o madre ciudadano o por la naturalización de sus padres) y quieren el certificado que lo prueba.',
    en: 'For children of citizens who are already citizens (born to a citizen parent or through their parents’ naturalization) and want the certificate that proves it.',
  },
  intro: {
    es: 'Si usted (o su hijo/a) se hizo ciudadano automáticamente por sus padres, el N-600 pide el certificado que lo demuestra. No es obligatorio: un pasaporte de EE.UU. también prueba la ciudadanía. Lo puede llenar el hijo/a (si es mayor de 18) o su padre, madre o tutor. Las preguntas de "usted" en la Parte 2 son siempre sobre el hijo/a. Tenga a mano el acta de nacimiento, la tarjeta de residente y los certificados de ciudadanía o naturalización de los padres.',
    en: 'If you (or your child) became a citizen automatically through your parents, Form N-600 requests the certificate that proves it. It is optional: a U.S. passport also proves citizenship. The child (if over 18) or their parent or guardian can fill it in. "You" in Part 2 always means the child. Have the birth certificate, green card and the parents’ citizenship or naturalization certificates at hand.',
  },
  minutes: 40,
  pdf: {
    path: 'forms/n-600.pdf',
    fileName: 'N-600-filled.pdf',
    load: () => import('../pdf/n600Pdf').then((m) => m.fillN600),
    signHere: { es: 'Parte 8, Ítem 6', en: 'Part 8, Item 6' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/n-600 que la edición {edition} sigue vigente y revise la tarifa (puede pedir exención con el I-912 en esta app). También se puede presentar en línea.',
      'Adjunte copias del acta de nacimiento del hijo/a, de la tarjeta de residente (si tiene), del acta de matrimonio de los padres y de la prueba de ciudadanía del padre o madre ciudadano. Si hay adopción o custodia, agregue esos documentos.',
      'Si reclama ciudadanía al nacer en el extranjero, adjunte prueba de que el padre o madre vivió en EE.UU. el tiempo requerido (escuela, trabajo, impuestos, servicio militar).',
      'Imprima el PDF y firme la Parte 8, Ítem 6, a mano con tinta negra. Firma el hijo/a si es mayor de 14, o el padre, madre o tutor si presenta por un menor. Si un intérprete o preparador le ayudó, revise sus datos en las Partes 9 y 10: ellos firman y ponen la fecha a mano.',
    ],
    en: [
      'Check at uscis.gov/n-600 that edition {edition} is still current and check the fee (you can request a waiver with Form I-912 in this app). It can also be filed online.',
      'Attach copies of the child’s birth certificate, green card (if any), the parents’ marriage certificate and the U.S. citizen parent’s proof of citizenship. If there was an adoption or custody order, add those documents.',
      'If claiming citizenship at birth abroad, attach proof that the parent lived in the U.S. for the required time (school, work, taxes, military service).',
      'Print the PDF and sign Part 8, Item 6, by hand in black ink. The child signs if 14 or older, or the parent or guardian when filing for a minor. If an interpreter or preparer helped, check their details in Parts 9 and 10: they sign and date by hand.',
    ],
  },
  sections: [
    {
      id: 'eligibility',
      part: 'Part 1',
      title: t('Quién presenta', 'Who is filing'),
      questions: [
        {
          id: 'filer',
          kind: 'choice',
          formRef: 'Part 1 · Item 1',
          question: t('¿Quién llena esta solicitud?', 'Who is filling in this application?'),
          options: options([
            ['child', 'El hijo/a de un ciudadano, para sí mismo/a', 'The child of a U.S. citizen, for themself'],
            ['parent', 'El padre o madre ciudadano, por su hijo/a menor', 'The U.S. citizen parent, for a minor child'],
            ['guardian', 'El tutor legal, por un hijo/a menor', 'A legal guardian, for a minor child'],
          ]),
        },
        {
          id: 'relationship',
          kind: 'choice',
          formRef: 'Part 1 · Item 2',
          question: t('¿Qué relación tiene el hijo/a con su padre o madre ciudadano?', 'What is the child’s relationship to the U.S. citizen parent?'),
          why: t('Si el padre ciudadano es el padre biológico, por lo general hay que probar que el hijo/a nació dentro del matrimonio o fue legitimado.', 'If the citizen parent is the biological father, you generally must show the child was born in wedlock or legitimated.'),
          options: options([
            ['A', 'Hijo/a biológico/a', 'Biological child'],
            ['B', 'Hijo/a adoptado/a', 'Adopted child'],
            ['C', 'Hijo/a de madre gestante ciudadana (sin vínculo genético) que es su madre legal', 'Child of a non-genetic gestational U.S. citizen parent who is also the legal parent'],
            ['D', 'Hijo/a de un ciudadano casado con su padre o madre genético o gestante al nacer', 'Child of a U.S. citizen married to the genetic or gestational parent at birth'],
            ['E', 'Otro', 'Other'],
          ]),
        },
        {
          id: 'relationshipOther',
          kind: 'fields',
          formRef: 'Part 1 · Item 2 · Other',
          showIf: is('relationship', 'E'),
          question: t('Explique la relación', 'Explain the relationship'),
          fields: [text('relationship.other', 'Explicación (en inglés)', 'Explanation', 'Part 1 · Item 2')],
        },
      ],
    },
    {
      id: 'child',
      part: 'Part 2',
      title: t('El hijo/a', 'The child'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 2 · Item 1 · Current Legal Name',
          question: t('¿Cuál es el nombre legal del hijo/a?', 'What is the child’s legal name?'),
          notice: { tone: 'info', title: t('Sobre el hijo/a', 'About the child'), body: t('Esta parte es siempre sobre el hijo/a que pide el certificado, aunque la llene su padre, madre o tutor.', 'This part is always about the child requesting the certificate, even if a parent or guardian fills it in.') },
          fields: [
            ...nameFields('name', 'Part 2 · Item 1'),
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 1 · A-Number' },
          ],
        },
        { id: 'cardNameDifferent', kind: 'choice', formRef: 'Part 2 · Item 2', question: t('¿Su nombre en la tarjeta de residente es distinto?', 'Is the name on the green card different?'), options: yesNo },
        {
          id: 'cardName',
          kind: 'fields',
          formRef: 'Part 2 · Item 2',
          showIf: is('cardNameDifferent', 'yes'),
          question: t('El nombre como aparece en la tarjeta de residente', 'The name exactly as on the green card'),
          fields: nameFields('cardName', 'Part 2 · Item 2'),
        },
        { id: 'otherName.more0', kind: 'choice', formRef: 'Part 2 · Item 3', question: t('¿Ha usado otros nombres desde que nació (apodos, alias)?', 'Has the child used other names since birth (nicknames, aliases)?'), options: yesNo },
        ...rows({
          max: 2,
          id: 'otherName',
          first: is('otherName.more0', 'yes'),
          question: (i) => (i === 1 ? t('Otro nombre', 'Another name') : t('Otro nombre más', 'One more name')),
          more: t('¿Ha usado otro nombre más?', 'Another name?'),
          formRef: 'Part 2 · Item 3',
          fields: (i) => nameFields(`otherName${i}`, `Part 2 · Item 3 · Name ${i}`),
          overflow: t('Si son más de 2, escríbalos a mano en la Parte 11.', 'If there are more than 2, write them by hand in Part 11.'),
        }),
        {
          id: 'about',
          kind: 'fields',
          formRef: 'Part 2 · Items 4–10',
          question: t('Datos del hijo/a', 'The child’s details'),
          fields: [
            { id: 'ssn', type: 'ssn', label: { es: 'Seguro Social (si tiene)', en: 'Social Security number (if any)' }, formRef: 'Part 2 · Item 4' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Cuenta en línea de USCIS (si tiene)', en: 'USCIS online account (if any)' }, formRef: 'Part 2 · Item 5' },
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 2 · Item 6'),
            text('birthCountry', 'País de nacimiento', 'Country of birth', 'Part 2 · Item 7'),
            text('priorCitizenship', 'País de ciudadanía anterior', 'Country of prior citizenship or nationality', 'Part 2 · Item 8'),
            sexField('sex', 'Part 2 · Item 9'),
            { id: 'heightFeet', type: 'select', required: true, label: { es: 'Estatura: pies', en: 'Height: feet' }, formRef: 'Part 2 · Item 10 · Feet', options: ['1', '2', '3', '4', '5', '6', '7', '8'].map((v) => ({ value: v, label: { es: v, en: v } })) },
            { id: 'heightInches', type: 'select', required: true, label: { es: 'Estatura: pulgadas', en: 'Height: inches' }, formRef: 'Part 2 · Item 10 · Inches', options: [...Array(12)].map((_, i) => ({ value: String(i), label: { es: String(i), en: String(i) } })) },
          ],
        },
        { id: 'mailing', kind: 'fields', formRef: 'Part 2 · Item 11 · Current Mailing Address', question: t('¿A qué dirección le llega el correo?', 'What is the mailing address?'), fields: anyAddress('mailing', 'Part 2 · Item 11', { careOf: true }) },
        { id: 'mailingSame', kind: 'choice', formRef: 'Part 2 · Item 12', question: t('¿El hijo/a vive en esa misma dirección?', 'Does the child live at that same address?'), options: yesNo },
        { id: 'home', kind: 'fields', formRef: 'Part 2 · Item 12 · Current Physical Address', showIf: is('mailingSame', 'no'), question: t('¿Dónde vive el hijo/a?', 'Where does the child live?'), fields: anyAddress('home', 'Part 2 · Item 12') },
        { id: 'marital', kind: 'choice', formRef: 'Part 2 · Item 13', question: t('¿Cuál es el estado civil del hijo/a?', 'What is the child’s marital status?'), options: MARITAL },
        { id: 'maritalOtherScreen', kind: 'fields', formRef: 'Part 2 · Item 13 · Other', showIf: is('marital', 'O'), question: t('Explique el estado civil', 'Explain the marital status'), fields: [text('maritalOther', 'Estado civil (en inglés)', 'Marital status', 'Part 2 · Item 13')] },
        { id: 'armedForces', kind: 'choice', formRef: 'Part 2 · Item 14', question: t('¿Es miembro o veterano de las fuerzas armadas de EE.UU.?', 'Is the child a member or veteran of the U.S. Armed Forces?'), options: yesNo },
      ],
    },
    {
      id: 'admission',
      part: 'Part 2',
      title: t('Entrada y estatus', 'Entry and status'),
      questions: [
        {
          id: 'entry',
          kind: 'fields',
          formRef: 'Part 2 · Item 15.A',
          question: t('¿Cómo llegó a EE.UU.?', 'How did the child arrive in the U.S.?'),
          why: t('Si nació en EE.UU., deje estos datos en blanco.', 'If born in the U.S., leave these blank.'),
          fields: [
            text('entry.port', 'Puerto de entrada (ciudad)', 'Port of entry', 'Part 2 · Item 15.A', { required: false, placeholder: 'Miami, FL' }),
            date('entry.date', 'Fecha de entrada', 'Date of entry', 'Part 2 · Item 15.A', false),
            ...nameFields('entryName', 'Part 2 · Item 15.A · Exact Name Used at Time of Entry', false),
          ],
        },
        {
          id: 'entryDoc',
          kind: 'choice',
          formRef: 'Part 2 · Item 15.B',
          question: t('¿Con qué documento entró?', 'What travel document was used to enter?'),
          options: options([
            ['passport', 'Pasaporte', 'Passport'],
            ['travelDoc', 'Documento de viaje', 'Travel document'],
            ['none', 'Ninguno / nació en EE.UU.', 'None / born in the U.S.'],
          ]),
        },
        {
          id: 'entryDocDetails',
          kind: 'fields',
          formRef: 'Part 2 · Item 15.B',
          showIf: is('entryDoc', 'passport', 'travelDoc'),
          question: t('Datos del documento', 'Document details'),
          fields: [
            text('entryDoc.number', 'Número', 'Number', 'Part 2 · Item 15.B', { maxLength: 30 }),
            text('entryDoc.country', 'País que lo emitió', 'Country of issuance', 'Part 2 · Item 15.B'),
            date('entryDoc.issued', 'Fecha de emisión', 'Date issued', 'Part 2 · Item 15.B', false),
          ],
        },
        { id: 'wasLPR', kind: 'choice', formRef: 'Part 2 · Item 15.C', question: t('¿Alguna vez ha sido residente permanente?', 'Has the child ever been a lawful permanent resident?'), options: yesNo },
        {
          id: 'lpr',
          kind: 'fields',
          formRef: 'Part 2 · Item 15.D',
          showIf: is('wasLPR', 'yes'),
          question: t('¿Cuándo y dónde recibió la residencia?', 'When and where did the child get residence?'),
          fields: [
            date('lpr.date', 'Fecha en que se hizo residente', 'Date became an LPR', 'Part 2 · Item 15.D'),
            text('lpr.office', 'Oficina de USCIS o lugar de admisión', 'USCIS office or place of admission', 'Part 2 · Item 15.D'),
          ],
        },
        ...yesExplain('lostLPR', 'Part 2 · Item 16', t('¿Alguna vez abandonó o perdió la residencia?', 'Has the child ever abandoned or lost LPR status?'), is('wasLPR', 'yes')),
        ...yesExplain('prevN600', 'Part 2 · Item 17', t('¿Ha pedido antes un certificado de ciudadanía?', 'Has the child previously applied for a Certificate of Citizenship?')),
        ...yesExplain('prevPassport', 'Part 2 · Item 18', t('¿Ha pedido antes un pasaporte de EE.UU.?', 'Has the child previously applied for a U.S. passport?')),
        {
          id: 'custody',
          kind: 'choice',
          formRef: 'Part 2 · Item 19',
          question: t('¿Vive (o vivió antes de cumplir 18) bajo la custodia legal y física de su padre o madre ciudadano?', 'Does the child regularly reside (or did before turning 18) in the legal and physical custody of the U.S. citizen parent?'),
          options: yesNo,
        },
      ],
    },
    {
      id: 'adoption',
      part: 'Part 2',
      title: t('Adopción y padres', 'Adoption and parents'),
      questions: [
        { id: 'adopted', kind: 'choice', formRef: 'Part 2 · Item 20', question: t('¿El hijo/a fue adoptado/a?', 'Was the child adopted?'), options: yesNo },
        {
          id: 'adoptionDetails',
          kind: 'fields',
          formRef: 'Part 2 · Items 20.A–20.D',
          showIf: is('adopted', 'yes'),
          question: t('La adopción', 'The adoption'),
          fields: [
            text('adoption.city', 'Ciudad', 'City or town', 'Part 2 · Item 20.A', { maxLength: 20 }),
            { id: 'adoption.state', type: 'state', label: { es: 'Estado (si fue en EE.UU.)', en: 'State (if in the U.S.)' }, formRef: 'Part 2 · Item 20.A' },
            text('adoption.country', 'País', 'Country', 'Part 2 · Item 20.A'),
            date('adoption.date', 'Fecha de adopción', 'Date of adoption', 'Part 2 · Item 20.B'),
            date('adoption.legal', 'Inicio de la custodia legal', 'Date legal custody began', 'Part 2 · Item 20.C'),
            date('adoption.physical', 'Inicio de la custodia física', 'Date physical custody began', 'Part 2 · Item 20.D'),
          ],
        },
        { id: 'adoptionFinal', kind: 'choice', formRef: 'Part 2 · Item 20.E', showIf: is('adopted', 'yes'), question: t('¿Fue una adopción completa y final?', 'Was it a full, final, and complete adoption?'), options: yesNo },
        {
          id: 'adoptionRecognized',
          kind: 'choice',
          formRef: 'Part 2 · Item 21',
          showIf: all(is('adopted', 'yes'), is('adoptionFinal', 'yes')),
          question: t('¿Su estado reconoció la adopción extranjera como completa y final?', 'Did your state of residence recognize the foreign adoption decree as full and final?'),
          options: yesNo,
        },
        {
          id: 'readoption',
          kind: 'fields',
          formRef: 'Part 2 · Item 22 · Re-Adoption',
          showIf: (a) => a.adopted === 'yes' && (a.adoptionFinal === 'no' || a.adoptionRecognized === 'no'),
          question: t('La nueva adopción (re-adopción)', 'The re-adoption'),
          fields: [
            text('readoption.city', 'Ciudad', 'City or town', 'Part 2 · Item 22.A', { maxLength: 20 }),
            { id: 'readoption.state', type: 'state', label: { es: 'Estado', en: 'State' }, formRef: 'Part 2 · Item 22.A' },
            text('readoption.country', 'País', 'Country', 'Part 2 · Item 22.A', { placeholder: 'United States' }),
            date('readoption.date', 'Fecha de adopción', 'Date of adoption', 'Part 2 · Item 22.B'),
            date('readoption.legal', 'Inicio de la custodia legal', 'Date legal custody began', 'Part 2 · Item 22.C'),
            date('readoption.physical', 'Inicio de la custodia física', 'Date physical custody began', 'Part 2 · Item 22.D'),
          ],
        },
        { id: 'parentsMarriedAtBirth', kind: 'choice', formRef: 'Part 2 · Item 23', showIf: is('adopted', 'no'), question: t('¿Sus padres estaban casados entre sí cuando nació?', 'Were the parents married to each other when the child was born?'), options: yesNo },
        { id: 'parentsMarriedAfter', kind: 'choice', formRef: 'Part 2 · Item 24', showIf: all(is('adopted', 'no'), is('parentsMarriedAtBirth', 'no')), question: t('¿Se casaron después del nacimiento?', 'Did the parents marry after the child was born?'), options: yesNo },
        { id: 'absent', kind: 'choice', formRef: 'Part 2 · Item 25', showIf: bornBefore1952, question: t('¿Ha salido de EE.UU. desde que llegó por primera vez?', 'Has the child been absent from the U.S. since first arriving?'), options: yesNo },
        ...rows({
          max: 2,
          id: 'absence',
          first: all(bornBefore1952, is('absent', 'yes')),
          question: (i) => t(`Salida ${i}`, `Absence ${i}`),
          more: t('¿Hubo otra salida?', 'Another absence?'),
          formRef: 'Part 2 · Items 25.A–25.F',
          fields: (i) => [
            date(`absence${i}.left`, 'Fecha de salida', 'Date left the U.S.', `Part 2 · Item 25 · Absence ${i}`),
            date(`absence${i}.returned`, 'Fecha de regreso', 'Date returned', `Part 2 · Item 25 · Absence ${i}`),
            text(`absence${i}.city`, 'Ciudad de entrada al regresar', 'City of entry on return', `Part 2 · Item 25 · Absence ${i}`, { maxLength: 20 }),
            { id: `absence${i}.state`, type: 'state', label: { es: 'Estado', en: 'State' }, formRef: `Part 2 · Item 25 · Absence ${i}` },
          ],
          overflow: t('Si hubo más, escríbalas a mano en la Parte 11.', 'If there were more, write them by hand in Part 11.'),
        }),
      ],
    },
    { id: 'citizenParent', part: 'Part 3', title: t('Padre o madre ciudadano', 'U.S. citizen parent'), questions: parentQuestions('parent1', 'Part 3', { citizenItem: 6, lostItem: 7, maritalItem: 8, spouseItem: 10 }) },
    {
      id: 'otherParent',
      part: 'Part 4',
      title: t('El otro padre o madre', 'The other parent'),
      questions: [
        { id: 'parent2.known', kind: 'choice', formRef: 'Part 4', question: t('¿Puede dar datos del otro padre o madre?', 'Can you give information about the other parent?'), why: t('Si no se conoce, conteste No y deje la Parte 4 en blanco.', 'If unknown, answer No and leave Part 4 blank.'), options: yesNo },
        ...parentQuestions('parent2', 'Part 4', { citizenItem: 8, lostItem: 9, maritalItem: 10, spouseItem: 12 }, is('parent2.known', 'yes'), true),
      ],
    },
    {
      id: 'guardian',
      part: 'Part 5',
      title: t('Tutor legal', 'Legal guardian'),
      questions: [
        {
          id: 'guardianInfo',
          kind: 'fields',
          formRef: 'Part 5 · Items 1–2',
          showIf: is('filer', 'guardian'),
          question: t('Sus datos como tutor legal', 'Your details as legal guardian'),
          fields: [...nameFields('guardian', 'Part 5 · Item 1'), date('guardian.dob', 'Fecha de nacimiento', 'Date of birth', 'Part 5 · Item 2')],
        },
        { id: 'guardianAddress', kind: 'fields', formRef: 'Part 5 · Item 3', showIf: is('filer', 'guardian'), question: t('¿Dónde vive?', 'Where do you live?'), fields: anyAddress('guardian.address', 'Part 5 · Item 3') },
      ],
    },
    {
      id: 'presence',
      part: 'Parts 6–7',
      title: t('Ciudadanía al nacer', 'Citizenship at birth'),
      questions: [
        {
          id: 'atBirth',
          kind: 'choice',
          formRef: 'Parts 6–7',
          question: t('¿El hijo/a nació fuera de EE.UU. y reclama ser ciudadano desde que nació?', 'Was the child born outside the U.S. and claims to have been a citizen at birth?'),
          why: t('Conteste No si se hizo ciudadano después de nacer (por ejemplo, al hacerse residente y vivir con un padre ciudadano antes de los 18).', 'Answer No if the child became a citizen after birth (for example, by becoming a resident and living with a citizen parent before 18).'),
          options: yesNo,
        },
        {
          id: 'presenceParent',
          kind: 'choice',
          formRef: 'Part 6 · Item 1',
          showIf: is('atBirth', 'yes'),
          question: t('¿De cuál padre o madre ciudadano son las fechas en EE.UU.?', 'Which U.S. citizen parent do the dates in the U.S. belong to?'),
          notice: { tone: 'info', title: t('Tiempo en EE.UU.', 'Time in the U.S.'), body: t('Ponga todos los periodos en que ese padre o madre vivió en EE.UU., desde que nació hasta que nació el hijo/a.', 'List every period that parent was physically in the U.S., from their birth until the child’s birth.') },
          options: options([
            ['mother', 'Madre ciudadana', 'U.S. citizen mother'],
            ['father', 'Padre ciudadano', 'U.S. citizen father'],
          ]),
        },
        ...rows({
          max: 8,
          id: 'presence',
          first: is('atBirth', 'yes'),
          question: (i) => t(`Periodo ${i} en EE.UU.`, `Period ${i} in the U.S.`),
          more: t('¿Hubo otro periodo en EE.UU.?', 'Another period in the U.S.?'),
          formRef: 'Part 6 · Item 2',
          fields: (i) => [date(`presence${i}.from`, 'Desde', 'From', `Part 6 · Item 2 · Period ${i}`), date(`presence${i}.to`, 'Hasta', 'To', `Part 6 · Item 2 · Period ${i}`)],
          overflow: t('Si son más de 8, escríbalos a mano en la Parte 11.', 'If there are more than 8, write them by hand in Part 11.'),
        }),
        { id: 'parentMilitary', kind: 'choice', formRef: 'Part 7 · Item 1', showIf: is('atBirth', 'yes'), question: t('¿El padre o madre ciudadano sirvió en las fuerzas armadas de EE.UU.?', 'Did the U.S. citizen parent serve in the U.S. Armed Forces?'), options: yesNo },
        {
          id: 'parentMilitaryDetails',
          kind: 'fields',
          formRef: 'Part 7 · Items 2–3',
          showIf: all(is('atBirth', 'yes'), is('parentMilitary', 'yes')),
          question: t('Su servicio militar', 'Their military service'),
          fields: [
            text('military.name', 'Nombre del padre o madre que sirvió', 'Name of the parent who served', 'Part 7 · Item 2'),
            date('military1.from', 'Servicio desde', 'Service from', 'Part 7 · Item 3.A'),
            date('military1.to', 'Hasta', 'To', 'Part 7 · Item 3.A'),
            date('military2.from', 'Otro periodo: desde (opcional)', 'Another period: from (optional)', 'Part 7 · Item 3.B', false),
            date('military2.to', 'Hasta', 'To', 'Part 7 · Item 3.B', false),
          ],
        },
        {
          id: 'discharge',
          kind: 'choice',
          formRef: 'Part 7 · Item 4',
          showIf: all(is('atBirth', 'yes'), is('parentMilitary', 'yes')),
          question: t('¿Qué tipo de baja tuvo?', 'What type of military service (discharge)?'),
          options: options([
            ['H', 'Honorable', 'Honorable'],
            ['O', 'Distinta de honorable', 'Other than honorable'],
            ['D', 'Deshonrosa', 'Dishonorable'],
            ['OE', 'Otra', 'Other'],
          ]),
        },
        {
          id: 'dischargeOther',
          kind: 'fields',
          formRef: 'Part 7 · Item 4 · Other',
          showIf: all(is('atBirth', 'yes'), is('parentMilitary', 'yes'), is('discharge', 'OE')),
          question: t('Explique', 'Explain'),
          fields: [text('discharge.other', 'Tipo de servicio (en inglés)', 'Type of service', 'Part 7 · Item 4')],
        },
      ],
    },
    {
      id: 'statement',
      part: 'Part 8',
      title: t('Declaración y contacto', 'Statement and contact'),
      questions: [
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 8 · Item 1',
          question: t('¿Quien firma puede leer y entender el formulario en inglés?', 'Can the person signing read and understand the form in English?'),
          options: options([
            ['A', 'Sí, lee inglés', 'Yes, reads English'],
            ['B', 'No, un intérprete se lo leerá', 'No, an interpreter will read it'],
          ]),
        },
        { id: 'interpreterLanguage', kind: 'fields', formRef: 'Part 8 · Item 1.B', showIf: is('readsEnglish', 'B'), question: t('¿En qué idioma?', 'In what language?'), fields: [text('fluentLanguage', 'Idioma', 'Language', 'Part 8 · Item 1.B', { placeholder: 'Spanish' })] },
        { id: 'preparer', kind: 'choice', formRef: 'Part 8 · Item 2', question: t('¿Alguien más preparó esta solicitud?', 'Did someone else prepare this application?'), why: t('Si es así, sus datos van en la Parte 10 y esa persona la firma a mano.', 'If so, their details go in Part 10 and that person signs it by hand.'), options: yesNo },
        { id: 'preparerName', kind: 'fields', formRef: 'Part 8 · Item 2', showIf: is('preparer', 'yes'), question: t('¿Quién la preparó?', 'Who prepared it?'), fields: [text('preparer.name', 'Nombre del preparador', 'Preparer’s name', 'Part 8 · Item 2')] },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 8 · Items 3–5',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 8 · Item 3', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 8 · Item 4' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 8 · Item 5' },
          ],
        },
      ],
    },
    assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 9', preparerPart: 'Part 10' }),
  ],
};
