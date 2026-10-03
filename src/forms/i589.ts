import type { Answers, Field, FormDefinition, Question } from './types';
import type { T } from '../i18n';
import { all, date, is, nameFields, rows, sexField, yesNo } from './helpers';

// Questions follow USCIS Form I-589, Application for Asylum and for Withholding of Removal,
// edition 07/28/26. The PDF mapping lives in src/pdf/i589Pdf.ts. Supplement A (children 5 and
// up), Part E (the preparer) and Parts F-G (signed at the interview or hearing) are left for hand.

export const I589_EDITION = '07/28/26';

const t = (es: string, en: string): T => ({ es, en });

const always = () => true;

/** A month and year, the way Part A.III asks its dates. */
const monthYear = (id: string, es: string, en: string, formRef: string, required = true): Field => ({
  id,
  type: 'text',
  required,
  label: { es, en },
  formRef,
  placeholder: 'MM/AAAA',
  maxLength: 7,
  hint: t('Mes y año, por ejemplo 03/2019. Si es su dirección o trabajo actual, escriba Present.', 'Month and year, for example 03/2019. For your current address or job, write Present.'),
});

const text = (id: string, es: string, en: string, formRef: string, opts: Partial<Field> = {}): Field => ({
  id,
  type: 'text',
  required: true,
  label: { es, en },
  formRef,
  ...opts,
});

/** A Yes/No question followed by its "If Yes, explain" box. */
const yesExplain = (opts: { id: string; formRef: string; question: T; why?: T; explain: T; showIf?: (a: Answers) => boolean; notice?: Question['notice'] }): Question[] => [
  { id: opts.id, kind: 'choice', formRef: opts.formRef, question: opts.question, why: opts.why, showIf: opts.showIf, notice: opts.notice, options: yesNo },
  {
    id: `${opts.id}Explain`,
    kind: 'fields',
    formRef: `${opts.formRef} · If "Yes," explain`,
    showIf: all(opts.showIf ?? always, is(opts.id, 'yes')),
    question: t('Explique con detalle', 'Explain in detail'),
    why: t('Escriba en inglés, con fechas, lugares y nombres. Si no cabe en el espacio del formulario, la app lo pasa al Suplemento B.', 'Write in English, with dates, places and names. If it does not fit on the form, the app moves it to Supplement B.'),
    fields: [{ id: `${opts.id}.explain`, type: 'longText', required: true, label: opts.explain, formRef: opts.formRef }],
  },
];

/** Where a spouse or child is now: in the U.S. (Items about entry and status) or elsewhere. */
const whereabouts = (p: string, ref: string, who: T, shown: (a: Answers) => boolean, entryItems: [number, number], previousArrival = false): Question[] => {
  const [first, last] = entryItems;
  const n = (k: number) => `${ref} · Item ${first + k}`;
  const inUS = all(shown, is(`${p}.inUS`, 'yes'));
  return [
    {
      id: `${p}.inUS`,
      kind: 'choice',
      formRef: `${ref} · Item ${first - 1}`,
      showIf: shown,
      question: t(`¿${who.es} está en EE.UU.?`, `Is ${who.en} in the U.S.?`),
      options: yesNo,
    },
    {
      id: `${p}Location`,
      kind: 'fields',
      formRef: `${ref} · Item ${first - 1} · Specify location`,
      showIf: all(shown, is(`${p}.inUS`, 'no')),
      question: t('¿Dónde vive ahora?', 'Where does this person live now?'),
      fields: [text(`${p}.location`, 'Ciudad y país', 'City and country', `${ref} · Item ${first - 1}`, { placeholder: 'San Salvador, El Salvador' })],
    },
    {
      id: `${p}Entry`,
      kind: 'fields',
      formRef: `${ref} · Items ${first}–${last}`,
      showIf: inUS,
      question: t('Su entrada y estatus en EE.UU.', 'Entry and status in the U.S.'),
      fields: [
        text(`${p}.entryPlace`, 'Lugar de la última entrada a EE.UU.', 'Place of last entry into the U.S.', n(0), { placeholder: 'Hidalgo, TX' }),
        date(`${p}.entryDate`, 'Fecha de la última entrada', 'Date of last entry', n(1)),
        { id: `${p}.i94`, type: 'i94', label: { es: 'Número de I-94 (si tiene)', en: 'I-94 number (if any)' }, formRef: n(2) },
        text(`${p}.admittedStatus`, 'Estatus al entrar (tipo de visa, si tuvo)', 'Status when last admitted (visa type, if any)', n(3), { required: false, placeholder: 'Parole' }),
        text(`${p}.status`, 'Estatus actual (en inglés)', 'Current status', n(4), { placeholder: 'No status' }),
        date(`${p}.statusExpires`, 'Vencimiento de su permanencia autorizada (si tiene)', 'Expiration of authorized stay (if any)', n(5), false, 'date'),
        ...(previousArrival ? [date(`${p}.previousArrival`, 'Si estuvo antes en EE.UU., fecha de esa llegada', 'If previously in the U.S., date of previous arrival', `${ref} · Item 23`, false)] : []),
      ],
    },
    { id: `${p}.court`, kind: 'choice', formRef: n(6), showIf: inUS, question: t('¿Está en procesos ante una Corte de Inmigración?', 'Is this person in Immigration Court proceedings?'), options: yesNo },
    {
      id: `${p}.include`,
      kind: 'choice',
      formRef: `${ref} · Item ${last + 1}`,
      showIf: inUS,
      question: t('¿Lo incluye en esta solicitud?', 'Do you want to include this person in this application?'),
      why: t('Su cónyuge y sus hijos solteros menores de 21 que están en EE.UU. pueden recibir asilo con usted. Por cada uno necesitará pruebas del parentesco, como actas de nacimiento o de matrimonio.', 'Your spouse and unmarried children under 21 in the U.S. can be granted asylum with you. For each one you’ll need proof of the relationship, such as birth or marriage certificates.'),
      options: yesNo,
    },
  ];
};

