import type { T } from '../i18n';
import type { Answers } from './types';

/**
 * Packages: the forms one immigration case needs, in the order to fill them. Data the person gives
 * on one form starts the next ones (see engine/profile.ts), and `preset` answers what the package
 * already tells us (the I-130 is for a spouse, the I-765 category is (c)(9), …).
 */

export interface PackageStep {
  formId: string;
  /** Who fills this form in. */
  who: T;
  why: T;
  optional?: boolean;
  /** Answers the package already knows, set when the form is started from the package. */
  preset?: Answers;
}

export interface PackageStage {
  title: T;
  body?: T;
  steps: PackageStep[];
}

export interface PackageDefinition {
  id: string;
  title: T;
  summary: T;
  intro: T;
  /** A caution shown before the forms, e.g. when an attorney should look at the case first. */
  legal?: T;
  stages: PackageStage[];
  tips: { es: string[]; en: string[] };
}

const t = (es: string, en: string): T => ({ es, en });

const citizen = t('El esposo/a ciudadano/a', 'The U.S. citizen spouse');
const immigrant = t('El esposo/a que va a inmigrar', 'The immigrating spouse');

const g1145 = (who: T): PackageStep => ({
  formId: 'g-1145',
  who,
  optional: true,
  why: t(
    'Para recibir un correo o mensaje de texto cuando USCIS acepte su paquete. Imprima una copia y póngala encima de cada formulario.',
    'To get an email or text when USCIS accepts your package. Print one copy and put it on top of each form.',
  ),
});

const feesTip = {
  es: 'Confirme la edición de cada formulario y las tarifas actuales en uscis.gov/g-1055 antes de enviar. Cada formulario lleva su propio pago.',
  en: 'Confirm each form’s edition and the current fees at uscis.gov/g-1055 before you file. Each form has its own payment.',
};

