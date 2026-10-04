import type { FormDefinition } from './types';
import type { T } from '../i18n';
import { anyAddress, date, is, nameFields, rows, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';

// Questions follow USCIS Form I-865, Sponsor's Notice of Change of Address, edition 11/10/20.
// The PDF mapping lives in src/pdf/i865Pdf.ts.
// Out of scope (left blank, completed by hand): Part 3, Item 6 (signature and date), the
// interpreter's and preparer's signatures and dates (Parts 4 and 5; the rest of those parts comes
// from the last section), and the USCIS-only boxes. The form has no box for the old
// address: when the sponsor gives it, it goes to Part 6 so USCIS can match the sponsor's file.
// Answer ids follow Form I-864 (name.*, dob, home.*, mailing.*, mailingSame, principal.*, member*).

export const I865_EDITION = '11/10/20';

const t = (es: string, en: string): T => ({ es, en });

const short = <F extends { id: string }>(f: F) => ({ ...f, maxLength: f.id.endsWith('family') ? 30 : 18 });

export const i865: FormDefinition = {
  id: 'i-865',
  number: 'I-865',
  edition: I865_EDITION,
  title: t('Aviso de cambio de dirección del patrocinador', "Sponsor's Notice of Change of Address"),
  summary: {
    es: 'Si firmó un I-864 (declaración de patrocinio) y se mudó, avise a USCIS su nueva dirección dentro de 30 días.',
    en: 'If you signed Form I-864 (Affidavit of Support) and moved, tell USCIS your new address within 30 days.',
  },
  intro: {
    es: 'Quien firmó un I-864 (o I-864EZ) como patrocinador debe avisar a USCIS cada vez que cambia de dirección, dentro de los 30 días después de mudarse, mientras dure su obligación de apoyo. Si no lo hace, puede recibir una multa de $250 a $2,000 (o hasta $5,000 si sabía que el inmigrante recibió beneficios públicos). Un solo aviso sirve para todas las personas que usted patrocina. No hay tarifa.',
    en: 'Anyone who signed Form I-864 (or I-864EZ) as a sponsor must tell USCIS each time they move, within 30 days after moving, for as long as the support obligation lasts. Failing to do so can bring a fine of $250 to $2,000 (or up to $5,000 if you knew the immigrant received public benefits). One notice covers everyone you sponsor. There is no fee.',
  },
  minutes: 10,
  pdf: {
    path: 'forms/i-865.pdf',
    fileName: 'I-865-filled.pdf',
    load: () => import('../pdf/i865Pdf').then((m) => m.fillI865),
    signHere: { es: 'Parte 3, Ítem 6', en: 'Part 3, Item 6' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-865 que la edición {edition} sigue vigente y revise allí la dirección a donde se envía.',
      'Envíelo dentro de los 30 días después de su mudanza. No hay tarifa ni hace falta adjuntar documentos.',
      'Imprima el PDF y firme la Parte 3, Ítem 6, a mano con tinta negra, con la fecha. Si un intérprete o preparador le ayudó, ellos firman y fechan a mano las Partes 4 y 5.',
      'Guarde una copia y envíelo por un servicio con número de rastreo. Si se vuelve a mudar, presente un nuevo I-865.',
    ],
    en: [
      'Check at uscis.gov/i-865 that edition {edition} is still current, and find the mailing address there.',
      'Send it within 30 days after you move. There is no fee and no documents are needed.',
      'Print the PDF and sign Part 3, Item 6, by hand in black ink, with the date. If an interpreter or preparer helped you, they sign and date Parts 4 and 5 by hand.',
      'Keep a copy and mail it with tracking. If you move again, file a new Form I-865.',
    ],
  },
  sections: [
    {
      id: 'sponsor',
      part: 'Part 1',
      title: t('Sobre usted (patrocinador)', 'About you (sponsor)'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 1 · Items 1.a–1.c · Your Full Name',
          question: t('¿Cuál es su nombre completo?', 'What is your full name?'),
          why: t('Use el mismo nombre con el que firmó el I-864.', 'Use the same name you signed Form I-864 with.'),
          notice: {
            tone: 'info',
            title: { es: 'Tiene 30 días', en: 'You have 30 days' },
            body: {
              es: 'La ley pide que avise su nueva dirección dentro de los 30 días después de mudarse. Si ya pasaron, preséntelo de todos modos lo antes posible.',
              en: 'The law requires you to report your new address within 30 days after moving. If that time has passed, file it anyway as soon as you can.',
            },
          },
          fields: nameFields('name', 'Part 1 · Item 1').map(short),
        },
        {
          id: 'about',
          kind: 'fields',
          formRef: 'Part 1 · Item 2 · Other Information',
          question: t('Su fecha de nacimiento', 'Your date of birth'),
          fields: [date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 2 · Date of Birth')],
        },
        {
          id: 'home',
          kind: 'fields',
          formRef: 'Part 1 · Items 3.a–3.h · Your New Physical Address',
          question: t('¿Cuál es su nueva dirección, donde vive ahora?', 'What is your new physical address, where you live now?'),
          fields: anyAddress('home', 'Part 1 · Item 3').map((f) => (f.id === 'home.street' ? { ...f, maxLength: 25 } : f)),
        },
        {
          id: 'moveDateQ',
          kind: 'fields',
          formRef: 'Part 1 · Item 4 · Effective Date of Change of Address',
          question: t('¿Desde qué fecha vive ahí?', 'Since what date do you live there?'),
          why: t('Es la fecha de su mudanza. Tiene 30 días desde esa fecha para enviar este aviso.', 'It is the date you moved. You have 30 days from that date to send this notice.'),
          fields: [date('moveDate', 'Fecha de la mudanza', 'Date of the move', 'Part 1 · Item 4', true, 'date')],
        },
        {
          id: 'mailingSame',
          kind: 'choice',
          formRef: 'Part 1 · Item 5 · Is your new physical address the same as your new mailing address?',
          question: t('¿Recibe su correo en esa misma dirección?', 'Do you get your mail at that same address?'),
          options: yesNo,
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 1 · Items 6.a–6.i · Your New Mailing Address',
          showIf: is('mailingSame', 'no'),
          question: t('¿A qué dirección le llega el correo?', 'Where do you get your mail?'),
          fields: anyAddress('mailing', 'Part 1 · Item 6', { careOf: true }).map((f) => (f.id === 'mailing.street' ? { ...f, maxLength: 25 } : f)),
        },
        {
          id: 'mailingDateQ',
          kind: 'fields',
          formRef: 'Part 1 · Item 7 · Effective Date of Change of Address',
          showIf: is('mailingSame', 'no'),
          question: t('¿Desde qué fecha recibe correo en esa dirección?', 'Since what date do you get mail at that address?'),
          fields: [date('mailing.since', 'Fecha', 'Date', 'Part 1 · Item 7', true, 'date')],
        },
        {
          id: 'oldAddress',
          kind: 'choice',
          formRef: 'Part 6 · Additional Information',
          question: t('¿Quiere incluir la dirección donde vivía antes?', 'Do you want to include the address where you lived before?'),
          why: t(
            'El formulario no la pide, pero ponerla en la Parte 6 ayuda a USCIS a encontrar su expediente del I-864.',
            'The form does not ask for it, but adding it in Part 6 helps USCIS find your I-864 file.',
          ),
          options: yesNo,
        },
        {
          id: 'previous',
          kind: 'fields',
          formRef: 'Part 6 · Additional Information · Previous Address',
          showIf: is('oldAddress', 'yes'),
          question: t('¿Cuál era su dirección anterior?', 'What was your previous address?'),
          fields: anyAddress('previous', 'Part 6 · Previous Address'),
        },
      ],
    },
    {
      id: 'sponsored',
      part: 'Part 2',
      title: t('Las personas que patrocina', 'The people you sponsor'),
      questions: [
        {
          id: 'principal.name',
          kind: 'fields',
          formRef: 'Part 2 · Items 1.a–2 · Sponsored Immigrant 1',
          question: t('¿A quién patrocina? (primera persona)', 'Who are you sponsoring? (first person)'),
          why: t(
            'Ponga a cada persona incluida en el I-864 que firmó: el inmigrante principal y los familiares que inmigraron con él.',
            'List each person covered by the I-864 you signed: the principal immigrant and the family members who immigrated with them.',
          ),
          fields: [
            ...nameFields('principal', 'Part 2 · Item 1').map(short),
            { id: 'principal.aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 2 · Item 2 · A-Number', hint: t('Está en su tarjeta de residente (green card).', 'It is on their green card.') },
          ],
        },
        {
          id: 'member.more0',
          kind: 'choice',
          formRef: 'Part 2 · Items 3.a–8',
          question: t('¿Patrocina a otra persona más en ese I-864?', 'Are you sponsoring anyone else on that I-864?'),
          options: yesNo,
        },
        ...rows({
          max: 7,
          id: 'member',
          first: is('member.more0', 'yes'),
          question: (i) => t(`Otra persona que patrocina (${i + 1}.ª)`, `Another person you sponsor (#${i + 1})`),
          more: t('¿Patrocina a otra persona más?', 'Are you sponsoring another person?'),
          formRef: 'Part 2 · Sponsored Immigrants 2–4',
          fields: (i) => {
            const ref = i <= 3 ? `Part 2 · Sponsored Immigrant ${i + 1}` : `Part 6 · Sponsored Immigrant ${i + 1}`;
            return [
              ...nameFields(`member${i}`, ref).map(short),
              { id: `member${i}.aNumber`, type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: `${ref} · A-Number` },
            ];
          },
          overflow: {
            es: 'El formulario tiene espacio para 4 personas; la app pone las demás en la Parte 6. Si son más de 8, escríbalas a mano en una hoja aparte.',
            en: 'The form has room for 4 people; the app puts the rest in Part 6. If there are more than 8, write them by hand on a separate sheet.',
          },
        }),
      ],
    },
    {
      id: 'statement',
      part: 'Part 3',
      title: t('Declaración y contacto', 'Statement and contact'),
      questions: [
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 3 · Item 1 · Sponsor’s Statement',
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leerá', 'No, an interpreter will read it to me') },
          ],
        },
        {
          id: 'interpreterLanguage',
          kind: 'fields',
          formRef: 'Part 3 · Item 1.b',
          showIf: is('readsEnglish', 'B'),
          question: t('¿En qué idioma se lo leerán?', 'What language will it be read to you in?'),
          fields: [{ id: 'fluentLanguage', type: 'text', required: true, label: { es: 'Idioma', en: 'Language' }, formRef: 'Part 3 · Item 1.b', placeholder: 'Spanish' }],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 3 · Item 2',
          question: t('¿Alguien más (no usted) le preparó este aviso?', 'Did someone else prepare this notice for you?'),
          why: t('Si es así, esa persona también firma y fecha la Parte 5 a mano.', 'If so, that person also signs and dates Part 5 by hand.'),
          options: yesNo,
        },
        {
          id: 'preparerName',
          kind: 'fields',
          formRef: 'Part 3 · Item 2',
          showIf: is('preparer', 'yes'),
          question: t('¿Quién lo preparó?', 'Who prepared it?'),
          // Whether they are an attorney (Item 2's "is / is not") comes from the preparer's statement.
          fields: [{ id: 'preparer.name', type: 'text', required: true, label: { es: 'Nombre del preparador', en: 'Preparer’s name' }, formRef: 'Part 3 · Item 2', maxLength: 40 }],
        },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 3 · Items 3–5 · Sponsor’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 3 · Item 3', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 3 · Item 4' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 3 · Item 5', maxLength: 38 },
          ],
        },
      ],
    },
    assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 4', preparerPart: 'Part 5' }),
  ],
};
