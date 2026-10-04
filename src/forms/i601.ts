import type { Answers, Field, FormDefinition, Option } from './types';
import type { T } from '../i18n';
import { all, anyAddress, biographic, date, is, nameFields, rows, sexField, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';

// Questions follow USCIS Form I-601, Application for Waiver of Grounds of Inadmissibility,
// edition 01/20/25. The PDF mapping lives in src/pdf/i601Pdf.ts.
//
// Part 7 has no statement boxes, so the app asks whether an interpreter or preparer helped (the
// standard readsEnglish / preparer questions) to decide whether to fill Part 8 (interpreter) and
// Part 9 (preparer) from the shared assistance section.
//
// Out of scope (left blank, completed by hand or by others): the attorney/G-28 box at the top of
// page 1, every signature and date (Parts 7, 8 and 9), and Part 11 (Class A tuberculosis), which the local and state health departments and a physician
// complete and sign.

export const I601_EDITION = '01/20/25';

const t = (es: string, en: string): T => ({ es, en });

const text = (id: string, es: string, en: string, formRef: string, opts: Partial<Field> = {}): Field => ({ id, type: 'text', required: true, label: { es, en }, formRef, ...opts });
const long = (id: string, es: string, en: string, formRef: string, required = true): Field => ({ id, type: 'longText', required, label: { es, en }, formRef });

/** True when the multi-select answer `id` holds any of `values`. */
export const has =
  (id: string, ...values: string[]) =>
  (a: Answers) => {
    const v = a[id];
    return Array.isArray(v) && values.some((x) => v.includes(x));
  };

export interface Ground {
  /** The Part 4 item number. */
  item: string;
  label: T;
}

/** Part 4, Section A: immigrant visa, adjustment of status, or K or V visa (Items 1-18). */
export const GROUNDS_A: Ground[] = [
  { item: '1', label: t('Tengo una enfermedad contagiosa de importancia para la salud pública (por ejemplo, tuberculosis).', 'I have a communicable disease of public health significance.') },
  { item: '2', label: t('Pido no ponerme las vacunas porque van contra mis creencias religiosas o morales.', 'I seek an exemption from the vaccination requirement because vaccinations are against my religious beliefs or moral convictions.') },
  { item: '3', label: t('Tengo o tuve un trastorno físico o mental con conductas que han puesto o pueden poner en riesgo a mí o a otros.', 'I have or had a physical or mental disorder and behavior associated with it that has posed or may pose a threat to myself or others.') },
  { item: '4', label: t('Estuve involucrado/a en un delito de "bajeza moral" (por ejemplo, robo o fraude).', 'I have been involved in a crime of moral turpitude.') },
  { item: '5', label: t('Una sola falta por tener 30 gramos o menos de marihuana para uso propio.', 'Controlled substance violation: a single offense of simple possession of 30 grams or less of marijuana.') },
  { item: '6', label: t('Me condenaron por dos o más delitos con penas que suman cinco años o más.', 'I have been convicted of two or more offenses with combined sentences of five years or more.') },
  { item: '7', label: t('Vengo a ejercer la prostitución, o la ejercí en los últimos 10 años.', 'I am coming to engage in prostitution, or engaged in prostitution in the past 10 years.') },
  { item: '8', label: t('En los últimos 10 años conseguí o intenté conseguir personas para la prostitución.', 'In the past 10 years, I procured or attempted to procure persons for prostitution.') },
  { item: '9', label: t('Vengo o vine a participar en otro "vicio comercial" ilegal (por ejemplo, apuestas ilegales).', 'I came or am coming to engage in any other unlawful commercialized vice.') },
  { item: '10', label: t('Estuve involucrado/a en actividad criminal grave y pedí inmunidad para no ser procesado/a.', 'I have been involved in serious criminal activity and have asserted immunity from prosecution.') },
  { item: '11', label: t('Soy o fui miembro del partido comunista u otro partido totalitario.', 'I am or have been a member of or affiliated with the Communist or any other totalitarian party.') },
  { item: '12', label: t('Intenté obtener un beneficio migratorio con fraude o mintiendo sobre algo importante.', 'I have sought to procure an immigration benefit by fraud or misrepresentation.') },
  { item: '13', label: t('Ayudé a alguien a entrar ilegalmente a EE.UU. (tráfico de personas).', 'I have been engaged in alien smuggling.') },
  { item: '14', label: t('Tengo una multa civil por una orden final por documentos falsos (INA 274C).', 'I am subject to a civil penalty for a final order for violation of INA section 274C.') },
  { item: '15', label: t('Estuve en EE.UU. sin permiso más de 180 días o más de un año y después salí (castigo de 3 o 10 años).', 'I am subject to the 3-year or 10-year bar because I was unlawfully present for more than 180 days or one year and then departed.') },
  { item: '16', label: t('Me deportaron antes (solo para casos NACARA o HRIFA; los demás usan el I-212).', 'I was previously removed (NACARA and HRIFA applicants only; others file Form I-212).') },
  { item: '17', label: t('Me deportaron o estuve más de un año sin permiso, salí y volví a entrar (o intenté) sin inspección (solo NACARA, HRIFA o VAWA).', 'I was ordered removed or unlawfully present for more than one year and then reentered or attempted to reenter without admission (NACARA, HRIFA, VAWA only).') },
  { item: '18', label: t('Otra causa', 'Other') },
];

/** Part 4, Section C: Temporary Protected Status (Items 20-39). */
export const GROUNDS_C: Ground[] = [
  { item: '20', label: t('Tengo una enfermedad contagiosa de importancia para la salud pública.', 'I have a communicable disease of public health significance.') },
  { item: '21', label: t('Tengo o tuve un trastorno físico o mental con conductas que han puesto o pueden poner en riesgo a mí o a otros.', 'I have or had a physical or mental disorder with associated harmful behavior.') },
  { item: '22', label: t('Soy o fui adicto/a o abusé de drogas.', 'I am or have been a drug abuser or drug addict.') },
  { item: '23', label: t('Una sola falta por tener 30 gramos o menos de marihuana para uso propio.', 'Controlled substance violation: a single offense of simple possession of 30 grams or less of marijuana.') },
  { item: '24', label: t('Vengo a ejercer la prostitución, o la ejercí en los últimos 10 años.', 'I am coming to engage in prostitution, or engaged in prostitution in the past 10 years.') },
  { item: '25', label: t('En los últimos 10 años conseguí o intenté conseguir personas para la prostitución.', 'In the past 10 years, I procured or attempted to procure persons for prostitution.') },
  { item: '26', label: t('Vengo o vine a participar en otro "vicio comercial" ilegal.', 'I came or am coming to engage in any other unlawful commercialized vice.') },
  { item: '27', label: t('Estuve involucrado/a en actividad criminal grave y pedí inmunidad para no ser procesado/a.', 'I have been involved in serious criminal activity and have asserted immunity from prosecution.') },
  { item: '28', label: t('No fui o no me quedé en una audiencia de deportación.', 'I did not attend or remain at a removal proceeding.') },
  { item: '29', label: t('Intenté obtener un beneficio migratorio con fraude o mintiendo sobre algo importante.', 'I have sought to procure an immigration benefit by fraud or misrepresentation.') },
  { item: '30', label: t('Dije falsamente que era ciudadano/a de EE.UU.', 'I falsely represented myself as a U.S. citizen.') },
  { item: '31', label: t('Ayudé a alguien a entrar ilegalmente a EE.UU. (tráfico de personas).', 'I have been engaged in alien smuggling.') },
  { item: '32', label: t('Tengo una multa civil por una orden final por documentos falsos (INA 274C).', 'I am subject to a civil penalty for a final order for violation of INA section 274C.') },
  { item: '33', label: t('Salí o me quedé fuera de EE.UU. para evitar el servicio militar en tiempo de guerra.', 'I departed or remained outside the U.S. to avoid military service in time of war or national emergency.') },
  { item: '34', label: t('Practico o pienso practicar la poligamia en EE.UU.', 'I have practiced or intend to practice polygamy in the U.S.') },
  { item: '35', label: t('Acompaño a otra persona inadmisible que necesita mi protección o cuidado (INA 232(c)).', 'I am accompanying a helpless inadmissible alien who requires my protection or guardianship.') },
  { item: '36', label: t('Retuve fuera de EE.UU. a un niño con derecho a la ciudadanía, quitándoselo a quien tenía la custodia.', 'I have withheld custody of a U.S. citizen child outside the U.S. from a person granted custody.') },
  { item: '37', label: t('Voté ilegalmente en una elección.', 'I was an unlawful voter.') },
  { item: '38', label: t('Renuncié a la ciudadanía de EE.UU. para no pagar impuestos.', 'I am a former U.S. citizen who renounced citizenship to avoid taxation.') },
  { item: '39', label: t('Otra causa', 'Other') },
];

const groundOptions = (list: Ground[]): Option[] => list.map((g) => ({ value: g.item, label: g.label }));

/** Follow-up screens: one per kind of ground, shown only when one of its items is selected. */
export interface GroundGroup {
  key: string;
  items: string[];
  /** English heading for the Item 40 statement. */
  heading: string;
  question: T;
  why: T;
  legal: boolean;
}

export const GROUND_GROUPS: GroundGroup[] = [
  {
    key: 'health',
    items: ['1', '2', '3', '20', '21', '22'],
    heading: 'Health-related grounds',
    question: t('Su condición de salud', 'Your health condition'),
    why: t('Diga cuál es la condición, la fecha del diagnóstico y el tratamiento. Si es tuberculosis Clase A, también se llena la Parte 11 con el departamento de salud.', 'Name the condition, the date of diagnosis and the treatment. For Class A tuberculosis, Part 11 is also completed with the health department.'),
    legal: false,
  },
  {
    key: 'crime',
    items: ['4', '5', '6', '10', '23', '27'],
    heading: 'Criminal grounds',
    question: t('Sus antecedentes penales', 'Your criminal history'),
    why: t('Para cada caso: qué pasó, fecha y lugar, el cargo, el resultado (condena, sentencia, caso cerrado) y si cumplió la pena.', 'For each case: what happened, date and place, the charge, the outcome (conviction, sentence, dismissal) and whether you completed the sentence.'),
    legal: true,
  },
  {
    key: 'vice',
    items: ['7', '8', '9', '24', '25', '26'],
    heading: 'Prostitution and commercialized vice',
    question: t('Prostitución o vicio comercial', 'Prostitution or commercialized vice'),
    why: t('Diga qué pasó, cuándo y dónde. Si fue víctima de trata o la obligaron, dígalo: puede haber otras protecciones.', 'Say what happened, when and where. If you were trafficked or forced, say so: other protections may apply.'),
    legal: true,
  },
  {
    key: 'fraud',
    items: ['12', '29', '30'],
    heading: 'Fraud, misrepresentation or false claim to U.S. citizenship',
    question: t('Fraude o información falsa', 'Fraud or false information'),
    why: t('Diga qué dijo o presentó, ante quién, cuándo y por qué.', 'Say what you said or submitted, to whom, when and why.'),
    legal: true,
  },
  {
    key: 'smuggling',
    items: ['13', '14', '31', '32'],
    heading: 'Alien smuggling or document fraud civil penalty',
    question: t('Tráfico de personas o multa por documentos', 'Smuggling or document penalty'),
    why: t('Diga a quién ayudó (por ejemplo, su esposo/a o hijo/a), cuándo y dónde, o los datos de la multa.', 'Say whom you helped (for example, your spouse or child), when and where, or the details of the penalty.'),
    legal: true,
  },
  {
    key: 'presence',
    items: ['15'],
    heading: 'Unlawful presence',
    question: t('Su tiempo sin permiso en EE.UU.', 'Your unlawful presence'),
    why: t('Diga desde cuándo hasta cuándo estuvo sin permiso y la fecha en que salió de EE.UU.', 'Give the dates you were unlawfully present and the date you departed the U.S.'),
    legal: false,
  },
  {
    key: 'removal',
    items: ['16', '17', '28'],
    heading: 'Prior removal, reentry or failure to attend proceedings',
    question: t('Deportación o reingreso', 'Removal or reentry'),
    why: t('Fechas de la deportación, de la salida y de cada reingreso, o de la audiencia a la que no fue y por qué.', 'Dates of the removal, departure and each reentry, or of the hearing you missed and why.'),
    legal: true,
  },
  {
    key: 'misc',
    items: ['11', '33', '34', '35', '36', '37', '38'],
    heading: 'Other listed grounds',
    question: t('Explique la causa', 'Explain the ground'),
    why: t('Diga qué pasó, cuándo y dónde.', 'Say what happened, when and where.'),
    legal: true,
  },
];

const benefitIs = (v: string) => is('benefit', v);
/** A ground was selected in the section that matches the benefit. */
export const groundSelected =
  (...items: string[]) =>
  (a: Answers) =>
    (a.benefit === 'A' && has('groundsA', ...items)(a)) || (a.benefit === 'C' && has('groundsC', ...items)(a));

const RELATIONSHIP: Option[] = [
  { value: 'spouse', label: t('Esposo/a', 'Spouse') },
  { value: 'parent', label: t('Padre o madre', 'Parent') },
  { value: 'child', label: t('Hijo/a', 'Son or daughter') },
  { value: 'fiance', label: t('Prometido/a (visa K)', 'Fiancé(e) (K visa)') },
];
const STATUS: Option[] = [
  { value: 'citizen', label: t('Ciudadano/a de EE.UU.', 'U.S. citizen') },
  { value: 'lpr', label: t('Residente permanente', 'Lawful permanent resident') },
];

const relativeContact = (p: string, ref: string): Field[] => [
  { id: `${p}.phone`, type: 'phone', label: { es: 'Teléfono (si tiene)', en: 'Daytime phone (if any)' }, formRef: `${ref} · Item 3` },
  { id: `${p}.email`, type: 'email', label: { es: 'Correo electrónico (si tiene)', en: 'Email (if any)' }, formRef: `${ref} · Item 4` },
];

const qualifyingFields = (i: number): Field[] => {
  const p = `qualifying${i}`;
  const ref = i === 1 ? 'Part 5' : 'Part 10 (Part 5)';
  return [
    ...nameFields(p, `${ref} · Item 1`),
    ...anyAddress(p, `${ref} · Item 2`),
    ...relativeContact(p, ref),
    { id: `${p}.relationship`, type: 'select', required: true, label: { es: 'Esa persona es su…', en: 'This person is your' }, formRef: `${ref} · Item 5`, options: RELATIONSHIP },
    { id: `${p}.status`, type: 'select', required: true, label: { es: 'Su estatus migratorio', en: 'Their immigration status' }, formRef: `${ref} · Item 6`, options: STATUS },
    { id: `${p}.aNumber`, type: 'aNumber', label: { es: 'Su A-Number (si tiene)', en: 'Their A-Number (if any)' }, formRef: `${ref} · Item 7` },
    date(`${p}.dob`, 'Su fecha de nacimiento', 'Their date of birth', `${ref} · Item 8`),
  ];
};

const otherRelativeFields = (i: number): Field[] => {
  const p = `otherRelative${i}`;
  const ref = i === 1 ? 'Part 6' : 'Part 10 (Part 6)';
  return [
    ...nameFields(p, `${ref} · Item 1`),
    ...anyAddress(p, `${ref} · Item 2`),
    ...relativeContact(p, ref),
    text(`${p}.relationship`, 'Esa persona es su… (en inglés)', 'Relationship to you', `${ref} · Item 5`, { placeholder: 'Brother' }),
    text(`${p}.status`, 'Su estatus migratorio (en inglés)', 'Their immigration status', `${ref} · Item 6`, { placeholder: 'U.S. citizen' }),
    { id: `${p}.aNumber`, type: 'aNumber', label: { es: 'Su A-Number (si tiene)', en: 'Their A-Number (if any)' }, formRef: `${ref} · Item 7` },
    date(`${p}.dob`, 'Su fecha de nacimiento', 'Their date of birth', `${ref} · Item 8`, false),
  ];
};

const notSij = (a: Answers) => !!a.benefit && a.benefit !== 'B';

export const i601: FormDefinition = {
  id: 'i-601',
  number: 'I-601',
  edition: I601_EDITION,
  title: t('Perdón de causas de inadmisibilidad', 'Application for Waiver of Grounds of Inadmissibility'),
  summary: {
    es: 'Pida perdón por algo que le impide recibir la residencia, una visa o el TPS: presencia ilegal, ciertos delitos, fraude migratorio, salud y otras causas.',
    en: 'Ask to forgive something that bars you from a green card, a visa or TPS: unlawful presence, certain crimes, immigration fraud, health and other grounds.',
  },
  intro: {
    es: 'El I-601 es para quien pide la residencia, una visa de inmigrante, una visa K o V, o el TPS y tiene una "causa de inadmisibilidad": algo de su pasado (o de su salud) que la ley dice que le impide entrar o quedarse. Casi siempre debe demostrar que su esposo/a, padre/madre (o a veces hijo/a) ciudadano o residente sufriría "dificultades extremas" si a usted le niegan el beneficio. Es un caso legal complicado y algunas causas no se pueden perdonar: hable con un abogado de inmigración o un representante acreditado antes de presentar.',
    en: 'Form I-601 is for people applying for a green card, an immigrant visa, a K or V visa, or TPS who have a "ground of inadmissibility": something in their past (or health) that the law says bars them. Usually you must show that your U.S. citizen or resident spouse, parent (or sometimes child) would suffer "extreme hardship" if you were refused. It is a complicated legal case and some grounds cannot be waived: talk to an immigration attorney or accredited representative before filing.',
  },
  minutes: 60,
  pdf: {
    path: 'forms/i-601.pdf',
    fileName: 'I-601-filled.pdf',
    load: () => import('../pdf/i601Pdf').then((m) => m.fillI601),
    signHere: { es: 'Parte 7, Ítem 4.a', en: 'Part 7, Item 4.a' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-601 que la edición {edition} sigue vigente, revise la tarifa y a qué oficina se envía en su caso (puede ser distinta si está fuera de EE.UU. o en corte).',
      'Adjunte prueba del estatus de su familiar (acta de nacimiento, naturalización o tarjeta de residente), prueba del parentesco (acta de matrimonio o nacimiento) y prueba de las dificultades extremas: cartas médicas, comprobantes de ingresos y deudas, cartas de apoyo, información del país.',
      'Si tiene arrestos o condenas, adjunte copias certificadas de los registros de la corte con el resultado de cada caso. Si es por salud, adjunte los informes médicos que piden las instrucciones.',
      'Imprima el PDF y firme la Parte 7, Ítem 4.a, a mano con tinta negra. Si un intérprete o preparador le ayudó, sus datos ya están en las Partes 8 y 9; ellos las revisan y las firman y fechan a mano. Si la app agregó hojas al final de la Parte 10, firme y feche cada hoja.',
      'Si hay tuberculosis Clase A, la Parte 11 la completan y firman el médico y los departamentos de salud.',
      'Revise todo con un abogado o representante acreditado antes de enviarlo: un error puede causar la negación del perdón y de su caso.',
    ],
    en: [
      'Check at uscis.gov/i-601 that edition {edition} is still current, and check the fee and where to file in your case (it can differ if you are abroad or in court).',
      'Attach proof of your relative’s status (birth certificate, naturalization or green card), proof of the relationship (marriage or birth certificate) and proof of extreme hardship: medical letters, income and debt records, support letters, country information.',
      'If you have arrests or convictions, attach certified court records with the outcome of each case. For health grounds, attach the medical reports the instructions ask for.',
      'Print the PDF and sign Part 7, Item 4.a, by hand in black ink. If an interpreter or preparer helped you, their details are already in Parts 8 and 9; they review them and sign and date by hand. If the app added sheets after Part 10, sign and date each sheet.',
      'For Class A tuberculosis, Part 11 is completed and signed by the physician and the health departments.',
      'Review everything with an attorney or accredited representative before mailing: a mistake can lead to denial of the waiver and of your case.',
    ],
  },
  sections: [
    {
      id: 'benefit',
      part: 'Part 4',
      title: t('Su caso', 'Your case'),
      questions: [
        {
          id: 'benefit',
          kind: 'choice',
          formRef: 'Part 4 · Sections A–C',
          question: t('¿Qué beneficio está pidiendo?', 'Which immigration benefit are you seeking?'),
          notice: {
            tone: 'legal',
            title: t('Hable con un abogado antes de seguir', 'Talk to an attorney before you go on'),
            body: t(
              'El I-601 es un caso legal serio. Algunas causas no se pueden perdonar, otras necesitan otro formulario (como el I-212 o el I-601A), y lo que escriba aquí puede usarse en su contra. Esta app le ayuda a llenar el formulario, pero no le dice si califica. Consulte a un abogado de inmigración o a un representante acreditado por el Departamento de Justicia; nunca a un "notario".',
              'Form I-601 is a serious legal case. Some grounds cannot be waived, others need a different form (such as Form I-212 or I-601A), and what you write here can be used against you. This app helps you fill out the form, but it does not tell you whether you qualify. Consult an immigration attorney or a DOJ-accredited representative, never a "notario".',
            ),
          },
          options: [
            { value: 'A', label: t('Residencia (ajuste de estatus) o visa de inmigrante, o visa K o V', 'Immigrant visa or adjustment of status, or K or V nonimmigrant status') },
            { value: 'B', label: t('Residencia basada en una visa T o como Joven Inmigrante Especial (SIJ)', 'Adjustment of status based on T nonimmigrant status or Special Immigrant Juvenile classification') },
            { value: 'C', label: t('Estatus de Protección Temporal (TPS)', 'Temporary Protected Status (TPS)') },
          ],
        },
        {
          id: 'process',
          kind: 'choice',
          formRef: 'Part 1 · Items 15–16',
          showIf: benefitIs('A'),
          question: t('¿Dónde se hará su trámite?', 'Where is your case being processed?'),
          options: [
            { value: 'adjust', label: t('En EE.UU. (ajuste de estatus con el I-485)', 'In the U.S. (adjustment of status, Form I-485)') },
            { value: 'visa', label: t('En un consulado de EE.UU. en el extranjero (visa de inmigrante, K o V)', 'At a U.S. consulate abroad (immigrant, K or V visa)') },
          ],
        },
        {
          id: 'consulate',
          kind: 'fields',
          formRef: 'Part 1 · Items 15.a–15.b',
          showIf: all(benefitIs('A'), is('process', 'visa')),
          question: t('Su caso en el consulado', 'Your consular case'),
          why: t('Si ya tuvo la entrevista, el número de caso aparece en la carta del consulado.', 'If you were already interviewed, the case number is on the consulate’s letter.'),
          fields: [
            text('consulate.caseNumber', 'Número de caso del Departamento de Estado (si tiene)', 'DOS consular case number (if available)', 'Part 1 · Item 15.a', { required: false, placeholder: 'CDJ2025123456' }),
            text('consulate.city', 'Ciudad del consulado', 'Consulate city', 'Part 1 · Item 15.b', { placeholder: 'Ciudad Juarez' }),
            text('consulate.country', 'País del consulado', 'Consulate country', 'Part 1 · Item 15.b', { placeholder: 'Mexico' }),
          ],
        },
        {
          id: 'groundsA',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 4 · Section A · Items 1–18',
          showIf: benefitIs('A'),
          question: t('¿Qué causas de inadmisibilidad le aplican?', 'Which grounds of inadmissibility apply to you?'),
          why: t('Marque todas las que usted cree, o le dijeron, que le aplican. Si no está seguro/a, pregúntele a su abogado.', 'Select every ground you believe, or were told, applies to you. If you are not sure, ask your attorney.'),
          notice: {
            tone: 'legal',
            title: t('Diga siempre la verdad', 'Always tell the truth'),
            body: t(
              'Ocultar una causa es fraude y puede impedirle inmigrar para siempre. Si tiene arrestos o condenas, necesitará los registros certificados de la corte. Para una deportación previa normalmente se usa el I-212, no este formulario.',
              'Hiding a ground is fraud and can bar you permanently. If you have arrests or convictions, you will need certified court records. A prior removal is usually waived with Form I-212, not this form.',
            ),
          },
          options: groundOptions(GROUNDS_A),
        },
        {
          id: 'groundsB',
          kind: 'fields',
          formRef: 'Part 4 · Section B · Item 19',
          showIf: benefitIs('B'),
          question: t('¿Qué causas de inadmisibilidad le aplican?', 'Which grounds of inadmissibility apply to you?'),
          notice: {
            tone: 'legal',
            title: t('Consulte a un abogado', 'Talk to an attorney'),
            body: t('Las visas T y los casos SIJ tienen reglas propias de perdón. Su abogado puede decirle qué causas mencionar.', 'T visa and SIJ cases have their own waiver rules. Your attorney can tell you which grounds to list.'),
          },
          fields: [
            text('groundsB.specify', 'Las causas, en pocas palabras (en inglés)', 'The grounds, briefly', 'Part 4 · Item 19', { placeholder: 'INA 212(a)(6)(C)(i)' }),
            long('groundsB.explain', 'Qué pasó, cuándo y dónde (en inglés)', 'What happened, when and where', 'Part 4 · Item 40'),
          ],
        },
        {
          id: 'groundsC',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 4 · Section C · Items 20–39',
          showIf: benefitIs('C'),
          question: t('¿Qué causas de inadmisibilidad le aplican?', 'Which grounds of inadmissibility apply to you?'),
          why: t('Marque todas las que usted cree, o le dijeron, que le aplican.', 'Select every ground you believe, or were told, applies to you.'),
          notice: {
            tone: 'legal',
            title: t('Diga siempre la verdad', 'Always tell the truth'),
            body: t('Ocultar una causa es fraude. Algunas causas no se pueden perdonar para el TPS: revíselo con un abogado.', 'Hiding a ground is fraud. Some grounds cannot be waived for TPS: review it with an attorney.'),
          },
          options: groundOptions(GROUNDS_C),
        },
        ...GROUND_GROUPS.map((g) => ({
          id: `ground.${g.key}`,
          kind: 'fields' as const,
          formRef: 'Part 4 · Item 40 · Your Inadmissibility Statement',
          showIf: groundSelected(...g.items),
          question: g.question,
          why: g.why,
          ...(g.legal
            ? {
                notice: {
                  tone: 'legal' as const,
                  title: t('Consulte a un abogado', 'Talk to an attorney'),
                  body: t(
                    'Lo que escriba aquí lo leerá un oficial y puede tener consecuencias. Revíselo con un abogado y adjunte los documentos de cada caso.',
                    'An officer will read what you write here and it can have consequences. Review it with an attorney and attach the records for each case.',
                  ),
                },
              }
            : {}),
          fields: [long(`ground.${g.key}.explain`, 'Su explicación con fechas (en inglés)', 'Your explanation, with dates', 'Part 4 · Item 40')],
        })),
        {
          id: 'ground.other',
          kind: 'fields',
          formRef: 'Part 4 · Items 18 and 39 · Item 40',
          showIf: groundSelected('18', '39'),
          question: t('La otra causa', 'The other ground'),
          fields: [
            text('ground.other.specify', 'Cuál es (en inglés)', 'Specify', 'Part 4 · Item 18 / 39', { maxLength: 120 }),
            long('ground.other.explain', 'Qué pasó, cuándo y dónde (en inglés)', 'What happened, when and where', 'Part 4 · Item 40'),
          ],
        },
      ],
    },
    {
      id: 'about',
      part: 'Part 1',
      title: t('Sus datos', 'About you'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 1 · Items 1–3',
          question: t('¿Cuál es su nombre completo?', 'What is your full name?'),
          fields: [
            ...nameFields('name', 'Part 1 · Item 3'),
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 1 · Item 1' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Cuenta en línea de USCIS (si tiene)', en: 'USCIS online account (if any)' }, formRef: 'Part 1 · Item 2' },
          ],
        },
        { id: 'otherName.more0', kind: 'choice', formRef: 'Part 1 · Item 4', question: t('¿Ha usado otros nombres (de soltera, apodos, alias)?', 'Have you used other names (maiden names, aliases, nicknames)?'), options: yesNo },
        ...rows({
          max: 2,
          id: 'otherName',
          first: is('otherName.more0', 'yes'),
          question: (i) => (i === 1 ? t('Otro nombre', 'Another name') : t('Otro nombre más', 'One more name')),
          more: t('¿Ha usado otro nombre más?', 'Another name?'),
          formRef: 'Part 1 · Item 4 · Part 10',
          fields: (i) => nameFields(`otherName${i}`, i === 1 ? 'Part 1 · Item 4' : 'Part 10', i === 1),
          why: (i) => (i === 2 ? t('Este va a la Parte 10.', 'This one goes in Part 10.') : undefined),
          overflow: t('Si son más de 2, escríbalos a mano en una hoja aparte.', 'If there are more than 2, write them by hand on a separate sheet.'),
        }),
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 1 · Items 5.a–5.i · Mailing Address',
          question: t('¿A qué dirección le llega el correo?', 'What is your mailing address?'),
          why: t('Si está fuera de EE.UU., dé una dirección en EE.UU. si tiene; si no, la de su país.', 'If you are outside the U.S., give a U.S. mailing address if you have one; otherwise your address abroad.'),
          fields: anyAddress('mailing', 'Part 1 · Item 5', { careOf: true }),
        },
        { id: 'mailingSame', kind: 'choice', formRef: 'Part 1 · Item 6', question: t('¿Vive en esa misma dirección?', 'Do you live at that same address?'), options: yesNo },
        { id: 'home', kind: 'fields', formRef: 'Part 1 · Items 7.a–7.h · Physical Address', showIf: is('mailingSame', 'no'), question: t('¿Dónde vive?', 'Where do you live?'), fields: anyAddress('home', 'Part 1 · Item 7') },
        {
          id: 'personal',
          kind: 'fields',
          formRef: 'Part 1 · Items 8–14',
          question: t('Datos personales', 'Personal details'),
          fields: [
            { id: 'ssn', type: 'ssn', label: { es: 'Seguro Social (si tiene)', en: 'Social Security number (if any)' }, formRef: 'Part 1 · Item 8' },
            sexField('sex', 'Part 1 · Item 9'),
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 10'),
            text('birthCity', 'Ciudad de nacimiento', 'City or town of birth', 'Part 1 · Item 11'),
            text('birthProvince', 'Estado o provincia de nacimiento', 'Province of birth (if applicable)', 'Part 1 · Item 12', { required: false, placeholder: 'Michoacan' }),
            text('birthCountry', 'País de nacimiento', 'Country of birth', 'Part 1 · Item 13'),
            text('citizenship', 'País de ciudadanía', 'Country of citizenship or nationality', 'Part 1 · Item 14'),
          ],
        },
      ],
    },
    {
      id: 'otherForms',
      part: 'Part 1',
      title: t('Otras solicitudes', 'Other applications'),
      questions: [
        { id: 'i485Filed', kind: 'choice', formRef: 'Part 1 · Item 16.a', question: t('¿Ya presentó el I-485 (solicitud de residencia)?', 'Have you already filed Form I-485, Application to Register Permanent Residence or Adjust Status?'), options: yesNo },
        { id: 'i485', kind: 'fields', formRef: 'Part 1 · Item 16.b', showIf: is('i485Filed', 'yes'), question: t('Su I-485', 'Your Form I-485'), fields: [{ id: 'i485.receipt', type: 'receipt', required: true, label: { es: 'Número de recibo del I-485', en: 'Form I-485 receipt number' }, formRef: 'Part 1 · Item 16.b', placeholder: 'IOE0912345678' }] },
        { id: 'i821Filed', kind: 'choice', formRef: 'Part 1 · Item 17.a', question: t('¿Ya presentó el I-821 (solicitud de TPS)?', 'Have you already filed Form I-821, Application for Temporary Protected Status?'), options: yesNo },
        { id: 'i821', kind: 'fields', formRef: 'Part 1 · Item 17.b', showIf: is('i821Filed', 'yes'), question: t('Su I-821', 'Your Form I-821'), fields: [{ id: 'i821.receipt', type: 'receipt', label: { es: 'Número de recibo del I-821 (si tiene)', en: 'Form I-821 receipt number (if any)' }, formRef: 'Part 1 · Item 17.b' }] },
        {
          id: 'i212Filed',
          kind: 'choice',
          formRef: 'Part 1 · Item 18.a',
          question: t('¿Alguna vez presentó el I-212 (permiso para volver a pedir entrada después de una deportación)?', 'Have you previously filed Form I-212, Application for Permission to Reapply for Admission After Deportation or Removal?'),
          options: yesNo,
        },
        {
          id: 'i212Info',
          kind: 'fields',
          formRef: 'Part 1 · Items 18.b–18.d',
          showIf: is('i212Filed', 'yes'),
          question: t('Su I-212 anterior', 'Your earlier Form I-212'),
          fields: [
            { id: 'i212.receipt', type: 'receipt', label: { es: 'Número de recibo (si tiene)', en: 'Receipt number (if any)' }, formRef: 'Part 1 · Item 18.b' },
            text('i212.location', 'Dónde lo presentó (oficina de USCIS, puerto de entrada, corte)', 'Where you filed it (USCIS office, port of entry, immigration court)', 'Part 1 · Item 18.c'),
            date('i212.date', 'Fecha en que lo presentó', 'Date filed', 'Part 1 · Item 18.d'),
          ],
        },
        {
          id: 'i212WithThis',
          kind: 'choice',
          formRef: 'Part 1 · Item 19',
          question: t('¿Va a enviar un I-212 junto con esta solicitud?', 'Are you submitting Form I-212 along with this application?'),
          why: t('Se necesita si lo deportaron o salió con una orden de deportación. Pregúntele a su abogado.', 'It is needed if you were removed or left under a removal order. Ask your attorney.'),
          options: yesNo,
        },
      ],
    },
    {
      id: 'entries',
      part: 'Part 2',
      title: t('Entradas a EE.UU.', 'U.S. entries'),
      questions: [
        { id: 'everInUS', kind: 'choice', formRef: 'Part 2', question: t('¿Alguna vez ha estado en EE.UU.?', 'Have you ever been in the United States?'), options: yesNo },
        {
          id: 'lastEntry',
          kind: 'fields',
          formRef: 'Part 2 · Items 1.a–1.d · Most recent arrival',
          showIf: is('everInUS', 'yes'),
          question: t('Su última llegada a EE.UU.', 'Your most recent arrival in the U.S.'),
          why: t('Si entró sin pasar por inspección, ponga el lugar aproximado y "EWI" (entry without inspection) como estatus.', 'If you entered without inspection, give the approximate place and "EWI" as the status.'),
          fields: [
            date('lastEntry.date', 'Fecha de entrada (aproximada)', 'Date you entered (on or about)', 'Part 2 · Item 1.a'),
            text('lastEntry.status', 'Estatus al entrar', 'Immigration status at the time of entry', 'Part 2 · Item 1.b', { placeholder: 'EWI' }),
            text('lastEntry.place', 'Lugar por donde entró', 'Location where you entered', 'Part 2 · Item 1.c', { placeholder: 'San Ysidro, CA' }),
            text('lastEntry.city', 'Ciudad de EE.UU. donde vivió', 'U.S. city or town where you lived', 'Part 2 · Item 1.d', { placeholder: 'Los Angeles, CA' }),
          ],
        },
        { id: 'prevEntry.more0', kind: 'choice', formRef: 'Part 2 · Items 2.a–2.e', showIf: is('everInUS', 'yes'), question: t('¿Estuvo en EE.UU. antes de esa llegada?', 'Were you in the U.S. before that arrival?'), options: yesNo },
        ...rows({
          max: 1,
          id: 'prevEntry',
          first: all(is('everInUS', 'yes'), is('prevEntry.more0', 'yes')),
          question: () => t('Su estadía anterior', 'Your previous stay'),
          more: t('¿Hubo otra estadía antes de esa?', 'Another stay before that one?'),
          formRef: 'Part 2 · Items 2.a–2.e',
          fields: () => [
            date('prevEntry1.from', 'Fecha en que entró', 'Date you entered', 'Part 2 · Item 2.a'),
            date('prevEntry1.to', 'Fecha en que salió', 'Date you departed', 'Part 2 · Item 2.b'),
            text('prevEntry1.status', 'Estatus al entrar', 'Immigration status at the time of reentry', 'Part 2 · Item 2.c', { placeholder: 'B-2 visitor' }),
            text('prevEntry1.place', 'Lugar por donde entró', 'Location where you entered', 'Part 2 · Item 2.d'),
            text('prevEntry1.city', 'Ciudad de EE.UU. donde vivió', 'U.S. city or town where you lived', 'Part 2 · Item 2.e'),
          ],
          overflow: t('Si contesta Sí, la app le pide las demás estadías para la Parte 10.', 'If you answer Yes, the app asks for the other stays for Part 10.'),
        }),
        {
          id: 'otherEntriesExplain',
          kind: 'fields',
          formRef: 'Part 2 · Part 10',
          showIf: all(is('everInUS', 'yes'), is('prevEntry.more0', 'yes'), is('prevEntry.more1', 'yes')),
          question: t('Las demás estadías', 'The other stays'),
          fields: [long('otherEntries.explain', 'Fechas de entrada y salida, estatus, lugar de entrada y ciudad donde vivió, para cada una (en inglés)', 'Dates entered and departed, status, place of entry and city where you lived, for each one', 'Part 10')],
        },
      ],
    },
    { id: 'biographic', part: 'Part 3', title: t('Datos físicos', 'Biographic information'), questions: biographic('Part 3') },
    {
      id: 'relatives',
      part: 'Part 5',
      title: t('Sus familiares', 'Your qualifying relatives'),
      questions: [
        {
          id: 'vawa',
          kind: 'choice',
          formRef: 'Part 5 · VAWA box',
          showIf: benefitIs('A'),
          question: t('¿Es usted una víctima que se auto-peticionó por VAWA y quiere demostrar dificultades extremas para usted mismo/a?', 'Are you a VAWA self-petitioner claiming extreme hardship to yourself?'),
          why: t('VAWA es para víctimas de abuso por parte de un esposo/a, padre/madre o hijo/a ciudadano o residente.', 'VAWA is for victims of abuse by a U.S. citizen or resident spouse, parent or child.'),
          options: yesNo,
        },
        {
          id: 'qualifying.more0',
          kind: 'choice',
          formRef: 'Part 5 · Items 1.a–8',
          showIf: notSij,
          question: t('¿Tiene un familiar ciudadano o residente que sufriría dificultades extremas si le niegan el beneficio?', 'Do you have a U.S. citizen or resident relative who would suffer extreme hardship if you are refused?'),
          why: t('Depende de la causa: casi siempre es su esposo/a o padre/madre; para algunas causas también cuentan los hijos o el prometido/a. Su abogado le dirá quién cuenta.', 'It depends on the ground: usually your spouse or parent; for some grounds, children or a fiancé(e) count too. Your attorney can tell you who counts.'),
          options: yesNo,
        },
        ...rows({
          max: 2,
          id: 'qualifying',
          first: all(notSij, is('qualifying.more0', 'yes')),
          question: (i) => (i === 1 ? t('Su familiar calificado', 'Your qualifying relative') : t('Otro familiar calificado', 'Another qualifying relative')),
          why: (i) => (i === 2 ? t('Este va a la Parte 10, y la app marca la casilla de familiares adicionales.', 'This one goes in Part 10, and the app selects the additional relatives box.') : undefined),
          more: t('¿Tiene otro familiar calificado?', 'Do you have another qualifying relative?'),
          formRef: 'Part 5 · Items 1.a–8',
          fields: qualifyingFields,
          overflow: t('Si son más de 2, escriba los demás a mano en una hoja aparte con los mismos datos.', 'If there are more than 2, write the others by hand on a separate sheet with the same information.'),
        }),
        {
          id: 'hardship',
          kind: 'fields',
          formRef: 'Part 5 · Item 9 · Statement From Applicant (Extreme Hardship)',
          showIf: notSij,
          question: t('¿Qué dificultades extremas sufriría su familiar?', 'What extreme hardship would your relative suffer?'),
          why: t(
            'Explique qué le pasaría a su familiar (o a usted, si es VAWA) si a usted le niegan el beneficio, tanto si se queda en EE.UU. sin usted como si se va con usted: salud, dinero, hijos, trabajo, estudios, peligros en su país. Escriba en inglés. Si es largo, la app lo pasa a la Parte 10.',
            'Explain what would happen to your relative (or to you, if VAWA) if you were refused, both if they stay in the U.S. without you and if they move with you: health, finances, children, work, education, danger in your country. Write in English. If it is long, the app moves it to Part 10.',
          ),
          fields: [long('hardship.statement', 'Su declaración (en inglés)', 'Your statement', 'Part 5 · Item 9')],
        },
      ],
    },
    {
      id: 'discretion',
      part: 'Part 6',
      title: t('Otros familiares y por qué merece el perdón', 'Other relatives and why you deserve the waiver'),
      questions: [
        {
          id: 'otherRelative.more0',
          kind: 'choice',
          formRef: 'Part 6 · Items 1.a–8',
          question: t('¿Tiene otros familiares en EE.UU. que quiere que USCIS tome en cuenta (hermanos, hijos, abuelos…)?', 'Do you have other relatives with ties to the U.S. you would like USCIS to consider (siblings, children, grandparents…)?'),
          options: yesNo,
        },
        ...rows({
          max: 2,
          id: 'otherRelative',
          first: is('otherRelative.more0', 'yes'),
          question: (i) => (i === 1 ? t('Su familiar', 'Your relative') : t('Otro familiar', 'Another relative')),
          why: (i) => (i === 2 ? t('Este va a la Parte 10, y la app marca la casilla de otros familiares.', 'This one goes in Part 10, and the app selects the other relatives box.') : undefined),
          more: t('¿Tiene otro familiar que quiera mencionar?', 'Another relative to list?'),
          formRef: 'Part 6 · Items 1.a–8',
          fields: otherRelativeFields,
          overflow: t('Si son más de 2, escriba los demás a mano en una hoja aparte.', 'If there are more than 2, write the others by hand on a separate sheet.'),
        }),
        {
          id: 'discretionStatement',
          kind: 'fields',
          formRef: 'Part 6 · Item 9 · Statement From Applicant (Discretion)',
          question: t('¿Por qué merece que le aprueben el perdón?', 'Why should your waiver be approved as a matter of discretion?'),
          why: t(
            'Cuente lo bueno de su vida que pesa más que lo malo: años en EE.UU., familia, trabajo, impuestos pagados, iglesia o comunidad, arrepentimiento y cambios desde lo que pasó. Escriba en inglés. Si es largo, la app lo pasa a la Parte 10.',
            'Describe the favorable factors that outweigh the unfavorable ones: years in the U.S., family, work, taxes paid, church or community, remorse and rehabilitation. Write in English. If it is long, the app moves it to Part 10.',
          ),
          fields: [long('discretion.statement', 'Su declaración (en inglés)', 'Your statement', 'Part 6 · Item 9')],
        },
      ],
    },
    {
      id: 'contact',
      part: 'Part 7',
      title: t('Declaración y contacto', 'Statement and contact'),
      questions: [
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: "Part 7 · Applicant's Certification",
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          why: t('Si un intérprete se lo lee, sus datos van en la Parte 8.', 'If an interpreter reads it to you, their details go in Part 8.'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leerá', 'No, an interpreter will read it to me') },
          ],
        },
        {
          id: 'interpreterLanguage',
          kind: 'fields',
          formRef: "Part 7 · Applicant's Certification",
          showIf: is('readsEnglish', 'B'),
          question: t('¿En qué idioma se lo leerán?', 'What language will it be read in?'),
          fields: [{ id: 'fluentLanguage', type: 'text', required: true, label: t('Idioma', 'Language'), formRef: "Part 7 · Applicant's Certification", placeholder: 'Spanish' }],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 9 · Preparer',
          question: t('¿Alguien más (no usted) preparó esta solicitud?', 'Did someone else prepare this application for you?'),
          why: t('Si es así, al final le pediremos sus datos para la Parte 9; esa persona la firma a mano.', 'If so, we ask for their details for Part 9 at the end; that person signs it by hand.'),
          options: yesNo,
        },
        {
          id: 'preparerName',
          kind: 'fields',
          formRef: 'Part 9 · Preparer',
          showIf: is('preparer', 'yes'),
          question: t('¿Quién la preparó?', 'Who prepared it?'),
          fields: [{ id: 'preparer.name', type: 'text', required: true, label: t('Nombre del preparador', 'Preparer’s name'), formRef: 'Part 9 · Preparer' }],
        },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 7 · Items 1–3',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          notice: {
            tone: 'info',
            title: t('Su firma', 'Your signature'),
            body: t(
              'Al firmar la Parte 7 usted declara bajo pena de perjurio que todo es verdad. Si un intérprete le leyó el formulario o alguien lo preparó, ellos firman a mano las Partes 8 y 9.',
              'By signing Part 7 you declare under penalty of perjury that everything is true. If an interpreter read the form to you or someone prepared it, they sign Parts 8 and 9 by hand.',
            ),
          },
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 7 · Item 1', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 7 · Item 2' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 7 · Item 3', maxLength: 38 },
          ],
        },
      ],
    },
    assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 8', preparerPart: 'Part 9', address: false, statement: false }),
  ],
};