const relativeFields = (p: string, ref: string, opts: { childItems?: boolean }): Field[] => [
  ...nameFields(p, `${ref} · Items 5–7`),
  { id: `${p}.aNumber`, type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: `${ref} · Item 1` },
  text(`${p}.passport`, 'Número de pasaporte o identificación (si tiene)', 'Passport/ID card number (if any)', `${ref} · Item 2`, { required: false }),
  date(`${p}.dob`, 'Fecha de nacimiento', 'Date of birth', `${ref} · Item ${opts.childItems ? 8 : 3}`),
  { id: `${p}.ssn`, type: 'ssn', label: { es: 'Seguro Social (si tiene)', en: 'Social Security number (if any)' }, formRef: `${ref} · Item 4` },
  text(`${p}.birthPlace`, 'Ciudad y país de nacimiento', 'City and country of birth', `${ref} · Item ${opts.childItems ? 9 : 11}`, { placeholder: 'Santa Ana, El Salvador' }),
  text(`${p}.nationality`, 'Nacionalidad', 'Nationality (citizenship)', `${ref} · Item ${opts.childItems ? 10 : 12}`, { placeholder: 'Salvadoran' }),
  text(`${p}.group`, 'Grupo racial, étnico o tribal', 'Race, ethnic, or tribal group', `${ref} · Item ${opts.childItems ? 11 : 13}`, { placeholder: 'Mestizo' }),
  sexField(`${p}.sex`, `${ref} · Item ${opts.childItems ? 12 : 14}`),
];

/** Part A.II's four children, each with the questions about where they are. */
function children(): Question[] {
  const out: Question[] = [];
  for (let i = 1; i <= 4; i++) {
    const shown = all(is('hasChildren', 'yes'), (a) => [...Array(i - 1)].every((_, k) => a[`child.more${k + 1}`] === 'yes'));
    const ref = `Part A.II · Child ${i}`;
    out.push({
      id: `child${i}`,
      kind: 'fields',
      formRef: `${ref} · Items 1–12`,
      showIf: shown,
      question: i === 1 ? t('Su primer hijo o hija', 'Your first child') : t(`Su hijo o hija número ${i}`, `Your child number ${i}`),
      fields: [
        ...relativeFields(`child${i}`, ref, { childItems: true }),
        {
          id: `child${i}.marital`,
          type: 'select',
          required: true,
          label: { es: 'Estado civil', en: 'Marital status' },
          formRef: `${ref} · Item 3`,
          options: [
            { value: 'Single', label: t('Soltero(a)', 'Single') },
            { value: 'Married', label: t('Casado(a)', 'Married') },
            { value: 'Divorced', label: t('Divorciado(a)', 'Divorced') },
            { value: 'Widowed', label: t('Viudo(a)', 'Widowed') },
          ],
        },
      ],
    });
    out.push(...whereabouts(`child${i}`, ref, t('este hijo o hija', 'this child'), shown, [14, 20]));
    out.push({
      id: `child.more${i}`,
      kind: 'choice',
      formRef: 'Part A.II · Your Children',
      showIf: shown,
      question: t('¿Tiene otro hijo o hija?', 'Do you have another child?'),
      options: yesNo,
      ...(i === 4 ? { notice: { tone: 'info' as const, title: t('Más de cuatro hijos', 'More than four children'), body: t('Ponga a los demás a mano en el Suplemento A del I-589 (página 11).', 'List the others by hand on Form I-589 Supplement A (page 11).') } } : {}),
    });
  }
  return out;
}

const address = (p: string, ref: string, dates = true): Field[] => [
  text(`${p}.street`, 'Número y calle (si la sabe)', 'Number and street (if available)', `${ref} · Number and Street`, { required: false }),
  text(`${p}.city`, 'Ciudad o pueblo', 'City/town', `${ref} · City/Town`),
  text(`${p}.province`, 'Departamento, provincia o estado', 'Department, province, or state', `${ref} · Department, Province, or State`, { required: false }),
  text(`${p}.country`, 'País', 'Country', `${ref} · Country`),
  ...(dates ? [monthYear(`${p}.from`, 'Desde (mes/año)', 'From (month/year)', `${ref} · From`), monthYear(`${p}.to`, 'Hasta (mes/año)', 'To (month/year)', `${ref} · To`)] : []),
];

const relative = (p: string, ref: string): Field[] => [
  text(`${p}.name`, 'Nombre completo', 'Full name', `${ref} · Full Name`),
  text(`${p}.birthPlace`, 'Ciudad y país de nacimiento', 'City/town and country of birth', `${ref} · City/Town and Country of Birth`),
  {
    id: `${p}.deceased`,
    type: 'select',
    required: true,
    label: { es: '¿Vive?', en: 'Is this person alive?' },
    formRef: `${ref} · Deceased`,
    options: [
      { value: 'no', label: t('Sí, vive', 'Yes, alive') },
      { value: 'yes', label: t('Falleció', 'Deceased') },
    ],
  },
  text(`${p}.location`, 'Dónde vive ahora (si vive)', 'Current location (if alive)', `${ref} · Current Location`, { required: false, placeholder: 'Guatemala City, Guatemala' }),
];

