import type { Answers, Field, FormDefinition, YesNoItem } from './types';
import type { T } from '../i18n';
import { anyAddress, date, is, nameFields, rows, sexField, yesNo } from './helpers';
import { CLASSES_OF_ADMISSION } from './classOfAdmission';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';

// Questions follow USCIS Form I-914, Supplement A, Application for Derivative T Nonimmigrant
// Status, edition 01/20/25. The PDF mapping lives in src/pdf/i914supaPdf.ts.
//
// The applicant is the T-1 principal (the person who filed or is filing Form I-914): their answers
// use the I-914's ids (`name.*`, `dob`, `aNumber`, `readsEnglish`, `phone`, `safePhone`, `email`…)
// so Camino can reuse them. Everything about the family member uses the `fam.` prefix. One
// Supplement A is filed for each family member.
//
// Out of scope: Supplement B (the declaration signed by a law enforcement official) is a separate
// form the agency completes; the intro and next steps explain it. The signatures and their dates
// (Part 5, Items 6 and 7; Parts 6 and 7) and the attorney box on page 1 are left blank to be
// completed by hand. More than one prior marriage of the family member and more than five
// arrests go in Part 8 as text.

export const I914SUPA_EDITION = '01/20/25';

const t = (es: string, en: string): T => ({ es, en });

const text = (id: string, es: string, en: string, formRef: string, opts: Partial<Field> = {}): Field => ({ id, type: 'text', required: true, label: { es, en }, formRef, ...opts });

const longText = (id: string, es: string, en: string, formRef: string, required = true): Field => ({ id, type: 'longText', required, label: { es, en }, formRef });

/** A U.S. address: these blocks have no province or country boxes. */
const usAddress = (prefix: string, ref: string, careOf = false): Field[] => [
  ...(careOf ? [text(`${prefix}.careOf`, 'A cargo de (persona u organización que recibe el correo)', 'In care of name', `${ref} · In Care Of Name`, { required: false })] : []),
  text(`${prefix}.street`, 'Número y calle', 'Street number and name', `${ref} · Street Number and Name`, { maxLength: 34, placeholder: '1234 Main St' }),
  { id: `${prefix}.unit`, type: 'unit', label: t('Apartamento, suite o piso', 'Apartment, suite or floor'), formRef: `${ref} · Apt. / Ste. / Flr.`, placeholder: 'Apt 4B' },
  text(`${prefix}.city`, 'Ciudad', 'City or town', `${ref} · City or Town`, { maxLength: 20 }),
  { id: `${prefix}.state`, type: 'state', required: true, label: t('Estado', 'State'), formRef: `${ref} · State`, placeholder: 'CA' },
  { id: `${prefix}.zip`, type: 'zip', required: true, label: t('Código postal ZIP', 'ZIP code'), formRef: `${ref} · ZIP Code` },
];

const yn = (id: string, item: string, es: string, en: string): YesNoItem => ({ id: `fam.p4.${id}`, formRef: `Part 4 · Item ${item}`, label: t(es, en) });

/** Part 4, Items 1.A-1.I. */
export const CRIME_ITEMS: YesNoItem[] = [
  yn('1a', '1.A', '¿Su familiar alguna vez cometió un delito por el que no lo/la arrestaron?', 'Committed a crime or offense for which they have not been arrested?'),
  yn('1b', '1.B', '¿Alguna vez lo/la arrestó, citó o detuvo la policía, inmigración o militares, por cualquier razón?', 'Been arrested, cited, or detained by any law enforcement officer (including DHS, former INS, and military officers) for any reason?'),
  yn('1c', '1.C', '¿Alguna vez lo/la acusaron de un delito?', 'Been charged with committing any crime or offense?'),
  yn('1d', '1.D', '¿Alguna vez lo/la condenaron por un delito (aunque después lo borraran o perdonaran)?', 'Been convicted of a crime or offense (even if violation was subsequently expunged or pardoned)?'),
  yn('1e', '1.E', '¿Alguna vez lo/la pusieron en un programa alternativo o de rehabilitación (diversion, deferred prosecution, deferred adjudication)?', 'Been placed in an alternative sentencing or a rehabilitative program (for example, diversion, deferred prosecution, withheld adjudication, deferred adjudication)?'),
  yn('1f', '1.F', '¿Alguna vez recibió una sentencia suspendida, libertad condicional (probation) o parole?', 'Received a suspended sentence, been placed on probation, or been paroled?'),
  yn('1g', '1.G', '¿Alguna vez estuvo en la cárcel o en prisión?', 'Been in jail or prison?'),
  yn('1h', '1.H', '¿Alguna vez recibió un perdón, amnistía u otra clemencia?', 'Been the beneficiary of a pardon, amnesty, rehabilitation, or other act of clemency or similar action?'),
  yn('1i', '1.I', '¿Alguna vez usó inmunidad diplomática para evitar un juicio en EE.UU.?', 'Exercised diplomatic immunity to avoid prosecution for a criminal offense in the United States?'),
];

/** Part 4, Items 2.A-2.D. */
export const CONDUCT_ITEMS: YesNoItem[] = [
  yn('2a', '2.A', '¿Su familiar ha practicado la prostitución o conseguido clientes para ella, o piensa hacerlo? (Conteste Sí aunque lo/la obligaran.)', 'Engaged in prostitution or procurement of prostitution or does he or she intend to engage in prostitution or procurement of prostitution?'),
  yn('2b', '2.B', '¿Alguna vez participó en vicios comerciales ilegales, como apuestas ilegales?', 'EVER engaged in any unlawful commercialized vice, including but not limited to illegal gambling?'),
  yn('2c', '2.C', '¿Alguna vez ayudó a sabiendas a alguien a entrar ilegalmente a EE.UU.?', 'EVER knowingly encouraged, induced, assisted, abetted, or aided any alien to try to enter the United States illegally?'),
  yn('2d', '2.D', '¿Alguna vez traficó drogas o ayudó a traficarlas?', 'EVER illicitly trafficked in any controlled substance, or knowingly assisted, abetted, or colluded in the illicit trafficking of any controlled substance?'),
];

