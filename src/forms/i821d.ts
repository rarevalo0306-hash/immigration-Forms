import type { Field, FormDefinition, YesNoItem } from './types';
import type { T } from '../i18n';
import { all, biographic, date, is, nameFields, rows, sexField, yesNo } from './helpers';

// Questions follow USCIS Form I-821D, Consideration of Deferred Action for Childhood Arrivals,
// edition 01/20/25. The PDF mapping lives in src/pdf/i821dPdf.ts.

export const I821D_EDITION = '01/20/25';

const t = (es: string, en: string): T => ({ es, en });

const isInitial = is('requestType', 'initial');

/** A U.S. address: this edition's addresses have no province or country. */
const usAddress = (prefix: string, ref: string, careOf = false): Field[] => [
  ...(careOf ? [{ id: `${prefix}.careOf`, type: 'text', label: { es: 'A cargo de (si recibe correo en casa de otra persona)', en: 'In care of' }, formRef: `${ref} · In Care Of Name`, maxLength: 34 } as Field] : []),
  { id: `${prefix}.street`, type: 'text', required: true, label: { es: 'Número y calle', en: 'Street number and name' }, formRef: `${ref} · Street Number and Name`, maxLength: 34, placeholder: '1234 Main St' },
  { id: `${prefix}.unit`, type: 'unit', label: { es: 'Apartamento, suite o piso', en: 'Apt., suite or floor' }, formRef: `${ref} · Apt. Ste. Flr.`, placeholder: 'Apt 4B' },
  { id: `${prefix}.city`, type: 'text', required: true, label: { es: 'Ciudad', en: 'City or town' }, formRef: `${ref} · City or Town`, maxLength: 20 },
  { id: `${prefix}.state`, type: 'state', required: true, label: { es: 'Estado', en: 'State' }, formRef: `${ref} · State`, placeholder: 'CA' },
  { id: `${prefix}.zip`, type: 'zip', required: true, label: { es: 'Código postal', en: 'ZIP code' }, formRef: `${ref} · ZIP Code` },
];

/** Part 4, Items 1-7. */
export const SAFETY_ITEMS: YesNoItem[] = [
  { id: 'p4.1', formRef: 'Part 4 · Item 1', label: t('¿Alguna vez lo arrestaron, acusaron o condenaron por un delito grave o menor en EE.UU., incluso en una corte juvenil? (No cuente multas de tránsito, salvo si hubo alcohol o drogas.)', 'Have you EVER been arrested for, charged with, or convicted of a felony or misdemeanor in the U.S., including juvenile court? (Not minor traffic violations unless alcohol- or drug-related.)') },
  { id: 'p4.2', formRef: 'Part 4 · Item 2', label: t('¿…por un delito en otro país?', '…a crime in any country other than the U.S.?') },
  { id: 'p4.3', formRef: 'Part 4 · Item 3', label: t('¿Ha participado, participa o piensa participar en actividades terroristas?', 'Have you EVER engaged in, or do you plan to engage in, terrorist activities?') },
  { id: 'p4.4', formRef: 'Part 4 · Item 4', label: t('¿Es o ha sido miembro de una pandilla?', 'Are you NOW or have you EVER been a gang member?') },
  { id: 'p4.5a', formRef: 'Part 4 · Item 5.a', label: t('¿Ha participado en tortura, genocidio o trata de personas?', 'Have you EVER participated in torture, genocide or human trafficking?') },
  { id: 'p4.5b', formRef: 'Part 4 · Item 5.b', label: t('¿…en matar a alguien?', '…killing any person?') },
  { id: 'p4.5c', formRef: 'Part 4 · Item 5.c', label: t('¿…en herir gravemente a alguien?', '…severely injuring any person?') },
  { id: 'p4.5d', formRef: 'Part 4 · Item 5.d', label: t('¿…en contacto sexual con alguien obligado o amenazado?', '…sexual contact with any person who was forced or threatened?') },
  { id: 'p4.6', formRef: 'Part 4 · Item 6', label: t('¿Ha reclutado o usado a menores de 15 años en un grupo armado?', 'Have you EVER recruited or used anyone under 15 to serve in an armed force or group?') },
  { id: 'p4.7', formRef: 'Part 4 · Item 7', label: t('¿Ha usado a menores de 15 años en combates?', 'Have you EVER used anyone under 15 to take part in hostilities?') },
];

