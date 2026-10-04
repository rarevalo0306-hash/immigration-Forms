import type { Answers, FormDefinition, Option } from './types';
import type { T } from '../i18n';
import { anyAddress, date, is, nameFields, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';

// Questions follow USCIS Form I-290B, Notice of Appeal or Motion, edition 05/31/24. The PDF
// mapping lives in src/pdf/i290bPdf.ts.
//
// Out of scope (left for hand or for the attorney):
// - The attorney or accredited representative box on page 1 (G-28 box, bar number, account).
// - Every signature and date, including the interpreter's (Part 5) and preparer's (Part 6); the
//   rest of those parts comes from the "Who helped you" section.
//
// Part 4 has no reading-English or preparer boxes, so the statement section asks whether an
// interpreter read the form to the person (`readsEnglish`) and whether someone else prepared it
// (`preparer`): those answers only decide whether Parts 5 and 6 are asked and filled. Parts 5 and 6
// have no mailing address and no preparer's statement boxes, so those questions are left out.

export const I290B_EDITION = '05/31/24';

const t = (es: string, en: string): T => ({ es, en });

/** Part 2, Item 7: the offices in the PDF's list, as the PDF spells them (trimmed). */
export const OFFICES: string[] = [
  'AAO', 'Agana (AGA)', 'Albany (ALB)', 'Albuquerque (ABQ)', 'Anchorage (ANC)', 'Atlanta (ATL)', 'Baltimore (BAL)', 'Boise (BOI)', 'Boston (BOS)',
  'Brooklyn Field Office (BNY)', 'Buffalo (BUF)', 'California Service Center (WAC)', 'Charleston (CHL)', 'Charlotte (CLT)', 'Charlotte Amelie (CHA)',
  'Chicago (CHI)', 'Chula Vista (CVC)', 'Cincinnati (CIN)', 'Cleveland (CLE)', 'Columbus (CLM)', 'Dallas (DAL)', 'Denver (DEN)', 'Des Moines (DSM)',
  'Detroit (DET)', 'El Paso (ELP)', 'Fort Myers Field Office (OFM)', 'Fresno (FRE)', 'Ft. Smith, AR (FSA)', 'Greer, SC (GRR)', 'Harlingen (HLG)',
  'Hartford (HAR)', 'Helena (HEL)', 'Hialeah (HIA)', 'Honolulu (HHW)', 'Houston (HOU)', 'Humanitarian Affairs Branch (RIH)',
  'Immigrant Investor Program (IIP)', 'Imperial Field Office (IMP)', 'Indianapolis (INP)', 'Jacksonville (JAC)', 'Kansas City (KAN)', 'Kendall (KND)',
  'Las Vegas (LVG)', 'Lawrence (LAW)', 'Long Island (LNY)', 'Los Angeles (LAC)', 'Los Angeles (LOS)', 'Los Angeles (SFV)', 'Louisville (LOU)',
  'Manchester (MAN)', 'Memphis (MEM)', 'Miami (MIA)', 'Milwaukee (MIL)', 'Montgomery Field Office (MGA)', 'Mount Laurel (MTL)',
  'Nashville Field Office (NTN)', 'National Benefits Center (NBC)', 'Nebraska Service Center (LIN)', 'New Jersey Central (NJC)', 'New Orleans (NOL)',
  'New York City (NYC)', 'Newark (NEW)', 'Norfolk (NOR)', 'Oakland Park (OKL)', 'Oklahoma City (OKC)', 'Omaha (OMA)', 'Orlando (ORL)',
  'Philadelphia (PHI)', 'Phoenix (PHO)', 'Pittsburgh (PIT)', 'Portland (POM)', 'Portland (POO)', 'Potomac Service Center (YSC)', 'Providence (PRO)',
  'Queens (QNS)', 'Raleigh (RAL)', 'Refugee and International Operations (RIH)', 'Reno (REN)', 'Sacramento (SAC)', 'Salt Lake City (SLC)',
  'San Antonio (SNA)', 'San Bernardino (SBD)', 'San Diego (SND)', 'San Fernando Field Office (SFV)', 'San Francisco (SFR)', 'San Jose (SNJ)',
  'San Juan (SAJ)', 'Santa Ana (SAA)', 'Seattle (SEA)', 'Spokane (SPO)', 'St. Albans (STA)', 'St. Louis (STL)', 'St. Paul (SPM)', 'Tampa (TAM)',
  'Texas Service Center (SRC)', 'Tucson (TUC)', 'Vermont Service Center (EAC)', 'Washington (WAS)', 'West Palm Beach (WPB)', 'Yakima (YAK)',
];

const officeOptions: Option[] = [
  ...OFFICES.map((o) => ({ value: o, label: { es: o, en: o } })),
  { value: 'Other', label: t('Otra (no está en la lista)', 'Other (not on the list)') },
];

const isPerson = (a: Answers) => a.filer !== 'business';
const isAppeal = is('filingType', 'appeal');

/** Parts 5 and 6 of this edition have no mailing address and no preparer's statement boxes. */
const assistance = assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 5', preparerPart: 'Part 6' });
const assistanceWithoutAddresses = { ...assistance, questions: assistance.questions.filter((q) => !['interp.address', 'prep.address', 'prep.statement'].includes(q.id)) };

export const i290b: FormDefinition = {
  id: 'i-290b',
  number: 'I-290B',
  edition: I290B_EDITION,
  title: t('Aviso de apelación o moción', 'Notice of Appeal or Motion'),
  summary: {
    es: 'Pida que se revise una decisión negativa de USCIS: una apelación ante la AAO o una moción para reabrir o reconsiderar el caso.',
    en: 'Ask for review of an unfavorable USCIS decision: an appeal to the AAO or a motion to reopen or reconsider the case.',
  },
  intro: {
    es: 'Si USCIS le negó una solicitud o petición, a veces puede pedir que la revisen. Con una apelación, la Oficina de Apelaciones Administrativas (AAO) revisa si USCIS se equivocó. Con una moción, la misma oficina que decidió vuelve a mirar su caso: para reabrir, usted trae hechos nuevos con documentos; para reconsiderar, explica por qué aplicaron mal la ley con lo que ya había en el expediente. Tiene muy poco tiempo: normalmente 30 días desde la fecha de la decisión (33 si se la enviaron por correo). No todas las decisiones se pueden apelar con este formulario: su carta de decisión dice qué opciones tiene. Es un caso legal: le recomendamos mucho que lo revise un abogado de inmigración.',
    en: 'If USCIS denied your application or petition, you can sometimes ask for a review. With an appeal, the Administrative Appeals Office (AAO) reviews whether USCIS made a mistake. With a motion, the office that decided looks at your case again: to reopen, you bring new facts with documents; to reconsider, you explain why the law was applied wrongly on the existing record. Time is very short: usually 30 days from the decision date (33 if it was mailed to you). Not every decision can be appealed with this form: your decision letter says which options you have. It is a legal case: we strongly recommend having an immigration attorney review it.',
  },
  minutes: 25,
  pdf: {
    path: 'forms/i-290b.pdf',
    fileName: 'I-290B-filled.pdf',
    load: () => import('../pdf/i290bPdf').then((m) => m.fillI290B),
    signHere: { es: 'Parte 4, Ítem 4', en: 'Part 4, Item 4' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-290b que la edición {edition} sigue vigente, revise la tarifa y a qué dirección se envía: depende del formulario que le negaron. Hágalo pronto: USCIS debe RECIBIRLO dentro del plazo (normalmente 30 días desde la decisión, 33 si se la enviaron por correo).',
      'Adjunte una copia de la carta de decisión que quiere apelar o que revisen. Para una moción para reabrir, adjunte los documentos que prueban los hechos nuevos; para reconsiderar, su escrito (brief) con las leyes, reglas o decisiones que se aplicaron mal.',
      'Si marcó que enviará el escrito o las pruebas después, mándelos directamente a la AAO dentro de los 30 días después de presentar la apelación, con su número de recibo.',
      'Revise la Parte 7: si su explicación no cupo en la Parte 3, el PDF la continuó ahí (y, si hacía falta, en una hoja adicional al final). Firme y ponga la fecha en cada hoja adicional.',
      'Imprima el PDF y firme la Parte 4, Ítem 4, a mano con tinta negra. Si un intérprete o preparador le ayudó, sus datos ya están en las Partes 5 y 6; ellos las revisan y las firman y fechan a mano. Si tiene abogado, él o ella llena el recuadro de la página 1 y adjunta el Formulario G-28.',
    ],
    en: [
      'Check at uscis.gov/i-290b that edition {edition} is still current, and check the fee and the filing address: it depends on the form that was denied. Do it soon: USCIS must RECEIVE it within the deadline (usually 30 days from the decision, 33 if it was mailed to you).',
      'Attach a copy of the decision you are appealing or asking to be reviewed. For a motion to reopen, attach the documents that prove the new facts; for a motion to reconsider, your brief citing the laws, policies or precedent decisions that were misapplied.',
      'If you said you will send the brief or evidence later, send it directly to the AAO within 30 days of filing the appeal, with your receipt number.',
      'Check Part 7: if your explanation did not fit in Part 3, the PDF continued it there (and onto an extra sheet at the end when needed). Sign and date each extra sheet.',
      'Print the PDF and sign Part 4, Item 4, by hand in black ink. If an interpreter or preparer helped you, their details are already in Parts 5 and 6; they check them and sign and date by hand. If you have an attorney, they complete the box on page 1 and attach Form G-28.',
    ],
  },
  sections: [
    {
      id: 'about',
      part: 'Part 1',
      title: t('Sus datos', 'About you'),
      questions: [
        {
          id: 'filer',
          kind: 'choice',
          formRef: 'Part 1 · Items 1–3',
          question: t('¿Quién presenta la apelación o moción?', 'Who is filing the appeal or motion?'),
          why: t(
            'La persona que presentó la solicitud o petición que negaron (el solicitante o peticionario). Si fue una empresa u organización, elija esa opción.',
            'The person who filed the application or petition that was denied (the applicant or petitioner). If it was a business or organization, choose that option.',
          ),
          notice: {
            tone: 'legal',
            title: t('El plazo es corto: hable con un abogado', 'The deadline is short: talk to an attorney'),
            body: t(
              'USCIS debe recibir este formulario dentro de 30 días desde la fecha de la decisión, o 33 días si se la enviaron por correo. Algunas decisiones, como la revocación de una petición ya aprobada, dan solo 15 días (18 por correo): su carta de decisión dice el plazo exacto. Una apelación tarde se rechaza; una moción para reabrir tarde solo se acepta si demuestra que la demora fue razonable y fuera de su control. No use este formulario para apelar ante la Junta de Apelaciones de Inmigración (BIA): para eso es el Formulario EOIR-29 (por ejemplo, la negación de un I-130 se apela ante la BIA). Una apelación o moción no detiene una deportación ni le da permiso de quedarse. Le recomendamos mucho que un abogado de inmigración o un representante acreditado revise su caso antes de presentar.',
              'USCIS must receive this form within 30 days of the decision date, or 33 days if the decision was mailed to you. Some decisions, such as the revocation of an approved petition, allow only 15 days (18 if mailed): your decision letter states the exact deadline. A late appeal is rejected; a late motion to reopen is accepted only if you show the delay was reasonable and beyond your control. Do not use this form to appeal to the Board of Immigration Appeals (BIA): use Form EOIR-29 instead (for example, an I-130 denial is appealed to the BIA). An appeal or motion does not stop a removal or give you permission to stay. We strongly recommend having an immigration attorney or accredited representative review your case before filing.',
            ),
          },
          options: [
            { value: 'person', label: t('Yo, como persona', 'Me, as an individual') },
            { value: 'business', label: t('Una empresa u organización', 'A business or organization') },
          ],
        },
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 1 · Items 1–2',
          showIf: isPerson,
          question: t('¿Cuál es su nombre completo?', 'What is your full name?'),
          why: t('Escríbalo igual que en la solicitud o petición que le negaron.', 'Write it as it appears on the application or petition that was denied.'),
          fields: [...nameFields('name', 'Part 1 · Item 1'), date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 2')],
        },
        {
          id: 'business',
          kind: 'fields',
          formRef: 'Part 1 · Item 3',
          showIf: is('filer', 'business'),
          question: t('¿Cómo se llama la empresa u organización?', 'What is the name of the business or organization?'),
          fields: [{ id: 'business.name', type: 'text', required: true, label: { es: 'Nombre de la empresa u organización', en: 'Business or organization name' }, formRef: 'Part 1 · Item 3', maxLength: 30 }],
        },
        {
          id: 'ids',
          kind: 'fields',
          formRef: 'Part 1 · Items 4–5',
          question: t('Sus números de inmigración', 'Your immigration numbers'),
          why: t('Aparecen en la carta de decisión o en sus avisos de USCIS. Déjelos en blanco si no tiene.', 'They appear on the decision letter or your USCIS notices. Leave them blank if you have none.'),
          fields: [
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 1 · Item 4' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Cuenta en línea de USCIS (si tiene)', en: 'USCIS online account number (if any)' }, formRef: 'Part 1 · Item 5' },
          ],
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 1 · Item 6 · Mailing Address',
          question: t('¿A qué dirección le llega el correo?', 'What is your mailing address?'),
          why: t(
            'USCIS le enviará aquí la respuesta. Si tiene una dirección segura o alternativa (por ejemplo en un caso VAWA, T o U), use esa.',
            'USCIS will send its answer here. If you have a safe or alternate address (for example in a VAWA, T or U case), use that one.',
          ),
          fields: anyAddress('mailing', 'Part 1 · Item 6', { careOf: true }),
        },
      ],
    },
    {
      id: 'filing',
      part: 'Part 2',
      title: t('La apelación o moción', 'The appeal or motion'),
      questions: [
        {
          id: 'filingType',
          kind: 'choice',
          formRef: 'Part 2 · Items 1–2',
          question: t('¿Qué quiere presentar?', 'What do you want to file?'),
          why: t(
            'Elija solo una: si marca una apelación y una moción a la vez, USCIS puede rechazarla. La carta de decisión dice si puede apelar ante la AAO o solo presentar una moción.',
            'Choose only one: if you mark both an appeal and a motion, USCIS may reject the filing. The decision letter says whether you can appeal to the AAO or only file a motion.',
          ),
          options: [
            { value: 'appeal', label: t('Una apelación ante la AAO (que una oficina superior revise la decisión)', 'An appeal to the AAO (a higher office reviews the decision)') },
            { value: 'reopen', label: t('Una moción para reabrir (tengo hechos nuevos con documentos)', 'A motion to reopen (I have new facts with documents)') },
            { value: 'reconsider', label: t('Una moción para reconsiderar (aplicaron mal la ley o las reglas)', 'A motion to reconsider (the law or policy was applied wrongly)') },
            { value: 'both', label: t('Una moción para reabrir y reconsiderar a la vez', 'A motion to reopen and a motion to reconsider together') },
          ],
        },
        {
          id: 'appealBrief',
          kind: 'choice',
          formRef: 'Part 2 · Items 1.a–1.c',
          showIf: isAppeal,
          question: t('¿Va a enviar un escrito (brief) o más pruebas para su apelación?', 'Will you send a brief or more evidence for your appeal?'),
          why: t(
            'Aunque envíe el escrito después, debe explicar ahora en la Parte 3 en qué se equivocó USCIS. Para una moción, el escrito y las pruebas van junto con este formulario.',
            'Even if you send the brief later, you must explain now in Part 3 what USCIS got wrong. For a motion, the brief and evidence go with this form.',
          ),
          options: [
            { value: 'A', label: t('Sí, los adjunto ahora con este formulario', 'Yes, I am attaching them with this form') },
            { value: 'B', label: t('Sí, los enviaré directamente a la AAO dentro de 30 días', 'Yes, I will send them directly to the AAO within 30 days') },
            { value: 'C', label: t('No voy a enviar escrito ni más pruebas', 'I will not submit a brief or more evidence') },
          ],
        },
        {
          id: 'decision',
          kind: 'fields',
          formRef: 'Part 2 · Items 3–7',
          question: t('¿Qué decisión quiere que revisen?', 'Which decision do you want reviewed?'),
          why: t(
            'Copie los datos de la carta de decisión. Solo un formulario y un número de recibo por cada I-290B.',
            'Copy the details from the decision letter. Only one form and one receipt number per I-290B.',
          ),
          notice: {
            tone: 'info',
            title: t('Revise la fecha', 'Check the date'),
            body: t(
              'Cuente 30 días desde la fecha de la decisión (33 si llegó por correo). Si ya pasaron, hable con un abogado antes de presentar: una apelación tarde se rechaza y no le devuelven la tarifa.',
              'Count 30 days from the decision date (33 if it came by mail). If they have passed, talk to an attorney before filing: a late appeal is rejected and the fee is not refunded.',
            ),
          },
          fields: [
            { id: 'decision.form', type: 'text', required: true, label: { es: 'Formulario que le negaron', en: 'Form that was denied' }, formRef: 'Part 2 · Item 3', placeholder: 'I-130', maxLength: 10 },
            { id: 'decision.receipt', type: 'receipt', required: true, label: { es: 'Número de recibo de ese formulario', en: 'Receipt number of that form' }, formRef: 'Part 2 · Item 4', placeholder: 'IOE0123456789' },
            {
              id: 'decision.classification',
              type: 'text',
              label: { es: 'Clasificación pedida (si aplica)', en: 'Requested classification (if applicable)' },
              formRef: 'Part 2 · Item 5',
              maxLength: 4,
              placeholder: 'EB-2',
              hint: t('Por ejemplo H-1B, R-1, EB-1, EB-2, AS-2. Déjelo en blanco si no sabe.', 'For example H-1B, R-1, EB-1, EB-2, AS-2. Leave it blank if you do not know.'),
            },
            date('decision.date', 'Fecha de la decisión', 'Date of the unfavorable decision', 'Part 2 · Item 6'),
            { id: 'decision.office', type: 'select', required: true, label: { es: 'Oficina que tomó la decisión', en: 'Office that issued the decision' }, formRef: 'Part 2 · Item 7', options: officeOptions, hint: t('Aparece en el encabezado de la carta.', 'It is in the letter’s heading.') },
          ],
        },
        {
          id: 'officeOther',
          kind: 'fields',
          formRef: 'Part 2 · Item 7 · Other',
          showIf: is('decision.office', 'Other'),
          question: t('¿Qué oficina tomó la decisión?', 'Which office issued the decision?'),
          why: t('Lo escribimos en la Parte 7, Información adicional.', 'We write it in Part 7, Additional Information.'),
          fields: [{ id: 'decision.officeOther', type: 'text', required: true, label: { es: 'Nombre de la oficina (en inglés)', en: 'Office name' }, formRef: 'Part 7 · Page 2, Part 2, Item 7', maxLength: 80 }],
        },
      ],
    },
    {
      id: 'basis',
      part: 'Part 3',
      title: t('Por qué se equivocaron', 'Basis for the appeal or motion'),
      questions: [
        {
          id: 'basisStatement',
          kind: 'fields',
          formRef: 'Part 3 · Basis for the Appeal or Motion',
          question: t('¿Por qué la decisión debe cambiar?', 'Why should the decision change?'),
          why: t(
            'Escriba en inglés. Para una apelación, diga qué error de ley o de hechos tiene la decisión, y responda a CADA razón de la negación: la que no mencione se puede dar por aceptada. Para reabrir, diga qué hechos nuevos hay y qué documentos los prueban. Para reconsiderar, diga qué ley, regla o decisión aplicaron mal. Si es largo, la app lo continúa en la Parte 7.',
            'Write in English. For an appeal, identify the error of law or fact in the decision, and answer EACH ground of denial: any you leave out may be treated as waived. To reopen, state the new facts and the documents that prove them. To reconsider, state which law, policy or precedent was misapplied. If it is long, the app continues it in Part 7.',
          ),
          notice: {
            tone: 'legal',
            title: t('Esta explicación es lo más importante', 'This statement is what matters most'),
            body: t(
              'USCIS o la AAO deciden con lo que usted escriba aquí y con sus pruebas. Un abogado de inmigración puede ayudarle a citar las leyes y decisiones correctas. Diga solo la verdad: lo firma bajo pena de perjurio.',
              'USCIS or the AAO decides on what you write here and on your evidence. An immigration attorney can help you cite the right laws and decisions. Tell only the truth: you sign it under penalty of perjury.',
            ),
          },
          fields: [{ id: 'basis.statement', type: 'longText', required: true, label: t('Su explicación (en inglés)', 'Your statement'), formRef: 'Part 3' }],
        },
      ],
    },
    {
      id: 'contact',
      part: 'Part 4',
      title: t('Declaración y contacto', 'Statement and contact'),
      questions: [
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 4 · Items 1–3 · Applicant’s or Petitioner’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          why: t(
            'Al firmar la Parte 4 usted declara, bajo pena de perjurio, que todo es verdad y que leyó y entendió el formulario (o se lo leyeron en un idioma que domina). Si un intérprete le ayudó, él o ella firma la Parte 5 a mano.',
            'By signing Part 4 you certify, under penalty of perjury, that everything is true and that you read and understood the form (or had it read to you in a language you are fluent in). If an interpreter helped you, they sign Part 5 by hand.',
          ),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 4 · Item 1', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular (si tiene)', en: 'Mobile phone (if any)' }, formRef: 'Part 4 · Item 2' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico (si tiene)', en: 'Email (if any)' }, formRef: 'Part 4 · Item 3' },
          ],
        },
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 4 · Applicant’s or Petitioner’s Certification',
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          why: t('Si alguien le lee el formulario en su idioma, esa persona llena y firma la Parte 5.', 'If someone reads the form to you in your language, that person completes and signs Part 5.'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leyó', 'No, an interpreter read it to me') },
          ],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 6 · Preparer',
          question: t('¿Alguien más le preparó este formulario?', 'Did someone else prepare this form for you?'),
          why: t('Por ejemplo un abogado, una organización o un familiar que llenó las respuestas. Esa persona llena y firma la Parte 6.', 'For example an attorney, an organization or a relative who filled in the answers. That person completes and signs Part 6.'),
          options: yesNo,
        },
      ],
    },
    assistanceWithoutAddresses,
  ],
};