/** Part 4, Items 3-7. */
export const SECURITY_ITEMS: YesNoItem[] = [
  yn('3a', '3.A', '¿Su familiar alguna vez cometió, planeó o ayudó a secuestrar o sabotear un avión, barco o vehículo?', 'EVER committed, planned or prepared, participated in, threatened to, attempted to, or conspired to commit, gathered information for, or solicited funds for hijacking or sabotage of any conveyance (including an aircraft, vessel, or vehicle)?'),
  yn('3b', '3.B', '¿…tomar rehenes para obligar a otros a hacer algo?', '…seizing or detaining, and threatening to kill, injure, or continue to detain, another individual in order to compel a third person to do or abstain from doing any act?'),
  yn('3c', '3.C', '¿…un asesinato político (magnicidio)?', '…assassination?'),
  yn('3d', '3.D', '¿…usar un arma de fuego para poner en peligro a personas o causar daños graves?', '…the use of any firearm with intent to endanger, directly or indirectly, the safety of one or more individuals or to cause substantial damage to property?'),
  yn('3e', '3.E', '¿…usar explosivos, armas químicas, biológicas o nucleares u otras armas peligrosas?', '…the use of any biological agent; chemical agent; or nuclear weapon or device; explosive; or other weapon or dangerous device, with intent to endanger the safety of individuals or to cause substantial damage to property?'),
  yn('4a', '4.A', '¿Alguna vez fue miembro, apoyó o estuvo asociado/a con una organización terrorista designada?', 'EVER been a member of, solicited money or members for, provided support for, attended military training by or on behalf of, or been associated with an organization designated as a terrorist organization under INA section 219?'),
  yn('4b1', '4.B.(1)', '¿…con un grupo que ha secuestrado o saboteado aviones, barcos o vehículos?', '…any other group of two or more individuals which has engaged in hijacking or sabotage of any conveyance?'),
  yn('4b2', '4.B.(2)', '¿…con un grupo que ha tomado rehenes?', '…a group which has engaged in seizing or detaining, and threatening to kill, injure, or continue to detain another individual to compel a third person?'),
  yn('4b3', '4.B.(3)', '¿…con un grupo que ha cometido asesinatos políticos?', '…a group which has engaged in assassination?'),
  yn('4b4', '4.B.(4)', '¿…con un grupo que ha usado armas de fuego para poner en peligro a personas?', '…a group which has engaged in the use of any firearm with intent to endanger the safety of individuals or to cause substantial damage to property?'),
  yn('4b5', '4.B.(5)', '¿…con un grupo que pide dinero o miembros o da apoyo a una organización terrorista?', '…a group which has engaged in soliciting money or members or otherwise providing material support to a terrorist organization?'),
  yn('4b6', '4.B.(6)', '¿…con un grupo que ha usado explosivos u otras armas peligrosas?', '…a group which has engaged in the use of any biological agent, chemical agent, nuclear weapon or device, explosive, or other weapon or dangerous device?'),
  yn('5a', '5.A', '¿Su familiar piensa hacer espionaje en EE.UU.?', 'Does the family member intend to engage in the United States in espionage?'),
  yn('5b', '5.B', '¿Piensa hacer actividades ilegales o para derrocar al gobierno de EE.UU.?', '…any unlawful activity, or any activity the purpose of which is in opposition, to control or overthrow of the Government of the United States?'),
  yn('5c', '5.C', '¿Piensa hacer actividades de espionaje, sabotaje o exportación ilegal de tecnología o información?', '…solely, principally, or incidentally in any activity related to espionage or sabotage or to violate any law involving the export of goods, technology, or sensitive information?'),
  yn('6', '6', '¿Ha sido miembro del Partido Comunista u otro partido totalitario (salvo que fuera obligado/a)?', 'EVER been or do they continue to be a member of the Communist or other totalitarian party, except when membership was involuntary?'),
  yn('7', '7', '¿Participó en persecuciones con el gobierno nazi de Alemania entre 1933 y 1945?', 'During the period of March 23, 1933, to May 8, 1945, in association with the Nazi Government of Germany or any organization or government associated or allied with it, ever ordered, incited, assisted, or otherwise participated in the persecution of any person?'),
];

/** Part 4, Items 8.A-8.C. */
export const PRESENCE_ITEMS: YesNoItem[] = [
  yn('8a', '8.A', '¿Su familiar alguna vez estuvo presente o cerca cuando mataron, torturaron, golpearon o hirieron a alguien a propósito?', 'EVER been present or nearby when any person was intentionally killed, tortured, beaten, or injured?'),
  yn('8b', '8.B', '¿…cuando sacaron a alguien de su casa por la fuerza o con amenazas?', '…displaced or moved from their residence by force, compulsion, or duress?'),
  yn('8c', '8.C', '¿…cuando obligaron a alguien a tener contacto sexual?', '…in any way compelled or forced to engage in any kind of sexual contact or relations?'),
];

/** Part 4, Items 9.A-9.F. */
export const REMOVAL_ITEMS: YesNoItem[] = [
  yn('9a', '9.A', '¿Su familiar tiene AHORA un proceso de deportación, exclusión o rescisión abierto?', 'Are removal, exclusion, rescission, or deportation proceedings pending against the family member?'),
  yn('9b', '9.B', '¿Alguna vez le abrieron un proceso de deportación, exclusión o rescisión?', 'Have removal, exclusion, rescission, or deportation proceedings EVER been initiated against the family member?'),
  yn('9c', '9.C', '¿Alguna vez lo/la deportaron o excluyeron de EE.UU.?', 'Has the family member EVER been removed, excluded, or deported from the United States?'),
  yn('9d', '9.D', '¿Alguna vez le dieron una orden de deportación o exclusión?', 'Has the family member EVER been ordered to be removed, excluded, or deported from the United States?'),
  yn('9e', '9.E', '¿Alguna vez le negaron una visa o la entrada a EE.UU.?', 'Has the family member EVER been denied a visa or denied admission to the United States?'),
  yn('9f', '9.F', '¿Alguna vez le dieron salida voluntaria y no salió a tiempo?', 'Has the family member EVER been granted voluntary departure by an immigration officer or an immigration judge and failed to depart within the allotted time?'),
];

/** Part 4, Items 10-14. */
export const VIOLENCE_ITEMS: YesNoItem[] = [
  yn('10a', '10.A', '¿Su familiar (o alguien de su familia) alguna vez ordenó, cometió o ayudó en actos de tortura o genocidio?', 'Has the family member (or any member of their family) EVER ordered, incited, called for, committed, assisted, helped with, or otherwise participated in acts involving torture or genocide?'),
  yn('10b', '10.B', '¿…en matar a alguien?', '…killing any person?'),
  yn('10c', '10.C', '¿…en herir gravemente a alguien a propósito?', '…intentionally and severely injuring any person?'),
  yn('10d', '10.D', '¿…en contacto sexual con alguien obligado o amenazado?', '…engaging in any kind of sexual contact or relations with any person who was being forced or threatened?'),
  yn('10e', '10.E', '¿…en impedir a alguien practicar su religión?', '…limiting or denying any person’s ability to exercise religious beliefs?'),
  yn('11a', '11.A', '¿Su familiar alguna vez sirvió o participó en una unidad militar, paramilitar, policial, de autodefensa, guerrilla, milicia o grupo rebelde?', 'EVER served in, been a member of, assisted in, or participated in any military unit, paramilitary unit, police unit, self-defense unit, vigilante unit, rebel group, guerrilla group, militia, or insurgent organization?'),
  yn('11b', '11.B', '¿Alguna vez trabajó en una prisión, cárcel, centro de detención o campo de trabajo?', 'EVER served in any prison, jail, prison camp, detention facility, labor camp, or any other situation that involved detaining persons?'),
  yn('12', '12', '¿Alguna vez perteneció a un grupo en el que él/ella u otros usaron o amenazaron con armas contra alguien?', 'EVER been a member of, assisted in, or participated in any group, unit, or organization of any kind in which they or any other persons used any type of weapon against any person or threatened to do so?'),
  yn('13', '13', '¿Alguna vez vendió, dio o transportó armas a alguien que las usó contra otra persona?', 'EVER assisted or participated in selling, providing or transporting weapons to any person who to their knowledge used them against another person?'),
  yn('14', '14', '¿Alguna vez recibió entrenamiento militar, paramilitar o con armas?', 'EVER received any type of military, paramilitary, or weapons training?'),
];

