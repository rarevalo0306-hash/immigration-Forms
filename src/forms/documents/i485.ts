import type { DocItem } from './types';
import type { Answers } from '../types';
import { birthCert, courtRecords, fee, idCopy, marriageCert, photos, priorMarriagesEnded, translations } from './common';
import { is, num } from '../helpers';

// From the I-485 instructions (edition 09/18/26): "What Evidence Must You Submit with Form I-485?" (items 1–14),
// the Affidavit of Support section and the additional instructions for each category.
export const formId = 'i-485';

const cat = (...c: string[]) => is('category', ...c);
const vawa = cat('vawa-spouse', 'vawa-child', 'vawa-parent');
const family = cat('ir-spouse', 'ir-child', 'ir-parent', 'k1', 'widow', 'f1', 'f3', 'f4', 'f2a-spouse', 'f2a-child', 'f2b');
const anyYes = (...ids: string[]) => (a: Answers) => ids.some((id) => a[id] === 'yes');

export const docs: DocItem[] = [
  fee,
  photos(2),
  {
    ...idCopy,
    label: { es: 'Copia de una identificación del gobierno con foto', en: 'Copy of a government-issued photo ID' },
    detail: { es: 'Por ejemplo, su pasaporte (aunque esté vencido), licencia de manejar o identificación militar.', en: 'For example, your passport (even if expired), driver’s license or military ID.' },
  },
  {
    ...birthCert,
    detail: {
      es: 'Del registro civil de su país, con el nombre de al menos uno de sus padres. Si es asilado/a o refugiado/a, envíela solo si la tiene.',
      en: 'From the civil registry in your country, listing at least one parent. If you are an asylee or refugee, send it only if you have it.',
    },
  },
  {
    id: 'admissionProof',
    label: { es: 'Prueba de cómo entró a EE.UU. la última vez', en: 'Proof of how you last entered the U.S.' },
    detail: {
      es: 'Copia de la página del pasaporte con el sello de entrada o parole, de la visa, o su I-94 (se descarga en i94.cbp.dhs.gov). No hace falta para asilados, VAWA o la sección 245(i).',
      en: 'A copy of the passport page with the admission or parole stamp, the visa, or your I-94 (download it at i94.cbp.dhs.gov). Not needed for asylees, VAWA or section 245(i).',
    },
    when: (a) => !cat('asylee')(a) && !vawa(a) && a.section245i !== 'yes',
  },
  {
    id: 'petitionNotice',
    label: { es: 'Copia del recibo o aprobación de la petición (I-797)', en: 'Copy of the petition receipt or approval notice (I-797)' },
    detail: {
      es: 'Del I-130, I-129F, I-360 o I-140 en que se basa su caso, o envíe la petición junto con este I-485. Si es derivado/a, el I-797 o la green card del solicitante principal.',
      en: 'For the I-130, I-129F, I-360 or I-140 your case is based on, or file the petition together with this I-485. If you are a derivative, the principal applicant’s I-797 or green card.',
    },
    when: (a) => !cat('asylee', 'refugee', 'cuban', 'dv')(a),
  },
  {
    ...marriageCert,
    detail: {
      es: 'Del registro civil donde se casaron. Si entró con visa K-1, debe mostrar que se casó con quien lo pidió dentro de los 90 días.',
      en: 'From the civil registry where you married. If you entered on a K-1 visa, it must show you married your petitioner within 90 days.',
    },
    when: (a) => cat('ir-spouse', 'f2a-spouse', 'k1', 'widow')(a) || (a.applicantType === 'derivative' && is('marital', 'married', 'separated')(a)),
  },
  { ...priorMarriagesEnded, when: (a) => num(a, 'timesMarried') > 1 },
  {
    id: 'principalRelationship',
    label: { es: 'Prueba de parentesco con el solicitante principal', en: 'Proof of your relationship to the principal applicant' },
    detail: {
      es: 'Si es hijo/a y su acta de nacimiento no muestra al principal como su padre o madre: el acta de matrimonio de sus padres o el certificado de adopción.',
      en: 'If you are a child and your birth certificate doesn’t show the principal as your parent: your parents’ marriage certificate or your adoption certificate.',
    },
    when: is('applicantType', 'derivative'),
  },
  {
    id: 'lawfulStatusProof',
    label: { es: 'Pruebas de que siempre mantuvo un estatus legal en EE.UU.', en: 'Proof you always kept a lawful status in the U.S.' },
    detail: {
      es: 'Por cada entrada y estadía: sus I-94, los I-797 de extensiones o cambios de estatus, y el I-20 o DS-2019 si fue estudiante o de intercambio.',
      en: 'For every entry and stay: your I-94s, the I-797s for extensions or changes of status, and your I-20 or DS-2019 if you were a student or exchange visitor.',
    },
    when: cat('f1', 'f3', 'f4', 'f2a-spouse', 'f2a-child', 'f2b', 'dv', 'other'),
  },
  {
    id: 'i693',
    label: { es: 'El examen médico de inmigración (Formulario I-693)', en: 'The immigration medical exam (Form I-693)' },
    detail: {
      es: 'Lo llena y firma un médico autorizado por USCIS (civil surgeon), en un sobre sellado. Búsquelo en uscis.gov/findadoctor.',
      en: 'Completed and signed by a USCIS-designated civil surgeon, in a sealed envelope. Find one at uscis.gov/findadoctor.',
    },
  },
  {
    id: 'i864',
    label: { es: 'La declaración de patrocinio (Formulario I-864) de quien lo pidió', en: 'Your petitioner’s affidavit of support (Form I-864)' },
    detail: { es: 'Con sus pruebas de ingresos (por ejemplo, la última declaración de impuestos). Camino también llena el I-864.', en: 'With their proof of income (for example, the latest tax return). Camino fills in Form I-864 too.' },
    when: (a) => a.affidavitExemption === '5' || (!a.affidavitExemption && family(a)),
  },
  {
    id: 'asylumGranted',
    label: { es: 'Prueba de que le otorgaron asilo', en: 'Proof you were granted asylum' },
    detail: { es: 'La carta de aprobación de USCIS o la orden del juez de inmigración.', en: 'The USCIS approval notice or the immigration judge’s order.' },
    when: cat('asylee'),
  },
  {
    id: 'refugeeProof',
    label: { es: 'Prueba de su estatus de refugiado/a', en: 'Proof of your refugee status' },
    detail: { es: 'Su I-94 de refugiado/a o su documento de viaje de refugiado (I-571).', en: 'Your refugee I-94 or your Refugee Travel Document (Form I-571).' },
    when: cat('refugee'),
  },
  {
    id: 'cubanProof',
    label: { es: 'Pruebas para el Ajuste Cubano', en: 'Evidence for the Cuban Adjustment Act' },
    detail: {
      es: 'Su pasaporte o acta de nacimiento cubana (o certificado de nacionalidad), y pruebas de que lleva al menos un año en EE.UU. Si es derivado/a: prueba de parentesco y de que vive con el principal.',
      en: 'Your Cuban passport or birth certificate (or nationality certificate), and proof you have been in the U.S. at least one year. If a derivative: proof of the relationship and that you live with the principal.',
    },
    when: cat('cuban'),
  },
  {
    id: 'jVisaDocs',
    label: { es: 'Documentos de su visa J de intercambio', en: 'Your J exchange visitor documents' },
    detail: {
      es: 'Copias de sus DS-2019, visas J, I-94 y sellos de entrada, y prueba de que cumplió los 2 años en su país o de que le dieron la exención.',
      en: 'Copies of your DS-2019s, J visas, I-94s and entry stamps, and proof you met the 2-year home residence requirement or got a waiver.',
    },
    when: anyYes('p9.19'),
  },
  {
    ...courtRecords,
    detail: {
      es: 'Por cada arresto, cargo o condena en cualquier país: el reporte de arresto, el documento de cargos y el resultado final certificados, y prueba de que cumplió la sentencia. También si se borró. Un abogado debe revisarlas antes de enviar.',
      en: 'For every arrest, charge or conviction anywhere: the certified arrest report, charging document and final disposition, and proof you completed the sentence. Also if it was expunged. An attorney should review them before you file.',
    },
    when: anyYes('p9.22', 'p9.23', 'p9.24', 'p9.25', 'p9.26'),
  },
  translations,
];
