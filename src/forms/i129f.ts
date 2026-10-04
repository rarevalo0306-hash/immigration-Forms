import type { Field, FormDefinition, Option, Question, Section, YesNoItem } from './types';
import type { T } from '../i18n';
import { all, anyAddress, biographic, date, is, nameFields, sexField, yesNo } from './helpers';
import { assistanceSection } from './assistance';

// Questions follow USCIS Form I-129F, Petition for Alien Fiancé(e), edition 01/20/25. The person
// filling in the app is the U.S. citizen petitioner. The PDF mapping lives in src/pdf/i129fPdf.ts.
// The interpreter (Part 6) and preparer (Part 7) parts are filled from the last section; they sign by
// hand. This edition asks them no mailing address and has no preparer's statement boxes, and the
// petitioner's part has no statement boxes about them: the two questions in Part 5 only decide
// whether to ask for them.

export const I129F_EDITION = '01/20/25';

const t = (es: string, en: string): T => ({ es, en });

const maritalOptions: Option[] = [
  { value: 'S', label: t('Soltero/a', 'Single') },
  { value: 'M', label: t('Casado/a', 'Married') },
  { value: 'D', label: t('Divorciado/a', 'Divorced') },
  { value: 'W', label: t('Viudo/a', 'Widowed') },
];

const maritalField = (id: string, ref: string): Field => ({ id, type: 'select', required: true, label: { es: 'Estado civil', en: 'Marital status' }, formRef: ref, options: maritalOptions });

/** A street address with the 25-character street field of this edition. */
const address = (prefix: string, ref: string, careOf = false) =>
  anyAddress(prefix, ref, { careOf }).map((f) => (f.id.endsWith('.street') ? { ...f, maxLength: 25 } : f));

/** Physical addresses for the last five years: the current one, then the previous one. */
function addressHistory(who: 'pet' | 'ben', ref: (n: 1 | 2) => string, you: T): Question[] {
  return [
    {
      id: `${who}.home1`,
      kind: 'fields',
      formRef: ref(1),
      showIf: is(`${who}.mailingSame`, 'no'),
      question: t(`¿Dónde vive ${you.es} ahora?`, `Where does ${you.en} live now?`),
      fields: address(`${who}.home1`, ref(1)),
    },
    {
      id: `${who}.home1Since`,
      kind: 'fields',
      formRef: `${ref(1)} · Date From`,
      question: t(`¿Desde cuándo vive ${you.es} ahí?`, `Since when has ${you.en} lived there?`),
      fields: [date(`${who}.home1.from`, 'Fecha', 'Date from', `${ref(1)} · Date From`)],
    },
    {
      id: `${who}.home2Has`,
      kind: 'choice',
      formRef: ref(2),
      question: t(`¿Vivió ${you.es} en otra dirección en los últimos 5 años?`, `Did ${you.en} live at another address in the last 5 years?`),
      why: t('Si fueron varias, ponga la anterior a la actual y escriba las demás a mano en la Parte 8.', 'If there were several, give the one before the current one and write the rest by hand in Part 8.'),
      options: yesNo,
    },
    {
      id: `${who}.home2`,
      kind: 'fields',
      formRef: ref(2),
      showIf: is(`${who}.home2Has`, 'yes'),
      question: t('La dirección anterior', 'The previous address'),
      fields: [...address(`${who}.home2`, ref(2)), date(`${who}.home2.from`, 'Desde', 'Date from', `${ref(2)} · Date From`), date(`${who}.home2.to`, 'Hasta', 'Date to', `${ref(2)} · Date To`)],
    },
  ];
}

/** Employment for the last five years: the current job, then the previous one. */
function jobs(who: 'pet' | 'ben', ref: (n: 1 | 2) => string, you: T): Question[] {
  const job = (n: 1 | 2): Field[] => [
    { id: `${who}.job${n}.name`, type: 'text', required: true, label: { es: 'Empleador (o "Unemployed", "Self-employed", "Student")', en: 'Employer' }, formRef: `${ref(n)} · Full Name of Employer`, maxLength: 34 },
    ...address(`${who}.job${n}`, ref(n)).map((f) => ({ ...f, required: false })),
    { id: `${who}.job${n}.occupation`, type: 'text', required: true, label: { es: 'Ocupación', en: 'Occupation' }, formRef: `${ref(n)} · Occupation` },
    date(`${who}.job${n}.from`, 'Desde', 'Start date', `${ref(n)} · Employment Start Date`),
    ...(n === 2 ? [date(`${who}.job2.to`, 'Hasta', 'End date', `${ref(2)} · Employment End Date`)] : []),
  ];
  return [
    {
      id: `${who}.job1`,
      kind: 'fields',
      formRef: ref(1),
      question: t(`El trabajo actual de ${you.es}`, `${you.en}’s current job`),
      why: t('Si no trabaja, escriba "Unemployed" y desde cuándo.', 'If not working, write "Unemployed" and since when.'),
      fields: job(1),
    },
    {
      id: `${who}.job2Has`,
      kind: 'choice',
      formRef: ref(2),
      question: t(`¿Tuvo ${you.es} otro trabajo en los últimos 5 años?`, `Did ${you.en} have another job in the last 5 years?`),
      options: yesNo,
    },
    { id: `${who}.job2`, kind: 'fields', formRef: ref(2), showIf: is(`${who}.job2Has`, 'yes'), question: t('El trabajo anterior', 'The previous job'), fields: job(2) },
  ];
}