/** Part 4, Items 15-20. */
export const IMMIGRATION_ITEMS: YesNoItem[] = [
  yn('15', '15', '¿Su familiar tiene una orden final o multa por usar documentos falsos (sección 274C)?', 'Is the family member under a final order or civil penalty for violating INA section 274C (producing and/or using false documentation to unlawfully satisfy a requirement of the INA)?'),
  yn('16', '16', '¿Alguna vez usó fraude o mentiras para conseguir una visa, entrada o beneficio migratorio?', 'EVER, by fraud or willful misrepresentation of a material fact, sought to procure, or procured, a visa or other documentation, for entry into the United States or any immigration benefit?'),
  yn('17', '17', '¿Alguna vez salió de EE.UU. para evitar el servicio militar?', 'EVER left the United States to avoid being drafted into the U.S. Armed Forces?'),
  yn('18', '18', '¿Alguna vez retuvo fuera de EE.UU. a un niño con derecho a la ciudadanía, contra la custodia de un ciudadano de EE.UU.?', 'EVER detained, retained, or withheld the custody of a child, having a lawful claim to U.S. citizenship, outside the United States from a U.S. citizen granted custody?'),
  yn('19', '19', '¿Piensa practicar la poligamia en EE.UU.?', 'Does the family member plan to practice polygamy in the United States?'),
  yn('20', '20', '¿Entró a EE.UU. como polizón (escondido/a en un barco o avión)?', 'Did the family member enter the United States as a stowaway?'),
];

/** Part 4, Items 21.A-21.C. */
export const HEALTH_ITEMS: YesNoItem[] = [
  yn('21a', '21.A', '¿Su familiar tiene una enfermedad contagiosa de importancia para la salud pública?', 'Does the family member have a communicable disease of public health significance?'),
  yn('21b', '21.B', '¿Tiene o ha tenido un trastorno físico o mental con conductas que pongan en peligro a él/ella u otros?', 'Does the family member have or have they had a physical or mental disorder and behavior (or a history of behavior that is likely to recur) associated with the disorder which has posed or may pose a threat to the property, safety, or welfare of themselves or others?'),
  yn('21c', '21.C', '¿Es o ha sido adicto/a o abusador/a de drogas?', 'Is the family member now or have they been a drug abuser or drug addict?'),
];

export const PROCESSING_ITEMS = [...CRIME_ITEMS, ...CONDUCT_ITEMS, ...SECURITY_ITEMS, ...PRESENCE_ITEMS, ...REMOVAL_ITEMS, ...VIOLENCE_ITEMS, ...IMMIGRATION_ITEMS, ...HEALTH_ITEMS];

const anyYes = (items: YesNoItem[]) => (a: Answers) => items.some((i) => a[i.id] === 'yes');

const legal = (es: string, en: string) => ({ tone: 'legal' as const, title: t('Hable con un abogado', 'Talk to an attorney'), body: t(es, en) });

const admissibility = legal(
  'Diga siempre la verdad sobre su familiar, aunque su récord esté sellado o borrado, o alguien le haya dicho que ya no existe. Conteste Sí también si lo hizo obligado/a por los tratantes, y explique esa relación. Un Sí no significa que le nieguen la visa T: muchas faltas se pueden perdonar con el Formulario I-192. Antes de contestar, hable con un abogado o un representante acreditado.',
  'Always tell the truth about your family member, even if the record was sealed or cleared, or someone told you it no longer exists. Answer Yes even if the traffickers forced them, and explain that connection. A Yes does not mean the T visa will be denied: many grounds can be waived with Form I-192. Talk to an attorney or accredited representative before answering.',
);

/** Item 1: the relative's tie to you. Item 2: the child of one of those relatives, in danger of retaliation. */
export const ITEM1_RELATIONS = ['spouse', 'child', 'parent', 'sibling'];
export const ITEM2_RELATIONS = ['spouseChild', 'grandchild', 'adultSibling', 'nieceNephew'];

const inUS = is('fam.inUS', 'yes');
const abroad = is('fam.inUS', 'no');
const PRIOR_ENDED = ['Divorced', 'Widowed', 'Annulled'];
const hasPrior = (a: Answers) => PRIOR_ENDED.includes(String(a['fam.marital'] ?? '')) || (a['fam.marital'] === 'Married' && a['fam.priorMarried'] === 'yes');

/** Item 18 and Item 22.D: the form's dropdown, which lists the classes of admission. */
const STATUS_OPTIONS = CLASSES_OF_ADMISSION.map((c) => ({ value: c, label: t(c, c) }));

export const COURT_TYPES = [
  { value: 'removal', label: t('Deportación (removal)', 'Removal') },
  { value: 'exclusion', label: t('Exclusión (exclusion)', 'Exclusion') },
  { value: 'deportation', label: t('Deportación bajo la ley anterior (deportation)', 'Deportation') },
  { value: 'rescission', label: t('Rescisión (rescission)', 'Rescission') },
];

