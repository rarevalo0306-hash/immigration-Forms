import { useState } from 'react';
import { Button, ChoiceGroup, Notice, SelectField, TextField } from '../../design/components';
import type { Lang } from '../../i18n';
import type { StudyState } from '../../study/state';
import type { Exemption, StudySettings } from '../../study/engine';
import { PLACES, placeByCode } from '../../study/states';
import { LOOKUP } from '../../study/current';
import { BackToStudy, ScreenTitle, pick } from './common';

/** The first screen of the study section, and its settings later: which test, exemptions and state. */
export function Setup({ lang, state, first, onSave }: { lang: Lang; state: StudyState; first: boolean; onSave: (s: StudySettings) => void }) {
  const t = pick(lang);
  const [s, setS] = useState<StudySettings>(state.settings);
  const place = placeByCode(s.state);
  const set = (patch: Partial<StudySettings>) => setS({ ...s, ...patch });
  const setName = (k: keyof StudySettings['names'], v: string) => set({ names: { ...s.names, [k]: v } });

  const names: { key: keyof StudySettings['names']; label: string; show: boolean }[] = [
    { key: 'senator', label: t('Uno de sus senadores federales', 'One of your U.S. senators'), show: !place || place.kind === 'state' },
    { key: 'representative', label: t('Su representante en el Congreso', 'Your U.S. representative'), show: true },
    { key: 'governor', label: t('Su gobernador o gobernadora', 'Your governor'), show: place?.kind !== 'dc' },
  ];

  return (
    <div className="app-home">
      {!first && <BackToStudy lang={lang} />}
      <ScreenTitle>{first ? t('Prepárese para el examen de ciudadanía', 'Get ready for the citizenship test') : t('Sus datos para el examen', 'Your test details')}</ScreenTitle>
      {first && (
        <p className="cm-card-why">
          {t(
            'En la entrevista del N-400, un oficial de USCIS le hace preguntas de historia y gobierno de Estados Unidos (educación cívica) y, en la mayoría de los casos, le evalúa el inglés. Aquí puede estudiar las preguntas oficiales y practicar. Primero, tres datos para saber qué examen le toca.',
            'At the N-400 interview, a USCIS officer asks you questions about U.S. history and government (civics) and, in most cases, tests your English. Here you can study the official questions and practice. First, three details to know which test you’ll take.',
          )}
        </p>
      )}
      <section className="cm-card app-fields">
        <ChoiceGroup
          legend={t('¿Cuándo presentó su N-400?', 'When did you file your N-400?')}
          value={s.version}
          onChange={(v) => set({ version: v === '2008' ? '2008' : '2025' })}
          options={[
            {
              value: '2025',
              label: t('Todavía no lo presento, o lo presenté el 20 de octubre de 2025 o después (examen 2025: 128 preguntas)', 'Not yet, or on or after October 20, 2025 (2025 test: 128 questions)'),
            },
            { value: '2008', label: t('Antes del 20 de octubre de 2025 (examen 2008: 100 preguntas)', 'Before October 20, 2025 (2008 test: 100 questions)') },
          ]}
        />
        <ChoiceGroup
          legend={t('Al presentar el N-400, ¿le aplica alguno de estos casos?', 'When you file the N-400, does one of these apply to you?')}
          value={s.exemption}
          onChange={(v) => set({ exemption: v as Exemption })}
          options={[
            { value: 'none', label: t('No, ninguno', 'No, none') },
            {
              value: '50-20',
              label: t(
                'Tengo 50 años o más y 20 años de residente permanente, o 55 años o más y 15 años de residente',
                'I’m 50 or older and a permanent resident for 20 years, or 55 or older and a resident for 15 years',
              ),
            },
            { value: '65-20', label: t('Tengo 65 años o más y 20 años de residente permanente', 'I’m 65 or older and a permanent resident for 20 years') },
          ]}
        />
        {s.exemption !== 'none' && (
          <Notice tone="info">
            {t(
              'No toma el examen de inglés y puede contestar las preguntas en español. Debe llevar a la entrevista un intérprete que hable bien inglés y español.',
              'You don’t take the English test and you may answer the questions in Spanish. You must bring an interpreter fluent in English and Spanish to the interview.',
            )}
          </Notice>
        )}
        <SelectField
          label={t('¿En qué estado vive?', 'Which state do you live in?')}
          hint={t('Algunas respuestas dependen de dónde vive: la capital, sus senadores, su representante y su gobernador.', 'Some answers depend on where you live: the capital, your senators, your representative and your governor.')}
          value={s.state}
          onChange={(v) => set({ state: v })}
          options={PLACES.map((p) => ({ value: p.code, label: p.name }))}
          placeholder={t('Elija su estado', 'Choose your state')}
        />
        {!first && (
          <div className="app-fields">
            <p className="cm-card-why">
              {t(
                'Estos nombres cambian con las elecciones. Búsquelos en las páginas oficiales y anótelos aquí para estudiarlos.',
                'These names change with elections. Look them up on the official pages and write them here to study them.',
              )}
            </p>
            {names
              .filter((n) => n.show)
              .map((n) => (
                <div key={n.key}>
                  <TextField label={n.label} value={s.names[n.key] ?? ''} onChange={(e) => setName(n.key, e.target.value)} maxLength={80} autoComplete="off" />
                  <a className="app-filing-link" href={LOOKUP[n.key]!.url(s.state)} target="_blank" rel="noreferrer">
                    {LOOKUP[n.key]!.label[lang]}
                  </a>
                </div>
              ))}
          </div>
        )}
        <Button onClick={() => onSave(s)}>{first ? t('Empezar a estudiar', 'Start studying') : t('Guardar', 'Save')}</Button>
      </section>
    </div>
  );
}
