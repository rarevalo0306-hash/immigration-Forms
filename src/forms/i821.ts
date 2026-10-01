import type { Field, FormDefinition, Question } from './types';
import type { T } from '../i18n';
import { biographic, date, is, nameFields, rows, sexField, yesNo } from './helpers';
import { flaggedI821, P7_GROUPS, toYesNoItems } from './i821Part7';

// Questions follow USCIS Form I-821, Application for Temporary Protected Status, edition 01/20/25.
// Parts 4-6 (spouse, former spouses and children) are only for late initial filings and are left
// to fill by hand. The PDF mapping lives in src/pdf/i821Pdf.ts; Part 7 lives in i821Part7.ts.

export const I821_EDITION = '01/20/25';

const t = (es: string, en: string): T => ({ es, en });

/** A U.S. address: this edition's mailing and physical addresses have no province or country. */
const usAddress = (prefix: string, ref: string, careOf = false): Field[] => [
  ...(careOf ? [{ id: `${prefix}.careOf`, type: 'text', label: { es: 'A cargo de (si recibe correo en casa de otra persona)', en: 'In care of' }, formRef: `${ref} · In Care Of Name`, maxLength: 34 } as Field] : []),
  { id: `${prefix}.street`, type: 'text', required: true, label: { es: 'Número y calle', en: 'Street number and name' }, formRef: `${ref} · Street Number and Name`, maxLength: 34, placeholder: '1234 Main St' },
  { id: `${prefix}.unit`, type: 'unit', label: { es: 'Apartamento, suite o piso', en: 'Apt., suite or floor' }, formRef: `${ref} · Apt. Ste. Flr.`, placeholder: 'Apt 4B' },
  { id: `${prefix}.city`, type: 'text', required: true, label: { es: 'Ciudad', en: 'City or town' }, formRef: `${ref} · City or Town`, maxLength: 20 },
  { id: `${prefix}.state`, type: 'state', required: true, label: { es: 'Estado', en: 'State' }, formRef: `${ref} · State`, placeholder: 'CA' },
  { id: `${prefix}.zip`, type: 'zip', required: true, label: { es: 'Código postal', en: 'ZIP code' }, formRef: `${ref} · ZIP Code` },
];

const four = (id: string, ref: string, es: string, en: string): Field[] =>
  ['a', 'b', 'c', 'd'].map((l, i) => ({ id: `${id}${i + 1}`, type: 'text', required: i === 0, label: { es: i === 0 ? es : `${es} (otro)`, en: i === 0 ? en : `${en} (another)` }, formRef: `${ref}.${l}` }));

const legal = {
  tone: 'legal' as const,
  title: { es: 'Responda con la verdad', en: 'Answer truthfully' },
  body: {
    es: 'Un Sí no siempre impide el TPS, pero ocultar algo sí puede. Si responde Sí a alguna, hable con un abogado o una organización acreditada antes de presentar.',
    en: 'A Yes doesn’t always bar TPS, but hiding something can. If you answer Yes to any, talk to an attorney or accredited organization before filing.',
  },
};