export const i914supa: FormDefinition = {
  id: 'i-914supa',
  number: 'I-914 Supplement A',
  edition: I914SUPA_EDITION,
  title: t('Visa T para un familiar (Suplemento A del I-914)', 'Application for Derivative T Nonimmigrant Status (Form I-914, Supplement A)'),
  summary: {
    es: 'Si usted pidió o tiene la visa T, incluya a su esposo/a, hijos u otros familiares que pueden recibirla con usted. Un suplemento por cada familiar.',
    en: 'If you applied for or hold T status, include your spouse, children or other eligible relatives. One supplement per family member.',
  },
  intro: {
    es: 'El Suplemento A lo llena usted, la víctima de trata que pidió la visa T (T-1), para pedir la visa T también para un familiar. Se llena uno por cada familiar. Puede presentarlo junto con su Formulario I-914 (que también se llena en esta app; sus datos se reutilizan), mientras su I-914 está pendiente o cuando ya tiene la visa T. Puede incluir a su esposo/a y a sus hijos solteros menores de 21; si usted es menor de 21, también a sus padres y hermanos solteros menores de 18; y, si corren peligro de represalias por su escape o su colaboración con la policía, a sus padres, hermanos menores de 18 y los hijos de esos familiares. El Suplemento B (la declaración de la policía u otra autoridad) es otro formulario que no está en esta app: lo firma la agencia. Su caso es confidencial: la ley prohíbe que USCIS comparta su información con los tratantes. Es un caso legal delicado: le recomendamos que lo revise un abogado o un representante acreditado (muchas organizaciones ayudan gratis a víctimas). Si necesita ayuda o está en peligro, llame a la Línea Nacional contra la Trata de Personas, 1-888-373-7888 (gratis, confidencial, en español, las 24 horas), o al 911.',
    en: 'Supplement A is completed by you, the trafficking victim who applied for T status (T-1), to ask for T status for a family member as well. Complete one for each family member. You can file it together with your Form I-914 (also in this app; your answers are reused), while your I-914 is pending, or once you hold T status. You can include your spouse and unmarried children under 21; if you are under 21, also your parents and unmarried siblings under 18; and, if they face a present danger of retaliation because of your escape or your cooperation with law enforcement, your parents, siblings under 18 and the children of those relatives. Supplement B (the declaration from the police or another authority) is a separate form not in this app: the agency signs it. Your case is confidential: the law forbids USCIS from sharing your information with the traffickers. It is a sensitive legal case: we recommend an attorney or accredited representative review it (many organizations help victims for free). If you need help or are in danger, call the National Human Trafficking Hotline at 1-888-373-7888 (free, confidential, 24 hours, in Spanish), or 911.',
  },
  minutes: 35,
  pdf: {
    path: 'forms/i-914supa.pdf',
    fileName: 'I-914-Supplement-A-filled.pdf',
    load: () => import('../pdf/i914supaPdf').then((m) => m.fillI914SupA),
    signHere: { es: 'Parte 5, Ítem 6 (y su familiar, si está en EE.UU., el Ítem 7)', en: 'Part 5, Item 6 (and your family member, if in the U.S., Item 7)' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-914 que la edición {edition} del Suplemento A sigue vigente. Presentar el Suplemento A no cuesta nada.',
      'Llene un Suplemento A por cada familiar. Si lo presenta con su I-914, envíelos juntos en el mismo paquete; si lo presenta después, adjunte una copia de su recibo o de su aprobación de la visa T.',
      'Adjunte la prueba del parentesco: acta de matrimonio (y prueba de que terminaron los matrimonios anteriores), o actas de nacimiento que muestren el vínculo. Si pide por peligro de represalias, explique ese peligro y adjunte pruebas (reportes de policía, cartas, declaraciones).',
      'Imprima el PDF. Usted firma la Parte 5, Ítem 6, a mano con tinta negra. Si su familiar está en EE.UU., él o ella también debe firmar el Ítem 7; sin esa firma USCIS lo rechaza. Si un intérprete o preparador le ayudó, sus datos ya están en las Partes 6 y 7; ellos los revisan y firman y fechan a mano.',
      'Si su familiar contestó Sí a alguna pregunta de la Parte 4, pregunte a su abogado si necesita el Formulario I-192 (perdón). Si su familiar está en EE.UU. y quiere permiso de trabajo, presente también el Formulario I-765.',
      'Envíe todo a la dirección de USCIS indicada en uscis.gov/i-914. Si teme que alguien vea el correo, use la dirección segura. Hable con un abogado o representante acreditado antes de enviar. Línea Nacional contra la Trata de Personas: 1-888-373-7888.',
    ],
    en: [
      'Check at uscis.gov/i-914 that edition {edition} of Supplement A is still current. There is no fee to file Supplement A.',
      'Complete one Supplement A for each family member. If you file it with your I-914, mail them together in the same package; if you file it later, attach a copy of your receipt or your T status approval.',
      'Attach proof of the relationship: marriage certificate (and proof that prior marriages ended), or birth certificates showing the relationship. If you file because of a danger of retaliation, describe that danger and attach evidence (police reports, letters, statements).',
      'Print the PDF. You sign Part 5, Item 6, by hand in black ink. If your family member is in the U.S., they must also sign Item 7; without that signature USCIS rejects it. If an interpreter or preparer helped you, their details are already in Parts 6 and 7; they check them and sign and date by hand.',
      'If your family member answered Yes to any Part 4 question, ask your attorney whether they need Form I-192 (waiver). If your family member is in the U.S. and wants a work permit, also file Form I-765.',
      'Mail everything to the USCIS address listed at uscis.gov/i-914. If you fear someone may see the mail, use the safe address. Talk to an attorney or accredited representative before mailing. National Human Trafficking Hotline: 1-888-373-7888.',
    ],
  },
  sections: [
    {
      id: 'relation',
      part: 'Part 1',
      title: t('Para quién lo pide', 'Family member you are filing for'),
      questions: [
        {
          id: 'fam.relation',
          kind: 'choice',
          formRef: 'Part 1 · Items 1–2 · Family Member For Whom You are Filing',
          question: t('¿Para qué familiar pide la visa T con este suplemento?', 'Which family member are you filing for with this supplement?'),
          why: t(
            'Uno por suplemento. Esposo/a e hijos solteros menores de 21 siempre pueden. Padres y hermanos solteros menores de 18: si usted es menor de 21, o si corren peligro de represalias. Las últimas cuatro opciones son solo por peligro de represalias.',
            'One per supplement. A spouse and unmarried children under 21 always qualify. Parents and unmarried siblings under 18: if you are under 21, or if they face a danger of retaliation. The last four options are only for a danger of retaliation.',
          ),
          notice: legal(
            'Este suplemento es parte de su caso de visa T: le recomendamos un abogado o un representante acreditado (muchas organizaciones de apoyo a víctimas ayudan gratis). Su información y la de su familia es confidencial. Si usted o su familia necesitan ayuda o están en peligro, llame a la Línea Nacional contra la Trata de Personas: 1-888-373-7888 (gratis, confidencial, las 24 horas, en español), o al 911.',
            'This supplement is part of your T visa case: we recommend an attorney or accredited representative (many victim service organizations help for free). Your and your family’s information is confidential. If you or your family need help or are in danger, call the National Human Trafficking Hotline: 1-888-373-7888 (free, confidential, 24 hours), or 911.',
          ),
          options: [
            { value: 'spouse', label: t('Mi esposo/a', 'My spouse (Item 1)') },
            { value: 'child', label: t('Mi hijo/a', 'My child (Item 1)') },
            { value: 'parent', label: t('Mi padre o mi madre', 'My parent (Item 1)') },
            { value: 'sibling', label: t('Mi hermano/a soltero/a menor de 18', 'My unmarried sibling under 18 (Item 1)') },
            { value: 'spouseChild', label: t('Hijo/a de mi esposo/a (por peligro de represalias)', 'Child of my spouse, in danger of retaliation (Item 2)') },
            { value: 'grandchild', label: t('Mi nieto/a (por peligro de represalias)', 'My grandchild, in danger of retaliation (Item 2)') },
            { value: 'adultSibling', label: t('Mi hermano/a de 18 años o más (por peligro de represalias)', 'My sibling over 18, in danger of retaliation (Item 2)') },
            { value: 'nieceNephew', label: t('Mi sobrino/a, hijo/a de mi hermano/a menor de 18 (por peligro de represalias)', 'My niece or nephew, child of my sibling under 18, in danger of retaliation (Item 2)') },
          ],
        },
      ],
    },
    {
      id: 'principal',
      part: 'Part 2',
      title: t('Sus datos', 'About you (the principal)'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 2 · Item 1 · Your Full Legal Name',
          question: t('¿Cuál es su nombre legal completo?', 'What is your full legal name?'),
          why: t('Usted es quien pidió la visa T (la víctima). Las preguntas sobre su familiar vienen después.', 'You are the person who applied for T status (the victim). The questions about your family member come next.'),
          fields: nameFields('name', 'Part 2 · Item 1'),
        },
        {
          id: 'principalIds',
          kind: 'fields',
          formRef: 'Part 2 · Items 2–3',
          question: t('Su fecha de nacimiento y A-Number', 'Your date of birth and A-Number'),
          fields: [
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 2 · Item 2'),
            { id: 'aNumber', type: 'aNumber', label: t('A-Number (si tiene)', 'A-Number (if any)'), formRef: 'Part 2 · Item 3' },
          ],
        },
        {
          id: 'i914Status',
          kind: 'choice',
          formRef: 'Part 2 · Item 4 · Status of your Form I-914',
          question: t('¿En qué estado está su solicitud de visa T (I-914)?', 'What is the status of your Form I-914?'),
          options: [
            { value: 'together', label: t('La presento ahora, junto con este suplemento', 'Filing it together with this supplement') },
            { value: 'pending', label: t('Ya la presenté y está pendiente', 'Pending') },
            { value: 'approved', label: t('Ya me la aprobaron', 'Approved') },
          ],
        },
      ],
    },
    {
      id: 'member',
      part: 'Part 3',
      title: t('Su familiar', 'Your family member'),
      questions: [
        {
          id: 'fam.name',
          kind: 'fields',
          formRef: 'Part 3 · Item 1 · Full Legal Name',
          question: t('¿Cuál es el nombre legal completo de su familiar?', 'What is your family member’s full legal name?'),
          why: t('Como aparece en su acta de nacimiento o pasaporte.', 'As shown on their birth certificate or passport.'),
          fields: nameFields('fam.name', 'Part 3 · Item 1'),
        },
        { id: 'fam.otherName.more0', kind: 'choice', formRef: 'Part 3 · Item 2 · Other Names Used', question: t('¿Su familiar ha usado otros nombres (de soltera, apodos, alias)?', 'Has your family member used other names (maiden name, nicknames, aliases)?'), options: yesNo },
        ...rows({
          max: 3,
          id: 'fam.otherName',
          first: is('fam.otherName.more0', 'yes'),
          question: (i) => (i === 1 ? t('Otro nombre que ha usado su familiar', 'Another name your family member has used') : t('Otro nombre más', 'One more name')),
          more: t('¿Ha usado otro nombre más?', 'Has your family member used another name?'),
          formRef: 'Part 3 · Item 2',
          fields: (i) => nameFields(`fam.otherName${i}`, i <= 2 ? 'Part 3 · Item 2' : 'Part 8'),
          overflow: t('El tercer nombre va en la Parte 8. Si son más, escríbalos a mano en la Parte 8.', 'The third name goes in Part 8. If there are more, write them by hand in Part 8.'),
        }),
        {
          id: 'fam.inUS',
          kind: 'choice',
          formRef: 'Part 3 · Item 19',
          question: t('¿Su familiar vive ahora en Estados Unidos?', 'Is your family member currently living in the United States?'),
          options: yesNo,
        },
        {
          id: 'fam.hasIntended',
          kind: 'choice',
          formRef: 'Part 3 · Item 3 · Intended Physical Address',
          showIf: abroad,
          question: t('¿Ya sabe en qué dirección de EE.UU. vivirá su familiar cuando llegue?', 'Do you know the U.S. address where your family member will live?'),
          why: t('Si no la sabe todavía, conteste No y el formulario queda en blanco ahí.', 'If you do not know yet, answer No and that box stays blank.'),
          options: yesNo,
        },
        {
          id: 'fam.home',
          kind: 'fields',
          formRef: 'Part 3 · Item 3 · U.S. Physical Address or Intended Physical Address',
          showIf: (a) => inUS(a) || a['fam.hasIntended'] === 'yes',
          question: t('¿Dónde vive (o vivirá) su familiar en EE.UU.?', 'Where does (or will) your family member live in the U.S.?'),
          why: t('Una dirección con calle y número, no un apartado postal (PO Box).', 'A street address, not a PO Box.'),
          fields: usAddress('fam.home', 'Part 3 · Item 3'),
        },
        {
          id: 'fam.mailingSafe',
          kind: 'choice',
          formRef: 'Part 3 · Item 4 · Safe U.S. Mailing Address',
          question: t('¿Quiere dar una dirección segura en EE.UU. para el correo de USCIS sobre su familiar?', 'Do you want to give a safe U.S. mailing address for USCIS notices about your family member?'),
          why: t('Si los tratantes u otra persona que les hizo daño pueden ver el correo en casa, conteste Sí y dé una dirección segura (de un familiar, una organización o su abogado). Puede ser un PO Box.', 'If the traffickers or anyone who harmed you could see the mail at home, answer Yes and give a safe address (a relative, an organization or your attorney). It can be a PO Box.'),
          options: yesNo,
        },
        {
          id: 'fam.mailing',
          kind: 'fields',
          formRef: 'Part 3 · Item 4 · Safe U.S. Mailing Address',
          showIf: is('fam.mailingSafe', 'yes'),
          question: t('¿Cuál es la dirección segura para el correo?', 'What is the safe mailing address?'),
          fields: usAddress('fam.mailing', 'Part 3 · Item 4', true),
        },
        {
          id: 'fam.ids',
          kind: 'fields',
          formRef: 'Part 3 · Items 5–8',
          question: t('Los números y el sexo de su familiar', 'Your family member’s numbers and sex'),
          why: t('Deje en blanco los números que no tenga.', 'Leave blank any numbers they do not have.'),
          fields: [
            { id: 'fam.aNumber', type: 'aNumber', label: t('A-Number (si tiene)', 'A-Number (if any)'), formRef: 'Part 3 · Item 5' },
            { id: 'fam.uscisAccount', type: 'uscisAccount', label: t('Cuenta en línea de USCIS (si tiene)', 'USCIS online account number (if any)'), formRef: 'Part 3 · Item 6' },
            { id: 'fam.ssn', type: 'ssn', label: t('Número de Seguro Social (si tiene)', 'U.S. Social Security number (if any)'), formRef: 'Part 3 · Item 7' },
            sexField('fam.sex', 'Part 3 · Item 8'),
          ],
        },
        {
          id: 'fam.marital',
          kind: 'choice',
          formRef: 'Part 3 · Item 9 · Marital Status',
          question: t('¿Cuál es el estado civil de su familiar?', 'What is your family member’s marital status?'),
          options: [
            { value: 'Single', label: t('Soltero/a (nunca casado/a)', 'Single, never married') },
            { value: 'Married', label: t('Casado/a', 'Married') },
            { value: 'Divorced', label: t('Divorciado/a', 'Divorced') },
            { value: 'Widowed', label: t('Viudo/a', 'Widowed') },
            { value: 'Annulled', label: t('Matrimonio anulado', 'Annulled') },
          ],
        },
        {
          id: 'fam.priorMarried',
          kind: 'choice',
          formRef: 'Part 3 · Item 10',
          showIf: is('fam.marital', 'Married'),
          question: t('¿Su familiar estuvo casado/a antes con otra persona?', 'Was your family member married to someone else before?'),
          options: yesNo,
        },
        {
          id: 'fam.prior',
          kind: 'fields',
          formRef: 'Part 3 · Item 10 · Prior Spouse',
          showIf: hasPrior,
          question: t('Su matrimonio anterior', 'Their prior marriage'),
          why: t('El más reciente que terminó. Adjunte la sentencia de divorcio, el acta de defunción o la anulación.', 'The most recent one that ended. Attach the divorce decree, death certificate or annulment.'),
          fields: [
            ...nameFields('fam.prior', 'Part 3 · Item 10.A'),
            date('fam.prior.ended', 'Fecha en que terminó el matrimonio', 'Date marriage ended', 'Part 3 · Item 10.B'),
            text('fam.prior.city', 'Ciudad donde terminó', 'Where marriage ended: city or town', 'Part 3 · Item 10.C · City or Town', { maxLength: 20 }),
            text('fam.prior.province', 'Estado o provincia', 'State or province', 'Part 3 · Item 10.C · State or Province', { required: false, maxLength: 20 }),
            text('fam.prior.country', 'País', 'Country', 'Part 3 · Item 10.C · Country'),
            {
              id: 'fam.prior.how',
              type: 'select',
              required: true,
              label: t('Cómo terminó', 'How marriage ended'),
              formRef: 'Part 3 · Item 10.D',
              options: [
                { value: 'D', label: t('Divorcio', 'Divorced') },
                { value: 'W', label: t('Murió su esposo/a', 'Widowed') },
                { value: 'A', label: t('Anulación', 'Annulled') },
                { value: 'S', label: t('Separación', 'Separated') },
              ],
            },
            longText('fam.prior.others', 'Otros matrimonios anteriores, si hubo (nombre, fecha, lugar y cómo terminó, en inglés)', 'Other prior marriages, if any (name, date, place and how each ended)', 'Part 8', false),
          ],
        },
        {
          id: 'fam.birth',
          kind: 'fields',
          formRef: 'Part 3 · Items 11–13',
          question: t('¿Cuándo y dónde nació su familiar?', 'When and where was your family member born?'),
          fields: [
            date('fam.dob', 'Fecha de nacimiento', 'Date of birth', 'Part 3 · Item 11'),
            text('fam.birthCity', 'Ciudad de nacimiento', 'City or town of birth', 'Part 3 · Item 12 · City or Town', { maxLength: 20 }),
            text('fam.birthProvince', 'Estado o provincia de nacimiento', 'State or province of birth', 'Part 3 · Item 12 · State or Province', { required: false, maxLength: 20 }),
            text('fam.birthCountry', 'País de nacimiento', 'Country of birth', 'Part 3 · Item 12 · Country'),
            text('fam.citizenship', 'País de ciudadanía o nacionalidad', 'Country of citizenship or nationality', 'Part 3 · Item 13'),
          ],
        },
        {
          id: 'fam.documents',
          kind: 'fields',
          formRef: 'Part 3 · Items 14–18',
          question: t('El pasaporte y el estatus migratorio de su familiar', 'Your family member’s passport and immigration status'),
          why: t('Deje en blanco lo que no tenga o no sepa. Si está fuera de EE.UU., deje el estatus en blanco.', 'Leave blank what they do not have or you do not know. If they are outside the U.S., leave the status blank.'),
          fields: [
            text('fam.passport', 'Número de pasaporte o documento de viaje', 'Passport or travel document number', 'Part 3 · Item 14', { required: false, maxLength: 30 }),
            text('fam.passportCountry', 'País que lo emitió', 'Country that issued it', 'Part 3 · Item 15', { required: false }),
            date('fam.passportIssued', 'Fecha de emisión', 'Issue date', 'Part 3 · Item 16', false),
            date('fam.passportExpires', 'Fecha de vencimiento', 'Expiration date', 'Part 3 · Item 17', false, 'date'),
            {
              id: 'fam.currentStatus',
              type: 'select',
              label: t('Estatus migratorio actual', 'Current immigration status'),
              hint: t('Si entró sin inspección elija "EWI - ENTRY WITHOUT INSPECTION". Si no sabe, elija "UN - UNKNOWN".', 'If they entered without inspection, choose "EWI - ENTRY WITHOUT INSPECTION". If you do not know, choose "UN - UNKNOWN".'),
              formRef: 'Part 3 · Item 18',
              options: STATUS_OPTIONS,
            },
          ],
        },
        {
          id: 'fam.lastEntry',
          kind: 'fields',
          formRef: 'Part 3 · Item 20',
          showIf: inUS,
          question: t('La última entrada de su familiar a EE.UU.', 'Your family member’s last entry into the U.S.'),
          why: t('Aunque haya entrado sin permiso: ponga el lugar y la fecha aproximados. El I-94 es el registro de entrada; si entró sin inspección, no tiene uno.', 'Even if they entered without permission: give the approximate place and date. The I-94 is the arrival record; if they entered without inspection, they do not have one.'),
          fields: [
            text('fam.lastEntry.city', 'Ciudad de entrada', 'Place of last entry: city or town', 'Part 3 · Item 20.A · City or Town', { maxLength: 20, placeholder: 'San Ysidro' }),
            { id: 'fam.lastEntry.state', type: 'state', required: true, label: t('Estado', 'State'), formRef: 'Part 3 · Item 20.A · State', placeholder: 'CA' },
            date('fam.lastEntry.date', 'Fecha de la última entrada (aproximada)', 'Date of last entry', 'Part 3 · Item 20.B'),
            { id: 'fam.i94', type: 'i94', label: t('Número de I-94 (si tiene)', 'Form I-94 number (if any)'), formRef: 'Part 3 · Item 20.C' },
          ],
        },
        {
          id: 'fam.office',
          kind: 'choice',
          formRef: 'Part 3 · Item 21.A · Type of Office',
          showIf: abroad,
          question: t('¿Qué oficina de EE.UU. quiere que avisen si aprueban a su familiar?', 'Which U.S. office do you want notified if your family member is approved?'),
          why: t('Normalmente es el consulado de EE.UU. más cercano a donde vive su familiar, donde hará la entrevista para la visa.', 'Usually the U.S. consulate closest to where your family member lives, where they will have the visa interview.'),
          options: [
            { value: 'CON', label: t('Un consulado de EE.UU.', 'Consulate') },
            { value: 'PFI', label: t('Una oficina de inspección previa al vuelo', 'Pre-flight inspection facility') },
            { value: 'POE', label: t('Un puerto de entrada', 'Port of entry') },
          ],
        },
        {
          id: 'fam.officePlace',
          kind: 'fields',
          formRef: 'Part 3 · Item 21.B–C',
          showIf: abroad,
          question: t('¿Dónde está esa oficina?', 'Where is that office?'),
          fields: [
            text('fam.office.city', 'Ciudad', 'City or town', 'Part 3 · Item 21.B', { placeholder: 'Ciudad Juarez' }),
            text('fam.office.place', 'Estado de EE.UU. o país', 'U.S. state or foreign country', 'Part 3 · Item 21.C', { placeholder: 'Mexico' }),
          ],
        },
        {
          id: 'fam.abroad',
          kind: 'fields',
          formRef: 'Part 3 · Item 21.D · Foreign Address Where You Want Notification Sent',
          showIf: abroad,
          question: t('¿A qué dirección en el extranjero envían el aviso?', 'Which foreign address should the notice go to?'),
          why: t('Una dirección donde su familiar pueda recibir correo de forma segura.', 'An address where your family member can safely receive mail.'),
          fields: anyAddress('fam.abroad', 'Part 3 · Item 21.D'),
        },
        {
          id: 'fam.traveled',
          kind: 'choice',
          formRef: 'Part 3 · Item 22',
          question: t('¿Su familiar estuvo en EE.UU. antes de esa vez (una entrada anterior)?', 'Has your family member previously traveled to the United States?'),
          why: t('Si vive en EE.UU., piense en una entrada anterior a la última. Si fueron varias, dé la más reciente.', 'If they live in the U.S., think of an entry before the last one. If there were several, give the most recent.'),
          options: yesNo,
        },
        {
          id: 'fam.prevEntry',
          kind: 'fields',
          formRef: 'Part 3 · Item 22',
          showIf: is('fam.traveled', 'yes'),
          question: t('Esa entrada anterior', 'That previous entry'),
          fields: [
            text('fam.prevEntry.city', 'Ciudad de entrada', 'Place of entry: city or town', 'Part 3 · Item 22.A · City or Town', { maxLength: 20 }),
            { id: 'fam.prevEntry.state', type: 'state', required: true, label: t('Estado', 'State'), formRef: 'Part 3 · Item 22.A · State', placeholder: 'TX' },
            date('fam.prevEntry.date', 'Fecha de entrada (aproximada)', 'Date of entry', 'Part 3 · Item 22.B'),
            date('fam.prevEntry.stayExpired', 'Fecha en que vencía su permiso de estadía (si tenía)', 'Date authorized stay expired', 'Part 3 · Item 22.C', false),
            { id: 'fam.prevEntry.status', type: 'select', label: t('Estatus migratorio de esa entrada', 'Immigration status'), formRef: 'Part 3 · Item 22.D', options: STATUS_OPTIONS },
          ],
        },
        {
          id: 'fam.court',
          kind: 'choice',
          formRef: 'Part 3 · Item 23',
          question: t('¿Su familiar alguna vez tuvo un caso en corte de inmigración?', 'Has your family member ever been in immigration court proceedings?'),
          notice: legal(
            'Si su familiar tiene un caso en corte de inmigración o una orden de deportación, un abogado debe revisar el caso antes de presentar.',
            'If your family member has an immigration court case or a removal order, an attorney should review the case before you file.',
          ),
          options: yesNo,
        },
        {
          id: 'fam.courtTypes',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 3 · Item 24',
          showIf: is('fam.court', 'yes'),
          question: t('¿Qué tipo de proceso fue?', 'What type of proceedings?'),
          why: t('Elija todos los que apliquen. Si no sabe, revise los papeles de la corte o pregunte a su abogado.', 'Choose all that apply. If you do not know, check the court papers or ask your attorney.'),
          options: COURT_TYPES,
        },
        {
          id: 'fam.courtDates',
          kind: 'fields',
          formRef: 'Part 3 · Item 24',
          showIf: is('fam.court', 'yes'),
          question: t('Las fechas del proceso', 'The dates of the proceedings'),
          why: t('Ponga la fecha de cada tipo de proceso que eligió, y la de la próxima audiencia si hay una.', 'Give the date of each type you chose, and the next hearing date if there is one.'),
          fields: [
            date('fam.court.removal', 'Fecha del proceso de deportación (removal)', 'Removal date', 'Part 3 · Item 24.A', false),
            date('fam.court.exclusion', 'Fecha del proceso de exclusión', 'Exclusion date', 'Part 3 · Item 24.B', false),
            date('fam.court.deportation', 'Fecha del proceso de deportación (deportation)', 'Deportation date', 'Part 3 · Item 24.C', false),
            date('fam.court.rescission', 'Fecha del proceso de rescisión', 'Rescission date', 'Part 3 · Item 24.D', false),
            date('fam.court.nextHearing', 'Fecha de la próxima audiencia', 'Next hearing date', 'Part 3 · Item 24.E', false, 'futureDate'),
          ],
        },
        {
          id: 'fam.ead',
          kind: 'choice',
          formRef: 'Part 3 · Item 25',
          question: t('¿Su familiar va a pedir un permiso de trabajo (EAD)?', 'Is your family member requesting an Employment Authorization Document?'),
          why: t('Si contesta Sí, su familiar presenta también el Formulario I-765. Si vive fuera de EE.UU., conteste No: no puede pedirlo hasta que entre legalmente.', 'If you answer Yes, your family member also files Form I-765. If they live outside the U.S., answer No: they cannot ask for it until they are lawfully admitted.'),
          options: yesNo,
        },
      ],
    },
    {
      id: 'processing',
      part: 'Part 4',
      title: t('Antecedentes de su familiar', 'Processing information'),
      questions: [
        {
          id: 'fam.crimes',
          kind: 'yesNoList',
          formRef: 'Part 4 · Items 1.A–1.I',
          question: t('Antecedentes penales de su familiar', 'Your family member’s criminal history'),
          why: t('Cuente todo, en cualquier país, aunque el récord esté sellado o borrado.', 'Include everything, in any country, even if the record was sealed or cleared.'),
          notice: admissibility,
          items: CRIME_ITEMS,
        },
        ...rows({
          max: 5,
          id: 'fam.arrest',
          first: anyYes(CRIME_ITEMS),
          question: (i) => (i === 1 ? t('El arresto, citación, detención o acusación', 'The arrest, citation, detention or charge') : t('Otro arresto, citación o acusación', 'Another arrest, citation or charge')),
          why: (i) => (i === 1 ? t('Adjunte los documentos de la corte o de la policía de cada caso.', 'Attach the court or police records for each one.') : undefined),
          more: t('¿Hubo otro arresto, citación, detención o acusación?', 'Was there another arrest, citation, detention or charge?'),
          formRef: 'Part 4 · Item 1 · Table',
          fields: (i) => [
            text(`fam.arrest${i}.why`, 'Por qué (en inglés)', 'Why was the family member arrested, cited, detained, or charged?', `Part 4 · Item 1 · Row ${i}`, { maxLength: 60 }),
            date(`fam.arrest${i}.date`, 'Fecha', 'Date of arrest, citation, detention, charge', `Part 4 · Item 1 · Row ${i}`),
            text(`fam.arrest${i}.where`, 'Dónde (ciudad, estado, país)', 'Where (City or Town, State, Country)', `Part 4 · Item 1 · Row ${i}`, { maxLength: 45, placeholder: 'Houston, TX, USA' }),
            text(`fam.arrest${i}.outcome`, 'En qué terminó (en inglés)', 'Outcome or disposition', `Part 4 · Item 1 · Row ${i}`, { maxLength: 45, placeholder: 'Charges dismissed' }),
          ],
          overflow: t('Si contesta Sí, describa los demás en la explicación de la Parte 4, que va a la Parte 8.', 'If you answer Yes, describe the others in your Part 4 explanation, which goes to Part 8.'),
        }),
        { id: 'fam.conduct', kind: 'yesNoList', formRef: 'Part 4 · Items 2.A–2.D', question: t('Prostitución, vicios, contrabando y drogas', 'Prostitution, vice, smuggling and drugs'), why: t('Si lo/la obligaron los tratantes, conteste Sí y explíquelo: hay perdones para eso.', 'If the traffickers forced them, answer Yes and explain it: there are waivers for that.'), notice: admissibility, items: CONDUCT_ITEMS },
        { id: 'fam.security', kind: 'yesNoList', formRef: 'Part 4 · Items 3–7', question: t('Seguridad y terrorismo', 'Security and terrorism'), notice: admissibility, items: SECURITY_ITEMS },
        { id: 'fam.presence', kind: 'yesNoList', formRef: 'Part 4 · Items 8.A–8.C', question: t('¿Su familiar ha estado presente cuando hicieron daño a alguien?', 'Has your family member been present when someone was harmed?'), why: t('Conteste Sí también si la víctima fue su familiar o usted, y explíquelo.', 'Answer Yes even if the victim was your family member or you, and explain it.'), notice: admissibility, items: PRESENCE_ITEMS },
        {
          id: 'fam.removal',
          kind: 'yesNoList',
          formRef: 'Part 4 · Items 9.A–9.F',
          question: t('Procesos de inmigración de su familiar', 'Your family member’s immigration proceedings'),
          notice: legal(
            'Si su familiar tiene un caso en corte de inmigración o una orden de deportación, un abogado debe revisar el caso antes de presentar. Si le negaron una visa, explíquelo en la Parte 8.',
            'If your family member has an immigration court case or a removal order, an attorney should review the case before you file. If a visa was denied, explain it in Part 8.',
          ),
          items: REMOVAL_ITEMS,
        },
        { id: 'fam.violence', kind: 'yesNoList', formRef: 'Part 4 · Items 10–14', question: t('Violencia, grupos armados y armas', 'Violence, armed groups and weapons'), notice: admissibility, items: VIOLENCE_ITEMS },
        { id: 'fam.immigrationHistory', kind: 'yesNoList', formRef: 'Part 4 · Items 15–20', question: t('Historial migratorio de su familiar', 'Your family member’s immigration history'), why: t('Por ejemplo: documentos falsos o fraude. Si los tratantes le dieron documentos falsos, conteste Sí y explíquelo.', 'For example: false documents or fraud. If the traffickers gave them false documents, answer Yes and explain it.'), notice: admissibility, items: IMMIGRATION_ITEMS },
        { id: 'fam.health', kind: 'yesNoList', formRef: 'Part 4 · Items 21.A–21.C', question: t('Salud de su familiar', 'Your family member’s health'), notice: admissibility, items: HEALTH_ITEMS },
        {
          id: 'fam.processingExplain',
          kind: 'fields',
          formRef: 'Part 4 · Part 8',
          showIf: anyYes(PROCESSING_ITEMS),
          question: t('Explique cada Sí', 'Explain each Yes'),
          notice: legal(
            'Explique con calma y con fechas, y diga si pasó por causa de la trata. Un abogado o representante acreditado puede decirle si su familiar necesita el Formulario I-192 (perdón) y cómo explicarlo.',
            'Explain calmly and with dates, and say whether it happened because of the trafficking. An attorney or accredited representative can tell you whether your family member needs Form I-192 (waiver) and how to explain it.',
          ),
          fields: [longText('fam.processing.explain', 'Para cada Sí: el número del ítem, dónde, cuándo y qué pasó (en inglés)', 'For each Yes: item number, where, when and what happened', 'Part 8')],
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
          formRef: 'Part 5 · Item 1 · Applicant’s Statement Regarding the Interpreter',
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leerá', 'No, an interpreter will read it to me') },
          ],
        },
        { id: 'interpreterLanguage', kind: 'fields', formRef: 'Part 5 · Item 1.B', showIf: is('readsEnglish', 'B'), question: t('¿En qué idioma se lo leerán?', 'What language will it be read in?'), fields: [text('fluentLanguage', 'Idioma', 'Language', 'Part 5 · Item 1.B', { placeholder: 'Spanish' })] },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 5 · Item 2',
          question: t('¿Alguien más (no usted) preparó este suplemento?', 'Did someone else prepare this supplement for you?'),
          why: t('Si es así, sus datos van en la Parte 7 y esa persona la firma a mano.', 'If so, their details go in Part 7 and that person signs it by hand.'),
          options: yesNo,
        },
        { id: 'preparerName', kind: 'fields', formRef: 'Part 5 · Item 2', showIf: is('preparer', 'yes'), question: t('¿Quién lo preparó?', 'Who prepared it?'), fields: [text('preparer.name', 'Nombre del preparador', 'Preparer’s name', 'Part 5 · Item 2')] },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 5 · Items 3–6 · Applicant’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS de forma segura?', 'How can USCIS safely contact you?'),
          why: t('Dé solo números y correos que los tratantes no puedan ver. El teléfono seguro puede ser el de su abogado o una organización.', 'Give only phone numbers and emails the traffickers cannot see. The safe phone can be your attorney’s or an organization’s.'),
          notice: {
            tone: 'info',
            title: t('Si su familiar está en EE.UU., también firma', 'If your family member is in the U.S., they sign too'),
            body: t(
              'Su familiar debe revisar las respuestas y firmar a mano la Parte 5, Ítem 7. Sin su firma, USCIS rechaza el suplemento. Si es menor de 14 años, puede firmar su padre, madre o tutor. Si vive fuera de EE.UU., solo firma usted.',
              'Your family member must review the answers and sign Part 5, Item 7, by hand. Without their signature USCIS rejects the supplement. If they are under 14, a parent or legal guardian may sign. If they live outside the U.S., only you sign.',
            ),
          },
          fields: [
            { id: 'phone', type: 'phone', required: true, label: t('Teléfono de día', 'Daytime phone'), formRef: 'Part 5 · Items 3 and 6', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: t('Celular (si tiene)', 'Mobile phone (if any)'), formRef: 'Part 5 · Item 4' },
            { id: 'safePhone', type: 'phone', label: t('Teléfono seguro (si tiene)', 'Safe phone number (if any)'), formRef: 'Part 5 · Item 6' },
            { id: 'email', type: 'email', label: t('Correo electrónico', 'Email'), formRef: 'Part 5 · Item 5' },
          ],
        },
      ],
    },
    assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 6', preparerPart: 'Part 7' }),
  ],
};

/** Whether this is an Item 2 (danger of retaliation) filing. */
export const isItem2 = (a: Answers) => ITEM2_RELATIONS.includes(String(a['fam.relation'] ?? ''));

/** Parents, siblings and Item 2 relatives may need evidence of a danger of retaliation. */
export const mayNeedDanger = (a: Answers) => ['parent', 'sibling', ...ITEM2_RELATIONS].includes(String(a['fam.relation'] ?? ''));
