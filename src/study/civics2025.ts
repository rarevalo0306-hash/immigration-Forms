// Source: USCIS "128 Civics Questions and Answers (2025 version)", M-1778 (09/25). English is verbatim; Spanish is Camino's translation.
import type { T } from '../i18n';
import type { CivicsQuestion, CivicsTest } from './types';

const GOV: T = { en: 'American Government', es: 'Gobierno estadounidense' };
const HIST: T = { en: 'American History', es: 'Historia estadounidense' };
const SYM: T = { en: 'Symbols and Holidays', es: 'Símbolos y días feriados' };
const GOV_A: T = { en: 'A: Principles of American Government', es: 'A: Principios del gobierno estadounidense' };
const GOV_B: T = { en: 'B: System of Government', es: 'B: Sistema de gobierno' };
const GOV_C: T = { en: 'C: Rights and Responsibilities', es: 'C: Derechos y responsabilidades' };
const HIST_A: T = { en: 'A: Colonial Period and Independence', es: 'A: Época colonial e independencia' };
const HIST_B: T = { en: 'B: 1800s', es: 'B: Siglo 19 (los años 1800)' };
const HIST_C: T = { en: 'C: Recent American History and Other Important Historical Information', es: 'C: Historia estadounidense reciente y otra información histórica importante' };
const SYM_A: T = { en: 'A: Symbols', es: 'A: Símbolos' };
const SYM_B: T = { en: 'B: Holidays', es: 'B: Días feriados' };

