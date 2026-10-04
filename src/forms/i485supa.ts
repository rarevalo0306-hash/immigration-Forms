import type { Field, FormDefinition, Option, Question } from './types';
import type { T } from '../i18n';
import { date, is, nameFields, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';

// Questions follow USCIS Supplement A to Form I-485, Adjustment of Status Under Section 245(i),
// edition 09/18/26. The PDF mapping lives in src/pdf/i485supaPdf.ts.
//
// Supplement A is filed with the I-485 (or while an I-485 is pending), so the applicant's answers use
// the I-485's ids (`name.*`, `aNumber`, `uscisAccount`, `dob`, `birthCountry`, `citizenship`,
// `mailing.*`, `phone`, `mobile`, `email`) and Camino's data reuse fills them.
//
// Out of scope (left for hand): the applicant's signature and date (Part 4, Item 4) and the
// interpreter's and preparer's signatures and dates (Parts 5 and 6, Item 6). The rest of Parts 5 and 6
// comes from the "Who helped you" section. This edition has no Additional Information part.
//
// The supplement has no applicant's statement boxes, so the contact section asks whether an
// interpreter read the form to the person (`readsEnglish`) and whether someone else prepared it
// (`preparer`): those answers only decide whether Parts 5 and 6 are asked and filled.

export const I485SUPA_EDITION = '09/18/26';

const t = (es: string, en: string): T => ({ es, en });

/** Part 2, Item 1: the basis of 245(i) eligibility, by the PDF's export values. */
export const BASIS: Option[] = [
  {
    value: 'A',
    label: t(
      'Soy (o fui) el/la beneficiario/a principal de una petición de inmigrante o certificación laboral presentada el 14 de enero de 1998 o antes',
      'I am or was the principal beneficiary of an immigrant petition or labor certification filed on or before January 14, 1998',
    ),
  },
  {
    value: 'B',
    label: t(
      'Soy (o fui) el/la beneficiario/a principal de una petición o certificación laboral presentada entre el 15 de enero de 1998 y el 30 de abril de 2001, y estaba en EE.UU. el 21 de diciembre de 2000',
      'I am or was the principal beneficiary of a petition or labor certification filed from January 15, 1998, through April 30, 2001, and I was in the U.S. on December 21, 2000',
    ),
  },
  {
    value: 'C',
    label: t(
      'Soy (o fui) beneficiario/a derivado/a (cónyuge o hijo/a del principal) de una petición o certificación laboral presentada el 14 de enero de 1998 o antes',
      'I am or was a derivative beneficiary (spouse or child of the principal) of a petition or labor certification filed on or before January 14, 1998',
    ),
  },
  {
    value: 'D',
    label: t(
      'Soy (o fui) beneficiario/a derivado/a de una petición o certificación laboral presentada entre el 15 de enero de 1998 y el 30 de abril de 2001, y el/la principal estaba en EE.UU. el 21 de diciembre de 2000',
      'I am or was a derivative beneficiary of a petition or labor certification filed from January 15, 1998, through April 30, 2001, and the principal was in the U.S. on December 21, 2000',
    ),
  },
  {
    value: 'E',
    label: t(
      'Soy el/la cónyuge actual, o hijo/a soltero/a menor de 21 años, de una persona de las opciones anteriores, y pido acompañarla o reunirme con ella',
      'I am the current spouse, or unmarried child under 21, of a person described above, applying to accompany or follow to join them',
    ),
  },
];

/** Part 3, Item 1: the bars to adjustment, by the PDF's export values. */
export const BARS: Option[] = [
  { value: 'A', label: t('Mi última entrada a EE.UU. fue sin inspección (sin que un oficial me admitiera o me diera parole)', 'I last entered the U.S. without being admitted or paroled after inspection') },
  { value: 'B', label: t('Mi última entrada fue como tripulante (crewman) de barco o avión', 'I last entered the U.S. as a nonimmigrant crewman') },
  { value: 'C', label: t('Trabajo o he trabajado en EE.UU. sin permiso', 'I am now or have ever been employed in the U.S. without authorization') },
  { value: 'D', label: t('No tengo un estatus migratorio legal el día en que presento el ajuste', 'I am not in lawful immigration status on the date I file for adjustment') },
  { value: 'E', label: t('Alguna vez dejé de mantener un estatus legal desde que entré (salvo por razones técnicas o que no fueron mi culpa)', 'I have ever failed to continuously maintain lawful status since entry (unless through no fault of my own or for technical reasons)') },
  { value: 'F', label: t('Mi última admisión fue en tránsito sin visa', 'I was last admitted in transit without a visa') },
  { value: 'G', label: t('Mi última admisión fue como visitante sin visa del programa de Guam y las Islas Marianas del Norte (y no soy canadiense)', 'I was last admitted as a visitor without a visa under the Guam-CNMI Visa Waiver Program (and I am not Canadian)') },
  { value: 'H', label: t('Mi última admisión fue como visitante sin visa del Programa de Exención de Visas (Visa Waiver / ESTA)', 'I was last admitted as a visitor without a visa under the Visa Waiver Program') },
  { value: 'I', label: t('Pido el ajuste por empleo y no mantengo un estatus de no inmigrante legal al presentar', 'I am seeking employment-based adjustment and I am not maintaining lawful nonimmigrant status when I file') },
  { value: 'J', label: t('Alguna vez violé los términos de mi estatus de no inmigrante (por ejemplo, trabajé con visa de turista)', 'I have ever violated the terms of my nonimmigrant status') },
];

/** Bases where someone else is the principal beneficiary of the qualifying petition. */
export const otherPrincipal = is('basis245i', 'C', 'D', 'E');

const ELIGIBILITY_NOTICE: Question['notice'] = {
  tone: 'legal',
  title: t('Si califica para la 245(i) es una pregunta legal', 'Whether you qualify for 245(i) is a legal question'),
  body: t(
    'La sección 245(i) solo ayuda si una petición de inmigrante (por ejemplo un I-130 o I-140) o una certificación laboral (ETA-750) a nombre suyo o de su familiar se presentó el 30 de abril de 2001 o antes, y se podía aprobar cuando se presentó. Si se presentó después del 14 de enero de 1998, la persona principal también tenía que estar físicamente en EE.UU. el 21 de diciembre de 2000. Además, la 245(i) no perdona todo: si salió de EE.UU. después de estar sin estatus, tiene una orden de deportación o algún otro problema, puede necesitar un perdón (I-601 o I-212) o quizá no califique. Antes de presentar, pida a un abogado de inmigración o a un representante acreditado (DOJ) que revise su caso y sus pruebas.',
    'Section 245(i) only helps if an immigrant petition (for example an I-130 or I-140) or a labor certification (ETA-750) for you or your family member was filed on or before April 30, 2001, and was approvable when filed. If it was filed after January 14, 1998, the principal also had to be physically present in the U.S. on December 21, 2000. And 245(i) does not cure everything: if you left the U.S. after being out of status, have a removal order or another problem, you may need a waiver (I-601 or I-212) or may not qualify. Before you file, ask an immigration attorney or a DOJ-accredited representative to review your case and evidence.',
  ),
};

const DATES_NOTICE: Question['notice'] = {
  tone: 'legal',
  title: t('Fechas que deciden si califica', 'Dates that decide whether you qualify'),
  body: t(
    'La petición o certificación laboral debe haberse presentado el 30 de abril de 2001 o antes. Si se presentó del 15 de enero de 1998 en adelante, la persona principal tenía que estar físicamente en EE.UU. el 21 de diciembre de 2000, y hay que probarlo. Elegir la opción correcta es una decisión legal: si duda, consulte a un abogado de inmigración antes de presentar.',
    'The petition or labor certification must have been filed on or before April 30, 2001. If it was filed on or after January 15, 1998, the principal had to be physically present in the U.S. on December 21, 2000, and you must prove it. Choosing the right option is a legal decision: if in doubt, consult an immigration attorney before you file.',
  ),
};

const BARS_NOTICE: Question['notice'] = {
  tone: 'legal',
  title: t('Responda con la verdad', 'Answer truthfully'),
  body: t(
    'Aquí le dice a USCIS por qué necesita la 245(i), por ejemplo que entró sin inspección o que trabajó sin permiso. Sus respuestas deben coincidir con su I-485. Si ninguna aplica, quizá no necesite este suplemento. Si no está seguro/a de cuáles marcar, hable con un abogado de inmigración antes de presentar.',
    'Here you tell USCIS why you need 245(i), for example that you entered without inspection or worked without permission. Your answers must match your I-485. If none apply, you may not need this supplement. If you are not sure which to mark, talk to an immigration attorney before you file.',
  ),
};

/** The U.S. mailing address of Part 1, Item 2, with the I-485's ids. The street box holds 25 characters. */
const mailingAddress = (ref: string): Field[] => [
  { id: 'mailing.careOf', type: 'text', label: t('A cargo de (si recibe correo en casa de otra persona)', 'In care of (if any)'), formRef: `${ref} · In Care Of Name`, maxLength: 34 },
  { id: 'mailing.street', type: 'text', required: true, label: t('Número y calle', 'Street number and name'), formRef: `${ref} · Street Number and Name`, maxLength: 25, placeholder: '1234 Main St' },
  { id: 'mailing.unit', type: 'unit', label: t('Apartamento, suite o piso', 'Apartment, suite or floor'), formRef: `${ref} · Apt. / Ste. / Flr.`, placeholder: 'Apt 4B' },
  { id: 'mailing.city', type: 'text', required: true, label: t('Ciudad', 'City or town'), formRef: `${ref} · City or Town`, maxLength: 20 },
  { id: 'mailing.state', type: 'state', required: true, label: t('Estado', 'State'), formRef: `${ref} · State`, placeholder: 'CA' },
  { id: 'mailing.zip', type: 'zip', required: true, label: t('Código postal (ZIP)', 'ZIP code'), formRef: `${ref} · ZIP Code`, placeholder: '90210' },
];

/**
 * Parts 5 and 6 of this edition ask only for name, business, phones and email (plus the
 * interpreter's language): no mailing address and no preparer's statement boxes, so those
 * questions are left out.
 */
const help = assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 5', preparerPart: 'Part 6' });
const helpWithoutAddresses = { ...help, questions: help.questions.filter((q) => !['interp.address', 'prep.address', 'prep.statement'].includes(q.id)) };

export const i485supa: FormDefinition = {
  id: 'i-485supa',
  number: 'I-485 Supplement A',
  edition: I485SUPA_EDITION,
  title: t('Suplemento A del I-485: ajuste de estatus bajo la sección 245(i)', 'Supplement A to Form I-485, Adjustment of Status Under Section 245(i)'),
  summary: {
    es: 'Se presenta con el I-485 si pide la green card gracias a una petición o certificación laboral presentada el 30 de abril de 2001 o antes.',
    en: 'Filed with Form I-485 if you seek a green card based on a petition or labor certification filed on or before April 30, 2001.',
  },
  intro: {
    es: 'El Suplemento A no se presenta solo: va junto con su I-485, o después si su I-485 sigue pendiente. Sirve para pedir la residencia bajo la sección 245(i) a personas que, por ejemplo, entraron sin inspección o trabajaron sin permiso, siempre que una petición o certificación laboral se haya presentado el 30 de abril de 2001 o antes. Si ya llenó su I-485 en Camino, sus datos personales aparecerán llenos. Si califica es una pregunta legal: le recomendamos que un abogado de inmigración revise su caso antes de presentar.',
    en: 'Supplement A is never filed alone: it goes with your I-485, or later while your I-485 is pending. It lets people who, for example, entered without inspection or worked without permission seek a green card under section 245(i), as long as a petition or labor certification was filed on or before April 30, 2001. If you already filled in your I-485 in Camino, your personal details will be filled in. Whether you qualify is a legal question: we recommend that an immigration attorney review your case before you file.',
  },
  minutes: 15,
  pdf: {
    path: 'forms/i-485supa.pdf',
    fileName: 'I-485SupA-filled.pdf',
    load: () => import('../pdf/i485supaPdf').then((m) => m.fillI485supa),
    signHere: { es: 'Parte 4, Ítem 4', en: 'Part 4, Item 4' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-485supa que la edición {edition} sigue vigente.',
      'Antes de presentar, pida a un abogado de inmigración o a un representante acreditado (DOJ) que confirme que usted califica para la 245(i) y revise sus pruebas.',
      'Adjunte la prueba de la petición o certificación laboral que le da derecho a la 245(i) (el aviso I-797 o el ETA-750 con su sello de fecha) y, según su caso, la prueba de su relación con el/la principal y de que el/la principal estaba en EE.UU. el 21 de diciembre de 2000. Si un documento no está en inglés, incluya su traducción certificada.',
      'El Suplemento A tiene su propia tarifa, aparte de la del I-485. Confirme el monto actual en uscis.gov/g-1055.',
      'Imprima el PDF y firme la Parte 4, Ítem 4, a mano con tinta negra. Si un intérprete o preparador le ayudó, sus datos ya están en las Partes 5 y 6; ellos los revisan y firman y fechan a mano.',
      'Envíelo junto con su I-485 a la dirección del I-485 (uscis.gov/i-485, "Where to File"). Si su I-485 ya está pendiente, incluya una copia del recibo I-797 de ese I-485. Si está en corte de inmigración, siga las instrucciones de la corte.',
    ],
    en: [
      'Check at uscis.gov/i-485supa that edition {edition} is still current.',
      'Before you file, ask an immigration attorney or a DOJ-accredited representative to confirm that you qualify for 245(i) and to review your evidence.',
      'Attach proof of the petition or labor certification that qualifies you for 245(i) (the I-797 notice, or the ETA-750 with its date stamp) and, depending on your case, proof of your relationship to the principal and that the principal was in the U.S. on December 21, 2000. Include a certified translation of any document not in English.',
      'Supplement A has its own fee, separate from the I-485 fee. Check the current amount at uscis.gov/g-1055.',
      'Print the PDF and sign Part 4, Item 4, by hand in black ink. If an interpreter or preparer helped you, their details are already in Parts 5 and 6; they check them and sign and date by hand.',
      'Send it together with your I-485 to the I-485 address (uscis.gov/i-485, "Where to File"). If your I-485 is already pending, include a copy of that I-485’s I-797 receipt. If you are in immigration court, follow the court’s instructions.',
    ],
  },
  sections: [
    {
      id: 'about',
      part: 'Part 1',
      title: t('Sobre usted', 'About you'),
      questions: [
        {
          id: 'supa.timing',
          kind: 'choice',
          formRef: 'Supplement A · Note (filed with Form I-485)',
          notice: ELIGIBILITY_NOTICE,
          question: t('¿Cuándo presenta este suplemento?', 'When are you filing this supplement?'),
          why: t('El Suplemento A solo se acepta junto con un I-485, o mientras su I-485 sigue pendiente.', 'Supplement A is only accepted with a Form I-485, or while your I-485 is still pending.'),
          options: [
            { value: 'together', label: t('Junto con mi I-485', 'Together with my I-485') },
            { value: 'pending', label: t('Después: mi I-485 ya está presentado y pendiente', 'Later: my I-485 is already filed and pending') },
          ],
        },
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 1 · Item 1 · Your Current Legal Name',
          question: t('¿Cuál es su nombre legal actual?', 'What is your current legal name?'),
          why: t('Escríbalo igual que en su I-485.', 'Write it the same as on your I-485.'),
          fields: nameFields('name', 'Part 1 · Item 1'),
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 1 · Item 2 · U.S. Mailing Address',
          question: t('¿A qué dirección en EE.UU. le llega el correo?', 'What is your U.S. mailing address?'),
          why: t('La misma dirección postal que puso en su I-485.', 'The same mailing address you gave on your I-485.'),
          fields: mailingAddress('Part 1 · Item 2'),
        },
        {
          id: 'ids',
          kind: 'fields',
          formRef: 'Part 1 · Items 3–7 · Other Information',
          question: t('Sus números y datos de nacimiento', 'Your numbers and birth details'),
          fields: [
            { id: 'aNumber', type: 'aNumber', label: t('A-Number (si tiene)', 'A-Number (if any)'), formRef: 'Part 1 · Item 3 · Alien Registration Number (A-Number)', placeholder: 'A123456789' },
            { id: 'uscisAccount', type: 'uscisAccount', label: t('Cuenta en línea de USCIS (si tiene)', 'USCIS online account number (if any)'), formRef: 'Part 1 · Item 4 · USCIS Online Account Number' },
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 5 · Date of Birth'),
            { id: 'birthCountry', type: 'text', required: true, label: t('País de nacimiento (en inglés)', 'Country of birth'), formRef: 'Part 1 · Item 6 · Country of Birth', maxLength: 34, placeholder: 'Mexico' },
            { id: 'citizenship', type: 'text', required: true, label: t('País de ciudadanía o nacionalidad (en inglés)', 'Country of citizenship or nationality'), formRef: 'Part 1 · Item 7 · Country of Citizenship or Nationality', maxLength: 34, placeholder: 'Mexico' },
          ],
        },
      ],
    },
    {
      id: 'eligibility',
      part: 'Part 2',
      title: t('Por qué califica para la 245(i)', 'Your 245(i) eligibility'),
      questions: [
        {
          id: 'basis245i',
          kind: 'choice',
          formRef: 'Part 2 · Item 1 · Basis of INA Section 245(i) Eligibility',
          notice: DATES_NOTICE,
          question: t('¿Por qué califica para la sección 245(i)? Elija solo una.', 'Why do you qualify under section 245(i)? Choose only one.'),
          why: t(
            'El/la "beneficiario/a principal" es la persona a cuyo nombre se hizo la petición o la certificación laboral. El/la "derivado/a" es su cónyuge o hijo/a soltero/a menor de 21 años en ese momento.',
            'The "principal beneficiary" is the person the petition or labor certification was filed for. A "derivative" is their spouse or unmarried child under 21 at that time.',
          ),
          options: BASIS,
        },
        {
          id: 'qualifying',
          kind: 'fields',
          formRef: 'Part 2 · Item 2 · Qualifying Petition or Application',
          question: t('¿Cuál es el número de recibo de la petición que le da derecho a la 245(i)?', 'What is the receipt number of the petition that qualifies you for 245(i)?'),
          why: t(
            'Aparece en el aviso I-797 de esa petición (por ejemplo WAC0112345678). Si califica por una certificación laboral (ETA-750) o no tiene el número, déjelo vacío.',
            'It is on that petition’s I-797 notice (for example WAC0112345678). If you qualify through a labor certification (ETA-750) or don’t have the number, leave it empty.',
          ),
          fields: [{ id: 'qualifying.receipt', type: 'receipt', label: t('Número de recibo (si tiene)', 'Receipt number (if any)'), formRef: 'Part 2 · Item 2 · Receipt Number of Petition', placeholder: 'WAC0112345678' }],
        },
        {
          id: 'qualPrincipal',
          kind: 'fields',
          formRef: 'Part 2 · Items 3–4 · Information on Principal Beneficiary of Petition or Application',
          showIf: otherPrincipal,
          question: t('¿Quién era el/la beneficiario/a principal de esa petición o certificación?', 'Who was the principal beneficiary of that petition or labor certification?'),
          why: t('Es la persona a cuyo nombre se presentó, por ejemplo su cónyuge o su padre o madre.', 'This is the person it was filed for, for example your spouse or your parent.'),
          fields: [
            ...nameFields('qualPrincipal', 'Part 2 · Item 3'),
            { id: 'qualPrincipal.aNumber', type: 'aNumber', label: t('A-Number del/de la principal (si tiene)', 'Principal’s A-Number (if any)'), formRef: 'Part 2 · Item 4 · Principal Applicant’s A-Number' },
          ],
        },
        {
          id: 'categoryQ',
          kind: 'fields',
          formRef: 'Part 2 · Item 5 · Immigrant Category',
          question: t('¿Qué categoría marcó en su I-485?', 'Which category did you select on your I-485?'),
          why: t(
            'Escriba en inglés la categoría que marcó en el I-485, Parte 2, Ítem 3. Caben 34 letras: abrevie si hace falta (por ejemplo "Sibling of U.S. citizen (F4)" o "Spouse of LPR (F2A)").',
            'Write the category you selected on Form I-485, Part 2, Item 3. The box fits 34 characters: abbreviate if needed (for example "Sibling of U.S. citizen (F4)" or "Spouse of LPR (F2A)").',
          ),
          fields: [{ id: 'supa.category', type: 'text', required: true, label: t('Categoría (en inglés)', 'Category'), formRef: 'Part 2 · Item 5', maxLength: 34, placeholder: 'Sibling of U.S. citizen (F4)' }],
        },
      ],
    },
    {
      id: 'bars',
      part: 'Part 3',
      title: t('Por qué necesita la 245(i)', 'Why you need 245(i)'),
      questions: [
        {
          id: 'bars',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 3 · Item 1 · Bars to Adjustment',
          notice: BARS_NOTICE,
          question: t('¿Cuáles de estas situaciones aplican a usted? Marque todas las que apliquen.', 'Which of these apply to you? Select all that apply.'),
          options: BARS,
        },
      ],
    },
    {
      id: 'contact',
      part: 'Part 4',
      title: t('Contacto y ayuda', 'Contact and help'),
      questions: [
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 4 · Items 1–3 · Applicant’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: t('Teléfono de día', 'Daytime phone'), formRef: 'Part 4 · Item 1', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: t('Celular', 'Mobile phone'), formRef: 'Part 4 · Item 2' },
            { id: 'email', type: 'email', label: t('Correo electrónico', 'Email'), formRef: 'Part 4 · Item 3', maxLength: 38 },
          ],
        },
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 4 · Applicant’s Certification · Part 5 · Interpreter',
          question: t('¿Puede leer y entender el suplemento en inglés?', 'Can you read and understand the supplement in English?'),
          why: t('Si alguien le lee el suplemento en su idioma, esa persona llena y firma la Parte 5.', 'If someone reads the supplement to you in your language, that person completes and signs Part 5.'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leyó', 'No, an interpreter read it to me') },
          ],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 6 · Preparer',
          question: t('¿Alguien más le preparó este suplemento?', 'Did someone else prepare this supplement for you?'),
          why: t('Por ejemplo un abogado, una organización o un familiar que llenó las respuestas. Esa persona llena y firma la Parte 6.', 'For example an attorney, an organization or a relative who filled in the answers. That person completes and signs Part 6.'),
          options: yesNo,
        },
      ],
    },
    helpWithoutAddresses,
  ],
};
