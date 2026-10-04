import type { T } from '../i18n';

/** How the "Todos los trámites" screen groups the forms. categories.test.ts checks every form is in one group. */
export interface Category {
  id: string;
  title: T;
  formIds: string[];
}

export const categories: Category[] = [
  {
    id: 'familia',
    title: { es: 'Familia y matrimonio', en: 'Family and marriage' },
    formIds: ['i-130', 'i-130a', 'i-129f', 'i-864', 'i-864ez', 'i-864a', 'i-134', 'i-751'],
  },
  {
    id: 'residencia',
    title: { es: 'Residencia (green card)', en: 'Green card' },
    formIds: ['i-485', 'i-485supa', 'i-90', 'i-865', 'i-824', 'i-407'],
  },
  {
    id: 'trabajo',
    title: { es: 'Trabajo, viajes y estadía', en: 'Work, travel and stay' },
    formIds: ['i-765', 'i-765ws', 'i-131', 'i-131a', 'i-102', 'i-539', 'i-539a'],
  },
  {
    id: 'proteccion',
    title: { es: 'Asilo, DACA y TPS', en: 'Asylum, DACA and TPS' },
    formIds: ['i-589', 'i-730', 'i-821d', 'i-821'],
  },
  {
    id: 'victimas',
    title: { es: 'Víctimas de abuso, trata o delitos', en: 'Victims of abuse, trafficking or crimes' },
    formIds: ['i-360', 'i-918', 'i-918supa', 'i-914', 'i-914supa'],
  },
  {
    id: 'perdones',
    title: { es: 'Perdones y apelaciones', en: 'Waivers and appeals' },
    formIds: ['i-601a', 'i-601', 'i-212', 'i-290b'],
  },
  {
    id: 'ciudadania',
    title: { es: 'Ciudadanía', en: 'Citizenship' },
    formIds: ['n-400', 'n-336', 'n-600', 'n-565'],
  },
  {
    id: 'otros',
    title: { es: 'Dirección, pagos y avisos', en: 'Address, fees and notices' },
    formIds: ['ar-11', 'eoir-33', 'i-912', 'g-1145'],
  },
];
