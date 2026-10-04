import { useState } from 'react';
import { Button, Notice, TextField } from '../../design/components';
import type { Lang } from '../../i18n';
import { READING_SENTENCES, READING_VOCAB, VOCAB_SOURCE, WRITING_SENTENCES, WRITING_VOCAB, type VocabGroup } from '../../study/english';
import { compareDictation } from '../../study/engine';
import { canSpeak, speak } from '../../study/speech';
import { BackToStudy, Listen, ScreenTitle, pick } from './common';

type Tab = 'reading' | 'writing' | 'words';

/** Practice for the English test: reading aloud, writing dictated sentences, and the official word lists. */
export function EnglishTest({ lang }: { lang: Lang }) {
  const t = pick(lang);
  const [tab, setTab] = useState<Tab>('reading');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'reading', label: t('Leer', 'Reading') },
    { id: 'writing', label: t('Escribir', 'Writing') },
    { id: 'words', label: t('Palabras', 'Words') },
  ];
  return (
    <div className="app-home">
      <BackToStudy lang={lang} />
      <ScreenTitle>{t('Examen de inglés', 'English test')}</ScreenTitle>
      <p className="cm-card-why">
        {t(
          'El oficial le pide leer en voz alta 1 de 3 oraciones y escribir 1 de 3 oraciones que le dicta; con una bien en cada parte, aprueba. También evalúa cómo habla y entiende inglés durante la entrevista, con las preguntas de su N-400.',
          'The officer asks you to read aloud 1 of 3 sentences and to write 1 of 3 sentences they dictate; one right in each part passes. They also judge how you speak and understand English during the interview, with the questions from your N-400.',
        )}
      </p>
      <div className="app-study-tabs" role="tablist" aria-label={t('Partes del examen de inglés', 'Parts of the English test')}>
        {tabs.map((x) => (
          <button key={x.id} type="button" role="tab" id={`tab-${x.id}`} aria-selected={tab === x.id} aria-controls={`panel-${x.id}`} className={tab === x.id ? 'is-on' : undefined} onClick={() => setTab(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'reading' && <Reading lang={lang} />}
        {tab === 'writing' && <Writing lang={lang} />}
        {tab === 'words' && <Words lang={lang} />}
      </div>
      <p className="app-form-meta">
        {t(
          'Las palabras son las de las listas oficiales de USCIS; las oraciones de práctica las escribió Camino solo con esas palabras.',
          'The words are from USCIS’s official lists; Camino wrote the practice sentences using only those words.',
        )}{' '}
        <a href={VOCAB_SOURCE} target="_blank" rel="noreferrer">
          {t('Listas oficiales', 'Official lists')}
        </a>
      </p>
    </div>
  );
}

function Reading({ lang }: { lang: Lang }) {
  const t = pick(lang);
  const [i, setI] = useState(() => Math.floor(Math.random() * READING_SENTENCES.length));
  const [showEs, setShowEs] = useState(false);
  const x = READING_SENTENCES[i];
  return (
    <div className="cm-card app-study-card">
      <p className="cm-card-why">{t('Lea la oración en voz alta. Después escuche cómo suena para comparar.', 'Read the sentence out loud. Then listen to how it sounds to compare.')}</p>
      <p className="app-study-sentence" lang="en">
        {x.en}
      </p>
      {showEs && (
        <p className="app-study-translation" lang="es">
          {x.es}
        </p>
      )}
      <div className="app-study-actions">
        <Listen text={x.en} lang={lang} />
        <Button variant="quiet" onClick={() => setShowEs((v) => !v)}>
          {showEs ? t('Ocultar el español', 'Hide the Spanish') : t('Ver en español', 'Show in Spanish')}
        </Button>
        <Button
          onClick={() => {
            setI((i + 1 + Math.floor(Math.random() * (READING_SENTENCES.length - 1))) % READING_SENTENCES.length);
            setShowEs(false);
          }}
        >
          {t('Otra oración', 'Another sentence')}
        </Button>
      </div>
    </div>
  );
}

function Writing({ lang }: { lang: Lang }) {
  const t = pick(lang);
  const voice = canSpeak();
  const [i, setI] = useState(() => Math.floor(Math.random() * WRITING_SENTENCES.length));
  const [text, setText] = useState('');
  const [checked, setChecked] = useState(false);
  const [peek, setPeek] = useState(false);
  const x = WRITING_SENTENCES[i];
  const r = compareDictation(x.en, text);
  const next = () => {
    const n = (i + 1 + Math.floor(Math.random() * (WRITING_SENTENCES.length - 1))) % WRITING_SENTENCES.length;
    setI(n);
    setText('');
    setChecked(false);
    setPeek(false);
    if (voice) speak(WRITING_SENTENCES[n].en, 'en-US', 0.8);
  };
  return (
    <div className="cm-card app-study-card">
      <p className="cm-card-why">
        {voice
          ? t('Escuche la oración y escríbala en inglés. Puede escucharla las veces que quiera.', 'Listen to the sentence and write it in English. You can listen as many times as you like.')
          : t('Este navegador no puede leer en voz alta. Pídale a alguien que le dicte la oración.', 'This browser can’t read aloud. Ask someone to dictate the sentence to you.')}
      </p>
      <div className="app-study-actions">
        {voice ? (
          <Button variant="secondary" onClick={() => speak(x.en, 'en-US', 0.8)}>
            <span aria-hidden="true">🔊</span> {t('Escuchar la oración', 'Listen to the sentence')}
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setPeek((v) => !v)}>
            {peek ? t('Ocultar la oración', 'Hide the sentence') : t('Mostrar la oración a quien dicta', 'Show the sentence to the person dictating')}
          </Button>
        )}
      </div>
      {peek && !checked && (
        <p className="app-study-sentence" lang="en">
          {x.en}
        </p>
      )}
      <TextField
        label={t('Escriba aquí lo que escuchó', 'Write what you heard here')}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setChecked(false);
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="sentences"
        spellCheck={false}
        lang="en"
      />
      <div className="app-study-actions">
        <Button onClick={() => setChecked(true)} disabled={!text.trim()}>
          {t('Revisar', 'Check')}
        </Button>
        <Button variant="secondary" onClick={next}>
          {t('Otra oración', 'Another sentence')}
        </Button>
      </div>
      {checked && (
        <div role="status">
          <Notice tone={r.ok ? 'info' : 'error'} title={r.ok ? t('¡Bien escrita!', 'Well written!') : t('Casi: revise estas palabras', 'Almost: check these words')}>
            <span className="app-study-sentence" lang="en">
              {x.en}
            </span>
            <span className="app-study-translation" lang="es">
              {x.es}
            </span>
            {!r.ok && (
              <span className="app-study-diff">
                {r.missing.length > 0 && <>{t('Faltan o están mal: ', 'Missing or misspelled: ')}<strong lang="en">{r.missing.join(', ')}</strong>. </>}
                {r.extra.length > 0 && <>{t('Sobran: ', 'Extra: ')}<strong lang="en">{r.extra.join(', ')}</strong>.</>}
              </span>
            )}
          </Notice>
        </div>
      )}
      <p className="app-form-meta">
        {t(
          'Camino compara palabra por palabra. En la entrevista, errores pequeños de ortografía, mayúsculas o puntuación no le hacen reprobar si la oración se entiende, y los números puede escribirlos con letras o con cifras.',
          'Camino compares word by word. At the interview, small spelling, capitalization or punctuation mistakes don’t make you fail if the sentence can be understood, and you may write numbers in words or digits.',
        )}
      </p>
    </div>
  );
}

function Words({ lang }: { lang: Lang }) {
  const t = pick(lang);
  const list = (title: string, groups: VocabGroup[]) => (
    <section className="cm-card app-fields" aria-label={title}>
      <h2 className="app-review-h">{title}</h2>
      {groups.map((g) => (
        <div key={g.title.en}>
          <h3 className="app-study-vocab-h">{g.title[lang]}</h3>
          <ul className="app-study-vocab" lang="en">
            {g.words.map((w) => (
              <li key={w}>
                {canSpeak() ? (
                  <button type="button" className="app-study-word" onClick={() => speak(w.replace('/', ', '), 'en-US', 0.8)} aria-label={`${w}: ${t('escuchar', 'listen')}`}>
                    {w}
                  </button>
                ) : (
                  w
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
  return (
    <>
      {canSpeak() && <p className="cm-card-why">{t('Toque una palabra para escuchar cómo se dice.', 'Tap a word to hear how it’s said.')}</p>}
      {list(t('Palabras para leer', 'Reading words'), READING_VOCAB)}
      {list(t('Palabras para escribir', 'Writing words'), WRITING_VOCAB)}
    </>
  );
}
