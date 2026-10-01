import type { Answers, Field, FormDefinition, Option } from './types';

// Questions follow the parts of USCIS Form I-765, Application for Employment Authorization.
// `formRef` uses the form's own English field names (not item numbers, which change between editions)
// so a person can find each answer on the current edition from uscis.gov/i-765.

const yesNo: Option[] = [
  { value: 'yes', label: { es: 'Sí', en: 'Yes' } },
  { value: 'no', label: { es: 'No', en: 'No' } },
];

const is = (id: string, value: string) => (a: Answers) => a[id] === value;

const nameFields = (prefix: string, part: string, middle = true): Field[] => [
  { id: `${prefix}.family`, type: 'text', required: true, label: { es: 'Apellido(s)', en: 'Family name (last name)' }, formRef: `${part} · Family Name (Last Name)` },
  { id: `${prefix}.given`, type: 'text', required: true, label: { es: 'Nombre(s)', en: 'Given name (first name)' }, formRef: `${part} · Given Name (First Name)` },
  ...(middle
    ? [{ id: `${prefix}.middle`, type: 'text', label: { es: 'Segundo nombre', en: 'Middle name' }, formRef: `${part} · Middle Name` } as Field]
    : []),
];

const addressFields = (prefix: string, ref: string, inCareOf: boolean): Field[] => [
  ...(inCareOf
    ? [{
        id: `${prefix}.careOf`,
        type: 'text',
        label: { es: 'A cargo de (si recibe correo en casa de otra persona)', en: 'In care of (if you get mail at someone else’s home)' },
        formRef: `${ref} · In Care Of Name`,
      } as Field]
    : []),
  { id: `${prefix}.street`, type: 'text', required: true, label: { es: 'Número y calle', en: 'Street number and name' }, formRef: `${ref} · Street Number and Name`, placeholder: '1234 Main St' },
  { id: `${prefix}.unit`, type: 'text', label: { es: 'Apartamento, suite o piso', en: 'Apartment, suite or floor' }, formRef: `${ref} · Apt./Ste./Flr.` },
  { id: `${prefix}.city`, type: 'text', required: true, label: { es: 'Ciudad', en: 'City or town' }, formRef: `${ref} · City or Town` },
  { id: `${prefix}.state`, type: 'state', required: true, label: { es: 'Estado', en: 'State' }, formRef: `${ref} · State`, placeholder: 'CA', hint: { es: 'Dos letras, por ejemplo CA, TX o NY.', en: 'Two letters, for example CA, TX or NY.' } },
  { id: `${prefix}.zip`, type: 'zip', required: true, label: { es: 'Código postal (ZIP)', en: 'ZIP code' }, formRef: `${ref} · ZIP Code`, placeholder: '90210' },
];

export const CATEGORY_OTHER = 'other';

export const categories: Option[] = [
  { value: '(c)(8)', label: { es: '(c)(8) — Tengo una solicitud de asilo pendiente', en: '(c)(8) — I have a pending asylum application' } },
  { value: '(c)(9)', label: { es: '(c)(9) — Tengo pendiente un ajuste de estatus (I-485)', en: '(c)(9) — I have a pending adjustment of status (I-485)' } },
  { value: '(a)(5)', label: { es: '(a)(5) — Me otorgaron asilo', en: '(a)(5) — I was granted asylum' } },
  { value: '(c)(11)', label: { es: '(c)(11) — Estoy en EE.UU. con parole', en: '(c)(11) — I am in the U.S. on parole' } },
  { value: '(a)(12)', label: { es: '(a)(12) — Tengo TPS aprobado', en: '(a)(12) — My TPS was approved' } },
  { value: '(c)(19)', label: { es: '(c)(19) — Tengo una solicitud de TPS pendiente', en: '(c)(19) — I have a pending TPS application' } },
  { value: '(c)(33)', label: { es: '(c)(33) — DACA', en: '(c)(33) — DACA' } },
  { value: '(c)(3)(B)', label: { es: '(c)(3)(B) — Estudiante F-1, OPT después de graduarme', en: '(c)(3)(B) — F-1 student, post-completion OPT' } },
  { value: '(c)(3)(C)', label: { es: '(c)(3)(C) — Estudiante F-1, extensión de OPT STEM', en: '(c)(3)(C) — F-1 student, STEM OPT extension' } },
  { value: '(c)(26)', label: { es: '(c)(26) — Cónyuge H-4 de una persona H-1B', en: '(c)(26) — H-4 spouse of an H-1B worker' } },
  { value: CATEGORY_OTHER, label: { es: 'Otra categoría', en: 'Another category' } },
];

