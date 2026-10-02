import type { FormDefinition, Option } from './types';
import type { T } from '../i18n';
import { anyAddress, date, is, nameFields, yesNo } from './helpers';

// Questions follow USCIS Form I-407, Record of Abandonment of Lawful Permanent Resident Status,
// edition 09/25/24. The PDF mapping lives in src/pdf/i407Pdf.ts.
//
// This edition has no item asking why the person gives up the green card: the only "reason"
// checkboxes are Part 1, Item 12 (why the card is not returned: lost, stolen, mutilated, other) and
// Items 15-18 (where and how the form is submitted, which also picks the certification that applies).
//
// Out of scope (left for hand):
// - Part 1, Item 13's date and Item 20 (signature and date).
// - Parts 2 and 3 (interpreter and preparer) and Part 4 (for government use only).

export const I407_EDITION = '09/25/24';

const t = (es: string, en: string): T => ({ es, en });

/** Part 1, Items 15-18, by the PDF's export values. */
export const SUBMISSION: Option[] = [
  { value: 'A', label: t('Estoy fuera de EE.UU. y lo entrego en persona (en una embajada o consulado de EE.UU.)', 'I am outside the U.S. and submit it in person (at a U.S. embassy or consulate)') },
  { value: 'B', label: t('Estoy fuera de EE.UU. y lo envío por correo', 'I am outside the U.S. and submit it by mail') },
  { value: 'C', label: t('Lo entrego en un puerto de entrada de EE.UU. (aeropuerto o frontera)', 'I submit it at a U.S. port of entry (airport or border)') },
  {
    value: 'D',
    label: t(
      'Estoy dentro de EE.UU. y solo quiero dejar constancia de que ya dejé mi residencia en el pasado (me fui a vivir a otro país y después volví con visa o permiso de parole)',
      'I am inside the U.S. and only want to record that I already gave up my residence in the past (I moved abroad to live and later came back on a visa or parole)',
    ),
  },
];

/** Part 1, Item 12, by the PDF's export values. */
export const CARD_REASONS: Option[] = [
  { value: 'L', label: t('Se me perdió', 'Lost') },
  { value: 'S', label: t('Me la robaron', 'Stolen') },
  { value: 'M', label: t('Está dañada o rota', 'Mutilated') },
  { value: 'O', label: t('Otra razón', 'Other') },
];

const LEGAL_WARNING = {
  tone: 'legal' as const,
  title: t('Esto es para siempre: usted renuncia a su green card', 'This is permanent: you give up your green card'),
  body: t(
    'Al firmar el I-407 usted renuncia para siempre a su residencia permanente. Pierde su green card, el derecho a vivir y trabajar en EE.UU. y el tiempo que llevaba para hacerse ciudadano/a. Para volver a ser residente tendría que empezar todo de nuevo, y muchas personas no pueden. También renuncia a su derecho a una audiencia ante un juez de inmigración. Llenar este formulario es VOLUNTARIO: la ley no le obliga a firmarlo, y nadie (ni un oficial en el aeropuerto, ni un familiar, ni un empleador) puede obligarle. Si un oficial dice que usted abandonó su residencia, usted puede negarse a firmar y pedir una audiencia ante un juez. Si tiene dudas, si alguien le presiona o si piensa volver a vivir en EE.UU., no firme: hable antes con un abogado de inmigración o una organización acreditada.',
    'By signing Form I-407 you permanently give up your lawful permanent residence. You lose your green card, the right to live and work in the U.S., and the time you had built toward citizenship. To become a resident again you would have to start over, and many people cannot. You also give up your right to a hearing before an immigration judge. Filing this form is VOLUNTARY: the law does not require you to sign it, and no one (not an airport officer, a relative or an employer) can make you. If an officer says you abandoned your residence, you may refuse to sign and ask for a hearing before a judge. If you are unsure, if anyone is pressuring you, or if you plan to live in the U.S. again, do not sign: talk to an immigration attorney or an accredited organization first.',
  ),
};

