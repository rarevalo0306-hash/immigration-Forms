import type { Answers, Field, FormDefinition, YesNoItem } from './types';
import type { T } from '../i18n';
import { all, date, is, nameFields, rows, sexField, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';
import { CLASSES_OF_ADMISSION } from './classOfAdmission';

// Questions follow USCIS Form I-914, Application for T Nonimmigrant Status, edition 01/20/25.
// The PDF mapping lives in src/pdf/i914Pdf.ts.
//
// Supplement A (the application for each eligible family member) is its own form in Camino
// (src/forms/i914supa.ts). Out of scope: Supplement B (the optional declaration signed by a law
// enforcement official), a separate form; the intro
// and next steps explain them. The signatures and their dates (Part 6, Item 6, and the
// interpreter's and preparer's in Parts 7 and 8; the rest of those parts comes from the "Who helped
// you" section) and the attorney box on page 1 are left blank to be completed by hand.

export const I914_EDITION = '01/20/25';

const t = (es: string, en: string): T => ({ es, en });

const text = (id: string, es: string, en: string, formRef: string, opts: Partial<Field> = {}): Field => ({ id, type: 'text', required: true, label: { es, en }, formRef, ...opts });

const longText = (id: string, es: string, en: string, formRef: string, required = true): Field => ({ id, type: 'longText', required, label: { es, en }, formRef });

/** A U.S. address: this form has no province or country boxes. */
const usAddress = (prefix: string, ref: string, careOf = false): Field[] => [
  ...(careOf ? [text(`${prefix}.careOf`, 'A cargo de (persona u organización que recibe su correo)', 'In care of name', `${ref} · In Care Of Name`, { required: false })] : []),
  text(`${prefix}.street`, 'Número y calle', 'Street number and name', `${ref} · Street Number and Name`, { maxLength: 34, placeholder: '1234 Main St' }),
  { id: `${prefix}.unit`, type: 'unit', label: t('Apartamento, suite o piso', 'Apartment, suite or floor'), formRef: `${ref} · Apt. / Ste. / Flr.`, placeholder: 'Apt 4B' },
  text(`${prefix}.city`, 'Ciudad', 'City or town', `${ref} · City or Town`, { maxLength: 20 }),
  { id: `${prefix}.state`, type: 'state', required: true, label: t('Estado', 'State'), formRef: `${ref} · State`, placeholder: 'CA' },
  { id: `${prefix}.zip`, type: 'zip', required: true, label: t('Código postal ZIP', 'ZIP code'), formRef: `${ref} · ZIP Code` },
];

const yn = (id: string, item: string, es: string, en: string): YesNoItem => ({ id, formRef: `Part 4 · Item ${item}`, label: t(es, en) });

/** Part 3, Items 1-4. */
export const ELIGIBILITY_ITEMS: YesNoItem[] = [
  { id: 'p3.1', formRef: 'Part 3 · Item 1', label: t('Soy o he sido víctima de una forma grave de trata de personas (por ejemplo, me obligaron a trabajar o a tener sexo comercial con fuerza, engaño o amenazas).', 'I am or have been a victim of a severe form of trafficking in persons.') },
  { id: 'p3.2a', formRef: 'Part 3 · Item 2.A', label: t('He colaborado con los pedidos razonables de ayuda de la policía u otras autoridades.', 'I have cooperated with reasonable requests for assistance from law enforcement.') },
  { id: 'p3.2b', formRef: 'Part 3 · Item 2.B', label: t('Por mi edad o por el trauma que sufrí, no estoy obligado/a a colaborar con las autoridades.', 'Due to my age or the trauma I have suffered, I am exempt from the requirement to cooperate with reasonable requests for assistance from law enforcement.') },
  { id: 'p3.3', formRef: 'Part 3 · Item 3', label: t('Estoy en EE.UU. (o en Samoa Americana, las Islas Marianas del Norte o un puerto de entrada) a causa de la trata, o me dejaron entrar para ayudar en una investigación o juicio sobre la trata.', 'I am physically present in the United States, American Samoa, or the Commonwealth of the Northern Mariana Islands, or at a port of entry, on account of trafficking, or have been allowed entry into the United States to participate in investigative or judicial processes associated with an act or perpetrator of trafficking.') },
  { id: 'p3.4', formRef: 'Part 3 · Item 4', label: t('Temo que sufriría un daño extremo, inusual y grave si me deportan.', 'I fear that I will suffer extreme hardship involving unusual and severe harm upon removal.') },
];

/** Part 4, Items 1.A-1.I. */
export const CRIME_ITEMS: YesNoItem[] = [
  yn('p4.1a', '1.A', '¿Alguna vez cometió un delito por el que no lo arrestaron?', 'Have you EVER committed a crime or offense for which you have not been arrested?'),
  yn('p4.1b', '1.B', '¿Alguna vez lo arrestó, citó o detuvo la policía, inmigración o militares, por cualquier razón?', 'Have you EVER been arrested, cited, or detained by any law enforcement officer (including DHS, former INS, and military officers) for any reason?'),
  yn('p4.1c', '1.C', '¿Alguna vez lo acusaron de un delito?', 'Have you EVER been charged with committing any crime or offense?'),
  yn('p4.1d', '1.D', '¿Alguna vez lo condenaron por un delito (aunque después lo borraran o perdonaran)?', 'Have you EVER been convicted of a crime or offense (even if violation was subsequently expunged or pardoned)?'),
  yn('p4.1e', '1.E', '¿Alguna vez lo pusieron en un programa alternativo o de rehabilitación (diversion, deferred prosecution, deferred adjudication)?', 'Have you EVER been placed in an alternative sentencing or a rehabilitative program (for example: diversion, deferred prosecution, withheld adjudication, deferred adjudication)?'),
  yn('p4.1f', '1.F', '¿Alguna vez recibió una sentencia suspendida, libertad condicional (probation) o parole?', 'Have you EVER received a suspended sentence, been placed on probation, or been paroled?'),
  yn('p4.1g', '1.G', '¿Alguna vez estuvo en la cárcel o en prisión?', 'Have you EVER been in jail or prison?'),
  yn('p4.1h', '1.H', '¿Alguna vez recibió un perdón, amnistía u otra clemencia?', 'Have you EVER been the beneficiary of a pardon, amnesty, rehabilitation, or other act of clemency or similar action?'),
  yn('p4.1i', '1.I', '¿Alguna vez usó inmunidad diplomática para evitar un juicio en EE.UU.?', 'Have you EVER exercised diplomatic immunity to avoid prosecution for a criminal offense in the United States?'),
];

/** Part 4, Items 2.A-2.D. */
export const CONDUCT_ITEMS: YesNoItem[] = [
  yn('p4.2a', '2.A', '¿Ha practicado la prostitución o conseguido clientes para ella, o piensa hacerlo? (Conteste Sí aunque lo obligaran.)', 'Have you engaged in prostitution or procurement of prostitution or do you intend to engage in prostitution or procurement of prostitution?'),
  yn('p4.2b', '2.B', '¿Alguna vez participó en vicios comerciales ilegales, como apuestas ilegales?', 'Have you EVER engaged in any unlawful commercialized vice, including, but not limited to illegal gambling?'),
  yn('p4.2c', '2.C', '¿Alguna vez ayudó a sabiendas a alguien a entrar ilegalmente a EE.UU.?', 'Have you EVER knowingly encouraged, induced, assisted, abetted, or aided any alien to try to enter the United States illegally?'),
  yn('p4.2d', '2.D', '¿Alguna vez traficó drogas o ayudó a traficarlas?', 'Have you EVER illicitly trafficked in any controlled substance, or knowingly assisted, abetted, or colluded in the illicit trafficking of any controlled substance?'),
];

/** Part 4, Items 3-7. */
export const SECURITY_ITEMS: YesNoItem[] = [
  yn('p4.3a', '3.A', '¿Alguna vez cometió, planeó o ayudó a secuestrar o sabotear un avión, barco o vehículo?', 'Have you EVER committed, planned or prepared, participated in, threatened to, attempted to, or conspired to commit, gathered information for, or solicited funds for hijacking or sabotage of any conveyance (including an aircraft, vessel, or vehicle)?'),
  yn('p4.3b', '3.B', '¿…tomar rehenes para obligar a otros a hacer algo?', '…seizing or detaining, and threatening to kill, injure, or continue to detain, another individual in order to compel a third person to do or abstain from doing any act?'),
  yn('p4.3c', '3.C', '¿…un asesinato político (magnicidio)?', '…assassination?'),
  yn('p4.3d', '3.D', '¿…usar un arma de fuego para poner en peligro a personas o causar daños graves?', '…the use of any firearm with intent to endanger, directly or indirectly, the safety of one or more individuals or to cause substantial damage to property?'),
  yn('p4.3e', '3.E', '¿…usar explosivos, armas químicas, biológicas o nucleares u otras armas peligrosas?', '…the use of any biological agent; chemical agent; or nuclear weapon or device; explosive; or other weapon or dangerous device, with intent to endanger the safety of individuals or to cause substantial damage to property?'),
  yn('p4.4a', '4.A', '¿Alguna vez fue miembro, apoyó o estuvo asociado con una organización terrorista designada?', 'Have you EVER been a member of, solicited money or members for, provided support for, attended military training by or on behalf of, or been associated with an organization that is designated as a terrorist organization under INA section 219?'),
  yn('p4.4b1', '4.B.(1)', '¿…con un grupo que ha secuestrado o saboteado aviones, barcos o vehículos?', '…any other group of two or more individuals which has engaged in hijacking or sabotage of any conveyance?'),
  yn('p4.4b2', '4.B.(2)', '¿…con un grupo que ha tomado rehenes?', '…a group which has engaged in seizing or detaining, and threatening to kill, injure, or continue to detain another individual to compel a third person?'),
  yn('p4.4b3', '4.B.(3)', '¿…con un grupo que ha cometido asesinatos políticos?', '…a group which has engaged in assassination?'),
  yn('p4.4b4', '4.B.(4)', '¿…con un grupo que ha usado armas de fuego para poner en peligro a personas?', '…a group which has engaged in the use of any firearm with intent to endanger the safety of individuals or to cause substantial damage to property?'),
  yn('p4.4b5', '4.B.(5)', '¿…con un grupo que pide dinero o miembros o da apoyo a una organización terrorista?', '…a group which has engaged in soliciting money or members or otherwise providing material support to a terrorist organization?'),
  yn('p4.4b6', '4.B.(6)', '¿…con un grupo que ha usado explosivos u otras armas peligrosas?', '…a group which has engaged in the use of any biological agent, chemical agent, nuclear weapon or device, explosive, or other weapon or dangerous device?'),
  yn('p4.5a', '5.A', '¿Piensa hacer espionaje en EE.UU.?', 'Do you intend to engage in the United States in espionage?'),
  yn('p4.5b', '5.B', '¿Piensa hacer actividades ilegales o para derrocar al gobierno de EE.UU.?', 'Do you intend to engage in the United States in any unlawful activity, or any activity the purpose of which is in opposition, to control, or overthrow of the government of the United States?'),
  yn('p4.5c', '5.C', '¿Piensa hacer actividades de espionaje, sabotaje o exportación ilegal de tecnología o información?', 'Do you intend to engage in the United States solely, principally, or incidentally in any activity related to espionage or sabotage or to violate any law involving the export of goods, technology, or sensitive information?'),
  yn('p4.6', '6', '¿Ha sido miembro del Partido Comunista u otro partido totalitario (salvo que fuera obligado)?', 'Have you ever been or do you continue to be a member of the Communist or other totalitarian party, except when membership was involuntary?'),
  yn('p4.7', '7', '¿Participó en persecuciones con el gobierno nazi de Alemania entre 1933 y 1945?', 'Have you, during the period of March 23, 1933, to May 8, 1945, in association with the Nazi Government of Germany or any organization or government associated or allied with it, ever ordered, incited, assisted, or otherwise participated in the persecution of any person?'),
];

/** Part 4, Items 8.A-8.C. */
export const PRESENCE_ITEMS: YesNoItem[] = [
  yn('p4.8a', '8.A', '¿Alguna vez estuvo presente o cerca cuando mataron, torturaron, golpearon o hirieron a alguien a propósito?', 'Have you EVER been present or nearby when any person was intentionally killed, tortured, beaten, or injured?'),
  yn('p4.8b', '8.B', '¿…cuando sacaron a alguien de su casa por la fuerza o con amenazas?', '…displaced or moved from their residence by force, compulsion, or duress?'),
  yn('p4.8c', '8.C', '¿…cuando obligaron a alguien a tener contacto sexual?', '…in any way compelled or forced to engage in any kind of sexual contact or relations?'),
];

/** Part 4, Items 9.A-9.F. */
export const REMOVAL_ITEMS: YesNoItem[] = [
  yn('p4.9a', '9.A', '¿Tiene AHORA un proceso de deportación, exclusión o rescisión abierto?', 'Are removal, exclusion, rescission, or deportation proceedings pending against you?'),
  yn('p4.9b', '9.B', '¿Alguna vez le abrieron un proceso de deportación, exclusión o rescisión?', 'Have removal, exclusion, rescission, or deportation proceedings EVER been initiated against you?'),
  yn('p4.9c', '9.C', '¿Alguna vez lo deportaron o excluyeron de EE.UU.?', 'Have you EVER been removed, excluded, or deported from the United States?'),
  yn('p4.9d', '9.D', '¿Alguna vez le dieron una orden de deportación o exclusión?', 'Have you EVER been ordered to be removed, excluded, or deported from the United States?'),
  yn('p4.9e', '9.E', '¿Alguna vez le negaron una visa o la entrada a EE.UU.?', 'Have you EVER been denied a visa or denied admission to the United States?'),
  yn('p4.9f', '9.F', '¿Alguna vez le dieron salida voluntaria y no salió a tiempo?', 'Have you EVER been granted voluntary departure by an immigration officer or an immigration judge and failed to depart within the allotted time?'),
];

/** Part 4, Items 10-14. */
export const VIOLENCE_ITEMS: YesNoItem[] = [
  yn('p4.10a', '10.A', '¿Alguna vez ordenó, cometió o ayudó en actos de tortura o genocidio?', 'Have you EVER ordered, incited, called for, committed, assisted, helped with, or otherwise participated in acts involving torture or genocide?'),
  yn('p4.10b', '10.B', '¿…en matar a alguien?', '…killing any person?'),
  yn('p4.10c', '10.C', '¿…en herir gravemente a alguien a propósito?', '…intentionally and severely injuring any person?'),
  yn('p4.10d', '10.D', '¿…en contacto sexual con alguien obligado o amenazado?', '…engaging in any kind of sexual contact or relations with any person who was being forced or threatened?'),
  yn('p4.10e', '10.E', '¿…en impedir a alguien practicar su religión?', '…limiting or denying any person’s ability to exercise religious beliefs?'),
  yn('p4.11a', '11.A', '¿Alguna vez sirvió o participó en una unidad militar, paramilitar, policial, de autodefensa, guerrilla, milicia o grupo rebelde?', 'Have you EVER served in, been a member of, assisted in, or participated in any military unit, paramilitary unit, police unit, self-defense unit, vigilante unit, rebel group, guerrilla group, militia, or insurgent organization?'),
  yn('p4.11b', '11.B', '¿Alguna vez trabajó en una prisión, cárcel, centro de detención o campo de trabajo?', 'Have you EVER served in any prison, jail, prison camp, detention facility, labor camp, or any other situation that involved detaining persons?'),
  yn('p4.12', '12', '¿Alguna vez perteneció a un grupo en el que usted u otros usaron o amenazaron con armas contra alguien?', 'Have you EVER been a member of, assisted in, or participated in any group, unit, or organization of any kind in which you or other persons used any type of weapon against any person or threatened to do so?'),
  yn('p4.13', '13', '¿Alguna vez vendió, dio o transportó armas a alguien que las usó contra otra persona?', 'Have you EVER assisted or participated in selling or providing weapons, or in transporting weapons, to any person who to your knowledge used them against another person?'),
  yn('p4.14', '14', '¿Alguna vez recibió entrenamiento militar, paramilitar o con armas?', 'Have you EVER received any type of military, paramilitary, or weapons training?'),
];

/** Part 4, Items 15-20. */
export const IMMIGRATION_ITEMS: YesNoItem[] = [
  yn('p4.15', '15', '¿Tiene una orden final o multa por usar documentos falsos (sección 274C)?', 'Are you under a final order or civil penalty for violating section 274C (producing and/or using false documentation to unlawfully satisfy a requirement of the INA)?'),
  yn('p4.16', '16', '¿Alguna vez usó fraude o mentiras para conseguir una visa, entrada o beneficio migratorio?', 'Have you EVER, by fraud or willful misrepresentation of a material fact, sought to procure, or procured, a visa or other documentation, for entry into the United States or any immigration benefit?'),
  yn('p4.17', '17', '¿Alguna vez salió de EE.UU. para evitar el servicio militar?', 'Have you EVER left the United States to avoid being drafted into the U.S. Armed Forces?'),
  yn('p4.18', '18', '¿Alguna vez retuvo fuera de EE.UU. a un niño con derecho a la ciudadanía, contra la custodia de un ciudadano de EE.UU.?', 'Have you EVER detained, retained, or withheld the custody of a child, having a lawful claim to U.S. citizenship, outside the United States from a U.S. citizen granted custody?'),
  yn('p4.19', '19', '¿Piensa practicar la poligamia en EE.UU.?', 'Do you plan to practice polygamy in the United States?'),
  yn('p4.20', '20', '¿Entró a EE.UU. como polizón (escondido en un barco o avión)?', 'Have you entered the United States as a stowaway?'),
];

/** Part 4, Items 21.A-21.C. */
export const HEALTH_ITEMS: YesNoItem[] = [
  yn('p4.21a', '21.A', '¿Tiene una enfermedad contagiosa de importancia para la salud pública?', 'Do you have a communicable disease of public health significance?'),
  yn('p4.21b', '21.B', '¿Tiene o ha tenido un trastorno físico o mental con conductas que pongan en peligro a usted u otros?', 'Do you have or have you had a physical or mental disorder and behavior (or a history of behavior that is likely to recur) associated with the disorder which has posed or may pose a threat to the property, safety, or welfare of yourself or others?'),
  yn('p4.21c', '21.C', '¿Es o ha sido adicto/a o abusador/a de drogas?', 'Are you now or have you been a drug abuser or drug addict?'),
];

export const PROCESSING_ITEMS = [...CRIME_ITEMS, ...CONDUCT_ITEMS, ...SECURITY_ITEMS, ...PRESENCE_ITEMS, ...REMOVAL_ITEMS, ...VIOLENCE_ITEMS, ...IMMIGRATION_ITEMS, ...HEALTH_ITEMS];

const anyYes = (items: YesNoItem[]) => (a: Answers) => items.some((i) => a[i.id] === 'yes');

const legal = (es: string, en: string) => ({ tone: 'legal' as const, title: t('Hable con un abogado', 'Talk to an attorney'), body: t(es, en) });

const admissibility = legal(
  'Diga siempre la verdad, aunque su récord esté sellado o borrado, o alguien le haya dicho que ya no existe. Conteste Sí también si lo hizo porque los tratantes lo obligaron, y explique esa relación. Un Sí no significa que le nieguen la visa T: muchas faltas se pueden perdonar con el Formulario I-192, sobre todo si tienen que ver con la trata. Antes de contestar, hable con un abogado o un representante acreditado.',
  'Always tell the truth, even if your record was sealed or cleared, or someone told you it no longer exists. Answer Yes even if the traffickers forced you to do it, and explain that connection. A Yes does not mean your T visa will be denied: many grounds can be waived with Form I-192, especially when they are connected to the trafficking. Talk to an attorney or accredited representative before answering.',
);

/** Current status: the form's dropdown, which lists the classes of admission. */
const STATUS_OPTIONS = CLASSES_OF_ADMISSION.map((c) => ({ value: c, label: t(c, c) }));

export const i914: FormDefinition = {
  id: 'i-914',
  number: 'I-914',
  edition: I914_EDITION,
  title: t('Solicitud de visa T (víctimas de trata de personas)', 'Application for T Nonimmigrant Status'),
  summary: {
    es: 'Pida la visa T si fue víctima de trata de personas (trabajo forzado o sexo comercial obligado) y está en EE.UU. por esa razón.',
    en: 'Ask for T nonimmigrant status if you were a victim of human trafficking (forced labor or commercial sex) and are in the U.S. because of it.',
  },
  intro: {
    es: 'La visa T protege a víctimas de trata de personas: a quienes obligaron, con fuerza, engaño o amenazas, a trabajar o a tener sexo comercial (o a cualquier menor de 18 en sexo comercial). Aquí se llena la solicitud principal (I-914) para usted. El Suplemento B es una declaración que puede firmar la policía u otra autoridad que investigó la trata: no es obligatorio, pero ayuda mucho; usted no lo llena y debe pedirlo a esa agencia. Para incluir a su familia se usa el Suplemento A, que también puede llenar en esta app. Su caso es confidencial: la ley prohíbe que USCIS comparta su información con los tratantes. Es un caso legal delicado: le recomendamos que lo revise un abogado o un representante acreditado (muchas organizaciones ayudan gratis a víctimas). Si necesita ayuda o está en peligro, llame a la Línea Nacional contra la Trata de Personas, 1-888-373-7888 (gratis, confidencial, en español, las 24 horas), o al 911.',
    en: 'The T visa protects victims of human trafficking: people who were forced, tricked or threatened into labor or commercial sex (or any minor under 18 in commercial sex). This app completes the main application (Form I-914) for you. Supplement B is a declaration that the police or another authority that investigated the trafficking may sign: it is not required, but it helps a lot; you do not fill it out and must request it from that agency. Family members are added with Supplement A, which you can also fill out in this app. Your case is confidential: the law forbids USCIS from sharing your information with the traffickers. It is a sensitive legal case: we recommend an attorney or accredited representative review it (many organizations help victims for free). If you need help or are in danger, call the National Human Trafficking Hotline at 1-888-373-7888 (free, confidential, 24 hours, in Spanish), or 911.',
  },
  minutes: 50,
  pdf: {
    path: 'forms/i-914.pdf',
    fileName: 'I-914-filled.pdf',
    load: () => import('../pdf/i914Pdf').then((m) => m.fillI914),
    signHere: { es: 'Parte 6, Ítem 6', en: 'Part 6, Item 6' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-914 que la edición {edition} sigue vigente. Presentar el I-914 no cuesta nada.',
      'Escriba y firme su declaración personal (obligatoria): cómo lo engañaron o reclutaron, qué le obligaron a hacer, cómo lo controlaban, cómo colaboró con las autoridades (o por qué no pudo) y qué daño teme si regresa. Adjunte pruebas: reportes de policía, cartas de organizaciones o terapeutas, mensajes, fotos, recibos de pago, y una copia de su pasaporte o acta de nacimiento.',
      'Si puede, pida el Suplemento B (Formulario I-914, Supplement B) a la agencia que investigó la trata (policía, FBI, HSI, Departamento de Trabajo u otra). No es obligatorio, pero es una prueba fuerte. Usted no lo llena; ellos lo firman.',
      'Si contestó Sí a alguna pregunta de la Parte 4 o entró sin permiso, pregunte a su abogado si debe presentar también el Formulario I-192 (perdón de inadmisibilidad). Si quiere incluir a su esposo/a, hijos o (si es menor de 21) padres y hermanos, llene un Suplemento A por cada uno; también puede hacerlo después.',
      'Imprima el PDF y firme la Parte 6, Ítem 6, a mano con tinta negra. Si un intérprete o preparador le ayudó, sus datos ya están en las Partes 7 y 8; ellos las revisan y las firman y fechan a mano. Si alguna explicación de la Parte 9 no cabe, siga en una hoja aparte con su nombre, A-Number, firma y fecha.',
      'Envíe todo a la dirección de USCIS indicada en uscis.gov/i-914. Si teme que alguien vea su correo, use la dirección segura que dio. Hable con un abogado o representante acreditado antes de enviar. Línea Nacional contra la Trata de Personas: 1-888-373-7888.',
    ],
    en: [
      'Check at uscis.gov/i-914 that edition {edition} is still current. There is no fee to file Form I-914.',
      'Write and sign your personal statement (required): how you were recruited or deceived, what you were forced to do, how you were controlled, how you cooperated with the authorities (or why you could not), and what harm you fear if you return. Attach evidence: police reports, letters from organizations or counselors, messages, photos, pay records, and a copy of your passport or birth certificate.',
      'If you can, request Supplement B (Form I-914, Supplement B) from the agency that investigated the trafficking (police, FBI, HSI, Department of Labor or other). It is not required, but it is strong evidence. You do not fill it out; they sign it.',
      'If you answered Yes to any Part 4 question or entered without permission, ask your attorney whether you must also file Form I-192 (waiver of inadmissibility). To include your spouse, children or (if you are under 21) parents and siblings, complete a Supplement A for each one; you can also do it later.',
      'Print the PDF and sign Part 6, Item 6, by hand in black ink. If an interpreter or preparer helped you, their details are already in Parts 7 and 8; they check them and sign and date by hand. If an explanation in Part 9 does not fit, continue on a separate sheet with your name, A-Number, signature and date.',
      'Mail everything to the USCIS address listed at uscis.gov/i-914. If you fear someone may see your mail, use the safe address you gave. Talk to an attorney or accredited representative before mailing. National Human Trafficking Hotline: 1-888-373-7888.',
    ],
  },
  sections: [
    {
      id: 'purpose',
      part: 'Part 1',
      title: t('Por qué presenta', 'Purpose for filing'),
      questions: [
        {
          id: 'filingType',
          kind: 'choice',
          formRef: 'Part 1 · Item 1 · Purpose for Filing This Application',
          question: t('¿Ha pedido la visa T antes?', 'Have you applied for T nonimmigrant status before?'),
          notice: legal(
            'La visa T es un caso legal: le recomendamos un abogado o un representante acreditado (muchas organizaciones de apoyo a víctimas ayudan gratis). Su información es confidencial: la ley prohíbe que USCIS la comparta con los tratantes. Si necesita ayuda o está en peligro, llame a la Línea Nacional contra la Trata de Personas: 1-888-373-7888 (gratis, confidencial, las 24 horas, en español), o al 911.',
            'The T visa is a legal case: we recommend an attorney or accredited representative (many victim service organizations help for free). Your information is confidential: the law forbids USCIS from sharing it with the traffickers. If you need help or are in danger, call the National Human Trafficking Hotline: 1-888-373-7888 (free, confidential, 24 hours), or 911.',
          ),
          options: [
            { value: 'A', label: t('No, es la primera vez que la pido', 'No, this is my first time (Item 1.A)') },
            { value: 'B', label: t('Sí, ya la pedí antes', 'Yes, I applied before (Item 1.B)') },
          ],
        },
        {
          id: 'receipt',
          kind: 'fields',
          formRef: 'Part 1 · Item 1.B.(1) · Receipt Number',
          showIf: is('filingType', 'B'),
          question: t('¿Cuál es el número de recibo de su solicitud anterior?', 'What is the receipt number of your earlier application?'),
          why: t('Está en la carta de recibo (Form I-797C) y empieza con EAC.', 'It is on the receipt notice (Form I-797C) and starts with EAC.'),
          fields: [{ id: 'priorReceipt', type: 'receipt', required: true, label: t('Número de recibo', 'Receipt number'), formRef: 'Part 1 · Item 1.B.(1)', placeholder: 'EAC1234567890' }],
        },
      ],
    },
    {
      id: 'about',
      part: 'Part 2',
      title: t('Sus datos', 'About you'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 2 · Item 1 · Your Full Legal Name',
          question: t('¿Cuál es su nombre legal completo?', 'What is your full legal name?'),
          fields: nameFields('name', 'Part 2 · Item 1'),
        },
        { id: 'otherName.more0', kind: 'choice', formRef: 'Part 2 · Item 2 · Other Names Used', question: t('¿Ha usado otros nombres (de soltera, apodos, alias)?', 'Have you used other names (maiden name, nicknames, aliases)?'), why: t('Incluya los nombres que los tratantes le hicieron usar.', 'Include names the traffickers made you use.'), options: yesNo },
        ...rows({
          max: 3,
          id: 'otherName',
          first: is('otherName.more0', 'yes'),
          question: (i) => (i === 1 ? t('Otro nombre que ha usado', 'Another name you have used') : t('Otro nombre más', 'One more name')),
          more: t('¿Ha usado otro nombre más?', 'Have you used another name?'),
          formRef: 'Part 2 · Item 2',
          fields: (i) => nameFields(`otherName${i}`, i <= 2 ? 'Part 2 · Item 2' : 'Part 9'),
          overflow: t('El tercer nombre va en la Parte 9. Si son más, escríbalos a mano en la Parte 9.', 'The third name goes in Part 9. If there are more, write them by hand in Part 9.'),
        }),
        {
          id: 'home',
          kind: 'fields',
          formRef: 'Part 2 · Item 3 · Physical Address',
          question: t('¿Dónde vive?', 'What is your physical address?'),
          fields: usAddress('home', 'Part 2 · Item 3'),
        },
        {
          id: 'mailingSame',
          kind: 'choice',
          formRef: 'Part 2 · Item 4 · Safe Mailing Address',
          question: t('¿Puede recibir correo de USCIS de forma segura en esa dirección?', 'Can you safely receive mail from USCIS at that address?'),
          why: t('Si los tratantes u otra persona que le hizo daño pueden ver su correo, conteste No y dé una dirección segura (de un familiar, una organización o su abogado).', 'If the traffickers or anyone who harmed you can see your mail, answer No and give a safe address (a relative, an organization or your attorney).'),
          options: yesNo,
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 2 · Item 4 · Safe Mailing Address',
          showIf: is('mailingSame', 'no'),
          question: t('¿A qué dirección segura le enviamos el correo?', 'What safe mailing address should USCIS use?'),
          fields: usAddress('mailing', 'Part 2 · Item 4', true),
        },
        {
          id: 'ids',
          kind: 'fields',
          formRef: 'Part 2 · Items 5–7',
          question: t('Sus números', 'Your numbers'),
          fields: [
            { id: 'aNumber', type: 'aNumber', label: t('A-Number (si tiene)', 'A-Number (if any)'), formRef: 'Part 2 · Item 5' },
            { id: 'uscisAccount', type: 'uscisAccount', label: t('Cuenta en línea de USCIS (si tiene)', 'USCIS online account number (if any)'), formRef: 'Part 2 · Item 6' },
            { id: 'ssn', type: 'ssn', label: t('Número de Seguro Social (si tiene)', 'U.S. Social Security number (if any)'), formRef: 'Part 2 · Item 7' },
          ],
        },
        {
          id: 'personal',
          kind: 'fields',
          formRef: 'Part 2 · Items 8 and 10',
          question: t('Datos personales', 'Personal details'),
          fields: [sexField('sex', 'Part 2 · Item 8'), date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 2 · Item 10')],
        },
        {
          id: 'marital',
          kind: 'choice',
          formRef: 'Part 2 · Item 9 · Marital Status',
          question: t('¿Cuál es su estado civil?', 'What is your marital status?'),
          options: [
            { value: 'Single', label: t('Soltero/a (nunca casado/a)', 'Single, never married') },
            { value: 'Married', label: t('Casado/a', 'Married') },
            { value: 'Divorced', label: t('Divorciado/a', 'Divorced') },
            { value: 'Widowed', label: t('Viudo/a', 'Widowed') },
          ],
        },
        {
          id: 'birth',
          kind: 'fields',
          formRef: 'Part 2 · Items 11–12',
          question: t('¿Dónde nació?', 'Where were you born?'),
          fields: [
            text('birthCity', 'Ciudad de nacimiento', 'City or town of birth', 'Part 2 · Item 11 · City or Town', { maxLength: 20 }),
            text('birthProvince', 'Estado o provincia de nacimiento', 'State or province of birth', 'Part 2 · Item 11 · State or Province', { required: false, maxLength: 20 }),
            text('birthCountry', 'País de nacimiento', 'Country of birth', 'Part 2 · Item 11 · Country'),
            text('citizenship', 'País de ciudadanía o nacionalidad', 'Country of citizenship or nationality', 'Part 2 · Item 12'),
          ],
        },
        {
          id: 'documents',
          kind: 'fields',
          formRef: 'Part 2 · Items 13–16',
          question: t('Su pasaporte o documento de viaje', 'Your passport or travel document'),
          why: t('Deje en blanco lo que no tenga. Si los tratantes le quitaron el pasaporte, ponga los datos que recuerde y explíquelo en su declaración.', 'Leave blank what you do not have. If the traffickers took your passport, give what you remember and explain it in your statement.'),
          fields: [
            text('passport', 'Número de pasaporte o documento de viaje', 'Passport or travel document number', 'Part 2 · Item 13', { required: false, maxLength: 30 }),
            text('passportCountry', 'País que lo emitió', 'Country that issued it', 'Part 2 · Item 14', { required: false }),
            date('passportIssued', 'Fecha de emisión', 'Issue date', 'Part 2 · Item 15', false),
            date('passportExpires', 'Fecha de vencimiento', 'Expiration date', 'Part 2 · Item 16', false, 'date'),
          ],
        },
        {
          id: 'lastEntry',
          kind: 'fields',
          formRef: 'Part 2 · Items 17–20',
          question: t('Su última entrada a EE.UU. y su estatus actual', 'Your last entry into the U.S. and current status'),
          why: t('Si entró sin inspección, ponga el lugar y la fecha aproximados. El I-94 es el registro de entrada; si entró sin inspección, no tiene uno.', 'If you entered without inspection, give the approximate place and date. The I-94 is your arrival record; if you entered without inspection, you do not have one.'),
          fields: [
            text('lastEntry.city', 'Ciudad de entrada', 'City or town of entry', 'Part 2 · Item 17 · City or Town', { maxLength: 20, placeholder: 'San Ysidro' }),
            { id: 'lastEntry.state', type: 'state', required: true, label: t('Estado', 'State'), formRef: 'Part 2 · Item 17 · State', placeholder: 'CA' },
            date('lastEntry.date', 'Fecha de la última entrada (aproximada)', 'Date of last entry, on or about', 'Part 2 · Item 18'),
            { id: 'i94', type: 'i94', label: t('Número de I-94 (si tiene)', 'Form I-94 number (if any)'), formRef: 'Part 2 · Item 19' },
            {
              id: 'currentStatus',
              type: 'select',
              label: t('Estatus migratorio actual', 'Current nonimmigrant status'),
              hint: t('Si entró sin inspección elija "EWI - ENTRY WITHOUT INSPECTION". Si no sabe, elija "UN - UNKNOWN".', 'If you entered without inspection, choose "EWI - ENTRY WITHOUT INSPECTION". If you do not know, choose "UN - UNKNOWN".'),
              formRef: 'Part 2 · Item 20',
              options: STATUS_OPTIONS,
            },
          ],
        },
      ],
    },
    {
      id: 'application',
      part: 'Part 3',
      title: t('La trata y su caso', 'The trafficking and your case'),
      questions: [
        {
          id: 'eligibility',
          kind: 'yesNoList',
          formRef: 'Part 3 · Items 1–4',
          question: t('Sobre la trata que sufrió', 'About the trafficking you suffered'),
          why: t('Para la visa T normalmente se contesta Sí al Ítem 1, a 2.A o 2.B, al 3 y al 4. Cada Sí se prueba con su declaración personal y otros documentos.', 'For a T visa you normally answer Yes to Item 1, to 2.A or 2.B, to 3 and to 4. Each Yes is proved with your personal statement and other documents.'),
          notice: {
            tone: 'info',
            title: t('Su declaración personal es obligatoria', 'Your personal statement is required'),
            body: t(
              'Con esta solicitud debe enviar una declaración firmada, con sus palabras, sobre la trata que sufrió. El Suplemento B (firmado por la policía u otra autoridad) no es obligatorio, pero ayuda. Si es menor de 18 o el trauma no le permite colaborar con las autoridades, puede estar exento/a de colaborar.',
              'You must send a signed statement, in your own words, about the trafficking you suffered. Supplement B (signed by the police or another authority) is not required, but it helps. If you are under 18 or trauma prevents you from cooperating with the authorities, you may be exempt.',
            ),
          },
          items: ELIGIBILITY_ITEMS,
        },
        {
          id: 'reported',
          kind: 'choice',
          formRef: 'Part 3 · Item 5',
          question: t('¿Ha denunciado la trata ante la policía u otra autoridad?', 'Have you reported the trafficking crime?'),
          why: t('Por ejemplo la policía local, el FBI, Investigaciones de Seguridad Nacional (HSI) o el Departamento de Trabajo.', 'For example the local police, the FBI, Homeland Security Investigations (HSI) or the Department of Labor.'),
          options: yesNo,
        },
        {
          id: 'report',
          kind: 'fields',
          formRef: 'Part 3 · Item 5 · Law Enforcement Agency and Office',
          showIf: is('reported', 'yes'),
          question: t('¿Ante qué agencia y oficina la denunció?', 'Which law enforcement agency and office did you report it to?'),
          fields: [
            text('report.agency', 'Nombre de la agencia y oficina', 'Law enforcement agency and office', 'Part 3 · Item 5 · Part 9', { placeholder: 'FBI Houston Field Office' }),
            ...usAddress('report', 'Part 3 · Item 5'),
            { id: 'report.phone', type: 'phone', label: t('Teléfono de la oficina', 'Daytime telephone number'), formRef: 'Part 3 · Item 5 · Daytime Telephone Number' },
            text('report.case', 'Número de caso (si tiene)', 'Case number (if any)', 'Part 3 · Item 5 · Case Number', { required: false }),
          ],
        },
        {
          id: 'notReported',
          kind: 'fields',
          formRef: 'Part 3 · Item 5 · Circumstances',
          showIf: is('reported', 'no'),
          question: t('¿Por qué no la ha denunciado?', 'Why have you not reported it?'),
          why: t('Por ejemplo: miedo a los tratantes, trauma, no sabía que podía hacerlo. Escriba en inglés si puede.', 'For example: fear of the traffickers, trauma, you did not know you could. Write in English if you can.'),
          fields: [longText('report.circumstances', 'Las circunstancias', 'Circumstances', 'Part 3 · Item 5 · Circumstances')],
        },
        { id: 'minor', kind: 'choice', formRef: 'Part 3 · Item 6', question: t('¿Tenía menos de 18 años cuando ocurrió al menos uno de los actos de trata?', 'Were you under 18 years of age at the time at least one of the acts of trafficking occurred?'), options: yesNo },
        {
          id: 'complied',
          kind: 'choice',
          formRef: 'Part 3 · Item 7',
          question: t('¿Ha colaborado con los pedidos razonables de las autoridades (o no puede por un trauma físico o psicológico)?', 'Have you complied with reasonable requests from law enforcement for assistance (or are you unable to due to physical or psychological trauma)?'),
          options: yesNo,
        },
        {
          id: 'compliedWhy',
          kind: 'fields',
          formRef: 'Part 3 · Item 7 · Part 9',
          showIf: all(is('complied', 'no'), is('minor', 'no')),
          question: t('Explique por qué no ha colaborado', 'Explain why you have not complied'),
          notice: legal('Hable con un abogado antes de contestar: la colaboración con las autoridades es un requisito, con excepciones.', 'Talk to an attorney before answering: cooperating with law enforcement is a requirement, with exceptions.'),
          fields: [longText('complied.explain', 'Las circunstancias (en inglés)', 'Circumstances', 'Part 9')],
        },
        { id: 'firstEntry', kind: 'choice', formRef: 'Part 3 · Item 8', question: t('¿Es esta la primera vez que entró a EE.UU.?', 'Is this the first time you have entered the United States?'), options: yesNo },
        {
          id: 'recentEntry',
          kind: 'fields',
          formRef: 'Part 3 · Item 8.(1)–(3)',
          showIf: is('firstEntry', 'no'),
          question: t('Su entrada más reciente', 'Your most recent entry'),
          fields: [
            date('entry.date', 'Fecha de entrada', 'Date of entry', 'Part 3 · Item 8.(1)'),
            text('entry.city', 'Ciudad de entrada', 'Place of entry: city or town', 'Part 3 · Item 8.(2) · City or Town', { placeholder: 'El Paso' }),
            { id: 'entry.state', type: 'state', required: true, label: t('Estado', 'State'), formRef: 'Part 3 · Item 8.(2) · State', placeholder: 'TX' },
            text('entry.status', 'Estatus al entrar (en inglés)', 'Status', 'Part 3 · Item 8.(3)', { placeholder: 'EWI' }),
          ],
        },
        {
          id: 'otherEntries',
          kind: 'fields',
          formRef: 'Part 3 · Item 8 · Part 9',
          showIf: is('firstEntry', 'no'),
          question: t('Sus otras entradas de los últimos 5 años', 'Your other entries in the past five years'),
          why: t('Deje en blanco si no hubo otras.', 'Leave blank if there were none.'),
          fields: [longText('otherEntries.explain', 'Fecha, lugar y estatus de cada una (en inglés)', 'Date, place of entry and status of each one', 'Part 9', false)],
        },
        { id: 'traffickingEntry', kind: 'choice', formRef: 'Part 3 · Item 9', question: t('¿Su entrada más reciente fue a causa de la trata?', 'Was your most recent entry on account of the trafficking that forms the basis for your claim?'), options: yesNo },
        {
          id: 'arrival',
          kind: 'fields',
          formRef: 'Part 3 · Items 8–9 · Part 9',
          showIf: (a) => a.firstEntry === 'no' || Boolean(a.traffickingEntry),
          question: t('¿Cómo fue su llegada más reciente a EE.UU.?', 'What were the circumstances of your most recent arrival?'),
          why: t('Breve: cómo y con quién llegó, y si los tratantes la organizaron. Los detalles van en su declaración personal.', 'Briefly: how and with whom you came, and whether the traffickers arranged it. The details go in your personal statement.'),
          fields: [longText('arrival.explain', 'Las circunstancias (en inglés)', 'Circumstances of your most recent arrival', 'Part 9')],
        },
        { id: 'ead', kind: 'choice', formRef: 'Part 3 · Item 10', question: t('¿Quiere un permiso de trabajo (EAD) cuando le aprueben la visa T?', 'Are you requesting an Employment Authorization Document (EAD) when you are granted T nonimmigrant status?'), why: t('Es gratis y no necesita otro formulario.', 'It is free and needs no other form.'), options: yesNo },
        {
          id: 'petitionFamily',
          kind: 'choice',
          formRef: 'Part 3 · Item 11',
          question: t('¿Va a pedir la visa T también para algún familiar ahora?', 'Are you now applying for one or more eligible family members?'),
          why: t('Puede incluir a su esposo/a e hijos solteros menores de 21; si usted es menor de 21, también a sus padres y hermanos solteros menores de 18.', 'You can include your spouse and unmarried children under 21; if you are under 21, also your parents and unmarried siblings under 18.'),
          notice: {
            tone: 'info',
            title: t('Suplemento A', 'Supplement A'),
            body: t('Si contesta Sí, debe llenar un Suplemento A por cada familiar. Puede llenarlo en esta app (I-914 Suplemento A), uno por familiar; también puede presentarlo después.', 'If you answer Yes, you must complete a Supplement A for each family member. You can fill it out in this app (I-914 Supplement A), one per family member; you can also file it later.'),
          },
          options: yesNo,
        },
      ],
    },
    {
      id: 'processing',
      part: 'Part 4',
      title: t('Antecedentes', 'Processing information'),
      questions: [
        {
          id: 'crimes',
          kind: 'yesNoList',
          formRef: 'Part 4 · Items 1.A–1.I',
          question: t('Antecedentes penales', 'Criminal history'),
          why: t('Cuente todo, en cualquier país, aunque el récord esté sellado o borrado, y aunque lo obligaran los tratantes.', 'Include everything, in any country, even if the record was sealed or cleared, and even if the traffickers forced you.'),
          notice: admissibility,
          items: CRIME_ITEMS,
        },
        ...rows({
          max: 2,
          id: 'arrest',
          first: anyYes(CRIME_ITEMS.slice(1)),
          question: (i) => (i === 1 ? t('Su arresto, citación, detención o acusación', 'Your arrest, citation, detention or charge') : t('Otro arresto, citación o acusación', 'Another arrest, citation or charge')),
          why: (i) => (i === 1 ? t('Adjunte los documentos de la corte o de la policía de cada caso.', 'Attach the court or police records for each one.') : undefined),
          more: t('¿Hubo otro arresto, citación, detención o acusación?', 'Was there another arrest, citation, detention or charge?'),
          formRef: 'Part 4 · Item 1 · Table',
          fields: (i) => [
            text(`arrest${i}.why`, 'Por qué (en inglés)', 'Why were you arrested, cited, detained, or charged?', `Part 4 · Item 1 · Row ${i}`, { maxLength: 60 }),
            date(`arrest${i}.date`, 'Fecha', 'Date of arrest, citation, detention, charge', `Part 4 · Item 1 · Row ${i}`),
            text(`arrest${i}.where`, 'Dónde (ciudad, estado, país)', 'Where (City or Town, State, Country)', `Part 4 · Item 1 · Row ${i}`, { maxLength: 45, placeholder: 'Houston, TX, USA' }),
            text(`arrest${i}.outcome`, 'En qué terminó (en inglés)', 'Outcome or disposition', `Part 4 · Item 1 · Row ${i}`, { maxLength: 45, placeholder: 'Charges dismissed' }),
          ],
          overflow: t('Si contesta Sí, describa los demás en la explicación de la Parte 4, que va a la Parte 9.', 'If you answer Yes, describe the others in your Part 4 explanation, which goes to Part 9.'),
        }),
        { id: 'conduct', kind: 'yesNoList', formRef: 'Part 4 · Items 2.A–2.D', question: t('Prostitución, vicios, contrabando y drogas', 'Prostitution, vice, smuggling and drugs'), why: t('Si lo obligaron los tratantes, conteste Sí y explíquelo: hay perdones para eso.', 'If the traffickers forced you, answer Yes and explain it: there are waivers for that.'), notice: admissibility, items: CONDUCT_ITEMS },
        { id: 'security', kind: 'yesNoList', formRef: 'Part 4 · Items 3–7', question: t('Seguridad y terrorismo', 'Security and terrorism'), notice: admissibility, items: SECURITY_ITEMS },
        { id: 'presence', kind: 'yesNoList', formRef: 'Part 4 · Items 8.A–8.C', question: t('¿Ha estado presente cuando hicieron daño a alguien?', 'Have you been present when someone was harmed?'), why: t('Conteste Sí también si la víctima fue usted u otra víctima de los tratantes, y explíquelo.', 'Answer Yes even if the victim was you or another trafficking victim, and explain it.'), notice: admissibility, items: PRESENCE_ITEMS },
        {
          id: 'removal',
          kind: 'yesNoList',
          formRef: 'Part 4 · Items 9.A–9.F',
          question: t('Procesos de inmigración', 'Immigration proceedings'),
          notice: legal(
            'Si tiene un caso en corte de inmigración o una orden de deportación, un abogado debe revisar su caso antes de presentar: puede pedir que la corte suspenda o cierre el caso mientras USCIS decide. Si le negaron una visa, explíquelo en la Parte 9.',
            'If you have an immigration court case or a removal order, an attorney should review your case before you file: they can ask the court to pause or close the case while USCIS decides. If a visa was denied, explain it in Part 9.',
          ),
          items: REMOVAL_ITEMS,
        },
        { id: 'violence', kind: 'yesNoList', formRef: 'Part 4 · Items 10–14', question: t('Violencia, grupos armados y armas', 'Violence, armed groups and weapons'), notice: admissibility, items: VIOLENCE_ITEMS },
        { id: 'immigrationHistory', kind: 'yesNoList', formRef: 'Part 4 · Items 15–20', question: t('Historial migratorio', 'Immigration history'), why: t('Por ejemplo: documentos falsos o fraude. Si los tratantes le dieron documentos falsos, conteste Sí y explíquelo.', 'For example: false documents or fraud. If the traffickers gave you false documents, answer Yes and explain it.'), notice: admissibility, items: IMMIGRATION_ITEMS },
        { id: 'health', kind: 'yesNoList', formRef: 'Part 4 · Items 21.A–21.C', question: t('Salud', 'Health'), notice: admissibility, items: HEALTH_ITEMS },
        {
          id: 'processingExplain',
          kind: 'fields',
          formRef: 'Part 4 · Part 9',
          showIf: anyYes(PROCESSING_ITEMS),
          question: t('Explique cada Sí', 'Explain each Yes'),
          notice: legal(
            'Explique con calma y con fechas, y diga si pasó por causa de la trata. Un abogado o representante acreditado puede decirle si necesita el Formulario I-192 (perdón) y cómo explicarlo.',
            'Explain calmly and with dates, and say whether it happened because of the trafficking. An attorney or accredited representative can tell you whether you need Form I-192 (waiver) and how to explain it.',
          ),
          fields: [longText('processing.explain', 'Para cada Sí: el número del ítem, dónde, cuándo, qué pasó y si tuvo que ver con la trata (en inglés)', 'For each Yes: item number, where, when, what happened and whether it was related to the trafficking', 'Part 9')],
        },
      ],
    },
    {
      id: 'family',
      part: 'Part 5',
      title: t('Su esposo/a e hijos', 'Your spouse and children'),
      questions: [
        {
          id: 'hasSpouse',
          kind: 'choice',
          formRef: 'Part 5 · Item 1 · Information About Your Spouse',
          question: t('¿Tiene esposo/a?', 'Do you have a spouse?'),
          why: t('Póngalo aunque no lo incluya en su solicitud.', 'List them even if you are not including them in your application.'),
          options: yesNo,
        },
        {
          id: 'spouse',
          kind: 'fields',
          formRef: 'Part 5 · Item 1',
          showIf: is('hasSpouse', 'yes'),
          question: t('Su esposo/a', 'Your spouse'),
          fields: [
            ...nameFields('spouse', 'Part 5 · Item 1.A'),
            date('spouse.dob', 'Fecha de nacimiento', 'Date of birth', 'Part 5 · Item 1.B'),
            text('spouse.birthCountry', 'País de nacimiento', 'Country of birth', 'Part 5 · Item 1.C'),
            text('spouse.city', 'Ciudad donde vive ahora', 'City or town of residence', 'Part 5 · Item 1.D'),
            text('spouse.country', 'País donde vive ahora', 'Country of residence', 'Part 5 · Item 1.D'),
          ],
        },
        { id: 'child.more0', kind: 'choice', formRef: 'Part 5 · Item 2 · Information About Your Children', question: t('¿Tiene hijos?', 'Do you have children?'), why: t('Póngalos a todos, vivan donde vivan y de cualquier edad.', 'List them all, wherever they live and whatever their age.'), options: yesNo },
        ...rows({
          max: 3,
          id: 'child',
          first: is('child.more0', 'yes'),
          question: (i) => (i === 1 ? t('Su hijo/a', 'Your child') : t('Otro hijo/a', 'Another child')),
          more: t('¿Tiene otro hijo/a?', 'Do you have another child?'),
          formRef: 'Part 5 · Item 2',
          fields: (i) => {
            const ref = `Part 5 · Item 2.${'ABC'[i - 1]}`;
            return [
              ...nameFields(`child${i}`, ref),
              date(`child${i}.dob`, 'Fecha de nacimiento', 'Date of birth', ref),
              text(`child${i}.birthCountry`, 'País de nacimiento', 'Country of birth', ref),
              text(`child${i}.city`, 'Ciudad donde vive ahora', 'Current location: city or town', ref),
              { id: `child${i}.state`, type: 'state', label: t('Estado (si es en EE.UU.)', 'State (if in the U.S.)'), formRef: ref },
              text(`child${i}.country`, 'País donde vive ahora', 'Current location: country', ref),
            ];
          },
          overflow: t('Si son más de 3, escríbalos a mano en la Parte 9.', 'If there are more than 3, write them by hand in Part 9.'),
        }),
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
          formRef: 'Part 6 · Item 1 · Applicant’s Statement Regarding the Interpreter',
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leerá', 'No, an interpreter will read it to me') },
          ],
        },
        { id: 'interpreterLanguage', kind: 'fields', formRef: 'Part 6 · Item 1.B', showIf: is('readsEnglish', 'B'), question: t('¿En qué idioma se lo leerán?', 'What language will it be read in?'), fields: [text('fluentLanguage', 'Idioma', 'Language', 'Part 6 · Item 1.B', { placeholder: 'Spanish' })] },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 6 · Item 2',
          question: t('¿Alguien más (no usted) preparó esta solicitud?', 'Did someone else prepare this application for you?'),
          why: t('Si es así, esa persona también debe llenar y firmar la Parte 8 a mano.', 'If so, that person must also complete and sign Part 8 by hand.'),
          options: yesNo,
        },
        { id: 'preparerName', kind: 'fields', formRef: 'Part 6 · Item 2', showIf: is('preparer', 'yes'), question: t('¿Quién la preparó?', 'Who prepared it?'), fields: [text('preparer.name', 'Nombre del preparador', 'Preparer’s name', 'Part 6 · Item 2')] },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 6 · Items 3–5 · Applicant’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS de forma segura?', 'How can USCIS safely contact you?'),
          why: t('Dé solo números y correos que los tratantes no puedan ver. El teléfono seguro puede ser el de su abogado o una organización.', 'Give only phone numbers and emails the traffickers cannot see. The safe phone can be your attorney’s or an organization’s.'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: t('Teléfono de día', 'Daytime phone'), formRef: 'Part 6 · Item 3', placeholder: '213 555 0123' },
            { id: 'safePhone', type: 'phone', label: t('Teléfono seguro de día', 'Safe daytime phone'), formRef: 'Part 6 · Item 4' },
            { id: 'email', type: 'email', label: t('Correo electrónico', 'Email'), formRef: 'Part 6 · Item 5' },
          ],
        },
      ],
    },
    assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 7', preparerPart: 'Part 8' }),
  ],
};