const anySafetyYes = (a: Record<string, unknown>) => SAFETY_ITEMS.some((i) => a[i.id] === 'yes');

export const i821d: FormDefinition = {
  id: 'i-821d',
  number: 'I-821D',
  edition: I821D_EDITION,
  title: t('DACA (Acción Diferida para los Llegados en la Infancia)', 'DACA (Deferred Action for Childhood Arrivals)'),
  summary: {
    es: 'Renueve su DACA (o pida DACA por primera vez). Se presenta junto con el I-765 para el permiso de trabajo.',
    en: 'Renew your DACA (or request it for the first time). Filed together with Form I-765 for the work permit.',
  },
  intro: {
    es: 'Con el I-821D pide (o renueva) la acción diferida de DACA. Para renovar, preséntelo entre 150 y 120 días antes de que venza su DACA actual. Por los casos en las cortes, las reglas para solicitudes nuevas cambian: revise uscis.gov/daca antes de presentar una solicitud inicial.',
    en: 'With Form I-821D you request (or renew) DACA deferred action. To renew, file between 150 and 120 days before your current DACA expires. Because of court cases, the rules for first-time requests change: check uscis.gov/daca before filing an initial request.',
  },
  minutes: 30,
  pdf: {
    path: 'forms/i-821d.pdf',
    fileName: 'I-821D-filled.pdf',
    load: () => import('../pdf/i821dPdf').then((m) => m.fillI821D),
    signHere: { es: 'Parte 5, Ítem 2.a', en: 'Part 5, Item 2.a' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-821d que la edición {edition} sigue vigente y revise la tarifa; si cambió, use la nueva y copie sus respuestas de esta hoja.',
      'Llene también el I-765 (categoría (c)(33)) y la hoja I-765WS, y envíelos juntos con el I-821D. Puede llenar el I-765 en esta misma app.',
      'Adjunte copia de su permiso de trabajo actual (frente y reverso) y, si contestó Sí en la Parte 4, los documentos de la corte de cada caso.',
      'Imprima el PDF y firme la Parte 5, Ítem 2.a, a mano con tinta negra.',
    ],
    en: [
      'Check at uscis.gov/i-821d that edition {edition} is still current and check the fee; if it changed, use the new one and copy your answers from this sheet.',
      'Also complete Form I-765 (category (c)(33)) and the I-765WS worksheet, and file them together with Form I-821D. You can fill in the I-765 in this same app.',
      'Attach a copy of your current work permit (front and back) and, if you answered Yes in Part 4, the court records for each case.',
      'Print the PDF and sign Part 5, Item 2.a, by hand in black ink.',
    ],
  },
  sections: [
    {
      id: 'request',
      part: 'Part 1',
      title: t('Qué solicita', 'Your request'),
      questions: [
        {
          id: 'requestType',
          kind: 'choice',
          formRef: 'Part 1 · Items 1–2 · I am requesting',
          question: t('¿Renueva su DACA o lo pide por primera vez?', 'Are you renewing DACA or requesting it for the first time?'),
          options: [
            { value: 'renewal', label: t('Renovación: ya tengo o tuve DACA', 'Renewal: I have or had DACA') },
            { value: 'initial', label: t('Solicitud inicial: nunca he tenido DACA', 'Initial request: I have never had DACA') },
          ],
        },
        {
          id: 'renewalExpires',
          kind: 'fields',
          formRef: 'Part 1 · Item 2',
          showIf: is('requestType', 'renewal'),
          question: t('¿Cuándo vence su DACA actual?', 'When does your current DACA expire?'),
          why: t('Está en su permiso de trabajo ("Card Expires"). Si venció hace más de un año, quizá deba presentar una solicitud inicial.', 'It is on your work permit ("Card Expires"). If it expired more than a year ago, you may need to file an initial request.'),
          fields: [date('renewal.expires', 'Fecha de vencimiento', 'Expiration date', 'Part 1 · Item 2 · My most recent period of DACA expires on', true, 'date')],
        },
        {
          id: 'initialNotice',
          kind: 'choice',
          formRef: 'Part 1 · Item 1',
          showIf: isInitial,
          question: t('¿Revisó en uscis.gov/daca si USCIS está decidiendo solicitudes iniciales?', 'Did you check at uscis.gov/daca whether USCIS is deciding initial requests?'),
          notice: {
            tone: 'legal',
            title: { es: 'Consulte antes de presentar', en: 'Check before filing' },
            body: {
              es: 'Por órdenes de las cortes, en algunos periodos USCIS recibe solicitudes iniciales de DACA pero no las decide. Una solicitud inicial también da sus datos a USCIS: hable con un abogado o una organización acreditada antes de presentarla.',
              en: 'Because of court orders, at times USCIS accepts initial DACA requests but does not decide them. An initial request also gives your information to USCIS: talk to an attorney or accredited organization before filing.',
            },
          },
          options: [
            { value: 'yes', label: t('Sí, ya lo revisé', 'Yes, I checked') },
            { value: 'no', label: t('Todavía no; lo revisaré antes de presentar', 'Not yet; I will before filing') },
          ],
        },
        {
          id: 'detention',
          kind: 'choice',
          formRef: 'Part 1 · Immigration detention',
          question: t('¿Está usted detenido/a por inmigración?', 'Are you in immigration detention?'),
          options: [
            { value: 'AMNOT', label: t('No estoy detenido/a', 'I am not in immigration detention') },
            { value: 'AM', label: t('Estoy detenido/a', 'I am in immigration detention') },
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
          id: 'name',
          kind: 'fields',
          formRef: 'Part 1 · Item 3 · Full Legal Name',
          question: t('¿Cuál es su nombre legal completo?', 'What is your full legal name?'),
          fields: nameFields('name', 'Part 1 · Item 3'),
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 1 · Item 4 · U.S. Mailing Address',
          question: t('¿A qué dirección le llega el correo?', 'Where do you get your mail?'),
          why: t('Use la misma dirección en el I-765.', 'Use the same address on Form I-765.'),
          fields: usAddress('mailing', 'Part 1 · Item 4', true),
        },
        {
          id: 'removal',
          kind: 'choice',
          formRef: 'Part 1 · Item 5 · Removal Proceedings Information',
          question: t('¿Está o ha estado en un proceso de deportación, o tiene una orden de deportación de cualquier tipo (por ejemplo, en la frontera)?', 'Are you now or have you ever been in removal proceedings, or do you have a removal order of any kind (for example, at the border)?'),
          options: yesNo,
        },
        {
          id: 'removalStatus',
          kind: 'fields',
          formRef: 'Part 1 · Items 6.a–6.g',
          showIf: is('removal', 'yes'),
          question: t('¿Cómo está ese proceso?', 'What is the status of those proceedings?'),
          notice: { tone: 'legal', title: { es: 'Consulte a un abogado', en: 'Talk to an attorney' }, body: { es: 'Con un proceso o una orden de deportación, un abogado debe revisar su caso antes de presentar.', en: 'With proceedings or a removal order, an attorney should review your case before you file.' } },
          fields: [
            {
              id: 'removal.status',
              type: 'select',
              required: true,
              label: { es: 'Estado o resultado', en: 'Status or outcome' },
              formRef: 'Part 1 · Items 6.a–6.e',
              options: [
                { value: 'Active', label: t('En proceso (activo)', 'Currently in proceedings (active)') },
                { value: 'Closed', label: t('En proceso (cerrado administrativamente)', 'Currently in proceedings (administratively closed)') },
                { value: 'Terminated', label: t('Terminado', 'Terminated') },
                { value: 'FinalOrder', label: t('Con orden final', 'Subject to a final order') },
                { value: 'Other', label: t('Otro', 'Other') },
              ],
            },
            date('removal.date', 'Fecha más reciente del proceso', 'Most recent date of proceedings', 'Part 1 · Item 6.f', false, 'date'),
            { id: 'removal.location', type: 'text', label: { es: 'Lugar del proceso (ciudad y estado de la corte)', en: 'Location of proceedings' }, formRef: 'Part 1 · Item 6.g', maxLength: 38 },
            { id: 'removal.explain', type: 'longText', label: { es: 'Si eligió "Otro", explique (en inglés)', en: 'If "Other", explain' }, formRef: 'Part 8 · Part 1 · Item 6.e' },
          ],
        },
        {
          id: 'details',
          kind: 'fields',
          formRef: 'Part 1 · Items 7–14 · Other Information',
          question: t('Sus datos', 'Your details'),
          fields: [
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene; en su permiso de trabajo como "USCIS#")', en: 'A-Number (if any)' }, formRef: 'Part 1 · Item 7' },
            { id: 'ssn', type: 'ssn', label: { es: 'Número de Seguro Social (si tiene)', en: 'Social Security number (if any)' }, formRef: 'Part 1 · Item 8', placeholder: '123-45-6789' },
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 9'),
            sexField('sex', 'Part 1 · Item 10'),
            { id: 'birthCity', type: 'text', required: true, label: { es: 'Ciudad de nacimiento', en: 'City of birth' }, formRef: 'Part 1 · Item 11.a' },
            { id: 'birthCountry', type: 'text', required: true, label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: 'Part 1 · Item 11.b' },
            { id: 'residence', type: 'text', required: true, label: { es: 'País donde vive ahora', en: 'Current country of residence' }, formRef: 'Part 1 · Item 12', placeholder: 'United States' },
            { id: 'citizenship', type: 'text', required: true, label: { es: 'País de ciudadanía', en: 'Country of citizenship' }, formRef: 'Part 1 · Item 13' },
            {
              id: 'marital',
              type: 'select',
              required: true,
              label: { es: 'Estado civil', en: 'Marital status' },
              formRef: 'Part 1 · Item 14',
              options: [
                { value: 'S', label: t('Soltero/a', 'Single') },
                { value: 'M', label: t('Casado/a', 'Married') },
                { value: 'D', label: t('Divorciado/a', 'Divorced') },
                { value: 'W', label: t('Viudo/a', 'Widowed') },
              ],
            },
          ],
        },
        {
          id: 'otherName.has',
          kind: 'choice',
          formRef: 'Part 1 · Item 15 · Other Names Used',
          question: t('¿Ha usado otros nombres?', 'Have you used other names?'),
          why: t('Si son varios, escriba los demás a mano en la Parte 8.', 'If several, write the rest by hand in Part 8.'),
          options: yesNo,
        },
        {
          id: 'otherName',
          kind: 'fields',
          formRef: 'Part 1 · Item 15',
          showIf: is('otherName.has', 'yes'),
          question: t('Otro nombre que ha usado', 'Another name you have used'),
          fields: nameFields('otherName', 'Part 1 · Item 15'),
        },
        ...biographic('Part 1', 16),
      ],
    },
    {
      id: 'residenceTravel',
      part: 'Part 2',
      title: t('Domicilios y viajes', 'Residence and travel'),
      questions: [
        {
          id: 'continuous',
          kind: 'choice',
          formRef: 'Part 2 · Item 1 · Continuously residing in the U.S. since at least June 15, 2007',
          question: t('¿Ha vivido en EE.UU. sin interrupción desde el 15 de junio de 2007 hasta hoy?', 'Have you lived in the U.S. continuously since at least June 15, 2007, up to now?'),
          why: t('Los viajes cortos y casuales no rompen la residencia continua.', 'Brief, casual trips don’t break continuous residence.'),
          options: yesNo,
        },
        {
          id: 'presentSame',
          kind: 'choice',
          formRef: 'Part 2 · Item 2 · Present Address',
          question: t('¿Vive en su dirección de correo?', 'Do you live at your mailing address?'),
          options: yesNo,
        },
        {
          id: 'present',
          kind: 'fields',
          formRef: 'Part 2 · Item 2 · Present Address',
          showIf: is('presentSame', 'no'),
          question: t('¿Dónde vive?', 'Where do you live?'),
          fields: usAddress('present', 'Part 2 · Item 2'),
        },
        {
          id: 'presentSince',
          kind: 'fields',
          formRef: 'Part 2 · Item 2.a',
          question: t('¿Desde cuándo vive ahí?', 'Since when have you lived there?'),
          fields: [date('present.from', 'Fecha', 'Date from', 'Part 2 · Item 2.a · From')],
        },
        {
          id: 'address.more0',
          kind: 'choice',
          formRef: 'Part 2 · Items 3–5 · Previous Addresses',
          question: (t('¿Vivió en otras direcciones?', 'Did you live at other addresses?')),
          why: t(
            'Para renovar: solo desde que presentó su último I-821D aprobado. Para la solicitud inicial: desde que llegó a EE.UU., lo mejor que recuerde.',
            'For a renewal: only since you filed your last approved I-821D. For an initial request: since you arrived in the U.S., as best you can.',
          ),
          options: yesNo,
        },
        ...rows({
          max: 3,
          id: 'address',
          first: is('address.more0', 'yes'),
          question: (i) => (i === 1 ? t('La dirección anterior', 'The previous address') : t('Otra dirección anterior', 'Another previous address')),
          more: t('¿Vivió en otra dirección antes de esa?', 'Did you live at another address before that?'),
          formRef: 'Part 2 · Items 3–5',
          fields: (i) => [date(`address${i}.from`, 'Desde', 'From', `Part 2 · Address ${i} · From`), date(`address${i}.to`, 'Hasta', 'To', `Part 2 · Address ${i} · To`), ...usAddress(`address${i}`, `Part 2 · Address ${i}`)],
          overflow: { es: 'El formulario tiene espacio para 3 direcciones anteriores. Si son más, escríbalas a mano en la Parte 8.', en: 'The form has room for 3 previous addresses. If there are more, write them by hand in Part 8.' },
        }),
        {
          id: 'trip.more0',
          kind: 'choice',
          formRef: 'Part 2 · Items 6–7 · Travel Information',
          question: t('¿Ha salido de EE.UU.?', 'Have you left the U.S.?'),
          why: t('Para renovar: solo desde su último I-821D aprobado. Para la solicitud inicial: desde el 15 de junio de 2007.', 'For a renewal: only since your last approved I-821D. For an initial request: since June 15, 2007.'),
          options: yesNo,
        },
        ...rows({
          max: 2,
          id: 'trip',
          first: is('trip.more0', 'yes'),
          question: (i) => (i === 1 ? t('Su salida', 'Your trip') : t('Otra salida', 'Another trip')),
          more: t('¿Salió otra vez?', 'Did you leave another time?'),
          formRef: 'Part 2 · Items 6–7',
          fields: (i) => [
            date(`trip${i}.departure`, 'Fecha de salida', 'Departure date', `Part 2 · Departure ${i} · Departure Date`),
            date(`trip${i}.return`, 'Fecha de regreso', 'Return date', `Part 2 · Departure ${i} · Return Date`),
            { id: `trip${i}.reason`, type: 'text', required: true, label: { es: 'Motivo (en inglés)', en: 'Reason for departure' }, formRef: `Part 2 · Departure ${i} · Reason`, maxLength: 34, placeholder: 'Visit sick grandmother' },
          ],
          overflow: { es: 'El formulario tiene espacio para 2 salidas. Si son más, escríbalas a mano en la Parte 8.', en: 'The form has room for 2 trips. If there are more, write them by hand in Part 8.' },
        }),
        {
          id: 'leftWithoutAP',
          kind: 'choice',
          formRef: 'Part 2 · Item 8 · Have you left the United States without advance parole on or after August 15, 2012?',
          question: t('¿Ha salido de EE.UU. sin advance parole desde el 15 de agosto de 2012?', 'Have you left the U.S. without advance parole since August 15, 2012?'),
          notice: { tone: 'legal', title: { es: 'Importante', en: 'Important' }, body: { es: 'Salir sin advance parole puede hacerle perder DACA. Si respondió Sí, consulte a un abogado antes de presentar.', en: 'Leaving without advance parole can cost you DACA. If Yes, talk to an attorney before filing.' } },
          options: yesNo,
        },
        {
          id: 'passport',
          kind: 'fields',
          formRef: 'Part 2 · Items 9–10',
          question: t('Su pasaporte', 'Your passport'),
          why: t('Déjelo en blanco si no tiene pasaporte.', 'Leave blank if you have no passport.'),
          fields: [
            { id: 'passport.country', type: 'text', label: { es: 'País que emitió su último pasaporte', en: 'Country that issued your last passport' }, formRef: 'Part 2 · Item 9.a', maxLength: 38 },
            { id: 'passport.number', type: 'text', label: { es: 'Número de pasaporte', en: 'Passport number' }, formRef: 'Part 2 · Item 9.b', maxLength: 20 },
            { id: 'passport.expires', type: 'date', label: { es: 'Vencimiento del pasaporte', en: 'Passport expiration date' }, formRef: 'Part 2 · Item 9.c' },
            { id: 'borderCard', type: 'text', label: { es: 'Número de tarjeta de cruce fronterizo (si tiene)', en: 'Border crossing card number (if any)' }, formRef: 'Part 2 · Item 10', maxLength: 20 },
          ],
        },
      ],
    },
    {
      id: 'initial',
      part: 'Part 3',
      title: t('Solo para la solicitud inicial', 'Initial requests only'),
      questions: [
        {
          id: 'before16',
          kind: 'choice',
          formRef: 'Part 3 · Item 1',
          showIf: isInitial,
          question: t('¿Llegó a vivir a EE.UU. antes de cumplir 16 años?', 'Did you arrive and start living in the U.S. before age 16?'),
          options: yesNo,
        },
        {
          id: 'entry',
          kind: 'fields',
          formRef: 'Part 3 · Items 2–4',
          showIf: isInitial,
          question: t('Su primera entrada a EE.UU.', 'Your first entry into the U.S.'),
          fields: [
            date('entry.date', 'Fecha (aproximada)', 'Date of initial entry (on or about)', 'Part 3 · Item 2'),
            { id: 'entry.place', type: 'text', required: true, label: { es: 'Lugar de entrada (ciudad y estado)', en: 'Place of initial entry' }, formRef: 'Part 3 · Item 3', maxLength: 38, placeholder: 'Nogales, AZ' },
            {
              id: 'status2012',
              type: 'select',
              required: true,
              label: { es: 'Su estatus el 15 de junio de 2012', en: 'Immigration status on June 15, 2012' },
              formRef: 'Part 3 · Item 4',
              options: [
                { value: 'No Lawful Status', label: t('Sin estatus legal', 'No lawful status') },
                { value: 'Status Expired', label: t('Estatus vencido', 'Status expired') },
                { value: 'Parole Expired', label: t('Parole vencido', 'Parole expired') },
              ],
            },
          ],
        },
        {
          id: 'i94Has',
          kind: 'choice',
          formRef: 'Part 3 · Item 5.a',
          showIf: isInitial,
          question: t('¿Alguna vez le dieron un I-94, I-94W o I-95?', 'Were you ever issued Form I-94, I-94W or I-95?'),
          why: t('Por ejemplo, si entró con visa de turista.', 'For example, if you entered on a tourist visa.'),
          options: yesNo,
        },
        {
          id: 'i94',
          kind: 'fields',
          formRef: 'Part 3 · Items 5.b–5.c',
          showIf: all(isInitial, is('i94Has', 'yes')),
          question: t('Su I-94', 'Your I-94'),
          fields: [
            { id: 'i94.number', type: 'i94', label: { es: 'Número (si lo tiene)', en: 'Number (if available)' }, formRef: 'Part 3 · Item 5.b' },
            { id: 'i94.until', type: 'date', label: { es: 'Fecha en que venció su estadía', en: 'Date your authorized stay expired' }, formRef: 'Part 3 · Item 5.c' },
          ],
        },
        {
          id: 'education',
          kind: 'fields',
          formRef: 'Part 3 · Items 6–8 · Education Information',
          showIf: isInitial,
          question: t('Sus estudios', 'Your education'),
          why: t('DACA pide estar estudiando, haberse graduado de high school, tener un GED o haber servido en las fuerzas armadas.', 'DACA requires being in school, a high school diploma, a GED, or military service.'),
          fields: [
            { id: 'edu.how', type: 'text', required: true, label: { es: 'Cómo cumple (en inglés: Graduated from high school, GED, Currently in school)', en: 'How you meet the education guideline' }, formRef: 'Part 3 · Item 6', maxLength: 34, placeholder: 'Graduated from high school' },
            { id: 'edu.school', type: 'text', required: true, label: { es: 'Escuela, ciudad y estado', en: 'School name, city and state' }, formRef: 'Part 3 · Item 7', maxLength: 34 },
            date('edu.date', 'Fecha de graduación (o última asistencia)', 'Graduation date (or last attendance)', 'Part 3 · Item 8'),
          ],
        },
        {
          id: 'military',
          kind: 'choice',
          formRef: 'Part 3 · Item 9 · Military Service Information',
          showIf: isInitial,
          question: t('¿Sirvió en las fuerzas armadas o la Guardia Costera de EE.UU.?', 'Were you a member of the U.S. Armed Forces or Coast Guard?'),
          options: yesNo,
        },
        {
          id: 'militaryDetails',
          kind: 'fields',
          formRef: 'Part 3 · Items 9.a–9.d',
          showIf: all(isInitial, is('military', 'yes')),
          question: t('Su servicio militar', 'Your military service'),
          fields: [
            {
              id: 'mil.branch',
              type: 'select',
              required: true,
              label: { es: 'Rama', en: 'Military branch' },
              formRef: 'Part 3 · Item 9.a',
              options: ['Army', 'Marine Corps', 'Navy', 'Air Force', 'National Guard', 'Coast Guard'].map((v) => ({ value: v, label: { es: v, en: v } })),
            },
            date('mil.start', 'Fecha de inicio', 'Service start date', 'Part 3 · Item 9.b'),
            date('mil.end', 'Fecha de baja', 'Discharge date', 'Part 3 · Item 9.c', false),
            {
              id: 'mil.discharge',
              type: 'select',
              label: { es: 'Tipo de baja', en: 'Type of discharge' },
              formRef: 'Part 3 · Item 9.d',
              options: ['Honorable', 'General', 'Other Than Honorable (OTH)', 'Bad Conduct (BCD)', 'Dishonorable', 'Entry level separation (ELS)', 'Clemency Discharge', 'Not Applicable'].map((v) => ({ value: v, label: { es: v, en: v } })),
            },
          ],
        },
      ],
    },
    {
      id: 'safety',
      part: 'Part 4',
      title: t('Antecedentes', 'Criminal and security information'),
      questions: [
        {
          id: 'p4',
          kind: 'yesNoList',
          formRef: 'Part 4 · Items 1–7 · Criminal, National Security, and Public Safety Information',
          question: t('Preguntas sobre antecedentes', 'Background questions'),
          why: t('Incluya casos de la corte juvenil y casos que se borraron. Un delito grave, un delito menor significativo o tres delitos menores pueden impedir DACA.', 'Include juvenile and expunged cases. A felony, a significant misdemeanor or three misdemeanors can bar DACA.'),
          items: SAFETY_ITEMS,
        },
        {
          id: 'p4Explain',
          kind: 'fields',
          formRef: 'Part 8 · Part 4',
          showIf: anySafetyYes,
          question: t('Explique cada caso', 'Explain each case'),
          notice: { tone: 'legal', title: { es: 'Consulte a un abogado', en: 'Talk to an attorney' }, body: { es: 'Adjunte el resultado certificado de la corte de cada arresto o cargo. Un abogado debe revisar su caso antes de presentar.', en: 'Attach the certified court disposition for each arrest or charge. An attorney should review your case before you file.' } },
          fields: [{ id: 'p4.explain', type: 'longText', required: true, label: { es: 'Qué pasó, cuándo, dónde y cómo terminó (en inglés)', en: 'What happened, when, where and the outcome' }, formRef: 'Part 8 · Part 4' }],
        },
      ],
    },
    {
      id: 'statement',
      part: 'Part 5',
      title: t('Declaración y contacto', 'Statement and contact'),
      questions: [
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 5 · Items 1.a–1.b · Requestor’s Statement',
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
          fields: [{ id: 'fluentLanguage', type: 'text', required: true, label: { es: 'Idioma', en: 'Language' }, formRef: 'Part 5 · Item 1.b', placeholder: 'Spanish', maxLength: 40 }],
        },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 5 · Items 3–5 · Requestor’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 5 · Item 3', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 5 · Item 4' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 5 · Item 5' },
          ],
        },
      ],
    },
  ],
};