export const i407: FormDefinition = {
  id: 'i-407',
  number: 'I-407',
  edition: I407_EDITION,
  title: t('Registro de abandono de la residencia permanente', 'Record of Abandonment of Lawful Permanent Resident Status'),
  summary: {
    es: 'Renuncie de forma voluntaria y permanente a su green card, por ejemplo si ya vive en otro país y no piensa volver.',
    en: 'Voluntarily and permanently give up your green card, for example if you now live in another country and do not plan to return.',
  },
  intro: {
    es: 'El I-407 deja constancia de que usted renuncia a su residencia permanente (green card). Es una decisión que no se puede deshacer y es completamente voluntaria. Algunas personas lo usan cuando se mudaron a otro país para siempre, o para pedir después una visa de turista sin problemas. Si no está seguro/a, si alguien le está presionando o si quiere conservar su residencia, hable primero con un abogado de inmigración. No hay tarifa.',
    en: 'Form I-407 records that you give up your lawful permanent residence (green card). It cannot be undone and it is entirely voluntary. Some people use it when they have moved abroad for good, or so they can later ask for a visitor visa without problems. If you are unsure, if anyone is pressuring you, or if you want to keep your residence, talk to an immigration attorney first. There is no fee.',
  },
  minutes: 10,
  pdf: {
    path: 'forms/i-407.pdf',
    fileName: 'I-407-filled.pdf',
    load: () => import('../pdf/i407Pdf').then((m) => m.fillI407),
    signHere: { es: 'Parte 1, Ítem 20', en: 'Part 1, Item 20' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-407 que la edición {edition} sigue vigente y dónde entregarlo según su caso (consulado, puerto de entrada o por correo a la dirección de las instrucciones).',
      'Antes de firmar, léalo todo otra vez: firmar significa renunciar para siempre a su green card. Si tiene dudas o alguien le presiona, no firme y hable con un abogado de inmigración.',
      'Adjunte su green card (tarjeta de residente) y cualquier otro documento que devuelva, como un permiso de reingreso o documento de viaje de refugiado. Guarde una copia de todo.',
      'Imprima el PDF y firme la Parte 1, Ítem 20, a mano con tinta negra y ponga la fecha. Si no devuelve la tarjeta, escriba esa misma fecha en el Ítem 13. Si firma un padre o tutor, adjunte la prueba de la tutela.',
      'Si un intérprete o preparador le ayudó, ellos llenan y firman a mano las Partes 2 y 3. No llene la Parte 4: es para el oficial.',
      'Pida y guarde una copia del I-407 firmado y sellado; le servirá si después pide una visa.',
    ],
    en: [
      'Check at uscis.gov/i-407 that edition {edition} is still current and where to submit it for your situation (consulate, port of entry, or by mail to the address in the instructions).',
      'Before signing, read it all again: signing means giving up your green card forever. If you are unsure or anyone is pressuring you, do not sign and talk to an immigration attorney.',
      'Attach your Permanent Resident Card and any other document you are returning, such as a reentry permit or refugee travel document. Keep a copy of everything.',
      'Print the PDF and sign Part 1, Item 20, by hand in black ink and date it. If you are not returning the card, write that same date in Item 13. If a parent or guardian signs, attach proof of guardianship.',
      'If an interpreter or preparer helped you, they complete and sign Parts 2 and 3 by hand. Leave Part 4 blank: it is for the officer.',
      'Ask for and keep a copy of the signed, stamped I-407; it helps if you later apply for a visa.',
    ],
  },
  sections: [
    {
      id: 'you',
      part: 'Part 1',
      title: t('Sus datos', 'About you'),
      questions: [
        {
          id: 'understands',
          kind: 'choice',
          formRef: 'Part 1 · Certification',
          notice: LEGAL_WARNING,
          question: t('¿Entiende que esto es permanente y lo hace por su propia voluntad?', 'Do you understand this is permanent, and are you doing it of your own free will?'),
          why: t('Al firmar, usted declara que lo hace a sabiendas y por voluntad propia, y que renuncia a una audiencia ante un juez.', 'When you sign, you declare that you do this knowingly and willingly, and that you waive a hearing before a judge.'),
          options: [
            { value: 'yes', label: t('Sí, lo entiendo y es mi decisión', 'Yes, I understand and it is my decision') },
            { value: 'unsure', label: t('No estoy seguro/a, o alguien me está presionando', 'I am not sure, or someone is pressuring me') },
          ],
        },
        {
          id: 'unsureNext',
          kind: 'choice',
          formRef: 'Part 1 · Certification',
          showIf: is('understands', 'unsure'),
          notice: {
            tone: 'legal',
            title: t('Le recomendamos parar aquí', 'We recommend you stop here'),
            body: t(
              'No tiene que firmar el I-407. Si un oficial de inmigración le pide que lo firme, puede decir que no y pedir que un juez de inmigración decida si usted abandonó su residencia. Busque un abogado de inmigración o una organización acreditada (puede buscar en justice.gov/eoir, "recognized organizations") antes de seguir. Puede guardar sus respuestas y volver después.',
              'You do not have to sign Form I-407. If an immigration officer asks you to sign it, you may say no and ask that an immigration judge decide whether you abandoned your residence. Find an immigration attorney or an accredited organization (see justice.gov/eoir, "recognized organizations") before going on. You can keep your answers and come back later.',
            ),
          },
          question: t('¿Qué quiere hacer?', 'What would you like to do?'),
          options: [
            { value: 'stop', label: t('Voy a hablar con un abogado antes de seguir', 'I will talk to an attorney before going on') },
            { value: 'continue', label: t('Ya recibí consejo y quiero seguir', 'I already got advice and want to go on') },
          ],
        },
        {
          id: 'ids',
          kind: 'fields',
          formRef: 'Part 1 · Items 1–2',
          question: t('Sus números de inmigración', 'Your immigration numbers'),
          why: t('El A-Number aparece en su green card como "USCIS#".', 'The A-Number is on your green card as "USCIS#".'),
          fields: [
            { id: 'aNumber', type: 'aNumber', required: true, label: { es: 'A-Number', en: 'A-Number' }, formRef: 'Part 1 · Item 1' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Cuenta en línea de USCIS (si tiene)', en: 'USCIS online account number (if any)' }, formRef: 'Part 1 · Item 2' },
          ],
        },
        {
          id: 'cardNameScreen',
          kind: 'fields',
          formRef: 'Part 1 · Item 3',
          question: t('¿Cómo aparece su nombre en la green card?', 'How does your name appear on your green card?'),
          why: t('Escríbalo exactamente como está en la tarjeta, aunque haya cambiado.', 'Write it exactly as printed on the card, even if it has changed.'),
          fields: [{ id: 'cardName', type: 'text', required: true, label: { es: 'Nombre como aparece en la tarjeta', en: 'Name exactly as on the card' }, formRef: 'Part 1 · Item 3', maxLength: 40, placeholder: 'MARIA ELENA TORRES RUIZ' }],
        },
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 1 · Item 4 · Your Current Legal Name',
          question: t('¿Cuál es su nombre legal actual?', 'What is your current legal name?'),
          fields: nameFields('name', 'Part 1 · Item 4'),
        },
        {
          id: 'birth',
          kind: 'fields',
          formRef: 'Part 1 · Items 5–7 · Other Information',
          question: t('Su fecha y país de nacimiento', 'Your date and country of birth'),
          fields: [
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 5'),
            { id: 'birthCountry', type: 'text', required: true, label: { es: 'País de nacimiento (en inglés)', en: 'Country of birth' }, formRef: 'Part 1 · Item 6', placeholder: 'Mexico' },
            { id: 'citizenship', type: 'text', required: true, label: { es: 'País de ciudadanía o nacionalidad (en inglés)', en: 'Country of citizenship or nationality' }, formRef: 'Part 1 · Item 7', placeholder: 'Mexico' },
          ],
        },
      ],
    },
    {
      id: 'residence',
      part: 'Part 1',
      title: t('Su residencia', 'Your residence'),
      questions: [
        {
          id: 'departure',
          kind: 'fields',
          formRef: 'Part 1 · Item 8',
          question: t('¿Cuándo salió de EE.UU. por última vez?', 'When did you last leave the United States?'),
          fields: [date('lastDeparture', 'Fecha de su última salida de EE.UU.', 'Date of last departure from the U.S.', 'Part 1 · Item 8')],
        },
        {
          id: 'submission',
          kind: 'choice',
          formRef: 'Part 1 · Items 15–18 · Location of Submission',
          question: t('¿Desde dónde y cómo entrega este formulario?', 'Where and how are you submitting this form?'),
          why: t('Esto decide cuál de las dos declaraciones de la página 2 aplica a usted.', 'This decides which of the two certifications on page 2 applies to you.'),
          notice: {
            tone: 'legal',
            title: t('Si está en un aeropuerto o frontera', 'If you are at an airport or border'),
            body: t(
              'Un oficial de CBP puede ofrecerle este formulario si cree que usted pasó mucho tiempo fuera. Usted no está obligado/a a firmarlo. Si quiere conservar su residencia, puede negarse y pedir una audiencia ante un juez de inmigración.',
              'A CBP officer may offer you this form if they think you spent too long abroad. You are not required to sign it. If you want to keep your residence, you may refuse and ask for a hearing before an immigration judge.',
            ),
          },
          options: SUBMISSION,
        },
      ],
    },
    {
      id: 'contact',
      part: 'Part 1',
      title: t('Su dirección y contacto', 'Your address and contact'),
      questions: [
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 1 · Item 9 · Mailing Address Outside of the United States',
          question: t('¿Cuál es su dirección postal fuera de EE.UU.?', 'What is your mailing address outside the United States?'),
          why: t('Es donde USCIS puede enviarle correo sobre este formulario.', 'This is where USCIS can send you mail about this form.'),
          fields: anyAddress('mailing', 'Part 1 · Item 9', { careOf: true }),
        },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 1 · Item 10',
          question: t('¿Cuál es su correo electrónico?', 'What is your email address?'),
          why: t('USCIS recomienda darlo si está fuera de EE.UU., para poder contactarle. El formulario no pide teléfono.', 'USCIS recommends giving it if you are outside the U.S., so they can contact you. The form does not ask for a phone number.'),
          fields: [{ id: 'email', type: 'email', label: { es: 'Correo electrónico (si tiene)', en: 'Email (if any)' }, formRef: 'Part 1 · Item 10' }],
        },
      ],
    },
    {
      id: 'documents',
      part: 'Part 1',
      title: t('Documentos que devuelve', 'Documents returned'),
      questions: [
        {
          id: 'cardReturned',
          kind: 'choice',
          formRef: 'Part 1 · Item 11',
          question: t('¿Va a devolver su green card con este formulario?', 'Are you returning your green card with this form?'),
          options: yesNo,
        },
        {
          id: 'cardReason',
          kind: 'choice',
          formRef: 'Part 1 · Items 12–13',
          showIf: is('cardReturned', 'no'),
          question: t('¿Por qué no devuelve la tarjeta?', 'Why are you not returning the card?'),
          why: t(
            'Marcaremos también la declaración del Ítem 13, bajo pena de perjurio, de que ya no tiene la tarjeta. Escriba a mano en ese ítem la misma fecha en que firme el formulario.',
            'We will also check the Item 13 statement, under penalty of perjury, that you no longer have the card. Write by hand in that item the same date you sign the form.',
          ),
          options: CARD_REASONS,
        },
        {
          id: 'otherDocs.has',
          kind: 'choice',
          formRef: 'Part 1 · Item 14',
          question: t('¿Devuelve algún otro documento?', 'Are you returning any other documents?'),
          why: t('Por ejemplo un permiso de reingreso (I-327) o un documento de viaje de refugiado (I-571).', 'For example a reentry permit (I-327) or a refugee travel document (I-571).'),
          options: yesNo,
        },
        {
          id: 'otherDocsList',
          kind: 'fields',
          formRef: 'Part 1 · Item 14',
          showIf: is('otherDocs.has', 'yes'),
          question: t('¿Qué otros documentos devuelve?', 'What other documents are you returning?'),
          fields: [{ id: 'otherDocs', type: 'longText', required: true, label: { es: 'Documentos (en inglés)', en: 'Documents' }, formRef: 'Part 1 · Item 14', placeholder: 'Reentry permit' }],
        },
      ],
    },
    {
      id: 'signer',
      part: 'Part 1',
      title: t('Quién firma', 'Who signs'),
      questions: [
        {
          id: 'filer',
          kind: 'choice',
          formRef: 'Part 1 · Item 19 · Consent of Parents or Legal Guardian',
          question: t('¿Quién va a firmar el formulario?', 'Who will sign the form?'),
          why: t(
            'Un padre, madre o tutor legal firma solo si la persona tiene 14 años o menos, o es un adulto que no puede decidir por sí mismo. En ese caso debe adjuntar prueba de la tutela.',
            'A parent or legal guardian signs only for a child 14 or younger, or for an adult who cannot decide for themselves. They must attach proof of guardianship.',
          ),
          options: [
            { value: 'self', label: t('Yo mismo/a', 'I will') },
            { value: 'guardian', label: t('Mi padre, madre o tutor legal', 'My parent or legal guardian') },
          ],
        },
        {
          id: 'guardianName',
          kind: 'fields',
          formRef: 'Part 1 · Item 19',
          showIf: is('filer', 'guardian'),
          question: t('¿Cómo se llama el padre, madre o tutor que firma?', 'What is the name of the parent or guardian signing?'),
          fields: [{ id: 'guardian.name', type: 'text', required: true, label: { es: 'Nombre completo', en: 'Full name' }, formRef: 'Part 1 · Item 19', maxLength: 60 }],
        },
      ],
    },
  ],
};