const questions: CivicsQuestion[] = [
  {
    n: 1,
    part: GOV,
    section: GOV_A,
    question: { en: 'What is the form of government of the United States?', es: '¿Cuál es la forma de gobierno de Estados Unidos?' },
    answers: {
      en: ['Republic', 'Constitution-based federal republic', 'Representative democracy'],
      es: ['República', 'República federal basada en la Constitución', 'Democracia representativa'],
    },
  },
  {
    n: 2,
    part: GOV,
    section: GOV_A,
    question: { en: 'What is the supreme law of the land?', es: '¿Cuál es la ley suprema de la nación?' },
    answers: {
      en: ['(U.S.) Constitution'],
      es: ['Constitución (de Estados Unidos)'],
    },
    star: true,
  },
  {
    n: 3,
    part: GOV,
    section: GOV_A,
    question: { en: 'Name one thing the U.S. Constitution does.', es: 'Mencione una cosa que hace la Constitución de Estados Unidos.' },
    answers: {
      en: ['Forms the government', 'Defines powers of government', 'Defines the parts of government', 'Protects the rights of the people'],
      es: ['Establece el gobierno', 'Define los poderes del gobierno', 'Define las partes del gobierno', 'Protege los derechos del pueblo'],
    },
  },
  {
    n: 4,
    part: GOV,
    section: GOV_A,
    question: { en: 'The U.S. Constitution starts with the words “We the People.” What does “We the People” mean?', es: 'La Constitución de Estados Unidos comienza con las palabras “We the People” (“Nosotros, el pueblo”). ¿Qué significa “Nosotros, el pueblo”?' },
    answers: {
      en: ['Self-government', 'Popular sovereignty', 'Consent of the governed', 'People should govern themselves', '(Example of) social contract'],
      es: ['Autogobierno', 'Soberanía popular', 'Consentimiento de los gobernados', 'El pueblo debe gobernarse a sí mismo', '(Ejemplo de) contrato social'],
    },
  },
  {
    n: 5,
    part: GOV,
    section: GOV_A,
    question: { en: 'How are changes made to the U.S. Constitution?', es: '¿Cómo se hacen cambios a la Constitución de Estados Unidos?' },
    answers: {
      en: ['Amendments', 'The amendment process'],
      es: ['Enmiendas', 'El proceso de enmienda'],
    },
  },
  {
    n: 6,
    part: GOV,
    section: GOV_A,
    question: { en: 'What does the Bill of Rights protect?', es: '¿Qué protege la Carta de Derechos?' },
    answers: {
      en: ['(The basic) rights of Americans', '(The basic) rights of people living in the United States'],
      es: ['(Los) derechos (básicos) de los estadounidenses', '(Los) derechos (básicos) de las personas que viven en Estados Unidos'],
    },
  },
  {
    n: 7,
    part: GOV,
    section: GOV_A,
    question: { en: 'How many amendments does the U.S. Constitution have?', es: '¿Cuántas enmiendas tiene la Constitución de Estados Unidos?' },
    answers: {
      en: ['Twenty-seven (27)'],
      es: ['Veintisiete (27)'],
    },
    star: true,
  },
  {
    n: 8,
    part: GOV,
    section: GOV_A,
    question: { en: 'Why is the Declaration of Independence important?', es: '¿Por qué es importante la Declaración de Independencia?' },
    answers: {
      en: ['It says America is free from British control.', 'It says all people are created equal.', 'It identifies inherent rights.', 'It identifies individual freedoms.'],
      es: ['Dice que Estados Unidos es libre del control británico.', 'Dice que todas las personas son creadas iguales.', 'Identifica derechos inherentes.', 'Identifica libertades individuales.'],
    },
  },
  {
    n: 9,
    part: GOV,
    section: GOV_A,
    question: { en: 'What founding document said the American colonies were free from Britain?', es: '¿Qué documento fundacional dijo que las colonias americanas eran libres de Gran Bretaña?' },
    answers: {
      en: ['Declaration of Independence'],
      es: ['Declaración de Independencia'],
    },
  },
  {
    n: 10,
    part: GOV,
    section: GOV_A,
    question: { en: 'Name two important ideas from the Declaration of Independence and the U.S. Constitution.', es: 'Mencione dos ideas importantes de la Declaración de Independencia y de la Constitución de Estados Unidos.' },
    answers: {
      en: ['Equality', 'Liberty', 'Social contract', 'Natural rights', 'Limited government', 'Self-government'],
      es: ['Igualdad', 'Libertad', 'Contrato social', 'Derechos naturales', 'Gobierno limitado', 'Autogobierno'],
    },
    count: 2,
  },
  {
    n: 11,
    part: GOV,
    section: GOV_A,
    question: { en: 'The words “Life, Liberty, and the pursuit of Happiness” are in what founding document?', es: '¿En qué documento fundacional están las palabras “Life, Liberty, and the pursuit of Happiness” (“la vida, la libertad y la búsqueda de la felicidad”)?' },
    answers: {
      en: ['Declaration of Independence'],
      es: ['Declaración de Independencia'],
    },
  },
  {
    n: 12,
    part: GOV,
    section: GOV_A,
    question: { en: 'What is the economic system of the United States?', es: '¿Cuál es el sistema económico de Estados Unidos?' },
    answers: {
      en: ['Capitalism', 'Free market economy'],
      es: ['Capitalismo', 'Economía de libre mercado'],
    },
    star: true,
  },
  {
    n: 13,
    part: GOV,
    section: GOV_A,
    question: { en: 'What is the rule of law?', es: '¿Qué es el estado de derecho?' },
    answers: {
      en: ['Everyone must follow the law.', 'Leaders must obey the law.', 'Government must obey the law.', 'No one is above the law.'],
      es: ['Todos deben obedecer la ley.', 'Los líderes deben obedecer la ley.', 'El gobierno debe obedecer la ley.', 'Nadie está por encima de la ley.'],
    },
  },
  {
    n: 14,
    part: GOV,
    section: GOV_A,
    question: { en: 'Many documents influenced the U.S. Constitution. Name one.', es: 'Muchos documentos influyeron en la Constitución de Estados Unidos. Mencione uno.' },
    answers: {
      en: ['Declaration of Independence', 'Articles of Confederation', 'Federalist Papers', 'Anti-Federalist Papers', 'Virginia Declaration of Rights', 'Fundamental Orders of Connecticut', 'Mayflower Compact', 'Iroquois Great Law of Peace'],
      es: ['Declaración de Independencia', 'Artículos de la Confederación', 'Documentos Federalistas', 'Documentos Antifederalistas', 'Declaración de Derechos de Virginia', 'Órdenes Fundamentales de Connecticut', 'Pacto del Mayflower', 'Gran Ley de la Paz de los iroqueses'],
    },
  },
  {
    n: 15,
    part: GOV,
    section: GOV_A,
    question: { en: 'There are three branches of government. Why?', es: 'Hay tres ramas del gobierno. ¿Por qué?' },
    answers: {
      en: ['So one part does not become too powerful', 'Checks and balances', 'Separation of powers'],
      es: ['Para que una parte no se vuelva demasiado poderosa', 'Pesos y contrapesos', 'Separación de poderes'],
    },
  },
  {
    n: 16,
    part: GOV,
    section: GOV_B,
    question: { en: 'Name the three branches of government.', es: 'Mencione las tres ramas del gobierno.' },
    answers: {
      en: ['Legislative, executive, and judicial', 'Congress, president, and the courts'],
      es: ['Legislativa, ejecutiva y judicial', 'El Congreso, el presidente y los tribunales'],
    },
  },
  {
    n: 17,
    part: GOV,
    section: GOV_B,
    question: { en: 'The President of the United States is in charge of which branch of government?', es: '¿De qué rama del gobierno está a cargo el presidente de Estados Unidos?' },
    answers: {
      en: ['Executive branch'],
      es: ['Rama ejecutiva'],
    },
  },
  {
    n: 18,
    part: GOV,
    section: GOV_B,
    question: { en: 'What part of the federal government writes laws?', es: '¿Qué parte del gobierno federal escribe las leyes?' },
    answers: {
      en: ['(U.S.) Congress', '(U.S. or national) legislature', 'Legislative branch'],
      es: ['Congreso (de Estados Unidos)', 'Legislatura (nacional o de Estados Unidos)', 'Rama legislativa'],
    },
  },
  {
    n: 19,
    part: GOV,
    section: GOV_B,
    question: { en: 'What are the two parts of the U.S. Congress?', es: '¿Cuáles son las dos partes del Congreso de Estados Unidos?' },
    answers: {
      en: ['Senate and House (of Representatives)'],
      es: ['El Senado y la Cámara (de Representantes)'],
    },
  },
  {
    n: 20,
    part: GOV,
    section: GOV_B,
    question: { en: 'Name one power of the U.S. Congress.', es: 'Mencione un poder del Congreso de Estados Unidos.' },
    answers: {
      en: ['Writes laws', 'Declares war', 'Makes the federal budget'],
      es: ['Escribe las leyes', 'Declara la guerra', 'Elabora el presupuesto federal'],
    },
    star: true,
  },
  {
    n: 21,
    part: GOV,
    section: GOV_B,
    question: { en: 'How many U.S. senators are there?', es: '¿Cuántos senadores hay en Estados Unidos?' },
    answers: {
      en: ['One hundred (100)'],
      es: ['Cien (100)'],
    },
  },
  {
    n: 22,
    part: GOV,
    section: GOV_B,
    question: { en: 'How long is a term for a U.S. senator?', es: '¿De cuántos años es el término de un senador de Estados Unidos?' },
    answers: {
      en: ['Six (6) years'],
      es: ['Seis (6) años'],
    },
  },
  {
    n: 23,
    part: GOV,
    section: GOV_B,
    question: { en: 'Who is one of your state’s U.S. senators now?', es: '¿Quién es uno de los senadores actuales de Estados Unidos por su estado?' },
    answers: {
      en: ['Answers will vary. [District of Columbia residents and residents of U.S. territories should answer that D.C. (or the territory where the applicant lives) has no U.S. senators.]'],
      es: ['Las respuestas varían. [Los residentes del Distrito de Columbia y de los territorios de Estados Unidos deben contestar que D.C. (o el territorio donde vive el solicitante) no tiene senadores de Estados Unidos.]'],
    },
    varies: 'senator',
  },
  {
    n: 24,
    part: GOV,
    section: GOV_B,
    question: { en: 'How many voting members are in the House of Representatives?', es: '¿Cuántos miembros votantes hay en la Cámara de Representantes?' },
    answers: {
      en: ['Four hundred thirty-five (435)'],
      es: ['Cuatrocientos treinta y cinco (435)'],
    },
  },
  {
    n: 25,
    part: GOV,
    section: GOV_B,
    question: { en: 'How long is a term for a member of the House of Representatives?', es: '¿De cuántos años es el término de un miembro de la Cámara de Representantes?' },
    answers: {
      en: ['Two (2) years'],
      es: ['Dos (2) años'],
    },
  },
  {
    n: 26,
    part: GOV,
    section: GOV_B,
    question: { en: 'Why do U.S. representatives serve shorter terms than U.S. senators?', es: '¿Por qué los representantes de Estados Unidos tienen términos más cortos que los senadores de Estados Unidos?' },
    answers: {
      en: ['To more closely follow public opinion'],
      es: ['Para seguir más de cerca la opinión pública'],
    },
  },
  {
    n: 27,
    part: GOV,
    section: GOV_B,
    question: { en: 'How many senators does each state have?', es: '¿Cuántos senadores tiene cada estado?' },
    answers: {
      en: ['Two (2)'],
      es: ['Dos (2)'],
    },
  },
  {
    n: 28,
    part: GOV,
    section: GOV_B,
    question: { en: 'Why does each state have two senators?', es: '¿Por qué cada estado tiene dos senadores?' },
    answers: {
      en: ['Equal representation (for small states)', 'The Great Compromise (Connecticut Compromise)'],
      es: ['Representación igualitaria (para los estados pequeños)', 'El Gran Compromiso (Compromiso de Connecticut)'],
    },
  },
  {
    n: 29,
    part: GOV,
    section: GOV_B,
    question: { en: 'Name your U.S. representative.', es: 'Mencione el nombre de su representante de Estados Unidos.' },
    answers: {
      en: ['Answers will vary. [Residents of territories with nonvoting Delegates or Resident Commissioners may provide the name of that Delegate or Commissioner. Also acceptable is any statement that the territory has no (voting) representatives in Congress.]'],
      es: ['Las respuestas varían. [Los residentes de territorios con delegados sin voto o comisionados residentes pueden decir el nombre de ese delegado o comisionado. También es aceptable cualquier respuesta que indique que el territorio no tiene representantes (con voto) en el Congreso.]'],
    },
    varies: 'representative',
  },
  {
    n: 30,
    part: GOV,
    section: GOV_B,
    question: { en: 'What is the name of the Speaker of the House of Representatives now?', es: '¿Cómo se llama el portavoz actual de la Cámara de Representantes?' },
    answers: {
      en: ['Visit uscis.gov/citizenship/testupdates for the name of the Speaker of the House of Representatives.'],
      es: ['Visite uscis.gov/citizenship/testupdates para saber el nombre del portavoz de la Cámara de Representantes.'],
    },
    star: true,
    varies: 'speaker',
  },
  {
    n: 31,
    part: GOV,
    section: GOV_B,
    question: { en: 'Who does a U.S. senator represent?', es: '¿A quién representa un senador de Estados Unidos?' },
    answers: {
      en: ['Citizens of their state', 'People of their state'],
      es: ['A los ciudadanos de su estado', 'A las personas de su estado'],
    },
  },
  {
    n: 32,
    part: GOV,
    section: GOV_B,
    question: { en: 'Who elects U.S. senators?', es: '¿Quién elige a los senadores de Estados Unidos?' },
    answers: {
      en: ['Citizens from their state'],
      es: ['Los ciudadanos de su estado'],
    },
  },
  {
    n: 33,
    part: GOV,
    section: GOV_B,
    question: { en: 'Who does a member of the House of Representatives represent?', es: '¿A quién representa un miembro de la Cámara de Representantes?' },
    answers: {
      en: ['Citizens in their (congressional) district', 'Citizens in their district', 'People from their (congressional) district', 'People in their district'],
      es: ['A los ciudadanos de su distrito (congresional)', 'A los ciudadanos de su distrito', 'A las personas de su distrito (congresional)', 'A las personas de su distrito'],
    },
  },
  {
    n: 34,
    part: GOV,
    section: GOV_B,
    question: { en: 'Who elects members of the House of Representatives?', es: '¿Quién elige a los miembros de la Cámara de Representantes?' },
    answers: {
      en: ['Citizens from their (congressional) district'],
      es: ['Los ciudadanos de su distrito (congresional)'],
    },
  },
  {
    n: 35,
    part: GOV,
    section: GOV_B,
    question: { en: 'Some states have more representatives than other states. Why?', es: 'Algunos estados tienen más representantes que otros. ¿Por qué?' },
    answers: {
      en: ['(Because of) the state’s population', '(Because) they have more people', '(Because) some states have more people'],
      es: ['(Debido a) la población del estado', '(Debido a que) tienen más gente', '(Debido a que) algunos estados tienen más gente'],
    },
  },
  {
    n: 36,
    part: GOV,
    section: GOV_B,
    question: { en: 'The President of the United States is elected for how many years?', es: '¿Por cuántos años se elige al presidente de Estados Unidos?' },
    answers: {
      en: ['Four (4) years'],
      es: ['Cuatro (4) años'],
    },
    star: true,
  },
  {
    n: 37,
    part: GOV,
    section: GOV_B,
    question: { en: 'The President of the United States can serve only two terms. Why?', es: 'El presidente de Estados Unidos solo puede servir dos términos. ¿Por qué?' },
    answers: {
      en: ['(Because of) the 22nd Amendment', 'To keep the president from becoming too powerful'],
      es: ['(Debido a) la Enmienda 22', 'Para evitar que el presidente se vuelva demasiado poderoso'],
    },
  },
  {
    n: 38,
    part: GOV,
    section: GOV_B,
    question: { en: 'What is the name of the President of the United States now?', es: '¿Cómo se llama el actual presidente de Estados Unidos?' },
    answers: {
      en: ['Visit uscis.gov/citizenship/testupdates for the name of the President of the United States.'],
      es: ['Visite uscis.gov/citizenship/testupdates para saber el nombre del presidente de Estados Unidos.'],
    },
    star: true,
    varies: 'president',
  },
  {
    n: 39,
    part: GOV,
    section: GOV_B,
    question: { en: 'What is the name of the Vice President of the United States now?', es: '¿Cómo se llama el actual vicepresidente de Estados Unidos?' },
    answers: {
      en: ['Visit uscis.gov/citizenship/testupdates for the name of the Vice President of the United States.'],
      es: ['Visite uscis.gov/citizenship/testupdates para saber el nombre del vicepresidente de Estados Unidos.'],
    },
    star: true,
    varies: 'vicePresident',
  },
  {
    n: 40,
    part: GOV,
    section: GOV_B,
    question: { en: 'If the president can no longer serve, who becomes president?', es: 'Si el presidente ya no puede cumplir sus funciones, ¿quién se convierte en presidente?' },
    answers: {
      en: ['The Vice President (of the United States)'],
      es: ['El vicepresidente (de Estados Unidos)'],
    },
  },
  {
    n: 41,
    part: GOV,
    section: GOV_B,
    question: { en: 'Name one power of the president.', es: 'Mencione un poder del presidente.' },
    answers: {
      en: ['Signs bills into law', 'Vetoes bills', 'Enforces laws', 'Commander in Chief (of the military)', 'Chief diplomat', 'Appoints federal judges'],
      es: ['Firma los proyectos de ley para convertirlos en ley', 'Veta los proyectos de ley', 'Hace cumplir las leyes', 'Comandante en jefe (de las Fuerzas Armadas)', 'Diplomático principal', 'Nombra a los jueces federales'],
    },
  },
  {
    n: 42,
    part: GOV,
    section: GOV_B,
    question: { en: 'Who is Commander in Chief of the U.S. military?', es: '¿Quién es el comandante en jefe de las Fuerzas Armadas de Estados Unidos?' },
    answers: {
      en: ['The President (of the United States)'],
      es: ['El presidente (de Estados Unidos)'],
    },
  },
  {
    n: 43,
    part: GOV,
    section: GOV_B,
    question: { en: 'Who signs bills to become laws?', es: '¿Quién firma los proyectos de ley para convertirlos en ley?' },
    answers: {
      en: ['The President (of the United States)'],
      es: ['El presidente (de Estados Unidos)'],
    },
  },
  {
    n: 44,
    part: GOV,
    section: GOV_B,
    question: { en: 'Who vetoes bills?', es: '¿Quién veta los proyectos de ley?' },
    answers: {
      en: ['The President (of the United States)'],
      es: ['El presidente (de Estados Unidos)'],
    },
    star: true,
  },
  {
    n: 45,
    part: GOV,
    section: GOV_B,
    question: { en: 'Who appoints federal judges?', es: '¿Quién nombra a los jueces federales?' },
    answers: {
      en: ['The President (of the United States)'],
      es: ['El presidente (de Estados Unidos)'],
    },
  },
  {
    n: 46,
    part: GOV,
    section: GOV_B,
    question: { en: 'The executive branch has many parts. Name one.', es: 'La rama ejecutiva tiene muchas partes. Mencione una.' },
    answers: {
      en: ['President (of the United States)', 'Cabinet', 'Federal departments and agencies'],
      es: ['Presidente (de Estados Unidos)', 'Gabinete', 'Departamentos y agencias federales'],
    },
  },
  {
    n: 47,
    part: GOV,
    section: GOV_B,
    question: { en: 'What does the President’s Cabinet do?', es: '¿Qué hace el gabinete del presidente?' },
    answers: {
      en: ['Advises the President (of the United States)'],
      es: ['Asesora al presidente (de Estados Unidos)'],
    },
  },
  {
    n: 48,
    part: GOV,
    section: GOV_B,
    question: { en: 'What are two Cabinet-level positions?', es: '¿Cuáles son dos puestos a nivel de gabinete?' },
    answers: {
      en: ['Attorney General', 'Secretary of Agriculture', 'Secretary of Commerce', 'Secretary of Education', 'Secretary of Energy', 'Secretary of Health and Human Services', 'Secretary of Homeland Security', 'Secretary of Housing and Urban Development', 'Secretary of the Interior', 'Secretary of Labor', 'Secretary of State', 'Secretary of Transportation', 'Secretary of the Treasury', 'Secretary of Veterans Affairs', 'Secretary of War (Defense)', 'Vice-President', 'Administrator of the Environmental Protection Agency', 'Administrator of the Small Business Administration', 'Director of the Central Intelligence Agency', 'Director of the Office of Management and Budget', 'Director of National Intelligence', 'United States Trade Representative'],
      es: ['Procurador general (fiscal general)', 'Secretario de Agricultura', 'Secretario de Comercio', 'Secretario de Educación', 'Secretario de Energía', 'Secretario de Salud y Servicios Humanos', 'Secretario de Seguridad Nacional', 'Secretario de Vivienda y Desarrollo Urbano', 'Secretario del Interior', 'Secretario del Trabajo', 'Secretario de Estado', 'Secretario de Transporte', 'Secretario del Tesoro', 'Secretario de Asuntos de los Veteranos', 'Secretario de Guerra (Defensa)', 'Vicepresidente', 'Administrador de la Agencia de Protección Ambiental', 'Administrador de la Administración de Pequeñas Empresas', 'Director de la Agencia Central de Inteligencia', 'Director de la Oficina de Administración y Presupuesto', 'Director de Inteligencia Nacional', 'Representante Comercial de Estados Unidos'],
    },
    count: 2,
  },
  {
    n: 49,
    part: GOV,
    section: GOV_B,
    question: { en: 'Why is the Electoral College important?', es: '¿Por qué es importante el Colegio Electoral?' },
    answers: {
      en: ['It decides who is elected president.', 'It provides a compromise between the popular election of the president and congressional selection.'],
      es: ['Decide quién es elegido presidente.', 'Ofrece un punto medio entre la elección del presidente por voto popular y la selección por parte del Congreso.'],
    },
  },
  {
    n: 50,
    part: GOV,
    section: GOV_B,
    question: { en: 'What is one part of the judicial branch?', es: '¿Cuál es una parte de la rama judicial?' },
    answers: {
      en: ['Supreme Court', 'Federal Courts'],
      es: ['Corte Suprema', 'Tribunales federales'],
    },
  },
  {
    n: 51,
    part: GOV,
    section: GOV_B,
    question: { en: 'What does the judicial branch do?', es: '¿Qué hace la rama judicial?' },
    answers: {
      en: ['Reviews laws', 'Explains laws', 'Resolves disputes (disagreements) about the law', 'Decides if a law goes against the (U.S.) Constitution'],
      es: ['Revisa las leyes', 'Explica las leyes', 'Resuelve disputas (desacuerdos) sobre la ley', 'Decide si una ley va en contra de la Constitución (de Estados Unidos)'],
    },
  },
  {
    n: 52,
    part: GOV,
    section: GOV_B,
    question: { en: 'What is the highest court in the United States?', es: '¿Cuál es el tribunal más alto de Estados Unidos?' },
    answers: {
      en: ['Supreme Court'],
      es: ['Corte Suprema'],
    },
    star: true,
  },
  {
    n: 53,
    part: GOV,
    section: GOV_B,
    question: { en: 'How many seats are on the Supreme Court?', es: '¿Cuántos puestos hay en la Corte Suprema?' },
    answers: {
      en: ['Nine (9)'],
      es: ['Nueve (9)'],
    },
  },
  {
    n: 54,
    part: GOV,
    section: GOV_B,
    question: { en: 'How many Supreme Court justices are usually needed to decide a case?', es: '¿Cuántos jueces de la Corte Suprema se necesitan normalmente para decidir un caso?' },
    answers: {
      en: ['Five (5)'],
      es: ['Cinco (5)'],
    },
  },
  {
    n: 55,
    part: GOV,
    section: GOV_B,
    question: { en: 'How long do Supreme Court justices serve?', es: '¿Por cuánto tiempo sirven los jueces de la Corte Suprema?' },
    answers: {
      en: ['(For) life', 'Lifetime appointment', '(Until) retirement'],
      es: ['(De por) vida', 'Nombramiento vitalicio', '(Hasta) la jubilación'],
    },
  },
  {
    n: 56,
    part: GOV,
    section: GOV_B,
    question: { en: 'Supreme Court justices serve for life. Why?', es: 'Los jueces de la Corte Suprema sirven de por vida. ¿Por qué?' },
    answers: {
      en: ['To be independent (of politics)', 'To limit outside (political) influence'],
      es: ['Para ser independientes (de la política)', 'Para limitar la influencia externa (política)'],
    },
  },
  {
    n: 57,
    part: GOV,
    section: GOV_B,
    question: { en: 'Who is the Chief Justice of the United States now?', es: '¿Quién es el actual presidente de la Corte Suprema de Estados Unidos (Chief Justice)?' },
    answers: {
      en: ['Visit uscis.gov/citizenship/testupdates for the name of the Chief Justice of the United States.'],
      es: ['Visite uscis.gov/citizenship/testupdates para saber el nombre del presidente de la Corte Suprema de Estados Unidos (Chief Justice).'],
    },
    varies: 'chiefJustice',
  },
  {
    n: 58,
    part: GOV,
    section: GOV_B,
    question: { en: 'Name one power that is only for the federal government.', es: 'Mencione un poder que solo tiene el gobierno federal.' },
    answers: {
      en: ['Print paper money', 'Mint coins', 'Declare war', 'Create an army', 'Make treaties', 'Set foreign policy'],
      es: ['Imprimir papel moneda', 'Acuñar monedas', 'Declarar la guerra', 'Crear un ejército', 'Hacer tratados', 'Establecer la política exterior'],
    },
  },
  {
    n: 59,
    part: GOV,
    section: GOV_B,
    question: { en: 'Name one power that is only for the states.', es: 'Mencione un poder que solo tienen los estados.' },
    answers: {
      en: ['Provide schooling and education', 'Provide protection (police)', 'Provide safety (fire departments)', 'Give a driver’s license', 'Approve zoning and land use'],
      es: ['Proporcionar escuelas y educación', 'Proporcionar protección (policía)', 'Proporcionar seguridad (cuerpos de bomberos)', 'Otorgar licencias de conducir', 'Aprobar la zonificación y el uso de la tierra'],
    },
  },
  {
    n: 60,
    part: GOV,
    section: GOV_B,
    question: { en: 'What is the purpose of the 10th Amendment?', es: '¿Cuál es el propósito de la Enmienda 10?' },
    answers: {
      en: ['(It states that the) powers not given to the federal government belong to the states or to the people.'],
      es: ['(Establece que los) poderes que no se otorgan al gobierno federal pertenecen a los estados o al pueblo.'],
    },
  },
  {
    n: 61,
    part: GOV,
    section: GOV_B,
    question: { en: 'Who is the governor of your state now?', es: '¿Quién es el gobernador actual de su estado?' },
    answers: {
      en: ['Answers will vary. [District of Columbia residents should answer that D.C. does not have a governor.]'],
      es: ['Las respuestas varían. [Los residentes del Distrito de Columbia deben contestar que D.C. no tiene gobernador.]'],
    },
    star: true,
    varies: 'governor',
  },
  {
    n: 62,
    part: GOV,
    section: GOV_B,
    question: { en: 'What is the capital of your state?', es: '¿Cuál es la capital de su estado?' },
    answers: {
      en: ['Answers will vary. [District of Columbia residents should answer that D.C. is not a state and does not have a capital. Residents of U.S. territories should name the capital of the territory.]'],
      es: ['Las respuestas varían. [Los residentes del Distrito de Columbia deben contestar que D.C. no es un estado y no tiene capital. Los residentes de los territorios de Estados Unidos deben dar el nombre de la capital del territorio.]'],
    },
    varies: 'stateCapital',
  },
  {
    n: 63,
    part: GOV,
    section: GOV_C,
    question: { en: 'There are four amendments to the U.S. Constitution about who can vote. Describe one of them.', es: 'Existen cuatro enmiendas a la Constitución de Estados Unidos sobre quién puede votar. Describa una de ellas.' },
    answers: {
      en: ['Citizens eighteen (18) and older (can vote).', 'You don’t have to pay (a poll tax) to vote.', 'Any citizen can vote. (Women and men can vote.)', 'A male citizen of any race (can vote).'],
      es: ['Ciudadanos de dieciocho (18) años en adelante (pueden votar).', 'No se exige pagar (un impuesto electoral o “poll tax”) para votar.', 'Cualquier ciudadano puede votar. (Tanto mujeres como hombres pueden votar.)', 'Un hombre ciudadano de cualquier raza (puede votar).'],
    },
  },
  {
    n: 64,
    part: GOV,
    section: GOV_C,
    question: { en: 'Who can vote in federal elections, run for federal office, and serve on a jury in the United States?', es: '¿Quién puede votar en elecciones federales, postularse a un cargo federal y servir en un jurado en Estados Unidos?' },
    answers: {
      en: ['Citizens', 'Citizens of the United States', 'U.S. citizens'],
      es: ['Ciudadanos', 'Ciudadanos de Estados Unidos', 'Ciudadanos estadounidenses'],
    },
  },
  {
    n: 65,
    part: GOV,
    section: GOV_C,
    question: { en: 'What are three rights of everyone living in the United States?', es: '¿Cuáles son tres derechos de todas las personas que viven en Estados Unidos?' },
    answers: {
      en: ['Freedom of expression', 'Freedom of speech', 'Freedom of assembly', 'Freedom to petition the government', 'Freedom of religion', 'The right to bear arms'],
      es: ['Libertad de expresión', 'Libertad de la palabra', 'Libertad de reunión', 'Libertad para peticionar al gobierno', 'Libertad de religión', 'El derecho a portar armas'],
    },
    count: 3,
  },
  {
    n: 66,
    part: GOV,
    section: GOV_C,
    question: { en: 'What do we show loyalty to when we say the Pledge of Allegiance?', es: '¿A qué demostramos nuestra lealtad cuando decimos el Juramento a la Bandera (Pledge of Allegiance)?' },
    answers: {
      en: ['The United States', 'The flag'],
      es: ['A Estados Unidos', 'A la bandera'],
    },
    star: true,
  },
  {
    n: 67,
    part: GOV,
    section: GOV_C,
    question: { en: 'Name two promises that new citizens make in the Oath of Allegiance.', es: 'Mencione dos promesas que hacen los nuevos ciudadanos en el Juramento de Lealtad (Oath of Allegiance).' },
    answers: {
      en: ['Give up loyalty to other countries', 'Defend the (U.S.) Constitution', 'Obey the laws of the United States', 'Serve in the military (if needed)', 'Serve (help, do important work for) the nation (if needed)', 'Be loyal to the United States'],
      es: ['Renunciar a la lealtad a otros países', 'Defender la Constitución (de Estados Unidos)', 'Obedecer las leyes de Estados Unidos', 'Prestar servicio en las Fuerzas Armadas (de ser necesario)', 'Prestar servicio a (ayudar, realizar trabajo importante para) la nación (de ser necesario)', 'Ser leal a Estados Unidos'],
    },
    count: 2,
  },
  {
    n: 68,
    part: GOV,
    section: GOV_C,
    question: { en: 'How can people become United States citizens?', es: '¿Cómo pueden las personas convertirse en ciudadanos de Estados Unidos?' },
    answers: {
      en: ['Be born in the United States, under the conditions set by the 14th Amendment', 'Naturalize', 'Derive citizenship (under conditions set by Congress)'],
      es: ['Nacer en Estados Unidos, según las condiciones establecidas por la Enmienda 14', 'Naturalizarse', 'Derivar la ciudadanía (según las condiciones establecidas por el Congreso)'],
    },
  },
  {
    n: 69,
    part: GOV,
    section: GOV_C,
    question: { en: 'What are two examples of civic participation in the United States?', es: '¿Cuáles son dos ejemplos de participación cívica en Estados Unidos?' },
    answers: {
      en: ['Vote', 'Run for office', 'Join a political party', 'Help with a campaign', 'Join a civic group', 'Join a community group', 'Give an elected official your opinion (on an issue)', 'Contact elected officials', 'Support or oppose an issue or policy', 'Write to a newspaper'],
      es: ['Votar', 'Postularse a un cargo político', 'Afiliarse a un partido político', 'Ayudar en una campaña', 'Unirse a un grupo cívico', 'Unirse a un grupo comunitario', 'Darle su opinión (sobre un asunto) a un funcionario electo', 'Comunicarse con funcionarios electos', 'Apoyar u oponerse a un asunto o política', 'Escribir a un periódico'],
    },
    count: 2,
  },
  {
    n: 70,
    part: GOV,
    section: GOV_C,
    question: { en: 'What is one way Americans can serve their country?', es: '¿Cuál es una manera en que los estadounidenses pueden servir a su país?' },
    answers: {
      en: ['Vote', 'Pay taxes', 'Obey the law', 'Serve in the military', 'Run for office', 'Work for local, state, or federal government'],
      es: ['Votar', 'Pagar impuestos', 'Obedecer la ley', 'Prestar servicio en las Fuerzas Armadas', 'Postularse a un cargo político', 'Trabajar para el gobierno local, estatal o federal'],
    },
  },
  {
    n: 71,
    part: GOV,
    section: GOV_C,
    question: { en: 'Why is it important to pay federal taxes?', es: '¿Por qué es importante pagar impuestos federales?' },
    answers: {
      en: ['Required by law', 'All people pay to fund the federal government', 'Required by the (U.S.) Constitution (16th Amendment)', 'Civic duty'],
      es: ['Lo exige la ley', 'Todas las personas pagan para financiar al gobierno federal', 'Lo exige la Constitución (de Estados Unidos) (Enmienda 16)', 'Deber cívico'],
    },
  },
  {
    n: 72,
    part: GOV,
    section: GOV_C,
    question: { en: 'It is important for all men age 18 through 25 to register for the Selective Service. Name one reason why.', es: 'Es importante que todos los hombres de 18 a 25 años se inscriban en el Servicio Selectivo. Mencione una razón.' },
    answers: {
      en: ['Required by law', 'Civic duty', 'Makes the draft fair, if needed'],
      es: ['Lo exige la ley', 'Deber cívico', 'Hace que el reclutamiento militar obligatorio sea justo, si es necesario'],
    },
  },
  {
    n: 73,
    part: HIST,
    section: HIST_A,
    question: { en: 'The colonists came to America for many reasons. Name one.', es: 'Los colonos vinieron a América por muchas razones. Mencione una.' },
    answers: {
      en: ['Freedom', 'Political liberty', 'Religious freedom', 'Economic opportunity', 'Escape persecution'],
      es: ['Libertad', 'Libertad política', 'Libertad religiosa', 'Oportunidad económica', 'Huir de la persecución'],
    },
  },
  {
    n: 74,
    part: HIST,
    section: HIST_A,
    question: { en: 'Who lived in America before the Europeans arrived?', es: '¿Quiénes vivían en América antes de la llegada de los europeos?' },
    answers: {
      en: ['American Indians', 'Native Americans'],
      es: ['Indios estadounidenses', 'Nativos estadounidenses'],
    },
    star: true,
  },
  {
    n: 75,
    part: HIST,
    section: HIST_A,
    question: { en: 'What group of people was taken and sold as slaves?', es: '¿Qué grupo de personas fue capturado y vendido como esclavos?' },
    answers: {
      en: ['Africans', 'People from Africa'],
      es: ['Africanos', 'Gente de África'],
    },
  },
  {
    n: 76,
    part: HIST,
    section: HIST_A,
    question: { en: 'What war did the Americans fight to win independence from Britain?', es: '¿En qué guerra lucharon los estadounidenses para ganar la independencia de Gran Bretaña?' },
    answers: {
      en: ['American Revolution', 'The (American) Revolutionary War', 'War for (American) Independence'],
      es: ['Revolución estadounidense', 'La Guerra Revolucionaria (estadounidense)', 'Guerra de Independencia (estadounidense)'],
    },
  },
  {
    n: 77,
    part: HIST,
    section: HIST_A,
    question: { en: 'Name one reason why the Americans declared independence from Britain.', es: 'Mencione una razón por la que los estadounidenses declararon su independencia de Gran Bretaña.' },
    answers: {
      en: ['High taxes', 'Taxation without representation', 'British soldiers stayed in Americans’ houses (boarding, quartering)', 'They did not have self-government', 'Boston Massacre', 'Boston Tea Party (Tea Act)', 'Stamp Act', 'Sugar Act', 'Townshend Acts', 'Intolerable (Coercive) Acts'],
      es: ['Impuestos altos', 'Impuestos sin representación', 'Los soldados británicos se alojaban en las casas de los estadounidenses (alojamiento, acuartelamiento)', 'No tenían gobierno propio', 'Masacre de Boston', 'Motín del té de Boston (Ley del Té)', 'Ley del Timbre', 'Ley del Azúcar', 'Leyes Townshend', 'Leyes Intolerables (Coercitivas)'],
    },
  },
  {
    n: 78,
    part: HIST,
    section: HIST_A,
    question: { en: 'Who wrote the Declaration of Independence?', es: '¿Quién escribió la Declaración de Independencia?' },
    answers: {
      en: ['(Thomas) Jefferson'],
      es: ['(Thomas) Jefferson'],
    },
    star: true,
  },
  {
    n: 79,
    part: HIST,
    section: HIST_A,
    question: { en: 'When was the Declaration of Independence adopted?', es: '¿Cuándo fue adoptada la Declaración de Independencia?' },
    answers: {
      en: ['July 4, 1776'],
      es: ['El 4 de julio de 1776'],
    },
  },
  {
    n: 80,
    part: HIST,
    section: HIST_A,
    question: { en: 'The American Revolution had many important events. Name one.', es: 'La Revolución estadounidense tuvo muchos sucesos importantes. Mencione uno.' },
    answers: {
      en: ['(Battle of) Bunker Hill', 'Declaration of Independence', 'Washington Crossing the Delaware (Battle of Trenton)', '(Battle of) Saratoga', 'Valley Forge (Encampment)', '(Battle of) Yorktown (British surrender at Yorktown)'],
      es: ['(Batalla de) Bunker Hill', 'Declaración de Independencia', 'Washington cruza el Delaware (Batalla de Trenton)', '(Batalla de) Saratoga', 'Valley Forge (campamento)', '(Batalla de) Yorktown (rendición británica en Yorktown)'],
    },
  },
  {
    n: 81,
    part: HIST,
    section: HIST_A,
    question: { en: 'There were 13 original states. Name five.', es: 'Había 13 estados originales. Mencione cinco.' },
    answers: {
      en: ['New Hampshire', 'Massachusetts', 'Rhode Island', 'Connecticut', 'New York', 'New Jersey', 'Pennsylvania', 'Delaware', 'Maryland', 'Virginia', 'North Carolina', 'South Carolina', 'Georgia'],
      es: ['Nueva Hampshire', 'Massachusetts', 'Rhode Island', 'Connecticut', 'Nueva York', 'Nueva Jersey', 'Pensilvania', 'Delaware', 'Maryland', 'Virginia', 'Carolina del Norte', 'Carolina del Sur', 'Georgia'],
    },
    count: 5,
  },
  {
    n: 82,
    part: HIST,
    section: HIST_A,
    question: { en: 'What founding document was written in 1787?', es: '¿Qué documento fundacional se redactó en 1787?' },
    answers: {
      en: ['(U.S.) Constitution'],
      es: ['Constitución (de Estados Unidos)'],
    },
  },
  {
    n: 83,
    part: HIST,
    section: HIST_A,
    question: { en: 'The Federalist Papers supported the passage of the U.S. Constitution. Name one of the writers.', es: 'Los Documentos Federalistas respaldaron la aprobación de la Constitución de Estados Unidos. Mencione uno de sus autores.' },
    answers: {
      en: ['(James) Madison', '(Alexander) Hamilton', '(John) Jay', 'Publius'],
      es: ['(James) Madison', '(Alexander) Hamilton', '(John) Jay', 'Publius'],
    },
  },
  {
    n: 84,
    part: HIST,
    section: HIST_A,
    question: { en: 'Why were the Federalist Papers important?', es: '¿Por qué fueron importantes los Documentos Federalistas?' },
    answers: {
      en: ['They helped people understand the (U.S.) Constitution.', 'They supported passing the (U.S.) Constitution.'],
      es: ['Ayudaron a la gente a entender la Constitución (de Estados Unidos).', 'Respaldaron la aprobación de la Constitución (de Estados Unidos).'],
    },
  },
  {
    n: 85,
    part: HIST,
    section: HIST_A,
    question: { en: 'Benjamin Franklin is famous for many things. Name one.', es: 'Benjamin Franklin es famoso por muchas cosas. Mencione una.' },
    answers: {
      en: ['Founded the first free public libraries', 'First Postmaster General of the United States', 'Helped write the Declaration of Independence', 'Inventor', 'U.S. diplomat'],
      es: ['Fundó las primeras bibliotecas públicas gratuitas', 'Primer director general de Correos de Estados Unidos', 'Ayudó a redactar la Declaración de Independencia', 'Inventor', 'Diplomático estadounidense'],
    },
  },
  {
    n: 86,
    part: HIST,
    section: HIST_A,
    question: { en: 'George Washington is famous for many things. Name one.', es: 'George Washington es famoso por muchas cosas. Mencione una.' },
    answers: {
      en: ['“Father of Our Country”', 'First president of the United States', 'General of the Continental Army', 'President of the Constitutional Convention'],
      es: ['“Padre de Nuestra Nación”', 'Primer presidente de Estados Unidos', 'General del Ejército Continental', 'Presidente de la Convención Constitucional'],
    },
    star: true,
  },
  {
    n: 87,
    part: HIST,
    section: HIST_A,
    question: { en: 'Thomas Jefferson is famous for many things. Name one.', es: 'Thomas Jefferson es famoso por muchas cosas. Mencione una.' },
    answers: {
      en: ['Writer of the Declaration of Independence', 'Third president of the United States', 'Doubled the size of the United States (Louisiana Purchase)', 'First Secretary of State', 'Founded the University of Virginia', 'Writer of the Virginia Statute on Religious Freedom'],
      es: ['Autor de la Declaración de Independencia', 'Tercer presidente de Estados Unidos', 'Duplicó el tamaño de Estados Unidos (Compra de Luisiana)', 'Primer secretario de Estado', 'Fundó la Universidad de Virginia', 'Autor del Estatuto de Virginia sobre la Libertad Religiosa'],
    },
  },
  {
    n: 88,
    part: HIST,
    section: HIST_A,
    question: { en: 'James Madison is famous for many things. Name one.', es: 'James Madison es famoso por muchas cosas. Mencione una.' },
    answers: {
      en: ['“Father of the Constitution”', 'Fourth president of the United States', 'President during the War of 1812', 'One of the writers of the Federalist Papers'],
      es: ['“Padre de la Constitución”', 'Cuarto presidente de Estados Unidos', 'Presidente durante la Guerra de 1812', 'Uno de los autores de los Documentos Federalistas'],
    },
  },
  {
    n: 89,
    part: HIST,
    section: HIST_A,
    question: { en: 'Alexander Hamilton is famous for many things. Name one.', es: 'Alexander Hamilton es famoso por muchas cosas. Mencione una.' },
    answers: {
      en: ['First Secretary of the Treasury', 'One of the writers of the Federalist Papers', 'Helped establish the First Bank of the United States', 'Aide to General George Washington', 'Member of the Continental Congress'],
      es: ['Primer secretario del Tesoro', 'Uno de los autores de los Documentos Federalistas', 'Ayudó a establecer el Primer Banco de Estados Unidos', 'Ayudante del general George Washington', 'Miembro del Congreso Continental'],
    },
  },
  {
    n: 90,
    part: HIST,
    section: HIST_B,
    question: { en: 'What territory did the United States buy from France in 1803?', es: '¿Qué territorio compró Estados Unidos a Francia en 1803?' },
    answers: {
      en: ['Louisiana Territory', 'Louisiana'],
      es: ['Territorio de Luisiana', 'Luisiana'],
    },
  },
  {
    n: 91,
    part: HIST,
    section: HIST_B,
    question: { en: 'Name one war fought by the United States in the 1800s.', es: 'Mencione una guerra en la que combatió Estados Unidos durante los años 1800.' },
    answers: {
      en: ['War of 1812', 'Mexican-American War', 'Civil War', 'Spanish-American War'],
      es: ['Guerra de 1812', 'Guerra entre México y Estados Unidos', 'Guerra Civil', 'Guerra Hispanoestadounidense'],
    },
  },
  {
    n: 92,
    part: HIST,
    section: HIST_B,
    question: { en: 'Name the U.S. war between the North and the South.', es: 'Mencione la guerra de Estados Unidos entre el Norte y el Sur.' },
    answers: {
      en: ['The Civil War'],
      es: ['La Guerra Civil'],
    },
  },
  {
    n: 93,
    part: HIST,
    section: HIST_B,
    question: { en: 'The Civil War had many important events. Name one.', es: 'La Guerra Civil tuvo muchos sucesos importantes. Mencione uno.' },
    answers: {
      en: ['(Battle of) Fort Sumter', 'Emancipation Proclamation', '(Battle of) Vicksburg', '(Battle of) Gettysburg', 'Sherman’s March', '(Surrender at) Appomattox', '(Battle of) Antietam/Sharpsburg', 'Lincoln was assassinated.'],
      es: ['(Batalla de) Fort Sumter', 'Proclamación de la Emancipación', '(Batalla de) Vicksburg', '(Batalla de) Gettysburg', 'La marcha de Sherman', '(Rendición en) Appomattox', '(Batalla de) Antietam/Sharpsburg', 'Lincoln fue asesinado.'],
    },
  },
  {
    n: 94,
    part: HIST,
    section: HIST_B,
    question: { en: 'Abraham Lincoln is famous for many things. Name one.', es: 'Abraham Lincoln es famoso por muchas cosas. Mencione una.' },
    answers: {
      en: ['Freed the slaves (Emancipation Proclamation)', 'Saved (or preserved) the Union', 'Led the United States during the Civil War', '16th president of the United States', 'Delivered the Gettysburg Address'],
      es: ['Liberó a los esclavos (Proclamación de la Emancipación)', 'Salvó (o preservó) la Unión', 'Dirigió Estados Unidos durante la Guerra Civil', '16.º presidente de Estados Unidos', 'Pronunció el Discurso de Gettysburg'],
    },
    star: true,
  },
  {
    n: 95,
    part: HIST,
    section: HIST_B,
    question: { en: 'What did the Emancipation Proclamation do?', es: '¿Qué hizo la Proclamación de la Emancipación?' },
    answers: {
      en: ['Freed the slaves', 'Freed slaves in the Confederacy', 'Freed slaves in the Confederate states', 'Freed slaves in most Southern states'],
      es: ['Liberó a los esclavos', 'Liberó a los esclavos de la Confederación', 'Liberó a los esclavos en los estados de la Confederación', 'Liberó a los esclavos en la mayoría de los estados del sur'],
    },
  },
  {
    n: 96,
    part: HIST,
    section: HIST_B,
    question: { en: 'What U.S. war ended slavery?', es: '¿Qué guerra de Estados Unidos puso fin a la esclavitud?' },
    answers: {
      en: ['The Civil War'],
      es: ['La Guerra Civil'],
    },
  },
  {
    n: 97,
    part: HIST,
    section: HIST_B,
    question: { en: 'What amendment says all persons born or naturalized in the United States, and subject to the jurisdiction thereof, are U.S. citizens?', es: '¿Qué enmienda dice que todas las personas nacidas o naturalizadas en Estados Unidos, y sujetas a su jurisdicción, son ciudadanos de Estados Unidos?' },
    answers: {
      en: ['14th Amendment'],
      es: ['Enmienda 14'],
    },
  },
  {
    n: 98,
    part: HIST,
    section: HIST_B,
    question: { en: 'When did all men get the right to vote?', es: '¿Cuándo obtuvieron todos los hombres el derecho al voto?' },
    answers: {
      en: ['After the Civil War', 'During Reconstruction', '(With the) 15th Amendment', '1870'],
      es: ['Después de la Guerra Civil', 'Durante la Reconstrucción', '(Con la) Enmienda 15', '1870'],
    },
  },
  {
    n: 99,
    part: HIST,
    section: HIST_B,
    question: { en: 'Name one leader of the women’s rights movement in the 1800s.', es: 'Mencione a una líder del movimiento por los derechos de la mujer en los años 1800.' },
    answers: {
      en: ['Susan B. Anthony', 'Elizabeth Cady Stanton', 'Sojourner Truth', 'Harriet Tubman', 'Lucretia Mott', 'Lucy Stone'],
      es: ['Susan B. Anthony', 'Elizabeth Cady Stanton', 'Sojourner Truth', 'Harriet Tubman', 'Lucretia Mott', 'Lucy Stone'],
    },
  },
  {
    n: 100,
    part: HIST,
    section: HIST_C,
    question: { en: 'Name one war fought by the United States in the 1900s.', es: 'Mencione una guerra en la que combatió Estados Unidos durante los años 1900.' },
    answers: {
      en: ['World War I', 'World War II', 'Korean War', 'Vietnam War', '(Persian) Gulf War'],
      es: ['Primera Guerra Mundial', 'Segunda Guerra Mundial', 'Guerra de Corea', 'Guerra de Vietnam', 'Guerra del Golfo (Pérsico)'],
    },
  },
  {
    n: 101,
    part: HIST,
    section: HIST_C,
    question: { en: 'Why did the United States enter World War I?', es: '¿Por qué entró Estados Unidos en la Primera Guerra Mundial?' },
    answers: {
      en: ['Because Germany attacked U.S. (civilian) ships', 'To support the Allied Powers (England, France, Italy, and Russia)', 'To oppose the Central Powers (Germany, Austria-Hungary, the Ottoman Empire, and Bulgaria)'],
      es: ['Porque Alemania atacó barcos (civiles) estadounidenses', 'Para apoyar a las Potencias Aliadas (Inglaterra, Francia, Italia y Rusia)', 'Para oponerse a las Potencias Centrales (Alemania, Austria-Hungría, el Imperio otomano y Bulgaria)'],
    },
  },
  {
    n: 102,
    part: HIST,
    section: HIST_C,
    question: { en: 'When did all women get the right to vote?', es: '¿Cuándo obtuvieron todas las mujeres el derecho al voto?' },
    answers: {
      en: ['1920', 'After World War I', '(With the) 19th Amendment'],
      es: ['1920', 'Después de la Primera Guerra Mundial', '(Con la) Enmienda 19'],
    },
  },
  {
    n: 103,
    part: HIST,
    section: HIST_C,
    question: { en: 'What was the Great Depression?', es: '¿Qué fue la Gran Depresión?' },
    answers: {
      en: ['Longest economic recession in modern history'],
      es: ['La recesión económica más larga de la historia moderna'],
    },
  },
  {
    n: 104,
    part: HIST,
    section: HIST_C,
    question: { en: 'When did the Great Depression start?', es: '¿Cuándo comenzó la Gran Depresión?' },
    answers: {
      en: ['The Great Crash (1929)', 'Stock market crash of 1929'],
      es: ['El Gran Crac (1929)', 'La caída de la bolsa de valores de 1929'],
    },
  },
  {
    n: 105,
    part: HIST,
    section: HIST_C,
    question: { en: 'Who was president during the Great Depression and World War II?', es: '¿Quién era presidente durante la Gran Depresión y la Segunda Guerra Mundial?' },
    answers: {
      en: ['(Franklin) Roosevelt'],
      es: ['(Franklin) Roosevelt'],
    },
  },
  {
    n: 106,
    part: HIST,
    section: HIST_C,
    question: { en: 'Why did the United States enter World War II?', es: '¿Por qué entró Estados Unidos en la Segunda Guerra Mundial?' },
    answers: {
      en: ['(Bombing of) Pearl Harbor', 'Japanese attacked Pearl Harbor', 'To support the Allied Powers (England, France, and Russia)', 'To oppose the Axis Powers (Germany, Italy, and Japan)'],
      es: ['(Bombardeo de) Pearl Harbor', 'Los japoneses atacaron Pearl Harbor', 'Para apoyar a las Potencias Aliadas (Inglaterra, Francia y Rusia)', 'Para oponerse a las Potencias del Eje (Alemania, Italia y Japón)'],
    },
  },
  {
    n: 107,
    part: HIST,
    section: HIST_C,
    question: { en: 'Dwight Eisenhower is famous for many things. Name one.', es: 'Dwight Eisenhower es famoso por muchas cosas. Mencione una.' },
    answers: {
      en: ['General during World War II', 'President at the end of (during) the Korean War', '34th president of the United States', 'Signed the Federal-Aid Highway Act of 1956 (Created the Interstate System)'],
      es: ['General durante la Segunda Guerra Mundial', 'Presidente al final de (durante) la Guerra de Corea', '34.º presidente de Estados Unidos', 'Firmó la Ley Federal de Ayuda para Carreteras de 1956 (Creó el Sistema Interestatal de Autopistas)'],
    },
  },
  {
    n: 108,
    part: HIST,
    section: HIST_C,
    question: { en: 'Who was the United States’ main rival during the Cold War?', es: '¿Quién fue el principal rival de Estados Unidos durante la Guerra Fría?' },
    answers: {
      en: ['Soviet Union', 'USSR', 'Russia'],
      es: ['Unión Soviética', 'URSS', 'Rusia'],
    },
  },
  {
    n: 109,
    part: HIST,
    section: HIST_C,
    question: { en: 'During the Cold War, what was one main concern of the United States?', es: 'Durante la Guerra Fría, ¿cuál era una de las principales preocupaciones de Estados Unidos?' },
    answers: {
      en: ['Communism', 'Nuclear war'],
      es: ['Comunismo', 'Guerra nuclear'],
    },
  },
  {
    n: 110,
    part: HIST,
    section: HIST_C,
    question: { en: 'Why did the United States enter the Korean War?', es: '¿Por qué entró Estados Unidos en la Guerra de Corea?' },
    answers: {
      en: ['To stop the spread of communism'],
      es: ['Para detener la expansión del comunismo'],
    },
  },
  {
    n: 111,
    part: HIST,
    section: HIST_C,
    question: { en: 'Why did the United States enter the Vietnam War?', es: '¿Por qué entró Estados Unidos en la Guerra de Vietnam?' },
    answers: {
      en: ['To stop the spread of communism'],
      es: ['Para detener la expansión del comunismo'],
    },
  },
  {
    n: 112,
    part: HIST,
    section: HIST_C,
    question: { en: 'What did the civil rights movement do?', es: '¿Qué hizo el movimiento de derechos civiles?' },
    answers: {
      en: ['Fought to end racial discrimination'],
      es: ['Luchó para poner fin a la discriminación racial'],
    },
  },
  {
    n: 113,
    part: HIST,
    section: HIST_C,
    question: { en: 'Martin Luther King, Jr. is famous for many things. Name one.', es: 'Martin Luther King, Jr. es famoso por muchas cosas. Mencione una.' },
    answers: {
      en: ['Fought for civil rights', 'Worked for equality for all Americans', 'Worked to ensure that people would “not be judged by the color of their skin, but by the content of their character”'],
      es: ['Luchó por los derechos civiles', 'Trabajó por la igualdad de todos los estadounidenses', 'Trabajó para asegurar que las personas “no fueran juzgadas por el color de su piel, sino por el contenido de su carácter”'],
    },
    star: true,
  },
  {
    n: 114,
    part: HIST,
    section: HIST_C,
    question: { en: 'Why did the United States enter the Persian Gulf War?', es: '¿Por qué entró Estados Unidos en la Guerra del Golfo Pérsico?' },
    answers: {
      en: ['To force the Iraqi military from Kuwait'],
      es: ['Para expulsar a las fuerzas militares iraquíes de Kuwait'],
    },
  },
  {
    n: 115,
    part: HIST,
    section: HIST_C,
    question: { en: 'What major event happened on September 11, 2001 in the United States?', es: '¿Qué suceso de gran magnitud ocurrió el 11 de septiembre de 2001 en Estados Unidos?' },
    answers: {
      en: ['Terrorists attacked the United States', 'Terrorists took over two planes and crashed them into the World Trade Center in New York City', 'Terrorists took over a plane and crashed into the Pentagon in Arlington, Virginia', 'Terrorists took over a plane originally aimed at Washington, D.C., and crashed in a field in Pennsylvania'],
      es: ['Terroristas atacaron a Estados Unidos', 'Terroristas secuestraron dos aviones y los estrellaron contra el World Trade Center en la ciudad de Nueva York', 'Terroristas secuestraron un avión y lo estrellaron contra el Pentágono en Arlington, Virginia', 'Terroristas secuestraron un avión que originalmente se dirigía a Washington, D.C., y se estrelló en un campo en Pensilvania'],
    },
    star: true,
  },
  {
    n: 116,
    part: HIST,
    section: HIST_C,
    question: { en: 'Name one U.S. military conflict after the September 11, 2001 attacks.', es: 'Mencione un conflicto militar de Estados Unidos después de los ataques del 11 de septiembre de 2001.' },
    answers: {
      en: ['(Global) War on Terror', 'War in Afghanistan', 'War in Iraq'],
      es: ['Guerra (global) contra el terrorismo', 'Guerra en Afganistán', 'Guerra en Irak'],
    },
  },
  {
    n: 117,
    part: HIST,
    section: HIST_C,
    question: { en: 'Name one American Indian tribe in the United States.', es: 'Mencione una tribu de indios estadounidenses en Estados Unidos.' },
    answers: {
      en: ['Apache', 'Blackfeet', 'Cayuga', 'Cherokee', 'Cheyenne', 'Chippewa', 'Choctaw', 'Creek', 'Crow', 'Hopi', 'Huron', 'Inupiat', 'Lakota', 'Mohawk', 'Mohegan', 'Navajo', 'Oneida', 'Onondaga', 'Pueblo', 'Seminole', 'Seneca', 'Shawnee', 'Sioux', 'Teton', 'Tuscarora'],
      es: ['Apache', 'Blackfeet', 'Cayuga', 'Cherokee', 'Cheyenne', 'Chippewa', 'Choctaw', 'Creek', 'Crow', 'Hopi', 'Huron', 'Inupiat', 'Lakota', 'Mohawk', 'Mohegan', 'Navajo', 'Oneida', 'Onondaga', 'Pueblo', 'Seminole', 'Seneca', 'Shawnee', 'Sioux', 'Teton', 'Tuscarora'],
    },
  },
  {
    n: 118,
    part: HIST,
    section: HIST_C,
    question: { en: 'Name one example of an American innovation.', es: 'Mencione un ejemplo de una innovación estadounidense.' },
    answers: {
      en: ['Light bulb', 'Automobile (cars, internal combustion engine)', 'Skyscrapers', 'Airplane', 'Assembly line', 'Landing on the moon', 'Integrated circuit (IC)'],
      es: ['Bombilla eléctrica', 'Automóvil (carros, motor de combustión interna)', 'Rascacielos', 'Avión', 'Línea de ensamblaje', 'Llegada a la Luna', 'Circuito integrado (CI)'],
    },
  },
  {
    n: 119,
    part: SYM,
    section: SYM_A,
    question: { en: 'What is the capital of the United States?', es: '¿Cuál es la capital de Estados Unidos?' },
    answers: {
      en: ['Washington, D.C.'],
      es: ['Washington, D.C.'],
    },
  },
  {
    n: 120,
    part: SYM,
    section: SYM_A,
    question: { en: 'Where is the Statue of Liberty?', es: '¿Dónde está la Estatua de la Libertad?' },
    answers: {
      en: ['New York (Harbor)', 'Liberty Island [Also acceptable are New Jersey, near New York City, and on the Hudson (River).]'],
      es: ['(El puerto de) Nueva York', 'Liberty Island [Otras respuestas aceptables son Nueva Jersey, cerca de la Ciudad de Nueva York y en el (río) Hudson.]'],
    },
  },
  {
    n: 121,
    part: SYM,
    section: SYM_A,
    question: { en: 'Why does the flag have 13 stripes?', es: '¿Por qué hay 13 franjas en la bandera?' },
    answers: {
      en: ['(Because there were) 13 original colonies', '(Because the stripes) represent the original colonies'],
      es: ['(Porque había) 13 colonias originales', '(Porque las franjas) representan las colonias originales'],
    },
    star: true,
  },
  {
    n: 122,
    part: SYM,
    section: SYM_A,
    question: { en: 'Why does the flag have 50 stars?', es: '¿Por qué hay 50 estrellas en la bandera?' },
    answers: {
      en: ['(Because there is) one star for each state', '(Because) each star represents a state', '(Because there are) 50 states'],
      es: ['(Porque hay) una estrella por cada estado', '(Porque) cada estrella representa un estado', '(Porque hay) 50 estados'],
    },
  },
  {
    n: 123,
    part: SYM,
    section: SYM_A,
    question: { en: 'What is the name of the national anthem?', es: '¿Cómo se llama el himno nacional?' },
    answers: {
      en: ['The Star-Spangled Banner'],
      es: ['The Star-Spangled Banner'],
    },
  },
  {
    n: 124,
    part: SYM,
    section: SYM_A,
    question: { en: 'The Nation’s first motto was “E Pluribus Unum.” What does that mean?', es: 'El primer lema de la nación fue “E Pluribus Unum”. ¿Qué significa?' },
    answers: {
      en: ['Out of many, one', 'We all become one'],
      es: ['De muchos, uno', 'Todos nos convertimos en uno'],
    },
  },
  {
    n: 125,
    part: SYM,
    section: SYM_B,
    question: { en: 'What is Independence Day?', es: '¿Qué es el Día de la Independencia?' },
    answers: {
      en: ['A holiday to celebrate U.S. independence (from Britain)', 'The country’s birthday'],
      es: ['Un día feriado para celebrar la independencia de Estados Unidos (de Gran Bretaña)', 'El cumpleaños del país'],
    },
  },
  {
    n: 126,
    part: SYM,
    section: SYM_B,
    question: { en: 'Name three national U.S. holidays.', es: 'Mencione tres días feriados nacionales de Estados Unidos.' },
    answers: {
      en: ['New Year’s Day', 'Martin Luther King, Jr. Day', 'Presidents Day (Washington’s Birthday)', 'Memorial Day', 'Juneteenth', 'Independence Day', 'Labor Day', 'Columbus Day', 'Veterans Day', 'Thanksgiving Day', 'Christmas Day'],
      es: ['Día de Año Nuevo', 'Día de Martin Luther King, Jr.', 'Día de los Presidentes (Natalicio de Washington)', 'Día de la Recordación', 'Día de la Liberación (Juneteenth)', 'Día de la Independencia', 'Día del Trabajo', 'Día de la Raza (Cristóbal Colón)', 'Día de los Veteranos', 'Día de Acción de Gracias', 'Día de Navidad'],
    },
    count: 3,
    star: true,
  },
  {
    n: 127,
    part: SYM,
    section: SYM_B,
    question: { en: 'What is Memorial Day?', es: '¿Qué es el Día de la Recordación (Memorial Day)?' },
    answers: {
      en: ['A holiday to honor soldiers who died in military service'],
      es: ['Un día feriado para honrar a los soldados que murieron en el servicio militar'],
    },
  },
  {
    n: 128,
    part: SYM,
    section: SYM_B,
    question: { en: 'What is Veterans Day?', es: '¿Qué es el Día de los Veteranos?' },
    answers: {
      en: ['A holiday to honor people in the (U.S.) military', 'A holiday to honor people who have served (in the U.S. military)'],
      es: ['Un día feriado para honrar a las personas de las Fuerzas Armadas (de Estados Unidos)', 'Un día feriado para honrar a las personas que han servido (en las Fuerzas Armadas de Estados Unidos)'],
    },
  },
];

export const civics2025: CivicsTest = {
  version: '2025',
  source: {
    edition: 'M-1778 (09/25)',
    url: 'https://www.uscis.gov/sites/default/files/document/questions-and-answers/2025-Civics-Test-128-Questions-and-Answers.pdf',
  },
  spanish: 'camino',
  questions,
  rules: { asked: 20, pass: 12, fail: 9 },
  senior: { asked: 10, pass: 6, fail: 5 },
};