export const i589: FormDefinition = {
  id: 'i-589',
  number: 'I-589',
  edition: I589_EDITION,
  title: t('Solicitud de asilo y de suspensión de deportación', 'Application for Asylum and for Withholding of Removal'),
  summary: {
    es: 'Pida asilo si teme regresar a su país por su raza, religión, nacionalidad, opinión política o grupo social. Hay que presentarla dentro de un año de su llegada.',
    en: 'Apply for asylum if you fear returning to your country because of your race, religion, nationality, political opinion or social group. It must be filed within one year of arrival.',
  },
  intro: {
    es: 'El I-589 es la solicitud de asilo. Si no está en una Corte de Inmigración, se presenta a USCIS (en papel o en línea); si ya está en corte, se presenta ante el juez. Esta app le ayuda a ordenar sus datos y su historia, pero el asilo es un caso legal serio: una solicitud con datos falsos (frívola) le prohíbe para siempre cualquier beneficio migratorio. Le recomendamos mucho revisar todo con un abogado u organización acreditada antes de firmar.',
    en: 'Form I-589 is the asylum application. If you are not in Immigration Court, you file it with USCIS (on paper or online); if you are already in court, you file it with the judge. This app helps you organize your information and your story, but asylum is a serious legal case: an application with false information (frivolous) permanently bars you from any immigration benefit. We strongly recommend reviewing everything with an attorney or accredited organization before you sign.',
  },
  minutes: 90,
  pdf: {
    path: 'forms/i-589.pdf',
    fileName: 'I-589-filled.pdf',
    load: () => import('../pdf/i589Pdf').then((m) => m.fillI589),
    signHere: { es: 'Parte D (y la fecha del Suplemento B, si se usa)', en: 'Part D (and Supplement B’s date, if used)' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-589 que la edición {edition} sigue vigente, la tarifa de asilo y dónde enviarla. Si está en una Corte de Inmigración, preséntela ante la corte (EOIR), no a USCIS.',
      'Un abogado u organización acreditada debe revisar su historia (Parte B) antes de firmar. Pida la lista de servicios legales gratuitos o de bajo costo en justice.gov/eoir.',
      'Escriba a mano su nombre en su alfabeto nativo en la Parte D, si usa otro alfabeto, y firme la Parte D con tinta negra. Si alguien que no es familiar la preparó, esa persona llena y firma la Parte E. No firme las Partes F y G: se firman en la entrevista o en la corte.',
      'Adjunte copias de pasaportes (de tapa a tapa), I-94 y otros documentos de identidad, actas de nacimiento y matrimonio, y pruebas de su caso y de las condiciones de su país, con traducciones certificadas al inglés.',
      'Revise que sus explicaciones se lean completas en el PDF. Las que no caben en su espacio pasan al Suplemento B (página 12); si tampoco caben ahí, imprima más copias del Suplemento B y continúe a mano.',
      'Las fotos y huellas se toman después, en la cita de datos biométricos que USCIS le avisará por carta, para usted y cada familiar incluido. Guarde una copia completa de la solicitud para usted.',
    ],
    en: [
      'Check at uscis.gov/i-589 that edition {edition} is still current, the asylum fee and where to file. If you are in Immigration Court, file it with the court (EOIR), not with USCIS.',
      'An attorney or accredited organization should review your story (Part B) before you sign. Ask for the list of free or low-cost legal service providers at justice.gov/eoir.',
      'Write your name in your native alphabet in Part D by hand, if you use another alphabet, and sign Part D in black ink. If a non-relative prepared it, that person completes and signs Part E. Do not sign Parts F and G: they are signed at the interview or hearing.',
      'Attach copies of passports (cover to cover), I-94s and other identity documents, birth and marriage certificates, and evidence of your claim and of country conditions, with certified English translations.',
      'Check that your explanations read in full in the PDF. Those that do not fit in their box move to Supplement B (page 12); if they do not fit there either, print more copies of Supplement B and continue by hand.',
      'Photos and fingerprints are taken later, at the biometrics appointment USCIS will send you by mail, for you and each family member included. Keep a complete copy of the application for yourself.',
    ],
  },
  sections: [
    {
      id: 'about',
      part: 'Part A.I',
      title: t('Sus datos', 'About you'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part A.I · Items 4–7',
          question: t('¿Cuál es su nombre completo?', 'What is your full name?'),
          notice: {
            tone: 'legal',
            title: t('Antes de empezar', 'Before you start'),
            body: t(
              'Debe presentar el asilo dentro de un año de su última llegada, salvo excepciones. Diga siempre la verdad: una solicitud frívola le impide para siempre recibir beneficios migratorios. Si teme por su seguridad ahora mismo, llame al 911.',
              'You must file for asylum within one year of your last arrival, with limited exceptions. Always tell the truth: a frivolous application permanently bars you from immigration benefits. If you fear for your safety right now, call 911.',
            ),
          },
          fields: [
            ...nameFields('name', 'Part A.I · Items 4–6'),
            text('otherNames', 'Otros nombres que ha usado (de soltera, alias), separados por comas', 'Other names used (maiden name, aliases), comma separated', 'Part A.I · Item 7', { required: false }),
          ],
        },
        {
          id: 'ids',
          kind: 'fields',
          formRef: 'Part A.I · Items 1–3',
          question: t('Sus números', 'Your numbers'),
          fields: [
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part A.I · Item 1' },
            { id: 'ssn', type: 'ssn', label: { es: 'Seguro Social (si tiene)', en: 'U.S. Social Security number (if any)' }, formRef: 'Part A.I · Item 2' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Cuenta en línea de USCIS (si tiene)', en: 'USCIS online account number (if any)' }, formRef: 'Part A.I · Item 3' },
          ],
        },
        {
          id: 'residence',
          kind: 'fields',
          formRef: 'Part A.I · Item 8 · Residence in the U.S.',
          question: t('¿Dónde vive en EE.UU.?', 'Where do you live in the U.S.?'),
          why: t('Debe vivir en EE.UU. para presentar este formulario.', 'You must be living in the United States to file this form.'),
          fields: [
            text('residence.street', 'Número y calle', 'Street number and name', 'Part A.I · Item 8 · Street Number and Name', { placeholder: '1234 Main St' }),
            text('residence.apt', 'Número de apartamento', 'Apt. number', 'Part A.I · Item 8 · Apt. Number', { required: false, maxLength: 6 }),
            text('residence.city', 'Ciudad', 'City', 'Part A.I · Item 8 · City'),
            { id: 'residence.state', type: 'state', required: true, label: { es: 'Estado', en: 'State' }, formRef: 'Part A.I · Item 8 · State', placeholder: 'TX' },
            { id: 'residence.zip', type: 'zip', required: true, label: { es: 'Código postal', en: 'ZIP code' }, formRef: 'Part A.I · Item 8 · Zip Code' },
            { id: 'residence.phone', type: 'phone', label: { es: 'Teléfono', en: 'Telephone number' }, formRef: 'Part A.I · Item 8 · Telephone Number' },
          ],
        },
        {
          id: 'mailingSame',
          kind: 'choice',
          formRef: 'Part A.I · Item 9',
          question: t('¿Recibe correo en esa misma dirección?', 'Do you get mail at that same address?'),
          options: yesNo,
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part A.I · Item 9 · Mailing Address in the U.S.',
          showIf: is('mailingSame', 'no'),
          question: t('¿Cuál es su dirección postal?', 'What is your mailing address?'),
          fields: [
            text('mailing.careOf', 'A cargo de (si aplica)', 'In care of (if applicable)', 'Part A.I · Item 9 · In Care Of', { required: false }),
            text('mailing.street', 'Número y calle', 'Street number and name', 'Part A.I · Item 9 · Street Number and Name'),
            text('mailing.apt', 'Número de apartamento', 'Apt. number', 'Part A.I · Item 9 · Apt. Number', { required: false, maxLength: 6 }),
            text('mailing.city', 'Ciudad', 'City', 'Part A.I · Item 9 · City'),
            { id: 'mailing.state', type: 'state', required: true, label: { es: 'Estado', en: 'State' }, formRef: 'Part A.I · Item 9 · State', placeholder: 'TX' },
            { id: 'mailing.zip', type: 'zip', required: true, label: { es: 'Código postal', en: 'ZIP code' }, formRef: 'Part A.I · Item 9 · Zip Code' },
            { id: 'mailing.phone', type: 'phone', label: { es: 'Teléfono', en: 'Telephone number' }, formRef: 'Part A.I · Item 9 · Telephone Number' },
          ],
        },
        {
          id: 'personal',
          kind: 'fields',
          formRef: 'Part A.I · Items 10–17',
          question: t('Datos personales', 'Personal details'),
          fields: [
            sexField('sex', 'Part A.I · Item 10'),
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part A.I · Item 12'),
            text('birthPlace', 'Ciudad y país de nacimiento', 'City and country of birth', 'Part A.I · Item 13', { placeholder: 'Tegucigalpa, Honduras' }),
            text('nationality', 'Nacionalidad actual', 'Present nationality (citizenship)', 'Part A.I · Item 14', { placeholder: 'Honduran' }),
            text('nationalityBirth', 'Nacionalidad al nacer', 'Nationality at birth', 'Part A.I · Item 15', { placeholder: 'Honduran' }),
            text('group', 'Grupo racial, étnico o tribal', 'Race, ethnic, or tribal group', 'Part A.I · Item 16', { placeholder: 'Mestizo' }),
            text('religion', 'Religión', 'Religion', 'Part A.I · Item 17', { placeholder: 'Catholic' }),
          ],
        },
        {
          id: 'marital',
          kind: 'choice',
          formRef: 'Part A.I · Item 11 · Marital Status',
          question: t('¿Cuál es su estado civil?', 'What is your marital status?'),
          options: [
            { value: 'S', label: t('Soltero(a)', 'Single') },
            { value: 'M', label: t('Casado(a)', 'Married') },
            { value: 'D', label: t('Divorciado(a)', 'Divorced') },
            { value: 'W', label: t('Viudo(a)', 'Widowed') },
          ],
        },
        {
          id: 'court',
          kind: 'choice',
          formRef: 'Part A.I · Item 18',
          question: t('¿Ha estado en una Corte de Inmigración?', 'Have you been in Immigration Court proceedings?'),
          why: t('Si está ahora en procesos de corte, el I-589 se presenta ante el juez de inmigración (EOIR), no a USCIS, y hay fechas límite: hable con un abogado cuanto antes.', 'If you are now in court proceedings, Form I-589 is filed with the immigration judge (EOIR), not with USCIS, and there are deadlines: talk to an attorney as soon as possible.'),
          options: [
            { value: 'A', label: t('Nunca he estado en procesos de corte', 'I have never been in Immigration Court proceedings') },
            { value: 'B', label: t('Estoy ahora en procesos de corte', 'I am now in Immigration Court proceedings') },
            { value: 'C', label: t('No ahora, pero estuve en el pasado', 'Not now, but I have been in the past') },
          ],
        },
        {
          id: 'travel',
          kind: 'fields',
          formRef: 'Part A.I · Items 19.a–19.b',
          question: t('Su salida y su I-94', 'Your departure and I-94'),
          fields: [
            date('lastLeft', '¿Cuándo salió de su país por última vez?', 'When did you last leave your country?', 'Part A.I · Item 19.a'),
            { id: 'i94', type: 'i94', label: { es: 'Número de I-94 actual (si tiene)', en: 'Current I-94 number (if any)' }, formRef: 'Part A.I · Item 19.b' },
          ],
        },
        ...rows({
          max: 3,
          id: 'entry',
          first: always,
          question: (i) => (i === 1 ? t('Su entrada más reciente a EE.UU.', 'Your most recent entry into the U.S.') : t('Una entrada anterior', 'An earlier entry')),
          why: (i) => (i === 1 ? t('Empiece por la más reciente. Si entró sin pasar por inspección, escriba EWI en el estatus.', 'Start with the most recent one. If you entered without inspection, write EWI as the status.') : undefined),
          more: t('¿Entró a EE.UU. otra vez antes de esa?', 'Did you enter the U.S. another time before that?'),
          formRef: 'Part A.I · Item 19.c',
          fields: (i) => [
            date(`entry${i}.date`, 'Fecha', 'Date', `Part A.I · Item 19.c · Entry ${i} · Date`),
            text(`entry${i}.place`, 'Lugar', 'Place', `Part A.I · Item 19.c · Entry ${i} · Place`, { placeholder: 'Hidalgo, TX' }),
            text(`entry${i}.status`, 'Estatus', 'Status', `Part A.I · Item 19.c · Entry ${i} · Status`, { placeholder: 'B2' }),
            ...(i === 1 ? [date('entry1.expires', 'Fecha en que vence ese estatus (si aplica)', 'Date status expires (if any)', 'Part A.I · Item 19.c · Date Status Expires', false, 'date')] : []),
          ],
          overflow: t('Si entró más de tres veces, escriba las demás a mano en el Suplemento B.', 'If you entered more than three times, write the others by hand on Supplement B.'),
        }),
        {
          id: 'passport',
          kind: 'fields',
          formRef: 'Part A.I · Items 20–22',
          question: t('Su pasaporte o documento de viaje más reciente', 'Your latest passport or travel document'),
          why: t('Si no tiene, deje todo en blanco.', 'If you have none, leave it all blank.'),
          fields: [
            text('passport.country', 'País que lo emitió', 'Country that issued it', 'Part A.I · Item 20', { required: false }),
            text('passport.number', 'Número de pasaporte', 'Passport number', 'Part A.I · Item 21', { required: false }),
            text('travelDoc', 'Número de documento de viaje', 'Travel document number', 'Part A.I · Item 21', { required: false }),
            date('passport.expires', 'Fecha de vencimiento', 'Expiration date', 'Part A.I · Item 22', false, 'date'),
          ],
        },
        {
          id: 'languages',
          kind: 'fields',
          formRef: 'Part A.I · Items 23 and 25',
          question: t('Sus idiomas', 'Your languages'),
          fields: [
            text('nativeLanguage', 'Idioma nativo (y dialecto, si aplica)', 'Native language (include dialect, if applicable)', 'Part A.I · Item 23', { placeholder: 'Spanish' }),
            text('otherLanguages', 'Otros idiomas que habla con fluidez', 'Other languages you speak fluently', 'Part A.I · Item 25', { required: false }),
          ],
        },
        { id: 'fluentEnglish', kind: 'choice', formRef: 'Part A.I · Item 24', question: t('¿Habla inglés con fluidez?', 'Are you fluent in English?'), options: yesNo },
      ],
    },
    {
      id: 'spouse',
      part: 'Part A.II',
      title: t('Su cónyuge', 'Your spouse'),
      questions: [
        {
          id: 'spouse',
          kind: 'fields',
          formRef: 'Part A.II · Your Spouse · Items 1–14',
          showIf: is('marital', 'M'),
          question: t('Su esposo o esposa', 'Your spouse'),
          fields: [
            ...relativeFields('spouse', 'Part A.II · Spouse', {}),
            text('spouse.otherNames', 'Otros nombres que ha usado', 'Other names used', 'Part A.II · Spouse · Item 8', { required: false }),
            date('spouse.marriageDate', 'Fecha de matrimonio', 'Date of marriage', 'Part A.II · Spouse · Item 9'),
            text('spouse.marriagePlace', 'Lugar del matrimonio', 'Place of marriage', 'Part A.II · Spouse · Item 10', { placeholder: 'San Pedro Sula, Honduras' }),
          ],
        },
        ...whereabouts('spouse', 'Part A.II · Spouse', t('su cónyuge', 'your spouse'), is('marital', 'M'), [16, 23], true),
      ],
    },
    {
      id: 'children',
      part: 'Part A.II',
      title: t('Sus hijos', 'Your children'),
      questions: [
        {
          id: 'hasChildren',
          kind: 'choice',
          formRef: 'Part A.II · Your Children',
          question: t('¿Tiene hijos o hijas?', 'Do you have children?'),
          why: t('Ponga a todos, sin importar su edad, dónde vivan o si están casados.', 'List all of them, regardless of age, location or marital status.'),
          options: yesNo,
        },
        {
          id: 'childrenTotal',
          kind: 'fields',
          formRef: 'Part A.II · Total number of children',
          showIf: is('hasChildren', 'yes'),
          question: t('¿Cuántos hijos tiene en total?', 'How many children do you have in total?'),
          fields: [{ id: 'children.total', type: 'number', required: true, label: { es: 'Número de hijos', en: 'Number of children' }, formRef: 'Part A.II · Total number of children', maxLength: 3, placeholder: '2' }],
        },
        ...children(),
      ],
    },
    {
      id: 'background',
      part: 'Part A.III',
      title: t('Su historial', 'Your background'),
      questions: [
        {
          id: 'lastAddress',
          kind: 'fields',
          formRef: 'Part A.III · Item 1',
          question: t('Su última dirección antes de venir a EE.UU.', 'Your last address before coming to the U.S.'),
          fields: address('lastAddress1', 'Part A.III · Item 1 · Row 1'),
        },
        {
          id: 'fearSameCountry',
          kind: 'choice',
          formRef: 'Part A.III · Item 1',
          question: t('¿Esa dirección era en el país donde teme persecución?', 'Was that address in the country where you fear persecution?'),
          options: yesNo,
        },
        {
          id: 'fearAddress',
          kind: 'fields',
          formRef: 'Part A.III · Item 1 · Row 2',
          showIf: is('fearSameCountry', 'no'),
          question: t('Su última dirección en el país donde teme persecución', 'Your last address in the country where you fear persecution'),
          fields: address('lastAddress2', 'Part A.III · Item 1 · Row 2'),
        },
        ...rows({
          max: 5,
          id: 'home',
          first: always,
          question: (i) => (i === 1 ? t('Su dirección actual', 'Your present address') : t('Una dirección anterior (últimos 5 años)', 'An earlier address (past 5 years)')),
          why: (i) => (i === 1 ? t('Ponga todas sus direcciones de los últimos 5 años, empezando por la actual.', 'List every address from the past 5 years, starting with the present one.') : undefined),
          more: t('¿Vivió en otra dirección en los últimos 5 años?', 'Did you live at another address in the past 5 years?'),
          formRef: 'Part A.III · Item 2',
          fields: (i) => address(`home${i}`, `Part A.III · Item 2 · Row ${i}`),
          overflow: t('Si son más de 5, escríbalas a mano en el Suplemento B.', 'If there are more than 5, write them by hand on Supplement B.'),
        }),
        { id: 'school.more0', kind: 'choice', formRef: 'Part A.III · Item 3', question: t('¿Fue a la escuela?', 'Did you attend school?'), options: yesNo },
        ...rows({
          max: 4,
          id: 'school',
          first: is('school.more0', 'yes'),
          question: (i) => (i === 1 ? t('La escuela más reciente', 'The most recent school') : t('La escuela anterior', 'The school before that')),
          more: t('¿Fue a otra escuela antes?', 'Did you attend another school before that?'),
          formRef: 'Part A.III · Item 3',
          fields: (i) => [
            text(`school${i}.name`, 'Nombre de la escuela', 'Name of school', `Part A.III · Item 3 · Row ${i} · Name of School`),
            text(`school${i}.type`, 'Tipo (en inglés)', 'Type of school', `Part A.III · Item 3 · Row ${i} · Type of School`, { placeholder: 'High school' }),
            text(`school${i}.location`, 'Ubicación (ciudad y país)', 'Location (address)', `Part A.III · Item 3 · Row ${i} · Location`),
            monthYear(`school${i}.from`, 'Desde (mes/año)', 'From (month/year)', `Part A.III · Item 3 · Row ${i} · From`),
            monthYear(`school${i}.to`, 'Hasta (mes/año)', 'To (month/year)', `Part A.III · Item 3 · Row ${i} · To`),
          ],
          overflow: t('Si son más de 4, escríbalas a mano en el Suplemento B.', 'If there are more than 4, write them by hand on Supplement B.'),
        }),
        { id: 'job.more0', kind: 'choice', formRef: 'Part A.III · Item 4', question: t('¿Ha trabajado en los últimos 5 años?', 'Have you worked in the past 5 years?'), options: yesNo },
        ...rows({
          max: 3,
          id: 'job',
          first: is('job.more0', 'yes'),
          question: (i) => (i === 1 ? t('Su trabajo actual o más reciente', 'Your present or most recent job') : t('Un trabajo anterior', 'An earlier job')),
          more: t('¿Tuvo otro trabajo en los últimos 5 años?', 'Did you have another job in the past 5 years?'),
          formRef: 'Part A.III · Item 4',
          fields: (i) => [
            text(`job${i}.employer`, 'Nombre y dirección del empleador', 'Name and address of employer', `Part A.III · Item 4 · Row ${i} · Name and Address of Employer`),
            text(`job${i}.occupation`, 'Su ocupación (en inglés)', 'Your occupation', `Part A.III · Item 4 · Row ${i} · Your Occupation`, { placeholder: 'Mechanic' }),
            monthYear(`job${i}.from`, 'Desde (mes/año)', 'From (month/year)', `Part A.III · Item 4 · Row ${i} · From`),
            monthYear(`job${i}.to`, 'Hasta (mes/año)', 'To (month/year)', `Part A.III · Item 4 · Row ${i} · To`),
          ],
          overflow: t('Si son más de 3, escríbalos a mano en el Suplemento B.', 'If there are more than 3, write them by hand on Supplement B.'),
        }),
        { id: 'mother', kind: 'fields', formRef: 'Part A.III · Item 5 · Mother', question: t('Su madre', 'Your mother'), fields: relative('mother', 'Part A.III · Item 5 · Mother') },
        { id: 'father', kind: 'fields', formRef: 'Part A.III · Item 5 · Father', question: t('Su padre', 'Your father'), fields: relative('father', 'Part A.III · Item 5 · Father') },
        { id: 'sibling.more0', kind: 'choice', formRef: 'Part A.III · Item 5 · Siblings', question: t('¿Tiene hermanos o hermanas?', 'Do you have brothers or sisters?'), options: yesNo },
        ...rows({
          max: 4,
          id: 'sibling',
          first: is('sibling.more0', 'yes'),
          question: (i) => t(`Hermano o hermana ${i}`, `Sibling ${i}`),
          more: t('¿Tiene otro hermano o hermana?', 'Do you have another sibling?'),
          formRef: 'Part A.III · Item 5 · Siblings',
          fields: (i) => relative(`sibling${i}`, `Part A.III · Item 5 · Sibling ${i}`),
          overflow: t('Si son más de 4, escríbalos a mano en el Suplemento B.', 'If there are more than 4, write them by hand on Supplement B.'),
        }),
      ],
    },
    {
      id: 'claim',
      part: 'Part B',
      title: t('Su caso de asilo', 'Your asylum claim'),
      questions: [
        {
          id: 'basis',
          kind: 'choice',
          multiple: true,
          formRef: 'Part B · Item 1',
          question: t('¿Por qué pide asilo? Marque todas las que apliquen.', 'Why are you applying for asylum? Select all that apply.'),
          why: t('El asilo protege a quien sufrió o teme daño por una de estas razones. La Convención contra la Tortura protege a quien teme tortura por cualquier motivo; si la marca, la app también marca la casilla de arriba de la página 1.', 'Asylum protects people harmed or afraid of harm for one of these reasons. The Convention Against Torture protects anyone who fears torture for any reason; if you select it, the app also checks the box at the top of page 1.'),
          notice: {
            tone: 'legal',
            title: t('Su historia es lo más importante', 'Your story is what matters most'),
            body: t(
              'USCIS puede decidir sin entrevista, con lo que usted escriba aquí. Cuente lo que pasó con fechas, lugares y quién lo hizo, en inglés (o con una traducción certificada). Un abogado u organización acreditada puede ayudarle a escribirla.',
              'USCIS may decide without an interview, based on what you write here. Tell what happened with dates, places and who did it, in English (or with a certified translation). An attorney or accredited organization can help you write it.',
            ),
          },
          options: [
            { value: 'race', label: t('Raza', 'Race') },
            { value: 'religion', label: t('Religión', 'Religion') },
            { value: 'nationality', label: t('Nacionalidad', 'Nationality') },
            { value: 'politics', label: t('Opinión política', 'Political opinion') },
            { value: 'social', label: t('Pertenencia a un grupo social determinado', 'Membership in a particular social group') },
            { value: 'torture', label: t('Convención contra la Tortura', 'Torture Convention') },
          ],
        },
        ...yesExplain({
          id: 'b1a',
          formRef: 'Part B · Item 1.A',
          question: t('¿Usted, su familia, amigos cercanos o colegas han sufrido daño, maltrato o amenazas en el pasado?', 'Have you, your family, or close friends or colleagues ever experienced harm or mistreatment or threats in the past by anyone?'),
          explain: t('Qué pasó, cuándo, quién lo hizo y por qué cree que pasó', 'What happened, when, who caused it, and why you believe it occurred'),
        }),
        ...yesExplain({
          id: 'b1b',
          formRef: 'Part B · Item 1.B',
          question: t('¿Teme sufrir daño o maltrato si regresa a su país?', 'Do you fear harm or mistreatment if you return to your home country?'),
          explain: t('Qué daño teme, quién se lo haría y por qué', 'What harm you fear, who would harm you, and why'),
        }),
        ...yesExplain({
          id: 'b2',
          formRef: 'Part B · Item 2',
          question: t('¿Usted o su familia han sido acusados, arrestados, detenidos, interrogados, condenados o encarcelados en otro país (no EE.UU.)?', 'Have you or your family members ever been accused, charged, arrested, detained, interrogated, convicted and sentenced, or imprisoned in any country other than the United States?'),
          explain: t('Las circunstancias y las razones', 'The circumstances and reasons for the action'),
        }),
        ...yesExplain({
          id: 'b3a',
          formRef: 'Part B · Item 3.A',
          question: t('¿Usted o su familia han pertenecido a alguna organización o grupo en su país (partido político, sindicato, iglesia, grupo estudiantil, militar o paramilitar, prensa, derechos humanos)?', 'Have you or your family members ever belonged to or been associated with any organizations or groups in your home country (political party, labor union, religious organization, student, military or paramilitary group, press, human rights group)?'),
          explain: t('Para cada persona: su participación, cargos y por cuánto tiempo', 'For each person: level of participation, positions held, and for how long'),
        }),
        ...yesExplain({
          id: 'b3b',
          formRef: 'Part B · Item 3.B',
          showIf: is('b3a', 'yes'),
          question: t('¿Siguen participando en esas organizaciones o grupos?', 'Do you or your family members continue to participate in these organizations or groups?'),
          explain: t('Para cada persona: su participación actual, cargos y desde cuándo', 'For each person: current participation, positions held, and for how long'),
        }),
        ...yesExplain({
          id: 'b4',
          formRef: 'Part B · Item 4',
          question: t('¿Teme ser torturado en su país o en otro país al que lo puedan enviar?', 'Are you afraid of being subjected to torture in your home country or any other country to which you may be returned?'),
          explain: t('Por qué teme, qué tortura teme, de quién y por qué', 'Why you are afraid, the nature of the torture you fear, by whom, and why'),
        }),
      ],
    },
    {
      id: 'additional',
      part: 'Part C',
      title: t('Información adicional', 'Additional information'),
      questions: [
        ...yesExplain({
          id: 'c1',
          formRef: 'Part C · Item 1',
          question: t('¿Usted, su cónyuge, hijos, padres o hermanos han pedido antes refugio, asilo o suspensión de deportación a EE.UU.?', 'Have you, your spouse, your children, your parents or your siblings ever applied to the U.S. Government for refugee status, asylum, or withholding of removal?'),
          explain: t('Qué se decidió, qué pasó con el estatus y, si se lo negaron, qué cambió desde entonces', 'The decision, what happened to any status received and, if denied, what has changed since'),
        }),
        {
          id: 'c2a',
          kind: 'choice',
          formRef: 'Part C · Item 2.A',
          question: t('Después de salir de su país, ¿usted o su familia en EE.UU. pasaron por o vivieron en otro país antes de llegar?', 'After leaving your country, did you or your spouse or children now in the U.S. travel through or reside in any other country before entering the U.S.?'),
          options: yesNo,
        },
        {
          id: 'c2b',
          kind: 'choice',
          formRef: 'Part C · Item 2.B',
          question: t('¿Usted o su familia han pedido o recibido algún estatus legal en otro país (no el suyo)?', 'Have you or your family ever applied for or received any lawful status in any country other than the one from which you are now claiming asylum?'),
          options: yesNo,
        },
        {
          id: 'c2Explain',
          kind: 'fields',
          formRef: 'Part C · Item 2 · If "Yes," explain',
          showIf: (a) => a.c2a === 'yes' || a.c2b === 'yes',
          question: t('Explique con detalle', 'Explain in detail'),
          why: t('Para cada persona: el país y cuánto tiempo estuvo, su estatus, por qué se fue, si puede volver a vivir allí y si pidió asilo allí (y si no, por qué).', 'For each person: the country and length of stay, status there, why they left, whether they can return to live there, and whether they applied for asylum there (and if not, why).'),
          fields: [{ id: 'c2.explain', type: 'longText', required: true, label: t('Su explicación (en inglés)', 'Your explanation'), formRef: 'Part C · Item 2' }],
        },
        ...yesExplain({
          id: 'c3',
          formRef: 'Part C · Item 3',
          question: t('¿Usted, su cónyuge o hijos han ordenado, incitado, ayudado o participado en hacer daño a alguien por su raza, religión, nacionalidad, grupo social u opinión política?', 'Have you, your spouse or your children ever ordered, incited, assisted or otherwise participated in causing harm or suffering to any person because of race, religion, nationality, membership in a particular social group or political opinion?'),
          explain: t('Cada incidente y la participación de cada persona', 'Each incident and each person’s involvement'),
          notice: { tone: 'legal', title: t('Consulte a un abogado', 'Talk to an attorney'), body: t('Si la respuesta es Sí, puede impedirle el asilo. Hable con un abogado antes de presentar.', 'A Yes answer can bar you from asylum. Talk to an attorney before filing.') },
        }),
        ...yesExplain({
          id: 'c4',
          formRef: 'Part C · Item 4',
          question: t('Después de salir del país donde sufrió o teme daño, ¿regresó a ese país?', 'After you left the country where you were harmed or fear harm, did you return to that country?'),
          explain: t('Las fechas, el motivo y cuánto tiempo se quedó en cada viaje', 'The dates, purpose and length of each trip'),
        }),
        ...yesExplain({
          id: 'c5',
          formRef: 'Part C · Item 5',
          question: t('¿Presenta esta solicitud más de 1 año después de su última llegada a EE.UU.?', 'Are you filing this application more than 1 year after your last arrival in the United States?'),
          why: t('Hay excepciones por cambios de circunstancias (en su país o personales) o circunstancias extraordinarias (enfermedad grave, estatus legal hasta hace poco, etc.).', 'There are exceptions for changed circumstances (in your country or personal) or extraordinary circumstances (serious illness, lawful status until recently, etc.).'),
          explain: t('Por qué no la presentó en el primer año', 'Why you did not file within the first year'),
          notice: { tone: 'legal', title: t('Fecha límite de un año', 'One-year deadline'), body: t('Esta explicación puede ser su única oportunidad de justificar el retraso. Un abogado debe revisarla.', 'This explanation may be your only chance to justify the delay. An attorney should review it.') },
        }),
        ...yesExplain({
          id: 'c6',
          formRef: 'Part C · Item 6',
          question: t('¿Usted o algún familiar incluido ha cometido un delito o ha sido arrestado, acusado, condenado o sentenciado en EE.UU. (incluso por infracciones migratorias)?', 'Have you or any family member included in the application ever committed any crime and/or been arrested, charged, convicted, or sentenced for any crimes in the United States (including for an immigration law violation)?'),
          explain: t('Para cada caso: qué pasó, fechas, lugar, sentencia, detención y cómo terminó', 'For each instance: what occurred, dates, location, sentence, detention and how it ended'),
          notice: { tone: 'legal', title: t('Consulte a un abogado', 'Talk to an attorney'), body: t('Adjunte los documentos de la corte de cada caso, o explique por qué no los tiene.', 'Attach the court records for each case, or explain why they are not available.') },
        }),
      ],
    },
    {
      id: 'signature',
      part: 'Part D',
      title: t('Quién le ayudó', 'Who helped you'),
      questions: [
        {
          id: 'familyHelped',
          kind: 'choice',
          formRef: 'Part D',
          question: t('¿Su cónyuge, padre, madre o hijos le ayudaron a llenar esta solicitud?', 'Did your spouse, parent, or children assist you in completing this application?'),
          options: yesNo,
        },
        {
          id: 'helpers',
          kind: 'fields',
          formRef: 'Part D · Name and Relationship',
          showIf: is('familyHelped', 'yes'),
          question: t('¿Quién le ayudó?', 'Who helped you?'),
          fields: [
            text('helper1.name', 'Nombre', 'Name', 'Part D · Name 1'),
            text('helper1.relationship', 'Relación (en inglés)', 'Relationship', 'Part D · Relationship 1', { placeholder: 'Spouse' }),
            text('helper2.name', 'Otra persona: nombre', 'Another person: name', 'Part D · Name 2', { required: false }),
            text('helper2.relationship', 'Otra persona: relación', 'Another person: relationship', 'Part D · Relationship 2', { required: false }),
          ],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part D',
          question: t('¿Alguien que no es su cónyuge, padre, madre o hijo preparó esta solicitud?', 'Did someone other than your spouse, parent, or children prepare this application?'),
          why: t('Si es así, esa persona llena y firma la Parte E a mano.', 'If so, that person completes and signs Part E by hand.'),
          options: yesNo,
        },
        {
          id: 'counselList',
          kind: 'choice',
          formRef: 'Part D',
          question: t('¿Le dieron una lista de personas que pueden ayudarle con su caso gratis o a bajo costo?', 'Have you been provided with a list of persons who may be available to assist you, at little or no cost, with your asylum claim?'),
          why: t('La lista oficial está en justice.gov/eoir/list-pro-bono-legal-service-providers.', 'The official list is at justice.gov/eoir/list-pro-bono-legal-service-providers.'),
          options: yesNo,
        },
      ],
    },
  ],
};

/** Every "If Yes, explain" box: the answer that triggers it, the narrative and where it goes. */
export const NARRATIVES: { id: string; explain: string; part: string; question: string }[] = [
  { id: 'b1a', explain: 'b1a.explain', part: 'B', question: '1.A' },
  { id: 'b1b', explain: 'b1b.explain', part: 'B', question: '1.B' },
  { id: 'b2', explain: 'b2.explain', part: 'B', question: '2' },
  { id: 'b3a', explain: 'b3a.explain', part: 'B', question: '3.A' },
  { id: 'b3b', explain: 'b3b.explain', part: 'B', question: '3.B' },
  { id: 'b4', explain: 'b4.explain', part: 'B', question: '4' },
  { id: 'c1', explain: 'c1.explain', part: 'C', question: '1' },
  { id: 'c2', explain: 'c2.explain', part: 'C', question: '2.A-2.B' },
  { id: 'c3', explain: 'c3.explain', part: 'C', question: '3' },
  { id: 'c4', explain: 'c4.explain', part: 'C', question: '4' },
  { id: 'c5', explain: 'c5.explain', part: 'C', question: '5' },
  { id: 'c6', explain: 'c6.explain', part: 'C', question: '6' },
];
