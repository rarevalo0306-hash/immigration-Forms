import type { T } from '../i18n';
import type { FormMeta } from '../forms/catalog';

/**
 * The search box on the home screen: the person names a form ("i-765", "n400") or describes
 * their situation in their own words ("me casé con un ciudadano", "se me perdió la green card"),
 * and Camino recommends a package or form, saying why. It runs on the device, with plain word
 * rules: no data leaves the phone.
 */

export type Target = { kind: 'package' | 'form'; id: string } | { kind: 'study' };

export interface Recommendation {
  target: Target;
  /** Why it was chosen, in the person's terms. */
  reason: T;
}

/** Lowercase, no accents, no punctuation: "Me casé con un CIUDADANO!" → "me case con un ciudadano". */
export const plain = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

interface Rule {
  /** Every group must match (one of its words or phrases), as whole-word prefixes. */
  all: RegExp[];
  /** If any of these match, the rule doesn't apply. */
  not?: RegExp[];
  target: Target;
  reason: T;
}

const w = (...words: string[]) => new RegExp(`\\b(${words.join('|')})`);

const MARRIAGE = w('case', 'casad', 'casarme', 'casar', 'casamos', 'matrimonio', 'boda', 'married', 'marry', 'marriage', 'espos', 'novi', 'prometid', 'fiance', 'wife', 'husband', 'pareja', 'spouse');
const CITIZEN = w('ciudadan', 'citizen', 'americana', 'americano', 'gringa', 'gringo', 'estadounidense');
const ABROAD = w('fuera', 'afuera', 'otro pais', 'mi pais', 'vive en mexico', 'vive en', 'consulado', 'abroad', 'outside', 'embajada');
const GREEN_CARD = w('green card', 'greencard', 'tarjeta de residen', 'mica', 'residencia permanente', 'permanent resident card');

