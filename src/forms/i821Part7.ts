import type { Answers, YesNoItem } from './types';

// Part 7 of Form I-821 (edition 01/20/25), the admissibility questions: every yes/no item and its
// PDF field base name. The names run two to four numbers behind the printed items (Item 8.a is
// "Part7_Item4a_YN", Item 41 is "Part7_Item41_YN"); each was matched to its item by its place on
// the page.

export interface Part7Item {
  item: string;
  es: string;
  en: string;
  /** Base name of the Yes/No pair in the PDF; the boxes export "Y" and "N". */
  field: string;
  showIf?: (a: Answers) => boolean;
}

const i = (item: string, field: string, es: string, en: string, showIf?: (a: Answers) => boolean): Part7Item => ({ item, field: `Part7_Item${field}`, es, en, showIf });

export const P7_GROUPS: { id: string; title: { es: string; en: string }; items: Part7Item[] }[] = [
  {
    id: 'crimes',
    title: { es: 'Delitos', en: 'Criminal offenses' },
    items: [
      i('8.a', '4a_YN', '¿Alguna vez lo han condenado por un delito grave (felony) cometido en EE.UU.?', 'Have you EVER been convicted of any felony committed in the United States?'),
      i('8.b', '4b_YN', '¿…por un delito menor (misdemeanor) cometido en EE.UU.?', '…any misdemeanor committed in the United States?'),
      i('8.c', '4c_YN', '¿…por un delito particularmente grave, dentro o fuera de EE.UU.?', '…any particularly serious crime committed either in or outside the United States?'),
      i('10.a', '7a_YN', '¿Alguna vez lo han condenado o ha cometido actos que constituyen un delito (que no sea puramente político)?', 'Have you EVER been convicted of or committed acts which constitute the essential elements of a crime (other than a purely political offense)?'),
      i('10.b', '7b_YN', '¿…una violación de alguna ley sobre sustancias controladas (drogas)?', '…a violation of any law relating to a controlled substance?'),
      i('10.c', '7c_YN', '¿…una conspiración para violar alguna ley sobre sustancias controladas?', '…a conspiracy to violate any law relating to a controlled substance?'),
      i('11', '8_YN', '¿Lo han condenado por dos o más delitos con penas de cárcel que suman cinco años o más?', 'Have you EVER been convicted of two or more offenses with combined sentences to confinement of five years or more?'),
      i('15.a', '13a_YN', '¿Alguna vez lo han arrestado en EE.UU. o en otro país por violar alguna ley (sin contar infracciones menores de tránsito)?', 'Have you EVER, in the United States or any other country, been arrested for breaking any law or ordinance, excluding minor traffic violations?'),
      i('15.b', '13b_YN', '¿…citado, acusado o procesado?', '…cited, charged, or indicted?'),
      i('15.c', '13c_YN', '¿…condenado, multado, encarcelado, puesto en libertad condicional o con sentencia suspendida o diferida?', '…convicted, fined, imprisoned, placed on probation, or received a suspended sentence or deferral of adjudication?'),
      i('16', '14_YN', '¿Ha recibido alguna vez un perdón, amnistía, decreto de rehabilitación u otro acto de clemencia?', 'Have you EVER been the beneficiary of a pardon, amnesty, rehabilitation decree, other act of clemency, or similar action?'),
      i('17', '15_YN', '¿Ha cometido un delito grave en EE.UU. y alegó inmunidad para no ser procesado?', 'Have you EVER committed a serious criminal offense in the United States and asserted immunity from prosecution?'),
    ],
  },
  {
    id: 'drugs',
    title: { es: 'Drogas y dinero ilícito', en: 'Drugs and illicit money' },
    items: [
      i('12.a', '9a_YN', '¿Alguna vez ha traficado o trafica ahora con sustancias controladas?', 'Have you EVER trafficked in or are you NOW trafficking in any controlled substance?'),
      i('12.b', '9b_YN', '¿Ha ayudado o conspirado a sabiendas con otros en el tráfico de drogas?', 'Have you EVER knowingly assisted, abetted, conspired, or colluded with others in drug trafficking?'),
      i('12.c', '9c_YN', '¿Es usted cónyuge o hijo/a de alguien que traficó con drogas?', 'Are you the spouse or child of an alien who unlawfully trafficked in any controlled substance?'),
      i('12.d', '9d_YN', '¿Es usted cónyuge o hijo/a de alguien que ayudó a traficar drogas?', 'Are you the spouse or child of an alien who assisted or colluded in drug trafficking?'),
      i('12.e', '9e_YN', 'En los últimos cinco años, ¿ha recibido beneficios del tráfico de drogas de su cónyuge o sus padres, sabiéndolo o debiendo saberlo?', 'Within the previous five years, have you obtained any benefit from the drug trafficking of your spouse or parents, knowing or having reason to know?'),
      i('39.a', '39a_YN', '¿Participa o ha participado en lavado de dinero?', 'Are you NOW or have you EVER engaged in money laundering?'),
      i('39.b', '39b_YN', '¿Ha ayudado o conspirado a sabiendas con otros en lavado de dinero?', 'Are you NOW or have you EVER been a knowing aider, abettor, conspirator, or colluder in money laundering?'),
    ],
  },
  {
    id: 'security',
    title: { es: 'Seguridad', en: 'Security' },
    items: [
      i('9.a', '5a_YN', '¿Alguna vez ha participado en la persecución de alguien por su raza, religión, nacionalidad, grupo social u opinión política?', 'Have you EVER participated in the persecution of any person on account of race, religion, nationality, membership in a particular social group, or political opinion?'),
      i('9.b', '5b_YN', '¿Cometió delitos graves no políticos fuera de EE.UU. antes de llegar?', 'Have you EVER committed serious nonpolitical crimes outside the United States prior to your arrival?'),
      i('9.c', '5c_YN', '¿Realiza o ha realizado actividades que lo hagan un peligro para la seguridad de EE.UU.?', 'Have you EVER or are you NOW engaged in activities that could make you a danger to the security of the United States?'),
      i('13.a', '11a_YN', '¿Ha participado o piensa participar en espionaje o sabotaje?', 'Have you EVER engaged, or do you plan to engage, in any activity to violate any law of the United States relating to espionage or sabotage?'),
      i('13.b', '11b_YN', '¿…en evadir leyes que prohíben exportar bienes, tecnología o información sensible?', '…any activity to violate or evade any law prohibiting the export of goods, technology, or sensitive information?'),
      i('13.c', '11c_YN', '¿…en cualquier otra actividad ilegal en EE.UU.?', '…any other unlawful activity in the United States?'),
      i('13.d', '11d_YN', '¿…en actividades para derrocar al gobierno de EE.UU. por la fuerza, o en una organización terrorista?', '…any activity to oppose, control, or overthrow the U.S. Government by force or unlawful means, or as a member of a terrorist organization?'),
      i('14.a', '12a_YN', '¿Participa o ha participado en actividades terroristas?', 'Have you EVER or are you NOW engaged in terrorist activities?'),
      i('14.b', '12b_YN', '¿…en actividades con consecuencias graves para la política exterior de EE.UU.?', '…activities in the U.S. with potentially serious adverse foreign policy consequences?'),
      i('14.c', '12c_YN', '¿Es o ha sido miembro de un partido comunista o totalitario (salvo de forma involuntaria)?', 'Have you EVER been or are you NOW a member of the Communist or other totalitarian party, except involuntarily?'),
      i('14.d', '12d_YN', '¿Participó en la persecución nazi o en un genocidio?', 'Have you EVER participated in Nazi persecution or genocide?'),
    ],
  },
  {
    id: 'humanRights',
    title: { es: 'Derechos humanos y grupos armados', en: 'Human rights and armed groups' },
    items: [
      i('30.a', '29a_YN', '¿Alguna vez ordenó, cometió o ayudó en actos de tortura o genocidio?', 'Have you EVER ordered, committed, or participated in acts involving torture or genocide?'),
      i('30.b', '29b_YN', '¿…en matar a una persona?', '…killing any person?'),
      i('30.c', '29c_YN', '¿…en herir gravemente a una persona a propósito?', '…intentionally and severely injuring any person?'),
      i('30.d', '29d_YN', '¿…en contacto sexual con alguien obligado o amenazado?', '…sexual contact with any person who was being forced or threatened?'),
      i('30.e', '29e_YN', '¿…en impedir que alguien practique su religión?', "…limiting or denying any person's ability to exercise religious beliefs?"),
      i('31.a', '31a_YN', '¿Ha servido o participado en una unidad militar, paramilitar, policial, de autodefensa, guerrilla o milicia?', 'Have you EVER served in or participated in any military, paramilitary, police, self-defense, vigilante, rebel, guerrilla, militia, or insurgent unit?'),
      i('31.b', '31b_YN', '¿Ha trabajado en una cárcel, campo de detención o cualquier lugar donde se detenía a personas?', 'Have you EVER served or worked in any prison, jail, detention facility, labor camp, or other place that detained persons?'),
      i('32', '32_YN', '¿Ha participado en algún grupo que usó o amenazó con usar armas contra personas?', 'Have you EVER participated in any group in which you or others used or threatened to use a weapon against any person?'),
      i('33', '33_YN', '¿Ha vendido, dado o transportado armas a alguien que sabía que las usó contra otras personas?', 'Have you EVER sold, provided, or transported weapons to anyone who to your knowledge used them against another person?'),
      i('34', '34_YN', '¿Ha recibido entrenamiento militar, paramilitar o con armas?', 'Have you EVER received any type of military, paramilitary, or weapons training?'),
      i('37.a', '37a_YN', '¿Ha reclutado o usado a menores de 15 años en un grupo armado?', 'Have you EVER recruited or used any person under 15 to serve in or help an armed force or group?'),
      i('37.b', '37b_YN', '¿Ha usado a menores de 15 años en combates?', 'Have you EVER used any person under 15 to take part in hostilities?'),
      i('40', '40a_YN', 'Como funcionario de otro gobierno, ¿fue responsable de violaciones graves a la libertad religiosa?', 'Have you EVER, as a foreign government official, been responsible for particularly severe violations of religious freedom?'),
    ],
  },
  {
    id: 'trafficking',
    title: { es: 'Trata de personas y vicios', en: 'Trafficking and vice' },
    items: [
      i('18.a', '16a_YN', 'En los últimos 10 años, ¿ha ejercido o promovido la prostitución, o lo hace ahora?', 'Have you EVER, within the past 10 years, or are you NOW engaged in prostitution or procurement of prostitution?'),
      i('18.b', '16b_YN', 'En los últimos 10 años, ¿ha conseguido o traído personas para la prostitución?', 'Within the past 10 years, have you procured or imported persons for the purpose of prostitution?'),
      i('18.c', '16c_YN', 'En los últimos 10 años, ¿ha recibido dinero de la prostitución?', 'Within the past 10 years, have you received the proceeds of prostitution?'),
      i('19', '17_YN', '¿Ha participado o piensa participar en otro vicio comercial (por ejemplo, juego ilegal)?', 'Have you EVER been or do you intend to be involved in any other commercial vice?'),
      i('38.a', '38a_YN', '¿Ha cometido o conspirado para cometer delitos de trata de personas?', 'Have you EVER committed or conspired to commit human trafficking offenses?'),
      i('38.b', '38b_YN', '¿Ha ayudado a sabiendas a un tratante de personas?', 'Have you EVER knowingly aided, abetted, or colluded with a human trafficker?'),
      i('38.c', '38c_YN', '¿Es usted cónyuge o hijo/a de alguien que cometió trata de personas?', 'Are you NOW the spouse or child of an alien who committed human trafficking offenses?'),
      i('38.d', '38d_YN', '¿Es usted (o su cónyuge o padre/madre) alguien que ayudó a un tratante de personas?', 'Are you NOW the spouse or child of, or yourself, an alien who knowingly aided a human trafficker?'),
      i('38.e', '38e_YN', 'En los últimos cinco años, ¿ha recibido beneficios de la trata de personas de su cónyuge o sus padres, sabiéndolo o debiendo saberlo?', 'Within the previous five years, have you obtained any benefit from the human trafficking of your spouse or parents, knowing or having reason to know?'),
    ],
  },
  {
    id: 'immigration',
    title: { es: 'Historial migratorio', en: 'Immigration history' },
    items: [
      i('20.a', '18a_YN', '¿Alguna vez lo deportaron de EE.UU. después de una orden de remoción?', 'Have you EVER been ordered removed and deported from the United States?'),
      i('20.b', '18b_YN', '¿Alguna vez salió voluntariamente de EE.UU. teniendo una orden de remoción?', 'Have you EVER voluntarily departed the United States under an order of removal?'),
      i('20.c', '18c_YN', 'Después de eso, ¿volvió a entrar a EE.UU. sin permiso?', 'Have you re-entered the United States unlawfully after you were deported or voluntarily departed?', (a) => a['p7.20.a'] === 'yes' || a['p7.20.b'] === 'yes'),
      i('20.d', '18d_YND', '¿El DHS restableció (reinstated) su orden de remoción anterior?', 'Has DHS reinstated your prior order of removal?', (a) => a['p7.20.c'] === 'yes'),
      i('20.e', '18e_YND', '¿Alguna vez faltó a una audiencia de inmigración sobre su admisibilidad o deportación?', 'Have you EVER failed to attend or remain in attendance at any immigration proceedings?'),
      i('21', '19_YND', '¿Alguna vez usó fraude o mintió para obtener una visa, documento, entrada a EE.UU. u otro beneficio migratorio?', 'Have you EVER, by fraud or willful misrepresentation, sought a visa, documentation, admission, or other immigration benefit?'),
      i('22', '20_YND', '¿Ha ayudado a otra persona a entrar a EE.UU. de forma ilegal?', 'Have you EVER assisted any other person to enter the United States in violation of the law?'),
      i('24', '22_YND', '¿Alguna vez entró a EE.UU. como polizón?', 'Have you EVER entered the United States as a stowaway?'),
      i('25', '23_YND', '¿Le han puesto multas civiles por hacer o usar documentos falsos para un beneficio migratorio?', 'Has INS or DHS EVER imposed civil monetary penalties on you for producing or using false documentation?'),
      i('26', '24_YND', '¿Tiene una orden final por violar la sección 274C (documentos falsos)?', 'Are you NOW subject to a final order for violation of section 274C (false documentation)?'),
      i('29', '27_YND', '¿Ha retenido fuera de EE.UU. a un niño con derecho a la ciudadanía, quitándoselo a un ciudadano con la custodia?', 'Have you EVER withheld custody of a child with a lawful claim to U.S. citizenship, outside the U.S., from a U.S. citizen granted custody?'),
      i('35', '35_YN', '¿Ha votado ilegalmente en alguna elección de EE.UU.?', 'Have you EVER unlawfully voted in a United States Federal, state, or local election?'),
      i('36', '36_YN', '¿Alguna vez dijo ser ciudadano/a de EE.UU. (por escrito o de otra forma)?', 'Have you EVER claimed to be a U.S. citizen (in writing or in any other way)?'),
      i('41', '41_YN', '¿Un juez de inmigración o la BIA determinó que usted presentó una solicitud de asilo frívola?', 'Has an immigration judge or the BIA EVER determined that you filed a frivolous asylum application?'),
    ],
  },
  {
    id: 'health',
    title: { es: 'Salud y otros', en: 'Health and other' },
    items: [
      i('23.a', '21a_YND', '¿Tiene ahora una enfermedad contagiosa de importancia para la salud pública?', 'Do you NOW have a communicable disease of public health significance?'),
      i('23.b', '21b_YND', '¿Tiene o ha tenido un trastorno físico o mental con conductas que representen un peligro para usted u otros?', 'Do you NOW have or have you EVER had a physical or mental disorder with behavior that has posed or may pose a threat to yourself or others?'),
      i('23.c', '21c_YND', '¿Es o ha sido adicto/a o abusador/a de drogas?', 'Are you NOW or have you EVER been a drug abuser or drug addict?'),
      i('27', '25_YND', '¿Practica ahora la poligamia?', 'Do you NOW practice polygamy?'),
      i('28', '26_YND', '¿Es tutor/a y acompaña a alguien inadmisible que un médico certificó como incapaz de valerse por sí mismo?', 'Are you NOW the guardian of, and accompanying, an inadmissible person certified as helpless due to sickness, disability, or infancy?'),
    ],
  },
];

export const P7_ITEMS: Part7Item[] = P7_GROUPS.flatMap((g) => g.items);

/** The Part 7 items answered Yes (and shown). */
export function flaggedI821(a: Answers): Part7Item[] {
  return P7_ITEMS.filter((it) => (!it.showIf || it.showIf(a)) && a[`p7.${it.item}`] === 'yes');
}

export const toYesNoItems = (items: Part7Item[]): YesNoItem[] =>
  items.map((it) => ({ id: `p7.${it.item}`, label: { es: it.es, en: it.en }, formRef: `Part 7 · Item ${it.item}`, showIf: it.showIf }));
