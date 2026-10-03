import type { DocItem } from './types';
import { fee, passportCopy, translations } from './common';
import { is } from '../helpers';

// From the I-102 instructions: "What Evidence Must You Submit?" (General Requirements A-E) and Part 1, Items 16 and 19.
export const formId = 'i-102';

const lost = is('reason', 'a', 'b');

export const docs: DocItem[] = [
  fee,
  {
    id: 'idCopy',
    label: { es: 'Copia de una identificación del gobierno (frente y reverso)', en: 'Copy of a government-issued ID (front and back)' },
    detail: { es: 'Que muestre su nombre legal y su fecha de nacimiento.', en: 'Showing your legal name and date of birth.' },
  },
  {
    ...passportCopy,
    label: { es: 'Copia de la página de datos de su pasaporte y del sello de entrada', en: 'Copy of your passport data page and the admission stamp' },
    detail: {
      es: 'La página que muestra cómo lo admitieron. Si no la tiene, envíe otra prueba de su entrada y una explicación de por qué no puede darla.',
      en: 'The page showing how you were admitted. If you don’t have it, send other proof of your entry and an explanation of why you can’t provide it.',
    },
    when: is('reason', 'a', 'b', 'e'),
  },
  {
    id: 'policeReport',
    label: { es: 'Copia del reporte de policía del robo (si lo tiene)', en: 'Copy of the police report for the theft (if you have it)' },
    detail: {
      es: 'Si se lo robaron y no hay reporte, escriba una explicación de lo que pasó y por qué no hay reporte.',
      en: 'If it was stolen and there is no report, write an explanation of what happened and why there is no report.',
    },
    when: lost,
  },
  {
    id: 'originalI94',
    label: { es: 'Su I-94, I-94W o I-95 original', en: 'Your original Form I-94, I-94W or I-95' },
    detail: { es: 'El dañado, o el que tiene el error.', en: 'The mutilated one, or the one with the error.' },
    when: is('reason', 'c', 'd', 'f'),
  },
  {
    id: 'correctionStatement',
    label: { es: 'Una carta firmada y con fecha que diga qué dato corregir', en: 'A signed, dated statement saying what to correct' },
    detail: { es: 'Con pruebas del dato correcto, por ejemplo su pasaporte o acta de nacimiento.', en: 'With proof of the correct information, for example your passport or birth certificate.' },
    when: is('reason', 'f'),
  },
  {
    id: 'militaryCommander',
    label: { es: 'Las instrucciones de su comandante', en: 'Filing instructions from your commander' },
    detail: { es: 'Si es militar no inmigrante, su comandante extranjero en EE.UU. le dice cómo presentarlo.', en: 'As a nonimmigrant military member, your foreign commander in the U.S. tells you how to file.' },
    when: is('reason', 'g'),
  },
  {
    id: 'changeOfStatusApproval',
    label: { es: 'Copia de la aprobación de su cambio de estatus (si le dieron uno)', en: 'Copy of your change of status approval (if you were granted one)' },
    detail: { es: 'El aviso I-797 de USCIS.', en: 'The USCIS I-797 notice.' },
  },
  {
    id: 'nameChangeProof',
    label: { es: 'Prueba de su cambio de nombre', en: 'Proof of your name change' },
    detail: {
      es: 'Por ejemplo, acta de matrimonio, sentencia de divorcio, decreto de adopción u orden del tribunal.',
      en: 'For example, a marriage certificate, divorce decree, adoption decree or court order.',
    },
    when: is('i94SameName', 'no'),
  },
  translations,
];