const category = (a: Answers) => (a.category === CATEGORY_OTHER ? String(a['category.other'] ?? '') : String(a.category ?? ''));
const categoryIs = (...cs: string[]) => (a: Answers) => cs.map((c) => c.toLowerCase()).includes(category(a).replace(/\s/g, '').toLowerCase());

export const i765: FormDefinition = {
  id: 'i-765',
  number: 'I-765',
  title: { es: 'Solicitud de permiso de trabajo', en: 'Application for Employment Authorization' },
  intro: {
    es: 'El I-765 pide a USCIS un permiso de trabajo (EAD). Le haremos una pregunta a la vez; al final tendrá una hoja con todas sus respuestas, ordenadas como el formulario oficial, para copiarlas o llevarlas a quien le ayude.',
    en: 'Form I-765 asks USCIS for a work permit (EAD). We’ll ask one question at a time; at the end you’ll have a sheet with all your answers, in the order of the official form, to copy or bring to whoever helps you.',
  },
  sections: [
    {
      id: 'reason',
      part: 'Part 1',
      title: { es: 'Motivo de la solicitud', en: 'Reason for applying' },
      questions: [
        {
          id: 'reason',
          kind: 'choice',
          formRef: 'Part 1 · Reason for Applying',
          question: { es: '¿Por qué solicita el permiso de trabajo?', en: 'Why are you applying for a work permit?' },
          why: {
            es: 'USCIS necesita saber si es la primera vez o si ya tuvo un permiso.',
            en: 'USCIS needs to know whether this is your first permit or you already had one.',
          },
          options: [
            { value: 'initial', label: { es: 'Es mi primer permiso de trabajo', en: 'This is my first work permit' } },
            { value: 'replacement', label: { es: 'Reemplazar un permiso perdido, robado o dañado', en: 'Replace a lost, stolen or damaged permit' } },
            { value: 'renewal', label: { es: 'Renovar mi permiso actual', en: 'Renew my current permit' } },
          ],
        },
      ],
    },
    {
      id: 'about',
      part: 'Part 2',
      title: { es: 'Información personal', en: 'About you' },
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 2 · Full Legal Name',
          question: { es: '¿Cuál es su nombre legal completo?', en: 'What is your full legal name?' },
          why: { es: 'Escríbalo exactamente como aparece en su pasaporte o documento de identidad.', en: 'Write it exactly as it appears on your passport or ID document.' },
          notice: {
            tone: 'info',
            title: { es: 'Responda en inglés', en: 'Answer in English' },
            body: {
              es: 'Use letras latinas y no traduzca su nombre. Los acentos se pueden omitir.',
              en: 'Use Latin letters and don’t translate your name. Accents can be left out.',
            },
          },
          fields: nameFields('name', 'Part 2'),
        },
        {
          id: 'hasOtherNames',
          kind: 'choice',
          formRef: 'Part 2 · Other Names Used',
          question: { es: '¿Ha usado otros nombres?', en: 'Have you used any other names?' },
          why: { es: 'Por ejemplo, un apellido de soltera o un nombre con otra ortografía.', en: 'For example, a maiden name or a different spelling of your name.' },
          options: yesNo,
        },
        {
          id: 'otherName',
          kind: 'fields',
          formRef: 'Part 2 · Other Names Used',
          showIf: is('hasOtherNames', 'yes'),
          question: { es: '¿Qué otro nombre ha usado?', en: 'What other name have you used?' },
          why: { es: 'Si usó más de uno, escriba los demás en la Parte 6 (Información adicional) del formulario.', en: 'If you used more than one, list the others in Part 6 (Additional Information) of the form.' },
          fields: nameFields('otherName', 'Part 2 · Other Names Used'),
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 2 · U.S. Mailing Address',
          question: { es: '¿A qué dirección le llega el correo?', en: 'Where do you get your mail?' },
          why: { es: 'USCIS enviará aquí sus cartas y su tarjeta de permiso de trabajo.', en: 'USCIS will send your letters and your work permit card here.' },
          fields: addressFields('mailing', 'Part 2 · U.S. Mailing Address', true),
        },
        {
          id: 'sameAddress',
          kind: 'choice',
          formRef: 'Part 2 · Is your current mailing address the same as your physical address?',
          question: { es: '¿Vive en esa misma dirección?', en: 'Do you live at that same address?' },
          options: yesNo,
        },
        {
          id: 'physical',
          kind: 'fields',
          formRef: 'Part 2 · U.S. Physical Address',
          showIf: is('sameAddress', 'no'),
          question: { es: '¿Dónde vive?', en: 'Where do you live?' },
          fields: addressFields('physical', 'Part 2 · U.S. Physical Address', false),
        },
        {
          id: 'ids',
          kind: 'fields',
          formRef: 'Part 2 · Other Information',
          question: { es: '¿Tiene alguno de estos números de inmigración?', en: 'Do you have any of these immigration numbers?' },
          why: {
            es: 'Aparecen en cartas de USCIS o en un permiso anterior. Si no los tiene, deje los campos vacíos.',
            en: 'They appear on USCIS letters or a previous permit. If you don’t have them, leave the fields empty.',
          },
          fields: [
            { id: 'aNumber', type: 'aNumber', label: { es: 'Número de extranjero (A-Number)', en: 'Alien Registration Number (A-Number)' }, formRef: 'Part 2 · Alien Registration Number (A-Number)', placeholder: 'A123456789' },
            { id: 'uscisAccount', type: 'text', label: { es: 'Número de cuenta en línea de USCIS', en: 'USCIS Online Account Number' }, formRef: 'Part 2 · USCIS Online Account Number' },
          ],
        },
        {
          id: 'sex',
          kind: 'choice',
          formRef: 'Part 2 · Sex',
          question: { es: '¿Qué sexo aparece en sus documentos?', en: 'What sex is on your documents?' },
          options: [
            { value: 'female', label: { es: 'Femenino', en: 'Female' } },
            { value: 'male', label: { es: 'Masculino', en: 'Male' } },
          ],
        },
        {
          id: 'marital',
          kind: 'choice',
          formRef: 'Part 2 · Marital Status',
          question: { es: '¿Cuál es su estado civil?', en: 'What is your marital status?' },
          options: [
            { value: 'single', label: { es: 'Soltero/a', en: 'Single' } },
            { value: 'married', label: { es: 'Casado/a', en: 'Married' } },
            { value: 'divorced', label: { es: 'Divorciado/a', en: 'Divorced' } },
            { value: 'widowed', label: { es: 'Viudo/a', en: 'Widowed' } },
          ],
        },
        {
          id: 'previousI765',
          kind: 'choice',
          formRef: 'Part 2 · Have you previously filed Form I-765?',
          question: { es: '¿Ha presentado un I-765 antes?', en: 'Have you filed Form I-765 before?' },
          options: yesNo,
        },
      ],
    },
    {
      id: 'ssn',
      part: 'Part 2',
      title: { es: 'Seguro Social', en: 'Social Security' },
      questions: [
        {
          id: 'hasSsn',
          kind: 'choice',
          formRef: 'Part 2 · Has the Social Security Administration (SSA) ever officially issued a Social Security card to you?',
          question: { es: '¿Alguna vez el Seguro Social (SSA) le dio una tarjeta?', en: 'Has Social Security (SSA) ever issued you a card?' },
          options: yesNo,
        },
        {
          id: 'ssnNumber',
          kind: 'fields',
          formRef: 'Part 2 · U.S. Social Security Number',
          showIf: is('hasSsn', 'yes'),
          question: { es: '¿Cuál es su número de Seguro Social?', en: 'What is your Social Security number?' },
          fields: [{ id: 'ssnValue', type: 'ssn', required: true, label: { es: 'Número de Seguro Social', en: 'Social Security number' }, formRef: 'Part 2 · U.S. Social Security Number', placeholder: '123-45-6789' }],
        },
        {
          id: 'wantsSsnCard',
          kind: 'choice',
          formRef: 'Part 2 · Do you want the SSA to issue you a Social Security card?',
          question: { es: '¿Quiere que el Seguro Social le envíe una tarjeta?', en: 'Do you want Social Security to send you a card?' },
          why: {
            es: 'Con este formulario puede pedir la tarjeta sin ir a una oficina del Seguro Social. Si ya tiene una y no necesita otra, responda No.',
            en: 'This form lets you request the card without visiting a Social Security office. If you already have one and don’t need another, answer No.',
          },
          options: yesNo,
        },
        {
          id: 'ssaConsent',
          kind: 'choice',
          formRef: 'Part 2 · Consent for Disclosure',
          showIf: is('wantsSsnCard', 'yes'),
          question: { es: '¿Permite que USCIS comparta sus datos con el Seguro Social para hacer la tarjeta?', en: 'Do you allow USCIS to share your information with Social Security to make the card?' },
          why: { es: 'Si responde No, el Seguro Social no podrá hacer la tarjeta con esta solicitud.', en: 'If you answer No, Social Security can’t make the card from this application.' },
          options: yesNo,
        },
        {
          id: 'father',
          kind: 'fields',
          formRef: 'Part 2 · Father’s Name',
          showIf: is('ssaConsent', 'yes'),
          question: { es: '¿Cómo se llama su padre?', en: 'What is your father’s name?' },
          why: { es: 'El Seguro Social lo usa para identificarle. Escriba su nombre al nacer.', en: 'Social Security uses it to identify you. Write his name at birth.' },
          fields: nameFields('father', 'Part 2 · Father’s Name', false),
        },
        {
          id: 'mother',
          kind: 'fields',
          formRef: 'Part 2 · Mother’s Name',
          showIf: is('ssaConsent', 'yes'),
          question: { es: '¿Cómo se llama su madre?', en: 'What is your mother’s name?' },
          why: { es: 'Escriba su nombre al nacer, incluido su apellido de soltera.', en: 'Write her name at birth, including her maiden name.' },
          fields: nameFields('mother', 'Part 2 · Mother’s Name', false),
        },
      ],
    },
    {
      id: 'birth',
      part: 'Part 2',
      title: { es: 'Nacimiento y ciudadanía', en: 'Birth and citizenship' },
      questions: [
        {
          id: 'citizenship',
          kind: 'fields',
          formRef: 'Part 2 · Country of Citizenship or Nationality',
          question: { es: '¿De qué país es ciudadano/a?', en: 'What country are you a citizen of?' },
          fields: [
            { id: 'citizenship.1', type: 'text', required: true, label: { es: 'País', en: 'Country' }, formRef: 'Part 2 · Country of Citizenship or Nationality', placeholder: 'Mexico' },
            { id: 'citizenship.2', type: 'text', label: { es: 'Segundo país (si tiene doble ciudadanía)', en: 'Second country (if you have dual citizenship)' }, formRef: 'Part 2 · Country of Citizenship or Nationality' },
          ],
        },
        {
          id: 'birthPlace',
          kind: 'fields',
          formRef: 'Part 2 · Place of Birth',
          question: { es: '¿Dónde nació?', en: 'Where were you born?' },
          fields: [
            { id: 'birth.city', type: 'text', required: true, label: { es: 'Ciudad o pueblo', en: 'City or town' }, formRef: 'Part 2 · City/Town/Village of Birth' },
            { id: 'birth.state', type: 'text', label: { es: 'Estado o provincia', en: 'State or province' }, formRef: 'Part 2 · State/Province of Birth' },
            { id: 'birth.country', type: 'text', required: true, label: { es: 'País', en: 'Country' }, formRef: 'Part 2 · Country of Birth' },
          ],
        },
        {
          id: 'dob',
          kind: 'fields',
          formRef: 'Part 2 · Date of Birth',
          question: { es: '¿Cuál es su fecha de nacimiento?', en: 'What is your date of birth?' },
          fields: [
            {
              id: 'dobValue',
              type: 'pastDate',
              required: true,
              label: { es: 'Fecha de nacimiento', en: 'Date of birth' },
              formRef: 'Part 2 · Date of Birth (mm/dd/yyyy)',
              placeholder: 'MM/DD/AAAA',
              hint: { es: 'Mes primero, como en EE.UU.: 03/14/1990 es 14 de marzo.', en: 'Month first: 03/14/1990 is March 14.' },
            },
          ],
        },
      ],
    },
    {
      id: 'arrival',
      part: 'Part 2',
      title: { es: 'Llegada a EE.UU.', en: 'Arrival in the U.S.' },
      questions: [
        {
          id: 'travelDocs',
          kind: 'fields',
          formRef: 'Part 2 · Information About Your Last Arrival in the United States',
          question: { es: '¿Con qué documentos entró por última vez a EE.UU.?', en: 'What documents did you use when you last entered the U.S.?' },
          why: {
            es: 'Escriba los que tenga. El número I-94 se puede buscar en i94.cbp.dhs.gov. Si entró sin documentos, deje los campos vacíos.',
            en: 'Fill in the ones you have. You can look up your I-94 number at i94.cbp.dhs.gov. If you entered without documents, leave the fields empty.',
          },
          fields: [
            { id: 'i94', type: 'i94', label: { es: 'Número del registro de llegada y salida (I-94)', en: 'Form I-94 Arrival-Departure Record Number' }, formRef: 'Part 2 · Form I-94 Arrival-Departure Record Number' },
            { id: 'passport', type: 'text', label: { es: 'Número de pasaporte', en: 'Passport number' }, formRef: 'Part 2 · Passport Number of Your Most Recently Issued Passport' },
            { id: 'travelDoc', type: 'text', label: { es: 'Número de documento de viaje', en: 'Travel document number' }, formRef: 'Part 2 · Travel Document Number' },
            { id: 'passportCountry', type: 'text', label: { es: 'País que emitió el pasaporte o documento', en: 'Country that issued the passport or document' }, formRef: 'Part 2 · Country That Issued Your Passport or Travel Document' },
            { id: 'passportExpiry', type: 'date', label: { es: 'Fecha de vencimiento del pasaporte', en: 'Passport expiration date' }, formRef: 'Part 2 · Expiration Date for Passport or Travel Document (mm/dd/yyyy)', placeholder: 'MM/DD/AAAA' },
          ],
        },
        {
          id: 'lastArrival',
          kind: 'fields',
          formRef: 'Part 2 · Date and Place of Your Last Arrival',
          question: { es: '¿Cuándo y por dónde entró por última vez?', en: 'When and where did you last enter?' },
          fields: [
            { id: 'arrival.date', type: 'pastDate', required: true, label: { es: 'Fecha de la última entrada', en: 'Date of last arrival' }, formRef: 'Part 2 · Date of Your Last Arrival Into the United States (mm/dd/yyyy)', placeholder: 'MM/DD/AAAA' },
            { id: 'arrival.place', type: 'text', required: true, label: { es: 'Lugar de entrada (ciudad, estado)', en: 'Place of entry (city, state)' }, formRef: 'Part 2 · Place of Your Last Arrival Into the United States', placeholder: 'San Ysidro, CA' },
          ],
        },
        {
          id: 'status',
          kind: 'fields',
          formRef: 'Part 2 · Immigration Status',
          question: { es: '¿Cuál era y cuál es su estatus migratorio?', en: 'What was and what is your immigration status?' },
          why: {
            es: 'Por ejemplo: B-2 visitante, F-1 estudiante, parolee, solicitante de asilo, o "sin estatus" (EWI) si entró sin inspección.',
            en: 'For example: B-2 visitor, F-1 student, parolee, asylum applicant, or "no status" (EWI) if you entered without inspection.',
          },
          fields: [
            { id: 'status.arrival', type: 'text', required: true, label: { es: 'Estatus al entrar la última vez', en: 'Status at your last arrival' }, formRef: 'Part 2 · Immigration Status at Your Last Arrival' },
            { id: 'status.current', type: 'text', required: true, label: { es: 'Estatus actual', en: 'Current status' }, formRef: 'Part 2 · Your Current Immigration Status or Category' },
          ],
        },
      ],
    },
    {
      id: 'eligibility',
      part: 'Part 2',
      title: { es: 'Categoría de elegibilidad', en: 'Eligibility category' },
      questions: [
        {
          id: 'category',
          kind: 'choice',
          formRef: 'Part 2 · Eligibility Category',
          question: { es: '¿Por qué tiene derecho a un permiso de trabajo?', en: 'Why are you eligible for a work permit?' },
          why: {
            es: 'La categoría decide qué pruebas debe enviar y cuánto paga. Si no está seguro/a, consulte las instrucciones del I-765 o a un representante acreditado.',
            en: 'The category decides what evidence you send and what you pay. If you’re not sure, check the I-765 instructions or ask an accredited representative.',
          },
          options: categories,
        },
        {
          id: 'categoryOther',
          kind: 'fields',
          formRef: 'Part 2 · Eligibility Category',
          showIf: is('category', CATEGORY_OTHER),
          question: { es: '¿Cuál es su categoría?', en: 'What is your category?' },
          why: { es: 'Escríbala como aparece en las instrucciones del I-765, con paréntesis.', en: 'Write it as it appears in the I-765 instructions, with parentheses.' },
          fields: [{ id: 'category.other', type: 'text', required: true, label: { es: 'Categoría', en: 'Category' }, formRef: 'Part 2 · Eligibility Category', placeholder: '(c)(10)' }],
        },
        {
          id: 'stem',
          kind: 'fields',
          formRef: 'Part 2 · (c)(3)(C) STEM OPT Eligibility',
          showIf: categoryIs('(c)(3)(c)'),
          question: { es: 'Sobre su título y su empleador', en: 'About your degree and your employer' },
          fields: [
            { id: 'stem.degree', type: 'text', required: true, label: { es: 'Título (degree)', en: 'Degree' }, formRef: 'Part 2 · Degree' },
            { id: 'stem.employer', type: 'text', required: true, label: { es: 'Nombre del empleador como aparece en E-Verify', en: 'Employer’s name as listed in E-Verify' }, formRef: 'Part 2 · Employer’s Name as Listed in E-Verify' },
            { id: 'stem.everify', type: 'text', required: true, label: { es: 'Número de identificación de la empresa en E-Verify', en: 'Employer’s E-Verify company identification number' }, formRef: 'Part 2 · Employer’s E-Verify Company Identification Number' },
          ],
        },
        {
          id: 'h1b',
          kind: 'fields',
          formRef: 'Part 2 · (c)(26) Eligibility',
          showIf: categoryIs('(c)(26)'),
          question: { es: '¿Cuál es el número de recibo del I-797 de su cónyuge H-1B?', en: 'What is the receipt number on your H-1B spouse’s I-797?' },
          fields: [{ id: 'h1b.receipt', type: 'receipt', required: true, label: { es: 'Número de recibo', en: 'Receipt number' }, formRef: 'Part 2 · Receipt Number of Your H-1B Spouse’s Most Recent Form I-797', placeholder: 'IOE0123456789' }],
        },
        {
          id: 'arrested',
          kind: 'choice',
          formRef: 'Part 2 · (c)(8) Eligibility — Arrests or Convictions',
          showIf: categoryIs('(c)(8)', '(c)(35)', '(c)(36)'),
          question: { es: '¿Alguna vez lo/la han arrestado o condenado por algún delito?', en: 'Have you ever been arrested for or convicted of any crime?' },
          why: {
            es: 'USCIS hace esta pregunta en su categoría. Si responde Sí, deberá enviar documentos del caso.',
            en: 'USCIS asks this for your category. If you answer Yes, you’ll need to send records about it.',
          },
          notice: {
            tone: 'legal',
            title: { es: 'Esto no es asesoría legal', en: 'This is not legal advice' },
            body: {
              es: 'Si alguna vez lo/la arrestaron, aunque no lo/la condenaran, hable con un abogado o representante acreditado antes de presentar el formulario.',
              en: 'If you were ever arrested, even without a conviction, talk to an attorney or accredited representative before you file.',
            },
          },
          options: yesNo,
        },
      ],
    },
    {
      id: 'contact',
      part: 'Part 3',
      title: { es: 'Contacto', en: 'Contact' },
      questions: [
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 3 · Applicant’s Contact Information',
          question: { es: '¿Cómo podemos contactarle?', en: 'How can USCIS contact you?' },
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone number' }, formRef: 'Part 3 · Applicant’s Daytime Telephone Number', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone number' }, formRef: 'Part 3 · Applicant’s Mobile Telephone Number' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email address' }, formRef: 'Part 3 · Applicant’s Email Address' },
          ],
        },
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 3 · Applicant’s Statement',
          question: { es: '¿Puede leer y entender el formulario en inglés?', en: 'Can you read and understand the form in English?' },
          why: {
            es: 'Si alguien le traduce el formulario, esa persona debe llenar y firmar la Parte 4 (intérprete). Si alguien lo prepara por usted, la Parte 5.',
            en: 'If someone translates the form for you, they must fill in and sign Part 4 (interpreter). If someone prepares it for you, Part 5.',
          },
          options: [
            { value: 'yes', label: { es: 'Sí, leo inglés', en: 'Yes, I read English' } },
            { value: 'interpreter', label: { es: 'No, un intérprete me lo leerá', en: 'No, an interpreter will read it to me' } },
          ],
        },
      ],
    },
  ],
};