const RULES: Rule[] = [
  {
    all: [w('maltrat', 'abus', 'golpe', 'violencia domestica', 'domestic violence', 'vawa')],
    target: { kind: 'form', id: 'i-360' },
    reason: { es: 'Habló de abuso o maltrato: la petición VAWA (I-360) permite pedir la residencia por su cuenta, sin depender de quien le hace daño.', en: 'You mentioned abuse: the VAWA petition (I-360) lets you apply on your own, without depending on the abuser.' },
  },
  {
    all: [w('trata', 'trafica', 'trafficking', 'trabajo forzado', 'forced labor', 'me obligaron')],
    target: { kind: 'form', id: 'i-914' },
    reason: { es: 'Habló de trata o trabajo forzado: la visa T (I-914) protege a víctimas de trata de personas.', en: 'You mentioned trafficking or forced labor: the T visa (I-914) protects trafficking victims.' },
  },
  {
    all: [w('victima', 'victim', 'delito', 'crimen', 'crime', 'asalt', 'robaron a mi', 'me atacaron', 'visa u')],
    target: { kind: 'form', id: 'i-918' },
    reason: { es: 'Habló de ser víctima de un delito: la visa U (I-918) es para víctimas que ayudaron a la policía.', en: 'You mentioned being a crime victim: the U visa (I-918) is for victims who helped the police.' },
  },
  {
    all: [w('novi', 'prometid', 'fiance', 'comprometid'), CITIZEN, ABROAD],
    target: { kind: 'package', id: 'prometido' },
    reason: { es: 'Su pareja vive fuera y aún no se casan: la visa de prometido/a (K-1) le permite venir a casarse.', en: 'Your partner lives abroad and you are not married yet: the fiancé(e) visa (K-1) lets them come to marry.' },
  },
  {
    all: [MARRIAGE, CITIZEN, ABROAD],
    not: [w('quedarme', 'aqui', 'stay here')],
    target: { kind: 'package', id: 'consulado' },
    reason: { es: 'Su pareja es ciudadana y usted está fuera de EE.UU.: el trámite se hace por el consulado.', en: 'Your partner is a citizen and you are outside the U.S.: the case goes through the consulate.' },
  },
  {
    all: [MARRIAGE, CITIZEN],
    target: { kind: 'package', id: 'matrimonio' },
    reason: { es: 'Su pareja es ciudadana y usted quiere quedarse en EE.UU.: después de casarse, la petición y la residencia se envían juntas.', en: 'Your partner is a citizen and you want to stay in the U.S.: after the wedding, the petition and the green card application go together.' },
  },
  {
    all: [w('condicion', 'conditional', '2 anos', 'dos anos', 'quitar las condiciones', 'remove conditions')],
    target: { kind: 'form', id: 'i-751' },
    reason: { es: 'Su residencia es condicional (de 2 años): el I-751 quita las condiciones.', en: 'Your green card is conditional (2 years): Form I-751 removes the conditions.' },
  },
  {
    all: [GREEN_CARD, w('perd', 'robar', 'robo', 'renov', 'venc', 'expir', 'lost', 'stolen', 'renew', 'danad', 'error', 'reemplaz', 'replace', 'nueva')],
    not: [w('condicion', '2 anos', 'dos anos')],
    target: { kind: 'form', id: 'i-90' },
    reason: { es: 'Quiere renovar o reemplazar su tarjeta de residente: eso es el I-90.', en: 'You want to renew or replace your green card: that is Form I-90.' },
  },
  {
    all: [w('ciudadan', 'citizen', 'naturaliz', 'n-400', 'n400')],
    not: [MARRIAGE, w('hijo', 'hija', 'certificado', 'certificate')],
    target: { kind: 'package', id: 'ciudadania' },
    reason: { es: 'Quiere hacerse ciudadano/a: la solicitud de naturalización es el N-400.', en: 'You want to become a citizen: the naturalization application is Form N-400.' },
  },
  {
    all: [w('hijo', 'hija', 'child'), w('certificado', 'certificate', 'ciudadan', 'citizen')],
    target: { kind: 'form', id: 'n-600' },
    reason: { es: 'Para un hijo o hija de ciudadano: el N-600 pide el certificado de ciudadanía.', en: 'For a citizen’s child: Form N-600 requests the certificate of citizenship.' },
  },
  {
    all: [w('examen', 'test', 'estudiar', 'study', 'preguntas de civica', 'civics', 'entrevista de ciudadania')],
    target: { kind: 'study' },
    reason: { es: 'Para prepararse para el examen de ciudadanía: preguntas oficiales, tarjetas y simulacro.', en: 'To prepare for the citizenship test: official questions, flash cards and a practice interview.' },
  },
  {
    all: [w('asilo', 'asylum', 'persegu', 'amenaz', 'miedo de regresar', 'miedo a regresar', 'refugi', 'persecution')],
    target: { kind: 'package', id: 'asilo' },
    reason: { es: 'Tiene miedo de regresar a su país: el asilo (I-589) es la protección para eso.', en: 'You are afraid to return to your country: asylum (Form I-589) is the protection for that.' },
  },
  { all: [w('daca', 'dreamer', 'dream act')], target: { kind: 'package', id: 'daca' }, reason: { es: 'Para DACA: se renueva con el I-821D y el permiso de trabajo.', en: 'For DACA: renew with Form I-821D and the work permit.' } },
  { all: [w('tps', 'estatus de proteccion temporal', 'temporary protected')], target: { kind: 'package', id: 'tps' }, reason: { es: 'Para TPS: el I-821 y el permiso de trabajo.', en: 'For TPS: Form I-821 and the work permit.' } },
  {
    all: [w('mude', 'mudanza', 'mudo', 'moved', 'move', 'cambio de direccion', 'cambie de direccion', 'nueva direccion', 'new address', 'change of address')],
    target: { kind: 'package', id: 'mudanza' },
    reason: { es: 'Se mudó: hay que avisar a USCIS en 10 días, y a la corte si tiene un caso ahí.', en: 'You moved: tell USCIS within 10 days, and the court if you have a case there.' },
  },
  {
    all: [w('permiso de trabajo', 'trabajar', 'work permit', 'ead', 'autorizacion de empleo', 'employment authorization', 'i-765', 'i765')],
    target: { kind: 'form', id: 'i-765' },
    reason: { es: 'Quiere un permiso de trabajo: eso es el I-765.', en: 'You want a work permit: that is Form I-765.' },
  },
  {
    all: [w('viaj', 'salir del pais', 'travel', 'advance parole', 'permiso de viaje', 'reentry', 'reingreso')],
    target: { kind: 'form', id: 'i-131' },
    reason: { es: 'Quiere viajar fuera de EE.UU. y regresar: el permiso de viaje es el I-131.', en: 'You want to travel abroad and come back: the travel document is Form I-131.' },
  },
  {
    all: [w('deport', 'removido', 'removal order', 'orden de deportacion'), w('volver', 'regresar', 'return', 'reingres')],
    target: { kind: 'form', id: 'i-212' },
    reason: { es: 'Lo deportaron y quiere volver: el I-212 pide permiso para solicitar de nuevo la entrada.', en: 'You were deported and want to return: Form I-212 asks permission to reapply.' },
  },
  {
    all: [w('corte', 'juez', 'court', 'judge', 'eoir')],
    target: { kind: 'form', id: 'eoir-33' },
    reason: { es: 'Tiene un caso en corte de inmigración: el EOIR-33 avisa a la corte su dirección nueva.', en: 'You have an immigration court case: Form EOIR-33 tells the court your new address.' },
  },
  {
    all: [w('perdon', 'waiver', 'presencia ilegal', 'unlawful presence', 'castigo')],
    target: { kind: 'form', id: 'i-601a' },
    reason: { es: 'Necesita un perdón por presencia ilegal antes de la entrevista consular: eso es el I-601A.', en: 'You need a waiver for unlawful presence before the consular interview: that is Form I-601A.' },
  },
  {
    all: [w('pedir a mi', 'pedir a', 'traer a mi', 'peticion para mi', 'petition for my', 'bring my'), w('mama', 'madre', 'papa', 'padre', 'hijo', 'hija', 'herman', 'mother', 'father', 'son', 'daughter', 'brother', 'sister', 'familia')],
    target: { kind: 'form', id: 'i-130' },
    reason: { es: 'Quiere pedir a un familiar: la petición familiar es el I-130.', en: 'You want to petition for a relative: that is Form I-130.' },
  },
  {
    all: [w('extender', 'extension', 'extend', 'cambiar de visa', 'cambiar mi estatus', 'change status', 'turista', 'estudiante')],
    target: { kind: 'form', id: 'i-539' },
    reason: { es: 'Quiere extender o cambiar su visa temporal: eso es el I-539.', en: 'You want to extend or change your temporary visa: that is Form I-539.' },
  },
  {
    all: [w('i-94', 'i94', 'registro de entrada')],
    target: { kind: 'form', id: 'i-102' },
    reason: { es: 'Su I-94 se perdió o tiene un error: el I-102 pide uno nuevo.', en: 'Your I-94 was lost or has an error: Form I-102 asks for a new one.' },
  },
  {
    all: [w('no puedo pagar', 'exencion', 'fee waiver', 'sin dinero', 'gratis', 'no tengo dinero')],
    target: { kind: 'form', id: 'i-912' },
    reason: { es: 'No puede pagar la tarifa: el I-912 pide la exención.', en: 'You can’t pay the fee: Form I-912 requests a fee waiver.' },
  },
  {
    all: [w('certificado de naturalizacion', 'certificado de ciudadania', 'certificate of naturalization'), w('perd', 'robar', 'robo', 'lost', 'dañ', 'reemplaz', 'replace')],
    target: { kind: 'form', id: 'n-565' },
    reason: { es: 'Perdió o dañó su certificado de ciudadanía: el N-565 lo reemplaza.', en: 'You lost or damaged your citizenship certificate: Form N-565 replaces it.' },
  },
  {
    all: [w('patrocin', 'sponsor', 'affidavit', 'mantener', 'carta de sosten', 'apoyo economico')],
    target: { kind: 'form', id: 'i-864' },
    reason: { es: 'Para patrocinar económicamente a un familiar: la declaración de patrocinio es el I-864.', en: 'To financially sponsor a relative: the affidavit of support is Form I-864.' },
  },
];

