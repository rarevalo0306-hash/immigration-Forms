import type { Answers, Field, FormDefinition, Option, YesNoItem } from './types';
import type { T } from '../i18n';
import { all, biographic, date, is, nameFields, rows, sexField, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';

// Questions follow USCIS Form I-601A, Application for Provisional Unlawful Presence Waiver,
// edition 01/20/25. Parts 7 and 8 (interpreter and preparer) come from the shared assistance section;
// every signature and date is left for hand. The PDF mapping lives in src/pdf/i601aPdf.ts.

export const I601A_EDITION = '01/20/25';

const t = (es: string, en: string): T => ({ es, en });

const text = (id: string, es: string, en: string, formRef: string, opts: Partial<Field> = {}): Field => ({ id, type: 'text', required: true, label: { es, en }, formRef, ...opts });

/** A U.S. address: this form asks only for U.S. addresses. */
const usAddress = (prefix: string, ref: string, careOf = false): Field[] => [
  ...(careOf ? [text(`${prefix}.careOf`, 'A cargo de (si recibe correo en casa de otra persona)', 'In care of', `${ref} · In Care Of Name`, { required: false, maxLength: 34 })] : []),
  text(`${prefix}.street`, 'Número y calle', 'Street number and name', `${ref} · Street Number and Name`, { maxLength: 34, placeholder: '1234 Main St' }),
  { id: `${prefix}.unit`, type: 'unit', label: { es: 'Apartamento, suite o piso', en: 'Apt., suite or floor' }, formRef: `${ref} · Apt. Ste. Flr.`, placeholder: 'Apt 4B' },
  text(`${prefix}.city`, 'Ciudad', 'City or town', `${ref} · City or Town`, { maxLength: 20 }),
  { id: `${prefix}.state`, type: 'state', required: true, label: { es: 'Estado', en: 'State' }, formRef: `${ref} · State`, placeholder: 'CA' },
  { id: `${prefix}.zip`, type: 'zip', required: true, label: { es: 'Código postal', en: 'ZIP code' }, formRef: `${ref} · ZIP Code` },
];

const entryFields = (p: string, ref: string, items: [string, string, string, string], from: boolean): Field[] => [
  ...(from
    ? [date(`${p}.from`, 'Desde (aproximado)', 'From (on or about)', `${ref} · Item ${items[2]}`), date(`${p}.to`, 'Hasta (aproximado)', 'To (on or about)', `${ref} · Item ${items[3]}`)]
    : [date(`${p}.date`, 'Fecha de entrada (aproximada)', 'Date of entry (on or about)', `${ref} · Item ${items[2]}`)]),
  text(`${p}.place`, 'Lugar o puerto de entrada (ciudad aproximada)', 'Place or port of entry (city)', `${ref} · Item ${items[0]}`, { placeholder: 'Nogales' }),
  { id: `${p}.state`, type: 'state', label: { es: 'Estado', en: 'State' }, formRef: `${ref} · Item ${items[1]}`, placeholder: 'AZ' },
  text(`${p}.status`, 'Estatus al entrar', 'Immigration status at the time of entry', `${ref} · Item ${items[3]}`, { placeholder: 'EWI' }),
];

/** Part 1, Items 32-45. */
export const BACKGROUND_ITEMS: YesNoItem[] = [
  { id: 'p1.32', formRef: 'Part 1 · Item 32', label: t('¿Alguna vez dio a sabiendas información falsa a un funcionario de EE.UU. para un beneficio migratorio o para entrar?', 'Have you EVER knowingly and willfully given false or misleading information to a U.S. Government official while applying for an immigration benefit or to gain entry?') },
  { id: 'p1.33', formRef: 'Part 1 · Item 33', label: t('¿Alguna vez participó en el tráfico de personas (ayudar a alguien a entrar ilegalmente)?', 'Have you EVER been engaged in alien smuggling?') },
  { id: 'p1.34', formRef: 'Part 1 · Item 34', label: t('¿Alguna vez lo arrestaron, citaron o detuvieron por algo que no sea una infracción de tránsito, en cualquier país?', 'Have you EVER been arrested, cited, or detained by a law enforcement officer for any reason other than traffic violations?') },
  { id: 'p1.35', formRef: 'Part 1 · Item 35', label: t('¿Alguna vez lo acusaron, condenaron o encarcelaron por un delito, en cualquier país?', 'Have you EVER been charged, indicted, convicted, imprisoned, or jailed for any crime or offense?') },
  { id: 'p1.36', formRef: 'Part 1 · Item 36', label: t('¿Ha traficado o trafica sustancias controladas?', 'Have you EVER trafficked or are you NOW trafficking in any controlled substance?') },
  { id: 'p1.37', formRef: 'Part 1 · Item 37', label: t('¿Ha ayudado o conspirado con otros en el tráfico de sustancias controladas?', 'Have you EVER knowingly assisted, abetted, conspired, or colluded with others in the trafficking of any controlled substance?') },
  { id: 'p1.38', formRef: 'Part 1 · Item 38', label: t('¿Ha participado en la prostitución?', 'Are you NOW or have you EVER been engaged in prostitution?') },
  { id: 'p1.39a', formRef: 'Part 1 · Item 39.a', label: t('¿Ha participado en tortura o genocidio?', 'Have you EVER participated in acts involving torture or genocide?') },
  { id: 'p1.39b', formRef: 'Part 1 · Item 39.b', label: t('¿…en matar a alguien?', '…killing any person?') },
  { id: 'p1.39c', formRef: 'Part 1 · Item 39.c', label: t('¿…en herir gravemente a alguien a propósito?', '…intentionally and severely injuring any person?') },
  { id: 'p1.39d', formRef: 'Part 1 · Item 39.d', label: t('¿…en contacto sexual con alguien obligado o amenazado?', '…sexual contact with any person who was being forced or threatened?') },
  { id: 'p1.39e', formRef: 'Part 1 · Item 39.e', label: t('¿…en impedir a alguien practicar su religión?', '…limiting or denying any person’s ability to exercise religious beliefs?') },
  { id: 'p1.40a', formRef: 'Part 1 · Item 40.a', label: t('¿Ha servido o participado en una unidad militar, paramilitar, policial, de autodefensa, guerrilla, milicia o grupo rebelde?', 'Have you EVER served in or participated in any military, paramilitary, police, self-defense or vigilante unit, rebel or guerrilla group, militia, or insurgent organization?') },
  { id: 'p1.40b', formRef: 'Part 1 · Item 40.b', label: t('¿Ha servido en una prisión, cárcel, campo de detención o de trabajo?', 'Have you EVER served in any prison, jail, prison camp, detention facility, labor camp, or other situation that involved detaining persons?') },
  { id: 'p1.41', formRef: 'Part 1 · Item 41', label: t('¿Ha pertenecido o ayudado a un grupo que usó o amenazó con armas contra alguien?', 'Have you EVER been a member of or participated in any group in which you or others used or threatened to use a weapon against any person?') },
  { id: 'p1.42', formRef: 'Part 1 · Item 42', label: t('¿Ha vendido, dado o transportado armas a alguien que las usó contra otra persona?', 'Have you EVER assisted in selling, providing or transporting weapons to any person who used them against another person?') },
  { id: 'p1.43', formRef: 'Part 1 · Item 43', label: t('¿Ha recibido entrenamiento militar, paramilitar o con armas?', 'Have you EVER received any type of military, paramilitary, or weapons training?') },
  { id: 'p1.44', formRef: 'Part 1 · Item 44', label: t('¿Ha reclutado o usado a menores de 15 años en un grupo armado?', 'Have you EVER recruited, enlisted, conscripted, or used any person under 15 to serve in or help an armed force or group?') },
  { id: 'p1.45', formRef: 'Part 1 · Item 45', label: t('¿Ha usado a menores de 15 años en combates?', 'Have you EVER used any person under 15 to take part in hostilities or help people in combat?') },
];

const anyBackgroundYes = (a: Answers) => BACKGROUND_ITEMS.some((i) => a[i.id] === 'yes');

const RELATIONSHIPS: Option[] = [
  { value: 'A', label: t('Esposo/a ciudadano/a de EE.UU.', 'U.S. citizen spouse') },
  { value: 'B', label: t('Padre o madre ciudadano/a de EE.UU.', 'U.S. citizen parent') },
  { value: 'C', label: t('Esposo/a residente permanente', 'LPR spouse') },
  { value: 'D', label: t('Padre o madre residente permanente', 'LPR parent') },
];

const relative = (p: string, ref: string, relItem: string): Field[] => [
  ...nameFields(p, ref),
  { id: `${p}.relationship`, type: 'select', required: true, label: { es: 'Esa persona es su…', en: 'This person is your' }, formRef: relItem, options: RELATIONSHIPS },
];

const isDV = is('basis', '1');

export const i601a: FormDefinition = {
  id: 'i-601a',
  number: 'I-601A',
  edition: I601A_EDITION,
  title: t('Perdón provisional por presencia ilegal', 'Provisional Unlawful Presence Waiver'),
  summary: {
    es: 'Pida perdón por haber estado sin permiso en EE.UU. antes de salir a su entrevista de visa en el consulado, para no quedar fuera del país 3 o 10 años.',
    en: 'Ask to forgive time spent in the U.S. without status before leaving for your consular visa interview, so you are not barred from returning for 3 or 10 years.',
  },
  intro: {
    es: 'El I-601A es para quien está en EE.UU., tiene una petición de inmigrante aprobada (I-130, I-140, I-360 o lotería de visas), ya pagó la tarifa de visa al Centro Nacional de Visas y solo necesita perdón por presencia ilegal. Debe demostrar que su esposo/a o padre/madre ciudadano o residente sufriría "dificultades extremas" si a usted no lo dejan volver. No sirve si tiene otros problemas (deportaciones previas, ciertos delitos, fraude). Es un caso delicado: revíselo con un abogado antes de presentar.',
    en: 'Form I-601A is for people in the U.S. who have an approved immigrant petition (I-130, I-140, I-360 or the visa lottery), have paid the immigrant visa fee to the National Visa Center, and only need a waiver of unlawful presence. You must show your U.S. citizen or resident spouse or parent would suffer "extreme hardship" if you were not allowed back. It does not cover other problems (prior removals, certain crimes, fraud). It is a sensitive case: review it with an attorney before filing.',
  },
  minutes: 45,
  pdf: {
    path: 'forms/i-601a.pdf',
    fileName: 'I-601A-filled.pdf',
    load: () => import('../pdf/i601aPdf').then((m) => m.fillI601A),
    signHere: { es: 'Parte 6, Ítem 6', en: 'Part 6, Item 6' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-601a que la edición {edition} sigue vigente y revise la tarifa y las citas de biometría.',
      'Adjunte la notificación de aprobación de la petición (I-797), el recibo del pago de la visa del Centro Nacional de Visas (o la carta del programa de lotería) y prueba de que su familiar es ciudadano o residente.',
      'Las "dificultades extremas" se prueban con documentos: cartas médicas, comprobantes de ingresos y deudas, cartas de apoyo, información del país. Un abogado puede ayudarle a armar el expediente.',
      'Imprima el PDF y firme la Parte 6, Ítem 6, a mano con tinta negra. Si un intérprete o preparador le ayudó, sus datos ya están en las Partes 7 y 8; ellos las revisan y las firman y fechan a mano.',
      'Si lo aprueban, no salga del país hasta tener la cita en el consulado, y resuelva antes cualquier caso en corte de inmigración.',
    ],
    en: [
      'Check at uscis.gov/i-601a that edition {edition} is still current, and check the fee and biometrics appointments.',
      'Attach the petition approval notice (I-797), the National Visa Center fee receipt (or the visa lottery letter) and proof that your relative is a citizen or resident.',
      '"Extreme hardship" is proved with documents: medical letters, income and debt records, support letters, country information. An attorney can help you build the case.',
      'Print the PDF and sign Part 6, Item 6, by hand in black ink. If an interpreter or preparer helped you, their details are already in Parts 7 and 8; they review them and sign and date by hand.',
      'If approved, do not leave the country until you have your consular appointment, and resolve any immigration court case first.',
    ],
  },
  sections: [
    {
      id: 'about',
      part: 'Part 1',
      title: t('Sus datos', 'About you'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 1 · Items 1–4',
          question: t('¿Cuál es su nombre completo?', 'What is your full name?'),
          notice: {
            tone: 'legal',
            title: t('Antes de empezar', 'Before you start'),
            body: t(
              'Necesita una petición de inmigrante aprobada y haber pagado la tarifa de visa al Centro Nacional de Visas. Si tiene una orden de deportación, salida voluntaria, delitos o entradas ilegales después de una deportación, este perdón puede no servirle: hable con un abogado.',
              'You need an approved immigrant petition and to have paid the immigrant visa fee to the National Visa Center. If you have a removal order, voluntary departure, crimes or illegal re-entries after removal, this waiver may not work for you: talk to an attorney.',
            ),
          },
          fields: [
            ...nameFields('name', 'Part 1 · Item 4'),
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 1 · Item 1' },
            { id: 'ssn', type: 'ssn', label: { es: 'Seguro Social (si tiene)', en: 'Social Security number (if any)' }, formRef: 'Part 1 · Item 2' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Cuenta en línea de USCIS (si tiene)', en: 'USCIS online account (if any)' }, formRef: 'Part 1 · Item 3' },
          ],
        },
        { id: 'otherName.more0', kind: 'choice', formRef: 'Part 1 · Items 5–6', question: t('¿Ha usado otros nombres?', 'Have you used other names?'), options: yesNo },
        ...rows({
          max: 2,
          id: 'otherName',
          first: is('otherName.more0', 'yes'),
          question: (i) => (i === 1 ? t('Otro nombre', 'Another name') : t('Otro nombre más', 'One more name')),
          more: t('¿Ha usado otro nombre más?', 'Another name?'),
          formRef: 'Part 1 · Items 5–6',
          fields: (i) => nameFields(`otherName${i}`, `Part 1 · Item ${i + 4}`),
          overflow: t('Si son más de 2, escríbalos a mano en la Parte 9.', 'If there are more than 2, write them by hand in Part 9.'),
        }),
        { id: 'mailing', kind: 'fields', formRef: 'Part 1 · Item 7 · Your U.S. Mailing Address', question: t('¿A qué dirección le llega el correo?', 'What is your U.S. mailing address?'), fields: usAddress('mailing', 'Part 1 · Item 7', true) },
        { id: 'mailingSame', kind: 'choice', formRef: 'Part 1 · Item 8', question: t('¿Vive en esa misma dirección?', 'Do you live at that same address?'), options: yesNo },
        { id: 'home', kind: 'fields', formRef: 'Part 1 · Item 9 · Your U.S. Physical Address', showIf: is('mailingSame', 'no'), question: t('¿Dónde vive?', 'Where do you live?'), fields: usAddress('home', 'Part 1 · Item 9') },
        {
          id: 'personal',
          kind: 'fields',
          formRef: 'Part 1 · Items 10–16',
          question: t('Datos personales', 'Personal details'),
          fields: [
            sexField('sex', 'Part 1 · Item 10'),
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 11'),
            text('birthCity', 'Ciudad de nacimiento', 'City or town of birth', 'Part 1 · Item 12'),
            text('birthCountry', 'País de nacimiento', 'Country of birth', 'Part 1 · Item 13'),
            text('citizenship', 'País de ciudadanía', 'Country of citizenship or nationality', 'Part 1 · Item 14'),
            text('mother.family', 'Apellido de su madre', 'Mother’s family name', 'Part 1 · Item 15.a'),
            text('mother.given', 'Nombre de su madre', 'Mother’s given name', 'Part 1 · Item 15.b'),
            text('father.family', 'Apellido de su padre', 'Father’s family name', 'Part 1 · Item 16.a', { required: false }),
            text('father.given', 'Nombre de su padre', 'Father’s given name', 'Part 1 · Item 16.b', { required: false }),
          ],
        },
      ],
    },
    {
      id: 'entries',
      part: 'Part 1',
      title: t('Entradas a EE.UU.', 'Entries into the U.S.'),
      questions: [
        {
          id: 'lastEntry',
          kind: 'fields',
          formRef: 'Part 1 · Items 17–19 · Your Last Entry',
          question: t('Su última entrada a EE.UU.', 'Your last entry into the U.S.'),
          why: t('Si entró sin pasar por inspección, ponga el lugar aproximado y "EWI" (entry without inspection) como estatus.', 'If you entered without inspection, give the approximate place and "EWI" as the status.'),
          fields: entryFields('lastEntry', 'Part 1', ['18.a', '18.b', '17', '19'], false),
        },
        { id: 'prevEntry.more0', kind: 'choice', formRef: 'Part 1 · Items 20–25', question: t('¿Estuvo antes en EE.UU.?', 'Were you in the U.S. before that?'), options: yesNo },
        ...rows({
          max: 2,
          id: 'prevEntry',
          first: is('prevEntry.more0', 'yes'),
          question: (i) => (i === 1 ? t('Su estadía anterior', 'Your previous stay') : t('Otra estadía anterior', 'Another previous stay')),
          more: t('¿Hubo otra estadía antes de esa?', 'Another previous stay before that?'),
          formRef: 'Part 1 · Items 20–25 · Your Previous Entries',
          fields: (i) => entryFields(`prevEntry${i}`, 'Part 1', i === 1 ? ['20.a', '20.b', '21.a', '22'] : ['23.a', '23.b', '24.a', '25'], true),
          overflow: t('Si contesta Sí, la app le pide las demás entradas para la Parte 9.', 'If you answer Yes, the app asks for the other entries for Part 9.'),
        }),
        {
          id: 'otherEntriesExplain',
          kind: 'fields',
          formRef: 'Part 1 · Item 26 · Part 9',
          showIf: all(is('prevEntry.more0', 'yes'), is('prevEntry.more1', 'yes'), is('prevEntry.more2', 'yes')),
          question: t('Las demás entradas', 'The other entries'),
          fields: [{ id: 'otherEntries.explain', type: 'longText', required: true, label: t('Lugar, fechas y estatus de cada una (en inglés)', 'Place, dates and status of each one'), formRef: 'Part 9' }],
        },
      ],
    },
    {
      id: 'history',
      part: 'Part 1',
      title: t('Historial migratorio y penal', 'Immigration and criminal history'),
      questions: [
        { id: 'proceedings', kind: 'choice', formRef: 'Part 1 · Item 27', question: t('¿Está ahora en un proceso de deportación sin orden final?', 'Are you currently in removal, exclusion, or deportation proceedings with no final order yet?'), options: yesNo },
        {
          id: 'proceedingsStatus',
          kind: 'choice',
          formRef: 'Part 1 · Items 28.a–28.b',
          showIf: is('proceedings', 'yes'),
          question: t('¿Cuál describe su caso en corte?', 'Which describes your court case?'),
          notice: { tone: 'legal', title: t('Caso en corte', 'Court case'), body: t('Solo puede pedir este perdón si su caso está cerrado administrativamente y no lo han vuelto a abrir. Hable con su abogado.', 'You can only request this waiver if your case is administratively closed and has not been put back on the calendar. Talk to your attorney.') },
          options: [
            { value: 'A', label: t('Cerrado administrativamente y no lo han vuelto a abrir', 'Administratively closed and not back on the calendar') },
            { value: 'B', label: t('No está cerrado, o lo volvieron a abrir', 'Not administratively closed, or back on the calendar') },
          ],
        },
        { id: 'finalOrder', kind: 'choice', formRef: 'Part 1 · Item 29.a', question: t('¿Tiene una orden final de deportación?', 'Are you currently subject to a final order of removal, exclusion or deportation?'), options: yesNo },
        {
          id: 'i212',
          kind: 'fields',
          formRef: 'Part 1 · Item 29.b',
          showIf: is('finalOrder', 'yes'),
          question: t('Su I-212 aprobado', 'Your approved Form I-212'),
          notice: { tone: 'legal', title: t('Orden de deportación', 'Removal order'), body: t('Con una orden final, solo puede pedir este perdón si USCIS ya le aprobó el I-212 (permiso para volver a pedir entrada).', 'With a final order, you can only request this waiver if USCIS has already approved your Form I-212 (permission to reapply for admission).') },
          fields: [{ id: 'i212.receipt', type: 'receipt', label: { es: 'Número de recibo del I-212 aprobado (si tiene)', en: 'Receipt number of the approved I-212 (if any)' }, formRef: 'Part 1 · Item 29.b' }],
        },
        { id: 'i871', kind: 'choice', formRef: 'Part 1 · Item 30.a', question: t('¿Le entregaron un formulario I-871 (aviso de que restablecerán una deportación anterior)?', 'Has DHS served you with Form I-871, notice of intent to reinstate a prior removal order?'), options: yesNo },
        { id: 'reinstated', kind: 'choice', formRef: 'Part 1 · Item 30.b', showIf: is('i871', 'yes'), question: t('¿Le entregaron la decisión final que restablece esa orden?', 'Has DHS served you with a final decision reinstating that order?'), options: yesNo },
        {
          id: 'voluntaryDeparture',
          kind: 'choice',
          formRef: 'Part 1 · Item 31',
          question: t('¿Tiene una salida voluntaria vigente otorgada por un juez?', 'Are you currently subject to a grant of voluntary departure that has not expired?'),
          why: t('Si la tiene, no puede pedir este perdón. Si la retiró o terminó, conteste No.', 'If so, you are not eligible for this waiver. If you withdrew or ended it, answer No.'),
          options: yesNo,
        },
        {
          id: 'background',
          kind: 'yesNoList',
          formRef: 'Part 1 · Items 32–45',
          question: t('Preguntas sobre antecedentes', 'Background questions'),
          why: t('Un Sí puede hacer que nieguen el perdón. Diga siempre la verdad y explique cada Sí.', 'A Yes can lead to a denial. Always tell the truth and explain each Yes.'),
          items: BACKGROUND_ITEMS,
        },
        {
          id: 'backgroundExplain',
          kind: 'fields',
          formRef: 'Part 1 · Items 32–45 · Part 9',
          showIf: anyBackgroundYes,
          question: t('Explique cada Sí', 'Explain each Yes'),
          notice: { tone: 'legal', title: t('Consulte a un abogado', 'Talk to an attorney'), body: t('Adjunte los documentos de la corte o de la policía de cada caso. Si lo arrestaron sin cargos, adjunte una constancia de que no hubo cargos.', 'Attach the court or police records for each case. If you were arrested without charges, attach proof that no charges were filed.') },
          fields: [{ id: 'background.explain', type: 'longText', required: true, label: t('Lugar, fecha y qué pasó, para cada Sí (en inglés)', 'Location, date and what happened, for each Yes'), formRef: 'Part 9' }],
        },
      ],
    },
    { id: 'biographic', part: 'Part 2', title: t('Datos físicos', 'Biographic information'), questions: biographic('Part 2') },
    {
      id: 'visaCase',
      part: 'Part 3',
      title: t('Su caso de visa', 'Your immigrant visa case'),
      questions: [
        {
          id: 'basis',
          kind: 'choice',
          formRef: 'Part 3 · Item 1',
          question: t('¿Por qué petición va a inmigrar?', 'What is your basis for immigrating?'),
          options: [
            { value: '1', label: t('Lotería de visas (seleccionado o derivado)', 'Diversity Visa selectee or derivative') },
            { value: '2', label: t('Familiar inmediato de ciudadano (I-130: esposo/a, hijo/a menor de 21 o padre/madre)', 'Immediate relative petition (Form I-130)') },
            { value: '3', label: t('Petición familiar por preferencia (I-130), incluidos derivados', 'Family preference petition (Form I-130), including derivatives') },
            { value: '4', label: t('Petición de empleo (I-140), incluidos derivados', 'Employment-based petition (Form I-140), including derivatives') },
            { value: '5', label: t('Inmigrante especial o viudo/a (I-360), incluidos derivados', 'Special immigrant or widow(er) petition (Form I-360), including derivatives') },
          ],
        },
        {
          id: 'dv',
          kind: 'fields',
          formRef: 'Part 3 · Items 2.a–2.d',
          showIf: isDV,
          question: t('Su caso de lotería', 'Your Diversity Visa case'),
          fields: [
            text('dv.caseNumber', 'Número de caso del KCC', 'DOS DV case number (KCC)', 'Part 3 · Item 2.a', { maxLength: 14 }),
            ...nameFields('dv.selectee', 'Part 3 · Items 2.b–2.d · DV selectee (if you are a derivative)', false),
          ],
        },
        {
          id: 'petition',
          kind: 'fields',
          formRef: 'Part 3 · Items 3.a–3.f',
          showIf: (a) => ['2', '3', '4', '5'].includes(String(a.basis ?? '')),
          question: t('Su petición aprobada', 'Your approved petition'),
          fields: [
            { id: 'petition.receipt', type: 'receipt', required: true, label: { es: 'Número de recibo de USCIS de la petición', en: 'USCIS receipt number of the petition' }, formRef: 'Part 3 · Item 3.a', placeholder: 'IOE0912345678' },
            text('petition.nvc', 'Número de caso del Centro Nacional de Visas (NVC)', 'DOS consular case number (NVC)', 'Part 3 · Item 3.b', { maxLength: 13, placeholder: 'CDJ2025123456' }),
            ...nameFields('petitioner', 'Part 3 · Items 3.c–3.e · Petitioner', false),
            text('petitioner.company', 'Empresa u organización (si la petición es de empleo)', 'Company or organization name', 'Part 3 · Item 3.f', { required: false, maxLength: 34 }),
          ],
        },
      ],
    },
    {
      id: 'relative',
      part: 'Part 4',
      title: t('Su familiar', 'Your qualifying relative'),
      questions: [
        {
          id: 'qualifying',
          kind: 'fields',
          formRef: 'Part 4 · Items 1–2',
          question: t('¿Qué familiar sufriría dificultades extremas si usted no puede volver?', 'Which relative would suffer extreme hardship if you could not return?'),
          why: t('Solo cuentan su esposo/a o su padre/madre que sea ciudadano o residente permanente. Los hijos no cuentan como familiar calificado, pero su sufrimiento se puede explicar en la Parte 5.', 'Only your U.S. citizen or LPR spouse or parent counts. Children are not qualifying relatives, but their hardship can be explained in Part 5.'),
          fields: relative('qualifying1', 'Part 4 · Item 1', 'Part 4 · Item 2'),
        },
        { id: 'qualifying.more1', kind: 'choice', formRef: 'Part 4 · Item 3', question: t('¿Tiene otro familiar calificado (esposo/a o padre/madre ciudadano o residente)?', 'Do you have more than one qualifying relative?'), options: yesNo },
        { id: 'qualifying2', kind: 'fields', formRef: 'Part 4 · Items 4–5', showIf: is('qualifying.more1', 'yes'), question: t('Su otro familiar calificado', 'Your other qualifying relative'), fields: relative('qualifying2', 'Part 4 · Item 4', 'Part 4 · Item 5') },
      ],
    },
    {
      id: 'statement',
      part: 'Part 5',
      title: t('Su declaración', 'Your statement'),
      questions: [
        {
          id: 'hardship',
          kind: 'fields',
          formRef: 'Part 5 · Statement From Applicant',
          question: t('¿Por qué deberían aprobar su perdón?', 'Why should USCIS approve your waiver?'),
          why: t(
            'Explique las dificultades extremas que sufriría su familiar si usted no puede volver: salud, dinero, hijos, trabajo, peligros en su país, y por qué no puede irse con usted. Escriba en inglés. Si es muy largo, la app lo pasa a la Parte 9.',
            'Explain the extreme hardship your relative would face if you could not return: health, finances, children, work, danger in your country, and why they cannot move with you. Write in English. If it is long, the app moves it to Part 9.',
          ),
          fields: [{ id: 'hardship.statement', type: 'longText', required: true, label: t('Su declaración (en inglés)', 'Your statement'), formRef: 'Part 5' }],
        },
      ],
    },
    {
      id: 'contact',
      part: 'Part 6',
      title: t('Declaración y contacto', 'Statement and contact'),
      questions: [
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 6 · Item 1',
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leerá', 'No, an interpreter will read it to me') },
          ],
        },
        { id: 'interpreterLanguage', kind: 'fields', formRef: 'Part 6 · Item 1.b', showIf: is('readsEnglish', 'B'), question: t('¿En qué idioma?', 'In what language?'), fields: [text('fluentLanguage', 'Idioma', 'Language', 'Part 6 · Item 1.b', { placeholder: 'Spanish' })] },
        { id: 'preparer', kind: 'choice', formRef: 'Part 6 · Item 2', question: t('¿Alguien más preparó esta solicitud?', 'Did someone else prepare this application?'), options: yesNo },
        { id: 'preparerName', kind: 'fields', formRef: 'Part 6 · Item 2', showIf: is('preparer', 'yes'), question: t('¿Quién la preparó?', 'Who prepared it?'), fields: [text('preparer.name', 'Nombre del preparador', 'Preparer’s name', 'Part 6 · Item 2')] },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 6 · Items 3–5',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 6 · Item 3', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 6 · Item 4' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 6 · Item 5' },
          ],
        },
      ],
    },
    assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 7', preparerPart: 'Part 8' }),
  ],
};
