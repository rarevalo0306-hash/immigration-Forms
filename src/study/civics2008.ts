// Source: USCIS "Civics Questions and Answers (2008 version)" (rev. 08/21); English verbatim. Spanish: USCIS "Preguntas de Educación Cívica" (rev. 01/19), verbatim; only #100's holidays are reordered to pair with the English, and two typos are fixed (#20 "?.", #39 "Tribunal Suprema").
import type { CivicsTest } from './types';

export const civics2008: CivicsTest = {
  version: '2008',
  source: {
    edition: '(rev. 08/21)',
    url: 'https://www.uscis.gov/sites/default/files/document/questions-and-answers/OoC_100_Questions_2008_Civics_Test_V1.pdf',
  },
  spanish: 'uscis',
  rules: { asked: 10, pass: 6, fail: 5 },
  senior: { asked: 10, pass: 6, fail: 5 },
  questions: [
    {
      n: 1,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'A: Principles of American Democracy', es: 'A: Principios de la Democracia Estadounidense' },
      question: {
        en: 'What is the supreme law of the land?',
        es: '¿Cuál es la ley suprema de la nación?',
      },
      answers: {
        en: [
          'the Constitution',
        ],
        es: [
          'la Constitución',
        ],
      },
    },
    {
      n: 2,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'A: Principles of American Democracy', es: 'A: Principios de la Democracia Estadounidense' },
      question: {
        en: 'What does the Constitution do?',
        es: '¿Qué hace la Constitución?',
      },
      answers: {
        en: [
          'sets up the government',
          'defines the government',
          'protects basic rights of Americans',
        ],
        es: [
          'establece el gobierno',
          'define el gobierno',
          'protege los derechos básicos de los ciudadanos estadounidenses',
        ],
      },
    },
    {
      n: 3,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'A: Principles of American Democracy', es: 'A: Principios de la Democracia Estadounidense' },
      question: {
        en: 'The idea of self-government is in the first three words of the Constitution. What are these words?',
        es: 'Las primeras tres palabras de la Constitución contienen la idea del autogobierno (de que el pueblo se gobierna a sí mismo). ¿Cuáles son estas palabras?',
      },
      answers: {
        en: [
          'We the People',
        ],
        es: [
          'Nosotros, el pueblo',
        ],
      },
    },
    {
      n: 4,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'A: Principles of American Democracy', es: 'A: Principios de la Democracia Estadounidense' },
      question: {
        en: 'What is an amendment?',
        es: '¿Qué es una enmienda?',
      },
      answers: {
        en: [
          'a change (to the Constitution)',
          'an addition (to the Constitution)',
        ],
        es: [
          'un cambio (a la Constitución)',
          'una adición (a la Constitución)',
        ],
      },
    },
    {
      n: 5,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'A: Principles of American Democracy', es: 'A: Principios de la Democracia Estadounidense' },
      question: {
        en: 'What do we call the first ten amendments to the Constitution?',
        es: '¿Con qué nombre se conocen las primeras diez enmiendas a la Constitución?',
      },
      answers: {
        en: [
          'the Bill of Rights',
        ],
        es: [
          'la Carta de Derechos',
        ],
      },
    },
    {
      n: 6,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'A: Principles of American Democracy', es: 'A: Principios de la Democracia Estadounidense' },
      question: {
        en: 'What is one right or freedom from the First Amendment?',
        es: '¿Cuál es un derecho o libertad garantizado por la Primera Enmienda?',
      },
      answers: {
        en: [
          'speech',
          'religion',
          'assembly',
          'press',
          'petition the government',
        ],
        es: [
          'expresión',
          'religión',
          'reunión',
          'prensa',
          'peticionar al gobierno',
        ],
      },
      star: true,
    },
    {
      n: 7,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'A: Principles of American Democracy', es: 'A: Principios de la Democracia Estadounidense' },
      question: {
        en: 'How many amendments does the Constitution have?',
        es: '¿Cuántas enmiendas tiene la Constitución?',
      },
      answers: {
        en: [
          'twenty-seven (27)',
        ],
        es: [
          'veintisiete (27)',
        ],
      },
    },
    {
      n: 8,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'A: Principles of American Democracy', es: 'A: Principios de la Democracia Estadounidense' },
      question: {
        en: 'What did the Declaration of Independence do?',
        es: '¿Qué hizo la Declaración de la Independencia?',
      },
      answers: {
        en: [
          'announced our independence (from Great Britain)',
          'declared our independence (from Great Britain)',
          'said that the United States is free (from Great Britain)',
        ],
        es: [
          'anunció nuestra independencia (de Gran Bretaña)',
          'declaró nuestra independencia (de Gran Bretaña)',
          'declaró que Estados Unidos se independizó (de Gran Bretaña)',
        ],
      },
    },
    {
      n: 9,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'A: Principles of American Democracy', es: 'A: Principios de la Democracia Estadounidense' },
      question: {
        en: 'What are two rights in the Declaration of Independence?',
        es: '¿Cuáles son dos derechos en la Declaración de la Independencia?',
      },
      answers: {
        en: [
          'life',
          'liberty',
          'pursuit of happiness',
        ],
        es: [
          'la vida',
          'la libertad',
          'la búsqueda de la felicidad',
        ],
      },
      count: 2,
    },
    {
      n: 10,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'A: Principles of American Democracy', es: 'A: Principios de la Democracia Estadounidense' },
      question: {
        en: 'What is freedom of religion?',
        es: '¿En qué consiste la libertad de religión?',
      },
      answers: {
        en: [
          'You can practice any religion, or not practice a religion.',
        ],
        es: [
          'Se puede practicar cualquier religión o no practicar ninguna.',
        ],
      },
    },
    {
      n: 11,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'A: Principles of American Democracy', es: 'A: Principios de la Democracia Estadounidense' },
      question: {
        en: 'What is the economic system in the United States?',
        es: '¿Cuál es el sistema económico de Estados Unidos?',
      },
      answers: {
        en: [
          'capitalist economy',
          'market economy',
        ],
        es: [
          'economía capitalista',
          'economía de mercado',
        ],
      },
      star: true,
    },
    {
      n: 12,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'A: Principles of American Democracy', es: 'A: Principios de la Democracia Estadounidense' },
      question: {
        en: 'What is the “rule of law”?',
        es: '¿En qué consiste el “estado de derecho” (ley y orden)?',
      },
      answers: {
        en: [
          'Everyone must follow the law.',
          'Leaders must obey the law.',
          'Government must obey the law.',
          'No one is above the law.',
        ],
        es: [
          'Todos deben obedecer la ley',
          'Los líderes deben obedecer la ley',
          'El gobierno debe obedecer la ley',
          'Nadie está por encima de la ley',
        ],
      },
    },
    {
      n: 13,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'Name one branch or part of the government.',
        es: 'Nombre una rama o parte del gobierno.',
      },
      answers: {
        en: [
          'Congress',
          'legislative',
          'President',
          'executive',
          'the courts',
          'judicial',
        ],
        es: [
          'Congreso',
          'Poder Legislativo',
          'presidente',
          'Poder Ejecutivo',
          'tribunales',
          'Poder Judicial',
        ],
      },
      star: true,
    },
    {
      n: 14,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'What stops one branch of government from becoming too powerful?',
        es: '¿Qué es lo que evita que una rama del gobierno se vuelva demasiado poderosa?',
      },
      answers: {
        en: [
          'checks and balances',
          'separation of powers',
        ],
        es: [
          'pesos y contrapesos',
          'separación de poderes',
        ],
      },
    },
    {
      n: 15,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'Who is in charge of the executive branch?',
        es: '¿Quién está a cargo de la rama ejecutiva?',
      },
      answers: {
        en: [
          'the President',
        ],
        es: [
          'el presidente',
        ],
      },
    },
    {
      n: 16,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'Who makes federal laws?',
        es: '¿Quién crea las leyes federales?',
      },
      answers: {
        en: [
          'Congress',
          'Senate and House (of Representatives)',
          '(U.S. or national) legislature',
        ],
        es: [
          'el Congreso',
          'el Senado y la Cámara (de Representantes)',
          'la legislatura (nacional o de Estados Unidos)',
        ],
      },
    },
    {
      n: 17,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'What are the two parts of the U.S. Congress?',
        es: '¿Cuáles son las dos partes que integran el Congreso de Estados Unidos?',
      },
      answers: {
        en: [
          'the Senate and House (of Representatives)',
        ],
        es: [
          'el Senado y la Cámara (de Representantes)',
        ],
      },
      star: true,
    },
    {
      n: 18,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'How many U.S. Senators are there?',
        es: '¿Cuántos senadores hay en Estados Unidos?',
      },
      answers: {
        en: [
          'one hundred (100)',
        ],
        es: [
          'cien (100)',
        ],
      },
    },
    {
      n: 19,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'We elect a U.S. Senator for how many years?',
        es: '¿De cuántos años es el término de elección de un senador de Estados Unidos?',
      },
      answers: {
        en: [
          'six (6)',
        ],
        es: [
          'seis (6)',
        ],
      },
    },
    {
      n: 20,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'Who is one of your state’s U.S. Senators now?',
        es: '¿Quién es uno de los senadores actuales del estado donde usted vive?',
      },
      answers: {
        en: [
          'Answers will vary. [District of Columbia residents and residents of U.S. territories should answer that D.C. (or the territory where the applicant lives) has no U.S. Senators.]',
        ],
        es: [
          'Las respuestas variarán. [Los residentes del Distrito de Columbia y los territorios de Estados Unidos deberán contestar que Distrito de Columbia (o el territorio en donde vive el solicitante) no cuenta con senadores en Estados Unidos].',
        ],
      },
      star: true,
      varies: 'senator',
    },
    {
      n: 21,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'The House of Representatives has how many voting members?',
        es: '¿Cuántos miembros votantes tiene la Cámara de Representantes?',
      },
      answers: {
        en: [
          'four hundred thirty-five (435)',
        ],
        es: [
          'cuatrocientos treinta y cinco (435)',
        ],
      },
    },
    {
      n: 22,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'We elect a U.S. Representative for how many years?',
        es: '¿De cuántos años es el término de elección de un representante de Estados Unidos?',
      },
      answers: {
        en: [
          'two (2)',
        ],
        es: [
          'dos (2)',
        ],
      },
    },
    {
      n: 23,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'Name your U.S. Representative.',
        es: 'Mencione el nombre de su representante de Estados Unidos.',
      },
      answers: {
        en: [
          'Answers will vary. [Residents of territories with nonvoting Delegates or Resident Commissioners may provide the name of that Delegate or Commissioner. Also acceptable is any statement that the territory has no (voting) Representatives in Congress.]',
        ],
        es: [
          'Las respuestas variarán. (Los residentes de territorios con delegados no votantes o los comisionados residentes pueden decir el nombre de dicho delegado o comisionado. Una respuesta que indica que el territorio no tiene representantes votantes en el Congreso también es aceptable).',
        ],
      },
      varies: 'representative',
    },
    {
      n: 24,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'Who does a U.S. Senator represent?',
        es: '¿A quiénes representa un senador de Estados Unidos?',
      },
      answers: {
        en: [
          'all people of the state',
        ],
        es: [
          'a todas las personas del estado',
        ],
      },
    },
    {
      n: 25,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'Why do some states have more Representatives than other states?',
        es: '¿Por qué tienen algunos estados más representantes que otros?',
      },
      answers: {
        en: [
          '(because of) the state’s population',
          '(because) they have more people',
          '(because) some states have more people',
        ],
        es: [
          '(debido a) la población del estado',
          '(debido a que) tienen más gente',
          '(debido a que) algunos estados tienen más gente',
        ],
      },
    },
    {
      n: 26,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'We elect a President for how many years?',
        es: '¿Por cuántos años elegimos al presidente?',
      },
      answers: {
        en: [
          'four (4)',
        ],
        es: [
          'cuatro (4)',
        ],
      },
    },
    {
      n: 27,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'In what month do we vote for President?',
        es: '¿En qué mes votamos por un nuevo presidente?',
      },
      answers: {
        en: [
          'November',
        ],
        es: [
          'noviembre',
        ],
      },
      star: true,
    },
    {
      n: 28,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'What is the name of the President of the United States now?',
        es: '¿Cómo se llama el actual presidente de Estados Unidos?',
      },
      answers: {
        en: [
          'Visit uscis.gov/citizenship/testupdates for the name of the President of the United States.',
        ],
        es: [
          'Visite uscis.gov/es/ciudadania/actualizacionesalexamen para saber el nombre del presidente de Estados Unidos.',
        ],
      },
      star: true,
      varies: 'president',
    },
    {
      n: 29,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'What is the name of the Vice President of the United States now?',
        es: '¿Cómo se llama el actual vicepresidente de Estados Unidos?',
      },
      answers: {
        en: [
          'Visit uscis.gov/citizenship/testupdates for the name of the Vice President of the United States.',
        ],
        es: [
          'Visite uscis.gov/es/ciudadania/actualizacionesalexamen para saber el nombre del vicepresidente de Estados Unidos.',
        ],
      },
      varies: 'vicePresident',
    },
    {
      n: 30,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'If the President can no longer serve, who becomes President?',
        es: 'Si el presidente ya no puede cumplir sus funciones, ¿quién se convierte en presidente?',
      },
      answers: {
        en: [
          'the Vice President',
        ],
        es: [
          'el vicepresidente',
        ],
      },
    },
    {
      n: 31,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'If both the President and the Vice President can no longer serve, who becomes President?',
        es: 'Si tanto el presidente como el vicepresidente ya no pueden cumplir sus funciones, ¿quién se convierte en presidente?',
      },
      answers: {
        en: [
          'the Speaker of the House',
        ],
        es: [
          'el portavoz de la Cámara de Representantes',
        ],
      },
    },
    {
      n: 32,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'Who is the Commander in Chief of the military?',
        es: '¿Quién es el comandante en jefe de las Fuerzas Armadas?',
      },
      answers: {
        en: [
          'the President',
        ],
        es: [
          'el presidente',
        ],
      },
    },
    {
      n: 33,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'Who signs bills to become laws?',
        es: '¿Quién firma los proyectos de ley para convertirlos en ley?',
      },
      answers: {
        en: [
          'the President',
        ],
        es: [
          'el presidente',
        ],
      },
    },
    {
      n: 34,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'Who vetoes bills?',
        es: '¿Quién veta los proyectos de ley?',
      },
      answers: {
        en: [
          'the President',
        ],
        es: [
          'el presidente',
        ],
      },
    },
    {
      n: 35,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'What does the President’s Cabinet do?',
        es: '¿Qué hace el gabinete del presidente?',
      },
      answers: {
        en: [
          'advises the President',
        ],
        es: [
          'asesora al presidente',
        ],
      },
    },
    {
      n: 36,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'What are two Cabinet-level positions?',
        es: '¿Cuáles son dos puestos a nivel de gabinete?',
      },
      answers: {
        en: [
          'Secretary of Agriculture',
          'Secretary of Commerce',
          'Secretary of Defense',
          'Secretary of Education',
          'Secretary of Energy',
          'Secretary of Health and Human Services',
          'Secretary of Homeland Security',
          'Secretary of Housing and Urban Development',
          'Secretary of the Interior',
          'Secretary of Labor',
          'Secretary of State',
          'Secretary of Transportation',
          'Secretary of the Treasury',
          'Secretary of Veterans Affairs',
          'Attorney General',
          'Vice President',
        ],
        es: [
          'secretario de Agricultura',
          'secretario de Comercio',
          'secretario de Defensa',
          'secretario de Educación',
          'secretario de Energía',
          'secretario de Salud y Servicios Humanos',
          'secretario de Seguridad Nacional',
          'secretario de Vivienda y Desarrollo Urbano',
          'secretario del Interior',
          'secretario del Trabajo',
          'secretario de Estado',
          'secretario de Transporte',
          'secretario del Tesoro (de Hacienda)',
          'secretario de Asuntos de los Veteranos',
          'procurador general (fiscal general)',
          'vicepresidente',
        ],
      },
      count: 2,
    },
    {
      n: 37,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'What does the judicial branch do?',
        es: '¿Qué hace la Rama Judicial? (El poder judicial)',
      },
      answers: {
        en: [
          'reviews laws',
          'explains laws',
          'resolves disputes (disagreements)',
          'decides if a law goes against the Constitution',
        ],
        es: [
          'revisa las leyes',
          'explica las leyes',
          'resuelve disputas (desacuerdos)',
          'decide si una ley va en contra de la Constitución',
        ],
      },
    },
    {
      n: 38,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'What is the highest court in the United States?',
        es: '¿Cuál es el tribunal más importante (supremo) de Estados Unidos?',
      },
      answers: {
        en: [
          'the Supreme Court',
        ],
        es: [
          'el Tribunal Supremo (Corte Suprema)',
        ],
      },
    },
    {
      n: 39,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'How many justices are on the Supreme Court?',
        es: '¿Cuántos jueces hay en el Tribunal Supremo?',
      },
      answers: {
        en: [
          'Visit uscis.gov/citizenship/testupdates for the number of justices on the Supreme Court.',
        ],
        es: [
          'Visite uscis.gov/es/ciudadania/actualizacionesalexamen para saber el número de jueces en el Tribunal Supremo.',
        ],
      },
    },
    {
      n: 40,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'Who is the Chief Justice of the United States now?',
        es: '¿Quién es el juez presidente actual del Tribunal Supremo de Estados Unidos?',
      },
      answers: {
        en: [
          'Visit uscis.gov/citizenship/testupdates for the name of the Chief Justice of the United States.',
        ],
        es: [
          'Visite uscis.gov/es/ciudadania/actualizacionesalexamen para saber el nombre del juez presidente del Tribunal Supremo de Estados Unidos.',
        ],
      },
      varies: 'chiefJustice',
    },
    {
      n: 41,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'Under our Constitution, some powers belong to the federal government. What is one power of the federal government?',
        es: 'De acuerdo con nuestra Constitución, algunos poderes pertenecen al gobierno federal. ¿Cuál es un poder del gobierno federal?',
      },
      answers: {
        en: [
          'to print money',
          'to declare war',
          'to create an army',
          'to make treaties',
        ],
        es: [
          'imprimir dinero',
          'declarar la guerra',
          'crear un ejército',
          'acordar tratados',
        ],
      },
    },
    {
      n: 42,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'Under our Constitution, some powers belong to the states. What is one power of the states?',
        es: 'De acuerdo con nuestra Constitución, algunos poderes pertenecen a los estados. ¿Cuál es un poder de los estados?',
      },
      answers: {
        en: [
          'provide schooling and education',
          'provide protection (police)',
          'provide safety (fire departments)',
          'give a driver’s license',
          'approve zoning and land use',
        ],
        es: [
          'proporcionar escuelas y educación',
          'proporcionar protección (policía)',
          'proporcionar seguridad (cuerpos de bomberos)',
          'otorgar licencias de conducir',
          'aprobar la zonificación y uso de la tierra (uso de suelos)',
        ],
      },
    },
    {
      n: 43,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'Who is the Governor of your state now?',
        es: '¿Quién es el gobernador actual de su estado?',
      },
      answers: {
        en: [
          'Answers will vary. [District of Columbia residents should answer that D.C. does not have a Governor.]',
        ],
        es: [
          'Las respuestas variarán. (Los residentes del Distrito de Columbia deben decir “no tenemos gobernador”).',
        ],
      },
      varies: 'governor',
    },
    {
      n: 44,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'What is the capital of your state?',
        es: '¿Cuál es la capital de su estado?',
      },
      answers: {
        en: [
          'Answers will vary. [District of Columbia residents should answer that D.C. is not a state and does not have a capital. Residents of U.S. territories should name the capital of the territory.]',
        ],
        es: [
          'Las respuestas variarán. (Los residentes del Distrito de Columbia deben contestar que el Distrito de Columbia no es estado y que no tiene capital. Los residentes de los territorios de Estados Unidos deben dar el nombre de la capital del territorio].',
        ],
      },
      star: true,
      varies: 'stateCapital',
    },
    {
      n: 45,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'What are the two major political parties in the United States?',
        es: '¿Cuáles son los dos principales partidos políticos de Estados Unidos?',
      },
      answers: {
        en: [
          'Democratic and Republican',
        ],
        es: [
          'Demócrata y Republicano',
        ],
      },
      star: true,
    },
    {
      n: 46,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'What is the political party of the President now?',
        es: '¿Cuál es el partido político del presidente actual?',
      },
      answers: {
        en: [
          'Visit uscis.gov/citizenship/testupdates for the political party of the President.',
        ],
        es: [
          'Visite uscis.gov/es/ciudadania/actualizacionesalexamen para saber el partido político al que pertenece el presidente de Estados Unidos.',
        ],
      },
      varies: 'presidentParty',
    },
    {
      n: 47,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'B: System of Government', es: 'B: Sistema de Gobierno' },
      question: {
        en: 'What is the name of the Speaker of the House of Representatives now?',
        es: '¿Cómo se llama el portavoz actual de la Cámara de Representantes?',
      },
      answers: {
        en: [
          'Visit uscis.gov/citizenship/testupdates for the name of the Speaker of the House of Representatives.',
        ],
        es: [
          'Visite uscis.gov/es/ciudadania/actualizacionesalexamen para saber el nombre del portavoz de la Cámara de Representantes.',
        ],
      },
      varies: 'speaker',
    },
    {
      n: 48,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'C: Rights and Responsibilities', es: 'C: Derechos y Responsabilidades' },
      question: {
        en: 'There are four amendments to the Constitution about who can vote. Describe one of them.',
        es: 'Existen cuatro enmiendas a la Constitución sobre quién puede votar. Describa una de ellas.',
      },
      answers: {
        en: [
          'Citizens eighteen (18) and older (can vote).',
          'You don’t have to pay (a poll tax) to vote.',
          'Any citizen can vote. (Women and men can vote.)',
          'A male citizen of any race (can vote).',
        ],
        es: [
          'Ciudadanos de dieciocho (18) años en adelante (pueden votar).',
          'No se exige pagar un impuesto para votar (el impuesto para acudir a las urnas o “poll tax” en inglés).',
          'Cualquier ciudadano puede votar. (Tanto mujeres como hombres pueden votar).',
          'Un hombre ciudadano de cualquier raza (puede votar).',
        ],
      },
    },
    {
      n: 49,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'C: Rights and Responsibilities', es: 'C: Derechos y Responsabilidades' },
      question: {
        en: 'What is one responsibility that is only for United States citizens?',
        es: '¿Cuál es una responsabilidad que corresponde sólo a los ciudadanos de Estados Unidos?',
      },
      answers: {
        en: [
          'serve on a jury',
          'vote in a federal election',
        ],
        es: [
          'prestar servicio en un jurado',
          'votar en una elección federal.',
        ],
      },
      star: true,
    },
    {
      n: 50,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'C: Rights and Responsibilities', es: 'C: Derechos y Responsabilidades' },
      question: {
        en: 'Name one right only for United States citizens.',
        es: '¿Cuál es un derecho que pueden ejercer sólo los ciudadanos de Estados Unidos?',
      },
      answers: {
        en: [
          'vote in a federal election',
          'run for federal office',
        ],
        es: [
          'votar en una elección federal',
          'postularse a un cargo político federal',
        ],
      },
    },
    {
      n: 51,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'C: Rights and Responsibilities', es: 'C: Derechos y Responsabilidades' },
      question: {
        en: 'What are two rights of everyone living in the United States?',
        es: '¿Cuáles son dos derechos que pueden ejercer todas las personas que viven en Estados Unidos?',
      },
      answers: {
        en: [
          'freedom of expression',
          'freedom of speech',
          'freedom of assembly',
          'freedom to petition the government',
          'freedom of religion',
          'the right to bear arms',
        ],
        es: [
          'libertad de expresión',
          'libertad de la palabra',
          'libertad de reunión',
          'libertad para peticionar al gobierno',
          'libertad de religión',
          'derecho a portar armas',
        ],
      },
      count: 2,
    },
    {
      n: 52,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'C: Rights and Responsibilities', es: 'C: Derechos y Responsabilidades' },
      question: {
        en: 'What do we show loyalty to when we say the Pledge of Allegiance?',
        es: '¿A qué demostramos nuestra lealtad cuando prestamos el Juramento de Lealtad (Pledge of Allegiance)?',
      },
      answers: {
        en: [
          'the United States',
          'the flag',
        ],
        es: [
          'a Estados Unidos',
          'a la bandera',
        ],
      },
    },
    {
      n: 53,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'C: Rights and Responsibilities', es: 'C: Derechos y Responsabilidades' },
      question: {
        en: 'What is one promise you make when you become a United States citizen?',
        es: '¿Cuál es una promesa que usted hace cuando se convierte en ciudadano de Estados Unidos?',
      },
      answers: {
        en: [
          'give up loyalty to other countries',
          'defend the Constitution and laws of the United States',
          'obey the laws of the United States',
          'serve in the U.S. military (if needed)',
          'serve (do important work for) the nation (if needed)',
          'be loyal to the United States',
        ],
        es: [
          'renunciar a su lealtad a otros países',
          'defender la Constitución y las leyes de Estados Unidos',
          'obedecer las leyes de Estados Unidos',
          'prestar servicio en las Fuerzas Armadas de Estados Unidos (de ser necesario)',
          'prestar servicio a (realizar trabajo importante para) la nación (de ser necesario)',
          'ser leal a Estados Unidos',
        ],
      },
    },
    {
      n: 54,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'C: Rights and Responsibilities', es: 'C: Derechos y Responsabilidades' },
      question: {
        en: 'How old do citizens have to be to vote for President?',
        es: '¿Cuántos años tienen que tener los ciudadanos para votar por el presidente?',
      },
      answers: {
        en: [
          'eighteen (18) and older',
        ],
        es: [
          'dieciocho (18) años en adelante',
        ],
      },
      star: true,
    },
    {
      n: 55,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'C: Rights and Responsibilities', es: 'C: Derechos y Responsabilidades' },
      question: {
        en: 'What are two ways that Americans can participate in their democracy?',
        es: '¿Cuáles son dos maneras mediante las cuales los ciudadanos estadounidenses pueden participar en su democracia?',
      },
      answers: {
        en: [
          'vote',
          'join a political party',
          'help with a campaign',
          'join a civic group',
          'join a community group',
          'give an elected official your opinion on an issue',
          'call Senators and Representatives',
          'publicly support or oppose an issue or policy',
          'run for office',
          'write to a newspaper',
        ],
        es: [
          'votar',
          'afiliarse a un partido político',
          'ayudar en una campaña política',
          'unirse a un grupo cívico',
          'unirse a un grupo comunitario',
          'compartir su opinión acerca de un asunto con un oficial electo',
          'llamar a senadores y representantes',
          'apoyar u oponerse públicamente a un asunto o política',
          'postularse a un cargo político',
          'enviar una carta o mensaje a un periódico',
        ],
      },
      count: 2,
    },
    {
      n: 56,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'C: Rights and Responsibilities', es: 'C: Derechos y Responsabilidades' },
      question: {
        en: 'When is the last day you can send in federal income tax forms?',
        es: '¿Cuál es la fecha límite para enviar la declaración federal de impuestos sobre ingresos?',
      },
      answers: {
        en: [
          'April 15',
        ],
        es: [
          'el 15 de abril',
        ],
      },
      star: true,
    },
    {
      n: 57,
      part: { en: 'American Government', es: 'Gobierno estadounidense' },
      section: { en: 'C: Rights and Responsibilities', es: 'C: Derechos y Responsabilidades' },
      question: {
        en: 'When must all men register for the Selective Service?',
        es: '¿Cuándo deben inscribirse todos los hombres en el Servicio Selectivo?',
      },
      answers: {
        en: [
          'at age eighteen (18)',
          'between eighteen (18) and twenty-six (26)',
        ],
        es: [
          'a los dieciocho (18) años',
          'entre los dieciocho (18) y veintiséis (26) años de edad',
        ],
      },
    },
    {
      n: 58,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'A: Colonial Period and Independence', es: 'A: Época colonial e independencia' },
      question: {
        en: 'What is one reason colonists came to America?',
        es: '¿Cuál es una razón por la que los colonos vinieron a América?',
      },
      answers: {
        en: [
          'freedom',
          'political liberty',
          'religious freedom',
          'economic opportunity',
          'practice their religion',
          'escape persecution',
        ],
        es: [
          'libertad',
          'libertad política',
          'libertad religiosa',
          'oportunidad económica',
          'para practicar su religión',
          'para huir de la persecución',
        ],
      },
    },
    {
      n: 59,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'A: Colonial Period and Independence', es: 'A: Época colonial e independencia' },
      question: {
        en: 'Who lived in America before the Europeans arrived?',
        es: '¿Quiénes vivían en lo que hoy conocemos como Estados Unidos antes de la llegada de los europeos?',
      },
      answers: {
        en: [
          'American Indians',
          'Native Americans',
        ],
        es: [
          'indios estadounidenses',
          'nativos estadounidenses',
        ],
      },
    },
    {
      n: 60,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'A: Colonial Period and Independence', es: 'A: Época colonial e independencia' },
      question: {
        en: 'What group of people was taken to America and sold as slaves?',
        es: '¿Qué grupo de personas fue traído a Estados Unidos y vendidos como esclavos?',
      },
      answers: {
        en: [
          'Africans',
          'people from Africa',
        ],
        es: [
          'africanos',
          'gente de África',
        ],
      },
    },
    {
      n: 61,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'A: Colonial Period and Independence', es: 'A: Época colonial e independencia' },
      question: {
        en: 'Why did the colonists fight the British?',
        es: '¿Por qué lucharon los colonos contra los británicos?',
      },
      answers: {
        en: [
          'because of high taxes (taxation without representation)',
          'because the British army stayed in their houses (boarding, quartering)',
          'because they didn’t have self-government',
        ],
        es: [
          'debido a los impuestos altos (impuestos sin representación)',
          'el ejército británico se alojaba en sus casas (alojándose, acuartelándose)',
          'porque no tenían gobierno propio',
        ],
      },
    },
    {
      n: 62,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'A: Colonial Period and Independence', es: 'A: Época colonial e independencia' },
      question: {
        en: 'Who wrote the Declaration of Independence?',
        es: '¿Quién escribió la Declaración de Independencia?',
      },
      answers: {
        en: [
          '(Thomas) Jefferson',
        ],
        es: [
          '(Thomas) Jefferson',
        ],
      },
    },
    {
      n: 63,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'A: Colonial Period and Independence', es: 'A: Época colonial e independencia' },
      question: {
        en: 'When was the Declaration of Independence adopted?',
        es: '¿Cuándo fue adoptada la Declaración de Independencia?',
      },
      answers: {
        en: [
          'July 4, 1776',
        ],
        es: [
          'el 4 de julio de 1776',
        ],
      },
    },
    {
      n: 64,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'A: Colonial Period and Independence', es: 'A: Época colonial e independencia' },
      question: {
        en: 'There were 13 original states. Name three.',
        es: 'Nombre tres de los estados originales.',
      },
      answers: {
        en: [
          'New Hampshire',
          'Massachusetts',
          'Rhode Island',
          'Connecticut',
          'New York',
          'New Jersey',
          'Pennsylvania',
          'Delaware',
          'Maryland',
          'Virginia',
          'North Carolina',
          'South Carolina',
          'Georgia',
        ],
        es: [
          'Nueva Hampshire',
          'Massachusetts',
          'Rhode Island',
          'Connecticut',
          'Nueva York',
          'Nueva Jersey',
          'Pensilvania',
          'Delaware',
          'Maryland',
          'Virginia',
          'Carolina del Norte',
          'Carolina del Sur',
          'Georgia',
        ],
      },
      count: 3,
    },
    {
      n: 65,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'A: Colonial Period and Independence', es: 'A: Época colonial e independencia' },
      question: {
        en: 'What happened at the Constitutional Convention?',
        es: '¿Qué ocurrió en la Convención Constitucional?',
      },
      answers: {
        en: [
          'The Constitution was written.',
          'The Founding Fathers wrote the Constitution.',
        ],
        es: [
          'se redactó la Constitución',
          'los padres fundadores redactaron la Constitución',
        ],
      },
    },
    {
      n: 66,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'A: Colonial Period and Independence', es: 'A: Época colonial e independencia' },
      question: {
        en: 'When was the Constitution written?',
        es: '¿Cuándo fue redactada la Constitución?',
      },
      answers: {
        en: [
          '1787',
        ],
        es: [
          '1787',
        ],
      },
    },
    {
      n: 67,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'A: Colonial Period and Independence', es: 'A: Época colonial e independencia' },
      question: {
        en: 'The Federalist Papers supported the passage of the U.S. Constitution. Name one of the writers.',
        es: 'Los escritos conocidos como “Los Documentos Federalistas” respaldaron la aprobación de la Constitución de Estados Unidos. Nombre uno de sus autores.',
      },
      answers: {
        en: [
          '(James) Madison',
          '(Alexander) Hamilton',
          '(John) Jay',
          'Publius',
        ],
        es: [
          '(James) Madison',
          '(Alexander) Hamilton',
          '(John) Jay',
          'Publius',
        ],
      },
    },
    {
      n: 68,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'A: Colonial Period and Independence', es: 'A: Época colonial e independencia' },
      question: {
        en: 'What is one thing Benjamin Franklin is famous for?',
        es: 'Mencione una razón por la que es famoso Benjamin Franklin.',
      },
      answers: {
        en: [
          'U.S. diplomat',
          'oldest member of the Constitutional Convention',
          'first Postmaster General of the United States',
          'writer of “Poor Richard’s Almanac”',
          'started the first free libraries',
        ],
        es: [
          'diplomático estadounidense',
          'era el miembro de mayor edad de la Convención Constitucional',
          'primer director general de la Oficina de Correos de Estados Unidos',
          'autor de “Poor Richard’s almanac” (Almanaque del Pobre Richard)',
          'fundó las primeras bibliotecas gratuitas',
        ],
      },
    },
    {
      n: 69,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'A: Colonial Period and Independence', es: 'A: Época colonial e independencia' },
      question: {
        en: 'Who is the “Father of Our Country”?',
        es: '¿Quién se conoce como el “Padre de Nuestra Nación”?',
      },
      answers: {
        en: [
          '(George) Washington',
        ],
        es: [
          '(George) Washington',
        ],
      },
    },
    {
      n: 70,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'A: Colonial Period and Independence', es: 'A: Época colonial e independencia' },
      question: {
        en: 'Who was the first President?',
        es: '¿Quién fue el primer presidente?',
      },
      answers: {
        en: [
          '(George) Washington',
        ],
        es: [
          '(George) Washington',
        ],
      },
      star: true,
    },
    {
      n: 71,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'B: 1800s', es: 'B: Siglo 19 (los años 1800)' },
      question: {
        en: 'What territory did the United States buy from France in 1803?',
        es: '¿Qué territorio compró Estados Unidos a Francia en 1803?',
      },
      answers: {
        en: [
          'the Louisiana Territory',
          'Louisiana',
        ],
        es: [
          'el territorio de Luisiana',
          'Luisiana',
        ],
      },
    },
    {
      n: 72,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'B: 1800s', es: 'B: Siglo 19 (los años 1800)' },
      question: {
        en: 'Name one war fought by the United States in the 1800s.',
        es: 'Mencione una guerra en la que combatió Estados Unidos durante los años 1800.',
      },
      answers: {
        en: [
          'War of 1812',
          'Mexican-American War',
          'Civil War',
          'Spanish-American War',
        ],
        es: [
          'la Guerra de 1812',
          'la Guerra entre México y Estados Unidos',
          'la Guerra Civil',
          'la Guerra Hispanoestadounidense (Hispanoamericana)',
        ],
      },
    },
    {
      n: 73,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'B: 1800s', es: 'B: Siglo 19 (los años 1800)' },
      question: {
        en: 'Name the U.S. war between the North and the South.',
        es: '¿Cuál es el nombre de la guerra entre el Norte y el Sur de Estados Unidos?',
      },
      answers: {
        en: [
          'the Civil War',
          'the War between the States',
        ],
        es: [
          'la Guerra Civil',
          'la Guerra entre Estados',
        ],
      },
    },
    {
      n: 74,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'B: 1800s', es: 'B: Siglo 19 (los años 1800)' },
      question: {
        en: 'Name one problem that led to the Civil War.',
        es: 'Mencione un problema que condujo a la Guerra Civil.',
      },
      answers: {
        en: [
          'slavery',
          'economic reasons',
          'states’ rights',
        ],
        es: [
          'esclavitud',
          'razones económicas',
          'derechos de los estados',
        ],
      },
    },
    {
      n: 75,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'B: 1800s', es: 'B: Siglo 19 (los años 1800)' },
      question: {
        en: 'What was one important thing that Abraham Lincoln did?',
        es: '¿Cuál fue una cosa importante que hizo Abraham Lincoln?',
      },
      answers: {
        en: [
          'freed the slaves (Emancipation Proclamation)',
          'saved (or preserved) the Union',
          'led the United States during the Civil War',
        ],
        es: [
          'liberó a los esclavos (Proclamación de la Emancipación)',
          'salvó (o preservó) la Unión',
          'presidió (dirigió) Estados Unidos durante la Guerra Civil',
        ],
      },
      star: true,
    },
    {
      n: 76,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'B: 1800s', es: 'B: Siglo 19 (los años 1800)' },
      question: {
        en: 'What did the Emancipation Proclamation do?',
        es: '¿Qué hizo la Proclamación de la Emancipación?',
      },
      answers: {
        en: [
          'freed the slaves',
          'freed slaves in the Confederacy',
          'freed slaves in the Confederate states',
          'freed slaves in most Southern states',
        ],
        es: [
          'liberó a los esclavos',
          'liberó a los esclavos de la Confederación',
          'liberó a los esclavos en los estados de la Confederación',
          'liberó a los esclavos en la mayoría de los estados del sur',
        ],
      },
    },
    {
      n: 77,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'B: 1800s', es: 'B: Siglo 19 (los años 1800)' },
      question: {
        en: 'What did Susan B. Anthony do?',
        es: '¿Qué hizo Susan B. Anthony?',
      },
      answers: {
        en: [
          'fought for women’s rights',
          'fought for civil rights',
        ],
        es: [
          'luchó por los derechos de la mujer',
          'luchó por los derechos civiles',
        ],
      },
    },
    {
      n: 78,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'C: Recent American History and Other Important Historical Information', es: 'C: Historia Estadounidense Reciente y otra Información Histórica Importante' },
      question: {
        en: 'Name one war fought by the United States in the 1900s.',
        es: 'Mencione una guerra del siglo XX en la que combatió Estados Unidos.',
      },
      answers: {
        en: [
          'World War I',
          'World War II',
          'Korean War',
          'Vietnam War',
          '(Persian) Gulf War',
        ],
        es: [
          'la Primera Guerra Mundial',
          'la Segunda Guerra Mundial',
          'la Guerra de Corea',
          'la Guerra de Vietnam',
          'la Guerra del Golfo (Pérsico)',
        ],
      },
      star: true,
    },
    {
      n: 79,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'C: Recent American History and Other Important Historical Information', es: 'C: Historia Estadounidense Reciente y otra Información Histórica Importante' },
      question: {
        en: 'Who was President during World War I?',
        es: '¿Quién era el presidente durante la Primera Guerra Mundial?',
      },
      answers: {
        en: [
          '(Woodrow) Wilson',
        ],
        es: [
          '(Woodrow) Wilson',
        ],
      },
    },
    {
      n: 80,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'C: Recent American History and Other Important Historical Information', es: 'C: Historia Estadounidense Reciente y otra Información Histórica Importante' },
      question: {
        en: 'Who was President during the Great Depression and World War II?',
        es: '¿Quién era presidente durante la Gran Depresión y la Segunda Guerra Mundial?',
      },
      answers: {
        en: [
          '(Franklin) Roosevelt',
        ],
        es: [
          '(Franklin) Roosevelt',
        ],
      },
    },
    {
      n: 81,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'C: Recent American History and Other Important Historical Information', es: 'C: Historia Estadounidense Reciente y otra Información Histórica Importante' },
      question: {
        en: 'Who did the United States fight in World War II?',
        es: '¿Contra qué países peleó Estados Unidos en la Segunda Guerra Mundial?',
      },
      answers: {
        en: [
          'Japan, Germany, and Italy',
        ],
        es: [
          'Japón, Alemania e Italia',
        ],
      },
    },
    {
      n: 82,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'C: Recent American History and Other Important Historical Information', es: 'C: Historia Estadounidense Reciente y otra Información Histórica Importante' },
      question: {
        en: 'Before he was President, Eisenhower was a general. What war was he in?',
        es: 'Antes de ser presidente, Eisenhower era general. ¿En qué guerra participó?',
      },
      answers: {
        en: [
          'World War II',
        ],
        es: [
          'Segunda Guerra Mundial',
        ],
      },
    },
    {
      n: 83,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'C: Recent American History and Other Important Historical Information', es: 'C: Historia Estadounidense Reciente y otra Información Histórica Importante' },
      question: {
        en: 'During the Cold War, what was the main concern of the United States?',
        es: 'Durante la Guerra Fría, ¿cuál era la principal preocupación de Estados Unidos?',
      },
      answers: {
        en: [
          'Communism',
        ],
        es: [
          'comunismo',
        ],
      },
    },
    {
      n: 84,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'C: Recent American History and Other Important Historical Information', es: 'C: Historia Estadounidense Reciente y otra Información Histórica Importante' },
      question: {
        en: 'What movement tried to end racial discrimination?',
        es: '¿Qué movimiento trató de poner fin a la discriminación racial?',
      },
      answers: {
        en: [
          'civil rights (movement)',
        ],
        es: [
          '(el movimiento de) derechos civiles',
        ],
      },
    },
    {
      n: 85,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'C: Recent American History and Other Important Historical Information', es: 'C: Historia Estadounidense Reciente y otra Información Histórica Importante' },
      question: {
        en: 'What did Martin Luther King, Jr. do?',
        es: '¿Qué hizo Martin Luther King, Jr.?',
      },
      answers: {
        en: [
          'fought for civil rights',
          'worked for equality for all Americans',
        ],
        es: [
          'luchó por los derechos civiles',
          'trabajó por la igualdad de todos los ciudadanos estadounidenses',
        ],
      },
      star: true,
    },
    {
      n: 86,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'C: Recent American History and Other Important Historical Information', es: 'C: Historia Estadounidense Reciente y otra Información Histórica Importante' },
      question: {
        en: 'What major event happened on September 11, 2001, in the United States?',
        es: '¿Qué suceso de gran magnitud ocurrió el 11 de septiembre de 2001 en Estados Unidos?',
      },
      answers: {
        en: [
          'Terrorists attacked the United States.',
        ],
        es: [
          'terroristas atacaron a Estados Unidos.',
        ],
      },
    },
    {
      n: 87,
      part: { en: 'American History', es: 'Historia estadounidense' },
      section: { en: 'C: Recent American History and Other Important Historical Information', es: 'C: Historia Estadounidense Reciente y otra Información Histórica Importante' },
      question: {
        en: 'Name one American Indian tribe in the United States. [USCIS Officers will be supplied with a list of federally recognized American Indian tribes.]',
        es: 'Mencione una tribu de indios estadounidenses en Estados Unidos. [A los oficiales del USCIS se les dará una lista de tribus amerindias reconocidas a nivel federal].',
      },
      answers: {
        en: [
          'Cherokee',
          'Navajo',
          'Sioux',
          'Chippewa',
          'Choctaw',
          'Pueblo',
          'Apache',
          'Iroquois',
          'Creek',
          'Blackfeet',
          'Seminole',
          'Cheyenne',
          'Arawak',
          'Shawnee',
          'Mohegan',
          'Huron',
          'Oneida',
          'Lakota',
          'Crow',
          'Teton',
          'Hopi',
          'Inuit',
        ],
        es: [
          'Cherokee',
          'Navajo',
          'Sioux',
          'Chippewa',
          'Choctaw',
          'Pueblo',
          'Apache',
          'Iroquois',
          'Creek',
          'Blackfeet',
          'Seminole',
          'Cheyenne',
          'Arawak',
          'Shawnee',
          'Mohegan',
          'Huron',
          'Oneida',
          'Lakota',
          'Crow',
          'Teton',
          'Hopi',
          'Inuit',
        ],
      },
    },
    {
      n: 88,
      part: { en: 'Integrated Civics', es: 'Educación cívica integrada' },
      section: { en: 'A: Geography', es: 'A: Geografía' },
      question: {
        en: 'Name one of the two longest rivers in the United States.',
        es: 'Mencione uno de los dos ríos más largos en Estados Unidos.',
      },
      answers: {
        en: [
          'Missouri (River)',
          'Mississippi (River)',
        ],
        es: [
          '(el Río) Missouri',
          '(el Río) Mississippi',
        ],
      },
    },
    {
      n: 89,
      part: { en: 'Integrated Civics', es: 'Educación cívica integrada' },
      section: { en: 'A: Geography', es: 'A: Geografía' },
      question: {
        en: 'What ocean is on the West Coast of the United States?',
        es: '¿Qué océano está en la costa oeste de Estados Unidos?',
      },
      answers: {
        en: [
          'Pacific (Ocean)',
        ],
        es: [
          '(el Océano) Pacífico',
        ],
      },
    },
    {
      n: 90,
      part: { en: 'Integrated Civics', es: 'Educación cívica integrada' },
      section: { en: 'A: Geography', es: 'A: Geografía' },
      question: {
        en: 'What ocean is on the East Coast of the United States?',
        es: '¿Qué océano está en la costa este de Estados Unidos?',
      },
      answers: {
        en: [
          'Atlantic (Ocean)',
        ],
        es: [
          '(el Océano) Atlántico',
        ],
      },
    },
    {
      n: 91,
      part: { en: 'Integrated Civics', es: 'Educación cívica integrada' },
      section: { en: 'A: Geography', es: 'A: Geografía' },
      question: {
        en: 'Name one U.S. territory.',
        es: 'Dé el nombre de un territorio de Estados Unidos.',
      },
      answers: {
        en: [
          'Puerto Rico',
          'U.S. Virgin Islands',
          'American Samoa',
          'Northern Mariana Islands',
          'Guam',
        ],
        es: [
          'Puerto Rico',
          'Islas Vírgenes de Estados Unidos',
          'Samoa Estadounidense',
          'Islas Marianas del Norte',
          'Guam',
        ],
      },
    },
    {
      n: 92,
      part: { en: 'Integrated Civics', es: 'Educación cívica integrada' },
      section: { en: 'A: Geography', es: 'A: Geografía' },
      question: {
        en: 'Name one state that borders Canada.',
        es: 'Mencione un estado que tiene frontera con Canadá.',
      },
      answers: {
        en: [
          'Maine',
          'New Hampshire',
          'Vermont',
          'New York',
          'Pennsylvania',
          'Ohio',
          'Michigan',
          'Minnesota',
          'North Dakota',
          'Montana',
          'Idaho',
          'Washington',
          'Alaska',
        ],
        es: [
          'Maine',
          'Nueva Hampshire',
          'Vermont',
          'Nueva York',
          'Pensilvania',
          'Ohio',
          'Michigan',
          'Minnesota',
          'Dakota del Norte',
          'Montana',
          'Idaho',
          'Washington',
          'Alaska',
        ],
      },
    },
    {
      n: 93,
      part: { en: 'Integrated Civics', es: 'Educación cívica integrada' },
      section: { en: 'A: Geography', es: 'A: Geografía' },
      question: {
        en: 'Name one state that borders Mexico.',
        es: 'Mencione un estado que tiene frontera con México.',
      },
      answers: {
        en: [
          'California',
          'Arizona',
          'New Mexico',
          'Texas',
        ],
        es: [
          'California',
          'Arizona',
          'Nuevo México',
          'Texas',
        ],
      },
    },
    {
      n: 94,
      part: { en: 'Integrated Civics', es: 'Educación cívica integrada' },
      section: { en: 'A: Geography', es: 'A: Geografía' },
      question: {
        en: 'What is the capital of the United States?',
        es: '¿Cuál es la capital de Estados Unidos?',
      },
      answers: {
        en: [
          'Washington, D.C.',
        ],
        es: [
          'Washington, Distrito de Columbia',
        ],
      },
      star: true,
    },
    {
      n: 95,
      part: { en: 'Integrated Civics', es: 'Educación cívica integrada' },
      section: { en: 'A: Geography', es: 'A: Geografía' },
      question: {
        en: 'Where is the Statue of Liberty?',
        es: '¿Dónde está la Estatua de la Libertad?',
      },
      answers: {
        en: [
          'New York (Harbor)',
          'Liberty Island',
          '[Also acceptable are New Jersey, near New York City, and on the Hudson (River).]',
        ],
        es: [
          '(el puerto de) Nueva York',
          'Liberty Island',
          '[Otras respuestas aceptables son Nueva Jersey, cerca de la Ciudad de Nueva York y (el río) Hudson].',
        ],
      },
      star: true,
    },
    {
      n: 96,
      part: { en: 'Integrated Civics', es: 'Educación cívica integrada' },
      section: { en: 'B: Symbols', es: 'B: Símbolos' },
      question: {
        en: 'Why does the flag have 13 stripes?',
        es: '¿Por qué hay 13 franjas en la bandera?',
      },
      answers: {
        en: [
          'because there were 13 original colonies',
          'because the stripes represent the original colonies',
        ],
        es: [
          'porque representan las 13 colonias originales',
          'porque las franjas representan las colonias originales',
        ],
      },
    },
    {
      n: 97,
      part: { en: 'Integrated Civics', es: 'Educación cívica integrada' },
      section: { en: 'B: Symbols', es: 'B: Símbolos' },
      question: {
        en: 'Why does the flag have 50 stars?',
        es: '¿Por qué hay 50 estrellas en la bandera?',
      },
      answers: {
        en: [
          'because there is one star for each state',
          'because each star represents a state',
          'because there are 50 states',
        ],
        es: [
          'porque hay una estrella por cada estado',
          'porque cada estrella representa un estado',
          'porque hay 50 estados',
        ],
      },
      star: true,
    },
    {
      n: 98,
      part: { en: 'Integrated Civics', es: 'Educación cívica integrada' },
      section: { en: 'B: Symbols', es: 'B: Símbolos' },
      question: {
        en: 'What is the name of the national anthem?',
        es: '¿Cómo se llama el himno nacional?',
      },
      answers: {
        en: [
          'The Star-Spangled Banner',
        ],
        es: [
          'The Star-Spangled Banner',
        ],
      },
    },
    {
      n: 99,
      part: { en: 'Integrated Civics', es: 'Educación cívica integrada' },
      section: { en: 'C: Holidays', es: 'C: Días feriados' },
      question: {
        en: 'When do we celebrate Independence Day?',
        es: '¿Cuándo celebramos el Día de la Independencia?',
      },
      answers: {
        en: [
          'July 4',
        ],
        es: [
          'el 4 de julio',
        ],
      },
      star: true,
    },
    {
      n: 100,
      part: { en: 'Integrated Civics', es: 'Educación cívica integrada' },
      section: { en: 'C: Holidays', es: 'C: Días feriados' },
      question: {
        en: 'Name two national U.S. holidays.',
        es: 'Mencione dos días feriados nacionales de Estados Unidos.',
      },
      answers: {
        en: [
          'New Year’s Day',
          'Martin Luther King, Jr. Day',
          'Presidents’ Day',
          'Memorial Day',
          'Juneteenth',
          'Independence Day',
          'Labor Day',
          'Columbus Day',
          'Veterans Day',
          'Thanksgiving',
          'Christmas',
        ],
        es: [
          'Día de Año Nuevo',
          'Día de Martin Luther King, Jr.',
          'Día de los Presidentes',
          'Día de la Recordación',
          'Día de la Liberación (Juneteenth)',
          'Día de la Independencia',
          'Día del Trabajo',
          'Día de la Raza (Cristóbal Colón)',
          'Día de los Veteranos',
          'Día de Acción de Gracias',
          'Día de Navidad',
        ],
      },
      count: 2,
    },
  ],
};