/** A parent: name, date of birth, sex, country of birth, and city and country of residence. */
const parent = (id: string, ref: string): Field[] => [
  ...nameFields(id, ref),
  date(`${id}.dob`, 'Fecha de nacimiento', 'Date of birth', `${ref} · Date of Birth`, false),
  { ...sexField(`${id}.sex`, ref) },
  { id: `${id}.birthCountry`, type: 'text', required: true, label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: `${ref} · Country of Birth` },
  { id: `${id}.city`, type: 'text', required: true, label: { es: 'Ciudad donde vive (o "deceased" si falleció)', en: 'City of residence (or "deceased")' }, formRef: `${ref} · City/Town/Village of Residence`, maxLength: 20 },
  { id: `${id}.country`, type: 'text', label: { es: 'País donde vive', en: 'Country of residence' }, formRef: `${ref} · Country of Residence` },
];

/** Part 3, Items 1-2.c. */
export const CRIME_ITEMS: YesNoItem[] = [
  { id: 'crime.1', formRef: 'Part 3 · Item 1', label: t('¿Alguna vez tuvo una orden de protección o de alejamiento en su contra (civil o penal)?', 'Have you EVER been subject to a temporary or permanent protection or restraining order?') },
  { id: 'crime.2a', formRef: 'Part 3 · Item 2.a', label: t('¿Alguna vez lo arrestaron o condenaron por violencia doméstica, agresión sexual, abuso o abandono de menores, violencia en el noviazgo, abuso de ancianos o acoso (o intento)?', 'Have you EVER been arrested or convicted of domestic violence, sexual assault, child abuse or neglect, dating violence, elder abuse or stalking (or an attempt)?') },
  { id: 'crime.2b', formRef: 'Part 3 · Item 2.b', label: t('¿…por homicidio, violación, abuso o explotación sexual, incesto, tortura, trata, secuestro u otro delito grave de la lista (o intento)?', '…homicide, rape, sexual abuse or exploitation, incest, torture, trafficking, kidnapping or another listed crime (or an attempt)?') },
  { id: 'crime.2c', formRef: 'Part 3 · Item 2.c', label: t('¿…tres o más arrestos o condenas por drogas o alcohol, no por un mismo hecho?', '…three or more arrests or convictions for drugs or alcohol, not from a single act?') },
  { id: 'crime.4a', formRef: 'Part 3 · Item 4.a', label: t('¿Alguna vez lo arrestaron, citaron, acusaron, condenaron, multaron o encarcelaron en cualquier país (sin contar tránsito, salvo alcohol, drogas o multas de $500 o más)?', 'Have you ever been arrested, cited, charged, convicted, fined or imprisoned in any country (excluding traffic unless alcohol, drugs or $500+ fines)?') },
];

const anyListedCrime = (a: Record<string, unknown>) => ['crime.2a', 'crime.2b', 'crime.2c'].some((id) => a[id] === 'yes');

/** Parts 6–7. This edition asks no mailing address for them and has no preparer's statement boxes. */
const assistance = (): Section => {
  const s = assistanceSection({ usedInterpreter: is('readsEnglish', 'B'), usedPreparer: is('preparer', 'yes'), interpreterPart: 'Part 6', preparerPart: 'Part 7' });
  const dropped = new Set(['interp.address', 'prep.address', 'prep.statement']);
  return { ...s, questions: s.questions.filter((q) => !dropped.has(q.id)) };
};

