import type { Answers, Field, FormDefinition, Question, YesNoItem } from './types';
import type { T } from '../i18n';
import { all, anyAddress, date, is, nameFields, rows, sexField, yesNo } from './helpers';
import { assistanceSection } from './assistance';

// Questions follow USCIS Form I-918, Supplement A, Petition for Qualifying Family Member of U-1
// Recipient, edition 01/20/25. The PDF mapping lives in src/pdf/i918supaPdf.ts.
//
// The person filling in the app is the principal (the U visa petitioner or U-1 holder). Answer ids
// for the principal are the I-918's (`name.*`, `dob`, `aNumber`, `uscisAccount`, `phone`, `mobile`,
// `email`, `readsEnglish`, `fluentLanguage`, `preparer`, `preparer.name`), so Camino's data reuse
// fills them from the I-918. The qualifying family member (the derivative) uses the `fam.` prefix.
// One Supplement A per family member.
//
// Out of scope: Supplement B (the law enforcement certification) is signed by a police officer,
// prosecutor, judge or other certifying official for the principal's I-918; nobody fills it in
// here. Left for hand: the attorney box and USCIS-only boxes on page 1, every signature and date
// (Parts 7-10), and family members, prior spouses, other names or entries beyond the rows the PDF
// has. Part 8 (the family member's own statement and contact) is asked only when the family member
// is in the United States, as the instructions say. Parts 9 and 10 (interpreter and preparer) come
// from the shared assistance section; the interpreter and preparer sign by hand.

export const I918SUPA_EDITION = '01/20/25';

const t = (es: string, en: string): T => ({ es, en });

const text = (id: string, es: string, en: string, formRef: string, opts: Partial<Field> = {}): Field => ({ id, type: 'text', required: true, label: { es, en }, formRef, ...opts });

/** Whether a "select all that apply" answer includes a value. */
const has =
  (id: string, value: string) =>
  (a: Answers): boolean => {
    const v = a[id];
    return Array.isArray(v) && v.includes(value);
  };

const yn = (item: string, es: string, en: string): YesNoItem => ({ id: `fam.p5.${item.replace('.', '')}`, formRef: `Part 5 · Item ${item}`, label: t(es, en) });

/** Part 5, Items 1.a-1.i. */
export const FAM_CRIME_ITEMS: YesNoItem[] = [
  yn('1.a', '¿Su familiar alguna vez cometió un delito por el que no lo arrestaron?', 'Has your family member EVER committed a crime or offense for which he or she has not been arrested?'),
  yn('1.b', '¿Alguna vez lo/la arrestó, citó o detuvo la policía, inmigración o militares, por cualquier razón?', 'Has your family member EVER been arrested, cited, or detained by any law enforcement officer (including DHS, INS, and military officers) for any reason?'),
  yn('1.c', '¿Alguna vez lo/la acusaron de un delito?', 'Has your family member EVER been charged with committing any crime or offense?'),
  yn('1.d', '¿Alguna vez lo/la condenaron por un delito (aunque después lo borraran o perdonaran)?', 'Has your family member EVER been convicted of a crime or offense (even if the violation was subsequently expunged or pardoned)?'),
  yn('1.e', '¿Alguna vez estuvo en un programa alternativo o de rehabilitación (diversion, deferred prosecution, deferred adjudication)?', 'Has your family member EVER been placed in an alternative sentencing or a rehabilitative program (for example, diversion, deferred prosecution, withheld adjudication, deferred adjudication)?'),
  yn('1.f', '¿Alguna vez recibió una sentencia suspendida, libertad condicional (probation) o parole?', 'Has your family member EVER received a suspended sentence, been placed on probation, or been paroled?'),
  yn('1.g', '¿Alguna vez estuvo en la cárcel o en prisión?', 'Has your family member EVER been held in jail or prison?'),
  yn('1.h', '¿Alguna vez recibió un perdón, amnistía u otra clemencia?', 'Has your family member EVER been the beneficiary of a pardon, amnesty, rehabilitation, or other act of clemency or similar action?'),
  yn('1.i', '¿Alguna vez usó inmunidad diplomática para evitar un juicio en EE.UU.?', 'Has your family member EVER exercised diplomatic immunity to avoid prosecution for a criminal offense in the United States?'),
];

/** Part 5, Items 4-9. */
export const FAM_SECURITY_ITEMS: YesNoItem[] = [
  yn('4.a', '¿Ha practicado o piensa practicar la prostitución, o conseguir clientes para ella?', 'Engaged in, or does he or she intend to engage in, prostitution or procurement of prostitution?'),
  yn('4.b', '¿Ha participado en vicios comerciales ilegales, como apuestas ilegales?', 'Engaged in any unlawful commercialized vice, including, but not limited to, illegal gambling?'),
  yn('4.c', '¿Ha ayudado a sabiendas a alguien a entrar ilegalmente a EE.UU.?', 'Knowingly encouraged, induced, assisted, abetted, or aided any alien to try to enter the United States illegally?'),
  yn('4.d', '¿Ha traficado drogas o ayudado a traficarlas?', 'Illicitly trafficked in any controlled substance or knowingly assisted, abetted, or colluded in the illicit trafficking of any controlled substance?'),
  yn('5.a', '¿Ha cometido, planeado o ayudado a secuestrar o sabotear un avión, barco o vehículo?', 'Committed, planned or prepared, participated in, threatened to, attempted to, conspired to commit, gathered information for, or solicited funds for hijacking or sabotage of any conveyance?'),
  yn('5.b', '¿…a tomar rehenes para obligar a otros a hacer algo?', '…seizing or detaining, and threatening to kill, injure, or continue to detain, another individual in order to compel a third person to do or abstain from doing any act?'),
  yn('5.c', '¿…un asesinato político (magnicidio)?', '…assassination?'),
  yn('5.d', '¿…usar un arma de fuego para poner en peligro a personas o causar daños graves?', '…the use of any firearm with intent to endanger the safety of one or more individuals or to cause substantial damage to property?'),
  yn('5.e', '¿…usar explosivos, armas químicas, biológicas o nucleares u otras armas peligrosas?', '…the use of any biological agent, chemical agent, nuclear weapon or device, explosive, or other weapon or dangerous device?'),
  yn('6.a', '¿Ha sido miembro, apoyado o estado asociado con una organización terrorista designada?', 'Been a member of, solicited money or members for, provided support for, attended military training by or on behalf of, or been associated with a terrorist organization under section 219 of the INA?'),
  yn('6.b', '¿…con un grupo que ha secuestrado o saboteado aviones, barcos o vehículos?', '…a group that has engaged in hijacking or sabotage of any conveyance?'),
  yn('6.c', '¿…con un grupo que ha tomado rehenes?', '…a group that has engaged in seizing or detaining, and threatening to kill, injure, or continue to detain, another individual to compel a third person?'),
  yn('6.d', '¿…con un grupo que ha cometido asesinatos políticos?', '…a group that has engaged in assassination?'),
  yn('6.e', '¿…con un grupo que ha usado armas de fuego para poner en peligro a personas?', '…a group that has engaged in the use of any firearm with intent to endanger individuals or cause substantial damage to property?'),
  yn('6.f', '¿…con un grupo que ha usado explosivos u otras armas peligrosas?', '…a group that has engaged in the use of any biological agent, chemical agent, nuclear weapon or device, explosive, or other dangerous device?'),
  yn('6.g', '¿…con un grupo que pide dinero o miembros o da apoyo a una organización terrorista?', '…soliciting money or members or otherwise providing material support to a terrorist organization?'),
  yn('7.a', '¿Piensa hacer espionaje en EE.UU.?', 'Does your family member intend to engage in the United States in espionage?'),
  yn('7.b', '¿Piensa hacer actividades ilegales o para derrocar al gobierno de EE.UU.?', '…any unlawful activity, or any activity the purpose of which is in opposition to, or the control, or overthrow of the Government of the United States?'),
  yn('7.c', '¿Piensa hacer actividades de espionaje, sabotaje o exportación ilegal de tecnología o información?', '…solely, principally, or incidentally in any activity related to espionage or sabotage or to violate any law involving the export of goods, technology, or sensitive information?'),
  yn('8', '¿Ha sido miembro del Partido Comunista u otro partido totalitario (salvo que fuera obligado/a)?', 'Has your family member EVER been or does he or she continue to be a member of the Communist or other totalitarian party, except when membership was involuntary?'),
  yn('9', '¿Participó en persecuciones con el gobierno nazi de Alemania entre 1933 y 1945?', 'Has your family member EVER, during the period of March 23, 1933 to May 8, 1945, in association with the Nazi Government of Germany or any allied organization or government, ordered, incited, assisted or otherwise participated in the persecution of any person?'),
];

