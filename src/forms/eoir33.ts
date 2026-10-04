import type { Field, FormDefinition, Option } from './types';
import type { T } from '../i18n';
import { anyAddress, is, nameFields, yesNo } from './helpers';
import { EOIR_COURTS } from './eoir33Courts';

// Questions follow Form EOIR-33/IC, Change of Address/Contact Information Form, Immigration Court
// (Executive Office for Immigration Review, Department of Justice), Rev. Feb. 2026. It is not a
// USCIS form. The PDF mapping lives in src/pdf/eoir33Pdf.ts.
//
// The form has no parts or item numbers: formRefs use its printed headings. It has no interpreter's
// or preparer's part and no additional-information space, so there is no "Who helped you" section.
//
// Out of scope (left for hand):
// - Both signatures, the date next to the declaration and the date of service in the Proof of Service.
// - The "No service needed" box, which is only for ECAS-registered users (attorneys and accredited
//   representatives) who filed through the ECAS Case Portal.

/** The revision printed at the bottom of each page ("Rev. Feb. 2026"); the form has no day. */
export const EOIR33_EDITION = 'Feb. 2026';

const t = (es: string, en: string): T => ({ es, en });

const COURT_OPTIONS: Option[] = [
  ...Object.keys(EOIR_COURTS).map((name) => ({ value: name, label: { es: name, en: name } })),
  { value: 'other', label: t('Mi corte no está en la lista', 'My court is not on the list') },
];

/** Street with apartment, then city, state and ZIP: the two address lines this form prints. */
const address = (prefix: string, ref: string, required: boolean): Field[] =>
  anyAddress(prefix, ref).map((f) => ({
    ...f,
    required: required && (f.required ?? false),
    formRef: f.formRef.replace(' · Street Number and Name', ' · Number; Street').replace(' · Apt. / Ste. / Flr.', ' · Apartment (if any)').replace(/ · (City or Town|State|ZIP Code|Province|Postal Code|Country)$/, ' · City, State, and ZIP code; Country (if other than U.S.)'),
  }));

const LEGAL_NOTICE = {
  tone: 'legal' as const,
  title: t('Si no recibe las cartas de la corte, le pueden ordenar la deportación', 'If you miss the court’s letters, you can be ordered removed'),
  body: t(
    'La corte de inmigración le manda las fechas de sus audiencias por correo, a la última dirección que usted le dio en este formulario. Si no va a una audiencia porque la carta llegó a su dirección anterior, el juez puede ordenar su deportación sin usted, y eso le puede quitar la posibilidad de pedir otros beneficios por años. Cambiar la dirección con USCIS (formulario AR-11 o en línea) NO cambia la dirección en la corte: hay que mandar este EOIR-33. Su caso es un proceso legal: le recomendamos hablar con un abogado de inmigración o una organización acreditada. Si ya tiene abogado, avísele de su mudanza; muchas veces él o ella presenta este formulario.',
    'The immigration court mails your hearing dates to the last address you gave it on this form. If you miss a hearing because the letter went to your old address, the judge can order you removed in your absence, and that can keep you from asking for other relief for years. Changing your address with USCIS (Form AR-11 or online) does NOT change it with the court: you must send this EOIR-33. Your case is a legal proceeding: we recommend you talk to an immigration attorney or an accredited organization. If you already have an attorney, tell them you moved; they often file this form.',
  ),
};

