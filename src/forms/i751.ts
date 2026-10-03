import type { Field, FormDefinition, YesNoItem } from './types';
import type { T } from '../i18n';
import { all, anyAddress, biographic, date, is, nameFields, rows, yesNo } from './helpers';

// Questions follow USCIS Form I-751, Petition to Remove Conditions on Residence, edition 04/01/24.
// The person filling in the app is the conditional resident; on a joint petition the spouse (or
// stepparent) answers their own statement in Part 8. The PDF mapping lives in src/pdf/i751Pdf.ts.

export const I751_EDITION = '04/01/24';

const t = (es: string, en: string): T => ({ es, en });

const isJoint = is('basis', 'A', 'B');

/** A U.S. address: this edition's mailing and physical addresses have no province or country. */
const usAddress = (prefix: string, ref: string): Field[] => [
  { id: `${prefix}.careOf`, type: 'text', label: { es: 'A cargo de (si recibe correo en casa de otra persona)', en: 'In care of' }, formRef: `${ref} · In Care Of Name`, maxLength: 34 },
  { id: `${prefix}.street`, type: 'text', required: true, label: { es: 'Número y calle', en: 'Street number and name' }, formRef: `${ref} · Street Number and Name`, maxLength: 34, placeholder: '1234 Main St' },
  { id: `${prefix}.unit`, type: 'unit', label: { es: 'Apartamento, suite o piso', en: 'Apt., suite or floor' }, formRef: `${ref} · Apt. Ste. Flr.`, placeholder: 'Apt 4B' },
  { id: `${prefix}.city`, type: 'text', required: true, label: { es: 'Ciudad', en: 'City or town' }, formRef: `${ref} · City or Town`, maxLength: 20 },
  { id: `${prefix}.state`, type: 'state', required: true, label: { es: 'Estado', en: 'State' }, formRef: `${ref} · State`, placeholder: 'CA' },
  { id: `${prefix}.zip`, type: 'zip', required: true, label: { es: 'Código postal', en: 'ZIP code' }, formRef: `${ref} · ZIP Code` },
];

/** Part 1, Items 18-23. */
export const HISTORY_ITEMS: YesNoItem[] = [
  { id: 'q18', formRef: 'Part 1 · Item 18', label: t('¿Está en un proceso de deportación, remoción o rescisión?', 'Are you in removal, deportation or rescission proceedings?') },
  { id: 'q19', formRef: 'Part 1 · Item 19', label: t('¿Le pagó a alguien que no es abogado por ayudarle con esta petición?', 'Was a fee paid to anyone other than an attorney for this petition?') },
  { id: 'q20', formRef: 'Part 1 · Item 20', label: t('¿Alguna vez lo arrestaron, detuvieron, acusaron, multaron o encarcelaron por violar una ley (sin contar multas de tránsito), o cometió un delito por el que no lo arrestaron?', 'Have you ever been arrested, detained, charged, fined or imprisoned for breaking a law (excluding traffic), or committed a crime you were not arrested for?') },
  { id: 'q21', formRef: 'Part 1 · Item 21', label: t('Si está casado/a, ¿es un matrimonio distinto al que le dio la residencia condicional?', 'If married, is this a different marriage than the one through which you gained conditional residence?'), showIf: is('marital', 'M') },
  { id: 'q22', formRef: 'Part 1 · Item 22', label: t('¿Ha vivido en otra dirección desde que es residente?', 'Have you lived at any other address since becoming a permanent resident?') },
  { id: 'q23', formRef: 'Part 1 · Item 23', label: t('¿Su cónyuge (o el cónyuge de su padre o madre) trabaja para el gobierno de EE.UU. fuera del país?', 'Is your spouse or parent’s spouse serving with or employed by the U.S. government outside the U.S.?') },
];