/** Part 5, Items 10-15. */
export const FAM_VIOLENCE_ITEMS: YesNoItem[] = [
  yn('10.a', '¿Ha ordenado, cometido o ayudado en actos de tortura o genocidio?', 'Acts involving torture or genocide?'),
  yn('10.b', '¿…en matar a alguien?', 'Killing any person?'),
  yn('10.c', '¿…en herir gravemente a alguien a propósito?', 'Intentionally and severely injuring any person?'),
  yn('10.d', '¿…en contacto sexual con alguien obligado o amenazado?', 'Engaging in any kind of sexual conduct or relations with any person who was being forced or threatened?'),
  yn('10.e', '¿…en impedir a alguien practicar su religión?', 'Limiting or denying any person’s ability to exercise religious beliefs?'),
  yn('10.f', '¿…en perseguir a alguien por su raza, religión, nacionalidad, grupo social u opinión política?', 'The persecution of any person because of race, religion, national origin, membership in a particular social group, or political opinion?'),
  yn('10.g', '¿…en sacar a alguien de su casa por la fuerza o con amenazas?', 'Displacing or moving any person from their residence by force, threat of force, compulsion, or duress?'),
  yn('11', '¿Ha animado o pedido a otra persona que haga alguno de esos actos?', 'Has your family member EVER advocated that another person commit any of the acts described in Items 10.a.-10.g., urged, or encouraged another person to commit such acts?'),
  yn('12.a', '¿Ha estado presente cuando mataron, torturaron, golpearon o hirieron a alguien a propósito?', 'Been present or nearby when any person was intentionally killed, tortured, beaten, or injured?'),
  yn('12.b', '¿…cuando sacaron a alguien de su casa por la fuerza?', '…displaced or moved from his or her residence by force, compulsion, or duress?'),
  yn('12.c', '¿…cuando obligaron a alguien a tener contacto sexual?', '…in any way compelled or forced to engage in any kind of sexual contact or relations?'),
  yn('13.a', '¿Ha servido o participado en una unidad militar, paramilitar, policial, de autodefensa, guerrilla, milicia o grupo rebelde?', 'Served in, been a member of, assisted in, or participated in any military unit, paramilitary unit, police unit, self-defense unit, vigilante unit, rebel group, guerilla group, militia, or other insurgent organization?'),
  yn('13.b', '¿Ha trabajado en una prisión, cárcel, centro de detención o campo de trabajo?', 'Served in any prison, jail, prison camp, detention facility, labor camp, or any other situation that involved detaining persons?'),
  yn('13.c', '¿Ha pertenecido a un grupo en el que él/ella u otros tenían o usaban armas?', 'Served in, been a member of, assisted in, or participated in any group, unit, or organization of any kind in which you or other persons transported, possessed, or used any type of weapon?'),
  yn('14.a', '¿Ha recibido entrenamiento militar, paramilitar o con armas?', 'Received any type of military, paramilitary, or weapons training?'),
  yn('14.b', '¿Ha pertenecido a un grupo que usó o amenazó con armas contra alguien?', 'Been a member of, assisted in, or participated in any group, unit, or organization of any kind in which you or other persons used any type of weapon against any person or threatened to do so?'),
  yn('14.c', '¿Ha vendido, dado o transportado armas a alguien que las usó contra otra persona?', 'Assisted or participated in selling or providing weapons, or in transporting weapons, to any person who to your knowledge used them against another person?'),
  yn('15.a', '¿Ha reclutado o usado a menores de 15 años en un grupo armado?', 'Recruited, enlisted, conscripted, or used any person under 15 years of age to serve in or help an armed force or group?'),
  yn('15.b', '¿Ha usado a menores de 15 años en combates?', 'Used any person under 15 years of age to take part in hostilities, or to help or provide services to people in combat?'),
];

/** Part 5, Items 16-29. */
export const FAM_IMMIGRATION_ITEMS: YesNoItem[] = [
  yn('16', '¿Está AHORA en un proceso de deportación, exclusión o rescisión?', 'Is your family member NOW in removal, exclusion, rescission, or deportation proceedings?'),
  yn('17', '¿Alguna vez le abrieron un proceso de deportación, exclusión o rescisión?', 'Has your family member EVER had removal, exclusion, rescission, or deportation proceedings initiated against him or her?'),
  yn('18', '¿Alguna vez lo/la deportaron o excluyeron de EE.UU.?', 'Has your family member EVER been removed, excluded, or deported from the United States?'),
  yn('19', '¿Alguna vez le dieron una orden de deportación o exclusión?', 'Has your family member EVER been ordered to be removed, excluded, or deported from the United States?'),
  yn('20', '¿Alguna vez le negaron una visa o la entrada a EE.UU.?', 'Has your family member EVER been denied a visa or denied admission to the United States?'),
  yn('21', '¿Alguna vez le dieron salida voluntaria y no salió a tiempo?', 'Has your family member EVER been granted voluntary departure by an immigration officer or an immigration judge and failed to depart within the allotted time?'),
  yn('22', '¿Tiene AHORA una orden o multa por usar documentos falsos (sección 274C)?', 'Is your family member NOW under a final order or civil penalty for violating section 274C of the INA (producing and/or using false documentation)?'),
  yn('23', '¿Alguna vez usó fraude o mentiras para conseguir una visa, entrada o beneficio migratorio?', 'Has your family member EVER, by fraud or willful misrepresentation of a material fact, sought to procure or procured a visa or other documentation, for entry into the United States or any immigration benefit?'),
  yn('24', '¿Alguna vez salió de EE.UU. para evitar el servicio militar?', 'Has your family member EVER left the United States to avoid being drafted into the U.S. Armed Forces or U.S. Coast Guard?'),
  yn('25', '¿Fue visitante de intercambio J con el requisito de 2 años en su país sin cumplirlo ni tener perdón?', 'Has your family member EVER been a J nonimmigrant exchange visitor who was subject to the 2-year foreign residence requirement and not yet complied with that requirement or obtained a waiver of such?'),
  yn('26', '¿Alguna vez retuvo fuera de EE.UU. a un niño ciudadano cuya custodia tenía un ciudadano de EE.UU.?', 'Has your family member EVER detained, retained, or withheld the custody of a child, having a lawful claim to United States citizenship, outside the United States from a United States citizen granted custody?'),
  yn('27', '¿Piensa practicar la poligamia en EE.UU.?', 'Does your family member plan to practice polygamy in the United States?'),
  yn('28', '¿Alguna vez entró a EE.UU. como polizón (escondido/a en un barco o avión)?', 'Has your family member EVER entered the United States as a stowaway?'),
  yn('29.a', '¿Tiene AHORA una enfermedad contagiosa de importancia para la salud pública?', 'Does your family member NOW have a communicable disease of public health significance?'),
  yn('29.b', '¿Tiene o ha tenido un trastorno físico o mental con conductas que pongan en peligro a sí mismo/a u otros?', 'Does your family member NOW have or has your family member EVER had a physical or mental disorder and behavior associated with the disorder which has posed or may pose a threat to the property, safety, or welfare of yourself or others?'),
  yn('29.c', '¿Es o ha sido adicto/a o abusador/a de drogas?', 'Is your family member NOW or has your family member EVER been a drug abuser or drug addict?'),
];