/** A typed form number: "I-765", "i765", "n 400", "eoir 33". */
function byNumber(q: string, forms: FormMeta[]): FormMeta | undefined {
  const compact = q.replace(/[\s-]/g, '');
  return forms.find((f) => {
    const n = f.number.toLowerCase().replace(/[\s-]|\/ic|supplement|suplemento/g, '');
    return compact === n || compact === f.id.replace(/-/g, '');
  });
}

const reasonFor = (f: FormMeta): T => ({ es: `Usted buscó el ${f.number}: ${f.title.es}.`, en: `You searched for ${f.number}: ${f.title.en}.` });

/**
 * The best match and a few alternatives. Situation rules win; then a typed form number; then
 * forms whose title or summary contain the words searched.
 */
export function recommend(query: string, forms: FormMeta[]): { best?: Recommendation; more: Recommendation[] } {
  const q = plain(query);
  if (q.length < 2) return { more: [] };
  const out: Recommendation[] = [];
  const add = (r: Recommendation) => {
    const key = JSON.stringify(r.target);
    if (!out.some((x) => JSON.stringify(x.target) === key)) out.push(r);
  };
  const number = byNumber(q, forms);
  if (number) add({ target: { kind: 'form', id: number.id }, reason: reasonFor(number) });
  for (const r of RULES) if (r.all.every((re) => re.test(q)) && !r.not?.some((re) => re.test(q))) add({ target: r.target, reason: r.reason });
  const words = q.split(' ').filter((x) => x.length > 3);
  if (words.length) {
    const scored = forms
      .map((f) => {
        const hay = plain(`${f.number} ${f.title.es} ${f.title.en} ${f.summary.es} ${f.summary.en}`);
        return { f, score: words.filter((x) => hay.includes(x)).length };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
    for (const { f } of scored) add({ target: { kind: 'form', id: f.id }, reason: { es: f.summary.es, en: f.summary.en } });
  }
  const [best, ...more] = out;
  return { best, more: more.slice(0, 4) };
}
