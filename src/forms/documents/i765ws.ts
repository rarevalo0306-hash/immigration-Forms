import type { DocItem } from './types';
import { translations } from './common';

// From the I-765WS worksheet (edition 08/21/25; it has no separate instructions): no evidence is required,
// but USCIS reviews any the person sends. Filed behind Form I-765 for (c)(14) or (c)(33).
export const formId = 'i-765ws';

export const docs: DocItem[] = [
  {
    id: 'i765With',
    label: { es: 'El Formulario I-765 completo', en: 'The completed Form I-765' },
    detail: {
      es: 'La hoja va justo detrás del I-765 (y del I-821D si es DACA). La hoja no tiene tarifa propia.',
      en: 'The worksheet goes right behind Form I-765 (and Form I-821D for DACA). The worksheet has no fee of its own.',
    },
  },
  {
    id: 'financialProof',
    label: { es: 'Pruebas de sus ingresos y gastos (opcional)', en: 'Proof of your income and expenses (optional)' },
    detail: {
      es: 'No son obligatorias, pero USCIS revisa las que envíe: talones de pago, recibos de renta o cuentas, estados de cuenta del banco.',
      en: 'Not required, but USCIS reviews any you send: pay stubs, rent receipts or bills, bank statements.',
    },
  },
  translations,
];
