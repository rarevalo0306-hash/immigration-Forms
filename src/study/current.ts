import type { T } from '../i18n';
import type { TestVersion, Varies } from './types';

/**
 * The answers that change with elections or appointments, as USCIS lists them on its "Check for
 * Test Updates" page. The officer accepts the official serving on the day of the interview, so
 * the study screens show these with the date they were checked and a link to the page.
 */

export const TEST_UPDATES_URL = 'https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates';

/** When the page below was read (its own "Last Reviewed/Updated" date was 09/18/2025). */
export const CHECKED = { es: '4 de octubre de 2026', en: 'October 4, 2026' } satisfies T;

/** The accepted answers for the officials USCIS names, in the page's order (it lists each test apart). */
const CURRENT: Record<TestVersion, Partial<Record<Varies, string[]>>> = {
  '2025': {
    president: ['Donald J. Trump', 'Donald Trump', 'Trump'],
    vicePresident: ['JD Vance', 'Vance'],
    speaker: ['Mike Johnson', 'Johnson', 'James Michael Johnson (birth name)'],
    chiefJustice: ['John Roberts', 'John G. Roberts, Jr.', 'Roberts'],
  },
  '2008': {
    president: ['Donald J. Trump', 'Donald Trump', 'Trump'],
    vicePresident: ['JD Vance', 'Vance'],
    chiefJustice: ['John Roberts', 'John G. Roberts, Jr.'],
    presidentParty: ['Republican (Party)'],
    speaker: ['Mike Johnson', 'Johnson', 'James Michael Johnson (birth name)'],
  },
};

export const currentAnswers = (version: TestVersion, varies: Varies): string[] | undefined => CURRENT[version][varies];

/** Answers that depend on where the person lives, and where to look them up. */
export const LOOKUP: Partial<Record<Varies, { url: (state: string) => string; label: T }>> = {
  senator: {
    url: (s) => (s && s.length === 2 ? `https://www.senate.gov/states/${s}/intro.htm` : 'https://www.senate.gov/senators/'),
    label: { es: 'Busque sus senadores en senate.gov', en: 'Find your senators at senate.gov' },
  },
  representative: {
    url: () => 'https://www.house.gov/representatives/find-your-representative',
    label: { es: 'Busque su representante con su código postal en house.gov', en: 'Find your representative by ZIP code at house.gov' },
  },
  governor: {
    url: () => 'https://www.usa.gov/states-and-territories',
    label: { es: 'Busque a su gobernador en usa.gov', en: 'Find your governor at usa.gov' },
  },
};
