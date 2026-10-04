import type { T } from '../i18n';

/**
 * The English test: the person reads aloud 1 of 3 sentences and writes 1 of 3 sentences the
 * officer dictates. USCIS publishes the words those sentences use ("Reading Vocabulary" and
 * "Writing Vocabulary for the Naturalization Test", rev. 07/14), not the sentences, so the
 * practice sentences here are Camino's, built only from those words (english.test.ts checks it).
 */

export const VOCAB_SOURCE = 'https://www.uscis.gov/citizenship-resource-center/naturalization-test-and-study-resources/study-for-the-test/citizenship-resources-in-text-only-format';

export interface VocabGroup {
  title: T;
  words: string[];
}

export const READING_VOCAB: VocabGroup[] = [
  { title: { es: 'Personas', en: 'People' }, words: ['Abraham Lincoln', 'George Washington'] },
  {
    title: { es: 'Educación cívica', en: 'Civics' },
    words: ['American flag', 'Bill of Rights', 'capital', 'citizen', 'city', 'Congress', 'country', 'Father of Our Country', 'government', 'President', 'right', 'Senators', 'state/states', 'White House'],
  },
  { title: { es: 'Lugares', en: 'Places' }, words: ['America', 'United States', 'U.S.'] },
  { title: { es: 'Días festivos', en: 'Holidays' }, words: ['Presidents’ Day', 'Memorial Day', 'Flag Day', 'Independence Day', 'Labor Day', 'Columbus Day', 'Thanksgiving'] },
  { title: { es: 'Palabras para preguntar', en: 'Question words' }, words: ['How', 'What', 'When', 'Where', 'Who', 'Why'] },
  { title: { es: 'Verbos', en: 'Verbs' }, words: ['can', 'come', 'do/does', 'elects', 'have/has', 'is/are/was/be', 'lives/lived', 'meet', 'name', 'pay', 'vote', 'want'] },
  { title: { es: 'Otras (gramaticales)', en: 'Other (function)' }, words: ['a', 'for', 'here', 'in', 'of', 'on', 'the', 'to', 'we'] },
  { title: { es: 'Otras (de contenido)', en: 'Other (content)' }, words: ['colors', 'dollar bill', 'first', 'largest', 'many', 'most', 'north', 'one', 'people', 'second', 'south'] },
];

export const WRITING_VOCAB: VocabGroup[] = [
  { title: { es: 'Personas', en: 'People' }, words: ['Adams', 'Lincoln', 'Washington'] },
  {
    title: { es: 'Educación cívica', en: 'Civics' },
    words: ['American Indians', 'capital', 'citizens', 'Civil War', 'Congress', 'Father of Our Country', 'flag', 'free', 'freedom of speech', 'President', 'right', 'Senators', 'state/states', 'White House'],
  },
  { title: { es: 'Lugares', en: 'Places' }, words: ['Alaska', 'California', 'Canada', 'Delaware', 'Mexico', 'New York City', 'United States', 'Washington', 'Washington, D.C.'] },
  { title: { es: 'Meses', en: 'Months' }, words: ['February', 'May', 'June', 'July', 'September', 'October', 'November'] },
  { title: { es: 'Días festivos', en: 'Holidays' }, words: ['Presidents’ Day', 'Memorial Day', 'Flag Day', 'Independence Day', 'Labor Day', 'Columbus Day', 'Thanksgiving'] },
  { title: { es: 'Verbos', en: 'Verbs' }, words: ['can', 'come', 'elect', 'have/has', 'is/was/be', 'lives/lived', 'meets', 'pay', 'vote', 'want'] },
  { title: { es: 'Otras (gramaticales)', en: 'Other (function)' }, words: ['and', 'during', 'for', 'here', 'in', 'of', 'on', 'the', 'to', 'we'] },
  { title: { es: 'Otras (de contenido)', en: 'Other (content)' }, words: ['blue', 'dollar bill', 'fifty/50', 'first', 'largest', 'most', 'north', 'one', 'one hundred/100', 'people', 'red', 'second', 'south', 'taxes', 'white'] },
];

export interface Sentence {
  en: string;
  es: string;
}

