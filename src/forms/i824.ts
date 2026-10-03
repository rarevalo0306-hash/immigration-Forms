import type { Field, FormDefinition } from './types';
import type { T } from '../i18n';
import { all, date, is, nameFields, rows, yesNo } from './helpers';

// Questions follow USCIS Form I-824, Application for Action on an Approved Application or
// Petition, edition 04/01/24. The PDF mapping lives in src/pdf/i824Pdf.ts.
// Left for hand: the attorney/G-28 box at the top of page 1; Part 1, Item 3 (company name) and
// Item 10 (IRS tax number), which only employers filing for a worker need; the signature and
// date in Part 4; and Parts 5 and 6 (interpreter and preparer).

export const I824_EDITION = '04/01/24';

const t = (es: string, en: string): T => ({ es, en });

/** Part 2's requests, by the PDF's export values. */
export const REQUESTS: { value: string; label: T }[] = [
  { value: '1a', label: t('Una copia (duplicado) del aviso de aprobación', 'A duplicate approval notice') },
  {
    value: '1b',
    label: t(
      'Que USCIS avise a un consulado o puerto de entrada distinto al que pedí (petición de visa de no inmigrante o perdón aprobado)',
      'That USCIS notify a different U.S. Consulate or Port-of-Entry (approved nonimmigrant visa petition or waiver)',
    ),
  },
  {
    value: '1c',
    label: t(
      'Que USCIS avise al consulado que ya soy residente permanente, para que mi cónyuge o hijos me sigan (follow-to-join)',
      'That USCIS notify a U.S. Consulate of my adjustment to permanent resident, so my spouse or children can follow to join me',
    ),
  },
  { value: '1d', label: t('Que USCIS envíe mi petición de inmigrante aprobada al Centro Nacional de Visas (NVC)', 'That USCIS send my approved immigrant visa petition to the NVC') },
  { value: '1e', label: t('Que USCIS avise al Departamento de Estado que me hice ciudadano/a por naturalización', 'That USCIS notify the Department of State that I became a U.S. citizen through naturalization') },
];

const text = (id: string, es: string, en: string, formRef: string, extra: Partial<Field> = {}): Field => ({ id, type: 'text', required: true, label: { es, en }, formRef, ...extra });

/** A mailing or physical address, U.S. or foreign, with this form's 25-character street. */
const address = (prefix: string, ref: string, opts: { careOf?: boolean; us?: boolean } = {}): Field[] => [
  ...(opts.careOf ? [text(`${prefix}.careOf`, 'A cargo de (si recibe correo en casa de otra persona)', 'In care of', `${ref} · In Care Of Name`, { required: false, maxLength: 34 })] : []),
  text(`${prefix}.street`, 'Número y calle', 'Street number and name', `${ref} · Street Number and Name`, { maxLength: 25, placeholder: '1234 Main St' }),
  { id: `${prefix}.unit`, type: 'unit', label: { es: 'Apartamento, suite o piso', en: 'Apt., suite or floor' }, formRef: `${ref} · Apt. Ste. Flr.`, placeholder: 'Apt 4B' },
  text(`${prefix}.city`, 'Ciudad', 'City or town', `${ref} · City or Town`, { maxLength: 20 }),
  ...(opts.us === false
    ? []
    : ([
        { id: `${prefix}.state`, type: 'state', label: { es: 'Estado (si es en EE.UU.)', en: 'State (if in the U.S.)' }, formRef: `${ref} · State`, placeholder: 'CA' },
        { id: `${prefix}.zip`, type: 'zip', label: { es: 'Código postal ZIP (si es en EE.UU.)', en: 'ZIP code (if in the U.S.)' }, formRef: `${ref} · ZIP Code` },
      ] as Field[])),
  text(`${prefix}.province`, 'Provincia o estado (fuera de EE.UU.)', 'Province (outside the U.S.)', `${ref} · Province`, { required: false, maxLength: 20 }),
  text(`${prefix}.postal`, 'Código postal (fuera de EE.UU.)', 'Postal code (outside the U.S.)', `${ref} · Postal Code`, { required: false, maxLength: 9 }),
  text(`${prefix}.country`, 'País', 'Country', `${ref} · Country`, { placeholder: opts.us === false ? 'Mexico' : 'United States' }),
];

const followToJoin = is('request', '1c');
const petitioner = is('filerRole', 'petitioner');

/** Part 3, Items 5-32: the four dependent blocks, by first item number. */
const DEPENDENT_ITEMS = [5, 12, 19, 26];