export const i129f: FormDefinition = {
  id: 'i-129f',
  number: 'I-129F',
  edition: I129F_EDITION,
  title: t('Petición para prometido/a (visa K-1)', 'Petition for fiancé(e) (K-1 visa)'),
  summary: {
    es: 'El ciudadano de EE.UU. pide la visa para que su prometido/a venga a casarse (o su cónyuge, con la K-3).',
    en: 'The U.S. citizen asks for a visa so their fiancé(e) can come to marry (or their spouse, with the K-3).',
  },
  intro: {
    es: 'Con el I-129F usted, ciudadano/a de EE.UU., pide que su prometido/a venga a EE.UU. para casarse dentro de los 90 días siguientes a su llegada. Deben haberse visto en persona en los últimos 2 años. Las preguntas son primero sobre usted y después sobre su prometido/a.',
    en: 'With Form I-129F you, a U.S. citizen, ask for your fiancé(e) to come to the U.S. to marry within 90 days of arrival. You must have met in person in the last 2 years. The questions are first about you and then about your fiancé(e).',
  },
  minutes: 60,
  pdf: {
    path: 'forms/i-129f.pdf',
    fileName: 'I-129F-filled.pdf',
    load: () => import('../pdf/i129fPdf').then((m) => m.fillI129F),
    signHere: { es: 'Parte 5, Ítem 4', en: 'Part 5, Item 4' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-129f que la edición {edition} sigue vigente y revise la tarifa; si cambió, use la nueva y copie sus respuestas de esta hoja.',
      'Adjunte prueba de su ciudadanía, una foto tipo pasaporte de cada uno, pruebas de que se vieron en persona en los últimos 2 años y una declaración de cada uno de que piensan casarse dentro de los 90 días de la llegada.',
      'Imprima el PDF y firme la Parte 5, Ítem 4, a mano con tinta negra.',
      'Si contestó Sí a alguna pregunta penal, adjunte copias certificadas de los documentos de la corte y la policía.',
      'Si alguien le interpretó o preparó la petición, esa persona firma y pone la fecha a mano en la Parte 6 (intérprete) o la Parte 7 (preparador).',
    ],
    en: [
      'Check at uscis.gov/i-129f that edition {edition} is still current and check the fee; if it changed, use the new one and copy your answers from this sheet.',
      'Attach proof of your citizenship, a passport-style photo of each of you, evidence you met in person in the last 2 years and a statement from each of you that you intend to marry within 90 days of arrival.',
      'Print the PDF and sign Part 5, Item 4, by hand in black ink.',
      'If you answered Yes to any criminal question, attach certified court and police records.',
      'If someone interpreted or prepared the petition for you, they sign and date Part 6 (interpreter) or Part 7 (preparer) by hand.',
    ],
  },
  sections: [
    {
      id: 'classification',
      part: 'Part 1',
      title: t('Qué visa pide', 'Which visa'),
      questions: [
        {
          id: 'classification',
          kind: 'choice',
          formRef: 'Part 1 · Items 4.a–4.b · Classification',
          question: t('¿Para quién pide la visa?', 'Who are you asking the visa for?'),
          options: [
            { value: 'A', label: t('Mi prometido/a (visa K-1)', 'My fiancé(e) (K-1 visa)') },
            { value: 'B', label: t('Mi cónyuge, mientras se procesa el I-130 (visa K-3)', 'My spouse, while the I-130 is processed (K-3 visa)') },
          ],
        },
        {
          id: 'filedI130',
          kind: 'choice',
          formRef: 'Part 1 · Item 5 · Have you filed Form I-130?',
          showIf: is('classification', 'B'),
          question: t('¿Ya presentó el I-130 para su cónyuge?', 'Have you filed Form I-130 for your spouse?'),
          why: t('La K-3 requiere un I-130 ya presentado.', 'The K-3 requires an I-130 already filed.'),
          options: yesNo,
        },
      ],
    },
    {
      id: 'you',
      part: 'Part 1',
      title: t('Sobre usted', 'About you'),
      questions: [
        {
          id: 'pet.numbers',
          kind: 'fields',
          formRef: 'Part 1 · Items 1–3',
          question: t('Sus números', 'Your numbers'),
          fields: [
            { id: 'pet.aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene; por ejemplo, si se naturalizó)', en: 'A-Number (if any)' }, formRef: 'Part 1 · Item 1' },
            { id: 'pet.uscisAccount', type: 'uscisAccount', label: { es: 'Número de cuenta en línea de USCIS', en: 'USCIS online account number' }, formRef: 'Part 1 · Item 2' },
            { id: 'pet.ssn', type: 'ssn', label: { es: 'Número de Seguro Social', en: 'Social Security number' }, formRef: 'Part 1 · Item 3', placeholder: '123-45-6789' },
          ],
        },
        {
          id: 'pet.name',
          kind: 'fields',
          formRef: 'Part 1 · Item 6 · Your Full Name',
          question: t('¿Cuál es su nombre legal completo?', 'What is your full legal name?'),
          fields: nameFields('pet', 'Part 1 · Item 6').map((f) => ({ ...f, maxLength: f.id.endsWith('family') ? 30 : 18 })),
        },
        {
          id: 'pet.otherName.has',
          kind: 'choice',
          formRef: 'Part 1 · Item 7 · Other Names Used',
          question: t('¿Ha usado otros nombres?', 'Have you used other names?'),
          why: t('Incluya su nombre de soltera, apodos y alias. Si son varios, escriba los demás en la Parte 8.', 'Include your maiden name, nicknames and aliases. If several, write the rest in Part 8.'),
          options: yesNo,
        },
        {
          id: 'pet.otherName',
          kind: 'fields',
          formRef: 'Part 1 · Item 7',
          showIf: is('pet.otherName.has', 'yes'),
          question: t('Otro nombre que ha usado', 'Another name you have used'),
          fields: nameFields('pet.otherName', 'Part 1 · Item 7').map((f) => ({ ...f, maxLength: f.id.endsWith('family') ? 30 : 18 })),
        },
        {
          id: 'pet.mailing',
          kind: 'fields',
          formRef: 'Part 1 · Item 8 · Your Mailing Address',
          question: t('¿A qué dirección le llega el correo?', 'Where do you get your mail?'),
          fields: address('pet.mailing', 'Part 1 · Item 8', true),
        },
        {
          id: 'pet.mailingSame',
          kind: 'choice',
          formRef: 'Part 1 · Item 8.j · Is your current mailing address the same as your physical address?',
          question: t('¿Vive en esa misma dirección?', 'Do you live at that same address?'),
          options: yesNo,
        },
        ...addressHistory('pet', (n) => `Part 1 · Physical Address ${n} · Item ${n === 1 ? 9 : 11}`, t('usted', 'you')),
        ...jobs('pet', (n) => `Part 1 · Employer ${n} · Items ${n === 1 ? '13–16' : '17–20'}`, t('usted', 'you')),
        {
          id: 'pet.details',
          kind: 'fields',
          formRef: 'Part 1 · Items 21–26 · Other Information',
          question: t('Sus datos', 'Your details'),
          fields: [
            sexField('pet.sex', 'Part 1 · Item 21'),
            date('pet.dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 22'),
            maritalField('pet.marital', 'Part 1 · Item 23 · Marital Status'),
            { id: 'pet.birthCity', type: 'text', required: true, label: { es: 'Ciudad de nacimiento', en: 'City of birth' }, formRef: 'Part 1 · Item 24', maxLength: 20 },
            { id: 'pet.birthState', type: 'text', label: { es: 'Estado o provincia de nacimiento', en: 'State or province of birth' }, formRef: 'Part 1 · Item 25', maxLength: 20 },
            { id: 'pet.birthCountry', type: 'text', required: true, label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: 'Part 1 · Item 26' },
          ],
        },
        { id: 'pet.parent1', kind: 'fields', formRef: 'Part 1 · Items 27–31 · Parent 1', question: t('Su padre o madre', 'Your parent'), fields: parent('pet.parent1', 'Part 1 · Parent 1') },
        { id: 'pet.parent2', kind: 'fields', formRef: 'Part 1 · Items 32–36 · Parent 2', question: t('Su otro padre o madre', 'Your other parent'), fields: parent('pet.parent2', 'Part 1 · Parent 2') },
        {
          id: 'pet.prevMarried',
          kind: 'choice',
          formRef: 'Part 1 · Item 37 · Have you ever been previously married?',
          question: t('¿Ha estado casado/a antes?', 'Have you been married before?'),
          why: t('Para una K-1 ambos deben estar libres para casarse: el matrimonio anterior debe haber terminado.', 'For a K-1 you must both be free to marry: any prior marriage must have ended.'),
          options: yesNo,
        },
        {
          id: 'pet.prevSpouse',
          kind: 'fields',
          formRef: 'Part 1 · Items 38–39',
          showIf: is('pet.prevMarried', 'yes'),
          question: t('Su cónyuge anterior', 'Your previous spouse'),
          why: t('Si hubo más de uno, escriba los demás en la Parte 8.', 'If more than one, write the rest in Part 8.'),
          fields: [...nameFields('pet.prevSpouse', 'Part 1 · Item 38'), date('pet.prevSpouse.ended', 'Fecha en que terminó el matrimonio', 'Date marriage ended', 'Part 1 · Item 39')],
        },
        {
          id: 'pet.citizenVia',
          kind: 'choice',
          formRef: 'Part 1 · Item 40 · You are a U.S. citizen through',
          question: t('¿Cómo es usted ciudadano/a de EE.UU.?', 'How are you a U.S. citizen?'),
          options: [
            { value: 'A', label: t('Nací en EE.UU.', 'Birth in the United States') },
            { value: 'B', label: t('Me naturalicé', 'Naturalization') },
            { value: 'C', label: t('Por mis padres ciudadanos', 'U.S. citizen parents') },
          ],
        },
        {
          id: 'pet.certificate',
          kind: 'choice',
          formRef: 'Part 1 · Item 41 · Certificate of Naturalization or Citizenship',
          showIf: is('pet.citizenVia', 'B', 'C'),
          question: t('¿Tiene un certificado de naturalización o de ciudadanía a su nombre?', 'Do you have a Certificate of Naturalization or Citizenship in your name?'),
          options: yesNo,
        },
        {
          id: 'pet.certificateDetails',
          kind: 'fields',
          formRef: 'Part 1 · Items 42.a–42.c',
          showIf: all(is('pet.citizenVia', 'B', 'C'), is('pet.certificate', 'yes')),
          question: t('Su certificado', 'Your certificate'),
          fields: [
            { id: 'pet.cert.number', type: 'text', required: true, label: { es: 'Número del certificado', en: 'Certificate number' }, formRef: 'Part 1 · Item 42.a' },
            { id: 'pet.cert.place', type: 'text', required: true, label: { es: 'Lugar de emisión', en: 'Place of issuance' }, formRef: 'Part 1 · Item 42.b', placeholder: 'Los Angeles, CA' },
            date('pet.cert.date', 'Fecha de emisión', 'Date of issuance', 'Part 1 · Item 42.c'),
          ],
        },
        {
          id: 'pet.priorPetition',
          kind: 'choice',
          formRef: 'Part 1 · Item 43 · Have you ever filed Form I-129F for any other beneficiary?',
          question: t('¿Ha presentado antes un I-129F para otra persona?', 'Have you filed Form I-129F for anyone else before?'),
          options: yesNo,
        },
        {
          id: 'pet.prior',
          kind: 'fields',
          formRef: 'Part 1 · Items 44–47',
          showIf: is('pet.priorPetition', 'yes'),
          question: t('Esa petición anterior', 'That previous petition'),
          why: t('Si fueron varias, escriba las demás en la Parte 8. Dos o más peticiones pueden requerir una exención (Parte 3).', 'If several, write the rest in Part 8. Two or more petitions may need a waiver (Part 3).'),
          fields: [
            { id: 'pet.prior.aNumber', type: 'aNumber', label: { es: 'A-Number de esa persona (si tiene)', en: 'Their A-Number (if any)' }, formRef: 'Part 1 · Item 44' },
            ...nameFields('pet.prior', 'Part 1 · Item 45'),
            date('pet.prior.date', 'Fecha de presentación', 'Date of filing', 'Part 1 · Item 46'),
            { id: 'pet.prior.result', type: 'text', required: true, label: { es: 'Qué decidió USCIS (approved, denied, revoked…)', en: 'USCIS action' }, formRef: 'Part 1 · Item 47', maxLength: 30, placeholder: 'approved' },
          ],
        },
        {
          id: 'pet.kids',
          kind: 'choice',
          formRef: 'Part 1 · Item 48 · Do you have any children under 18 years of age?',
          question: t('¿Tiene hijos menores de 18 años?', 'Do you have children under 18?'),
          options: yesNo,
        },
        {
          id: 'pet.kidsAges',
          kind: 'fields',
          formRef: 'Part 1 · Items 49.a–49.b',
          showIf: is('pet.kids', 'yes'),
          question: t('¿Qué edades tienen?', 'How old are they?'),
          fields: [
            { id: 'pet.kid1.age', type: 'number', required: true, label: { es: 'Edad', en: 'Age' }, formRef: 'Part 1 · Item 49.a', maxLength: 2 },
            { id: 'pet.kid2.age', type: 'number', label: { es: 'Edad de otro hijo (si tiene)', en: 'Age of another child (if any)' }, formRef: 'Part 1 · Item 49.b', maxLength: 2 },
          ],
        },
        {
          id: 'pet.residences',
          kind: 'fields',
          formRef: 'Part 1 · Items 50–51 · States and countries since your 18th birthday',
          question: t('¿En qué estados o países ha vivido desde los 18 años?', 'Which states or countries have you lived in since age 18?'),
          why: t('Para EE.UU., el estado (por ejemplo CA); para otro país, solo el país. Si son más de dos, escriba los demás en la Parte 8.', 'For the U.S., the state (for example CA); for another country, just the country. If more than two, write the rest in Part 8.'),
          fields: [
            { id: 'pet.res1.state', type: 'state', label: { es: 'Estado 1', en: 'State 1' }, formRef: 'Part 1 · Item 50.a' },
            { id: 'pet.res1.country', type: 'text', required: true, label: { es: 'País 1', en: 'Country 1' }, formRef: 'Part 1 · Item 50.b', placeholder: 'United States' },
            { id: 'pet.res2.state', type: 'state', label: { es: 'Estado 2', en: 'State 2' }, formRef: 'Part 1 · Item 51.a' },
            { id: 'pet.res2.country', type: 'text', label: { es: 'País 2', en: 'Country 2' }, formRef: 'Part 1 · Item 51.b' },
          ],
        },
      ],
    },
    {
      id: 'beneficiary',
      part: 'Part 2',
      title: t('Su prometido/a', 'Your fiancé(e)'),
      questions: [
        {
          id: 'ben.name',
          kind: 'fields',
          formRef: 'Part 2 · Item 1 · Beneficiary’s Full Name',
          question: t('¿Cuál es el nombre legal completo de su prometido/a?', 'What is your fiancé(e)’s full legal name?'),
          notice: { tone: 'info', title: { es: 'Ahora, sobre su prometido/a', en: 'Now, about your fiancé(e)' }, body: { es: 'Estas preguntas son sobre la persona que vendrá con la visa.', en: 'These questions are about the person who will come on the visa.' } },
          fields: nameFields('ben', 'Part 2 · Item 1').map((f) => ({ ...f, maxLength: f.id.endsWith('middle') ? 18 : 30 })),
        },
        {
          id: 'ben.details',
          kind: 'fields',
          formRef: 'Part 2 · Items 2–9',
          question: t('Sus datos', 'Their details'),
          fields: [
            { id: 'ben.aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 2 · Item 2' },
            { id: 'ben.ssn', type: 'ssn', label: { es: 'Número de Seguro Social (si tiene)', en: 'Social Security number (if any)' }, formRef: 'Part 2 · Item 3' },
            date('ben.dob', 'Fecha de nacimiento', 'Date of birth', 'Part 2 · Item 4'),
            sexField('ben.sex', 'Part 2 · Item 5'),
            maritalField('ben.marital', 'Part 2 · Item 6 · Marital Status'),
            { id: 'ben.birthCity', type: 'text', required: true, label: { es: 'Ciudad de nacimiento', en: 'City of birth' }, formRef: 'Part 2 · Item 7', maxLength: 20 },
            { id: 'ben.birthCountry', type: 'text', required: true, label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: 'Part 2 · Item 8' },
            { id: 'ben.citizenship', type: 'text', required: true, label: { es: 'País de ciudadanía', en: 'Country of citizenship' }, formRef: 'Part 2 · Item 9' },
          ],
        },
        {
          id: 'ben.otherName.has',
          kind: 'choice',
          formRef: 'Part 2 · Item 10 · Other Names Used',
          question: t('¿Ha usado su prometido/a otros nombres?', 'Has your fiancé(e) used other names?'),
          options: yesNo,
        },
        {
          id: 'ben.otherName',
          kind: 'fields',
          formRef: 'Part 2 · Item 10',
          showIf: is('ben.otherName.has', 'yes'),
          question: t('Otro nombre que ha usado', 'Another name they have used'),
          fields: nameFields('ben.otherName', 'Part 2 · Item 10').map((f) => ({ ...f, maxLength: f.id.endsWith('family') ? 30 : 18 })),
        },
        {
          id: 'ben.mailing',
          kind: 'fields',
          formRef: 'Part 2 · Item 11 · Mailing Address for Your Beneficiary',
          question: t('¿A qué dirección le llega el correo a su prometido/a?', 'Where does your fiancé(e) get mail?'),
          fields: address('ben.mailing', 'Part 2 · Item 11', true),
        },
        {
          id: 'ben.mailingSame',
          kind: 'choice',
          formRef: 'Part 2 · Item 12',
          question: t('¿Vive su prometido/a en esa misma dirección?', 'Does your fiancé(e) live at that same address?'),
          options: yesNo,
        },
        ...addressHistory('ben', (n) => `Part 2 · Physical Address ${n} · Item ${n === 1 ? 12 : 14}`, t('su prometido/a', 'your fiancé(e)')),
        ...jobs('ben', (n) => `Part 2 · Employer ${n} · Items ${n === 1 ? '16–19' : '20–23'}`, t('su prometido/a', 'your fiancé(e)')),
        { id: 'ben.parent1', kind: 'fields', formRef: 'Part 2 · Items 24–28 · Parent 1', question: t('El padre o la madre de su prometido/a', 'Your fiancé(e)’s parent'), fields: parent('ben.parent1', 'Part 2 · Parent 1') },
        { id: 'ben.parent2', kind: 'fields', formRef: 'Part 2 · Items 29–33 · Parent 2', question: t('El otro padre o madre de su prometido/a', 'Your fiancé(e)’s other parent'), fields: parent('ben.parent2', 'Part 2 · Parent 2') },
        {
          id: 'ben.prevMarried',
          kind: 'choice',
          formRef: 'Part 2 · Item 34',
          question: t('¿Ha estado casado/a antes su prometido/a?', 'Has your fiancé(e) been married before?'),
          options: yesNo,
        },
        {
          id: 'ben.prevSpouse',
          kind: 'fields',
          formRef: 'Part 2 · Items 35–36',
          showIf: is('ben.prevMarried', 'yes'),
          question: t('Su cónyuge anterior', 'Their previous spouse'),
          fields: [...nameFields('ben.prevSpouse', 'Part 2 · Item 35'), date('ben.prevSpouse.ended', 'Fecha en que terminó el matrimonio', 'Date marriage ended', 'Part 2 · Item 36')],
        },
        {
          id: 'ben.everInUS',
          kind: 'choice',
          formRef: 'Part 2 · Item 37 · Has your beneficiary ever been in the United States?',
          question: t('¿Ha estado alguna vez su prometido/a en EE.UU.?', 'Has your fiancé(e) ever been in the U.S.?'),
          options: yesNo,
        },
        {
          id: 'ben.inUSNow',
          kind: 'choice',
          formRef: 'Part 2 · Item 38',
          showIf: is('ben.everInUS', 'yes'),
          question: t('¿Está su prometido/a en EE.UU. ahora?', 'Is your fiancé(e) in the U.S. now?'),
          options: yesNo,
        },
        {
          id: 'ben.entry',
          kind: 'fields',
          formRef: 'Part 2 · Items 38.a–38.h',
          showIf: all(is('ben.everInUS', 'yes'), is('ben.inUSNow', 'yes')),
          question: t('Su entrada más reciente', 'Their most recent entry'),
          fields: [
            { id: 'ben.entry.as', type: 'text', required: true, label: { es: 'Entró como (visitor, student, without inspection…)', en: 'Last entered as' }, formRef: 'Part 2 · Item 38.a', placeholder: 'visitor' },
            { id: 'ben.entry.i94', type: 'i94', label: { es: 'Número de I-94', en: 'I-94 number' }, formRef: 'Part 2 · Item 38.b' },
            date('ben.entry.date', 'Fecha de llegada', 'Date of arrival', 'Part 2 · Item 38.c'),
            { id: 'ben.entry.until', type: 'date', label: { es: 'Su estadía vence (según el I-94)', en: 'Authorized stay expires' }, formRef: 'Part 2 · Item 38.d' },
            { id: 'ben.passport', type: 'text', label: { es: 'Número de pasaporte', en: 'Passport number' }, formRef: 'Part 2 · Item 38.e', maxLength: 30 },
            { id: 'ben.travelDoc', type: 'text', label: { es: 'Número de documento de viaje', en: 'Travel document number' }, formRef: 'Part 2 · Item 38.f', maxLength: 30 },
            { id: 'ben.passportCountry', type: 'text', label: { es: 'País que emitió el pasaporte', en: 'Country of issuance' }, formRef: 'Part 2 · Item 38.g' },
            { id: 'ben.passportExpires', type: 'date', label: { es: 'Vencimiento del pasaporte', en: 'Passport expiration' }, formRef: 'Part 2 · Item 38.h' },
          ],
        },
        {
          id: 'ben.kids',
          kind: 'choice',
          formRef: 'Part 2 · Item 39 · Does your beneficiary have any children?',
          question: t('¿Tiene hijos su prometido/a?', 'Does your fiancé(e) have children?'),
          why: t('Los hijos solteros menores de 21 pueden venir con una visa K-2.', 'Unmarried children under 21 can come on a K-2 visa.'),
          options: yesNo,
        },
        {
          id: 'ben.kid',
          kind: 'fields',
          formRef: 'Part 2 · Items 40–43',
          showIf: is('ben.kids', 'yes'),
          question: t('Su hijo o hija', 'Their child'),
          why: t('Si tiene más de uno, escriba los demás en la Parte 8.', 'If more than one, write the rest in Part 8.'),
          fields: [
            ...nameFields('ben.kid', 'Part 2 · Item 40'),
            { id: 'ben.kid.birthCountry', type: 'text', required: true, label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: 'Part 2 · Item 41' },
            date('ben.kid.dob', 'Fecha de nacimiento', 'Date of birth', 'Part 2 · Item 42'),
            { id: 'ben.kid.withBen', type: 'select', required: true, label: { es: '¿Vive con su prometido/a?', en: 'Does this child live with your fiancé(e)?' }, formRef: 'Part 2 · Item 43', options: yesNo },
          ],
        },
        {
          id: 'ben.kidAddress',
          kind: 'fields',
          formRef: 'Part 2 · Item 44',
          showIf: all(is('ben.kids', 'yes'), is('ben.kid.withBen', 'no')),
          question: t('¿Dónde vive ese hijo o hija?', 'Where does that child live?'),
          fields: address('ben.kid.home', 'Part 2 · Item 44'),
        },
        {
          id: 'ben.usAddress',
          kind: 'fields',
          formRef: 'Part 2 · Items 45–46 · Address in the United States Where Your Beneficiary Intends to Live',
          question: t('¿Dónde vivirá su prometido/a en EE.UU.?', 'Where will your fiancé(e) live in the U.S.?'),
          fields: [
            { id: 'ben.us.street', type: 'text', required: true, label: { es: 'Número y calle', en: 'Street number and name' }, formRef: 'Part 2 · Item 45.a', maxLength: 25, placeholder: '1234 Main St' },
            { id: 'ben.us.unit', type: 'unit', label: { es: 'Apartamento, suite o piso', en: 'Apt., suite or floor' }, formRef: 'Part 2 · Item 45.b' },
            { id: 'ben.us.city', type: 'text', required: true, label: { es: 'Ciudad', en: 'City or town' }, formRef: 'Part 2 · Item 45.c', maxLength: 20 },
            { id: 'ben.us.state', type: 'state', required: true, label: { es: 'Estado', en: 'State' }, formRef: 'Part 2 · Item 45.d' },
            { id: 'ben.us.zip', type: 'zip', required: true, label: { es: 'Código postal', en: 'ZIP code' }, formRef: 'Part 2 · Item 45.e' },
            { id: 'ben.us.phone', type: 'phone', label: { es: 'Teléfono de día en EE.UU.', en: 'Daytime phone in the U.S.' }, formRef: 'Part 2 · Item 46' },
          ],
        },
        {
          id: 'ben.abroad',
          kind: 'fields',
          formRef: 'Part 2 · Items 47–48 · Your Beneficiary’s Physical Address Abroad',
          question: t('¿Cuál es la dirección de su prometido/a en el extranjero?', 'What is your fiancé(e)’s address abroad?'),
          fields: [
            { id: 'ben.abroad.street', type: 'text', required: true, label: { es: 'Número y calle', en: 'Street number and name' }, formRef: 'Part 2 · Item 47.a', maxLength: 25 },
            { id: 'ben.abroad.unit', type: 'unit', label: { es: 'Apartamento, suite o piso', en: 'Apt., suite or floor' }, formRef: 'Part 2 · Item 47.b' },
            { id: 'ben.abroad.city', type: 'text', required: true, label: { es: 'Ciudad', en: 'City or town' }, formRef: 'Part 2 · Item 47.c', maxLength: 20 },
            { id: 'ben.abroad.province', type: 'text', label: { es: 'Provincia o estado', en: 'Province' }, formRef: 'Part 2 · Item 47.d', maxLength: 20 },
            { id: 'ben.abroad.postal', type: 'text', label: { es: 'Código postal', en: 'Postal code' }, formRef: 'Part 2 · Item 47.e', maxLength: 9 },
            { id: 'ben.abroad.country', type: 'text', required: true, label: { es: 'País', en: 'Country' }, formRef: 'Part 2 · Item 47.f' },
            { id: 'ben.abroad.phone', type: 'text', label: { es: 'Teléfono de día (solo números)', en: 'Daytime phone (digits only)' }, formRef: 'Part 2 · Item 48', maxLength: 10 },
          ],
        },
        {
          id: 'ben.native.has',
          kind: 'choice',
          formRef: 'Part 2 · Items 49–50 · Name and Address in Native Alphabet',
          question: t('¿Su prometido/a escribe su nombre en otro alfabeto (por ejemplo, cirílico, árabe o chino)?', 'Does your fiancé(e) write their name in another alphabet (for example Cyrillic, Arabic or Chinese)?'),
          why: t('El PDF solo admite letras latinas: si responde Sí, escriba el nombre y la dirección en ese alfabeto a mano en el formulario.', 'The PDF only takes Latin letters: if Yes, write the name and address in that alphabet by hand on the form.'),
          options: yesNo,
        },
        {
          id: 'related',
          kind: 'choice',
          formRef: 'Part 2 · Item 51 · Is your fiancé(e) related to you?',
          question: t('¿Son parientes usted y su prometido/a?', 'Are you and your fiancé(e) related?'),
          options: [...yesNo.map((o) => ({ ...o, value: o.value === 'yes' ? 'Y' : 'N' })), { value: 'A', label: t('No aplica: es mi cónyuge (K-3)', 'N/A, beneficiary is my spouse') }],
        },
        {
          id: 'relatedHow',
          kind: 'fields',
          formRef: 'Part 2 · Item 52',
          showIf: is('related', 'Y'),
          question: t('¿Qué parentesco tienen?', 'How are you related?'),
          fields: [{ id: 'related.how', type: 'text', required: true, label: { es: 'Parentesco (en inglés, por ejemplo "third cousin")', en: 'Nature and degree of relationship' }, formRef: 'Part 2 · Item 52', maxLength: 30 }],
        },
        {
          id: 'met',
          kind: 'choice',
          formRef: 'Part 2 · Item 53 · Have you met in person during the two years immediately before filing?',
          question: t('¿Se han visto en persona en los últimos 2 años?', 'Have you met in person in the last 2 years?'),
          options: [...yesNo.map((o) => ({ ...o, value: o.value === 'yes' ? 'Y' : 'N' })), { value: 'A', label: t('No aplica: es mi cónyuge (K-3)', 'N/A, beneficiary is my spouse') }],
        },
        {
          id: 'metDescribe',
          kind: 'fields',
          formRef: 'Part 2 · Item 54',
          showIf: is('met', 'Y', 'N'),
          question: t('Cuente cómo se conocieron en persona (o por qué pide la exención)', 'Describe your in-person meeting (or why you ask for an exemption)'),
          why: t(
            'Si se vieron, diga cuándo y dónde, y adjunte pruebas (boletos, fotos, sellos de pasaporte). Si no, explique por qué: por ejemplo, una costumbre cultural o un sufrimiento extremo.',
            'If you met, say when and where, and attach evidence (tickets, photos, passport stamps). If not, explain why: for example, a cultural custom or extreme hardship.',
          ),
          fields: [{ id: 'met.describe', type: 'longText', required: true, label: { es: 'Descripción (en inglés)', en: 'Description' }, formRef: 'Part 2 · Item 54' }],
        },
        {
          id: 'imb',
          kind: 'choice',
          formRef: 'Part 2 · Item 55 · International Marriage Broker',
          question: t('¿Conoció a su prometido/a por una agencia matrimonial internacional?', 'Did you meet through an international marriage broker?'),
          why: t('Las apps y sitios de citas comunes normalmente no cuentan como agencia matrimonial.', 'Ordinary dating apps and sites usually don’t count as a marriage broker.'),
          options: yesNo,
        },
        {
          id: 'imbDetails',
          kind: 'fields',
          formRef: 'Part 2 · Items 56–61',
          showIf: is('imb', 'yes'),
          question: t('Datos de la agencia', 'About the broker'),
          fields: [
            { id: 'imb.name', type: 'text', label: { es: 'Nombre de la agencia', en: 'IMB’s name' }, formRef: 'Part 2 · Item 56' },
            { id: 'imb.family', type: 'text', label: { es: 'Apellido del contacto', en: 'Contact family name' }, formRef: 'Part 2 · Item 57.a', maxLength: 30 },
            { id: 'imb.given', type: 'text', label: { es: 'Nombre del contacto', en: 'Contact given name' }, formRef: 'Part 2 · Item 57.b', maxLength: 18 },
            { id: 'imb.org', type: 'text', label: { es: 'Nombre de la organización', en: 'Organization name' }, formRef: 'Part 2 · Item 58', maxLength: 34 },
            { id: 'imb.website', type: 'text', label: { es: 'Sitio web', en: 'Website' }, formRef: 'Part 2 · Item 59', maxLength: 38 },
            ...address('imb', 'Part 2 · Item 60').filter((f) => !/\.(state|zip)$/.test(f.id)).map((f) => ({ ...f, required: false })),
            { id: 'imb.phone', type: 'text', label: { es: 'Teléfono (solo números)', en: 'Phone (digits only)' }, formRef: 'Part 2 · Item 61', maxLength: 10 },
          ],
        },
        {
          id: 'consulate',
          kind: 'fields',
          formRef: 'Part 2 · Item 62 · Consular Processing Information',
          question: t('¿En qué embajada o consulado pedirá la visa su prometido/a?', 'At which embassy or consulate will your fiancé(e) apply?'),
          why: t('Normalmente la del país donde vive. En México, las visas de inmigrante se tramitan en Ciudad Juárez.', 'Usually in the country where they live. In Mexico, immigrant visas are processed in Ciudad Juarez.'),
          fields: [
            { id: 'consulate.city', type: 'text', required: true, label: { es: 'Ciudad', en: 'City or town' }, formRef: 'Part 2 · Item 62.a', maxLength: 20, placeholder: 'Ciudad Juarez' },
            { id: 'consulate.country', type: 'text', required: true, label: { es: 'País', en: 'Country' }, formRef: 'Part 2 · Item 62.b', placeholder: 'Mexico' },
          ],
        },
      ],
    },
    {
      id: 'criminal',
      part: 'Part 3',
      title: t('Antecedentes', 'Other information'),
      questions: [
        {
          id: 'crimes',
          kind: 'yesNoList',
          formRef: 'Part 3 · Items 1–4.a · Criminal Information',
          question: t('Preguntas sobre antecedentes', 'Criminal history questions'),
          why: t('Responda aunque los antecedentes se hayan borrado o sellado. Su prometido/a recibirá esta información.', 'Answer even if records were sealed or cleared. Your fiancé(e) will receive this information.'),
          items: CRIME_ITEMS,
        },
        {
          id: 'crime.battered',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 3 · Items 3.a–3.c',
          showIf: anyListedCrime,
          question: t('Si sufría maltrato cuando lo condenaron, ¿qué aplica?', 'If you were being battered when convicted, what applies?'),
          why: t('Elija todo lo que aplique, o nada si no aplica.', 'Choose all that apply, or none.'),
          options: [
            { value: 'A', label: t('Actué en defensa propia', 'I was acting in self-defense') },
            { value: 'B', label: t('Violé una orden de protección emitida para protegerme a mí', 'I violated a protection order issued for my own protection') },
            { value: 'C', label: t('El delito no causó lesiones graves y tuvo relación con el maltrato que sufría', 'The crime did not cause serious injury and was connected to my being battered') },
          ],
        },
        {
          id: 'crimeDescribe',
          kind: 'fields',
          formRef: 'Part 3 · Item 4.b',
          showIf: (a) => CRIME_ITEMS.some((i) => a[i.id] === 'yes'),
          question: t('Explique cada caso', 'Explain each case'),
          notice: { tone: 'legal', title: { es: 'Consulte a un abogado', en: 'Talk to an attorney' }, body: { es: 'Adjunte copias certificadas de los documentos de la corte y la policía. Un abogado debe revisar su caso antes de presentar.', en: 'Attach certified court and police records. An attorney should review your case before filing.' } },
          fields: [{ id: 'crime.describe', type: 'longText', required: true, label: { es: 'Qué pasó, cuándo, dónde y cómo terminó (en inglés)', en: 'What happened, when, where and the outcome' }, formRef: 'Part 3 · Item 4.b' }],
        },
        {
          id: 'waiver',
          kind: 'choice',
          formRef: 'Part 3 · Items 5.a–5.d · Multiple Filer Waiver',
          question: t('¿Necesita una exención por haber presentado varias peticiones?', 'Do you need a multiple-filer waiver?'),
          why: t('Se necesita si ya presentó dos o más I-129F, o si le aprobaron uno en los últimos 2 años.', 'Needed if you filed two or more I-129Fs before, or had one approved in the last 2 years.'),
          options: [
            { value: 'D', label: t('No: no he presentado varias, o es mi cónyuge (K-3)', 'No: I am not a multiple filer, or the beneficiary is my spouse') },
            { value: 'A', label: t('Sí, sin órdenes de alejamiento ni condenas de la lista (exención general)', 'Yes, with no restraining orders or listed convictions (general waiver)') },
            { value: 'B', label: t('Sí, con órdenes o condenas de la lista (circunstancias extraordinarias)', 'Yes, with orders or listed convictions (extraordinary circumstances)') },
            { value: 'C', label: t('Sí, con órdenes o condenas por haber sufrido violencia doméstica (exención obligatoria)', 'Yes, with orders or convictions resulting from domestic violence (mandatory waiver)') },
          ],
        },
      ],
    },
    {
      id: 'biographic',
      part: 'Part 4',
      title: t('Sus datos biográficos', 'Your biographic information'),
      questions: biographic('Part 4'),
    },
    {
      id: 'contact',
      part: 'Part 5',
      title: t('Contacto', 'Contact'),
      questions: [
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 5 · Items 1–3 · Petitioner’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 5 · Item 1', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 5 · Item 2' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 5 · Item 3', maxLength: 38 },
          ],
        },
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 5 · Petitioner’s Certification',
          question: t('¿Puede leer y entender la petición en inglés?', 'Can you read and understand the petition in English?'),
          why: t('Si alguien se la traduce, esa persona llena y firma la Parte 6 (intérprete).', 'If someone translates it for you, they fill in and sign Part 6 (interpreter).'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me la leerá', 'No, an interpreter will read it to me') },
          ],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 7 · Contact Information, Declaration, and Signature of the Person Preparing this Petition',
          question: t('¿Alguien más (no usted) preparó esta petición?', 'Did someone else prepare this petition for you?'),
          why: t('Si es así, esa persona también llena y firma la Parte 7.', 'If so, that person also completes and signs Part 7.'),
          options: yesNo,
        },
      ],
    },
    assistance(),
  ],
};
