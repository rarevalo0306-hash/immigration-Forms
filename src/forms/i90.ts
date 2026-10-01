import type { FormDefinition } from './types';
import type { T } from '../i18n';
import { all, anyAddress, biographic, date, is, nameFields, sexField, yesNo } from './helpers';

// Questions follow USCIS Form I-90, Application to Replace Permanent Resident Card, edition
// 01/20/25. The PDF mapping lives in src/pdf/i90Pdf.ts.

export const I90_EDITION = '01/20/25';

const t = (es: string, en: string): T => ({ es, en });

const isConditional = is('status', '1c');

/** Street fields on this edition hold 25 characters. */
const address = (prefix: string, ref: string, careOf = false) =>
  anyAddress(prefix, ref, { careOf }).map((f) => (f.id.endsWith('.street') ? { ...f, maxLength: 25 } : f));

export const i90: FormDefinition = {
  id: 'i-90',
  number: 'I-90',
  edition: I90_EDITION,
  title: t('Renovar o reemplazar la green card', 'Renew or replace your green card'),
  summary: {
    es: 'Para residentes permanentes cuya tarjeta venció, está por vencer, se perdió, se dañó o tiene datos que cambiar.',
    en: 'For permanent residents whose card expired, is about to expire, was lost or damaged, or needs updated information.',
  },
  intro: {
    es: 'Con el I-90 pide una tarjeta de residente nueva. Si es residente condicional (tarjeta de 2 años) y su tarjeta vence en los próximos 90 días, no use este formulario: necesita el I-751 o el I-829 para quitar las condiciones.',
    en: 'With Form I-90 you ask for a new permanent resident card. If you are a conditional resident (2-year card) and your card expires within 90 days, don’t use this form: you need Form I-751 or I-829 to remove conditions.',
  },
  minutes: 15,
  pdf: {
    path: 'forms/i-90.pdf',
    fileName: 'I-90-filled.pdf',
    load: () => import('../pdf/i90Pdf').then((m) => m.fillI90),
    signHere: { es: 'Parte 5, Ítem 6.a', en: 'Part 5, Item 6.a' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-90 que la edición {edition} sigue vigente y revise la tarifa; si cambió, use la nueva y copie sus respuestas de esta hoja. El I-90 también se puede presentar en línea.',
      'Adjunte copia de su tarjeta actual (frente y reverso) si la tiene y, si cambió su nombre, el documento legal del cambio.',
      'Imprima el PDF y firme la Parte 5, Ítem 6.a, a mano con tinta negra.',
      'Guarde el recibo de USCIS: junto con su tarjeta vencida le sirve como prueba de residencia mientras espera.',
    ],
    en: [
      'Check at uscis.gov/i-90 that edition {edition} is still current and check the fee; if it changed, use the new one and copy your answers from this sheet. Form I-90 can also be filed online.',
      'Attach a copy of your current card (front and back) if you have it and, if your name changed, the legal document for the change.',
      'Print the PDF and sign Part 5, Item 6.a, by hand in black ink.',
      'Keep the USCIS receipt notice: with your expired card it proves your residence while you wait.',
    ],
  },
  sections: [
    {
      id: 'about',
      part: 'Part 1',
      title: t('Sobre usted', 'About you'),
      questions: [
        {
          id: 'numbers',
          kind: 'fields',
          formRef: 'Part 1 · Items 1–2',
          question: t('Sus números de USCIS', 'Your USCIS numbers'),
          why: t('El A-Number está en su tarjeta de residente, como "USCIS#".', 'The A-Number is on your green card, as "USCIS#".'),
          fields: [
            { id: 'aNumber', type: 'aNumber', required: true, label: { es: 'A-Number', en: 'A-Number' }, formRef: 'Part 1 · Item 1 · Alien Registration Number (A-Number)' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Número de cuenta en línea de USCIS', en: 'USCIS online account number' }, formRef: 'Part 1 · Item 2' },
          ],
        },
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 1 · Item 3 · Your Full Name',
          question: t('¿Cuál es su nombre legal completo?', 'What is your full legal name?'),
          why: t('Su nueva tarjeta saldrá con este nombre.', 'Your new card will be issued in this name.'),
          fields: nameFields('name', 'Part 1 · Item 3'),
        },
        {
          id: 'nameChanged',
          kind: 'choice',
          formRef: 'Part 1 · Item 4 · Has your name legally changed since the issuance of your Permanent Resident Card?',
          question: t('¿Cambió legalmente su nombre desde que le dieron su tarjeta?', 'Has your name legally changed since your card was issued?'),
          options: [
            { value: 'Y', label: t('Sí', 'Yes') },
            { value: 'N', label: t('No', 'No') },
            { value: 'NA', label: t('Nunca recibí mi tarjeta anterior', 'I never received my previous card') },
          ],
        },
        {
          id: 'cardName',
          kind: 'fields',
          formRef: 'Part 1 · Item 5 · Name as printed on your current card',
          showIf: is('nameChanged', 'Y'),
          question: t('¿Cómo aparece su nombre en la tarjeta actual?', 'How is your name printed on your current card?'),
          notice: { tone: 'info', title: { es: 'Adjunte la prueba', en: 'Attach proof' }, body: { es: 'Adjunte el acta de matrimonio, divorcio u orden de la corte que cambió su nombre.', en: 'Attach the marriage certificate, divorce decree or court order that changed your name.' } },
          fields: nameFields('cardName', 'Part 1 · Item 5'),
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 1 · Item 6 · Mailing Address',
          question: t('¿A qué dirección le llega el correo?', 'Where do you get your mail?'),
          why: t('Aquí le enviarán la tarjeta nueva.', 'Your new card will be mailed here.'),
          fields: address('mailing', 'Part 1 · Item 6', true),
        },
        {
          id: 'mailingSame',
          kind: 'choice',
          formRef: 'Part 1 · Item 7',
          question: t('¿Vive en esa misma dirección?', 'Do you live at that same address?'),
          options: yesNo,
        },
        {
          id: 'home',
          kind: 'fields',
          formRef: 'Part 1 · Item 7 · Physical Address',
          showIf: is('mailingSame', 'no'),
          question: t('¿Dónde vive?', 'Where do you live?'),
          fields: address('home', 'Part 1 · Item 7'),
        },
        {
          id: 'details',
          kind: 'fields',
          formRef: 'Part 1 · Items 8–16 · Additional Information',
          question: t('Sus datos', 'Your details'),
          why: t('La clase y la fecha de admisión están en su tarjeta ("Category" y "Resident Since").', 'The class and date of admission are on your card ("Category" and "Resident Since").'),
          fields: [
            sexField('sex', 'Part 1 · Item 8'),
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 9'),
            { id: 'birthCity', type: 'text', required: true, label: { es: 'Ciudad de nacimiento', en: 'City of birth' }, formRef: 'Part 1 · Item 10', maxLength: 38 },
            { id: 'birthCountry', type: 'text', required: true, label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: 'Part 1 · Item 11' },
            { id: 'motherGiven', type: 'text', required: true, label: { es: 'Nombre de pila de su madre', en: 'Mother’s given name' }, formRef: 'Part 1 · Item 12' },
            { id: 'fatherGiven', type: 'text', required: true, label: { es: 'Nombre de pila de su padre', en: 'Father’s given name' }, formRef: 'Part 1 · Item 13' },
            { id: 'coa', type: 'text', required: true, label: { es: 'Clase de admisión (por ejemplo IR1, CR1, F21)', en: 'Class of admission' }, formRef: 'Part 1 · Item 14', placeholder: 'IR1' },
            date('admissionDate', 'Fecha de admisión (residente desde)', 'Date of admission (resident since)', 'Part 1 · Item 15'),
            { id: 'ssn', type: 'ssn', label: { es: 'Número de Seguro Social (si tiene)', en: 'Social Security number (if any)' }, formRef: 'Part 1 · Item 16', placeholder: '123-45-6789' },
          ],
        },
      ],
    },
    {
      id: 'reason',
      part: 'Part 2',
      title: t('Por qué la pide', 'Why you are applying'),
      questions: [
        {
          id: 'status',
          kind: 'choice',
          formRef: 'Part 2 · Item 1 · My status is',
          question: t('¿Qué tipo de residente es?', 'What kind of resident are you?'),
          options: [
            { value: '1a', label: t('Residente permanente (tarjeta de 10 años)', 'Lawful permanent resident (10-year card)') },
            { value: '1b', label: t('Residente permanente viajero (commuter: vivo en Canadá o México y trabajo en EE.UU.)', 'Permanent resident in commuter status') },
            { value: '1c', label: t('Residente condicional (tarjeta de 2 años)', 'Conditional permanent resident (2-year card)') },
          ],
        },
        {
          id: 'reasonA',
          kind: 'choice',
          formRef: 'Part 2 · Section A · Items 2.a–2.j',
          showIf: is('status', '1a', '1b'),
          question: t('¿Por qué necesita una tarjeta nueva?', 'Why do you need a new card?'),
          options: [
            { value: '2f', label: t('Mi tarjeta ya venció o vence en los próximos 6 meses', 'My card has expired or will expire within six months') },
            { value: '2a', label: t('Se perdió, me la robaron o se destruyó', 'It was lost, stolen or destroyed') },
            { value: '2b', label: t('La emitieron, pero nunca la recibí', 'It was issued but I never received it') },
            { value: '2c', label: t('Está dañada', 'It is damaged (mutilated)') },
            { value: '2d', label: t('Tiene un error de USCIS', 'It has incorrect data because of a DHS error') },
            { value: '2e', label: t('Cambió legalmente mi nombre u otro dato', 'My name or other information legally changed') },
            { value: '2g1', label: t('Cumplí 14 años y mi tarjeta vence DESPUÉS de que cumpla 16', 'I turned 14 and my card expires AFTER my 16th birthday') },
            { value: '2g2', label: t('Cumplí 14 años y mi tarjeta vence ANTES de que cumpla 16', 'I turned 14 and my card expires BEFORE my 16th birthday') },
            { value: '2h1', label: t('Soy residente y paso a ser commuter', 'I am taking up commuter status') },
            { value: '2h2', label: t('Soy commuter y paso a vivir en EE.UU.', 'I am a commuter taking up residence in the U.S.') },
            { value: '2i', label: t('Me convirtieron automáticamente en residente permanente', 'I was automatically converted to permanent resident status') },
            { value: '2j', label: t('Tengo una tarjeta de una edición anterior u otro motivo', 'I have a prior edition of the card, or another reason') },
          ],
          why: t('Si cumplió 14 años, preséntelo dentro de los 30 días siguientes a su cumpleaños; si no, elija el último motivo.', 'If you turned 14, file within 30 days after your birthday; otherwise choose the last reason.'),
        },
        {
          id: 'poe',
          kind: 'fields',
          formRef: 'Part 2 · Item 2.h.1.a',
          showIf: all(is('status', '1a', '1b'), is('reasonA', '2h1')),
          question: t('¿Por qué puerto entrará a EE.UU.?', 'Which port of entry will you use?'),
          fields: [{ id: 'poe.cityState', type: 'text', required: true, label: { es: 'Ciudad y estado', en: 'City or town and state' }, formRef: 'Part 2 · Item 2.h.1.a · Port-of-Entry', maxLength: 25, placeholder: 'San Ysidro, CA' }],
        },
        {
          id: 'reasonB',
          kind: 'choice',
          formRef: 'Part 2 · Section B · Items 3.a–3.e',
          showIf: isConditional,
          question: t('¿Por qué necesita una tarjeta nueva?', 'Why do you need a new card?'),
          notice: {
            tone: 'legal',
            title: { es: '¿Su tarjeta de 2 años vence pronto?', en: 'Is your 2-year card expiring soon?' },
            body: { es: 'Si vence en los próximos 90 días o ya venció, el I-90 no sirve: presente el I-751 (por matrimonio) o el I-829 (por inversión).', en: 'If it expires within 90 days or has expired, Form I-90 won’t work: file Form I-751 (marriage) or I-829 (investment).' },
          },
          options: [
            { value: '3a', label: t('Se perdió, me la robaron o se destruyó', 'It was lost, stolen or destroyed') },
            { value: '3b', label: t('La emitieron, pero nunca la recibí', 'It was issued but I never received it') },
            { value: '3c', label: t('Está dañada', 'It is damaged (mutilated)') },
            { value: '3d', label: t('Tiene un error de USCIS', 'It has incorrect data because of a DHS error') },
            { value: '3e', label: t('Cambió legalmente mi nombre u otro dato', 'My name or other information legally changed') },
          ],
        },
      ],
    },
    {
      id: 'processing',
      part: 'Part 3',
      title: t('Cómo obtuvo la residencia', 'How you became a resident'),
      questions: [
        {
          id: 'locations',
          kind: 'fields',
          formRef: 'Part 3 · Items 1–2',
          question: t('¿Dónde tramitó su residencia?', 'Where was your residence processed?'),
          why: t('Por ejemplo "U.S. Consulate, Ciudad Juarez, Mexico" o "USCIS Los Angeles Field Office".', 'For example "U.S. Consulate, Ciudad Juarez, Mexico" or "USCIS Los Angeles Field Office".'),
          fields: [
            { id: 'location.applied', type: 'text', required: true, label: { es: 'Dónde pidió la visa de inmigrante o el ajuste de estatus', en: 'Where you applied for the immigrant visa or adjustment' }, formRef: 'Part 3 · Item 1', maxLength: 38 },
            { id: 'location.issued', type: 'text', required: true, label: { es: 'Dónde le dieron la visa o la oficina de USCIS que aprobó el ajuste', en: 'Where the visa was issued or the USCIS office that granted adjustment' }, formRef: 'Part 3 · Item 2', maxLength: 38 },
          ],
        },
        {
          id: 'enteredWithVisa',
          kind: 'choice',
          formRef: 'Part 3 · Items 3.a–3.a.1',
          question: t('¿Llegó a EE.UU. con una visa de inmigrante?', 'Did you enter the U.S. with an immigrant visa?'),
          why: t('Responda No si le aprobaron el ajuste de estatus dentro de EE.UU.', 'Answer No if you were granted adjustment of status inside the U.S.'),
          options: yesNo,
        },
        {
          id: 'arrival',
          kind: 'fields',
          formRef: 'Part 3 · Items 3.a–3.a.1',
          showIf: is('enteredWithVisa', 'yes'),
          question: t('Su llegada como inmigrante', 'Your arrival as an immigrant'),
          fields: [
            { id: 'arrival.destination', type: 'text', required: true, label: { es: 'Destino en EE.UU. cuando llegó (ciudad y estado)', en: 'Destination in the U.S. at admission' }, formRef: 'Part 3 · Item 3.a' },
            { id: 'arrival.poe', type: 'text', required: true, label: { es: 'Puerto de entrada (ciudad y estado)', en: 'Port of entry (city and state)' }, formRef: 'Part 3 · Item 3.a.1', maxLength: 25, placeholder: 'Houston, TX' },
          ],
        },
        {
          id: 'proceedings',
          kind: 'choice',
          formRef: 'Part 3 · Item 4 · Exclusion, deportation, or removal proceedings',
          question: t('¿Ha estado alguna vez en un proceso de deportación o le ordenaron salir de EE.UU.?', 'Have you ever been in exclusion, deportation or removal proceedings, or ordered removed?'),
          options: yesNo,
        },
        {
          id: 'abandoned',
          kind: 'choice',
          formRef: 'Part 3 · Item 5 · Form I-407 or abandonment of status',
          question: t('Desde que es residente, ¿presentó el I-407 o le dijeron que abandonó su residencia?', 'Since becoming a resident, have you filed Form I-407 or been found to have abandoned your status?'),
          why: t('Por ejemplo, si renunció a la residencia en un aeropuerto tras vivir mucho tiempo fuera.', 'For example, if you gave up residence at an airport after living abroad a long time.'),
          options: yesNo,
        },
        {
          id: 'explainHistory',
          kind: 'fields',
          formRef: 'Part 8 · Additional Information',
          showIf: (a) => a.proceedings === 'yes' || a.abandoned === 'yes',
          question: t('Explique lo que pasó', 'Explain what happened'),
          notice: { tone: 'legal', title: { es: 'Consulte a un abogado', en: 'Talk to an attorney' }, body: { es: 'Con un proceso de deportación o una residencia abandonada, un abogado debe revisar su caso antes de presentar.', en: 'With removal proceedings or abandoned residence, an attorney should review your case before you file.' } },
          fields: [
            { id: 'explain.proceedings', type: 'longText', label: { es: 'Sobre el proceso de deportación (en inglés)', en: 'About the proceedings' }, formRef: 'Part 8 · Part 3 · Item 4' },
            { id: 'explain.abandoned', type: 'longText', label: { es: 'Sobre el I-407 o el abandono (en inglés)', en: 'About Form I-407 or abandonment' }, formRef: 'Part 8 · Part 3 · Item 5' },
          ],
        },
        ...biographic('Part 3', 6),
      ],
    },
    {
      id: 'accommodations',
      part: 'Part 4',
      title: t('Adaptaciones', 'Accommodations'),
      questions: [
        {
          id: 'accommodation',
          kind: 'choice',
          formRef: 'Part 4 · Item 1 · Are you requesting an accommodation because of your disabilities and/or impairments?',
          question: t('¿Necesita alguna adaptación por una discapacidad para su cita?', 'Do you need an accommodation for a disability at your appointment?'),
          why: t('Por ejemplo, un intérprete de lengua de señas o acceso en silla de ruedas.', 'For example, a sign-language interpreter or wheelchair access.'),
          options: yesNo,
        },
        {
          id: 'accommodationDetails',
          kind: 'fields',
          formRef: 'Part 4 · Items 1.a–1.c',
          showIf: is('accommodation', 'yes'),
          question: t('¿Qué necesita?', 'What do you need?'),
          why: t('Llene solo lo que aplique, en inglés.', 'Fill in only what applies.'),
          fields: [
            { id: 'acc.deaf', type: 'text', label: { es: 'Sordera o pérdida auditiva: qué necesita (por ejemplo, "ASL interpreter")', en: 'Deaf or hard of hearing: accommodation' }, formRef: 'Part 4 · Item 1.a', maxLength: 140 },
            { id: 'acc.blind', type: 'text', label: { es: 'Ceguera o baja visión: qué necesita', en: 'Blind or low vision: accommodation' }, formRef: 'Part 4 · Item 1.b', maxLength: 140 },
            { id: 'acc.other', type: 'text', label: { es: 'Otra discapacidad: cuál y qué necesita', en: 'Other disability and accommodation' }, formRef: 'Part 4 · Item 1.c', maxLength: 140 },
          ],
        },
      ],
    },
    {
      id: 'contact',
      part: 'Part 5',
      title: t('Contacto', 'Contact'),
      questions: [
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 5 · Items 1.a–1.b · Applicant’s Statement',
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
          fields: [{ id: 'fluentLanguage', type: 'text', required: true, label: { es: 'Idioma', en: 'Language' }, formRef: 'Part 5 · Item 1.b', placeholder: 'Spanish' }],
        },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 5 · Items 3–5 · Applicant’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 5 · Item 3', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 5 · Item 4' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 5 · Item 5', maxLength: 38 },
          ],
        },
      ],
    },
  ],
};