export const FAM_PROCESSING_ITEMS = [...FAM_CRIME_ITEMS, ...FAM_SECURITY_ITEMS, ...FAM_VIOLENCE_ITEMS, ...FAM_IMMIGRATION_ITEMS];

/** Part 4, Items 7.b-7.f, by the letter of each item. */
export const FAM_PROCEEDINGS: { value: string; label: T; en: string }[] = [
  { value: 'b', label: t('Deportación (removal)', 'Removal proceedings'), en: 'Removal' },
  { value: 'c', label: t('Exclusión', 'Exclusion proceedings'), en: 'Exclusion' },
  { value: 'd', label: t('Deportación (antes de 1997, "deportation")', 'Deportation proceedings'), en: 'Deportation' },
  { value: 'e', label: t('Rescisión (le quitaron la residencia)', 'Rescission proceedings'), en: 'Rescission' },
  { value: 'f', label: t('Proceso judicial', 'Judicial proceedings'), en: 'Judicial' },
];

const anyYes = (items: YesNoItem[]) => (a: Answers) => items.some((i) => a[i.id] === 'yes');
const inUS = is('fam.inUS', 'yes');
const outside = is('fam.inUS', 'no');
const office = all(outside, is('fam.notify', 'Consulate', 'Pre-Flight', 'Port of Entry'));

/** Part 9 and 10 apply when the principal or the family member used an interpreter or a preparer. */
export const usedInterpreter = (a: Answers) => a.readsEnglish === 'B' || (inUS(a) && a['fam.readsEnglish'] === 'B');
export const usedPreparer = (a: Answers) => a.preparer === 'yes' || (inUS(a) && a['fam.preparer'] === 'yes');

const legal = (es: string, en: string) => ({ tone: 'legal' as const, title: t('Hable con un abogado', 'Talk to an attorney'), body: t(es, en) });

const admissibility = legal(
  'Conteste por su familiar y diga siempre la verdad, aunque su récord esté sellado o borrado, o alguien le haya dicho que ya no existe. Un Sí no significa que le nieguen la visa U: muchas faltas se pueden perdonar con el Formulario I-192. Antes de contestar, hable con un abogado o un representante acreditado.',
  'Answer for your family member and always tell the truth, even if their record was sealed or cleared, or someone told them it no longer exists. A Yes does not mean the U visa will be denied: many grounds can be waived with Form I-192. Talk to an attorney or accredited representative before answering.',
);

/** The family member's U.S. residence (Part 3, Items 3.a-3.e): the PDF has no foreign fields here. */
const usResidence = (): Field[] =>
  anyAddress('fam.home', 'Part 3 · Item 3')
    .filter((f) => !['fam.home.province', 'fam.home.postal', 'fam.home.country'].includes(f.id))
    .map((f) => (f.id === 'fam.home.state' || f.id === 'fam.home.zip' ? { ...f, required: true, label: f.id === 'fam.home.state' ? t('Estado', 'State') : t('Código postal ZIP', 'ZIP code') } : f));