export const i824: FormDefinition = {
  id: 'i-824',
  number: 'I-824',
  edition: I824_EDITION,
  title: t('Acción sobre una solicitud o petición aprobada', 'Application for Action on an Approved Application or Petition'),
  summary: {
    es: 'Pida un duplicado del aviso de aprobación, que avisen a otro consulado, o que su cónyuge e hijos lo sigan después de hacerse residente.',
    en: 'Ask for a duplicate approval notice, for a different consulate to be notified, or for your spouse and children to follow to join you after you became a resident.',
  },
  intro: {
    es: 'El I-824 sirve cuando USCIS ya le aprobó una solicitud o petición y usted necesita algo más sobre ese caso: una copia del aviso de aprobación (I-797), que avisen a otro consulado, que envíen la petición al Centro Nacional de Visas (NVC) o, si se hizo residente aquí en EE.UU., que su cónyuge o hijos puedan tramitar su visa en el consulado para reunirse con usted (follow-to-join). Tenga a mano el aviso de aprobación o de recibo del caso original.',
    en: 'Form I-824 is for when USCIS already approved an application or petition and you need something more on that case: a copy of the approval notice (I-797), notice to a different consulate, sending the petition to the National Visa Center (NVC) or, if you became a resident inside the U.S., letting your spouse or children get their visas at a consulate to join you (follow-to-join). Have the approval or receipt notice of the original case at hand.',
  },
  minutes: 15,
  pdf: {
    path: 'forms/i-824.pdf',
    fileName: 'I-824-filled.pdf',
    load: () => import('../pdf/i824Pdf').then((m) => m.fillI824),
    signHere: { es: 'Parte 4, Ítem 4', en: 'Part 4, Item 4' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-824 que la edición {edition} sigue vigente y revise la tarifa actual y la dirección de envío en uscis.gov/fees y en la página del formulario.',
      'Adjunte una copia del aviso de aprobación (I-797) del caso original; si no lo tiene, una copia del aviso de recibo o su número de recibo. Para follow-to-join, una copia de su tarjeta de residente (ambos lados) o del aviso de aprobación de su I-485. Para avisar que se hizo ciudadano/a, una copia de su certificado de naturalización.',
      'Imprima el PDF y firme la Parte 4, Ítem 4, a mano con tinta negra, con la fecha. Si un intérprete o preparador le ayudó, ellos llenan y firman a mano las Partes 5 y 6.',
      'Guarde una copia de todo. Para follow-to-join, sus familiares deberán seguir luego las instrucciones del NVC y del consulado.',
    ],
    en: [
      'Check at uscis.gov/i-824 that edition {edition} is still current, and check the current fee and mailing address at uscis.gov/fees and on the form page.',
      'Attach a copy of the approval notice (I-797) of the original case; if you do not have it, a copy of the receipt notice or its receipt number. For follow-to-join, a copy of your green card (both sides) or of your I-485 approval notice. To report that you naturalized, a copy of your Certificate of Naturalization.',
      'Print the PDF and sign Part 4, Item 4, by hand in black ink, with the date. If an interpreter or preparer helped you, they complete and sign Parts 5 and 6 by hand.',
      'Keep a copy of everything. For follow-to-join, your family members will then follow the NVC and consulate instructions.',
    ],
  },
  sections: [
    {
      id: 'reason',
      part: 'Part 2',
      title: t('Qué pide', 'What you are asking for'),
      questions: [
        {
          id: 'request',
          kind: 'choice',
          formRef: 'Part 2 · Item 1 · Reason for Request',
          question: t('¿Qué necesita que haga USCIS con su caso aprobado?', 'What do you need USCIS to do with your approved case?'),
          why: t('Elija solo una. Si necesita dos cosas, presente un I-824 por cada una.', 'Choose only one. If you need two things, file one I-824 for each.'),
          options: REQUESTS,
        },
        {
          id: 'consulateInfo',
          kind: 'fields',
          formRef: 'Part 2 · Items 1.b–1.c',
          showIf: is('request', '1b', '1c'),
          question: t('¿A qué consulado (o puerto de entrada) deben avisar?', 'Which U.S. Consulate (or Port-of-Entry) should be notified?'),
          why: t('Normalmente es la embajada o consulado de EE.UU. en la ciudad donde viven sus familiares, por ejemplo "Ciudad Juarez, Mexico".', 'Usually the U.S. embassy or consulate in the city where your family lives, for example "Ciudad Juarez, Mexico".'),
          fields: [text('consulate', 'Consulado de EE.UU. (ciudad y país)', 'U.S. Consulate (city and country)', 'Part 2 · Item 1.b or 1.c · U.S. Consulate', { maxLength: 30, placeholder: 'Ciudad Juarez, Mexico' })],
        },
      ],
    },
    {
      id: 'original',
      part: 'Part 3',
      title: t('El caso aprobado', 'The approved case'),
      questions: [
        {
          id: 'originalCase',
          kind: 'fields',
          formRef: 'Part 3 · Items 1.a–1.d',
          question: t('¿Qué solicitud o petición le aprobaron?', 'Which application or petition was approved?'),
          why: t('Todo está en el aviso de aprobación o de recibo (I-797) del caso original.', 'It is all on the approval or receipt notice (I-797) of the original case.'),
          fields: [
            text('original.form', 'Número del formulario aprobado', 'Form number of the approved application or petition', 'Part 3 · Item 1.a', { maxLength: 34, placeholder: 'I-130' }),
            { id: 'original.receipt', type: 'receipt', required: true, label: { es: 'Número de recibo (en el I-797)', en: 'Receipt number (on Form I-797)' }, formRef: 'Part 3 · Item 1.b', placeholder: 'IOE0912345678' },
            date('original.filed', 'Fecha en que se presentó', 'Filing date', 'Part 3 · Item 1.c'),
            date('original.approved', 'Fecha de aprobación', 'Approval date', 'Part 3 · Item 1.d'),
          ],
        },
      ],
    },
    {
      id: 'about',
      part: 'Part 1',
      title: t('Sobre usted', 'About you'),
      questions: [
        {
          id: 'filerRole',
          kind: 'choice',
          formRef: 'Part 1 · Item 1',
          question: t('En el caso aprobado, ¿usted era quien solicitó para sí mismo/a o quien pidió por otra persona?', 'On the approved case, were you the applicant or the petitioner?'),
          why: t(
            'Es "peticionario" si usted presentó la petición por un familiar (por ejemplo un I-130). Es "solicitante" si la solicitud era para usted (por ejemplo su I-485 de residencia).',
            'You are the "petitioner" if you filed the petition for a relative (for example an I-130). You are the "applicant" if the application was for you (for example your own I-485).',
          ),
          options: [
            { value: 'applicant', label: t('Solicitante (el trámite era para mí)', 'Applicant (the case was for me)') },
            { value: 'petitioner', label: t('Peticionario/a (pedí por otra persona)', 'Petitioner (I filed for someone else)') },
          ],
        },
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 1 · Item 2',
          question: t('¿Cuál es su nombre legal completo?', 'What is your full legal name?'),
          fields: nameFields('name', 'Part 1 · Item 2'),
        },
        {
          id: 'filerStatus',
          kind: 'choice',
          formRef: 'Part 1 · Item 4',
          question: t('¿Cuál es su situación migratoria hoy?', 'What is your immigration status today?'),
          options: [
            { value: 'usc', label: t('Ciudadano/a de EE.UU.', 'U.S. citizen') },
            { value: 'lpr', label: t('Residente permanente (green card)', 'Lawful permanent resident (green card)') },
            { value: 'other', label: t('Otra', 'Other') },
          ],
        },
        {
          id: 'filerStatusOther',
          kind: 'fields',
          formRef: 'Part 1 · Item 4',
          showIf: is('filerStatus', 'other'),
          question: t('¿Cuál es su situación migratoria?', 'What is your immigration status?'),
          fields: [text('filerStatus.other', 'Situación actual o más reciente', 'Current or most recent status', 'Part 1 · Item 4', { placeholder: 'H-1B' })],
        },
        {
          id: 'ids',
          kind: 'fields',
          formRef: 'Part 1 · Items 5–9, 11–12',
          question: t('Sus datos', 'Your details'),
          fields: [
            { id: 'certificate', type: 'text', label: { es: 'Número del certificado de naturalización o ciudadanía (si tiene)', en: 'Certificate of Naturalization or Citizenship number (if any)' }, formRef: 'Part 1 · Item 5' },
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 1 · Item 6' },
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 7'),
            text('birthCountry', 'País de nacimiento', 'Country of birth', 'Part 1 · Item 8', { placeholder: 'Mexico' }),
            text('citizenship', 'País de ciudadanía o nacionalidad', 'Country of citizenship or nationality', 'Part 1 · Item 9'),
            { id: 'ssn', type: 'ssn', label: { es: 'Seguro Social (si tiene)', en: 'U.S. Social Security number (if any)' }, formRef: 'Part 1 · Item 11' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Cuenta en línea de USCIS (si tiene)', en: 'USCIS online account number (if any)' }, formRef: 'Part 1 · Item 12' },
          ],
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 1 · Item 13 · Mailing Address',
          question: t('¿A qué dirección le llega el correo?', 'What is your mailing address?'),
          why: t('USCIS le enviará aquí el aviso y la respuesta.', 'USCIS will send the notice and its answer here.'),
          fields: address('mailing', 'Part 1 · Item 13', { careOf: true }),
        },
        { id: 'mailingSame', kind: 'choice', formRef: 'Part 1 · Item 14', question: t('¿Vive en esa misma dirección?', 'Do you live at that same address?'), options: yesNo },
        { id: 'home', kind: 'fields', formRef: 'Part 1 · Item 14 · Physical Address', showIf: is('mailingSame', 'no'), question: t('¿Dónde vive?', 'Where do you live?'), fields: address('home', 'Part 1 · Item 14') },
      ],
    },
    {
      id: 'beneficiary',
      part: 'Part 3',
      title: t('El beneficiario', 'The beneficiary'),
      questions: [
        {
          id: 'beneficiaryInfo',
          kind: 'fields',
          formRef: 'Part 3 · Items 2.a–2.g',
          showIf: petitioner,
          question: t('¿Para quién era la petición aprobada?', 'Who was the beneficiary of the approved petition?'),
          why: t('Es la persona principal por la que usted pidió (por ejemplo su hermano, hijo o esposo/a).', 'The main person you filed for (for example your brother, child or spouse).'),
          fields: [
            ...nameFields('beneficiary', 'Part 3 · Item 2'),
            date('beneficiary.dob', 'Fecha de nacimiento', 'Date of birth', 'Part 3 · Item 2.d'),
            text('beneficiary.birthCountry', 'País de nacimiento', 'Country of birth', 'Part 3 · Item 2.e', { placeholder: 'Mexico' }),
            { id: 'beneficiary.aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 3 · Item 2.f' },
            { id: 'beneficiary.phone', type: 'text', label: { es: 'Teléfono de día (si tiene)', en: 'Daytime telephone number (if any)' }, formRef: 'Part 3 · Item 2.g', maxLength: 10, hint: t('Solo números; caben 10.', 'Digits only; 10 fit.') },
          ],
        },
        {
          id: 'beneficiaryMailing',
          kind: 'fields',
          formRef: 'Part 3 · Item 3 · Mailing Address',
          showIf: petitioner,
          question: t('¿A qué dirección le llega el correo al beneficiario?', 'What is the beneficiary’s mailing address?'),
          fields: address('beneficiary.mailing', 'Part 3 · Item 3', { careOf: true }),
        },
        {
          id: 'beneficiary.mailingSame',
          kind: 'choice',
          formRef: 'Part 3 · Item 4',
          showIf: petitioner,
          question: t('¿El beneficiario vive en esa misma dirección?', 'Does the beneficiary live at that same address?'),
          options: yesNo,
        },
        {
          id: 'beneficiaryHome',
          kind: 'fields',
          formRef: 'Part 3 · Item 4 · Physical Address',
          showIf: all(petitioner, is('beneficiary.mailingSame', 'no')),
          question: t('¿Dónde vive el beneficiario?', 'Where does the beneficiary live?'),
          fields: address('beneficiary.home', 'Part 3 · Item 4'),
        },
      ],
    },
    {
      id: 'dependents',
      part: 'Part 3',
      title: t('Familiares que lo seguirán', 'Family following to join'),
      questions: [
        ...rows({
          max: 4,
          id: 'dependent',
          first: followToJoin,
          question: (i) => (i === 1 ? t('¿Quién es el familiar que lo seguirá?', 'Who is the family member following to join you?') : t('Otro familiar', 'Another family member')),
          why: (i) =>
            i === 1
              ? t(
                  'Su cónyuge, o sus hijos solteros menores de 21 años, que ya lo eran cuando usted se hizo residente.',
                  'Your spouse, or your unmarried children under 21, who already were when you became a resident.',
                )
              : undefined,
          more: t('¿Hay otro familiar que lo seguirá?', 'Is another family member following to join you?'),
          formRef: 'Part 3 · Items 5–32 · Dependents',
          fields: (i) => {
            const n = DEPENDENT_ITEMS[i - 1];
            const ref = (k: number) => `Part 3 · Item ${n + k}`;
            const p = `dependent${i}`;
            return [
              ...nameFields(p, ref(0)),
              date(`${p}.dob`, 'Fecha de nacimiento', 'Date of birth', ref(1)),
              text(`${p}.birthCountry`, 'País de nacimiento', 'Country of birth', ref(2), { placeholder: 'Mexico' }),
              text(`${p}.citizenship`, 'País de ciudadanía o nacionalidad', 'Country of citizenship or nationality', ref(3)),
              {
                id: `${p}.relationship`,
                type: 'select',
                required: true,
                label: { es: 'Parentesco con usted', en: 'Relationship to you' },
                formRef: `${ref(4)} · Relationship to Principal Applicant`,
                options: [
                  { value: 'spouse', label: t('Cónyuge (esposo/a)', 'Spouse') },
                  { value: 'child', label: t('Hijo/a', 'Child') },
                ],
              },
              { id: `${p}.email`, type: 'email', label: { es: 'Correo electrónico (si tiene)', en: 'Email (if any)' }, formRef: ref(5), maxLength: 30 },
              { id: `${p}.phone`, type: 'text', label: { es: 'Teléfono de día (si tiene)', en: 'Daytime telephone number (if any)' }, formRef: ref(6), maxLength: 10, hint: t('Solo números; caben 10.', 'Digits only; 10 fit.') },
            ];
          },
          overflow: t('Si son más de 4, escriba a los demás en la siguiente pantalla: irán en la Parte 7.', 'If there are more than 4, list the others on the next screen: they go in Part 7.'),
        }),
        {
          id: 'dependentsExtra',
          kind: 'fields',
          formRef: 'Part 7 · Additional Information (Part 3, Items 5–11)',
          showIf: all(followToJoin, is('dependent.more1', 'yes'), is('dependent.more2', 'yes'), is('dependent.more3', 'yes'), is('dependent.more4', 'yes')),
          question: t('Los demás familiares', 'The other family members'),
          why: t(
            'Por cada uno: nombre completo, fecha de nacimiento, país de nacimiento, ciudadanía, parentesco, correo y teléfono.',
            'For each one: full name, date of birth, country of birth, citizenship, relationship, email and phone.',
          ),
          fields: [{ id: 'dependents.extra', type: 'longText', required: true, label: { es: 'Familiares adicionales', en: 'Additional family members' }, formRef: 'Part 7 · Item 3.d' }],
        },
        {
          id: 'dependentsAddress',
          kind: 'fields',
          formRef: 'Part 3 · Items 33–34 · Foreign Address of Dependents',
          showIf: followToJoin,
          question: t('¿Dónde viven sus familiares en el extranjero?', 'Where do your family members live abroad?'),
          why: t('El consulado los contactará ahí.', 'The consulate will contact them there.'),
          fields: [
            ...address('dependents.address', 'Part 3 · Item 33', { careOf: true, us: false }),
            { id: 'dependents.phone', type: 'text', label: { es: 'Teléfono en el extranjero (si tiene)', en: 'Foreign telephone number (if any)' }, formRef: 'Part 3 · Item 34', maxLength: 10, hint: t('Solo números; caben 10.', 'Digits only; 10 fit.') },
          ],
        },
      ],
    },
    {
      id: 'contact',
      part: 'Part 4',
      title: t('Contacto y comentarios', 'Contact and comments'),
      questions: [
        {
          id: 'additional',
          kind: 'fields',
          formRef: 'Part 7 · Additional Information',
          question: t('¿Algo más que USCIS deba saber?', 'Anything else USCIS should know?'),
          why: t(
            'Opcional. Por ejemplo, por qué necesita el duplicado (se perdió, nunca llegó, tenía un error) o qué consulado tenía antes.',
            'Optional. For example, why you need the duplicate (lost, never arrived, had an error) or which consulate you had before.',
          ),
          fields: [{ id: 'additional.text', type: 'longText', label: { es: 'Explicación (opcional)', en: 'Explanation (optional)' }, formRef: 'Part 7 · Item 3.d' }],
        },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 4 · Items 1–3',
          question: t('¿Cómo lo puede contactar USCIS?', 'How can USCIS contact you?'),
          notice: {
            tone: 'legal',
            title: t('Firma bajo pena de perjurio', 'Signed under penalty of perjury'),
            body: t(
              'Al firmar, usted declara que todo es cierto. Revise bien las fechas y el número de recibo. Si su caso tiene complicaciones (por ejemplo, el parentesco con sus familiares empezó después de hacerse residente), consulte a un abogado o representante acreditado antes de presentar.',
              'By signing, you declare everything is true. Check the dates and receipt number carefully. If your case is complicated (for example, the relationship with your family members began after you became a resident), talk to an attorney or accredited representative before filing.',
            ),
          },
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 4 · Item 1', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 4 · Item 2' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 4 · Item 3', maxLength: 30 },
          ],
        },
      ],
    },
  ],
};
