import type { Answers, Field, FormDefinition, Question, YesNoItem } from './types';
import type { T } from '../i18n';
import { all, anyAddress, date, is, nameFields, rows, sexField, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';

// Questions follow USCIS Form I-918, Petition for U Nonimmigrant Status, edition 01/20/25.
// The PDF mapping lives in src/pdf/i918Pdf.ts.
//
// Supplement A (the petition for each qualifying family member) is its own form in Camino
// (src/forms/i918supa.ts). Out of scope: Supplement B (the law enforcement certification, signed by
// a police officer, prosecutor, judge or other certifying official), a separate form; the intro and next steps explain them. Every signature and
// date, and the attorney box on page 1, are left blank to be completed by hand. Parts 6 and 7
// (interpreter and preparer) are filled from the shared assistance section.

export const I918_EDITION = '01/20/25';

const t = (es: string, en: string): T => ({ es, en });

const text = (id: string, es: string, en: string, formRef: string, opts: Partial<Field> = {}): Field => ({ id, type: 'text', required: true, label: { es, en }, formRef, ...opts });

/** Whether a "select all that apply" answer includes a value. */
const has =
  (id: string, value: string) =>
  (a: Answers): boolean => {
    const v = a[id];
    return Array.isArray(v) && v.includes(value);
  };

/** Part 1's addresses hold 25 characters of street on this form. */
const address = (prefix: string, ref: string, careOf = false): Field[] =>
  anyAddress(prefix, ref, { careOf }).map((f) => (f.id === `${prefix}.street` ? { ...f, maxLength: 25 } : f));

const yn = (id: string, item: string, es: string, en: string): YesNoItem => ({ id, formRef: `Part 3 · Item ${item}`, label: t(es, en) });

/** Part 2, Items 1-6. */
export const ELIGIBILITY_ITEMS: YesNoItem[] = [
  { id: 'p2.1', formRef: 'Part 2 · Item 1', label: t('Soy víctima de un delito de la lista de la visa U (por ejemplo violencia doméstica, agresión sexual, secuestro, trata, chantaje, agresión grave).', 'I am a victim of criminal activity listed in INA section 101(a)(15)(U)(iii).') },
  { id: 'p2.2', formRef: 'Part 2 · Item 2', label: t('Sufrí un daño físico o emocional serio por ese delito.', 'I have suffered substantial physical or mental abuse as a result of having been a victim of this criminal activity.') },
  { id: 'p2.3', formRef: 'Part 2 · Item 3', label: t('Tengo información sobre el delito.', 'I possess information concerning the criminal activity of which I was a victim.') },
  { id: 'p2.4', formRef: 'Part 2 · Item 4', label: t('Envío el Suplemento B firmado por la policía, la fiscalía u otra autoridad.', 'I am submitting Form I-918, Supplement B, U Nonimmigrant Status Certification, from a certifying official.') },
  { id: 'p2.5', formRef: 'Part 2 · Item 5', label: t('El delito ocurrió en EE.UU. (incluye territorio indígena y bases militares) o violó leyes de EE.UU.', 'The crime of which I am a victim occurred in the United States (including Indian country and military installations) or violated the laws of the United States.') },
  { id: 'p2.6', formRef: 'Part 2 · Item 6', label: t('Tengo menos de 16 años.', 'I am under 16 years of age.') },
];

/** Part 2, Items 7.b-7.f, by the letter of each item. */
export const PROCEEDINGS: { value: string; label: T; en: string }[] = [
  { value: 'b', label: t('Deportación (removal)', 'Removal proceedings'), en: 'Removal' },
  { value: 'c', label: t('Exclusión', 'Exclusion proceedings'), en: 'Exclusion' },
  { value: 'd', label: t('Deportación (antes de 1997, "deportation")', 'Deportation proceedings'), en: 'Deportation' },
  { value: 'e', label: t('Rescisión (le quitaron la residencia)', 'Rescission proceedings'), en: 'Rescission' },
  { value: 'f', label: t('Proceso judicial', 'Judicial proceedings'), en: 'Judicial' },
];

/** Part 3, Items 1.a-1.i. */
export const CRIME_ITEMS: YesNoItem[] = [
  yn('p3.1a', '1.a', '¿Alguna vez cometió un delito por el que no lo arrestaron?', 'Have you EVER committed a crime or offense for which you have not been arrested?'),
  yn('p3.1b', '1.b', '¿Alguna vez lo arrestó, citó o detuvo la policía, inmigración o militares, por cualquier razón?', 'Have you EVER been arrested, cited, or detained by any law enforcement officer (including DHS, INS, and military officers) for any reason?'),
  yn('p3.1c', '1.c', '¿Alguna vez lo acusaron de un delito?', 'Have you EVER been charged with committing any crime or offense?'),
  yn('p3.1d', '1.d', '¿Alguna vez lo condenaron por un delito (aunque después lo borraran o perdonaran)?', 'Have you EVER been convicted of a crime or offense (even if the violation was subsequently expunged or pardoned)?'),
  yn('p3.1e', '1.e', '¿Alguna vez lo pusieron en un programa alternativo o de rehabilitación (diversion, deferred prosecution, deferred adjudication)?', 'Have you EVER been placed in an alternative sentencing or a rehabilitative program (for example, diversion, deferred prosecution, withheld adjudication, deferred adjudication)?'),
  yn('p3.1f', '1.f', '¿Alguna vez recibió una sentencia suspendida, libertad condicional (probation) o parole?', 'Have you EVER received a suspended sentence, been placed on probation, or been paroled?'),
  yn('p3.1g', '1.g', '¿Alguna vez estuvo en la cárcel o en prisión?', 'Have you EVER been in jail or prison?'),
  yn('p3.1h', '1.h', '¿Alguna vez recibió un perdón, amnistía u otra clemencia?', 'Have you EVER been the beneficiary of a pardon, amnesty, rehabilitation, or other act of clemency or similar action?'),
  yn('p3.1i', '1.i', '¿Alguna vez usó inmunidad diplomática para evitar un juicio en EE.UU.?', 'Have you EVER exercised diplomatic immunity to avoid prosecution for a criminal offense in the United States?'),
];

/** Part 3, Items 4-9. */
export const SECURITY_ITEMS: YesNoItem[] = [
  yn('p3.4a', '4.a', '¿Ha practicado o piensa practicar la prostitución, o conseguir clientes para ella?', 'Have you EVER engaged in, or do you intend to engage in, prostitution or procurement of prostitution?'),
  yn('p3.4b', '4.b', '¿Ha participado en vicios comerciales ilegales, como apuestas ilegales?', 'Have you EVER engaged in any unlawful commercialized vice, including illegal gambling?'),
  yn('p3.4c', '4.c', '¿Ha ayudado a sabiendas a alguien a entrar ilegalmente a EE.UU.?', 'Have you EVER knowingly encouraged, induced, assisted, abetted, or aided any alien to try to enter the United States illegally?'),
  yn('p3.4d', '4.d', '¿Ha traficado drogas o ayudado a traficarlas?', 'Have you EVER illicitly trafficked in any controlled substance or knowingly assisted, abetted, or colluded in the illicit trafficking of any controlled substance?'),
  yn('p3.5a', '5.a', '¿Ha cometido, planeado o ayudado a secuestrar o sabotear un avión, barco o vehículo?', 'Have you EVER committed, planned, or participated in hijacking or sabotage of any conveyance (including an aircraft, vessel, or vehicle)?'),
  yn('p3.5b', '5.b', '¿…a tomar rehenes para obligar a otros a hacer algo?', '…seizing or detaining, and threatening to kill, injure, or continue to detain, another individual in order to compel a third person to do or abstain from doing any act?'),
  yn('p3.5c', '5.c', '¿…un asesinato político (magnicidio)?', '…assassination?'),
  yn('p3.5d', '5.d', '¿…usar un arma de fuego para poner en peligro a personas o causar daños graves?', '…the use of any firearm with intent to endanger the safety of one or more individuals or to cause substantial damage to property?'),
  yn('p3.5e', '5.e', '¿…usar explosivos, armas químicas, biológicas o nucleares u otras armas peligrosas?', '…the use of any biological agent, chemical agent, nuclear weapon or device, explosive, or other weapon or dangerous device, with intent to endanger the safety of individuals or to cause substantial damage to property?'),
  yn('p3.6a', '6.a', '¿Ha sido miembro, apoyado o estado asociado con una organización terrorista designada?', 'Have you EVER been a member of, solicited money or members for, provided support for, attended military training by or on behalf of, or been associated with a terrorist organization under section 219 of the INA?'),
  yn('p3.6b', '6.b', '¿…con un grupo que ha secuestrado o saboteado aviones, barcos o vehículos?', '…a group that has engaged in hijacking or sabotage of any conveyance?'),
  yn('p3.6c', '6.c', '¿…con un grupo que ha tomado rehenes?', '…a group that has engaged in seizing or detaining, and threatening to kill, injure, or continue to detain, another individual to compel a third person?'),
  yn('p3.6d', '6.d', '¿…con un grupo que ha cometido asesinatos políticos?', '…a group that has engaged in assassination?'),
  yn('p3.6e', '6.e', '¿…con un grupo que ha usado armas de fuego para poner en peligro a personas?', '…a group that has engaged in the use of any firearm with intent to endanger individuals or cause substantial damage to property?'),
  yn('p3.6f', '6.f', '¿…con un grupo que ha usado explosivos u otras armas peligrosas?', '…a group that has engaged in the use of any biological agent, chemical agent, nuclear weapon or device, explosive, or other dangerous device?'),
  yn('p3.6g', '6.g', '¿…con un grupo que pide dinero o miembros o da apoyo a una organización terrorista?', '…soliciting money or members or otherwise providing material support to a terrorist organization?'),
  yn('p3.7a', '7.a', '¿Piensa hacer espionaje en EE.UU.?', 'Do you intend to engage in the United States in espionage?'),
  yn('p3.7b', '7.b', '¿Piensa hacer actividades ilegales o para derrocar al gobierno de EE.UU.?', 'Do you intend to engage in the United States in any unlawful activity, or any activity the purpose of which is in opposition to, or the control, or overthrow of the government of the United States?'),
  yn('p3.7c', '7.c', '¿Piensa hacer actividades de espionaje, sabotaje o exportación ilegal de tecnología o información?', 'Do you intend to engage in the United States solely, principally, or incidentally in any activity related to espionage or sabotage or to violate any law involving the export of goods, technology, or sensitive information?'),
  yn('p3.8', '8', '¿Ha sido miembro del Partido Comunista u otro partido totalitario (salvo que fuera obligado)?', 'Have you EVER been or do you continue to be a member of the Communist or other totalitarian party, except when membership was involuntary?'),
  yn('p3.9', '9', '¿Participó en persecuciones con el gobierno nazi de Alemania entre 1933 y 1945?', 'Have you EVER, during the period of March 23, 1933 to May 8, 1945, in association with the Nazi Government of Germany or any allied organization or government, ordered, incited, assisted or otherwise participated in the persecution of any person?'),
];

/** Part 3, Items 10-15. */
export const VIOLENCE_ITEMS: YesNoItem[] = [
  yn('p3.10a', '10.a', '¿Ha ordenado, cometido o ayudado en actos de tortura o genocidio?', 'Have you EVER ordered, incited, called for, committed, assisted, helped with, or otherwise participated in acts involving torture or genocide?'),
  yn('p3.10b', '10.b', '¿…en matar a alguien?', '…killing any person?'),
  yn('p3.10c', '10.c', '¿…en herir gravemente a alguien a propósito?', '…intentionally and severely injuring any person?'),
  yn('p3.10d', '10.d', '¿…en contacto sexual con alguien obligado o amenazado?', '…engaging in any kind of sexual conduct or relations with any person who was being forced or threatened?'),
  yn('p3.10e', '10.e', '¿…en impedir a alguien practicar su religión?', '…limiting or denying any person’s ability to exercise religious beliefs?'),
  yn('p3.10f', '10.f', '¿…en perseguir a alguien por su raza, religión, nacionalidad, grupo social u opinión política?', '…the persecution of any person because of race, religion, national origin, membership in a particular social group, or political opinion?'),
  yn('p3.10g', '10.g', '¿…en sacar a alguien de su casa por la fuerza o con amenazas?', '…displacing or moving any person from their residence by force, threat of force, compulsion, or duress?'),
  yn('p3.11', '11', '¿Ha animado o pedido a otra persona que haga alguno de esos actos?', 'Have you EVER advocated that another person commit any of the acts described in the preceding question, urged, or encouraged another person to commit such acts?'),
  yn('p3.12a', '12.a', '¿Ha estado presente cuando mataron, torturaron, golpearon o hirieron a alguien a propósito?', 'Have you EVER been present or nearby when any person was intentionally killed, tortured, beaten, or injured?'),
  yn('p3.12b', '12.b', '¿…cuando sacaron a alguien de su casa por la fuerza?', '…displaced or moved from his or her residence by force, compulsion, or duress?'),
  yn('p3.12c', '12.c', '¿…cuando obligaron a alguien a tener contacto sexual?', '…in any way compelled or forced to engage in any kind of sexual contact or relations?'),
  yn('p3.13a', '13.a', '¿Ha servido o participado en una unidad militar, paramilitar, policial, de autodefensa, guerrilla, milicia o grupo rebelde?', 'Have you EVER served in, been a member of, assisted in, or participated in any military unit, paramilitary unit, police unit, self-defense unit, vigilante unit, rebel group, guerilla group, militia, or other insurgent organization?'),
  yn('p3.13b', '13.b', '¿Ha trabajado en una prisión, cárcel, centro de detención o campo de trabajo?', 'Have you EVER served in any prison, jail, prison camp, detention facility, labor camp, or any other situation that involved detaining persons?'),
  yn('p3.13c', '13.c', '¿Ha pertenecido a un grupo en el que usted u otros tenían o usaban armas?', 'Have you EVER served in, been a member of, assisted in, or participated in any group, unit, or organization in which you or other persons transported, possessed, or used any type of weapon?'),
  yn('p3.14a', '14.a', '¿Ha recibido entrenamiento militar, paramilitar o con armas?', 'Have you EVER received any type of military, paramilitary, or weapons training?'),
  yn('p3.14b', '14.b', '¿Ha pertenecido a un grupo que usó o amenazó con armas contra alguien?', 'Have you EVER been a member of, assisted in, or participated in any group, unit, or organization in which you or other persons used any type of weapon against any person or threatened to do so?'),
  yn('p3.14c', '14.c', '¿Ha vendido, dado o transportado armas a alguien que las usó contra otra persona?', 'Have you EVER assisted or participated in selling or providing weapons, or in transporting weapons, to any person who to your knowledge used them against another person?'),
  yn('p3.15a', '15.a', '¿Ha reclutado o usado a menores de 15 años en un grupo armado?', 'Have you EVER recruited, enlisted, conscripted, or used any person under 15 years of age to serve in or help an armed force or group?'),
  yn('p3.15b', '15.b', '¿Ha usado a menores de 15 años en combates?', 'Have you EVER used any person under 15 years of age to take part in hostilities, or to help or provide services to people in combat?'),
];

/** Part 3, Items 16-29. */
export const IMMIGRATION_ITEMS: YesNoItem[] = [
  yn('p3.16', '16', '¿Está AHORA en un proceso de deportación, exclusión o rescisión?', 'Are you NOW in removal, exclusion, rescission, or deportation proceedings?'),
  yn('p3.17', '17', '¿Alguna vez le abrieron un proceso de deportación, exclusión o rescisión?', 'Have you EVER had removal, exclusion, rescission, or deportation proceedings initiated against you?'),
  yn('p3.18', '18', '¿Alguna vez lo deportaron o excluyeron de EE.UU.?', 'Have you EVER been removed, excluded, or deported from the United States?'),
  yn('p3.19', '19', '¿Alguna vez le dieron una orden de deportación o exclusión?', 'Have you EVER been ordered to be removed, excluded, or deported from the United States?'),
  yn('p3.20', '20', '¿Alguna vez le negaron una visa o la entrada a EE.UU.?', 'Have you EVER been denied a visa or denied admission to the United States?'),
  yn('p3.21', '21', '¿Alguna vez le dieron salida voluntaria y no salió a tiempo?', 'Have you EVER been granted voluntary departure by an immigration officer or an immigration judge and failed to depart within the allotted time?'),
  yn('p3.22', '22', '¿Tiene AHORA una orden o multa por usar documentos falsos (sección 274C)?', 'Are you NOW under a final order or civil penalty for violating section 274C of the INA (producing and/or using false documentation)?'),
  yn('p3.23', '23', '¿Alguna vez usó fraude o mentiras para conseguir una visa, entrada o beneficio migratorio?', 'Have you EVER, by fraud or willful misrepresentation of a material fact, sought to procure or procured a visa or other documentation, for entry into the United States or any immigration benefit?'),
  yn('p3.24', '24', '¿Alguna vez salió de EE.UU. para evitar el servicio militar?', 'Have you EVER left the United States to avoid being drafted into the U.S. Armed Forces or U.S. Coast Guard?'),
  yn('p3.25', '25', '¿Fue visitante de intercambio J con el requisito de 2 años en su país sin cumplirlo ni tener perdón?', 'Have you EVER been a J nonimmigrant exchange visitor who was subject to the 2-year foreign residence requirement and not yet complied with that requirement or obtained a waiver?'),
  yn('p3.26', '26', '¿Alguna vez retuvo fuera de EE.UU. a un niño ciudadano cuya custodia tenía un ciudadano de EE.UU.?', 'Have you EVER detained, retained, or withheld the custody of a child, having a lawful claim to United States citizenship, outside the United States from a United States citizen granted custody?'),
  yn('p3.27', '27', '¿Piensa practicar la poligamia en EE.UU.?', 'Do you plan to practice polygamy in the United States?'),
  yn('p3.28', '28', '¿Alguna vez entró a EE.UU. como polizón (escondido en un barco o avión)?', 'Have you EVER entered the United States as a stowaway?'),
  yn('p3.29a', '29.a', '¿Tiene AHORA una enfermedad contagiosa de importancia para la salud pública?', 'Do you NOW have a communicable disease of public health significance?'),
  yn('p3.29b', '29.b', '¿Tiene o ha tenido un trastorno físico o mental con conductas que pongan en peligro a usted u otros?', 'Do you NOW have or have you EVER had a physical or mental disorder and behavior associated with the disorder which has posed or may pose a threat to the property, safety, or welfare of yourself or others?'),
  yn('p3.29c', '29.c', '¿Es o ha sido adicto/a o abusador/a de drogas?', 'Are you NOW or have you EVER been a drug abuser or drug addict?'),
];

export const PROCESSING_ITEMS = [...CRIME_ITEMS, ...SECURITY_ITEMS, ...VIOLENCE_ITEMS, ...IMMIGRATION_ITEMS];

const anyYes = (items: YesNoItem[]) => (a: Answers) => items.some((i) => a[i.id] === 'yes');
const outside = is('outsideUS', 'yes');
const office = all(outside, is('notify', 'Consulate', 'Pre-Flight', 'Port of Entry'));

const legal = (es: string, en: string) => ({ tone: 'legal' as const, title: t('Hable con un abogado', 'Talk to an attorney'), body: t(es, en) });

const admissibility = legal(
  'Diga siempre la verdad, aunque su récord esté sellado o borrado, o alguien le haya dicho que ya no existe. Un Sí no significa que le nieguen la visa U: muchas faltas se pueden perdonar con el Formulario I-192, que se presenta junto con este. Antes de contestar, hable con un abogado o un representante acreditado.',
  'Always tell the truth, even if your record was sealed or cleared, or someone told you it no longer exists. A Yes does not mean your U visa will be denied: many grounds can be waived with Form I-192, filed together with this petition. Talk to an attorney or accredited representative before answering.',
);

export const i918: FormDefinition = {
  id: 'i-918',
  number: 'I-918',
  edition: I918_EDITION,
  title: t('Petición de visa U (víctimas de delitos)', 'Petition for U Nonimmigrant Status'),
  summary: {
    es: 'Pida la visa U si fue víctima de un delito grave en EE.UU., sufrió daño por él y ayudó a la policía o a la fiscalía.',
    en: 'Ask for U nonimmigrant status if you were the victim of a qualifying crime in the U.S., were harmed by it and helped the police or prosecutors.',
  },
  intro: {
    es: 'La visa U protege a víctimas de ciertos delitos (violencia doméstica, agresión sexual, trata, secuestro, chantaje y otros) que ayudaron o están dispuestas a ayudar a las autoridades. Aquí se llena la petición principal (I-918) para usted. Además necesita el Suplemento B, una certificación que firma la policía, la fiscalía, un juez u otra autoridad que investigó el delito: es obligatorio, no lo puede llenar usted y debe pedirlo a esa agencia. Para incluir a su familia se usa el Suplemento A, que también puede llenar en esta app. Su caso es confidencial: la ley prohíbe que USCIS comparta su información con la persona que le hizo daño. Es un caso legal delicado: le recomendamos que lo revise un abogado o un representante acreditado (muchas organizaciones ayudan gratis a víctimas).',
    en: 'The U visa protects victims of certain crimes (domestic violence, sexual assault, trafficking, kidnapping, extortion and others) who helped or are willing to help the authorities. This app completes the main petition (Form I-918) for you. You also need Supplement B, a certification signed by the police, prosecutor, judge or other authority that investigated the crime: it is required, you cannot fill it out yourself, and you must request it from that agency. Family members are added with Supplement A, which you can also fill out in this app. Your case is confidential: the law forbids USCIS from sharing your information with the person who harmed you. It is a sensitive legal case: we recommend an attorney or accredited representative review it (many organizations help victims for free).',
  },
  minutes: 50,
  pdf: {
    path: 'forms/i-918.pdf',
    fileName: 'I-918-filled.pdf',
    load: () => import('../pdf/i918Pdf').then((m) => m.fillI918),
    signHere: { es: 'Parte 5, Ítem 6.a', en: 'Part 5, Item 6.a' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-918 que la edición {edition} sigue vigente. Presentar el I-918 no cuesta nada.',
      'Pida el Suplemento B (Formulario I-918, Supplement B) a la policía, fiscalía, juez u otra agencia que investigó el delito. Es obligatorio: una autoridad debe firmarlo en los 6 meses antes de que usted presente, y usted envía el original firmado.',
      'Escriba su declaración personal: qué pasó, cómo le afectó y cómo ayudó a las autoridades. Adjunte también pruebas del delito y del daño (reportes de policía, órdenes de protección, cartas médicas o de terapia, fotos) y una copia de su pasaporte o acta de nacimiento.',
      'Si contestó Sí a alguna pregunta de la Parte 3 o entró sin permiso, presente también el Formulario I-192 (perdón de inadmisibilidad). Si quiere incluir a su esposo/a, hijos o (si es menor de 21) padres y hermanos, llene un Suplemento A por cada uno.',
      'Imprima el PDF y firme la Parte 5, Ítem 6.a, a mano con tinta negra. Si un intérprete o preparador le ayudó, sus datos ya están en las Partes 6 y 7; ellos las revisan y las firman y fechan a mano. Si alguna explicación de la Parte 8 no cabe, siga en una hoja aparte con su nombre, A-Number, firma y fecha.',
      'Envíe todo a la dirección de USCIS indicada en uscis.gov/i-918 (la oficina que atiende casos de víctimas). Si teme que alguien vea su correo, use una dirección segura. Hable con un abogado o representante acreditado antes de enviar.',
    ],
    en: [
      'Check at uscis.gov/i-918 that edition {edition} is still current. There is no fee to file Form I-918.',
      'Request Supplement B (Form I-918, Supplement B) from the police, prosecutor, judge or other agency that investigated the crime. It is required: a certifying official must sign it within the 6 months before you file, and you send the signed original.',
      'Write your personal statement: what happened, how it affected you and how you helped the authorities. Also attach evidence of the crime and the harm (police reports, protective orders, medical or counseling letters, photos) and a copy of your passport or birth certificate.',
      'If you answered Yes to any Part 3 question or entered without permission, also file Form I-192 (waiver of inadmissibility). To include your spouse, children or (if you are under 21) parents and siblings, complete a Supplement A for each one.',
      'Print the PDF and sign Part 5, Item 6.a, by hand in black ink. If an interpreter or preparer helped you, their details are already in Parts 6 and 7; they review them and sign and date by hand. If an explanation in Part 8 does not fit, continue on a separate sheet with your name, A-Number, signature and date.',
      'Mail everything to the USCIS address listed at uscis.gov/i-918 (the office that handles victim cases). If you fear someone may see your mail, use a safe address. Talk to an attorney or accredited representative before mailing.',
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
          formRef: 'Part 1 · Items 1.a–1.c · Information About You',
          question: t('¿Cuál es su nombre completo?', 'What is your full name?'),
          notice: legal(
            'La visa U es un caso legal: le recomendamos un abogado o un representante acreditado (muchas organizaciones de apoyo a víctimas ayudan gratis). Su información es confidencial: la ley prohíbe que USCIS la comparta con quien le hizo daño, y no la usan para buscarle.',
            'The U visa is a legal case: we recommend an attorney or accredited representative (many victim service organizations help for free). Your information is confidential: the law forbids USCIS from sharing it with the person who harmed you.',
          ),
          fields: nameFields('name', 'Part 1 · Item 1'),
        },
        { id: 'otherName.more0', kind: 'choice', formRef: 'Part 1 · Item 2 · Other Names Used', question: t('¿Ha usado otros nombres (de soltera, apodos, alias)?', 'Have you used other names (maiden name, nicknames, aliases)?'), options: yesNo },
        ...rows({
          max: 2,
          id: 'otherName',
          first: is('otherName.more0', 'yes'),
          question: (i) => (i === 1 ? t('Otro nombre que ha usado', 'Another name you have used') : t('Otro nombre más', 'One more name')),
          more: t('¿Ha usado otro nombre más?', 'Have you used another name?'),
          formRef: 'Part 1 · Item 2',
          fields: (i) => nameFields(`otherName${i}`, i === 1 ? 'Part 1 · Item 2' : 'Part 8'),
          overflow: t('El segundo nombre va en la Parte 8. Si son más, escríbalos a mano en la Parte 8.', 'The second name goes in Part 8. If there are more, write them by hand in Part 8.'),
        }),
        {
          id: 'home',
          kind: 'fields',
          formRef: 'Part 1 · Item 3 · Home Address',
          question: t('¿Dónde vive?', 'What is your home address?'),
          why: t('Puede ser en EE.UU. o en otro país.', 'It can be in the U.S. or abroad.'),
          fields: address('home', 'Part 1 · Item 3'),
        },
        {
          id: 'mailingSame',
          kind: 'choice',
          formRef: 'Part 1 · Item 4 · Safe Mailing Address',
          question: t('¿Puede recibir correo de USCIS de forma segura en esa dirección?', 'Can you safely receive mail from USCIS at that address?'),
          why: t('Si la persona que le hizo daño vive con usted o puede ver su correo, conteste No y dé una dirección segura (de un familiar, una organización o su abogado).', 'If the person who harmed you lives with you or can see your mail, answer No and give a safe address (a relative, an organization or your attorney).'),
          options: yesNo,
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 1 · Item 4 · Safe Mailing Address',
          showIf: is('mailingSame', 'no'),
          question: t('¿A qué dirección segura le enviamos el correo?', 'What safe mailing address should USCIS use?'),
          fields: address('mailing', 'Part 1 · Item 4', true).map((f) => (f.id === 'mailing.city' ? { ...f, maxLength: 40 } : f)),
        },
        {
          id: 'ids',
          kind: 'fields',
          formRef: 'Part 1 · Items 5–8 · Other Information',
          question: t('Sus números', 'Your numbers'),
          fields: [
            { id: 'aNumber', type: 'aNumber', label: t('A-Number (si tiene)', 'A-Number (if any)'), formRef: 'Part 1 · Item 5' },
            { id: 'ssn', type: 'ssn', label: t('Número de Seguro Social (si tiene)', 'U.S. Social Security number (if any)'), formRef: 'Part 1 · Item 6' },
            { id: 'uscisAccount', type: 'uscisAccount', label: t('Cuenta en línea de USCIS (si tiene)', 'USCIS online account number (if any)'), formRef: 'Part 1 · Item 7' },
          ],
        },
        {
          id: 'marital',
          kind: 'choice',
          formRef: 'Part 1 · Item 8 · Marital Status',
          question: t('¿Cuál es su estado civil?', 'What is your marital status?'),
          options: [
            { value: 'Single', label: t('Soltero/a', 'Single') },
            { value: 'Married', label: t('Casado/a', 'Married') },
            { value: 'Divorced', label: t('Divorciado/a', 'Divorced') },
            { value: 'Widowed', label: t('Viudo/a', 'Widowed') },
          ],
        },
        {
          id: 'personal',
          kind: 'fields',
          formRef: 'Part 1 · Items 9–12',
          question: t('Datos personales', 'Personal details'),
          fields: [
            sexField('sex', 'Part 1 · Item 9'),
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 10'),
            text('birthCountry', 'País de nacimiento', 'Country of birth', 'Part 1 · Item 11'),
            text('citizenship', 'País de ciudadanía o nacionalidad', 'Country of citizenship or nationality', 'Part 1 · Item 12'),
          ],
        },
        {
          id: 'documents',
          kind: 'fields',
          formRef: 'Part 1 · Items 13–18',
          question: t('Sus documentos de viaje', 'Your travel documents'),
          why: t('Deje en blanco lo que no tenga. El I-94 es el registro de entrada; si entró sin inspección, no tiene uno.', 'Leave blank what you do not have. The I-94 is your arrival record; if you entered without inspection, you do not have one.'),
          fields: [
            { id: 'i94', type: 'i94', label: t('Número de I-94 (si tiene)', 'Form I-94 number (if any)'), formRef: 'Part 1 · Item 13' },
            text('passport', 'Número de pasaporte', 'Passport number', 'Part 1 · Item 14', { required: false }),
            text('travelDoc', 'Número de documento de viaje (si no es pasaporte)', 'Travel document number', 'Part 1 · Item 15', { required: false }),
            text('passportCountry', 'País que lo emitió', 'Country of issuance', 'Part 1 · Item 16', { required: false }),
            date('passportIssued', 'Fecha de emisión', 'Date of issuance', 'Part 1 · Item 17', false),
            date('passportExpires', 'Fecha de vencimiento', 'Expiration date', 'Part 1 · Item 18', false, 'date'),
          ],
        },
        {
          id: 'lastEntry',
          kind: 'fields',
          formRef: 'Part 1 · Items 19–22 · Place and Date of Last Entry',
          question: t('Su última entrada a EE.UU. y su estatus actual', 'Your last entry into the U.S. and current status'),
          why: t('Si entró sin inspección, ponga el lugar aproximado y como estatus "EWI" (entered without inspection). Si nunca ha estado en EE.UU., deje en blanco la entrada.', 'If you entered without inspection, give the approximate place and "EWI" as status. If you have never been in the U.S., leave the entry blank.'),
          fields: [
            text('lastEntry.city', 'Ciudad de entrada', 'City or town of entry', 'Part 1 · Item 19.a', { required: false, placeholder: 'San Ysidro' }),
            { id: 'lastEntry.state', type: 'state', label: t('Estado', 'State'), formRef: 'Part 1 · Item 19.b', placeholder: 'CA' },
            date('lastEntry.date', 'Fecha de la última entrada', 'Date of last entry', 'Part 1 · Item 20', false),
            text('stayExpired', 'Fecha en que venció su permiso de estadía (MM/DD/AAAA, o "EWI" o "D/S")', 'Date authorized stay expired (or EWI, D/S)', 'Part 1 · Item 21', { required: false }),
            text('currentStatus', 'Estatus migratorio actual (en inglés)', 'Current immigration status', 'Part 1 · Item 22', { placeholder: 'No status' }),
          ],
        },
      ],
    },
    {
      id: 'crime',
      part: 'Part 2',
      title: t('El delito y su caso', 'The crime and your case'),
      questions: [
        {
          id: 'eligibility',
          kind: 'yesNoList',
          formRef: 'Part 2 · Items 1–6',
          question: t('Sobre el delito del que fue víctima', 'About the crime you were a victim of'),
          why: t('Para la visa U normalmente se contesta Sí a los Ítems 1 a 5. Cada Sí se prueba con su declaración personal, el Suplemento B y otros documentos.', 'For a U visa you normally answer Yes to Items 1 to 5. Each Yes is proved with your personal statement, Supplement B and other documents.'),
          notice: {
            tone: 'info',
            title: t('El Suplemento B es obligatorio', 'Supplement B is required'),
            body: t(
              'La policía, la fiscalía, un juez u otra autoridad que investigó el delito debe firmar el Suplemento B y confirmar que usted ayudó. Pídalo a esa agencia; usted no lo llena. Sin él, USCIS no puede aprobar la petición.',
              'The police, prosecutor, judge or other authority that investigated the crime must sign Supplement B confirming you were helpful. Request it from that agency; you do not fill it out. Without it, USCIS cannot approve the petition.',
            ),
          },
          items: ELIGIBILITY_ITEMS,
        },
        {
          id: 'proceedings',
          kind: 'choice',
          formRef: 'Part 2 · Item 7.a',
          question: t('¿Está o estuvo alguna vez en un proceso de inmigración (corte de inmigración)?', 'Were you ever or are you now in immigration proceedings?'),
          options: yesNo,
        },
        {
          id: 'proceedingsTypes',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 2 · Items 7.b–7.f',
          showIf: is('proceedings', 'yes'),
          question: t('¿Qué tipo de proceso? Marque todos los que apliquen.', 'What type of proceedings? Select all that apply.'),
          notice: legal(
            'Si tiene un caso en corte de inmigración o una orden de deportación, un abogado debe revisar su caso antes de presentar: puede pedir que la corte suspenda o cierre el caso mientras USCIS decide.',
            'If you have an immigration court case or a removal order, an attorney should review your case before you file: they can ask the court to pause or close the case while USCIS decides.',
          ),
          options: PROCEEDINGS.map(({ value, label }) => ({ value, label })),
        },
        ...PROCEEDINGS.map(
          (p): Question => ({
            id: `proceedingsDate.${p.value}`,
            kind: 'fields',
            formRef: `Part 2 · Item 7.${p.value}`,
            showIf: all(is('proceedings', 'yes'), has('proceedingsTypes', p.value)),
            question: t(`Fecha del proceso: ${p.label.es.toLowerCase()}`, `${p.en} date`),
            why: t('Ponga la fecha de la decisión (MM/DD/AAAA). Si el proceso sigue abierto, escriba "Current".', 'Give the date of action (MM/DD/YYYY). If you are still in proceedings, write "Current".'),
            fields: [text(`proceedings.${p.value}`, 'Fecha, o "Current" si sigue abierto', 'Date, or "Current"', `Part 2 · Item 7.${p.value}`, { placeholder: 'Current', maxLength: 10 })],
          }),
        ),
        {
          id: 'proceedingsExplain',
          kind: 'fields',
          formRef: 'Part 2 · Item 7 · Part 8',
          showIf: is('proceedings', 'yes'),
          question: t('Explique su caso de inmigración', 'Explain your immigration proceedings'),
          fields: [{ id: 'proceedings.explain', type: 'longText', required: true, label: t('Dónde, cuándo y en qué quedó (en inglés)', 'Where, when and the outcome'), formRef: 'Part 8' }],
        },
        { id: 'entry.more0', kind: 'choice', formRef: 'Part 2 · Items 8–10', question: t('¿Entró a EE.UU. en los últimos 5 años?', 'Did you enter the United States in the last five years?'), why: t('Ponga cada entrada de los últimos 5 años, empezando por la más reciente.', 'List each entry in the five years before filing, most recent first.'), options: yesNo },
        ...rows({
          max: 3,
          id: 'entry',
          first: is('entry.more0', 'yes'),
          question: (i) => (i === 1 ? t('Su entrada más reciente', 'Your most recent entry') : t('Otra entrada', 'Another entry')),
          more: t('¿Entró otra vez en esos 5 años?', 'Did you enter another time in those five years?'),
          formRef: 'Part 2 · Items 8–10',
          fields: (i) => {
            const n = i + 7;
            return [
              date(`entry${i}.date`, 'Fecha de entrada', 'Date of entry', `Part 2 · Item ${n}.a`),
              text(`entry${i}.city`, 'Ciudad de entrada', 'City or town of entry', `Part 2 · Item ${n}.b`, { maxLength: 20, placeholder: 'El Paso' }),
              { id: `entry${i}.state`, type: 'state', label: t('Estado', 'State'), formRef: `Part 2 · Item ${n}.c`, placeholder: 'TX' },
              text(`entry${i}.status`, 'Estatus al entrar (en inglés)', 'Status at the time of entry', `Part 2 · Item ${n}.d`, { maxLength: 20, placeholder: 'EWI' }),
            ];
          },
          overflow: t('Si contesta Sí, la app le pide las demás entradas para la Parte 8.', 'If you answer Yes, the app asks for the other entries for Part 8.'),
        }),
        {
          id: 'otherEntries',
          kind: 'fields',
          formRef: 'Part 2 · Items 8–10 · Part 8',
          showIf: all(is('entry.more0', 'yes'), is('entry.more1', 'yes'), is('entry.more2', 'yes'), is('entry.more3', 'yes')),
          question: t('Las demás entradas', 'The other entries'),
          fields: [{ id: 'otherEntries.explain', type: 'longText', required: true, label: t('Fecha, lugar y estatus de cada una (en inglés)', 'Date, place and status of each one'), formRef: 'Part 8' }],
        },
        {
          id: 'outsideUS',
          kind: 'choice',
          formRef: 'Part 2 · Items 11–12',
          question: t('¿Está usted fuera de EE.UU.?', 'Are you outside the United States?'),
          why: t('Si está fuera, USCIS avisará a un consulado o puerto de entrada, o a una dirección segura en el extranjero, cuando aprueben la petición.', 'If you are abroad, USCIS notifies a consulate or port of entry, or a safe foreign address, when the petition is approved.'),
          options: yesNo,
        },
        {
          id: 'notify',
          kind: 'choice',
          formRef: 'Part 2 · Item 11.a',
          showIf: outside,
          question: t('¿A dónde quiere que avisen si la aprueban?', 'Where do you want to be notified if the petition is approved?'),
          options: [
            { value: 'Consulate', label: t('Consulado de EE.UU.', 'U.S. Consulate') },
            { value: 'Pre-Flight', label: t('Inspección previa al vuelo (Pre-Flight Inspection)', 'Pre-Flight Inspection') },
            { value: 'Port of Entry', label: t('Puerto de entrada', 'Port-of-Entry') },
            { value: 'address', label: t('Una dirección segura en el extranjero', 'A safe foreign address') },
          ],
        },
        {
          id: 'notifyOffice',
          kind: 'fields',
          formRef: 'Part 2 · Items 11.b–11.d',
          showIf: office,
          question: t('¿Dónde está esa oficina?', 'Where is that office?'),
          fields: [
            text('office.city', 'Ciudad', 'City or town', 'Part 2 · Item 11.b', { maxLength: 20 }),
            { id: 'office.state', type: 'state', label: t('Estado (si es en EE.UU.)', 'State (if in the U.S.)'), formRef: 'Part 2 · Item 11.c' },
            text('office.country', 'País', 'Country', 'Part 2 · Item 11.d'),
          ],
        },
        {
          id: 'foreignAddress',
          kind: 'fields',
          formRef: 'Part 2 · Item 12 · Safe Foreign Address',
          showIf: all(outside, is('notify', 'address')),
          question: t('Su dirección segura en el extranjero', 'Your safe foreign address'),
          fields: [
            text('foreign.street', 'Número y calle', 'Street number and name', 'Part 2 · Item 12.a', { maxLength: 34 }),
            { id: 'foreign.unit', type: 'unit', label: t('Apartamento, suite o piso', 'Apt., suite or floor'), formRef: 'Part 2 · Item 12.b' },
            text('foreign.city', 'Ciudad', 'City or town', 'Part 2 · Item 12.c', { maxLength: 20 }),
            text('foreign.province', 'Provincia', 'Province', 'Part 2 · Item 12.d', { required: false, maxLength: 20 }),
            text('foreign.postal', 'Código postal', 'Postal code', 'Part 2 · Item 12.e', { required: false, maxLength: 9 }),
            text('foreign.country', 'País', 'Country', 'Part 2 · Item 12.f'),
          ],
        },
      ],
    },
    {
      id: 'processing',
      part: 'Part 3',
      title: t('Antecedentes', 'Processing information'),
      questions: [
        {
          id: 'crimes',
          kind: 'yesNoList',
          formRef: 'Part 3 · Items 1.a–1.i',
          question: t('Antecedentes penales', 'Criminal history'),
          why: t('Cuente todo, en cualquier país, aunque el récord esté sellado o borrado. No cuente lo que le hicieron a usted como víctima.', 'Include everything, in any country, even if the record was sealed or cleared. Do not count what was done to you as a victim.'),
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
          formRef: 'Part 3 · Items 2–3',
          fields: (i) => {
            const n = i + 1;
            return [
              text(`arrest${i}.why`, 'Por qué (en inglés)', 'Why were you arrested, cited, detained, or charged?', `Part 3 · Item ${n}.a`, { maxLength: 50 }),
              date(`arrest${i}.date`, 'Fecha', 'Date', `Part 3 · Item ${n}.b`),
              text(`arrest${i}.city`, 'Ciudad', 'City or town', `Part 3 · Item ${n}.c`, { maxLength: 20 }),
              { id: `arrest${i}.state`, type: 'state', label: t('Estado (si es en EE.UU.)', 'State (if in the U.S.)'), formRef: `Part 3 · Item ${n}.d` },
              text(`arrest${i}.country`, 'País', 'Country', `Part 3 · Item ${n}.e`),
              text(`arrest${i}.outcome`, 'En qué terminó (en inglés)', 'Outcome or disposition', `Part 3 · Item ${n}.f`, { maxLength: 50, placeholder: 'Charges dismissed' }),
            ];
          },
          overflow: t('Si contesta Sí, explique los demás en la explicación de la Parte 3, que va a la Parte 8.', 'If you answer Yes, describe the others in your Part 3 explanation, which goes to Part 8.'),
        }),
        { id: 'security', kind: 'yesNoList', formRef: 'Part 3 · Items 4–9', question: t('Otras actividades', 'Other activities'), notice: admissibility, items: SECURITY_ITEMS },
        { id: 'violence', kind: 'yesNoList', formRef: 'Part 3 · Items 10–15', question: t('Violencia, grupos armados y armas', 'Violence, armed groups and weapons'), notice: admissibility, items: VIOLENCE_ITEMS },
        {
          id: 'immigrationHistory',
          kind: 'yesNoList',
          formRef: 'Part 3 · Items 16–29',
          question: t('Historial migratorio y salud', 'Immigration history and health'),
          why: t('Por ejemplo: deportaciones, visas negadas, documentos falsos o enfermedades.', 'For example: removals, denied visas, false documents or health conditions.'),
          notice: admissibility,
          items: IMMIGRATION_ITEMS,
        },
        {
          id: 'processingExplain',
          kind: 'fields',
          formRef: 'Part 3 · Part 8',
          showIf: anyYes(PROCESSING_ITEMS),
          question: t('Explique cada Sí', 'Explain each Yes'),
          notice: legal(
            'Explique con calma y con fechas. Un abogado o representante acreditado puede decirle si necesita el Formulario I-192 (perdón) y cómo explicarlo.',
            'Explain calmly and with dates. An attorney or accredited representative can tell you whether you need Form I-192 (waiver) and how to explain it.',
          ),
          fields: [{ id: 'processing.explain', type: 'longText', required: true, label: t('Para cada Sí: el número del ítem, dónde, cuándo y qué pasó (en inglés)', 'For each Yes: item number, where, when and what happened'), formRef: 'Part 8' }],
        },
      ],
    },
    {
      id: 'family',
      part: 'Part 4',
      title: t('Su esposo/a e hijos', 'Your spouse and children'),
      questions: [
        {
          id: 'familyMember.more0',
          kind: 'choice',
          formRef: 'Part 4 · Information About Your Spouse and/or Children',
          question: t('¿Tiene esposo/a o hijos?', 'Do you have a spouse or children?'),
          why: t('Póngalos a todos, vivan donde vivan, aunque no los incluya en su petición.', 'List them all, wherever they live, even if you are not including them in your petition.'),
          options: yesNo,
        },
        ...rows({
          max: 5,
          id: 'familyMember',
          first: is('familyMember.more0', 'yes'),
          question: (i) => (i === 1 ? t('Su esposo/a o hijo/a', 'Your spouse or child') : t('Otro hijo/a o esposo/a', 'Another child or spouse')),
          more: t('¿Tiene otro esposo/a o hijo/a?', 'Do you have another spouse or child?'),
          formRef: 'Part 4 · Items 1–25',
          fields: (i) => {
            const n = (i - 1) * 5 + 1;
            const ref = `Part 4 · Item ${n}`;
            return [
              ...nameFields(`familyMember${i}`, ref),
              date(`familyMember${i}.dob`, 'Fecha de nacimiento', 'Date of birth', `Part 4 · Item ${n + 1}`),
              text(`familyMember${i}.birthCountry`, 'País de nacimiento', 'Country of birth', `Part 4 · Item ${n + 2}`),
              text(`familyMember${i}.relationship`, 'Relación con usted (en inglés)', 'Relationship', `Part 4 · Item ${n + 3}`, { placeholder: 'Son', maxLength: 18 }),
              text(`familyMember${i}.location`, 'Dónde vive ahora (ciudad, país)', 'Current location', `Part 4 · Item ${n + 4}`, { placeholder: 'Houston, TX', maxLength: 18 }),
            ];
          },
          overflow: t('Si son más de 5, escríbalos a mano en la Parte 8.', 'If there are more than 5, write them by hand in Part 8.'),
        }),
        {
          id: 'petitionFamily',
          kind: 'choice',
          formRef: 'Part 4 · Item 26',
          question: t('¿Va a pedir la visa U también para algún familiar?', 'Are you petitioning for one or more qualifying family members?'),
          why: t('Puede incluir a su esposo/a e hijos solteros menores de 21; si usted es menor de 21, también a sus padres y hermanos solteros menores de 18.', 'You can include your spouse and unmarried children under 21; if you are under 21, also your parents and unmarried siblings under 18.'),
          notice: {
            tone: 'info',
            title: t('Suplemento A', 'Supplement A'),
            body: t('Si contesta Sí, debe llenar un Suplemento A por cada familiar. Puede llenarlo en esta app (I-918 Suplemento A), uno por familiar; también puede presentarlo después.', 'If you answer Yes, you must complete a Supplement A for each family member. You can fill it out in this app (I-918 Supplement A), one per family member; you can also file it later.'),
          },
          options: yesNo,
        },
      ],
    },
    {
      id: 'contact',
      part: 'Part 5',
      title: t('Declaración y contacto', 'Statement and contact'),
      questions: [
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 5 · Item 1 · Petitioner’s Statement',
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leerá', 'No, an interpreter will read it to me') },
          ],
        },
        { id: 'interpreterLanguage', kind: 'fields', formRef: 'Part 5 · Item 1.b', showIf: is('readsEnglish', 'B'), question: t('¿En qué idioma se lo leerán?', 'What language will it be read in?'), fields: [text('fluentLanguage', 'Idioma', 'Language', 'Part 5 · Item 1.b', { placeholder: 'Spanish' })] },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 5 · Item 2',
          question: t('¿Alguien más (no usted) preparó esta petición?', 'Did someone else prepare this petition for you?'),
          why: t('Si es así, al final le pediremos sus datos para la Parte 7; esa persona la firma a mano.', 'If so, we ask for their details for Part 7 at the end; that person signs it by hand.'),
          options: yesNo,
        },
        { id: 'preparerName', kind: 'fields', formRef: 'Part 5 · Item 2', showIf: is('preparer', 'yes'), question: t('¿Quién la preparó?', 'Who prepared it?'), fields: [text('preparer.name', 'Nombre del preparador', 'Preparer’s name', 'Part 5 · Item 2')] },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 5 · Items 3–5 · Petitioner’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS de forma segura?', 'How can USCIS safely contact you?'),
          why: t('Dé solo números y correos que la persona que le hizo daño no pueda ver.', 'Give only phone numbers and emails the person who harmed you cannot see.'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: t('Teléfono de día', 'Daytime phone'), formRef: 'Part 5 · Item 3', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: t('Celular', 'Mobile phone'), formRef: 'Part 5 · Item 4' },
            { id: 'email', type: 'email', label: t('Correo electrónico', 'Email'), formRef: 'Part 5 · Item 5' },
          ],
        },
      ],
    },
    assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 6', preparerPart: 'Part 7' }),
  ],
};