/** Sentences to read aloud: questions, like the ones the officer shows. */
export const READING_SENTENCES: Sentence[] = [
  { en: 'Who was the first President?', es: '¿Quién fue el primer presidente?' },
  { en: 'Who was the second President?', es: '¿Quién fue el segundo presidente?' },
  { en: 'Who is the Father of Our Country?', es: '¿Quién es el Padre de Nuestra Patria?' },
  { en: 'Who was Abraham Lincoln?', es: '¿Quién fue Abraham Lincoln?' },
  { en: 'What is the capital of the United States?', es: '¿Cuál es la capital de Estados Unidos?' },
  { en: 'Who lives in the White House?', es: '¿Quién vive en la Casa Blanca?' },
  { en: 'When is Labor Day?', es: '¿Cuándo es el Día del Trabajo?' },
  { en: 'When is Memorial Day?', es: '¿Cuándo es el Día de los Caídos?' },
  { en: 'When is Flag Day?', es: '¿Cuándo es el Día de la Bandera?' },
  { en: 'When is Independence Day?', es: '¿Cuándo es el Día de la Independencia?' },
  { en: 'When is Thanksgiving?', es: '¿Cuándo es el Día de Acción de Gracias?' },
  { en: 'When is Columbus Day?', es: '¿Cuándo es el Día de la Raza (Columbus Day)?' },
  { en: 'When is Presidents’ Day?', es: '¿Cuándo es el Día de los Presidentes?' },
  { en: 'What are the colors of the American flag?', es: '¿Cuáles son los colores de la bandera de Estados Unidos?' },
  { en: 'Who is on the dollar bill?', es: '¿Quién está en el billete de un dólar?' },
  { en: 'What is the largest state?', es: '¿Cuál es el estado más grande?' },
  { en: 'What state has the most people?', es: '¿Qué estado tiene más habitantes?' },
  { en: 'How many Senators does Congress have?', es: '¿Cuántos senadores tiene el Congreso?' },
  { en: 'When does Congress meet?', es: '¿Cuándo se reúne el Congreso?' },
  { en: 'Who elects Senators?', es: '¿Quién elige a los senadores?' },
  { en: 'Who can vote?', es: '¿Quién puede votar?' },
  { en: 'Why do people come to America?', es: '¿Por qué viene la gente a Estados Unidos?' },
  { en: 'What is one right of a citizen?', es: '¿Cuál es un derecho de un ciudadano?' },
  { en: 'Name one right in the Bill of Rights.', es: 'Nombre un derecho de la Carta de Derechos.' },
  { en: 'What country is north of the United States?', es: '¿Qué país está al norte de Estados Unidos?' },
  { en: 'What country is south of the United States?', es: '¿Qué país está al sur de Estados Unidos?' },
];

/** Sentences to write: answers, like the ones the officer dictates. */
export const WRITING_SENTENCES: Sentence[] = [
  { en: 'Washington was the first President.', es: 'Washington fue el primer presidente.' },
  { en: 'Adams was the second President.', es: 'Adams fue el segundo presidente.' },
  { en: 'Lincoln was the President during the Civil War.', es: 'Lincoln fue el presidente durante la Guerra Civil.' },
  { en: 'Washington is the Father of Our Country.', es: 'Washington es el Padre de Nuestra Patria.' },
  { en: 'Washington, D.C. is the capital of the United States.', es: 'Washington, D.C. es la capital de Estados Unidos.' },
  { en: 'The President lives in the White House.', es: 'El presidente vive en la Casa Blanca.' },
  { en: 'Labor Day is in September.', es: 'El Día del Trabajo es en septiembre.' },
  { en: 'Memorial Day is in May.', es: 'El Día de los Caídos es en mayo.' },
  { en: 'Flag Day is in June.', es: 'El Día de la Bandera es en junio.' },
  { en: 'Independence Day is in July.', es: 'El Día de la Independencia es en julio.' },
  { en: 'Thanksgiving is in November.', es: 'El Día de Acción de Gracias es en noviembre.' },
  { en: 'Columbus Day is in October.', es: 'El Día de la Raza (Columbus Day) es en octubre.' },
  { en: 'Presidents’ Day is in February.', es: 'El Día de los Presidentes es en febrero.' },
  { en: 'The flag is red, white, and blue.', es: 'La bandera es roja, blanca y azul.' },
  { en: 'The United States has 50 states.', es: 'Estados Unidos tiene 50 estados.' },
  { en: 'Congress has 100 Senators.', es: 'El Congreso tiene 100 senadores.' },
  { en: 'Congress meets in Washington, D.C.', es: 'El Congreso se reúne en Washington, D.C.' },
  { en: 'Citizens can vote.', es: 'Los ciudadanos pueden votar.' },
  { en: 'Citizens elect Congress.', es: 'Los ciudadanos eligen al Congreso.' },
  { en: 'Citizens have the right to vote.', es: 'Los ciudadanos tienen el derecho a votar.' },
  { en: 'Citizens have freedom of speech.', es: 'Los ciudadanos tienen libertad de expresión.' },
  { en: 'People come here to be free.', es: 'La gente viene aquí para ser libre.' },
  { en: 'We pay taxes.', es: 'Nosotros pagamos impuestos.' },
  { en: 'Alaska is the largest state.', es: 'Alaska es el estado más grande.' },
  { en: 'California has the most people.', es: 'California tiene más habitantes.' },
  { en: 'Canada is north of the United States.', es: 'Canadá está al norte de Estados Unidos.' },
  { en: 'Mexico is south of the United States.', es: 'México está al sur de Estados Unidos.' },
  { en: 'New York City was the first capital.', es: 'La ciudad de Nueva York fue la primera capital.' },
  { en: 'American Indians lived here first.', es: 'Los indígenas americanos vivieron aquí primero.' },
  { en: 'Delaware was the first state.', es: 'Delaware fue el primer estado.' },
];

/** The words of a vocabulary list, one by one ("have/has" gives both, "Washington, D.C." gives washington, d, c). */
export const vocabWords = (groups: VocabGroup[]): Set<string> =>
  new Set(groups.flatMap((g) => g.words.flatMap((w) => w.split('/'))).flatMap((w) => tokens(w)));

export const tokens = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']s\b/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