export const eoir33: FormDefinition = {
  id: 'eoir-33',
  number: 'EOIR-33/IC',
  edition: EOIR33_EDITION,
  title: t('Cambio de dirección para la corte de inmigración', 'Change of address for the immigration court'),
  summary: {
    es: 'Si tiene un caso en corte de inmigración, avise a la corte su nueva dirección o teléfono dentro de 5 días hábiles.',
    en: 'If you have a case in immigration court, tell the court your new address or phone within 5 working days.',
  },
  intro: {
    es: 'El EOIR-33/IC le dice a la corte de inmigración donde está su caso que usted tiene una nueva dirección, teléfono o correo electrónico. Hay que mandarlo dentro de 5 días hábiles después del cambio, porque la corte le enviará sus citas y decisiones solo a la dirección que tenga en este formulario. Se manda a la corte donde está su caso, y una copia a la oficina de abogados de ICE (DHS). Es un formulario del Departamento de Justicia, no de USCIS: el AR-11 o el cambio de dirección en línea de USCIS NO avisan a la corte. Cada persona con caso en la corte manda su propio formulario. No tiene costo.',
    en: 'Form EOIR-33/IC tells the immigration court where your case is that you have a new address, phone or email. It must be filed within 5 working days of the change, because the court sends your hearing notices and decisions only to the address it has from this form. It goes to the court where your case is, with a copy to ICE’s attorneys (DHS). It is a Department of Justice form, not a USCIS form: Form AR-11 or USCIS’s online address change does NOT tell the court. Each person with a case in court files their own form. There is no fee.',
  },
  minutes: 10,
  pdf: {
    path: 'forms/eoir-33.pdf',
    fileName: 'EOIR-33-IC-filled.pdf',
    load: () => import('../pdf/eoir33Pdf').then((m) => m.fillEOIR33),
    signHere: { es: 'los dos recuadros "SIGN HERE" de la página 1', en: 'both "SIGN HERE" boxes on page 1' },
  },
  nextSteps: {
    es: [
      'Confirme en justice.gov/eoir/eoir-forms que la versión del formulario (Rev. {edition}) sigue vigente. No tiene costo.',
      'Imprima el PDF. Firme a mano los dos recuadros "SIGN HERE" de la página 1 (la declaración y la constancia de entrega, "Proof of Service") y escriba la fecha junto a la primera firma y la fecha en que entrega la copia a DHS.',
      'Mande una copia a la oficina de abogados de ICE (Office of the Principal Legal Advisor, OPLA) de la forma que marcó: por el portal eService de ICE (eserviceregistration.ice.gov) o por correo o en persona a la oficina de OPLA de su zona (ice.gov/contact/legal). Si no lo hace, la corte puede rechazar el formulario.',
      'Mande el original a la corte de inmigración donde está su caso dentro de 5 días hábiles del cambio. Por correo: doble la página 2 por las líneas "Fold Here" para que se vea la dirección de la corte, ciérrela con grapa en "Fasten Here" y póngale estampilla. Confirme la dirección en justice.gov/eoir/find-immigration-court-and-access-internet-based-hearings. También puede presentarlo en persona en la corte.',
      'Otra opción: hacer el cambio en línea en el Respondent Portal (respondentaccess.eoir.justice.gov). Si tiene abogado, avísele: él o ella puede presentarlo por el portal ECAS.',
      'Si alguien de su familia también tiene caso en la corte, cada persona necesita su propio EOIR-33. Guarde copias de todo y la prueba del envío.',
      'Avise también a USCIS (formulario AR-11 o uscis.gov/addresschange): son avisos separados.',
    ],
    en: [
      'Check at justice.gov/eoir/eoir-forms that this version of the form (Rev. {edition}) is still current. There is no fee.',
      'Print the PDF. Sign both "SIGN HERE" boxes on page 1 by hand (the declaration and the Proof of Service), and write the date next to the first signature and the date you give the copy to DHS.',
      'Give a copy to ICE’s Office of the Principal Legal Advisor (OPLA) the way you marked: through ICE’s eService portal (eserviceregistration.ice.gov), or by mail or in person at your area’s OPLA office (ice.gov/contact/legal). If you don’t, the court may reject the form.',
      'Send the original to the immigration court where your case is within 5 working days of the change. By mail: fold page 2 along the "Fold Here" lines so the court’s address shows, staple it at "Fasten Here" and add a stamp. Check the address at justice.gov/eoir/find-immigration-court-and-access-internet-based-hearings. You can also file it in person at the court.',
      'Another option: make the change online in the Respondent Portal (respondentaccess.eoir.justice.gov). If you have an attorney, tell them: they can file it through ECAS.',
      'If a family member also has a case in court, each person needs their own EOIR-33. Keep copies of everything and proof of sending.',
      'Also tell USCIS (Form AR-11 or uscis.gov/addresschange): they are separate notices.',
    ],
  },
  sections: [
    {
      id: 'you',
      part: 'Name and A-Number',
      title: t('Sus datos', 'About you'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Name – Last, First, Middle, Suffix',
          notice: LEGAL_NOTICE,
          question: t('¿Cuál es su nombre completo?', 'What is your full name?'),
          why: t('Escríbalo como aparece en los papeles de la corte (por ejemplo, la Notificación de Comparecencia).', 'Write it as it appears on your court papers (for example, the Notice to Appear).'),
          fields: [
            ...nameFields('name', 'Name'),
            { id: 'name.suffix', type: 'text', label: t('Sufijo (si tiene, por ejemplo Jr.)', 'Suffix (if any, e.g. Jr.)'), formRef: 'Name · Suffix (if applicable)', maxLength: 5 },
          ],
        },
        {
          id: 'ids',
          kind: 'fields',
          formRef: 'A-Number',
          question: t('¿Cuál es su A-Number?', 'What is your A-Number?'),
          why: t(
            'Está en la Notificación de Comparecencia (Notice to Appear) y en las cartas de la corte. Lo puede confirmar en acis.eoir.justice.gov o llamando al 1-800-898-7180.',
            'It is on your Notice to Appear and on the court’s letters. You can check it at acis.eoir.justice.gov or by calling 1-800-898-7180.',
          ),
          fields: [{ id: 'aNumber', type: 'aNumber', required: true, label: { es: 'A-Number', en: 'A-Number' }, formRef: 'A-Number' }],
        },
        {
          id: 'courtScreen',
          kind: 'fields',
          formRef: 'Page 2 · Immigration Court (mailing address)',
          question: t('¿En qué corte de inmigración está su caso?', 'Which immigration court is your case in?'),
          why: t(
            'Aparece en su última cita o carta de la corte. Si no está seguro/a, búsquelo en acis.eoir.justice.gov o llame al 1-800-898-7180. El formulario se manda a esa corte, aunque usted se haya mudado a otro estado.',
            'It is on your latest hearing notice or court letter. If you are not sure, look it up at acis.eoir.justice.gov or call 1-800-898-7180. The form goes to that court, even if you moved to another state.',
          ),
          fields: [{ id: 'court', type: 'select', required: true, label: t('Corte de inmigración', 'Immigration court'), formRef: 'Page 2 · Select Immigration Court', options: COURT_OPTIONS }],
        },
        {
          id: 'courtOther',
          kind: 'fields',
          formRef: 'Page 2 · Immigration Court (mailing address)',
          showIf: is('court', 'other'),
          question: t('¿Cuál es la dirección de su corte?', 'What is your court’s address?'),
          why: t(
            'Cópiela de la página de cortes de inmigración (justice.gov/eoir/find-immigration-court-and-access-internet-based-hearings) o de su última carta de la corte.',
            'Copy it from the immigration court list (justice.gov/eoir/find-immigration-court-and-access-internet-based-hearings) or from your latest court letter.',
          ),
          fields: [
            { id: 'courtOther.line1', type: 'text', required: true, label: t('Número y calle', 'Number and street'), formRef: 'Page 2 · Immigration Court address · Line 1', maxLength: 34 },
            { id: 'courtOther.line2', type: 'text', label: t('Suite o piso (si hay)', 'Suite or floor (if any)'), formRef: 'Page 2 · Immigration Court address · Line 2', maxLength: 34 },
            { id: 'courtOther.line3', type: 'text', required: true, label: t('Ciudad, estado y código postal', 'City, state and ZIP code'), formRef: 'Page 2 · Immigration Court address · Line 3', maxLength: 34, placeholder: 'Miami, FL 33130' },
          ],
        },
      ],
    },
    {
      id: 'addresses',
      part: 'Former and Current Address',
      title: t('Su dirección anterior y la nueva', 'Your old and new address'),
      questions: [
        {
          id: 'present',
          kind: 'fields',
          formRef: 'My CURRENT address and phone number are',
          question: t('¿Cuál es su dirección actual?', 'What is your current address?'),
          why: t(
            'Aquí le llegarán todas las cartas de la corte, así que debe ser un lugar donde usted reciba correo con seguridad.',
            'All of the court’s letters will come here, so it must be a place where you reliably get mail.',
          ),
          fields: address('present', 'CURRENT address', true),
        },
        {
          id: 'presentContact',
          kind: 'fields',
          formRef: 'My CURRENT address and phone number are · Phone Number, Email Address',
          question: t('¿Su teléfono y correo electrónico actuales?', 'Your current phone and email?'),
          why: t('Escriba el número donde la corte o su abogado le puedan llamar.', 'Enter a number where the court or your attorney can reach you.'),
          fields: [
            { id: 'phone', type: 'phone', label: t('Teléfono', 'Phone number'), formRef: 'CURRENT · Phone Number' },
            { id: 'email', type: 'email', label: t('Correo electrónico (si tiene)', 'Email address (if any)'), formRef: 'CURRENT · Email Address' },
          ],
        },
        {
          id: 'previousHas',
          kind: 'choice',
          formRef: 'My FORMER address and phone number were',
          question: t('¿Cambió su dirección (se mudó)?', 'Did your address change (did you move)?'),
          why: t('Si solo cambió su teléfono o su correo, conteste No.', 'If only your phone or email changed, answer No.'),
          options: yesNo,
        },
        {
          id: 'previous',
          kind: 'fields',
          formRef: 'My FORMER address and phone number were',
          showIf: is('previousHas', 'yes'),
          question: t('¿Cuál era su dirección anterior?', 'What was your former address?'),
          why: t('La que la corte tenía antes, por ejemplo la que aparece en sus cartas de la corte.', 'The one the court had before, for example the one on your court letters.'),
          fields: address('previous', 'FORMER address', true),
        },
        {
          id: 'previousContact',
          kind: 'fields',
          formRef: 'My FORMER address and phone number were · Phone Number, Email Address',
          question: t('¿Su teléfono y correo electrónico anteriores?', 'Your former phone and email?'),
          why: t('Déjelos vacíos si no cambiaron.', 'Leave them blank if they did not change.'),
          fields: [
            { id: 'previous.phone', type: 'phone', label: t('Teléfono anterior', 'Former phone number'), formRef: 'FORMER · Phone Number' },
            { id: 'previous.email', type: 'email', label: t('Correo electrónico anterior', 'Former email address'), formRef: 'FORMER · Email Address' },
          ],
        },
      ],
    },
    {
      id: 'service',
      part: 'Proof of Service',
      title: t('La copia para DHS (ICE)', 'The copy for DHS (ICE)'),
      questions: [
        {
          id: 'serviceBy',
          kind: 'choice',
          formRef: 'Proof of Service · Name',
          notice: {
            tone: 'info',
            title: t('Hay que dar una copia a los abogados de ICE', 'A copy must go to ICE’s attorneys'),
            body: t(
              'En la corte, el gobierno (DHS) es la otra parte de su caso y lo representa la oficina de abogados de ICE (Office of the Principal Legal Advisor, OPLA). Usted debe darle una copia de este formulario y decir en la "Proof of Service" cómo lo hizo.',
              'In court, the government (DHS) is the other party in your case, represented by ICE’s Office of the Principal Legal Advisor (OPLA). You must give it a copy of this form and say in the Proof of Service how you did it.',
            ),
          },
          question: t('¿Quién va a entregar la copia a ICE?', 'Who will give the copy to ICE?'),
          options: [
            { value: 'self', label: t('Yo', 'I will') },
            { value: 'other', label: t('Otra persona (por ejemplo, mi abogado)', 'Someone else (for example, my attorney)') },
          ],
        },
        {
          id: 'serviceNameScreen',
          kind: 'fields',
          formRef: 'Proof of Service · Name',
          showIf: is('serviceBy', 'other'),
          question: t('¿Cómo se llama la persona que entrega la copia?', 'What is the name of the person giving the copy?'),
          fields: [{ id: 'serviceName', type: 'text', required: true, label: t('Nombre completo', 'Full name'), formRef: 'Proof of Service · Name', maxLength: 30 }],
        },
        {
          id: 'serviceMethod',
          kind: 'choice',
          formRef: 'Proof of Service · Electronic, mail or in-person service',
          question: t('¿Cómo va a entregar la copia a ICE?', 'How will you give the copy to ICE?'),
          why: t(
            'Por internet, en el portal eService de ICE (hay que registrarse en eserviceregistration.ice.gov), o por correo o en persona en la oficina de OPLA de su zona (ice.gov/contact/legal).',
            'Online, through ICE’s eService portal (register at eserviceregistration.ice.gov), or by mail or in person at your area’s OPLA office (ice.gov/contact/legal).',
          ),
          options: [
            { value: 'electronic', label: t('Por internet (portal eService de ICE)', 'Online (ICE eService portal)') },
            { value: 'mail', label: t('Por correo', 'By mail') },
            { value: 'inPerson', label: t('En persona', 'In person') },
          ],
        },
        {
          id: 'oplaScreen',
          kind: 'fields',
          formRef: 'Proof of Service · Number and Street, City, State, ZIP Code',
          showIf: is('serviceMethod', 'mail', 'inPerson'),
          question: t('¿Cuál es la dirección de la oficina de OPLA?', 'What is the OPLA office’s address?'),
          why: t(
            'Búsquela en ice.gov/contact/legal: es la oficina que corresponde a su corte de inmigración.',
            'Look it up at ice.gov/contact/legal: it is the office for your immigration court.',
          ),
          fields: [{ id: 'oplaAddress', type: 'text', required: true, label: t('Número y calle, ciudad, estado y código postal', 'Number and street, city, state and ZIP code'), formRef: 'Proof of Service · Number and Street, City, State, ZIP Code', maxLength: 90, placeholder: '333 S. Miami Ave., Suite 200, Miami, FL 33130' }],
        },
      ],
    },
  ],
};