export const packages: PackageDefinition[] = [
  {
    id: 'matrimonio',
    title: t('Matrimonio con ciudadano/a, dentro de EE.UU.', 'Marriage to a U.S. citizen, inside the U.S.'),
    summary: t(
      'Para pedir la residencia sin salir del país: la petición, el ajuste de estatus, el patrocinio y, si quiere, permiso de trabajo y de viaje.',
      'To apply for a green card without leaving the country: the petition, adjustment of status, sponsorship and, if you want, work and travel permits.',
    ),
    intro: t(
      'Como esposo/a de un ciudadano, puede enviar la petición y la solicitud de residencia juntas, en un mismo paquete. Primero el ciudadano llena el I-130; lo que escriba ahí sobre los dos ya aparecerá en los siguientes formularios.',
      'As the spouse of a citizen, you can file the petition and the green card application together, in one package. The citizen fills in the I-130 first; what they write there about both of you will already show up in the next forms.',
    ),
    legal: t(
      'Si entró a EE.UU. sin visa ni permiso, tiene una orden de deportación o algún arresto, hable con un abogado de inmigración antes de enviar: por lo general no se puede ajustar estatus dentro del país en esos casos.',
      'If you entered the U.S. without a visa or permission, have a removal order or any arrest, talk to an immigration attorney before you file: usually you can’t adjust status inside the country in those cases.',
    ),
    stages: [
      {
        title: t('Se envían juntos', 'Filed together'),
        steps: [
          { formId: 'i-130', who: citizen, why: t('La petición: muestra que están casados.', 'The petition: shows you are married.'), preset: { relationship: 'spouse' } },
          { formId: 'i-130a', who: immigrant, why: t('Los datos del esposo/a que inmigra: direcciones, trabajos y padres.', 'The immigrating spouse’s details: addresses, jobs and parents.') },
          { formId: 'i-485', who: immigrant, why: t('La solicitud de residencia (green card).', 'The green card application.'), preset: { category: 'ir-spouse' } },
          {
            formId: 'i-485supa',
            who: immigrant,
            optional: true,
            why: t(
              'Solo si necesita la sección 245(i): por ejemplo, si entró sin inspección y un familiar o empleador pidió por usted a más tardar el 30 de abril de 2001. Hable antes con un abogado.',
              'Only if you need section 245(i): for example, if you entered without inspection and a relative or employer petitioned for you by April 30, 2001. Talk to an attorney first.',
            ),
          },
          { formId: 'i-864', who: citizen, why: t('El compromiso de mantener al inmigrante, con los ingresos del ciudadano.', 'The promise to support the immigrant, with the citizen’s income.'), preset: { basis: 'petitioner' } },
          {
            formId: 'i-864a',
            who: t('Otra persona del hogar', 'Another household member'),
            optional: true,
            why: t('Solo si el ingreso del ciudadano no alcanza y un familiar que vive con él suma el suyo.', 'Only if the citizen’s income isn’t enough and a relative living with them adds theirs.'),
          },
          { formId: 'i-765', who: immigrant, optional: true, why: t('Permiso de trabajo mientras se decide la residencia.', 'A work permit while the green card is decided.'), preset: { category: '(c)(9)' } },
          { formId: 'i-131', who: immigrant, optional: true, why: t('Permiso para viajar fuera de EE.UU. mientras se decide (advance parole).', 'Permission to travel abroad while it is decided (advance parole).'), preset: { appType: '5' } },
          g1145(immigrant),
        ],
      },
    ],
    tips: {
      es: [
        feesTip.es,
        'Junte pruebas de que el matrimonio es real: acta de matrimonio, contrato de renta, cuentas o seguros juntos, fotos.',
        'El I-485 necesita el examen médico I-693, sellado por un médico civil autorizado (Camino no lo llena).',
        'El I-864 va con la declaración de impuestos más reciente del ciudadano.',
        'Cada persona firma a mano su propio formulario.',
        'Envíe todo junto a la dirección del I-485: búsquela en uscis.gov/i-485, sección "Where to File".',
      ],
      en: [
        feesTip.en,
        'Gather proof the marriage is real: marriage certificate, lease, joint accounts or insurance, photos.',
        'The I-485 needs the I-693 medical exam, sealed by an authorized civil surgeon (Camino doesn’t fill it).',
        'The I-864 goes with the citizen’s most recent tax return.',
        'Each person signs their own form by hand.',
        'Send everything together to the I-485 address: find it at uscis.gov/i-485, "Where to File" section.',
      ],
    },
  },
  {
    id: 'consulado',
    title: t('Matrimonio con ciudadano/a, por el consulado', 'Marriage to a U.S. citizen, through the consulate'),
    summary: t(
      'Cuando el esposo/a recibirá la visa en el consulado de su país.',
      'When the spouse will get the visa at the consulate in their country.',
    ),
    intro: t(
      'El ciudadano envía la petición a USCIS. Cuando la aprueben, el caso pasa al Centro Nacional de Visas (NVC), que pide el patrocinio económico y el formulario en línea DS-260.',
      'The citizen files the petition with USCIS. Once it’s approved, the case moves to the National Visa Center (NVC), which asks for the affidavit of support and the online DS-260.',
    ),
    stages: [
      {
        title: t('Ahora: la petición', 'Now: the petition'),
        steps: [
          { formId: 'i-130', who: citizen, why: t('La petición: muestra que están casados.', 'The petition: shows you are married.'), preset: { relationship: 'spouse' } },
          { formId: 'i-130a', who: immigrant, why: t('Los datos del esposo/a que inmigra.', 'The immigrating spouse’s details.') },
          g1145(citizen),
        ],
      },
      {
        title: t('Cuando el NVC lo pida', 'When the NVC asks'),
        steps: [
          { formId: 'i-864', who: citizen, why: t('El compromiso de mantener al inmigrante.', 'The promise to support the immigrant.'), preset: { basis: 'petitioner' } },
          { formId: 'i-864a', who: t('Otra persona del hogar', 'Another household member'), optional: true, why: t('Solo si el ingreso del ciudadano no alcanza.', 'Only if the citizen’s income isn’t enough.') },
        ],
      },
      {
        title: t('Solo si el esposo/a está en EE.UU. sin estatus', 'Only if the spouse is in the U.S. without status'),
        body: t(
          'Si saldrá del país para la entrevista y estuvo aquí sin permiso, puede pedir el perdón antes de salir, con el I-130 aprobado. Hable con un abogado primero.',
          'If they will leave for the interview and were here without permission, they can ask for the waiver before leaving, once the I-130 is approved. Talk to an attorney first.',
        ),
        steps: [{ formId: 'i-601a', who: immigrant, optional: true, why: t('El perdón provisional por presencia ilegal.', 'The provisional unlawful presence waiver.') }],
      },
    ],
    tips: {
      es: [feesTip.es, 'Junte pruebas de que el matrimonio es real.', 'El DS-260 se llena en línea en el sitio del Departamento de Estado; Camino no lo llena.'],
      en: [feesTip.en, 'Gather proof the marriage is real.', 'The DS-260 is filled in online on the State Department’s site; Camino doesn’t fill it.'],
    },
  },
  {
    id: 'prometido',
    title: t('Prometido/a de ciudadano/a (visa K-1)', 'Fiancé(e) of a U.S. citizen (K-1 visa)'),
    summary: t('La petición de prometido/a y, después de la boda, la residencia.', 'The fiancé(e) petition and, after the wedding, the green card.'),
    intro: t(
      'El ciudadano pide la visa K-1. Con ella, el prometido/a entra a EE.UU. y deben casarse dentro de 90 días. Después se pide la residencia sin necesitar un I-130.',
      'The citizen asks for the K-1 visa. With it, the fiancé(e) enters the U.S. and you must marry within 90 days. Then the green card is requested without an I-130.',
    ),
    stages: [
      {
        title: t('Ahora: la petición', 'Now: the petition'),
        steps: [
          { formId: 'i-129f', who: t('El ciudadano/a', 'The U.S. citizen'), why: t('La petición de prometido/a.', 'The fiancé(e) petition.') },
          g1145(t('El ciudadano/a', 'The U.S. citizen')),
        ],
      },
      {
        title: t('Después de entrar con la K-1 y casarse', 'After entering on the K-1 and marrying'),
        steps: [
          { formId: 'i-485', who: immigrant, why: t('La solicitud de residencia.', 'The green card application.'), preset: { category: 'k1' } },
          { formId: 'i-864', who: citizen, why: t('El compromiso de mantener al inmigrante.', 'The promise to support the immigrant.'), preset: { basis: 'petitioner' } },
          { formId: 'i-765', who: immigrant, optional: true, why: t('Permiso de trabajo mientras se decide.', 'A work permit while it is decided.'), preset: { category: '(c)(9)' } },
          { formId: 'i-131', who: immigrant, optional: true, why: t('Permiso para viajar mientras se decide.', 'Permission to travel while it is decided.'), preset: { appType: '5' } },
        ],
      },
    ],
    tips: {
      es: [feesTip.es, 'Para el I-129F: pruebas de que se conocieron en persona en los últimos 2 años y de que piensan casarse.', 'Después de la boda, envíe el I-485 con el acta de matrimonio.'],
      en: [feesTip.en, 'For the I-129F: proof you met in person in the last 2 years and that you plan to marry.', 'After the wedding, file the I-485 with the marriage certificate.'],
    },
  },
  {
    id: 'daca',
    title: t('Renovación de DACA', 'DACA renewal'),
    summary: t('La solicitud de DACA, el permiso de trabajo y su hoja de cálculo, que se envían juntos.', 'The DACA request, the work permit and its worksheet, filed together.'),
    intro: t(
      'Para renovar DACA se envían tres formularios juntos. Lo que escriba en el I-821D ya aparecerá en el I-765.',
      'To renew DACA you file three forms together. What you write on the I-821D will already show up on the I-765.',
    ),
    stages: [
      {
        title: t('Se envían juntos', 'Filed together'),
        steps: [
          { formId: 'i-821d', who: t('Usted', 'You'), why: t('La solicitud de DACA.', 'The DACA request.'), preset: { requestType: 'renewal' } },
          { formId: 'i-765', who: t('Usted', 'You'), why: t('El permiso de trabajo, categoría (c)(33).', 'The work permit, category (c)(33).'), preset: { category: '(c)(33)' } },
          { formId: 'i-765ws', who: t('Usted', 'You'), why: t('La hoja de cálculo de ingresos y gastos que el I-765 de DACA necesita.', 'The income and expenses worksheet the DACA I-765 needs.') },
          g1145(t('Usted', 'You')),
        ],
      },
    ],
    tips: {
      es: [feesTip.es, 'Envíe la renovación entre 120 y 150 días antes de que venza su DACA.', 'Incluya una copia de su permiso de trabajo actual (frente y reverso).', 'Envíe los tres juntos a la dirección del I-821D: uscis.gov/i-821d, sección "Where to File".'],
      en: [feesTip.en, 'File the renewal 120 to 150 days before your DACA expires.', 'Include a copy of your current work permit (front and back).', 'Send all three together to the I-821D address: uscis.gov/i-821d, "Where to File" section.'],
    },
  },
  {
    id: 'tps',
    title: t('Estatus de Protección Temporal (TPS)', 'Temporary Protected Status (TPS)'),
    summary: t('La solicitud de TPS, el permiso de trabajo y, si lo necesita, la exención de tarifas.', 'The TPS application, the work permit and, if you need it, the fee waiver.'),
    intro: t(
      'El I-821 sirve para pedir TPS por primera vez o para volver a registrarse. El permiso de trabajo se pide al mismo tiempo.',
      'The I-821 is for a first TPS application or re-registration. The work permit is requested at the same time.',
    ),
    stages: [
      {
        title: t('Se envían juntos', 'Filed together'),
        steps: [
          { formId: 'i-821', who: t('Usted', 'You'), why: t('La solicitud de TPS.', 'The TPS application.') },
          {
            formId: 'i-765',
            who: t('Usted', 'You'),
            optional: true,
            why: t('El permiso de trabajo: (c)(19) si es su primera solicitud, (a)(12) si ya tiene TPS.', 'The work permit: (c)(19) for a first application, (a)(12) if you already have TPS.'),
          },
          { formId: 'i-912', who: t('Usted', 'You'), optional: true, why: t('Si no puede pagar las tarifas.', 'If you can’t pay the fees.') },
          g1145(t('Usted', 'You')),
        ],
      },
      {
        title: t('Si le aprueban TPS y quiere viajar', 'If TPS is approved and you want to travel'),
        steps: [{ formId: 'i-131', who: t('Usted', 'You'), optional: true, why: t('La autorización de viaje de TPS.', 'TPS travel authorization.'), preset: { appType: '4' } }],
      },
    ],
    tips: {
      es: [feesTip.es, 'Revise en uscis.gov/tps que su país siga designado y las fechas para registrarse.', 'Si los envía por correo, van juntos a la dirección del I-821 (uscis.gov/i-821, "Where to File"), que depende de su país.'],
      en: [feesTip.en, 'Check at uscis.gov/tps that your country is still designated and the dates to register.', 'If you mail them, they go together to the I-821 address (uscis.gov/i-821, "Where to File"), which depends on your country.'],
    },
  },
  {
    id: 'asilo',
    title: t('Asilo', 'Asylum'),
    summary: t('La solicitud de asilo, el permiso de trabajo, y lo que sigue si se lo otorgan.', 'The asylum application, the work permit, and what follows if it is granted.'),
    intro: t(
      'El asilo es para quien teme volver a su país por persecución. Cada paso tiene su momento: estos formularios no se envían juntos.',
      'Asylum is for people who fear returning to their country because of persecution. Each step has its time: these forms are not filed together.',
    ),
    legal: t(
      'Un caso de asilo es un caso legal serio. Le recomendamos mucho hablar con un abogado o representante acreditado. Si está en corte de inmigración, el I-589 se presenta ante la corte, no ante USCIS.',
      'An asylum case is a serious legal case. We strongly recommend talking to an attorney or accredited representative. If you are in immigration court, the I-589 is filed with the court, not with USCIS.',
    ),
    stages: [
      {
        title: t('Dentro del primer año en EE.UU.', 'Within your first year in the U.S.'),
        steps: [{ formId: 'i-589', who: t('Usted', 'You'), why: t('La solicitud de asilo.', 'The asylum application.') }],
      },
      {
        title: t('150 días después de presentar el I-589', '150 days after filing the I-589'),
        steps: [{ formId: 'i-765', who: t('Usted', 'You'), why: t('El permiso de trabajo, categoría (c)(8).', 'The work permit, category (c)(8).'), preset: { category: '(c)(8)' } }],
      },
      {
        title: t('Si le otorgan asilo', 'If you are granted asylum'),
        steps: [
          { formId: 'i-730', who: t('Usted', 'You'), optional: true, why: t('Para pedir a su esposo/a e hijos, dentro de 2 años.', 'To petition for your spouse and children, within 2 years.') },
          { formId: 'i-131', who: t('Usted', 'You'), optional: true, why: t('El documento de viaje de refugiado.', 'The refugee travel document.'), preset: { appType: '2' } },
        ],
      },
      {
        title: t('Un año después de recibir asilo', 'One year after being granted asylum'),
        steps: [{ formId: 'i-485', who: t('Usted', 'You'), why: t('La solicitud de residencia como asilado/a.', 'The green card application as an asylee.'), preset: { category: 'asylee' } }],
      },
    ],
    tips: {
      es: [feesTip.es, 'No viaje a su país: puede perder su caso.', 'Guarde una copia de todo lo que envíe.'],
      en: [feesTip.en, 'Don’t travel to your country: you may lose your case.', 'Keep a copy of everything you file.'],
    },
  },
  {
    id: 'ciudadania',
    title: t('Ciudadanía', 'Citizenship'),
    summary: t('La solicitud de naturalización y, si la necesita, la exención de tarifas.', 'The naturalization application and, if you need it, the fee waiver.'),
    intro: t(
      'Por lo general puede pedir la ciudadanía 5 años después de ser residente, o 3 si está casado/a con un ciudadano y viven juntos.',
      'Usually you can apply for citizenship 5 years after becoming a resident, or 3 if you are married to a citizen and live together.',
    ),
    stages: [
      {
        title: t('Se envían juntos', 'Filed together'),
        steps: [
          { formId: 'n-400', who: t('Usted', 'You'), why: t('La solicitud de naturalización.', 'The naturalization application.') },
          { formId: 'i-912', who: t('Usted', 'You'), optional: true, why: t('Si no puede pagar la tarifa.', 'If you can’t pay the fee.') },
          g1145(t('Usted', 'You')),
        ],
      },
    ],
    tips: {
      es: [feesTip.es, 'Incluya una copia de su tarjeta de residente (frente y reverso).', 'Si tuvo arrestos o viajes largos, hable con un abogado antes de enviar.'],
      en: [feesTip.en, 'Include a copy of your green card (front and back).', 'If you had arrests or long trips, talk to an attorney before you file.'],
    },
  },
  {
    id: 'mudanza',
    title: t('Me mudé', 'I moved'),
    summary: t(
      'Avise su nueva dirección a USCIS y, si tiene un caso en corte de inmigración, también a la corte.',
      'Report your new address to USCIS and, if you have a case in immigration court, to the court too.',
    ),
    intro: t(
      'Casi todas las personas que no son ciudadanas deben avisar a USCIS dentro de 10 días después de mudarse. Si además tiene un caso ante un juez de inmigración, la corte no se entera por USCIS: hay que avisarle aparte, dentro de 5 días hábiles.',
      'Almost everyone who isn’t a citizen must tell USCIS within 10 days of moving. If you also have a case before an immigration judge, the court doesn’t learn it from USCIS: you have to tell it separately, within 5 working days.',
    ),
    stages: [
      {
        title: t('Cada uno por su lado', 'Each one separately'),
        steps: [
          { formId: 'ar-11', who: t('Usted', 'You'), why: t('El aviso de cambio de dirección para USCIS.', 'The change of address notice for USCIS.') },
          {
            formId: 'eoir-33',
            who: t('Usted', 'You'),
            optional: true,
            why: t('Solo si tiene un caso en corte de inmigración: el aviso para la corte y para los abogados de ICE.', 'Only if you have a case in immigration court: the notice for the court and for ICE’s attorneys.'),
          },
        ],
      },
    ],
    tips: {
      es: [
        'Los dos son gratis.',
        'Cada miembro de la familia que no es ciudadano llena su propio AR-11, y su propio EOIR-33 si tiene caso en corte.',
        'Si no avisa a la corte, puede perderse una audiencia y recibir una orden de deportación sin saberlo.',
      ],
      en: [
        'Both are free.',
        'Each family member who isn’t a citizen fills in their own AR-11, and their own EOIR-33 if they have a court case.',
        'If you don’t tell the court, you may miss a hearing and get a removal order without knowing it.',
      ],
    },
  },
];

export const packageById = (id: string) => packages.find((p) => p.id === id);

export const stepsOf = (p: PackageDefinition) => p.stages.flatMap((s) => s.steps);
