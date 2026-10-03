import type { DocItem } from './types';

// From Form G-1145 (it has no separate instructions): "General Information". No fee and no evidence.
export const formId = 'g-1145';

export const docs: DocItem[] = [
  {
    id: 'applicationPackage',
    label: { es: 'La solicitud que envía por correo', en: 'The application you are mailing' },
    detail: {
      es: 'Ponga el G-1145 con un clip encima de su primera página. Si el paquete lleva varios formularios, use un G-1145 para cada uno.',
      en: 'Clip the G-1145 on top of its first page. If the package has several forms, use one G-1145 for each.',
    },
  },
];