export const i918supa: FormDefinition = {
  id: 'i-918supa',
  number: 'I-918 Supplement A',
  edition: I918SUPA_EDITION,
  title: t('Suplemento A: visa U para un familiar', 'Supplement A, Petition for Qualifying Family Member of U-1 Recipient'),
  summary: {
    es: 'Si usted pide o tiene la visa U, pida que su esposo/a, hijos (y si es menor de 21, padres y hermanos) también la reciban. Uno por familiar.',
    en: 'If you are seeking or have a U visa, ask for your spouse, children (and if you are under 21, parents and siblings) to receive it too. One per family member.',
  },
  intro: {
    es: 'El Suplemento A lo llena usted, la persona que pide la visa U (o ya la tiene), para incluir a un familiar: su esposo/a, o sus hijos solteros menores de 21; si usted tiene menos de 21 años, también sus padres o sus hermanos solteros menores de 18. Se llena uno por cada familiar. Puede enviarlo junto con su I-918 (Camino usa los datos que ya dio en el I-918) o más tarde. El Suplemento B no es parte de esto: es la certificación que firma la policía, la fiscalía, un juez u otra autoridad para su I-918, y no lo llena usted ni esta app. Su caso es confidencial: la ley protege la información de usted y de su familia. Es un caso legal delicado: le recomendamos que lo revise un abogado o un representante acreditado (muchas organizaciones ayudan gratis a víctimas).',
    en: 'You, the person seeking (or holding) the U visa, complete Supplement A to include one family member: your spouse, or your unmarried children under 21; if you are under 21, also your parents or your unmarried siblings under 18. Complete one for each family member. You can file it together with your I-918 (Camino reuses what you already gave on the I-918) or later. Supplement B is not part of this: it is the certification a police officer, prosecutor, judge or other authority signs for your I-918, and neither you nor this app fills it out. Your case is confidential: the law protects your and your family’s information. It is a sensitive legal case: we recommend an attorney or accredited representative review it (many organizations help victims for free).',
  },
  minutes: 35,
  pdf: {
    path: 'forms/i-918supa.pdf',
    fileName: 'I-918SupA-filled.pdf',
    load: () => import('../pdf/i918supaPdf').then((m) => m.fillI918SupA),
    signHere: { es: 'Parte 7, Ítem 6.a (usted) y Parte 8, Ítem 6.a (su familiar, si está en EE.UU.)', en: 'Part 7, Item 6.a (you) and Part 8, Item 6.a (your family member, if in the U.S.)' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-918 que la edición {edition} del Suplemento A sigue vigente. Presentarlo no cuesta nada.',
      'Llene un Suplemento A por cada familiar. Puede enviarlo junto con su I-918 o después; si lo envía después, no hace falta repetir las pruebas que ya mandó con el I-918.',
      'Adjunte prueba del parentesco: acta de matrimonio (y prueba de que terminaron los matrimonios anteriores) o actas de nacimiento, según el familiar. Si un documento no existe, explique por qué y envíe otras pruebas (registros de iglesia o escuela, o dos declaraciones juradas). Traduzca al inglés lo que esté en otro idioma.',
      'Si contestó Sí a alguna pregunta de la Parte 5, su familiar puede necesitar el Formulario I-192 (perdón) y los documentos de la corte de cada caso. Hable con un abogado antes de enviar.',
      'Imprima el PDF. Usted firma la Parte 7, Ítem 6.a, a mano con tinta negra. Si su familiar está en EE.UU., él o ella revisa el formulario y firma la Parte 8, Ítem 6.a (si es menor o no puede firmar, firma su padre, madre o tutor). Si un intérprete o preparador ayudó, firman a mano las Partes 9 y 10. Si algo de la Parte 11 no cabe, siga en una hoja aparte con su nombre, A-Number, firma y fecha.',
      'Si su familiar está en EE.UU. y quiere permiso de trabajo, presente aparte el Formulario I-765. Si está fuera de EE.UU., no presente el I-765 todavía.',
      'Envíe el Suplemento A con su I-918 (o por separado si lo presenta después) a la dirección indicada en uscis.gov/i-918. El Suplemento B lo firma la autoridad para su I-918; no se llena uno por familiar. Si teme que alguien vea su correo, use una dirección segura.',
    ],
    en: [
      'Check at uscis.gov/i-918 that edition {edition} of Supplement A is still current. There is no fee to file it.',
      'Complete one Supplement A for each family member. You can file it with your I-918 or later; if you file it later, you do not need to resend the evidence you already sent with the I-918.',
      'Attach proof of the relationship: marriage certificate (and proof prior marriages ended) or birth certificates, depending on the family member. If a document does not exist, explain why and send other evidence (church or school records, or two sworn statements). Translate anything not in English.',
      'If you answered Yes to any Part 5 question, your family member may need Form I-192 (waiver) and the court records of each case. Talk to an attorney before filing.',
      'Print the PDF. You sign Part 7, Item 6.a, by hand in black ink. If your family member is in the U.S., they review the form and sign Part 8, Item 6.a (a parent or guardian signs for a child or someone who cannot sign). If an interpreter or preparer helped, they sign Parts 9 and 10 by hand. If something in Part 11 does not fit, continue on a separate sheet with your name, A-Number, signature and date.',
      'If your family member is in the U.S. and wants a work permit, file Form I-765 separately. If they are outside the U.S., do not file Form I-765 yet.',
      'Mail Supplement A with your I-918 (or on its own if filed later) to the address listed at uscis.gov/i-918. Supplement B is signed by the certifying agency for your I-918; there is not one per family member. If you fear someone may see your mail, use a safe address.',
    ],
  },
  sections: [
    {
      id: 'principal',
      part: 'Part 1 · Part 2',
      title: t('Usted y su familiar', 'You and your family member'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 2 · Items 1.a–1.c · Information About You (Principal)',
          question: t('Primero usted: ¿cuál es su nombre completo?', 'First, you: what is your full name?'),
          why: t('Usted es la persona que pide la visa U (o ya la tiene). Use los mismos datos que en su I-918.', 'You are the person seeking (or holding) the U visa. Use the same details as on your I-918.'),
          notice: legal(
            'La visa U es un caso legal: le recomendamos un abogado o un representante acreditado (muchas organizaciones de apoyo a víctimas ayudan gratis). La información de usted y de su familia es confidencial: la ley prohíbe que USCIS la comparta con quien le hizo daño.',
            'The U visa is a legal case: we recommend an attorney or accredited representative (many victim service organizations help for free). Your and your family’s information is confidential: the law forbids USCIS from sharing it with the person who harmed you.',
          ),
          fields: nameFields('name', 'Part 2 · Item 1'),
        },
        {
          id: 'principalInfo',
          kind: 'fields',
          formRef: 'Part 2 · Items 2–4 · Other Information',
          question: t('Sus datos', 'Your details'),
          fields: [
            date('dob', 'Su fecha de nacimiento', 'Your date of birth', 'Part 2 · Item 2'),
            { id: 'aNumber', type: 'aNumber', label: t('Su A-Number (si tiene)', 'Your A-Number (if any)'), formRef: 'Part 2 · Item 3' },
            { id: 'uscisAccount', type: 'uscisAccount', label: t('Su cuenta en línea de USCIS (si tiene)', 'Your USCIS online account number (if any)'), formRef: 'Part 2 · Item 4' },
          ],
        },
        {
          id: 'i918Status',
          kind: 'choice',
          formRef: 'Part 2 · Item 5 · Status of your Form I-918',
          question: t('¿En qué estado está su I-918?', 'What is the status of your Form I-918?'),
          why: t('Si envía este suplemento junto con su I-918, o su I-918 aún no tiene decisión, elija Pendiente.', 'If you are filing this supplement together with your I-918, or your I-918 has no decision yet, choose Pending.'),
          options: [
            { value: 'Pending', label: t('Pendiente', 'Pending') },
            { value: 'Approved', label: t('Aprobado', 'Approved') },
          ],
        },
        {
          id: 'relationship',
          kind: 'choice',
          formRef: 'Part 1 · Item 1 · Family Member’s Relationship To You',
          question: t('¿Para quién es este suplemento? Su familiar es su…', 'Who is this supplement for? Your family member is your…'),
          why: t(
            'Si usted tiene 21 años o más, puede incluir a su esposo/a y a sus hijos solteros menores de 21. Si tiene menos de 21, también a sus padres y a sus hermanos solteros menores de 18. Se cuenta la edad del día en que USCIS recibe su I-918.',
            'If you are 21 or older, you can include your spouse and unmarried children under 21. If you are under 21, also your parents and unmarried siblings under 18. Ages count on the day USCIS receives your I-918.',
          ),
          options: [
            { value: 'Spouse', label: t('Esposo/a', 'Spouse') },
            { value: 'Child', label: t('Hijo/a', 'Child') },
            { value: 'Parent', label: t('Padre o madre (si usted es menor de 21)', 'Parent (if you are under 21)') },
            { value: 'Unmarried', label: t('Hermano/a soltero/a menor de 18 (si usted es menor de 21)', 'Unmarried sibling under 18 (if you are under 21)') },
          ],
        },
      ],
    },
    {
      id: 'derivative',
      part: 'Part 3',
      title: t('Datos de su familiar', 'About your family member'),
      questions: [
        {
          id: 'famName',
          kind: 'fields',
          formRef: 'Part 3 · Items 1.a–1.c · Information About Your Qualifying Family Member',
          question: t('¿Cuál es el nombre completo de su familiar?', 'What is your family member’s full name?'),
          why: t('Su nombre legal, como en su acta de nacimiento o pasaporte. No use apodos.', 'Their legal name, as on their birth certificate or passport. Do not use a nickname.'),
          fields: nameFields('fam.name', 'Part 3 · Item 1'),
        },
        { id: 'fam.otherName.more0', kind: 'choice', formRef: 'Part 3 · Item 2 · Other Names Used', question: t('¿Su familiar ha usado otros nombres (de soltera, apodos, alias)?', 'Has your family member used other names (maiden name, nicknames, aliases)?'), options: yesNo },
        ...rows({
          max: 2,
          id: 'fam.otherName',
          first: is('fam.otherName.more0', 'yes'),
          question: (i) => (i === 1 ? t('Otro nombre que ha usado su familiar', 'Another name your family member has used') : t('Otro nombre más', 'One more name')),
          more: t('¿Ha usado otro nombre más?', 'Has your family member used another name?'),
          formRef: 'Part 3 · Item 2',
          fields: (i) => nameFields(`fam.otherName${i}`, i === 1 ? 'Part 3 · Item 2' : 'Part 11'),
          overflow: t('El segundo nombre va en la Parte 11. Si son más, escríbalos a mano en la Parte 11.', 'The second name goes in Part 11. If there are more, write them by hand in Part 11.'),
        }),
        {
          id: 'famHome',
          kind: 'fields',
          formRef: 'Part 3 · Item 3 · Residence or Intended Residence in the United States',
          question: t('¿Dónde vive o vivirá su familiar en EE.UU.?', 'Where does or will your family member live in the U.S.?'),
          why: t('Una dirección física, no un apartado postal (PO Box). Si su familiar está fuera de EE.UU., ponga dónde piensa vivir, por ejemplo con usted.', 'A physical address, not a PO Box. If your family member is outside the U.S., give where they plan to live, for example with you.'),
          fields: usResidence(),
        },
        {
          id: 'fam.mailingSame',
          kind: 'choice',
          formRef: 'Part 3 · Item 4 · Safe Mailing Address',
          question: t('¿Su familiar puede recibir correo de USCIS de forma segura en esa dirección?', 'Can your family member safely receive mail from USCIS at that address?'),
          why: t('Si la persona que les hizo daño vive ahí o puede ver el correo, conteste No y dé una dirección segura (de un familiar, una organización o su abogado). Puede ser un PO Box.', 'If the person who harmed you lives there or can see the mail, answer No and give a safe address (a relative, an organization or your attorney). It can be a PO Box.'),
          options: yesNo,
        },
        {
          id: 'famMailing',
          kind: 'fields',
          formRef: 'Part 3 · Item 4 · Safe Mailing Address',
          showIf: is('fam.mailingSame', 'no'),
          question: t('¿A qué dirección segura le envían el correo a su familiar?', 'What safe mailing address should USCIS use for your family member?'),
          fields: anyAddress('fam.mailing', 'Part 3 · Item 4', { careOf: true }),
        },
        {
          id: 'famIds',
          kind: 'fields',
          formRef: 'Part 3 · Items 5–7 · Other Information About Qualifying Family Member',
          question: t('Los números de su familiar', 'Your family member’s numbers'),
          why: t('Deje en blanco lo que no tenga.', 'Leave blank what they do not have.'),
          fields: [
            { id: 'fam.aNumber', type: 'aNumber', label: t('A-Number (si tiene)', 'A-Number (if any)'), formRef: 'Part 3 · Item 5' },
            { id: 'fam.ssn', type: 'ssn', label: t('Número de Seguro Social (si tiene)', 'U.S. Social Security number (if any)'), formRef: 'Part 3 · Item 6' },
            { id: 'fam.uscisAccount', type: 'uscisAccount', label: t('Cuenta en línea de USCIS (si tiene)', 'USCIS online account number (if any)'), formRef: 'Part 3 · Item 7' },
          ],
        },
        {
          id: 'famPersonal',
          kind: 'fields',
          formRef: 'Part 3 · Items 8–10, 12',
          question: t('Datos personales de su familiar', 'Your family member’s personal details'),
          fields: [
            date('fam.dob', 'Fecha de nacimiento', 'Date of birth', 'Part 3 · Item 8'),
            text('fam.birthCountry', 'País de nacimiento', 'Country of birth', 'Part 3 · Item 9'),
            text('fam.citizenship', 'País de ciudadanía o nacionalidad', 'Country of citizenship or nationality', 'Part 3 · Item 10'),
            sexField('fam.sex', 'Part 3 · Item 12'),
          ],
        },
        {
          id: 'fam.marital',
          kind: 'choice',
          formRef: 'Part 3 · Item 11 · Marital Status',
          question: t('¿Cuál es el estado civil de su familiar?', 'What is your family member’s marital status?'),
          options: [
            { value: 'Single', label: t('Soltero/a', 'Single') },
            { value: 'Married', label: t('Casado/a', 'Married') },
            { value: 'Divorced', label: t('Divorciado/a', 'Divorced') },
            { value: 'Widowed', label: t('Viudo/a', 'Widowed') },
          ],
        },
        {
          id: 'famDocuments',
          kind: 'fields',
          formRef: 'Part 3 · Items 13–18',
          question: t('Documentos de viaje de su familiar', 'Your family member’s travel documents'),
          why: t('Deje en blanco lo que no tenga. Si usó un pasaporte para viajar a EE.UU., póngalo aunque ya esté vencido. El I-94 es el registro de entrada.', 'Leave blank what they do not have. If they used a passport to travel to the U.S., give it even if it has expired. The I-94 is the arrival record.'),
          fields: [
            { id: 'fam.i94', type: 'i94', label: t('Número de I-94 (si tiene)', 'Form I-94 number (if any)'), formRef: 'Part 3 · Item 13' },
            text('fam.passport', 'Número de pasaporte', 'Passport number', 'Part 3 · Item 14', { required: false }),
            text('fam.travelDoc', 'Número de documento de viaje (si no es pasaporte)', 'Travel document number', 'Part 3 · Item 15', { required: false }),
            text('fam.passportCountry', 'País que lo emitió', 'Country of issuance', 'Part 3 · Item 16', { required: false }),
            date('fam.passportIssued', 'Fecha de emisión', 'Date of issuance', 'Part 3 · Item 17', false),
            date('fam.passportExpires', 'Fecha de vencimiento', 'Expiration date', 'Part 3 · Item 18', false, 'date'),
          ],
        },
      ],
    },
    {
      id: 'famEntry',
      part: 'Part 4',
      title: t('Dónde está su familiar', 'Where your family member is'),
      questions: [
        {
          id: 'fam.inUS',
          kind: 'choice',
          formRef: 'Part 4 · Items 1–4',
          question: t('¿Su familiar está ahora en EE.UU.?', 'Is your family member in the United States now?'),
          options: yesNo,
        },
        {
          id: 'famLastEntry',
          kind: 'fields',
          formRef: 'Part 4 · Items 1.a–1.d',
          showIf: inUS,
          question: t('Su última entrada a EE.UU. y su estatus actual', 'Their last entry into the U.S. and current status'),
          why: t('Si entró sin inspección, ponga el lugar aproximado y como estatus "EWI" (entered without inspection).', 'If they entered without inspection, give the approximate place and "EWI" as status.'),
          fields: [
            date('fam.lastEntry.date', 'Fecha de la última entrada', 'Date of last entry', 'Part 4 · Item 1.a'),
            text('fam.lastEntry.city', 'Ciudad de entrada', 'City or town of entry', 'Part 4 · Item 1.b', { placeholder: 'San Ysidro' }),
            { id: 'fam.lastEntry.state', type: 'state', label: t('Estado', 'State'), formRef: 'Part 4 · Item 1.c', placeholder: 'CA' },
            text('fam.currentStatus', 'Estatus migratorio actual (en inglés)', 'Current immigration status', 'Part 4 · Item 1.d', { placeholder: 'No status' }),
          ],
        },
        {
          id: 'fam.beenInUS',
          kind: 'choice',
          formRef: 'Part 4 · Items 2.a–2.e',
          showIf: outside,
          question: t('¿Su familiar ha estado antes en EE.UU.?', 'Has your family member been in the United States before?'),
          options: yesNo,
        },
        {
          id: 'famPrevEntry',
          kind: 'fields',
          formRef: 'Part 4 · Items 2.a–2.e',
          showIf: all(outside, is('fam.beenInUS', 'yes')),
          question: t('Su última entrada a EE.UU.', 'Their last entry into the U.S.'),
          fields: [
            date('fam.prevEntry.date', 'Fecha de la última entrada', 'Date of last entry', 'Part 4 · Item 2.a'),
            text('fam.prevEntry.city', 'Ciudad de entrada', 'City or town of entry', 'Part 4 · Item 2.b', { maxLength: 40 }),
            { id: 'fam.prevEntry.state', type: 'state', label: t('Estado', 'State'), formRef: 'Part 4 · Item 2.c' },
            text('fam.prevEntry.stayExpired', 'Fecha en que venció su permiso de estadía (MM/DD/AAAA, o "EWI" o "D/S")', 'Date authorized stay expired', 'Part 4 · Item 2.d', { required: false }),
            text('fam.prevEntry.status', 'Estatus al entrar (en inglés)', 'Status at the time of entry', 'Part 4 · Item 2.e', { placeholder: 'B-2 tourist' }),
          ],
        },
        {
          id: 'fam.notify',
          kind: 'choice',
          formRef: 'Part 4 · Items 3.a, 4',
          showIf: outside,
          question: t('¿A dónde quiere que avisen si aprueban el suplemento?', 'Where do you want to be notified if the supplement is approved?'),
          why: t('Normalmente el consulado de EE.UU. más cercano a su familiar, donde hará el trámite de la visa.', 'Usually the U.S. consulate nearest your family member, where they will process the visa.'),
          options: [
            { value: 'Consulate', label: t('Consulado de EE.UU.', 'U.S. Consulate') },
            { value: 'Pre-Flight', label: t('Inspección previa al vuelo (Pre-Flight Inspection)', 'Pre-Flight Inspection') },
            { value: 'Port of Entry', label: t('Puerto de entrada', 'Port-of-Entry') },
            { value: 'address', label: t('Una dirección segura en el extranjero', 'A safe foreign address') },
          ],
        },
        {
          id: 'famNotifyOffice',
          kind: 'fields',
          formRef: 'Part 4 · Items 3.b–3.d',
          showIf: office,
          question: t('¿Dónde está esa oficina?', 'Where is that office?'),
          fields: [
            text('fam.office.city', 'Ciudad', 'City or town', 'Part 4 · Item 3.b', { maxLength: 20, placeholder: 'Ciudad Juarez' }),
            { id: 'fam.office.state', type: 'state', label: t('Estado (si es en EE.UU.)', 'State (if in the U.S.)'), formRef: 'Part 4 · Item 3.c' },
            text('fam.office.country', 'País', 'Country', 'Part 4 · Item 3.d'),
          ],
        },
        {
          id: 'famForeignAddress',
          kind: 'fields',
          formRef: 'Part 4 · Item 4 · Safe Foreign Address',
          showIf: all(outside, is('fam.notify', 'address')),
          question: t('La dirección segura en el extranjero', 'The safe foreign address'),
          fields: [
            text('fam.foreign.street', 'Número y calle', 'Street number and name', 'Part 4 · Item 4.a', { maxLength: 25 }),
            { id: 'fam.foreign.unit', type: 'unit', label: t('Apartamento, suite o piso', 'Apt., suite or floor'), formRef: 'Part 4 · Item 4.b' },
            text('fam.foreign.city', 'Ciudad', 'City or town', 'Part 4 · Item 4.c', { maxLength: 20 }),
            text('fam.foreign.province', 'Provincia', 'Province', 'Part 4 · Item 4.d', { required: false, maxLength: 20 }),
            text('fam.foreign.postal', 'Código postal', 'Postal code', 'Part 4 · Item 4.e', { required: false, maxLength: 9 }),
            text('fam.foreign.country', 'País', 'Country', 'Part 4 · Item 4.f'),
          ],
        },
        {
          id: 'fam.priorSpouse.more0',
          kind: 'choice',
          formRef: 'Part 4 · Items 5–6 · Prior Spouses',
          showIf: (a) => a.relationship !== 'Unmarried',
          question: t('¿Su familiar estuvo casado/a antes (otro matrimonio que ya terminó)?', 'Was your family member married before (a marriage that has ended)?'),
          why: t('Hay que enviar la prueba de que terminó cada matrimonio anterior (divorcio o acta de defunción).', 'You must send proof that each prior marriage ended (divorce decree or death certificate).'),
          options: yesNo,
        },
        ...rows({
          max: 2,
          id: 'fam.priorSpouse',
          first: all((a) => a.relationship !== 'Unmarried', is('fam.priorSpouse.more0', 'yes')),
          question: (i) => (i === 1 ? t('Su esposo/a anterior', 'Their prior spouse') : t('Otro esposo/a anterior', 'Another prior spouse')),
          more: t('¿Tuvo otro matrimonio anterior?', 'Did they have another prior marriage?'),
          formRef: 'Part 4 · Items 5–6',
          fields: (i) => {
            const n = i + 4;
            return [
              ...nameFields(`fam.priorSpouse${i}`, `Part 4 · Item ${n}`),
              date(`fam.priorSpouse${i}.ended`, 'Fecha en que terminó el matrimonio', 'Date marriage ended', `Part 4 · Item ${n}.d`),
              text(`fam.priorSpouse${i}.where`, 'Dónde terminó (ciudad, país)', 'Where did the marriage end?', `Part 4 · Item ${n}.e`, { placeholder: 'Guatemala City, Guatemala' }),
              text(`fam.priorSpouse${i}.how`, 'Cómo terminó (en inglés)', 'How did the marriage end?', `Part 4 · Item ${n}.f`, { placeholder: 'Divorce' }),
            ];
          },
          overflow: t('Si hubo más, escríbalos a mano en la Parte 11.', 'If there were more, write them by hand in Part 11.'),
        }),
        {
          id: 'fam.proceedings',
          kind: 'choice',
          formRef: 'Part 4 · Item 7.a',
          question: t('¿Su familiar está o estuvo alguna vez en un proceso de inmigración (corte de inmigración)?', 'Was your family member ever, or are they now, in immigration proceedings?'),
          options: yesNo,
        },
        {
          id: 'fam.proceedingsTypes',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 4 · Items 7.b–7.f',
          showIf: is('fam.proceedings', 'yes'),
          question: t('¿Qué tipo de proceso? Marque todos los que apliquen.', 'What type of proceedings? Select all that apply.'),
          notice: legal(
            'Si su familiar tiene un caso en corte de inmigración o una orden de deportación, un abogado debe revisar el caso antes de presentar.',
            'If your family member has an immigration court case or a removal order, an attorney should review the case before you file.',
          ),
          options: FAM_PROCEEDINGS.map(({ value, label }) => ({ value, label })),
        },
        ...FAM_PROCEEDINGS.map(
          (p): Question => ({
            id: `famProceedingsDate.${p.value}`,
            kind: 'fields',
            formRef: `Part 4 · Item 7.${p.value}`,
            showIf: all(is('fam.proceedings', 'yes'), has('fam.proceedingsTypes', p.value)),
            question: t(`Fecha del proceso: ${p.label.es.toLowerCase()}`, `${p.en} date`),
            why: t('Ponga la fecha de la decisión (MM/DD/AAAA). Si el proceso sigue abierto, escriba "Current".', 'Give the date of action (MM/DD/YYYY). If still in proceedings, write "Current".'),
            fields: [text(`fam.proceedings.${p.value}`, 'Fecha, o "Current" si sigue abierto', 'Date, or "Current"', `Part 4 · Item 7.${p.value}`, { placeholder: 'Current', maxLength: 10 })],
          }),
        ),
        {
          id: 'famProceedingsExplain',
          kind: 'fields',
          formRef: 'Part 4 · Item 7 · Part 11',
          showIf: is('fam.proceedings', 'yes'),
          question: t('Explique el caso de inmigración de su familiar', 'Explain your family member’s immigration proceedings'),
          fields: [{ id: 'fam.proceedings.explain', type: 'longText', required: true, label: t('Dónde, cuándo y en qué quedó (en inglés)', 'Where, when and the outcome'), formRef: 'Part 11' }],
        },
        {
          id: 'fam.ead',
          kind: 'choice',
          formRef: 'Part 4 · Item 8 · Employment Authorization Document',
          showIf: inUS,
          question: t('¿Su familiar quiere un permiso de trabajo (EAD)?', 'Would your family member like an Employment Authorization Document?'),
          why: t('Si contesta Sí, presente aparte el Formulario I-765. El permiso solo se da después de que aprueben el suplemento.', 'If you answer Yes, file Form I-765 separately. The permit is only issued after the supplement is approved.'),
          options: yesNo,
        },
      ],
    },
    {
      id: 'famProcessing',
      part: 'Part 5',
      title: t('Antecedentes de su familiar', 'Your family member’s background'),
      questions: [
        {
          id: 'famCrimes',
          kind: 'yesNoList',
          formRef: 'Part 5 · Items 1.a–1.i',
          question: t('Antecedentes penales de su familiar', 'Your family member’s criminal history'),
          why: t('Cuente todo, en cualquier país, aunque el récord esté sellado o borrado.', 'Include everything, in any country, even if the record was sealed or cleared.'),
          notice: admissibility,
          items: FAM_CRIME_ITEMS,
        },
        ...rows({
          max: 2,
          id: 'fam.arrest',
          first: anyYes(FAM_CRIME_ITEMS.slice(1)),
          question: (i) => (i === 1 ? t('Su arresto, citación, detención o acusación', 'Their arrest, citation, detention or charge') : t('Otro arresto, citación o acusación', 'Another arrest, citation or charge')),
          why: (i) => (i === 1 ? t('Adjunte los documentos de la corte o de la policía de cada caso.', 'Attach the court or police records for each one.') : undefined),
          more: t('¿Hubo otro arresto, citación, detención o acusación?', 'Was there another arrest, citation, detention or charge?'),
          formRef: 'Part 5 · Items 2–3',
          fields: (i) => {
            const n = i + 1;
            return [
              text(`fam.arrest${i}.why`, 'Por qué (en inglés)', 'Why was your family member arrested, cited, detained, or charged?', `Part 5 · Item ${n}.a`),
              date(`fam.arrest${i}.date`, 'Fecha', 'Date', `Part 5 · Item ${n}.b`),
              text(`fam.arrest${i}.city`, 'Ciudad', 'City or town', `Part 5 · Item ${n}.c`, { maxLength: 20 }),
              { id: `fam.arrest${i}.state`, type: 'state', label: t('Estado (si es en EE.UU.)', 'State (if in the U.S.)'), formRef: `Part 5 · Item ${n}.d` },
              text(`fam.arrest${i}.country`, 'País', 'Country', `Part 5 · Item ${n}.e`),
              text(`fam.arrest${i}.outcome`, 'En qué terminó (en inglés)', 'Outcome or disposition', `Part 5 · Item ${n}.f`, { placeholder: 'Charges dismissed' }),
            ];
          },
          overflow: t('Si contesta Sí, explique los demás en la explicación de la Parte 5, que va a la Parte 11.', 'If you answer Yes, describe the others in your Part 5 explanation, which goes to Part 11.'),
        }),
        { id: 'famSecurity', kind: 'yesNoList', formRef: 'Part 5 · Items 4–9', question: t('Otras actividades de su familiar', 'Your family member’s other activities'), notice: admissibility, items: FAM_SECURITY_ITEMS },
        { id: 'famViolence', kind: 'yesNoList', formRef: 'Part 5 · Items 10–15', question: t('Violencia, grupos armados y armas', 'Violence, armed groups and weapons'), notice: admissibility, items: FAM_VIOLENCE_ITEMS },
        {
          id: 'famImmigrationHistory',
          kind: 'yesNoList',
          formRef: 'Part 5 · Items 16–29',
          question: t('Historial migratorio y salud de su familiar', 'Your family member’s immigration history and health'),
          why: t('Por ejemplo: deportaciones, visas negadas, documentos falsos o enfermedades.', 'For example: removals, denied visas, false documents or health conditions.'),
          notice: admissibility,
          items: FAM_IMMIGRATION_ITEMS,
        },
        {
          id: 'famProcessingExplain',
          kind: 'fields',
          formRef: 'Part 5 · Part 11',
          showIf: anyYes(FAM_PROCESSING_ITEMS),
          question: t('Explique cada Sí', 'Explain each Yes'),
          notice: legal(
            'Explique con calma y con fechas. Un abogado o representante acreditado puede decirle si su familiar necesita el Formulario I-192 (perdón) y cómo explicarlo.',
            'Explain calmly and with dates. An attorney or accredited representative can tell you whether your family member needs Form I-192 (waiver) and how to explain it.',
          ),
          fields: [{ id: 'fam.processing.explain', type: 'longText', required: true, label: t('Para cada Sí: el número del ítem, dónde, cuándo y qué pasó (en inglés)', 'For each Yes: item number, where, when and what happened'), formRef: 'Part 11' }],
        },
      ],
    },
    {
      id: 'famFamily',
      part: 'Part 6',
      title: t('Esposo/a e hijos de su familiar', 'Your family member’s spouse and children'),
      questions: [
        {
          id: 'fam.relative.more0',
          kind: 'choice',
          formRef: 'Part 6 · Information About Your Qualifying Family Member’s Spouse and/or Children',
          question: t('¿Su familiar tiene esposo/a o hijos?', 'Does your family member have a spouse or children?'),
          why: t('Por ejemplo, si el suplemento es para su hijo/a, ponga aquí a los hijos de su hijo/a (sus nietos). Si es para su esposo/a, a los hijos de él o ella, también los que tienen con usted.', 'For example, if the supplement is for your child, list your child’s children here. If it is for your spouse, list their children, including the ones you have together.'),
          options: yesNo,
        },
        ...rows({
          max: 3,
          id: 'fam.relative',
          first: is('fam.relative.more0', 'yes'),
          question: (i) => (i === 1 ? t('Su esposo/a o hijo/a', 'Their spouse or child') : t('Otro esposo/a o hijo/a', 'Another spouse or child')),
          more: t('¿Tiene otro esposo/a o hijo/a?', 'Do they have another spouse or child?'),
          formRef: 'Part 6 · Items 1–12',
          fields: (i) => {
            const n = (i - 1) * 4 + 1;
            return [
              ...nameFields(`fam.relative${i}`, `Part 6 · Item ${n}`),
              date(`fam.relative${i}.dob`, 'Fecha de nacimiento', 'Date of birth', `Part 6 · Item ${n + 1}`),
              text(`fam.relative${i}.birthCountry`, 'País de nacimiento', 'Country of birth', `Part 6 · Item ${n + 2}`),
              text(`fam.relative${i}.relationship`, 'Relación con su familiar (en inglés)', 'Relationship', `Part 6 · Item ${n + 3}`, { placeholder: 'Son' }),
            ];
          },
          overflow: t('Si son más de 3, escríbalos a mano en la Parte 11.', 'If there are more than 3, write them by hand in Part 11.'),
        }),
      ],
    },
    {
      id: 'statements',
      part: 'Part 7 · Part 8',
      title: t('Declaraciones y contacto', 'Statements and contact'),
      questions: [
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 7 · Item 1 · Petitioner’s Statement',
          question: t('Usted: ¿puede leer y entender el formulario en inglés?', 'You: can you read and understand the form in English?'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leerá', 'No, an interpreter will read it to me') },
          ],
        },
        { id: 'interpreterLanguage', kind: 'fields', formRef: 'Part 7 · Item 1.b', showIf: is('readsEnglish', 'B'), question: t('¿En qué idioma se lo leerán?', 'What language will it be read in?'), fields: [text('fluentLanguage', 'Idioma', 'Language', 'Part 7 · Item 1.b', { placeholder: 'Spanish' })] },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 7 · Item 2',
          question: t('¿Alguien más (no usted) preparó este suplemento?', 'Did someone else prepare this supplement for you?'),
          why: t('Si es así, esa persona también llena y firma la Parte 10.', 'If so, that person also completes and signs Part 10.'),
          options: yesNo,
        },
        { id: 'preparerName', kind: 'fields', formRef: 'Part 7 · Item 2', showIf: is('preparer', 'yes'), question: t('¿Quién lo preparó?', 'Who prepared it?'), fields: [text('preparer.name', 'Nombre del preparador', 'Preparer’s name', 'Part 7 · Item 2')] },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 7 · Items 3–5 · Petitioner’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS de forma segura?', 'How can USCIS safely contact you?'),
          why: t('Dé solo números y correos que la persona que le hizo daño no pueda ver.', 'Give only phone numbers and emails the person who harmed you cannot see.'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: t('Teléfono de día', 'Daytime phone'), formRef: 'Part 7 · Item 3', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: t('Celular', 'Mobile phone'), formRef: 'Part 7 · Item 4' },
            { id: 'email', type: 'email', label: t('Correo electrónico', 'Email'), formRef: 'Part 7 · Item 5' },
          ],
        },
        {
          id: 'fam.readsEnglish',
          kind: 'choice',
          formRef: 'Part 8 · Item 1 · Qualifying Family Member’s Statement',
          showIf: inUS,
          question: t('Su familiar: ¿puede leer y entender el formulario en inglés?', 'Your family member: can they read and understand the form in English?'),
          why: t('Como su familiar está en EE.UU., debe revisar este suplemento y firmar la Parte 8. Si es un niño/a, firma por él o ella su padre, madre o tutor.', 'Because your family member is in the U.S., they must review this supplement and sign Part 8. For a child, a parent or guardian signs.'),
          options: [
            { value: 'A', label: t('Sí, lee inglés', 'Yes, they read English') },
            { value: 'B', label: t('No, un intérprete se lo leerá', 'No, an interpreter will read it to them') },
          ],
        },
        { id: 'famInterpreterLanguage', kind: 'fields', formRef: 'Part 8 · Item 1.b', showIf: all(inUS, is('fam.readsEnglish', 'B')), question: t('¿En qué idioma se lo leerán a su familiar?', 'What language will it be read to them in?'), fields: [text('fam.fluentLanguage', 'Idioma', 'Language', 'Part 8 · Item 1.b', { placeholder: 'Spanish' })] },
        {
          id: 'fam.preparer',
          kind: 'choice',
          formRef: 'Part 8 · Item 2',
          showIf: inUS,
          question: t('¿Alguien más preparó el suplemento a pedido de su familiar?', 'Did someone else prepare the supplement at your family member’s request?'),
          why: t('Por ejemplo, el mismo abogado o preparador que le ayudó a usted.', 'For example, the same attorney or preparer who helped you.'),
          options: yesNo,
        },
        { id: 'famPreparerName', kind: 'fields', formRef: 'Part 8 · Item 2', showIf: all(inUS, is('fam.preparer', 'yes')), question: t('¿Quién lo preparó?', 'Who prepared it?'), fields: [text('fam.preparer.name', 'Nombre del preparador', 'Preparer’s name', 'Part 8 · Item 2')] },
        {
          id: 'famContact',
          kind: 'fields',
          formRef: 'Part 8 · Items 3–5 · Qualifying Family Member’s Contact Information',
          showIf: inUS,
          question: t('¿Cómo puede USCIS contactar a su familiar de forma segura?', 'How can USCIS safely contact your family member?'),
          why: t('Si es un niño/a, puede poner el teléfono de usted o de quien lo cuida.', 'For a child, you can give your phone or their caregiver’s.'),
          fields: [
            { id: 'fam.phone', type: 'phone', required: true, label: t('Teléfono de día', 'Daytime phone'), formRef: 'Part 8 · Item 3' },
            { id: 'fam.mobile', type: 'phone', label: t('Celular', 'Mobile phone'), formRef: 'Part 8 · Item 4' },
            { id: 'fam.email', type: 'email', label: t('Correo electrónico', 'Email'), formRef: 'Part 8 · Item 5' },
          ],
        },
      ],
    },
    assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 9', preparerPart: 'Part 10' }),
  ],
};
