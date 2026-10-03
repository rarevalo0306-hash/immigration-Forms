import type { Field, FormDefinition } from './types';
import type { T } from '../i18n';
import { date, is, nameFields, yesNo } from './helpers';

// Questions follow USCIS Form AR-11, Alien's Change of Address Card, edition 11/02/22. The PDF
// mapping lives in src/pdf/ar11Pdf.ts.

export const AR11_EDITION = '11/02/22';

const t = (es: string, en: string): T => ({ es, en });

/** A U.S. address, with the 25-character street and 4-character unit number of this edition. */
const usAddress = (prefix: string, ref: string, required: boolean): Field[] => [
  { id: `${prefix}.street`, type: 'text', required, label: { es: 'Número y calle (no se aceptan apartados postales)', en: 'Street number and name (no PO boxes)' }, formRef: `${ref} · Street Number and Name`, maxLength: 25, placeholder: '1234 Main St' },
  { id: `${prefix}.unit`, type: 'unit', label: { es: 'Apartamento, suite o piso', en: 'Apt., suite or floor' }, formRef: `${ref} · Apt. Ste. Flr. Number`, placeholder: 'Apt 4B', hint: t('El número cabe en 4 caracteres.', 'The number fits in 4 characters.') },
  { id: `${prefix}.city`, type: 'text', required, label: { es: 'Ciudad', en: 'City or town' }, formRef: `${ref} · City or Town`, maxLength: 20 },
  { id: `${prefix}.state`, type: 'state', required, label: { es: 'Estado', en: 'State' }, formRef: `${ref} · State`, placeholder: 'CA' },
  { id: `${prefix}.zip`, type: 'zip', required, label: { es: 'Código postal', en: 'ZIP code' }, formRef: `${ref} · ZIP Code` },
];

export const ar11: FormDefinition = {
  id: 'ar-11',
  number: 'AR-11',
  edition: AR11_EDITION,
  title: t('Cambio de dirección', 'Change of address'),
  summary: {
    es: 'Avise a USCIS que se mudó. Es obligatorio dentro de los 10 días siguientes a la mudanza.',
    en: 'Tell USCIS you moved. It is required within 10 days of moving.',
  },
  intro: {
    es: 'Casi todos los no ciudadanos deben avisar su nueva dirección a USCIS dentro de los 10 días siguientes a la mudanza. Si tiene un trámite pendiente, es más rápido cambiar la dirección en línea en uscis.gov/addresschange: así se actualizan también sus casos. Si está en corte de inmigración, también debe avisar a la corte con el formulario EOIR-33.',
    en: 'Most noncitizens must report a new address to USCIS within 10 days of moving. If you have a pending case, it is faster to change your address online at uscis.gov/addresschange: that also updates your cases. If you are in immigration court, you must also tell the court with Form EOIR-33.',
  },
  minutes: 5,
  pdf: {
    path: 'forms/ar-11.pdf',
    fileName: 'AR-11-filled.pdf',
    load: () => import('../pdf/ar11Pdf').then((m) => m.fillAR11),
    signHere: { es: 'sección "Your Signature"', en: 'the "Your Signature" section' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/ar-11 que la edición {edition} sigue vigente. El AR-11 no tiene costo.',
      'Imprima el PDF, fírmelo a mano con tinta negra y escriba la fecha.',
      'Envíelo por correo a: U.S. Department of Homeland Security, Citizenship and Immigration Services, Attn: Change of Address, 1344 Pleasants Drive, Harrisonburg, VA 22801. Guarde una copia.',
      'Si tiene un trámite pendiente, cambie también la dirección en línea (uscis.gov/addresschange) o llame al 800-375-5283. Si está en corte de inmigración, envíe el EOIR-33 a la corte.',
    ],
    en: [
      'Check at uscis.gov/ar-11 that edition {edition} is still current. There is no fee for Form AR-11.',
      'Print the PDF, sign it by hand in black ink and write the date.',
      'Mail it to: U.S. Department of Homeland Security, Citizenship and Immigration Services, Attn: Change of Address, 1344 Pleasants Drive, Harrisonburg, VA 22801. Keep a copy.',
      'If you have a pending case, also change your address online (uscis.gov/addresschange) or call 800-375-5283. If you are in immigration court, send Form EOIR-33 to the court.',
    ],
  },
  sections: [
    {
      id: 'about',
      part: 'Information About You',
      title: t('Sobre usted', 'About you'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Information About You · Name',
          question: t('¿Cuál es su nombre legal completo?', 'What is your full legal name?'),
          fields: nameFields('name', 'Information About You').map((f) => ({ ...f, maxLength: f.id.endsWith('family') ? 30 : 18 })),
        },
        {
          id: 'details',
          kind: 'fields',
          formRef: 'Information About You · Date of Birth, A-Number',
          question: t('Sus datos', 'Your details'),
          fields: [
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Information About You · Date of Birth'),
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Information About You · A-Number' },
          ],
        },
      ],
    },
    {
      id: 'address',
      part: 'Information About Your Address',
      title: t('Sus direcciones', 'Your addresses'),
      questions: [
        {
          id: 'present',
          kind: 'fields',
          formRef: 'Present Physical Address',
          question: t('¿Cuál es su nueva dirección?', 'What is your new address?'),
          why: t('Donde vive ahora. No se aceptan apartados postales (PO Box).', 'Where you live now. PO boxes are not accepted.'),
          fields: usAddress('present', 'Present Physical Address', true),
        },
        {
          id: 'previousHas',
          kind: 'choice',
          formRef: 'Previous Physical Address',
          question: t('¿Vivía antes en otra dirección de EE.UU.?', 'Did you live at another U.S. address before?'),
          options: yesNo,
        },
        {
          id: 'previous',
          kind: 'fields',
          formRef: 'Previous Physical Address',
          showIf: is('previousHas', 'yes'),
          question: t('¿Dónde vivía antes?', 'Where did you live before?'),
          fields: usAddress('previous', 'Previous Physical Address', true),
        },
        {
          id: 'mailingDifferent',
          kind: 'choice',
          formRef: 'Mailing Address (optional)',
          question: t('¿Recibe el correo en otra dirección?', 'Do you get mail at a different address?'),
          options: yesNo,
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Mailing Address (optional)',
          showIf: is('mailingDifferent', 'yes'),
          question: t('¿A qué dirección le llega el correo?', 'Where do you get your mail?'),
          why: t('Aquí sí puede usar un apartado postal (PO Box).', 'A PO box is fine here.'),
          fields: usAddress('mailing', 'Mailing Address', true).map((f) => (f.id === 'mailing.street' ? { ...f, label: { es: 'Número y calle, o PO Box', en: 'Street number and name, or PO box' } } : f)),
        },
      ],
    },
  ],
};
