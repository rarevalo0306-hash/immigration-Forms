import type { Answers, Field, FormDefinition, Option } from './types';
import type { T } from '../i18n';
import { all, anyAddress, date, is, nameFields, rows, sexOptions, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';

// Questions follow USCIS Form N-565, Application for Replacement Naturalization/Citizenship
// Document, edition 02/27/25. The PDF mapping lives in src/pdf/n565Pdf.ts.
// Left for hand: the attorney box at the top of page 1, Part 8 Item 4 (filled by USCIS or a consul
// after approval), and every signature and its date (Part 9, Item 4; Part 10, Item 6; Part 11,
// Item 6). This edition has no "I read English / an interpreter read it to me" or preparer
// checkboxes in Part 9, so `readsEnglish` and `preparer` only decide whether the interpreter's
// Part 10 and the preparer's Part 11 are filled. Those parts have no mailing address and no
// attorney statement, so those questions are not asked.

export const N565_EDITION = '02/27/25';

const t = (es: string, en: string): T => ({ es, en });

const text = (id: string, es: string, en: string, formRef: string, opts: Partial<Field> = {}): Field => ({ id, type: 'text', required: true, label: { es, en }, formRef, ...opts });

const options = (pairs: [string, string, string][]): Option[] => pairs.map(([value, es, en]) => ({ value, label: t(es, en) }));

/** Whether a "select all that apply" answer includes a value. */
export const has =
  (id: string, value: string) =>
  (a: Answers): boolean => {
    const v = a[id];
    return Array.isArray(v) && v.includes(value);
  };

/** Part 3, Item 1: the document, by the PDF's export values. */
export const DOC_TYPES: Option[] = options([
  ['NN', 'Certificado de naturalización (el que recibió al hacerse ciudadano/a con el N-400)', 'Certificate of Naturalization (received when you naturalized with Form N-400)'],
  ['NC', 'Certificado de ciudadanía (el que se pide con el N-600)', 'Certificate of Citizenship (requested with Form N-600)'],
  ['NR', 'Certificado de repatriación', 'Certificate of Repatriation'],
  ['NDI', 'Declaración de intención', 'Declaration of Intention'],
  ['SCN', 'Certificado especial para que otro país reconozca mi ciudadanía de EE.UU.', 'Special certificate so a foreign country recognizes my U.S. citizenship'],
]);

/** Part 3, Items 2.a-2.g. */
export const REASONS: Option[] = options([
  ['lost', 'Se me perdió, me lo robaron o se destruyó', 'It was lost, stolen, or destroyed'],
  ['mutilated', 'Está dañado (roto, manchado, ilegible)', 'It is mutilated (torn, stained, unreadable)'],
  ['error', 'Tiene un error de USCIS (de escritura o de oficina)', 'It has a typographical or clerical error by USCIS'],
  ['name', 'Me cambié el nombre legalmente', 'My name has legally changed'],
  ['dob', 'Mi fecha de nacimiento cambió legalmente (solo certificado de ciudadanía)', 'My date of birth legally changed (Certificate of Citizenship only)'],
  ['sex', 'El sexo que aparece no es mi sexo biológico al nacer', 'The sex listed is not my biological sex at birth'],
  ['other', 'Otra razón', 'Another reason'],
]);

const regular = (a: Answers) => !!a.docType && a.docType !== 'SCN';
const reason = (value: string) => all(regular, has('reasons', value));

export const n565: FormDefinition = {
  id: 'n-565',
  number: 'N-565',
  edition: N565_EDITION,
  title: t('Reemplazo de certificado de naturalización o ciudadanía', 'Application for Replacement Naturalization/Citizenship Document'),
  summary: {
    es: 'Pida un nuevo certificado de naturalización o de ciudadanía si se le perdió, se dañó, tiene un error o cambió su nombre.',
    en: 'Request a new naturalization or citizenship certificate if yours was lost, damaged, has an error, or your name changed.',
  },
  intro: {
    es: 'El N-565 reemplaza su certificado de naturalización, de ciudadanía, de repatriación o su declaración de intención. Usted sigue siendo ciudadano/a aunque haya perdido el papel; esto solo pide uno nuevo. Tenga a mano una copia del certificado (si tiene), su A-Number y, según el caso, el reporte de policía, el acta de matrimonio o la orden de la corte. Si el certificado está dañado o tiene un error, tendrá que enviar el original.',
    en: 'Form N-565 replaces your Certificate of Naturalization, Certificate of Citizenship, Certificate of Repatriation or Declaration of Intention. You remain a citizen even if you lost the paper; this only requests a new one. Have a copy of the certificate (if any), your A-Number and, depending on your case, the police report, marriage certificate or court order at hand. If the certificate is damaged or has an error, you will have to send the original.',
  },
  minutes: 15,
  pdf: {
    path: 'forms/n-565.pdf',
    fileName: 'N-565-filled.pdf',
    load: () => import('../pdf/n565Pdf').then((m) => m.fillN565),
    signHere: { es: 'Parte 9, Ítem 4', en: 'Part 9, Item 4' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/n-565 que la edición {edition} sigue vigente y revise la tarifa. Si el error fue de USCIS, no se paga tarifa. Si no puede pagar, puede pedir exención con el I-912 en esta app. También se puede presentar en línea.',
      'Adjunte una copia de su identificación con foto. Si vive fuera de EE.UU., agregue dos fotos tipo pasaporte iguales y recientes (escriba su nombre y A-Number a lápiz por detrás).',
      'Si se le perdió o se lo robaron, adjunte una copia del certificado si la tiene y el reporte de policía o una declaración jurada. Si está dañado, tiene un error, o cambió su nombre, fecha de nacimiento o sexo, envíe el certificado ORIGINAL junto con la prueba (acta de matrimonio, divorcio, orden de la corte o acta de nacimiento).',
      'Imprima el PDF y firme la Parte 9, Ítem 4, a mano con tinta negra. Si un intérprete o preparador le ayudó, revise sus datos en las Partes 10 y 11: ellos firman y ponen la fecha a mano.',
      'Guarde una copia de todo lo que envía. USCIS puede citarle para tomarle huellas o hacerle una entrevista.',
    ],
    en: [
      'Check at uscis.gov/n-565 that edition {edition} is still current and check the fee. There is no fee when the error was made by USCIS. If you cannot pay, you can request a waiver with Form I-912 in this app. It can also be filed online.',
      'Attach a copy of your photo ID. If you live outside the U.S., add two identical recent passport-style photos (write your name and A-Number in pencil on the back).',
      'If it was lost or stolen, attach a copy of the certificate if you have one and a police report or sworn statement. If it is damaged, has an error, or your name, date of birth or sex changed, send the ORIGINAL certificate with the evidence (marriage, divorce or court order, or birth certificate).',
      'Print the PDF and sign Part 9, Item 4, by hand in black ink. If an interpreter or preparer helped you, check their details in Parts 10 and 11: they sign and date by hand.',
      'Keep a copy of everything you send. USCIS may schedule you for fingerprints or an interview.',
    ],
  },
  sections: [
    {
      id: 'application',
      part: 'Part 3',
      title: t('Qué documento pide', 'What you are requesting'),
      questions: [
        {
          id: 'docType',
          kind: 'choice',
          formRef: 'Part 3 · Items 1.a–1.e · I am applying for a',
          question: t('¿Qué documento necesita?', 'Which document do you need?'),
          why: t('Elija el mismo tipo de documento que tenía. Si se naturalizó en una ceremonia, casi siempre es el certificado de naturalización.', 'Choose the same kind of document you had. If you naturalized at a ceremony, it is almost always the Certificate of Naturalization.'),
          options: DOC_TYPES,
        },
        {
          id: 'reasons',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 3 · Items 2.a–2.g · Basis for My Application',
          showIf: regular,
          question: t('¿Por qué necesita uno nuevo? Marque todas las que apliquen.', 'Why do you need a new one? Select all that apply.'),
          options: REASONS,
        },
        {
          id: 'lostDetails',
          kind: 'fields',
          formRef: 'Part 3 · Item 2.a.(1)',
          showIf: reason('lost'),
          question: t('Cuéntenos cuándo, dónde y cómo se perdió, se lo robaron o se destruyó', 'Tell us when, where, and how it was lost, stolen, or destroyed'),
          notice: {
            tone: 'info',
            title: t('Reporte de policía', 'Police report'),
            body: t('Si se lo robaron, adjunte el reporte de policía. Si se perdió o se destruyó, adjunte una declaración firmada que explique lo que pasó. Si tiene una copia del certificado, adjúntela.', 'If it was stolen, attach the police report. If it was lost or destroyed, attach a signed statement explaining what happened. If you have a copy of the certificate, attach it.'),
          },
          fields: [
            {
              id: 'lost.explain',
              type: 'longText',
              required: true,
              label: t('Explicación (en inglés)', 'Explanation'),
              formRef: 'Part 3 · Item 2.a.(1)',
              placeholder: 'Around March 2025 my wallet was stolen on a bus in Houston, TX, with the certificate inside. I filed a police report.',
              hint: t('Si no cabe, sigue en la Parte 12.', 'If it does not fit, it continues in Part 12.'),
            },
          ],
        },
        {
          id: 'otherReason',
          kind: 'fields',
          formRef: 'Part 3 · Item 2.g.(1)',
          showIf: reason('other'),
          question: t('Explique su razón', 'Explain your reason'),
          fields: [{ id: 'other.explain', type: 'longText', required: true, label: t('Explicación (en inglés)', 'Explanation'), formRef: 'Part 3 · Item 2.g.(1)', hint: t('Si no cabe, sigue en la Parte 12.', 'If it does not fit, it continues in Part 12.') }],
        },
        {
          id: 'errorItems',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 4 · Item 1',
          showIf: reason('error'),
          question: t('¿Qué dato tiene el error?', 'What has the error?'),
          why: t('Solo errores que cometió USCIS al imprimir el certificado. Si el dato cambió después (por ejemplo, se casó), use la razón de cambio de nombre.', 'Only mistakes USCIS made when printing the certificate. If the information changed later (for example, you married), use the name-change reason.'),
          options: options([
            ['name', 'El nombre', 'Name'],
            ['dob', 'La fecha de nacimiento', 'Date of birth'],
            ['sex', 'El sexo', 'Sex'],
            ['other', 'Otro dato', 'Other'],
          ]),
        },
        {
          id: 'errorDetails',
          kind: 'fields',
          formRef: 'Part 4 · Item 2',
          showIf: reason('error'),
          question: t('¿Qué está mal y cómo debería decir?', 'What is wrong and what should it say?'),
          fields: [
            {
              id: 'error.explain',
              type: 'longText',
              required: true,
              label: t('Explicación (en inglés)', 'Explanation'),
              formRef: 'Part 4 · Item 2',
              placeholder: 'My family name is printed as "Gonzales" but it is "Gonzalez", as on my passport and green card.',
              hint: t('Adjunte copias de documentos que muestren el dato correcto.', 'Attach copies of documents showing the correct information.'),
            },
          ],
        },
        {
          id: 'nameChangeBy',
          kind: 'choice',
          formRef: 'Part 5 · Items 1.a–1.b',
          showIf: reason('name'),
          question: t('¿Cómo cambió su nombre?', 'How did your name change?'),
          options: options([
            ['A', 'Por matrimonio, divorcio o anulación', 'Marriage, divorce, or annulment'],
            ['B', 'Por orden de una corte', 'Court order'],
          ]),
        },
        {
          id: 'nameChangeDate',
          kind: 'fields',
          formRef: 'Part 5 · Item 1',
          showIf: all(reason('name'), (a) => !!a.nameChangeBy),
          question: t('¿En qué fecha?', 'On what date?'),
          why: t('La fecha del matrimonio, divorcio o anulación, o la de la orden de la corte. Adjunte una copia del acta o de la orden.', 'The date of the marriage, divorce or annulment, or of the court order. Attach a copy of the certificate or order.'),
          fields: [date('nameChange.date', 'Fecha', 'Date of event or court order', 'Part 5 · Item 1.a or 1.b')],
        },
        {
          id: 'dobChangeBy',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 6 · Items 1.a–1.b',
          showIf: reason('dob'),
          question: t('¿Con qué documento cambió su fecha de nacimiento?', 'What changed your date of birth?'),
          options: options([
            ['A', 'Una orden de la corte', 'Court order'],
            ['B', 'Un documento del gobierno de EE.UU. (por ejemplo, un acta de nacimiento)', 'A U.S. Government-issued document (for example, a birth certificate)'],
          ]),
        },
        {
          id: 'dobChange',
          kind: 'fields',
          formRef: 'Part 6 · Items 1–2',
          showIf: reason('dob'),
          question: t('Fechas del cambio', 'Dates of the change'),
          fields: [
            date('dobChange.courtDate', 'Fecha de la orden de la corte (si aplica)', 'Date of court order (if any)', 'Part 6 · Item 1.a', false),
            date('dobChange.govDate', 'Fecha del documento del gobierno (si aplica)', 'Date of U.S. Government-issued document (if any)', 'Part 6 · Item 1.b', false),
            date('newDob', 'Su nueva fecha de nacimiento', 'Your new date of birth', 'Part 6 · Item 2'),
          ],
        },
        {
          id: 'sex',
          kind: 'choice',
          formRef: 'Part 7 · Item 1',
          showIf: reason('sex'),
          question: t('¿Cuál fue su sexo biológico al nacer?', 'What was your biological sex at birth?'),
          why: t('Adjunte su acta de nacimiento y el certificado original.', 'Attach your birth certificate and the original certificate.'),
          options: sexOptions,
        },
        {
          id: 'foreignCountry',
          kind: 'fields',
          formRef: 'Part 8 · Items 1–2',
          showIf: is('docType', 'SCN'),
          question: t('¿Qué país pide la prueba de su ciudadanía?', 'Which country is asking for proof of your citizenship?'),
          fields: [
            text('foreign.country', 'País', 'Name of foreign country', 'Part 8 · Item 1', { placeholder: 'Mexico' }),
            ...nameFields('official', 'Part 8 · Item 2', false),
            text('official.title', 'Cargo del funcionario', 'Official title', 'Part 8 · Item 2', { required: false }),
            text('official.agency', 'Nombre de la oficina de gobierno', 'Name of government agency', 'Part 8 · Item 2', { required: false }),
          ],
        },
        {
          id: 'officialAddress',
          kind: 'fields',
          formRef: 'Part 8 · Item 3 · Foreign Official’s Address',
          showIf: is('docType', 'SCN'),
          question: t('Dirección del funcionario extranjero (si la sabe)', 'The foreign official’s address (if known)'),
          fields: anyAddress('official.address', 'Part 8 · Item 3', { streetRequired: false }).map((f) => ({ ...f, required: false })),
        },
      ],
    },
    {
      id: 'certificate',
      part: 'Part 1',
      title: t('Su certificado actual', 'Your current certificate'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 2 · Item 1 · Your Full Legal Name',
          question: t('¿Cuál es su nombre legal hoy?', 'What is your full legal name today?'),
          why: t('Sin apodos. Si se cambió el nombre, ponga el nuevo.', 'No nicknames. If your name changed, give the new one.'),
          fields: nameFields('name', 'Part 2 · Item 1'),
        },
        {
          id: 'certNameSame',
          kind: 'choice',
          formRef: 'Part 1 · Item 1 · Your Full Name',
          question: t('¿Su nombre aparece exactamente así en el certificado?', 'Is your name printed exactly like that on the certificate?'),
          options: yesNo,
        },
        {
          id: 'certName',
          kind: 'fields',
          formRef: 'Part 1 · Item 1 · Your Full Name',
          showIf: is('certNameSame', 'no'),
          question: t('El nombre tal como aparece en el certificado', 'The name exactly as printed on the certificate'),
          why: t('Cópielo letra por letra, aunque tenga un error.', 'Copy it letter by letter, even if it has a mistake.'),
          fields: nameFields('certName', 'Part 1 · Item 1'),
        },
        {
          id: 'certDetails',
          kind: 'fields',
          formRef: 'Part 1 · Items 2–6',
          question: t('Datos de su certificado', 'Details of your certificate'),
          why: t('Si no tiene una copia, ponga lo que sepa. El número del certificado está arriba a la derecha (por lo general rojo).', 'If you have no copy, give what you know. The certificate number is at the top right (usually red).'),
          fields: [
            date('dob', 'Fecha de nacimiento como aparece en el certificado', 'Date of birth on certificate or declaration', 'Part 1 · Item 2'),
            text('birthCountry', 'País de nacimiento', 'Country of birth', 'Part 1 · Item 3', { placeholder: 'Mexico' }),
            text('priorCitizenship', 'País de su ciudadanía anterior', 'Country of former citizenship or nationality', 'Part 1 · Item 4', { placeholder: 'Mexico' }),
            text('certNumber', 'Número del certificado (si lo sabe)', 'Certificate or declaration number (if known)', 'Part 1 · Item 5', { required: false, maxLength: 20, placeholder: '12345678' }),
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 1 · Item 6' },
          ],
        },
        {
          id: 'issuance',
          kind: 'fields',
          formRef: 'Part 1 · Item 7 · Certificate or Declaration Issuance',
          question: t('¿Quién le dio el certificado y cuándo?', 'Who issued the certificate, and when?'),
          why: t('La oficina de USCIS o la corte donde hizo el juramento, y la fecha. Si no la sabe exacta, ponga la que aparece en su copia o déjela en blanco.', 'The USCIS office or court where you took the oath, and the date. If you do not know it exactly, use the one on your copy or leave it blank.'),
          fields: [
            text('cert.office', 'Oficina de USCIS o nombre de la corte', 'USCIS office or name of court', 'Part 1 · Item 7', { required: false, placeholder: 'USCIS Houston Field Office' }),
            date('cert.date', 'Fecha en que se emitió', 'Date issued', 'Part 1 · Item 7', false),
          ],
        },
      ],
    },
    {
      id: 'about',
      part: 'Part 2',
      title: t('Sus datos de hoy', 'About you today'),
      questions: [
        {
          id: 'otherName.more0',
          kind: 'choice',
          formRef: 'Part 2 · Item 2 · Other Names Used',
          question: t('¿Ha usado otros nombres (de soltera, apodos, alias)?', 'Have you used other names (maiden name, nicknames, aliases)?'),
          options: yesNo,
        },
        ...rows({
          max: 2,
          id: 'otherName',
          first: is('otherName.more0', 'yes'),
          question: (i) => (i === 1 ? t('Otro nombre que ha usado', 'Another name you have used') : t('Otro nombre más', 'One more name')),
          more: t('¿Ha usado otro nombre más?', 'Have you used another name?'),
          formRef: 'Part 2 · Item 2',
          fields: (i) => nameFields(`otherName${i}`, `Part 2 · Item 2 · Name ${i}`),
          overflow: t('Si son más de 2, escríbalos a mano en la Parte 12.', 'If there are more than 2, write them by hand in Part 12.'),
        }),
        { id: 'mailing', kind: 'fields', formRef: 'Part 2 · Item 3 · Current Mailing Address', question: t('¿A qué dirección le llega el correo?', 'What is your mailing address?'), why: t('USCIS enviará el nuevo certificado aquí.', 'USCIS will mail the new certificate here.'), fields: anyAddress('mailing', 'Part 2 · Item 3', { careOf: true }) },
        {
          id: 'marital',
          kind: 'choice',
          formRef: 'Part 2 · Item 4 · Your Current Marital Status',
          question: t('¿Cuál es su estado civil?', 'What is your marital status?'),
          why: t('Si está separado/a pero sigue casado/a, elija Casado/a.', 'If you are separated but still married, choose Married.'),
          options: options([
            ['single', 'Soltero/a, nunca casado/a', 'Single, never married'],
            ['married', 'Casado/a', 'Married'],
            ['divorced', 'Divorciado/a', 'Divorced'],
            ['widowed', 'Viudo/a', 'Widowed'],
            ['annulled', 'Matrimonio anulado', 'Marriage annulled'],
          ]),
        },
        {
          id: 'lostCitizenship',
          kind: 'choice',
          formRef: 'Part 2 · Item 5',
          question: t('Desde que es ciudadano/a, ¿ha perdido o renunciado a su ciudadanía de EE.UU. de alguna forma?', 'Since becoming a U.S. citizen, have you lost or renounced your U.S. citizenship in any manner?'),
          notice: {
            tone: 'legal',
            title: t('Pregunta importante', 'Important question'),
            body: t('Casi todas las personas contestan No. Hacerse ciudadano/a de otro país o votar allí no le quita la ciudadanía por sí solo. Si renunció formalmente ante un consulado o no está seguro/a, hable con un abogado de inmigración antes de presentar.', 'Almost everyone answers No. Becoming a citizen of another country or voting there does not by itself end your citizenship. If you formally renounced at a consulate or are not sure, talk to an immigration attorney before filing.'),
          },
          options: yesNo,
        },
        {
          id: 'lostCitizenshipExplain',
          kind: 'fields',
          formRef: 'Part 2 · Item 5 · Part 12',
          showIf: is('lostCitizenship', 'yes'),
          question: t('Explique qué pasó', 'Explain what happened'),
          fields: [{ id: 'lostCitizenship.explain', type: 'longText', required: true, label: t('Explicación (en inglés)', 'Explanation'), formRef: 'Part 12' }],
        },
      ],
    },
    {
      id: 'contact',
      part: 'Part 9',
      title: t('Contacto', 'Contact'),
      questions: [
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 9 · Items 1–3',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 9 · Item 1', placeholder: '713 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 9 · Item 2' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 9 · Item 3' },
          ],
        },
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 9 · Applicant’s Certification',
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          why: t('Si un intérprete le leyó las preguntas en su idioma, sus datos van en la Parte 10.', 'If an interpreter read you the questions in your language, their details go in Part 10.'),
          options: options([
            ['A', 'Sí, leo inglés', 'Yes, I read English'],
            ['B', 'No, un intérprete me lo leyó', 'No, an interpreter read it to me'],
          ]),
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 11 · Person Preparing this Application, if Other Than the Applicant',
          question: t('¿Alguien más (no usted) preparó esta solicitud?', 'Did someone else prepare this application for you?'),
          why: t('Si es así, sus datos van en la Parte 11.', 'If so, their details go in Part 11.'),
          options: yesNo,
        },
      ],
    },
    assistanceParts(),
  ],
};

/** Parts 10 and 11. This edition has no address or attorney statement for the interpreter or preparer. */
function assistanceParts() {
  const section = assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 10', preparerPart: 'Part 11' });
  const missing = ['interp.address', 'prep.address', 'prep.statement'];
  return { ...section, questions: section.questions.filter((q) => !missing.includes(q.id)) };
}