export const i821: FormDefinition = {
  id: 'i-821',
  number: 'I-821',
  edition: I821_EDITION,
  title: t('TPS (Estatus de Protección Temporal)', 'TPS (Temporary Protected Status)'),
  summary: {
    es: 'Pida o vuelva a registrar su TPS si es de un país designado (por ejemplo, Venezuela, Honduras, El Salvador o Haití). Va junto con el I-765.',
    en: 'Apply for or re-register your TPS if you are from a designated country (for example Venezuela, Honduras, El Salvador or Haiti). Filed with Form I-765.',
  },
  intro: {
    es: 'Con el I-821 pide el TPS por primera vez o lo vuelve a registrar. Solo se puede presentar dentro del periodo de registro que USCIS anuncia para cada país: revise uscis.gov/tps antes de presentar. Si presenta una solicitud inicial tardía, también debe llenar a mano las Partes 4 a 6 (cónyuge, excónyuges e hijos).',
    en: 'With Form I-821 you apply for TPS for the first time or re-register. You can only file within the registration period USCIS announces for each country: check uscis.gov/tps before filing. If you file a late initial application, you must also fill in Parts 4-6 (spouse, former spouses and children) by hand.',
  },
  minutes: 45,
  pdf: {
    path: 'forms/i-821.pdf',
    fileName: 'I-821-filled.pdf',
    load: () => import('../pdf/i821Pdf').then((m) => m.fillI821),
    signHere: { es: 'Parte 8, Ítem 6.a', en: 'Part 8, Item 6.a' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/tps que su país sigue designado, que el periodo de registro está abierto y que la edición {edition} sigue vigente; revise la tarifa.',
      'Si pide permiso de trabajo, llene también el I-765 (categoría (a)(12) o (c)(19)) y envíelos juntos. Puede llenar el I-765 en esta misma app.',
      'Adjunte prueba de su nacionalidad (pasaporte o acta de nacimiento), de su fecha de entrada y de que ha vivido en EE.UU. desde la fecha que pide el país.',
      'Imprima el PDF y firme la Parte 8, Ítem 6.a, a mano con tinta negra.',
    ],
    en: [
      'Check at uscis.gov/tps that your country is still designated, that the registration period is open and that edition {edition} is still current; check the fee.',
      'If you want a work permit, also complete Form I-765 (category (a)(12) or (c)(19)) and file them together. You can fill in the I-765 in this same app.',
      'Attach proof of your nationality (passport or birth certificate), of your date of entry and of living in the U.S. since the date set for your country.',
      'Print the PDF and sign Part 8, Item 6.a, by hand in black ink.',
    ],
  },
  sections: [
    {
      id: 'type',
      part: 'Part 1',
      title: t('Tipo de solicitud', 'Type of application'),
      questions: [
        {
          id: 'appType',
          kind: 'choice',
          formRef: 'Part 1 · Items 1.a–1.b · Type of Application',
          question: t('¿Es su primera solicitud de TPS o un nuevo registro?', 'Is this your first TPS application or a re-registration?'),
          why: t('Si pidió TPS antes pero no lo tiene ahora, elija "primera vez" y explique sus solicitudes anteriores abajo.', 'If you applied before but don’t have TPS now, choose "first time" and explain your earlier applications below.'),
          options: [
            { value: '1b', label: t('Nuevo registro: ya tengo TPS', 'Re-registration: I have TPS') },
            { value: '1a', label: t('Primera vez: no tengo TPS ahora', 'Initial: I don’t have TPS now') },
          ],
        },
        {
          id: 'grantedBy',
          kind: 'choice',
          formRef: 'Part 1 · Item 2 · Who granted you TPS',
          showIf: is('appType', '1b'),
          question: t('¿Quién le dio el TPS?', 'Who granted you TPS?'),
          options: [
            { value: 'U', label: t('USCIS', 'USCIS') },
            { value: 'I', label: t('Un juez de inmigración o la BIA', 'An immigration judge or the BIA') },
          ],
        },
        {
          id: 'priorApplications',
          kind: 'fields',
          formRef: 'Part 11 · Part 1 · Item 1.a',
          showIf: is('appType', '1a'),
          question: t('¿Ha pedido TPS antes?', 'Have you applied for TPS before?'),
          why: t('Si sí, escriba cada solicitud anterior con su número de recibo y resultado. Si no, déjelo en blanco.', 'If yes, list each earlier application with its receipt number and outcome. If not, leave blank.'),
          fields: [{ id: 'prior.explain', type: 'longText', label: { es: 'Solicitudes anteriores (en inglés)', en: 'Earlier applications' }, formRef: 'Part 11 · Part 1 · Item 1.a' }],
        },
        {
          id: 'ead',
          kind: 'choice',
          formRef: 'Part 1 · Items 3.a–3.b · Employment authorization',
          question: t('¿Pide también permiso de trabajo (con el I-765)?', 'Are you also requesting a work permit (with Form I-765)?'),
          options: [
            { value: 'A', label: t('Sí, envío el I-765 junto con el I-821', 'Yes, I am filing Form I-765 with Form I-821') },
            { value: 'B', label: t('No, por ahora no', 'No, not now') },
          ],
        },
        {
          id: 'country',
          kind: 'fields',
          formRef: 'Part 1 · Item 4 · Designated TPS country',
          question: t('¿Con qué país designado pide el TPS?', 'Under which designated country are you applying?'),
          fields: [{ id: 'tpsCountry', type: 'text', required: true, label: { es: 'País (en inglés)', en: 'Country' }, formRef: 'Part 1 · Item 4', placeholder: 'Venezuela' }],
        },
      ],
    },
    {
      id: 'about',
      part: 'Part 2',
      title: t('Sobre usted', 'About you'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 2 · Item 1 · Your Full Name',
          question: t('¿Cuál es su nombre legal completo?', 'What is your full legal name?'),
          fields: nameFields('name', 'Part 2 · Item 1'),
        },
        {
          id: 'otherName.more0',
          kind: 'choice',
          formRef: 'Part 2 · Items 2–3 · Other Names Used',
          question: t('¿Ha usado otros nombres?', 'Have you used other names?'),
          why: t('Incluya su nombre de soltera, apodos y alias.', 'Include your maiden name, nicknames and aliases.'),
          options: yesNo,
        },
        ...rows({
          max: 2,
          id: 'otherName',
          first: is('otherName.more0', 'yes'),
          question: (i) => (i === 1 ? t('Otro nombre que ha usado', 'Another name you have used') : t('Otro nombre más', 'One more name')),
          more: t('¿Ha usado otro nombre más?', 'Have you used another name?'),
          formRef: 'Part 2 · Items 2–3',
          fields: (i) => nameFields(`otherName${i}`, `Part 2 · Item ${i + 1}`),
          overflow: { es: 'El formulario tiene espacio para 2 nombres. Si son más, escríbalos a mano en la Parte 11.', en: 'The form has room for 2 names. If there are more, write them by hand in Part 11.' },
        }),
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 2 · Item 4 · U.S. Mailing Address',
          question: t('¿A qué dirección le llega el correo?', 'Where do you get your mail?'),
          fields: usAddress('mailing', 'Part 2 · Item 4', true),
        },
        {
          id: 'mailingSame',
          kind: 'choice',
          formRef: 'Part 2 · Item 5',
          question: t('¿Vive en esa misma dirección?', 'Do you live at that same address?'),
          options: yesNo,
        },
        {
          id: 'home',
          kind: 'fields',
          formRef: 'Part 2 · Item 6 · U.S. Physical Address',
          showIf: is('mailingSame', 'no'),
          question: t('¿Dónde vive?', 'Where do you live?'),
          fields: usAddress('home', 'Part 2 · Item 6'),
        },
        {
          id: 'details',
          kind: 'fields',
          formRef: 'Part 2 · Items 7–14 · Other Information',
          question: t('Sus datos', 'Your details'),
          fields: [
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 2 · Item 7' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Número de cuenta en línea de USCIS', en: 'USCIS online account number' }, formRef: 'Part 2 · Item 8' },
            { id: 'ssn', type: 'ssn', label: { es: 'Número de Seguro Social (si tiene)', en: 'Social Security number (if any)' }, formRef: 'Part 2 · Item 9', placeholder: '123-45-6789' },
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 2 · Item 10'),
            date('otherDob1', 'Otra fecha de nacimiento que haya usado (si hay)', 'Other date of birth used (if any)', 'Part 2 · Item 11.a', false),
            date('otherDob2', 'Otra fecha más (si hay)', 'Another one (if any)', 'Part 2 · Item 11.b', false),
            sexField('sex', 'Part 2 · Item 12'),
            { id: 'birthCity', type: 'text', required: true, label: { es: 'Ciudad de nacimiento', en: 'City of birth' }, formRef: 'Part 2 · Item 13', maxLength: 20 },
            { id: 'birthCountry', type: 'text', required: true, label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: 'Part 2 · Item 14' },
          ],
        },
        {
          id: 'countries',
          kind: 'fields',
          formRef: 'Part 2 · Items 15–16',
          question: t('Países de residencia y de ciudadanía', 'Countries of residence and citizenship'),
          fields: [
            ...four('residence', 'Part 2 · Item 15', 'País donde vivió antes de entrar a EE.UU.', 'Country of residence before entering the U.S.'),
            ...four('citizenship', 'Part 2 · Item 16', 'País de ciudadanía o nacionalidad', 'Country of citizenship or nationality'),
          ],
        },
        {
          id: 'maritalQ',
          kind: 'fields',
          formRef: 'Part 2 · Items 17–18 · Your Marital Information',
          question: t('Su estado civil', 'Your marital status'),
          fields: [
            {
              id: 'marital',
              type: 'select',
              required: true,
              label: { es: 'Estado civil', en: 'Current marital status' },
              formRef: 'Part 2 · Item 17',
              options: [
                { value: 'S', label: t('Soltero/a, nunca casado/a', 'Single, never married') },
                { value: 'M', label: t('Casado/a', 'Married') },
                { value: 'D', label: t('Divorciado/a', 'Divorced') },
                { value: 'W', label: t('Viudo/a', 'Widowed') },
                { value: 'E', label: t('Separado/a', 'Separated') },
                { value: 'A', label: t('Matrimonio anulado', 'Marriage annulled') },
                { value: 'O', label: t('Otro', 'Other') },
              ],
            },
            { id: 'marital.other', type: 'text', label: { es: 'Si eligió "Otro", explique (en inglés)', en: 'If "Other", explain' }, formRef: 'Part 2 · Item 17 · Other' },
            date('marriage.date', 'Fecha de su matrimonio actual (si está casado/a)', 'Date of current marriage (if married)', 'Part 2 · Item 18', false),
          ],
        },
        {
          id: 'entry',
          kind: 'fields',
          formRef: 'Part 2 · Items 19–24 · U.S. Entry Information',
          question: t('Su última entrada a EE.UU.', 'Your last entry into the U.S.'),
          fields: [
            date('entry.date', 'Fecha de su última entrada', 'Date of last entry', 'Part 2 · Item 19'),
            { id: 'entry.status', type: 'text', required: true, label: { es: 'Estatus al entrar (por ejemplo visitor, student, no status)', en: 'Status when you last entered' }, formRef: 'Part 2 · Item 20', placeholder: 'no status' },
            { id: 'entry.port', type: 'text', label: { es: 'Puerto de entrada (si hubo)', en: 'Port of entry (if any)' }, formRef: 'Part 2 · Item 21' },
            { id: 'entry.city', type: 'text', required: true, label: { es: 'Ciudad donde entró', en: 'City or town of entry' }, formRef: 'Part 2 · Item 22.a', maxLength: 20 },
            { id: 'entry.state', type: 'state', required: true, label: { es: 'Estado donde entró', en: 'State of entry' }, formRef: 'Part 2 · Item 22.b' },
            { id: 'i94', type: 'i94', label: { es: 'Número de I-94 (si tiene)', en: 'I-94 number (if any)' }, formRef: 'Part 2 · Item 23' },
            { id: 'i94.until', type: 'text', label: { es: 'Su estadía venció o vence (fecha o "D/S")', en: 'Authorized stay expires (date or "D/S")' }, formRef: 'Part 2 · Item 24' },
          ],
        },
        {
          id: 'documents',
          kind: 'fields',
          formRef: 'Part 2 · Items 25–30 · Passports and travel documents',
          question: t('Sus pasaportes y documentos de viaje', 'Your passports and travel documents'),
          why: t('Déjelo en blanco si no tiene.', 'Leave blank if you have none.'),
          fields: [
            { id: 'passport.number', type: 'text', label: { es: 'Número de su pasaporte más reciente', en: 'Most recent passport number' }, formRef: 'Part 2 · Item 25', maxLength: 30 },
            { id: 'travelDoc', type: 'text', label: { es: 'Número de documento de viaje', en: 'Travel document number' }, formRef: 'Part 2 · Item 26', maxLength: 30 },
            { id: 'passport.other1', type: 'text', label: { es: 'Otro pasaporte o documento', en: 'Additional passport or document' }, formRef: 'Part 2 · Item 27', maxLength: 30 },
            { id: 'passport.other2', type: 'text', label: { es: 'Otro pasaporte o documento más', en: 'Another additional passport or document' }, formRef: 'Part 2 · Item 28', maxLength: 30 },
            { id: 'passport.country', type: 'text', label: { es: 'País que emitió el más reciente', en: 'Country of issuance of the most recent' }, formRef: 'Part 2 · Item 29' },
            { id: 'passport.expires', type: 'date', label: { es: 'Vencimiento del más reciente', en: 'Expiration of the most recent' }, formRef: 'Part 2 · Item 30' },
          ],
        },
        {
          id: 'status',
          kind: 'fields',
          formRef: 'Part 2 · Item 31 · Current Immigration Status',
          question: t('¿Cuál es su estatus migratorio actual?', 'What is your current immigration status?'),
          fields: [{ id: 'currentStatus', type: 'text', required: true, label: { es: 'Estatus actual (por ejemplo TPS, parole, no status)', en: 'Current immigration status or lack of status' }, formRef: 'Part 2 · Item 31', placeholder: 'TPS' }],
        },
        {
          id: 'proceedings',
          kind: 'choice',
          formRef: 'Part 2 · Item 32 · Immigration proceedings',
          question: t('¿Está o ha estado alguna vez en un proceso de inmigración?', 'Are you now or were you ever in immigration proceedings?'),
          options: yesNo,
        },
        {
          id: 'proceedingTypes',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 2 · Item 33 · Type of Proceedings',
          showIf: is('proceedings', 'yes'),
          question: t('¿Qué tipo de proceso?', 'What type of proceedings?'),
          why: t('Elija todos los que apliquen.', 'Choose all that apply.'),
          options: [
            { value: 'A', label: t('Corte de inmigración (ante un juez)', 'Immigration Court') },
            { value: 'B', label: t('Junta de Apelaciones de Inmigración (BIA)', 'Board of Immigration Appeals (BIA)') },
            { value: 'C', label: t('Ya no, pero estuve o estoy en una corte federal por temas migratorios', 'No longer, but I am or was in Federal court on immigration issues') },
          ],
        },
        {
          id: 'proceedingDetails',
          kind: 'fields',
          formRef: 'Part 2 · Items 34–36',
          showIf: is('proceedings', 'yes'),
          question: t('Detalles del proceso', 'About the proceedings'),
          notice: { tone: 'legal', title: { es: 'Consulte a un abogado', en: 'Talk to an attorney' }, body: { es: 'Con un proceso de inmigración, un abogado debe revisar su caso antes de presentar.', en: 'With immigration proceedings, an attorney should review your case before you file.' } },
          fields: [
            { id: 'proc.location', type: 'text', label: { es: 'Dónde fue (o es) el proceso de inmigración', en: 'Location of DOJ/DHS proceedings' }, formRef: 'Part 2 · Item 34' },
            { id: 'proc.federal', type: 'text', label: { es: 'Dónde fue el proceso en la corte federal (si hubo)', en: 'Location of Federal court proceedings (if any)' }, formRef: 'Part 2 · Item 35' },
            date('proc.from', 'Desde', 'From', 'Part 2 · Item 36.a', false),
            date('proc.to', 'Hasta (en blanco si sigue)', 'To (blank if ongoing)', 'Part 2 · Item 36.b', false),
          ],
        },
      ],
    },
    {
      id: 'biographic',
      part: 'Part 3',
      title: t('Datos biográficos', 'Biographic information'),
      questions: biographic('Part 3'),
    },
    {
      id: 'eligibility',
      part: 'Part 7',
      title: t('Elegibilidad', 'Eligibility'),
      questions: [
        {
          id: 'basis',
          kind: 'fields',
          formRef: 'Part 7 · Items 1.a–1.b · Basis for Eligibility',
          question: t('Su nacionalidad y su llegada', 'Your nationality and arrival'),
          why: t('La fecha desde la que vive en EE.UU. debe ser anterior a la que USCIS fijó para su país.', 'The date you have lived in the U.S. since must be before the date USCIS set for your country.'),
          fields: [
            { id: 'nationalOf', type: 'text', required: true, label: { es: 'Soy nacional de (o, sin nacionalidad, vivía en)', en: 'I am a national of' }, formRef: 'Part 7 · Item 1.a', placeholder: 'Venezuela' },
            date('residingSince', 'Entré a EE.UU. y vivo aquí desde', 'Entered the U.S. and resided here since', 'Part 7 · Item 1.b'),
          ],
        },
        {
          id: 'otherCountries',
          kind: 'choice',
          formRef: 'Part 7 · Item 1.c',
          question: t('Antes de llegar a EE.UU., ¿entró a otro país distinto al suyo?', 'Before you last entered the U.S., did you travel to and enter another country?'),
          why: t('Por ejemplo, si vivió un tiempo en Colombia o México antes de llegar.', 'For example, if you lived in Colombia or Mexico for a time before arriving.'),
          options: yesNo,
        },
        {
          id: 'otherCountryDetails',
          kind: 'fields',
          formRef: 'Part 7 · Items 2–4',
          showIf: is('otherCountries', 'yes'),
          question: t('Ese otro país', 'That other country'),
          why: t('Si fueron varios, escriba los demás a mano en la Parte 11.', 'If several, write the rest by hand in Part 11.'),
          fields: [
            { id: 'other.countries', type: 'text', required: true, label: { es: 'País o países', en: 'Countries' }, formRef: 'Part 7 · Item 2', maxLength: 38 },
            date('other.from', 'Desde', 'From', 'Part 7 · Item 3.a', false),
            date('other.to', 'Hasta', 'To', 'Part 7 · Item 3.b', false),
            { id: 'other.status', type: 'text', required: true, label: { es: 'Su estatus allá (refugee, visitor, no status…)', en: 'Your status there' }, formRef: 'Part 7 · Item 4', maxLength: 38, placeholder: 'visitor' },
          ],
        },
        {
          id: 'offered',
          kind: 'choice',
          formRef: 'Part 7 · Item 5',
          question: t('¿Alguna vez otro país le ofreció un estatus migratorio que usted no aceptó?', 'Have you ever been offered immigration status by another country that you did not accept?'),
          options: yesNo,
        },
        {
          id: 'offeredDetails',
          kind: 'fields',
          formRef: 'Part 7 · Items 6–7',
          showIf: is('offered', 'yes'),
          question: t('Sobre ese ofrecimiento', 'About that offer'),
          fields: [
            { id: 'offered.what', type: 'longText', required: true, label: { es: 'País, qué estatus le ofrecieron y cuándo (en inglés)', en: 'Country, status offered and dates' }, formRef: 'Part 7 · Item 6' },
            { id: 'offered.why', type: 'longText', required: true, label: { es: 'Por qué no lo aceptó (en inglés)', en: 'Why you did not accept' }, formRef: 'Part 7 · Item 7' },
          ],
        },
        ...P7_GROUPS.map(
          (g, gi): Question => ({
            id: `p7.${g.id}`,
            kind: 'yesNoList',
            formRef: `Part 7 · Items ${g.items[0].item}–${g.items[g.items.length - 1].item}`,
            question: g.title,
            why: t('"Alguna vez" significa en cualquier momento y en cualquier país.', '"Ever" means at any time, anywhere in the world.'),
            ...(gi === 0 ? { notice: legal } : {}),
            items: toYesNoItems(g.items),
          }),
        ),
        {
          id: 'p7Explain',
          kind: 'fields',
          formRef: 'Part 11 · Part 7',
          showIf: (a) => flaggedI821(a).length > 0,
          question: t('Explique sus respuestas de Sí', 'Explain your Yes answers'),
          why: t('Para cada una: qué pasó, cuándo, dónde y cómo terminó. Adjunte los documentos de la corte.', 'For each: what happened, when, where and the outcome. Attach court records.'),
          fields: [{ id: 'p7.explain', type: 'longText', required: true, label: { es: 'Explicación (en inglés)', en: 'Explanation' }, formRef: 'Part 11 · Part 7' }],
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
          formRef: 'Part 8 · Items 1.a–1.b · Applicant’s Statement',
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          options: [
            { value: '1a', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: '1b', label: t('No, un intérprete me lo leerá', 'No, an interpreter will read it to me') },
          ],
        },
        {
          id: 'interpreterLanguage',
          kind: 'fields',
          formRef: 'Part 8 · Item 1.b',
          showIf: is('readsEnglish', '1b'),
          question: t('¿En qué idioma se lo leerán?', 'What language will it be read in?'),
          fields: [{ id: 'fluentLanguage', type: 'text', required: true, label: { es: 'Idioma', en: 'Language' }, formRef: 'Part 8 · Item 1.b', placeholder: 'Spanish', maxLength: 18 }],
        },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 8 · Items 3–5 · Applicant’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 8 · Item 3', placeholder: '305 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 8 · Item 4' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 8 · Item 5' },
          ],
        },
      ],
    },
  ],
};
