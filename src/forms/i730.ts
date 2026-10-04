import type { Field, FormDefinition, Option } from './types';
import type { T } from '../i18n';
import { all, anyAddress, date, is, nameFields, rows, sexField, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';

// Questions follow USCIS Form I-730, Refugee/Asylee Relative Petition, edition 01/20/25.
// The person filling in the app is the petitioner (granted asylum or refugee status); the
// beneficiary is one spouse or unmarried child under 21 (one petition per relative).
// Out of scope, left for hand: the attorney box and USCIS-only boxes on page 1, Part 6 (the
// beneficiary's own statement and signature, only when the beneficiary is in the U.S. and 14 or
// older), Part 9 (completed at the interview), and every signature and date. Parts 7-8 (interpreter
// and preparer) are filled from the shared assistance section. The PDF mapping lives in src/pdf/i730Pdf.ts.

export const I730_EDITION = '01/20/25';

const t = (es: string, en: string): T => ({ es, en });

const text = (id: string, es: string, en: string, formRef: string, opts: Partial<Field> = {}): Field => ({ id, type: 'text', required: true, label: { es, en }, formRef, ...opts });

const asylee = is('status', 'ASL', 'LAS');
const refugee = is('status', 'REF', 'LRE');
const isSpouse = is('relationship', 'S');
const isChild = is('relationship', 'U');
const abroad = is('ben.location', 'B');
const beenInUs = is('ben.court', 'B', 'C', 'D');

/** The place a marriage happened or ended. */
const placeFields = (p: string, ref: string, required = true): Field[] => [
  text(`${p}.city`, 'Ciudad', 'City or town', `${ref} · City or Town`, { required }),
  text(`${p}.state`, 'Estado o provincia', 'State or province', `${ref} · State or Province`, { required: false, maxLength: 20 }),
  text(`${p}.country`, 'País', 'Country', `${ref} · Country`, { required }),
];

/** Prior marriages (Items 15-20 of Parts 1 and 2), two at most. */
const priorRows = (id: string, part: string, who: 'pet' | 'ben') =>
  rows({
    max: 2,
    id,
    first: is(`${id}.more0`, 'yes'),
    question: (i) =>
      who === 'pet'
        ? i === 1
          ? t('Su matrimonio anterior', 'Your prior marriage')
          : t('Otro matrimonio anterior', 'Another prior marriage')
        : i === 1
          ? t('Matrimonio anterior de su familiar', 'Your relative’s prior marriage')
          : t('Otro matrimonio anterior de su familiar', 'Another prior marriage of your relative'),
    why: (i) => (i === 1 ? t('Adjunte la prueba de cómo terminó (acta de divorcio, de defunción o de anulación).', 'Attach proof of how it ended (divorce decree, death certificate or annulment).') : undefined),
    more: who === 'pet' ? t('¿Tuvo otro matrimonio antes?', 'Did you have another prior marriage?') : t('¿Su familiar tuvo otro matrimonio antes?', 'Did your relative have another prior marriage?'),
    formRef: `${part} · Items 15–20 · Prior Spouses`,
    fields: (i) => {
      const [name, ended, place] = i === 1 ? [15, 16, 17] : [18, 19, 20];
      return [
        ...nameFields(`${id}${i}`, `${part} · Item ${name} · Prior Spouse ${i}`),
        date(`${id}${i}.ended`, 'Fecha en que terminó', 'Date the marriage ended', `${part} · Item ${ended} · Date Prior Marriage Ended`),
        ...placeFields(`${id}${i}.endPlace`, `${part} · Item ${place} · Place Marriage Ended`),
      ];
    },
    overflow: t('El formulario tiene espacio para 2 matrimonios anteriores. Si hubo más, escríbalos a mano en una hoja aparte con su nombre y A-Number.', 'The form has room for 2 prior marriages. If there were more, write them by hand on a separate sheet with your name and A-Number.'),
  });

const otherNameRows = (id: string, part: string, who: 'pet' | 'ben') =>
  rows({
    max: 2,
    id,
    first: is(`${id}.more0`, 'yes'),
    question: (i) => (i === 1 ? t('Otro nombre usado', 'Another name used') : t('Otro nombre más', 'One more name')),
    more: who === 'pet' ? t('¿Ha usado otro nombre más?', 'Have you used another name?') : t('¿Su familiar ha usado otro nombre más?', 'Has your relative used another name?'),
    formRef: `${part} · Item 11 · Other Names Used`,
    fields: (i) => nameFields(`${id}${i}`, `${part} · Item 11 · Name ${i}`),
    overflow: t('Si son más de 2, escríbalos a mano en una hoja aparte.', 'If there are more than 2, write them by hand on a separate sheet.'),
  });

const courtOptions: Option[] = [
  { value: 'A', label: t('Nunca ha estado en Estados Unidos', 'Has never been in the United States') },
  { value: 'B', label: t('Está AHORA en proceso ante una corte de inmigración en EE.UU.', 'Is NOW in immigration court proceedings in the U.S.') },
  { value: 'C', label: t('Ha estado en EE.UU., pero nunca en proceso ante una corte de inmigración', 'Has been in the U.S., but never in immigration court proceedings') },
  { value: 'D', label: t('No está ahora, pero SÍ estuvo antes en proceso ante una corte de inmigración', 'Is not now, but HAS been in immigration court proceedings before') },
];

export const i730: FormDefinition = {
  id: 'i-730',
  number: 'I-730',
  edition: I730_EDITION,
  title: t('Petición de familiar de refugiado o asilado', 'Refugee/Asylee Relative Petition'),
  summary: {
    es: 'Si recibió asilo o refugio, pida que su cónyuge o sus hijos solteros menores de 21 reciban el mismo estatus.',
    en: 'If you were granted asylum or refugee status, ask for your spouse or unmarried children under 21 to get the same status.',
  },
  intro: {
    es: 'Con el I-730 usted (el "peticionario"), que recibió asilo o refugio, pide que su cónyuge o su hijo/a soltero/a menor de 21 años (el "beneficiario") reciba el mismo estatus, esté en Estados Unidos o en otro país. Se llena un I-730 por cada familiar. Debe presentarlo dentro de los 2 años después de recibir el asilo o de entrar como refugiado. No tiene costo.',
    en: 'With Form I-730 you (the "petitioner"), who were granted asylum or refugee status, ask for your spouse or unmarried child under 21 (the "beneficiary") to get the same status, whether they are in the U.S. or abroad. You file one I-730 for each relative. It must be filed within 2 years after you were granted asylum or admitted as a refugee. There is no fee.',
  },
  minutes: 40,
  pdf: {
    path: 'forms/i-730.pdf',
    fileName: 'I-730-filled.pdf',
    load: () => import('../pdf/i730Pdf').then((m) => m.fillI730),
    signHere: { es: 'Parte 5, Ítem 6.a', en: 'Part 5, Item 6.a' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-730 que la edición {edition} sigue vigente y revise a dónde enviarlo. No hay tarifa.',
      'Adjunte: prueba de su estatus (la carta que le otorgó el asilo o su I-94 de refugiado), prueba del parentesco (acta de matrimonio o de nacimiento, con traducción al inglés), las actas de divorcio o defunción de matrimonios anteriores, y una foto tipo pasaporte reciente de su familiar. Si su familiar está en EE.UU., agregue copia de su pasaporte y su I-94.',
      'Revise el PDF página por página. Si el nombre o la dirección de su familiar se escriben en otro alfabeto, escríbalos a mano en la Parte 2, Ítem 22. Si algo no cupo (más nombres, matrimonios o entradas), escríbalo en una hoja aparte con su nombre y A-Number.',
      'Imprima el PDF y firme la Parte 5, Ítem 6.a, a mano con tinta negra. Si su familiar está en EE.UU. y tiene 14 años o más, él o ella llena y firma a mano la Parte 6. Si un intérprete o preparador le ayudó, sus datos ya están en las Partes 7 y 8; ellos las revisan y las firman y fechan a mano.',
      'Llene un I-730 aparte por cada familiar y envíelos antes de que se cumplan 2 años de su asilo o de su llegada como refugiado. Guarde copia de todo.',
    ],
    en: [
      'Check at uscis.gov/i-730 that edition {edition} is still current and where to mail it. There is no fee.',
      'Attach: proof of your status (your asylum approval or refugee I-94), proof of the relationship (marriage or birth certificate, with English translation), divorce or death certificates for prior marriages, and a recent passport-style photo of your relative. If your relative is in the U.S., add a copy of their passport and I-94.',
      'Check the PDF page by page. If your relative’s name or address is written in another script, write it by hand in Part 2, Item 22. If anything did not fit (more names, marriages or entries), write it on a separate sheet with your name and A-Number.',
      'Print the PDF and sign Part 5, Item 6.a, by hand in black ink. If your relative is in the U.S. and 14 or older, they complete and sign Part 6 by hand. If an interpreter or preparer helped you, their details are already in Parts 7 and 8; they review them and sign and date by hand.',
      'Complete a separate I-730 for each relative and send them before 2 years have passed since your asylum grant or refugee admission. Keep a copy of everything.',
    ],
  },
  sections: [
    {
      id: 'basis',
      part: 'Page 1',
      title: t('Su estatus y su familiar', 'Your status and your relative'),
      questions: [
        {
          id: 'status',
          kind: 'choice',
          formRef: 'Page 1 · My Status',
          question: t('¿Cuál es su estatus?', 'What is your status?'),
          notice: {
            tone: 'legal',
            title: t('Quién puede presentar el I-730', 'Who can file Form I-730'),
            body: {
              es: 'Solo la persona que recibió asilo o refugio como solicitante principal. Si usted obtuvo su estatus a través de otra persona (como cónyuge o hijo/a), o si ya es ciudadano/a de EE.UU., en general no puede presentarlo. Si tiene dudas, hable con un abogado o una organización acreditada antes de presentar.',
              en: 'Only the person granted asylum or refugee status as the principal applicant. If you got your status through someone else (as a spouse or child), or if you are already a U.S. citizen, you generally cannot file it. If in doubt, talk to an attorney or accredited organization before filing.',
            },
          },
          options: [
            { value: 'ASL', label: t('Asilado/a', 'Asylee') },
            { value: 'REF', label: t('Refugiado/a', 'Refugee') },
            { value: 'LAS', label: t('Residente permanente; antes era asilado/a', 'Lawful permanent resident, previously an asylee') },
            { value: 'LRE', label: t('Residente permanente; antes era refugiado/a', 'Lawful permanent resident, previously a refugee') },
          ],
        },
        {
          id: 'relationship',
          kind: 'choice',
          formRef: 'Page 1 · The beneficiary is my',
          question: t('¿Para quién presenta esta petición?', 'Who are you filing this petition for?'),
          notice: {
            tone: 'legal',
            title: t('El parentesco debe existir desde antes', 'The relationship must already exist'),
            body: {
              es: 'Su cónyuge califica si ya estaban casados cuando le dieron el asilo (o cuando entró como refugiado). Su hijo/a califica si ya había nacido o estaba en gestación en esa fecha, y si es soltero/a y menor de 21 años. La edad se cuenta en general a la fecha en que usted presentó su propia solicitud de asilo o de refugio. Si no está seguro/a, consulte a un abogado.',
              en: 'Your spouse qualifies if you were already married when you were granted asylum (or admitted as a refugee). Your child qualifies if born or conceived by that date, unmarried and under 21. Age generally counts from the date you filed your own asylum or refugee application. If unsure, consult an attorney.',
            },
          },
          options: [
            { value: 'S', label: t('Mi esposo/a', 'My spouse') },
            { value: 'U', label: t('Mi hijo/a soltero/a menor de 21 años', 'My unmarried child under 21') },
          ],
        },
        {
          id: 'childType',
          kind: 'choice',
          formRef: 'Page 1 · Unmarried child who is a(n)',
          showIf: isChild,
          question: t('¿Qué tipo de hijo/a es?', 'What kind of child is this?'),
          why: t('Un hijastro/a califica si usted se casó con su padre o madre antes de que cumpliera 18 años. Un hijo/a adoptivo/a, si lo adoptó antes de los 16 y vivió con usted 2 años.', 'A stepchild qualifies if you married their parent before they turned 18. An adopted child, if adopted before 16 and in your custody for 2 years.'),
          options: [
            { value: 'BC', label: t('Hijo/a biológico/a', 'Biological child') },
            { value: 'SC', label: t('Hijastro/a', 'Stepchild') },
            { value: 'AC', label: t('Hijo/a adoptivo/a', 'Adopted child') },
          ],
        },
        {
          id: 'relatives',
          kind: 'fields',
          formRef: 'Page 1 · Number of relatives for whom I am filing separate Form I-730s',
          question: t('¿Para cuántos familiares presenta un I-730?', 'How many relatives are you filing an I-730 for?'),
          why: t('Se llena un I-730 por persona. Por ejemplo, si pide por su esposa y dos hijos, son 3; este puede ser el 1 de 3.', 'One I-730 per person. For example, if you are filing for your wife and two children, that is 3; this one can be 1 of 3.'),
          fields: [
            { id: 'relatives.total', type: 'number', required: true, label: t('Total de familiares', 'Total relatives'), formRef: 'Page 1 · Number of relatives', placeholder: '1', maxLength: 2 },
            { id: 'relatives.this', type: 'number', required: true, label: t('¿Qué número es este?', 'Which number is this one?'), formRef: 'Page 1 · ( _ of _ )', placeholder: '1', maxLength: 2 },
          ],
        },
      ],
    },
    {
      id: 'petitioner',
      part: 'Part 1',
      title: t('Sobre usted', 'About you'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 1 · Item 1 · Your Full Name',
          question: t('¿Cuál es su nombre completo?', 'What is your full name?'),
          notice: {
            tone: 'info',
            title: t('Usted es el peticionario', 'You are the petitioner'),
            body: t('Primero le preguntamos sobre usted, la persona que recibió asilo o refugio. Después, sobre su familiar.', 'First we ask about you, the person granted asylum or refugee status. Then about your relative.'),
          },
          fields: nameFields('name', 'Part 1 · Item 1'),
        },
        {
          id: 'home',
          kind: 'fields',
          formRef: 'Part 1 · Item 2 · Address of Residence',
          question: t('¿Dónde vive?', 'Where do you live?'),
          fields: anyAddress('home', 'Part 1 · Item 2'),
        },
        {
          id: 'mailingSame',
          kind: 'choice',
          formRef: 'Part 1 · Item 3 · Mailing Address',
          question: t('¿Recibe su correo en esa misma dirección?', 'Do you get your mail at that same address?'),
          options: yesNo,
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 1 · Item 3 · Mailing Address',
          showIf: is('mailingSame', 'no'),
          question: t('¿Cuál es su dirección postal?', 'What is your mailing address?'),
          fields: anyAddress('mailing', 'Part 1 · Item 3', { careOf: true }),
        },
        {
          id: 'contact',
          kind: 'fields',
          formRef: 'Part 1 · Item 4; Part 5 · Items 3–5 · Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: t('Teléfono de día', 'Daytime phone'), formRef: 'Part 1 · Item 4; Part 5 · Item 3', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: t('Celular', 'Mobile phone'), formRef: 'Part 5 · Item 4' },
            { id: 'email', type: 'email', label: t('Correo electrónico', 'Email'), formRef: 'Part 1 · Item 4; Part 5 · Item 5' },
          ],
        },
        {
          id: 'personal',
          kind: 'fields',
          formRef: 'Part 1 · Items 5–8',
          question: t('Sus datos personales', 'Your personal details'),
          fields: [
            sexField('sex', 'Part 1 · Item 5'),
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 6'),
            text('birthCountry', 'País de nacimiento', 'Country of birth', 'Part 1 · Item 7'),
            text('citizenship', 'País de ciudadanía o nacionalidad', 'Country of citizenship or nationality', 'Part 1 · Item 8'),
          ],
        },
        {
          id: 'ids',
          kind: 'fields',
          formRef: 'Part 1 · Items 9–10',
          question: t('Sus números', 'Your numbers'),
          fields: [
            { id: 'aNumber', type: 'aNumber', required: true, label: t('A-Number', 'A-Number'), formRef: 'Part 1 · Item 9', hint: t('Está en su carta de asilo, su I-94 o su tarjeta de residente.', 'It is on your asylum approval, I-94 or green card.') },
            { id: 'ssn', type: 'ssn', label: t('Número de Seguro Social (si tiene)', 'U.S. Social Security number (if any)'), formRef: 'Part 1 · Item 10' },
          ],
        },
        {
          id: 'otherName.more0',
          kind: 'choice',
          formRef: 'Part 1 · Item 11 · Other Names Used',
          question: t('¿Ha usado otros nombres (de soltera, apodos, alias)?', 'Have you used other names (maiden name, nicknames, aliases)?'),
          options: yesNo,
        },
        ...otherNameRows('otherName', 'Part 1', 'pet'),
        {
          id: 'pet.married',
          kind: 'choice',
          formRef: 'Part 1 · Item 12 · Current Spouse',
          showIf: isChild,
          question: t('¿Está casado/a actualmente?', 'Are you currently married?'),
          options: yesNo,
        },
        {
          id: 'pet.spouse',
          kind: 'fields',
          formRef: 'Part 1 · Item 12 · Current Spouse’s Legal Name',
          showIf: all(isChild, is('pet.married', 'yes')),
          question: t('¿Cómo se llama su cónyuge actual?', 'What is your current spouse’s name?'),
          fields: nameFields('pet.spouse', 'Part 1 · Item 12'),
        },
        {
          id: 'pet.marriage',
          kind: 'fields',
          formRef: 'Part 1 · Items 13–14 · Marriage to Current Spouse',
          showIf: (a) => isSpouse(a) || (isChild(a) && a['pet.married'] === 'yes'),
          question: t('¿Cuándo y dónde se casaron?', 'When and where did you marry?'),
          why: t('Si pide por su cónyuge, el matrimonio debe ser de antes de la fecha de su asilo o de su entrada como refugiado.', 'If you are filing for your spouse, the marriage must be before your asylum grant or refugee admission.'),
          fields: [date('pet.marriage.date', 'Fecha del matrimonio', 'Date of marriage', 'Part 1 · Item 13'), ...placeFields('pet.marriage', 'Part 1 · Item 14 · Place of Marriage')],
        },
        {
          id: 'pet.prior.more0',
          kind: 'choice',
          formRef: 'Part 1 · Items 15–20 · Prior Marriages',
          question: t('¿Estuvo casado/a antes (con otra persona)?', 'Were you married before (to someone else)?'),
          options: yesNo,
        },
        ...priorRows('pet.prior', 'Part 1', 'pet'),
        {
          id: 'asylumGrant',
          kind: 'fields',
          formRef: 'Part 1 · Items 21–22 · Asylee Status Granted',
          showIf: asylee,
          question: t('¿Cuándo y dónde le dieron el asilo?', 'When and where were you granted asylum?'),
          why: t('Está en su carta de aprobación del asilo (de USCIS o del juez de inmigración). Ponga la ciudad de la oficina o corte.', 'It is on your asylum approval (from USCIS or the immigration judge). Give the city of the office or court.'),
          notice: {
            tone: 'info',
            title: t('Plazo de 2 años', '2-year deadline'),
            body: t('El I-730 debe presentarse dentro de los 2 años después de esta fecha. Después de ese plazo USCIS solo lo acepta por razones humanitarias.', 'Form I-730 must be filed within 2 years after this date. After that, USCIS only accepts it for humanitarian reasons.'),
          },
          fields: [
            date('grant.date', 'Fecha en que le dieron el asilo', 'Date asylee status was granted', 'Part 1 · Item 21'),
            text('grant.city', 'Ciudad', 'City or town', 'Part 1 · Item 22 · City or Town', { placeholder: 'Los Angeles' }),
            { id: 'grant.state', type: 'state', required: true, label: t('Estado', 'State'), formRef: 'Part 1 · Item 22 · State', placeholder: 'CA' },
          ],
        },
        {
          id: 'refugeeApproval',
          kind: 'fields',
          formRef: 'Part 1 · Items 23–24 · Refugee Status Approved Abroad',
          showIf: refugee,
          question: t('¿Cuándo y dónde le aprobaron el refugio?', 'When and where was your refugee status approved?'),
          why: t('Es la aprobación que recibió en el extranjero, antes de viajar.', 'It is the approval you received abroad, before traveling.'),
          fields: [date('refugee.date', 'Fecha de aprobación', 'Date approved', 'Part 1 · Item 23'), ...placeFields('refugee', 'Part 1 · Item 24')],
        },
        {
          id: 'refugeeAdmission',
          kind: 'fields',
          formRef: 'Part 1 · Items 25–26 · Admitted as a Refugee',
          showIf: refugee,
          question: t('¿Cuándo y dónde entró a EE.UU. como refugiado/a?', 'When and where were you admitted to the U.S. as a refugee?'),
          why: t('Está en su I-94. Ponga la ciudad del aeropuerto o puerto de entrada.', 'It is on your I-94. Give the city of the airport or port of entry.'),
          notice: {
            tone: 'info',
            title: t('Plazo de 2 años', '2-year deadline'),
            body: t('El I-730 debe presentarse dentro de los 2 años después de esta fecha. Después de ese plazo USCIS solo lo acepta por razones humanitarias.', 'Form I-730 must be filed within 2 years after this date. After that, USCIS only accepts it for humanitarian reasons.'),
          },
          fields: [
            date('admit.date', 'Fecha de entrada', 'Date admitted', 'Part 1 · Item 25'),
            text('admit.city', 'Ciudad', 'City or town', 'Part 1 · Item 26 · City or Town', { placeholder: 'Miami' }),
            { id: 'admit.state', type: 'state', required: true, label: t('Estado', 'State'), formRef: 'Part 1 · Item 26 · State', placeholder: 'FL' },
          ],
        },
      ],
    },
    {
      id: 'beneficiary',
      part: 'Part 2',
      title: t('Sobre su familiar', 'About your relative'),
      questions: [
        {
          id: 'ben.name',
          kind: 'fields',
          formRef: 'Part 2 · Item 1 · Full Name',
          question: t('¿Cuál es el nombre completo de su familiar?', 'What is your relative’s full name?'),
          why: t('Tal como aparece en su pasaporte o acta de nacimiento.', 'As it appears on their passport or birth certificate.'),
          fields: nameFields('ben.name', 'Part 2 · Item 1'),
        },
        {
          id: 'ben.home',
          kind: 'fields',
          formRef: 'Part 2 · Item 2 · Address of Residence',
          question: t('¿Dónde vive su familiar?', 'Where does your relative live?'),
          fields: anyAddress('ben.home', 'Part 2 · Item 2'),
        },
        {
          id: 'ben.mailingSame',
          kind: 'choice',
          formRef: 'Part 2 · Item 3 · Mailing Address',
          question: t('¿Su familiar recibe su correo en esa misma dirección?', 'Does your relative get mail at that same address?'),
          options: yesNo,
        },
        {
          id: 'ben.mailing',
          kind: 'fields',
          formRef: 'Part 2 · Item 3 · Mailing Address',
          showIf: is('ben.mailingSame', 'no'),
          question: t('¿Cuál es la dirección postal de su familiar?', 'What is your relative’s mailing address?'),
          fields: anyAddress('ben.mailing', 'Part 2 · Item 3', { careOf: true }),
        },
        {
          id: 'ben.contact',
          kind: 'fields',
          formRef: 'Part 2 · Item 4 · Contact Information',
          question: t('¿Cómo se contacta a su familiar?', 'How can your relative be reached?'),
          fields: [
            text('ben.phone', 'Teléfono con código de país y de ciudad', 'Phone with country and city/area code', 'Part 2 · Item 4 · Telephone Number', { required: false, placeholder: '+503 2222 3333' }),
            { id: 'ben.email', type: 'email', label: t('Correo electrónico (si tiene)', 'Email (if any)'), formRef: 'Part 2 · Item 4 · E-mail Address' },
          ],
        },
        {
          id: 'ben.personal',
          kind: 'fields',
          formRef: 'Part 2 · Items 5–8',
          question: t('Datos personales de su familiar', 'Your relative’s personal details'),
          fields: [
            sexField('ben.sex', 'Part 2 · Item 5'),
            date('ben.dob', 'Fecha de nacimiento', 'Date of birth', 'Part 2 · Item 6'),
            text('ben.birthCountry', 'País de nacimiento', 'Country of birth', 'Part 2 · Item 7'),
            text('ben.citizenship', 'País de ciudadanía o nacionalidad', 'Country of citizenship or nationality', 'Part 2 · Item 8'),
          ],
        },
        {
          id: 'ben.ids',
          kind: 'fields',
          formRef: 'Part 2 · Items 9–10',
          question: t('Números de su familiar (si tiene)', 'Your relative’s numbers (if any)'),
          why: t('La mayoría de los familiares en el extranjero no tienen; deje en blanco lo que no tenga.', 'Most relatives abroad have none; leave blank what they don’t have.'),
          fields: [
            { id: 'ben.aNumber', type: 'aNumber', label: t('A-Number', 'A-Number'), formRef: 'Part 2 · Item 9' },
            { id: 'ben.ssn', type: 'ssn', label: t('Número de Seguro Social', 'U.S. Social Security number'), formRef: 'Part 2 · Item 10' },
          ],
        },
        {
          id: 'benOtherName.more0',
          kind: 'choice',
          formRef: 'Part 2 · Item 11 · Other Names Used',
          question: t('¿Su familiar ha usado otros nombres (de soltera, apodos, alias)?', 'Has your relative used other names (maiden name, nicknames, aliases)?'),
          options: yesNo,
        },
        ...otherNameRows('benOtherName', 'Part 2', 'ben'),
        {
          id: 'ben.prior.more0',
          kind: 'choice',
          formRef: 'Part 2 · Items 15–20 · Prior Marriages',
          question: t('¿Su familiar estuvo casado/a antes con otra persona?', 'Was your relative married before to someone else?'),
          why: t('Si pide por su cónyuge, sus datos de matrimonio con usted se copian solos en los Ítems 12–14.', 'If you are filing for your spouse, your marriage details are copied into Items 12–14 for you.'),
          options: yesNo,
        },
        ...priorRows('ben.prior', 'Part 2', 'ben'),
        {
          id: 'ben.location',
          kind: 'choice',
          formRef: 'Part 2 · Item 21',
          question: t('¿Dónde está su familiar ahora?', 'Where is your relative now?'),
          options: [
            { value: 'A', label: t('En Estados Unidos', 'In the United States') },
            { value: 'B', label: t('Fuera de Estados Unidos', 'Outside the United States') },
          ],
        },
        {
          id: 'ben.consulate',
          kind: 'fields',
          formRef: 'Part 2 · Item 21 · City and Country',
          showIf: abroad,
          question: t('¿En qué embajada o consulado de EE.UU. hará el trámite su familiar?', 'At which U.S. Embassy or consulate will your relative apply?'),
          why: t('Es donde su familiar irá a la entrevista para el permiso de viaje. Elija uno en el país donde vive, o el más cercano.', 'It is where your relative will interview for travel authorization. Choose one in the country where they live, or the nearest one.'),
          fields: [text('ben.consulate.place', 'Ciudad y país', 'City and country', 'Part 2 · Item 21 · City and Country', { maxLength: 30, placeholder: 'San Salvador, El Salvador' })],
        },
        {
          id: 'ben.nativeSame',
          kind: 'choice',
          formRef: 'Part 2 · Item 22 · Name and Mailing Address in the Native Language',
          showIf: abroad,
          question: t('En el país donde vive, ¿su nombre y dirección se escriben igual que como los puso arriba?', 'In the country where they live, are their name and address written just as you entered them above?'),
          why: t('Por ejemplo, en países de habla hispana es igual. Si se escriben en otro alfabeto (árabe, chino…), escríbalos a mano en el PDF.', 'For example, in Spanish-speaking countries it is the same. If written in another script (Arabic, Chinese…), write them by hand on the PDF.'),
          options: yesNo,
        },
        {
          id: 'ben.native',
          kind: 'fields',
          formRef: 'Part 2 · Item 22',
          showIf: all(abroad, is('ben.nativeSame', 'no')),
          question: t('Nombre y dirección postal como se escriben en ese país', 'Name and mailing address as written in that country'),
          fields: [...nameFields('ben.native', 'Part 2 · Item 22'), ...anyAddress('ben.native', 'Part 2 · Item 22', { careOf: true })],
        },
        {
          id: 'ben.court',
          kind: 'choice',
          formRef: 'Part 2 · Item 23',
          question: t('¿Cuál de estas describe a su familiar?', 'Which of these describes your relative?'),
          notice: {
            tone: 'legal',
            title: t('Procesos de inmigración', 'Immigration proceedings'),
            body: t('Si su familiar está o estuvo en proceso ante un juez de inmigración, o tiene una orden de deportación, hable con un abogado antes de presentar: puede cambiar cómo se maneja el caso.', 'If your relative is or was in proceedings before an immigration judge, or has a removal order, talk to an attorney before filing: it can change how the case is handled.'),
          },
          options: courtOptions,
        },
        {
          id: 'ben.courtWhere',
          kind: 'fields',
          formRef: 'Part 2 · Item 23.b or 23.d · Where?',
          showIf: is('ben.court', 'B', 'D'),
          question: t('¿En qué corte de inmigración?', 'In which immigration court?'),
          fields: [text('ben.court.where', 'Ciudad y estado de la corte', 'City and state of the court', 'Part 2 · Item 23 · Where?', { placeholder: 'Houston, TX' })],
        },
        {
          id: 'ben.languages',
          kind: 'fields',
          formRef: 'Part 2 · Items 24 and 26',
          question: t('¿Qué idiomas habla su familiar?', 'Which languages does your relative speak?'),
          fields: [
            text('ben.nativeLanguage', 'Idioma natal', 'Native language', 'Part 2 · Item 24', { placeholder: 'Spanish' }),
            text('ben.otherLanguages', 'Otros idiomas que habla con fluidez', 'Other languages spoken fluently', 'Part 2 · Item 26', { required: false }),
          ],
        },
        {
          id: 'ben.english',
          kind: 'choice',
          formRef: 'Part 2 · Item 25',
          question: t('¿Su familiar habla inglés con fluidez?', 'Is your relative fluent in English?'),
          options: yesNo,
        },
        {
          id: 'entry.more0',
          kind: 'choice',
          formRef: 'Part 2 · Items 27–48 · Entries into the United States',
          showIf: beenInUs,
          question: t('¿Puede dar los datos de la entrada más reciente de su familiar a EE.UU.?', 'Can you give the details of your relative’s most recent entry into the U.S.?'),
          why: t('Empiece por la más reciente. Adjunte copia del I-94 y de las páginas del pasaporte con los sellos de entrada y salida.', 'Start with the most recent. Attach a copy of the I-94 and of the passport pages with entry and exit stamps.'),
          options: yesNo,
        },
        ...rows({
          max: 2,
          id: 'entry',
          first: all(beenInUs, is('entry.more0', 'yes')),
          question: (i) => (i === 1 ? t('La entrada más reciente', 'The most recent entry') : t('La entrada anterior', 'The entry before that')),
          more: t('¿Hubo otra entrada antes?', 'Was there another entry before that?'),
          formRef: 'Part 2 · Items 27–48',
          fields: (i) => {
            const n = (k: number) => `Part 2 · Item ${(i === 1 ? 27 : 38) + k}`;
            return [
              date(`entry${i}.date`, 'Fecha de llegada', 'Date of arrival', n(0)),
              text(`entry${i}.city`, 'Ciudad de llegada', 'City of arrival', `${n(1)} · City`, { maxLength: 20 }),
              { id: `entry${i}.state`, type: 'state', label: t('Estado', 'State'), formRef: `${n(1)} · State`, placeholder: 'TX' },
              text(`entry${i}.status`, 'Estatus al llegar', 'Status upon arrival', n(2), { placeholder: 'B-2 visitor' }),
              { id: `entry${i}.i94`, type: 'i94', label: t('Número de I-94 (si tiene)', 'I-94 number (if any)'), formRef: n(3) },
              date(`entry${i}.expires`, 'Fecha en que vence el estatus', 'Date status expires', n(4), false, 'date'),
              text(`entry${i}.passport`, 'Número de pasaporte', 'Passport number', n(5), { required: false }),
              date(`entry${i}.passportExpires`, 'Vencimiento del pasaporte', 'Passport expiration date', n(6), false, 'date'),
              text(`entry${i}.passportCountry`, 'País que emitió el pasaporte', 'Country of issuance for passport', n(7), { required: false }),
              text(`entry${i}.travelDoc`, 'Número de documento de viaje (si no es pasaporte)', 'Travel document number (if not a passport)', n(8), { required: false, maxLength: 9 }),
              date(`entry${i}.travelDocExpires`, 'Vencimiento del documento de viaje', 'Travel document expiration date', n(9), false, 'date'),
              text(`entry${i}.travelDocCountry`, 'País que emitió el documento de viaje', 'Country of issuance for travel document', n(10), { required: false }),
            ];
          },
          overflow: t('El formulario tiene espacio para 2 entradas. Si hubo más, escríbalas en una hoja aparte.', 'The form has room for 2 entries. If there were more, list them on a separate sheet.'),
        }),
      ],
    },
    {
      id: 'deadline',
      part: 'Part 3',
      title: t('Plazo de 2 años', 'Two-year filing deadline'),
      questions: [
        {
          id: 'late',
          kind: 'choice',
          formRef: 'Part 3 · Item 1',
          question: t('¿Está presentando esto más de 2 años después de recibir el asilo o de entrar como refugiado/a?', 'Are you filing this more than two years after you were granted asylum or admitted as a refugee?'),
          notice: {
            tone: 'legal',
            title: t('Si ya pasaron 2 años', 'If 2 years have passed'),
            body: t('USCIS solo acepta una petición tardía por razones humanitarias, y usted debe explicar el retraso con pruebas. En ese caso, consulte a un abogado o una organización acreditada antes de presentar.', 'USCIS only accepts a late petition for humanitarian reasons, and you must explain the delay with evidence. In that case, consult an attorney or accredited organization before filing.'),
          },
          options: yesNo,
        },
        {
          id: 'lateExplain',
          kind: 'fields',
          formRef: 'Part 3 · Item 1 · Explanation',
          showIf: is('late', 'yes'),
          question: t('Explique por qué no lo presentó a tiempo', 'Explain why you did not file on time'),
          why: t('Cuente qué pasó y cuándo (por ejemplo, no sabía dónde estaba su familiar, enfermedad, guerra). Adjunte pruebas. Si es largo, sigue en una hoja aparte que se agrega al PDF.', 'Explain what happened and when (for example, you did not know where your relative was, illness, war). Attach evidence. If it is long, it continues on a separate sheet added to the PDF.'),
          fields: [{ id: 'late.explain', type: 'longText', required: true, label: t('Su explicación (en inglés)', 'Your explanation'), formRef: 'Part 3 · Item 1' }],
        },
      ],
    },
    {
      id: 'statement',
      part: 'Part 5',
      title: t('Su declaración', 'Your statement'),
      questions: [
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 5 · Item 1 · Petitioner’s Statement',
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leerá', 'No, an interpreter will read it to me') },
          ],
        },
        {
          id: 'interpreterLanguage',
          kind: 'fields',
          formRef: 'Part 5 · Item 1.b',
          showIf: is('readsEnglish', 'B'),
          question: t('¿En qué idioma se lo leerán?', 'What language will it be read in?'),
          fields: [{ id: 'fluentLanguage', type: 'text', required: true, label: t('Idioma', 'Language'), formRef: 'Part 5 · Item 1.b', placeholder: 'Spanish', maxLength: 30 }],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 5 · Item 2',
          question: t('¿Alguien más (no usted) preparó esta petición?', 'Did someone else prepare this petition for you?'),
          why: t('Si es así, al final le pediremos sus datos para la Parte 8; esa persona la firma a mano.', 'If so, we ask for their details for Part 8 at the end; that person signs it by hand.'),
          options: yesNo,
        },
        {
          id: 'preparerName',
          kind: 'fields',
          formRef: 'Part 5 · Item 2',
          showIf: is('preparer', 'yes'),
          question: t('¿Quién la preparó?', 'Who prepared it?'),
          fields: [{ id: 'preparer.name', type: 'text', required: true, label: t('Nombre del preparador', 'Preparer’s name'), formRef: 'Part 5 · Item 2', maxLength: 40 }],
        },
      ],
    },
    assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 7', preparerPart: 'Part 8' }),
  ],
};
