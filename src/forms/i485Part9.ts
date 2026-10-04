import type { Answers, YesNoItem } from './types';

// Part 9 of Form I-485 (edition 09/18/26), General Eligibility and Inadmissibility Grounds:
// every yes/no item, its PDF field base name and the page it is printed on. The PDF names do not
// follow the item numbers (Item 14 is "Pt8Line18_YesNo", Item 65 is "Pt9Line67_YesNo"); each was
// matched to its item by its place on the page.

export interface Part9Item {
  item: string;
  es: string;
  en: string;
  /** Base name of the Yes/No pair in the PDF; the boxes export "Y" and "N". */
  field: string;
  page: number;
  /** Whether a Yes needs an explanation in Part 14. */
  explain: boolean;
  showIf?: (a: Answers) => boolean;
}

const yes = (id: string) => (a: Answers) => a[`p9.${id}`] === 'yes';

const i = (item: string, field: string, page: number, es: string, en: string, opts: { explain?: boolean; showIf?: (a: Answers) => boolean } = {}): Part9Item => ({
  item,
  es,
  en,
  field: field.endsWith('YesNo') ? field : `${field}_YesNo`,
  page,
  explain: opts.explain ?? true,
  showIf: opts.showIf,
});

export const P9_GROUPS: { id: string; title: { es: string; en: string }; why?: { es: string; en: string }; items: Part9Item[] }[] = [
  {
    id: 'organizations',
    title: { es: 'Organizaciones', en: 'Organizations' },
    items: [
      i('1', 'Pt8Line1', 13, '¿Alguna vez ha sido miembro o ha estado asociado/a con alguna organización, fundación, partido, club, sociedad o grupo, en EE.UU. o en otro país?', 'Have you EVER been a member of, involved in, or associated with any organization, fund, foundation, party, club, society, or similar group in the United States or elsewhere?', { explain: false }),
    ],
  },
  {
    id: 'immigrationHistory',
    title: { es: 'Historial migratorio', en: 'Immigration history' },
    items: [
      i('10', 'Pt9Line10', 14, '¿Alguna vez le han negado la entrada a EE.UU.?', 'Have you EVER been denied admission to the United States?'),
      i('11', 'Pt9Line11', 14, '¿Alguna vez le han negado una visa para EE.UU.?', 'Have you EVER been denied a visa to the United States?'),
      i('12', 'Pt9Line12', 14, '¿Alguna vez ha trabajado en EE.UU. sin autorización?', 'Have you EVER worked in the United States without authorization?'),
      i('13', 'Pt8Line13', 14, '¿Alguna vez ha violado los términos o condiciones de su estatus de no inmigrante?', 'Have you EVER violated the terms or conditions of your nonimmigrant status?'),
      i('14', 'Pt8Line18', 14, '¿Está o ha estado alguna vez en un proceso de remoción, exclusión, rescisión o deportación, incluida la remoción expedita?', 'Are you presently or have you EVER been in removal, exclusion, rescission, or deportation proceedings, including expedited removal?'),
      i('15', 'Pt8Line19', 14, '¿Alguna vez ha recibido una orden final de exclusión, deportación o remoción?', 'Have you EVER been issued a final order of exclusion, deportation, or removal?'),
      i('16', 'Pt8Line20', 14, '¿Alguna vez le restablecieron una orden anterior de exclusión, deportación o remoción?', 'Have you EVER had a prior final order of exclusion, deportation, or removal reinstated?'),
      i('17', 'Pt8Line17', 14, '¿Alguna vez le dieron salida voluntaria y no salió en el plazo?', 'Have you EVER been granted voluntary departure but failed to depart within the allotted time?'),
      i('18', 'Pt8Line23', 14, '¿Alguna vez ha pedido algún alivio o protección contra la remoción, exclusión o deportación?', 'Have you EVER applied for any kind of relief or protection from removal, exclusion, or deportation?'),
      i('19', 'Pt8Line24a', 14, '¿Alguna vez fue visitante de intercambio J sujeto al requisito de residencia de dos años en su país?', 'Have you EVER been a J nonimmigrant exchange visitor who was subject to the two-year foreign residence requirement?'),
      i('20', 'Pt8Line24b', 14, '¿Cumplió con el requisito de residencia en su país?', 'Have you complied with the foreign residence requirement?', { explain: false, showIf: yes('19') }),
      i('21', 'Pt8Line24c', 14, '¿Le dieron una exención (waiver) o una carta de recomendación favorable del Departamento de Estado?', 'Have you been granted a waiver or has the Department of State issued a favorable waiver recommendation letter for you?', {
        explain: false,
        showIf: (a) => a['p9.19'] === 'yes' && a['p9.20'] === 'no',
      }),
    ],
  },
  {
    id: 'crimes',
    title: { es: 'Delitos', en: 'Criminal acts' },
    why: {
      es: 'Responda Sí si aplica, aunque su récord se haya sellado o borrado, o alguien (incluso un juez o un abogado) le haya dicho que ya no tiene récord. Incluye hechos en cualquier país.',
      en: 'Answer Yes if it applies, even if your records were sealed or cleared, or anyone (even a judge or attorney) told you that you no longer have a record. Includes acts in any country.',
    },
    items: [
      i('22', 'Pt8Line22', 14, '¿Alguna vez lo/la han arrestado, citado, acusado, detenido o puesto en un programa de desvío (diversion) por cualquier motivo?', 'Have you EVER been arrested, cited, charged, or permitted to participate in a diversion program, or detained for any reason by any law enforcement official?'),
      i('23', 'Pt9Line23', 15, '¿Alguna vez ha cometido un delito de cualquier tipo (aunque no lo arrestaran ni juzgaran)?', 'Have you EVER committed a crime of any kind (even if you were not arrested, cited, charged with, or tried for that crime)?'),
      i('24', 'Pt9Line24', 15, '¿Alguna vez se ha declarado culpable o lo/la han condenado por un delito (aunque se haya borrado o perdonado)?', 'Have you EVER pled guilty to or been convicted of a crime or offense (even if expunged, sealed, or pardoned)?'),
      i('25', 'Pt8Line25', 15, '¿Alguna vez un juez lo/la castigó o le impuso condiciones (cárcel, sentencia suspendida, arresto domiciliario, libertad condicional, tratamiento, servicio comunitario)?', 'Have you EVER been ordered punished by a judge or had conditions imposed on you that restrained your liberty (prison, suspended sentence, house arrest, parole, treatment, community service)?'),
      i('26', 'Pt8Line26', 15, '¿Alguna vez ha violado alguna ley de sustancias controladas (drogas)?', 'Have you EVER violated (or attempted or conspired to violate) any controlled substance law or regulation?'),
      i('27', 'Pt8Line27', 15, '¿Alguna vez ha traficado drogas o se ha beneficiado de ello, o ha ayudado a hacerlo?', 'Have you EVER trafficked in or benefited from, or aided or colluded in, the illegal trafficking of any controlled substances?'),
      i('28', 'Pt8Line28', 15, '¿Es cónyuge o hijo/a de alguien que traficó drogas y en los últimos 5 años recibió algún beneficio de eso?', 'Are you the spouse, son, or daughter of an alien who illicitly trafficked a controlled substance and you obtained, within the last 5 years, any financial or other benefit from this activity?'),
      i('29', 'Pt8Line29', 15, '¿Sabía o debió saber que ese beneficio venía de esa actividad?', 'Did you know or should you have reasonably known that the benefit resulted from this activity of your spouse or parent?', { showIf: yes('28') }),
      i('30', 'Pt8Line30', 15, '¿Alguna vez ha participado en la prostitución, o viene a EE.UU. a hacerlo?', 'Have you EVER engaged in prostitution or are you coming to the United States to engage in prostitution?'),
      i('31', 'Pt8Line31', 15, '¿Alguna vez ha conseguido o traído personas para la prostitución?', 'Have you EVER procured or attempted to procure, or imported prostitutes or persons for the purpose of prostitution?'),
      i('32', 'Pt8Line32', 15, '¿Alguna vez ha recibido dinero de la prostitución?', 'Have you EVER received any proceeds or money from prostitution?'),
      i('33', 'Pt8Line33', 15, '¿Piensa participar en apuestas ilegales u otro vicio comercializado en EE.UU.?', 'Do you intend to engage in illegal gambling or any other form of commercialized vice while in the United States?'),
      i('34', 'Pt8Line34', 15, '¿Alguna vez ha usado inmunidad (diplomática u otra) para evitar un juicio penal en EE.UU.?', 'Have you EVER exercised immunity (diplomatic or otherwise) to avoid being prosecuted for a criminal offense in the United States?'),
      i('35.a', 'Pt8Line35a', 15, '¿Alguna vez ha sido funcionario/a de un gobierno extranjero?', 'Have you EVER served as a foreign government official?', { explain: false }),
      i('35.b', 'Pt8Line35b', 15, 'Como funcionario/a, ¿fue responsable de violaciones a la libertad religiosa?', 'Have you EVER been responsible for, enforced, or directly carried out violations of religious freedoms?', { showIf: yes('35.a') }),
      i('36', 'Pt8Line36', 15, '¿Alguna vez ha participado en la trata de personas con fines sexuales?', 'Have you EVER induced by force, fraud, or coercion (or otherwise been involved in) the trafficking of another person for commercial sex acts?'),
      i('37', 'Pt8Line37', 15, '¿Alguna vez ha sometido a una persona a servidumbre, trabajo forzado o esclavitud?', 'Have you EVER trafficked a person into involuntary servitude, peonage, debt bondage, or slavery?'),
      i('38', 'Pt8Line38', 16, '¿Alguna vez ha ayudado a otros en la trata de personas?', 'Have you EVER knowingly aided, abetted, assisted, conspired, or colluded with others in trafficking in persons?'),
      i('39', 'Pt9Line39', 16, '¿Es cónyuge o hijo/a de alguien que hizo trata de personas y en los últimos 5 años recibió algún beneficio de eso?', 'Are you the spouse, son, or daughter of an alien who engaged in trafficking in persons and have received or obtained, within the last 5 years, any benefits from this activity?'),
      i('40', 'Pt8Line40', 16, '¿Sabía o debió saber que ese beneficio venía de esa actividad?', 'Did you know or reasonably should have known that this benefit resulted from this activity?', { showIf: yes('39') }),
      i('41', 'Pt8Line41', 16, '¿Alguna vez ha participado o ayudado en el lavado de dinero, o quiere entrar a EE.UU. para hacerlo?', 'Have you EVER engaged in money laundering, aided others in it, or do you seek to enter the United States to engage in it?'),
    ],
  },
  {
    id: 'security',
    title: { es: 'Seguridad', en: 'Security' },
    items: [
      i('42.a', 'Pt8Line42\\.a', 16, '¿Piensa hacer espionaje o sabotaje en EE.UU.?', 'Do you intend to engage in any activity that violates or evades any law relating to espionage or sabotage in the United States?'),
      i('42.b', 'Pt8Line42\\.b', 16, '¿Piensa violar las leyes que prohíben exportar bienes, tecnología o información sensible?', 'Do you intend to engage in any activity that violates or evades any law prohibiting the export of goods, technology, or sensitive information?'),
      i('42.c', 'Pt8Line42c', 16, '¿Piensa oponerse o derrocar al gobierno de EE.UU. por la fuerza o de forma ilegal?', 'Do you intend to engage in any activity to oppose, control, or overthrow the U.S. Government by force, violence, or other unlawful means?'),
      i('42.d', 'Pt8Line42d', 16, '¿Piensa participar en cualquier otra actividad ilegal?', 'Do you intend to engage in any other unlawful activity?'),
      i('43.a', 'Pt8Line43a', 16, '¿Alguna vez ha recibido entrenamiento con armas, paramilitar o de tipo militar?', 'Have you EVER received any weapons training, paramilitary training, or other military-type training?'),
      i('43.b', 'Pt8Line43b', 16, '¿Alguna vez ha cometido secuestro, asesinato, o secuestro o sabotaje de un avión, barco o vehículo?', 'Have you EVER committed kidnapping, assassination, or hijacking or sabotage of a conveyance?'),
      i('43.c', 'Pt8Line43c', 16, '¿Alguna vez ha usado un arma o explosivo para poner en peligro a personas o causar daños?', 'Have you EVER used a weapon or explosive with the intent to endanger the safety of another person or cause damage to property?'),
      i('43.d', 'Pt8Line43d', 16, '¿Alguna vez ha amenazado, intentado o planeado alguna de esas cosas?', 'Have you EVER threatened, attempted, conspired, prepared, or planned to do any of those things?'),
      i('43.e', 'Pt8Line43e', 16, '¿Alguna vez ha incitado a otros a hacerlas, con intención de causar muerte o daño grave?', 'Have you EVER incited, with intent to cause death or serious bodily harm, any of those activities?'),
      i('43.f', 'Pt8Line43fYesNo', 16, '¿Alguna vez ha sido parte de un grupo que hizo alguna de esas cosas?', 'Have you EVER participated in, or been a member of, a group or organization that did any of those activities?'),
      i('43.g', 'Pt8Line43g', 16, '¿Alguna vez ha reclutado miembros o pedido dinero para un grupo así?', 'Have you EVER recruited members or asked for money or things of value for such a group?'),
      i('43.h', 'Pt8Line43h', 16, '¿Alguna vez ha dado dinero, servicios o apoyo para esas actividades?', 'Have you EVER provided money, services, labor, or other support for any of those activities?'),
      i('43.i', 'Pt8Line43i', 16, '¿Alguna vez ha dado dinero, servicios o apoyo a una persona o grupo que hizo esas cosas?', 'Have you EVER provided money, services, labor, or other support to an individual, group, or organization who did any of those activities?'),
      i('44', 'Pt8Line44', 16, '¿Piensa participar en alguna de esas actividades?', 'Do you intend to engage in any of those activities?'),
      i('45', 'Pt8Line45', 16, '¿Piensa hacer algo que ponga en peligro la seguridad de EE.UU.?', 'Do you intend to engage in any activity that could endanger the welfare, safety, or security of the United States?'),
      i('46', 'Pt8Line46', 17, '¿Es cónyuge o hijo/a de alguien que alguna vez hizo alguna de esas actividades?', 'Are you the spouse or child of an individual who EVER engaged in any of those activities?'),
      i('47', 'Pt8Line47', 17, '¿Alguna vez ha vendido, dado o transportado armas sabiendo que se usarían contra alguien?', 'Have you EVER sold, provided, or transported weapons, which you knew or believed would be used against another person?'),
      i('48', 'Pt8Line48', 17, '¿Alguna vez ha trabajado en una cárcel, campo de prisioneros, centro de detención u otro lugar donde se detenía a personas?', 'Have you EVER worked, volunteered, or served in any prison, jail, prison camp, detention facility, labor camp, or any other place where people were detained?'),
      i('49', 'Pt8Line49', 17, '¿Alguna vez ha participado en un grupo que usó armas contra personas o amenazó con hacerlo?', 'Have you EVER been a member of, assisted, or participated in any group in which you or others used any type of weapon against any person or threatened to do so?'),
      i('50', 'Pt8Line50', 17, '¿Alguna vez ha servido o participado en una unidad militar o de policía?', 'Have you EVER served in, been a member of, assisted, or participated in any military or police unit?'),
      i('51', 'Pt8Line51', 17, '¿Alguna vez ha participado en un grupo armado (paramilitar, autodefensa, guerrilla, rebeldes)?', 'Have you EVER served in, been a member of, assisted, or participated in any armed group (paramilitary, self-defense, vigilante, rebel, or guerrilla group)?'),
      i('52', 'Pt8Line52', 17, '¿Alguna vez ha sido miembro o afiliado del Partido Comunista u otro partido totalitario?', 'Have you EVER been a member of, or affiliated with, the Communist Party or any totalitarian party?'),
      i('53.a', 'Pt8Line53a', 17, '¿Alguna vez ha ordenado, cometido o ayudado en actos de tortura?', 'Have you EVER ordered, committed, assisted, or otherwise participated in torture?'),
      i('53.b', 'Pt8Line53b', 17, '¿… genocidio?', '… genocide?'),
      i('53.c', 'Pt8Line53c', 17, '¿… matar o intentar matar a alguien?', '… killing, or trying to kill, any person?'),
      i('53.d', 'Pt8Line53d', 17, '¿… herir gravemente o intentar herir a alguien a propósito?', '… intentionally and severely injuring or trying to injure any person?'),
      i('54', 'Pt8Line54', 17, '¿Alguna vez ha reclutado o usado a menores de 15 años en un grupo armado?', 'Have you EVER recruited, enlisted, conscripted, or used any person under 15 years of age to serve in or help an armed force or group?'),
      i('55', 'Pt8Line55', 17, '¿Alguna vez ha usado a menores de 15 años en combate o para apoyar un combate?', 'Have you EVER used any person under 15 years of age to take part in hostilities?'),
    ],
  },
  {
    id: 'violations',
    title: { es: 'Entradas ilegales y otras violaciones', en: 'Illegal entries and other violations' },
    items: [
      i('65', 'Pt9Line67', 20, '¿Alguna vez dejó de ir o de quedarse en una audiencia de remoción desde el 1 de abril de 1997?', 'Have you EVER failed or refused to attend or to remain in attendance at any removal proceeding filed against you on or after April 1, 1997?'),
      i('66', 'Pt9Line68', 20, '¿Alguna vez ha presentado documentos falsos o alterados para obtener un beneficio migratorio?', 'Have you EVER submitted altered, fraudulent, or counterfeit documentation to obtain or attempt to obtain any immigration benefit?'),
      i('67', 'Pt9Line69', 20, '¿Alguna vez ha mentido u ocultado información para obtener una visa, la entrada o un beneficio migratorio?', 'Have you EVER lied about, concealed, or misrepresented any information to obtain a visa, admission, or any other immigration benefit?'),
      i('68', 'Pt9Line70', 20, '¿Alguna vez ha dicho falsamente que es ciudadano/a de EE.UU.?', 'Have you EVER falsely claimed to be a U.S. citizen (in writing or any other way)?'),
      i('69', 'Pt9Line71', 20, '¿Alguna vez ha llegado a EE.UU. como polizón en un barco o avión?', 'Have you EVER been a stowaway on a vessel or aircraft arriving in the United States?'),
      i('70', 'Pt9Line72', 20, '¿Alguna vez ha ayudado a alguien a entrar o intentar entrar ilegalmente a EE.UU.?', 'Have you EVER knowingly encouraged, induced, assisted, abetted, or aided any alien to enter or to try to enter the United States illegally?'),
      i('71', 'Pt9Line73', 20, '¿Tiene una orden final de multa civil por usar documentos falsos (INA 274C)?', 'Are you under a final order of civil penalty for violating INA section 274C for use of fraudulent documents?'),
      i('72', 'Pt9Line74', 20, '¿Alguna vez lo/la han excluido, deportado o removido, o salió por su cuenta después de tener una orden de remoción?', 'Have you EVER been excluded, deported, or removed, or departed on your own after having been ordered excluded, deported, or removed?'),
      i('73', 'Pt9Line75', 20, '¿Alguna vez ha entrado a EE.UU. sin ser inspeccionado/a y admitido/a o con parole?', 'Have you EVER entered the United States without being inspected and admitted or paroled?'),
      i('74', 'Pt9Line76', 20, 'Desde el 1 de abril de 1997, ¿ha estado en EE.UU. sin permiso (después de vencer su estadía o sin haber sido admitido/a)?', 'Since April 1, 1997, have you been unlawfully present in the United States?'),
      i('75', 'Pt9Line77', 21, '¿Fue la trata de personas una razón central de su presencia ilegal?', 'Was a severe form of trafficking in persons at least one central reason for your unlawful presence in the United States?', { explain: false, showIf: yes('74') }),
      i('76.a', 'Pt9Line78a', 21, 'Desde el 1 de abril de 1997, ¿ha vuelto a entrar o intentado entrar sin inspección después de estar más de un año sin permiso en EE.UU.?', 'Since April 1, 1997, have you EVER reentered or attempted to reenter without inspection after having been unlawfully present for more than one year in the aggregate?'),
      i('76.b', 'Pt9Line78b', 21, '¿… después de haber sido deportado/a, excluido/a o removido/a?', '… after having been deported, excluded, or removed from the United States?'),
    ],
  },
  {
    id: 'misc',
    title: { es: 'Otras conductas', en: 'Miscellaneous conduct' },
    items: [
      i('77', 'Pt9Line79', 21, '¿Piensa practicar la poligamia en EE.UU.?', 'Do you plan to practice polygamy in the United States?'),
      i('78', 'Pt9Line80', 21, '¿Acompaña a una persona inadmisible que, por enfermedad, discapacidad o ser menor, necesita su cuidado?', 'Are you accompanying an inadmissible alien who requires your protection or guardianship because of sickness, disability, or infancy?'),
      i('79', 'Pt9Line81', 21, '¿Alguna vez ha retenido a un niño ciudadano de EE.UU. fuera del país, quitándoselo a quien tenía la custodia?', 'Have you EVER assisted in detaining, retaining, or withholding custody of a U.S. citizen child outside the United States from a person granted custody?'),
      i('80', 'Pt9Line82', 21, '¿Alguna vez ha votado violando alguna ley de EE.UU.?', 'Have you EVER voted in violation of any Federal, state, or local law in the United States?'),
      i('81', 'Pt9Line83', 21, '¿Alguna vez ha renunciado a la ciudadanía de EE.UU. para evitar impuestos?', 'Have you EVER renounced U.S. citizenship to avoid being taxed by the United States?'),
      i('82.a', 'Pt9Line84a', 21, '¿Alguna vez ha pedido exención del servicio militar de EE.UU. por ser extranjero/a?', 'Have you EVER applied for exemption or discharge from training or service in the U.S. armed forces on the ground that you are an alien?'),
      i('82.b', 'Pt9Line84b', 21, '¿Lo/la eximieron o dieron de baja por ser extranjero/a?', 'Have you EVER been relieved or discharged from such training or service on the ground that you are an alien?'),
      i('82.c', 'Pt9Line84c', 21, '¿Alguna vez lo/la condenaron por desertar de las fuerzas armadas de EE.UU.?', 'Have you EVER been convicted of desertion from the U.S. armed forces?'),
      i('83', 'Pt9Line85', 21, '¿Alguna vez salió o se quedó fuera de EE.UU. para evitar el servicio militar en tiempo de guerra o emergencia nacional?', 'Have you EVER left or remained outside the United States to avoid or evade training or service in the U.S. armed forces in time of war or national emergency?'),
    ],
  },
];

export const P9_ITEMS: Part9Item[] = P9_GROUPS.flatMap((g) => g.items);

/** The Part 9 answers, in form order, that need an explanation in Part 14. */
export function flaggedI485(a: Answers): Part9Item[] {
  return P9_ITEMS.filter((it) => it.explain && a[`p9.${it.item}`] === 'yes');
}

export const toYesNoItems = (items: Part9Item[]): YesNoItem[] =>
  items.map((it) => ({ id: `p9.${it.item}`, label: { es: it.es, en: it.en }, formRef: `Part 9 · Item ${it.item}`, showIf: it.showIf }));
