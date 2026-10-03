import type { FormDefinition } from './types';
import type { T } from '../i18n';
import { nameFields } from './helpers';

// Questions follow USCIS Form G-1145, e-Notification of Application/Petition Acceptance,
// edition 09/26/14. The PDF mapping lives in src/pdf/g1145Pdf.ts.

export const G1145_EDITION = '09/26/14';

const t = (es: string, en: string): T => ({ es, en });

export const g1145: FormDefinition = {
  id: 'g-1145',
  number: 'G-1145',
  edition: G1145_EDITION,
  title: t('Aviso electrónico de aceptación', 'e-Notification of Application/Petition Acceptance'),
  summary: {
    es: 'Reciba un correo o mensaje de texto con su número de recibo cuando USCIS acepte su solicitud enviada por correo.',
    en: 'Get an email or text message with your receipt number when USCIS accepts the application you mailed.',
  },
  intro: {
    es: 'El G-1145 es una hoja de una página que se pone encima de la solicitud que envía por correo a un Lockbox de USCIS. Dentro de 24 horas de aceptarla, USCIS le manda su número de recibo por correo electrónico o texto. Es gratis y opcional; el recibo en papel (I-797C) le llega igual por correo.',
    en: 'Form G-1145 is a one-page sheet you place on top of the application you mail to a USCIS Lockbox. Within 24 hours of accepting it, USCIS sends your receipt number by email or text. It is free and optional; the paper receipt (I-797C) still arrives by mail.',
  },
  minutes: 2,
  pdf: {
    path: 'forms/g-1145.pdf',
    fileName: 'G-1145-filled.pdf',
    load: () => import('../pdf/g1145Pdf').then((m) => m.fillG1145),
    signHere: { es: 'No se firma', en: 'No signature needed' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/g-1145 que la edición {edition} sigue vigente.',
      'Imprima el PDF y póngalo con un clip encima de la primera página de su solicitud. Si envía varios formularios en el mismo paquete, use un G-1145 para cada uno.',
      'Los mensajes de texto solo llegan a números de EE.UU.; desde el extranjero, use el correo electrónico.',
    ],
    en: [
      'Check at uscis.gov/g-1145 that edition {edition} is still current.',
      'Print the PDF and clip it on top of the first page of your application. If you send several forms in one package, use one G-1145 for each.',
      'Text messages only reach U.S. numbers; from abroad, use email.',
    ],
  },
  sections: [
    {
      id: 'notify',
      part: 'G-1145',
      title: t('Su aviso', 'Your notification'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Applicant/Petitioner Full Name',
          question: t('¿Cuál es el nombre del solicitante o peticionario?', 'What is the applicant’s or petitioner’s name?'),
          why: t('Escríbalo igual que en la solicitud que envía.', 'Write it exactly as on the application you are sending.'),
          fields: nameFields('name', 'Applicant/Petitioner').map((f) => ({ ...f, maxLength: f.id.endsWith('family') ? 30 : 18 })),
        },
        {
          id: 'contact',
          kind: 'fields',
          formRef: 'Email Address · Mobile Phone Number (Text Message)',
          question: t('¿Dónde quiere recibir el aviso?', 'Where do you want the notification sent?'),
          why: t('Ponga un correo, un celular o ambos.', 'Enter an email, a mobile number or both.'),
          fields: [
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email address' }, formRef: 'Email Address' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular (para mensaje de texto)', en: 'Mobile phone (text message)' }, formRef: 'Mobile Phone Number (Text Message)' },
          ],
        },
      ],
    },
  ],
};