export const i751: FormDefinition = {
  id: 'i-751',
  number: 'I-751',
  edition: I751_EDITION,
  title: t('Quitar las condiciones de la residencia', 'Remove conditions on residence'),
  summary: {
    es: 'Para residentes condicionales por matrimonio (tarjeta de 2 años): pida la residencia de 10 años en los 90 días antes de que venza.',
    en: 'For conditional residents through marriage (2-year card): ask for the 10-year card within 90 days before it expires.',
  },
  intro: {
    es: 'Con el I-751 pide quitar las condiciones de su residencia. Por lo general se presenta junto con su cónyuge en los 90 días antes de que venza su tarjeta de 2 años. Si ya no está casado/a o sufrió maltrato, puede pedir una exención y presentarlo solo/a, en cualquier momento. Las preguntas son sobre usted, el residente condicional.',
    en: 'With Form I-751 you ask to remove the conditions on your residence. It is usually filed together with your spouse within 90 days before your 2-year card expires. If you are no longer married or suffered abuse, you can ask for a waiver and file alone, at any time. The questions are about you, the conditional resident.',
  },
  minutes: 40,
  pdf: {
    path: 'forms/i-751.pdf',
    fileName: 'I-751-filled.pdf',
    load: () => import('../pdf/i751Pdf').then((m) => m.fillI751),
    signHere: { es: 'Parte 7, Ítem 6.a (y, si es conjunta, su cónyuge la Parte 8, Ítem 6.a)', en: 'Part 7, Item 6.a (and, if joint, your spouse Part 8, Item 6.a)' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-751 que la edición {edition} sigue vigente y revise la tarifa; si cambió, use la nueva y copie sus respuestas de esta hoja.',
      'Adjunte copia de su tarjeta de residente (frente y reverso) y pruebas de que el matrimonio es real: cuentas o contratos a nombre de los dos, actas de nacimiento de hijos, fotos, declaraciones de personas que los conocen.',
      'Imprima el PDF. Usted firma la Parte 7, Ítem 6.a; si la petición es conjunta, su cónyuge firma la Parte 8, Ítem 6.a. A mano, con tinta negra.',
      'Envíelo dentro de los 90 días antes de que venza su tarjeta (salvo que pida una exención). El recibo extiende su residencia mientras espera.',
    ],
    en: [
      'Check at uscis.gov/i-751 that edition {edition} is still current and check the fee; if it changed, use the new one and copy your answers from this sheet.',
      'Attach a copy of your green card (front and back) and evidence the marriage is real: joint accounts or leases, children’s birth certificates, photos, affidavits from people who know you.',
      'Print the PDF. You sign Part 7, Item 6.a; on a joint petition your spouse signs Part 8, Item 6.a. By hand, in black ink.',
      'File within 90 days before your card expires (unless you ask for a waiver). The receipt notice extends your residence while you wait.',
    ],
  },
  sections: [
    {
      id: 'basis',
      part: 'Part 3',
      title: t('Cómo presenta', 'How you are filing'),
      questions: [
        {
          id: 'basis',
          kind: 'choice',
          formRef: 'Part 3 · Items 1.a–1.g · Basis for Petition',
          question: t('¿Con quién presenta la petición?', 'Who are you filing with?'),
          options: [
            { value: 'A', label: t('Junto con mi cónyuge', 'Jointly with my spouse') },
            { value: 'B', label: t('Junto con el cónyuge de mi padre o madre (soy el hijo/a y no puedo ir en la petición de mis padres)', 'Jointly with my parent’s spouse (I am the child and can’t be included in my parents’ petition)') },
            { value: 'waiver', label: t('Solo/a, con una exención (no puedo presentarla con mi cónyuge)', 'Alone, with a waiver (I can’t file with my spouse)') },
          ],
        },
        {
          id: 'waivers',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 3 · Items 1.c–1.g · Waiver or Individual Filing Request',
          showIf: is('basis', 'waiver'),
          question: t('¿Por qué no puede presentarla en conjunto?', 'Why can’t you file jointly?'),
          why: t('Elija todas las que apliquen.', 'Choose all that apply.'),
          notice: {
            tone: 'legal',
            title: { es: 'Consulte a un abogado', en: 'Talk to an attorney' },
            body: {
              es: 'Una exención necesita pruebas de que el matrimonio fue de buena fe. Si sufrió maltrato, puede pedir ayuda confidencial a la Línea Nacional contra la Violencia Doméstica: 1-800-799-7233.',
              en: 'A waiver needs evidence that the marriage was in good faith. If you suffered abuse, you can get confidential help from the National Domestic Violence Hotline: 1-800-799-7233.',
            },
          },
          options: [
            { value: 'C', label: t('Mi cónyuge falleció', 'My spouse died') },
            { value: 'D', label: t('Me casé de buena fe, pero nos divorciamos o se anuló el matrimonio', 'I married in good faith, but we divorced or it was annulled') },
            { value: 'E', label: t('Me casé de buena fe y mi cónyuge me maltrató o me trató con crueldad extrema', 'I married in good faith and my spouse battered me or subjected me to extreme cruelty') },
            { value: 'F', label: t('Mi padre o madre se casó de buena fe y su cónyuge (o mi padre o madre) me maltrató', 'My parent married in good faith and I was battered by their spouse or by my parent') },
            { value: 'G', label: t('Perder mi residencia y ser deportado/a me causaría un sufrimiento extremo', 'Losing my status and being removed would cause extreme hardship') },
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
          formRef: 'Part 1 · Item 1 · Your Full Name',
          question: t('¿Cuál es su nombre legal completo?', 'What is your full legal name?'),
          fields: nameFields('name', 'Part 1 · Item 1'),
        },
        {
          id: 'otherName.more0',
          kind: 'choice',
          formRef: 'Part 1 · Items 2–3 · Other Names Used',
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
          formRef: 'Part 1 · Items 2–3 · Other Names Used',
          fields: (i) => nameFields(`otherName${i}`, `Part 1 · Item ${i + 1}`),
          overflow: { es: 'El formulario tiene espacio para 2 nombres. Si son más, escríbalos a mano en la Parte 11.', en: 'The form has room for 2 names. If there are more, write them by hand in Part 11.' },
        }),
        {
          id: 'details',
          kind: 'fields',
          formRef: 'Part 1 · Items 4–9 · Other Information',
          question: t('Sus datos', 'Your details'),
          fields: [
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 4'),
            { id: 'birthCountry', type: 'text', required: true, label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: 'Part 1 · Item 5' },
            { id: 'citizenship', type: 'text', required: true, label: { es: 'País o países de ciudadanía', en: 'Country or countries of citizenship' }, formRef: 'Part 1 · Item 6' },
            { id: 'aNumber', type: 'aNumber', required: true, label: { es: 'A-Number (en su tarjeta, como "USCIS#")', en: 'A-Number (on your card, as "USCIS#")' }, formRef: 'Part 1 · Item 7' },
            { id: 'ssn', type: 'ssn', label: { es: 'Número de Seguro Social (si tiene)', en: 'Social Security number (if any)' }, formRef: 'Part 1 · Item 8', placeholder: '123-45-6789' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Número de cuenta en línea de USCIS', en: 'USCIS online account number' }, formRef: 'Part 1 · Item 9' },
          ],
        },
        {
          id: 'marital',
          kind: 'choice',
          formRef: 'Part 1 · Item 10 · Marital Status',
          question: t('¿Cuál es su estado civil hoy?', 'What is your marital status today?'),
          options: [
            { value: 'M', label: t('Casado/a', 'Married') },
            { value: 'D', label: t('Divorciado/a', 'Divorced') },
            { value: 'W', label: t('Viudo/a', 'Widowed') },
            { value: 'S', label: t('Soltero/a', 'Single') },
          ],
        },
        {
          id: 'marriage',
          kind: 'fields',
          formRef: 'Part 1 · Items 11–14',
          question: t('Su matrimonio y su residencia condicional', 'Your marriage and conditional residence'),
          why: t('El matrimonio por el que obtuvo la residencia condicional. La fecha de vencimiento está en su tarjeta.', 'The marriage through which you got conditional residence. The expiration date is on your card.'),
          fields: [
            date('marriage.date', 'Fecha del matrimonio', 'Date of marriage', 'Part 1 · Item 11'),
            { id: 'marriage.place', type: 'text', required: true, label: { es: 'Lugar del matrimonio (ciudad, estado o país)', en: 'Place of marriage' }, formRef: 'Part 1 · Item 12', placeholder: 'Las Vegas, NV' },
            date('marriage.ended', 'Si el matrimonio terminó: fecha del divorcio o de la muerte', 'If the marriage ended: date of divorce or death', 'Part 1 · Item 13', false),
            date('crExpires', 'Su residencia condicional vence el', 'Conditional residence expires on', 'Part 1 · Item 14', true, 'date'),
          ],
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 1 · Item 15 · Mailing Address',
          question: t('¿A qué dirección le llega el correo?', 'Where do you get your mail?'),
          fields: usAddress('mailing', 'Part 1 · Item 15'),
        },
        {
          id: 'physicalDifferent',
          kind: 'choice',
          formRef: 'Part 1 · Item 16 · Is your physical address different than your mailing address?',
          question: t('¿Vive en una dirección distinta?', 'Do you live at a different address?'),
          options: yesNo,
        },
        {
          id: 'home',
          kind: 'fields',
          formRef: 'Part 1 · Item 17 · Physical Address',
          showIf: is('physicalDifferent', 'yes'),
          question: t('¿Dónde vive?', 'Where do you live?'),
          fields: usAddress('home', 'Part 1 · Item 17'),
        },
        {
          id: 'history',
          kind: 'yesNoList',
          formRef: 'Part 1 · Items 18–23 · Additional Information About You',
          question: t('Otras preguntas', 'Other questions'),
          why: t('Responda con la verdad: un antecedente no siempre impide la aprobación, pero ocultarlo sí.', 'Answer truthfully: a record doesn’t always prevent approval, but hiding it can.'),
          items: HISTORY_ITEMS,
        },
        {
          id: 'explainArrests',
          kind: 'fields',
          formRef: 'Part 11 · Part 1 · Item 20',
          showIf: is('q20', 'yes'),
          question: t('Explique cada arresto o delito', 'Explain each arrest or offense'),
          notice: { tone: 'legal', title: { es: 'Consulte a un abogado', en: 'Talk to an attorney' }, body: { es: 'Adjunte los documentos de la corte o de la policía de cada caso. Un abogado debe revisar su caso antes de presentar.', en: 'Attach the court or police records for each case. An attorney should review your case before you file.' } },
          fields: [{ id: 'explain.arrests', type: 'longText', required: true, label: { es: 'Qué pasó, cuándo, dónde y cómo terminó (en inglés)', en: 'What happened, when, where and the outcome' }, formRef: 'Part 11 · Part 1 · Item 20' }],
        },
        {
          id: 'listAddresses',
          kind: 'fields',
          formRef: 'Part 11 · Part 1 · Item 22',
          showIf: is('q22', 'yes'),
          question: t('¿En qué otras direcciones ha vivido desde que es residente?', 'Where else have you lived since becoming a resident?'),
          fields: [{ id: 'explain.addresses', type: 'longText', required: true, label: { es: 'Cada dirección con las fechas (desde – hasta)', en: 'Each address with dates (from – to)' }, formRef: 'Part 11 · Part 1 · Item 22', placeholder: '55 Oak Ave, Fresno, CA 93701, 06/2023 - 01/2025' }],
        },
      ],
    },
    {
      id: 'biographic',
      part: 'Part 2',
      title: t('Datos biográficos', 'Biographic information'),
      questions: biographic('Part 2'),
    },
    {
      id: 'spouse',
      part: 'Part 4',
      title: t('Su cónyuge', 'Your spouse'),
      questions: [
        {
          id: 'relationship',
          kind: 'choice',
          formRef: 'Part 4 · Item 1 · Relationship',
          question: t('¿Por quién obtuvo la residencia condicional?', 'Through whom did you get conditional residence?'),
          why: t('El ciudadano o residente con quien se casó usted (o su padre o madre). Responda aunque ya no estén casados.', 'The citizen or resident you (or your parent) married. Answer even if you are no longer married.'),
          options: [
            { value: 'A', label: t('Mi cónyuge o excónyuge', 'My spouse or former spouse') },
            { value: 'B', label: t('El cónyuge o excónyuge de mi padre o madre', 'My parent’s spouse or former spouse') },
          ],
        },
        {
          id: 'spouse.name',
          kind: 'fields',
          formRef: 'Part 4 · Items 2–5',
          question: t('Datos de esa persona', 'That person’s details'),
          fields: [
            ...nameFields('spouse', 'Part 4 · Item 2'),
            date('spouse.dob', 'Fecha de nacimiento', 'Date of birth', 'Part 4 · Item 3'),
            { id: 'spouse.ssn', type: 'ssn', label: { es: 'Número de Seguro Social (si sabe)', en: 'Social Security number (if known)' }, formRef: 'Part 4 · Item 4' },
            { id: 'spouse.aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 4 · Item 5' },
          ],
        },
        {
          id: 'spouse.livesWithYou',
          kind: 'choice',
          formRef: 'Part 4 · Item 6 · Physical Address',
          question: t('¿Vive esa persona con usted?', 'Does that person live with you?'),
          options: yesNo,
        },
        {
          id: 'spouse.address',
          kind: 'fields',
          formRef: 'Part 4 · Item 6 · Physical Address',
          showIf: is('spouse.livesWithYou', 'no'),
          question: t('¿Dónde vive esa persona?', 'Where does that person live?'),
          fields: anyAddress('spouseHome', 'Part 4 · Item 6'),
        },
      ],
    },
    {
      id: 'children',
      part: 'Part 5',
      title: t('Sus hijos', 'Your children'),
      questions: [
        {
          id: 'child.more0',
          kind: 'choice',
          formRef: 'Part 5 · Information About Your Children',
          question: t('¿Tiene hijos?', 'Do you have children?'),
          why: t('Todos sus hijos, de cualquier edad y de cualquier relación.', 'All your children, of any age and from any relationship.'),
          options: yesNo,
        },
        ...rows({
          max: 5,
          id: 'child',
          first: is('child.more0', 'yes'),
          question: (i) => (i === 1 ? t('Su hijo o hija', 'Your child') : t('Otro hijo o hija', 'Another child')),
          more: t('¿Tiene otro hijo o hija?', 'Do you have another child?'),
          formRef: 'Part 5 · Children',
          why: (i) => (i === 1 ? t('Si el hijo también tiene residencia condicional por el mismo matrimonio, puede incluirlo en esta petición.', 'If the child also has conditional residence through the same marriage, you can include them in this petition.') : undefined),
          fields: (i) => [
            ...nameFields(`child${i}`, `Part 5 · Child ${i}`),
            date(`child${i}.dob`, 'Fecha de nacimiento', 'Date of birth', `Part 5 · Child ${i} · Date of Birth`),
            { id: `child${i}.aNumber`, type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: `Part 5 · Child ${i} · A-Number` },
            { id: `child${i}.living`, type: 'select', required: true, label: { es: '¿Vive con usted?', en: 'Is this child living with you?' }, formRef: `Part 5 · Child ${i} · Is this child living with you?`, options: yesNo },
            { id: `child${i}.applying`, type: 'select', required: true, label: { es: '¿Lo incluye en esta petición?', en: 'Is this child applying with you?' }, formRef: `Part 5 · Child ${i} · Is this child applying with you?`, options: yesNo },
            ...anyAddress(`child${i}.home`, `Part 5 · Child ${i} · Physical Address`).map((f) => ({ ...f, required: false, hint: t('Déjelo en blanco si vive con usted: usamos su dirección.', 'Leave blank if they live with you: we use your address.') })),
          ],
          overflow: { es: 'El formulario tiene espacio para 5 hijos. Si son más, escríbalos a mano en la Parte 11.', en: 'The form has room for 5 children. If there are more, write them by hand in Part 11.' },
        }),
      ],
    },
    {
      id: 'accommodations',
      part: 'Part 6',
      title: t('Adaptaciones', 'Accommodations'),
      questions: [
        {
          id: 'acc',
          kind: 'yesNoList',
          formRef: 'Part 6 · Items 1–3',
          question: t('¿Necesitan alguna adaptación por discapacidad para la cita?', 'Does anyone need a disability accommodation for the appointment?'),
          items: [
            { id: 'acc.self', formRef: 'Part 6 · Item 1', label: t('Usted', 'You') },
            { id: 'acc.spouse', formRef: 'Part 6 · Item 2', label: t('Su cónyuge', 'Your spouse'), showIf: isJoint },
            { id: 'acc.children', formRef: 'Part 6 · Item 3', label: t('Sus hijos incluidos', 'Your included children') },
          ],
        },
        {
          id: 'accDetails',
          kind: 'fields',
          formRef: 'Part 6 · Items 4.a–4.c',
          showIf: (a) => ['acc.self', 'acc.spouse', 'acc.children'].some((id) => a[id] === 'yes'),
          question: t('¿Qué necesitan?', 'What is needed?'),
          why: t('Llene solo lo que aplique, en inglés, e indique para quién.', 'Fill in only what applies, and say for whom.'),
          fields: [
            { id: 'acc.deaf', type: 'longText', label: { es: 'Sordera o pérdida auditiva: qué necesita (por ejemplo, "ASL interpreter")', en: 'Deaf or hard of hearing: accommodation' }, formRef: 'Part 6 · Item 4.a' },
            { id: 'acc.blind', type: 'longText', label: { es: 'Ceguera o baja visión: qué necesita', en: 'Blind or low vision: accommodation' }, formRef: 'Part 6 · Item 4.b' },
            { id: 'acc.other', type: 'longText', label: { es: 'Otra discapacidad: cuál y qué necesita', en: 'Other disability and accommodation' }, formRef: 'Part 6 · Item 4.c' },
          ],
        },
      ],
    },
    {
      id: 'statement',
      part: 'Part 7',
      title: t('Su declaración y contacto', 'Your statement and contact'),
      questions: [
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 7 · Items 1.a–1.b · Petitioner’s Statement',
          question: t('¿Puede leer y entender la petición en inglés?', 'Can you read and understand the petition in English?'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me la leerá', 'No, an interpreter will read it to me') },
          ],
        },
        {
          id: 'interpreterLanguage',
          kind: 'fields',
          formRef: 'Part 7 · Item 1.b',
          showIf: is('readsEnglish', 'B'),
          question: t('¿En qué idioma se la leerán?', 'What language will it be read in?'),
          fields: [{ id: 'fluentLanguage', type: 'text', required: true, label: { es: 'Idioma', en: 'Language' }, formRef: 'Part 7 · Item 1.b', placeholder: 'Spanish' }],
        },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 7 · Items 3–5 · Petitioner’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 7 · Item 3', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 7 · Item 4' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 7 · Item 5', maxLength: 38 },
          ],
        },
      ],
    },
    {
      id: 'spouseStatement',
      part: 'Part 8',
      title: t('La declaración de su cónyuge', 'Your spouse’s statement'),
      questions: [
        {
          id: 'spouse.readsEnglish',
          kind: 'choice',
          formRef: 'Part 8 · Items 1.a–1.b · Spouse’s Statement',
          showIf: isJoint,
          question: t('¿Su cónyuge puede leer y entender la petición en inglés?', 'Can your spouse read and understand the petition in English?'),
          notice: { tone: 'info', title: { es: 'Ahora contesta su cónyuge', en: 'Now your spouse answers' }, body: { es: 'En una petición conjunta, su cónyuge también firma, en la Parte 8.', en: 'On a joint petition your spouse also signs, in Part 8.' } },
          options: [
            { value: 'A', label: t('Sí, lee inglés', 'Yes, reads English') },
            { value: 'B', label: t('No, un intérprete se la leerá', 'No, an interpreter will read it') },
          ],
        },
        {
          id: 'spouseLanguage',
          kind: 'fields',
          formRef: 'Part 8 · Item 1.b',
          showIf: all(isJoint, is('spouse.readsEnglish', 'B')),
          question: t('¿En qué idioma se la leerán?', 'What language will it be read in?'),
          fields: [{ id: 'spouse.language', type: 'text', required: true, label: { es: 'Idioma', en: 'Language' }, formRef: 'Part 8 · Item 1.b', placeholder: 'Spanish' }],
        },
        {
          id: 'spouseContact',
          kind: 'fields',
          formRef: 'Part 8 · Items 3–5 · Spouse’s Contact Information',
          showIf: isJoint,
          question: t('¿Cómo puede USCIS contactar a su cónyuge?', 'How can USCIS contact your spouse?'),
          fields: [
            { id: 'spouse.phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 8 · Item 3' },
            { id: 'spouse.mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 8 · Item 4' },
            { id: 'spouse.email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 8 · Item 5', maxLength: 38 },
          ],
        },
      ],
    },
  ],
};
