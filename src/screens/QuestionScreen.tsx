import { ChoiceGroup, FormBadge, Notice, QuestionCard, SelectField, TextField, YesNoRow } from '../design/components';
import { ui, type Lang } from '../i18n';
import type { Answers, FieldType, FormDefinition, Question } from '../forms/types';
import { visibleItems, type Errors } from '../engine/flow';

interface Props {
  form: FormDefinition;
  question: Question;
  part: string;
  answers: Answers;
  errors: Errors;
  lang: Lang;
  onChange: (id: string, value: string | string[]) => void;
  onBack?: () => void;
  onNext: () => void;
}

export function QuestionScreen({ form, question: q, part, answers, errors, lang, onChange, onBack, onNext }: Props) {
  const errorCount = Object.keys(errors).length;
  const value = (id: string) => (typeof answers[id] === 'string' ? (answers[id] as string) : null);
  return (
    <QuestionCard
      eyebrow={<FormBadge form={form.number} title={part} tone="soft" />}
      question={q.question[lang]}
      why={q.why?.[lang]}
      onBack={onBack}
      onNext={onNext}
      backLabel={ui.back[lang]}
      nextLabel={ui.next[lang]}
    >
      {q.kind !== 'fields' && <p className="app-formref">{q.formRef}</p>}
      {q.notice && <Notice tone={q.notice.tone} title={q.notice.title[lang]}>{q.notice.body[lang]}</Notice>}

      {q.kind === 'choice' && (
        <>
          {q.multiple ? (
            <ChoiceGroup
              multiple
              options={q.options.map((o) => ({ value: o.value, label: o.label[lang] }))}
              value={Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : []}
              onChange={(v) => onChange(q.id, v)}
            />
          ) : (
            <ChoiceGroup
              options={q.options.map((o) => ({ value: o.value, label: o.label[lang] }))}
              value={value(q.id)}
              onChange={(v) => onChange(q.id, v)}
            />
          )}
          {errors[q.id] && <span className="cm-error" role="alert">{errors[q.id][lang]}</span>}
        </>
      )}

      {q.kind === 'yesNoList' && (
        <div className="app-yn-list">
          {visibleItems(q, answers).map((item) => (
            <YesNoRow
              key={item.id}
              label={item.label[lang]}
              labelEn={item.formRef}
              value={value(item.id)}
              onChange={(v) => onChange(item.id, v)}
              yesLabel={lang === 'es' ? 'Sí' : 'Yes'}
              noLabel="No"
              error={errors[item.id]?.[lang]}
            />
          ))}
        </div>
      )}

      {q.kind === 'fields' && (
        <form
          className="app-fields"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            onNext();
          }}
        >
          {q.fields.map((f) =>
            f.type === 'select' ? (
              <SelectField
                key={f.id}
                id={`f-${f.id}`}
                label={
                  <>
                    {f.label[lang]} {!f.required && <span className="app-optional">{ui.optional[lang]}</span>}
                  </>
                }
                labelEn={f.formRef}
                hint={f.hint?.[lang]}
                error={errors[f.id]?.[lang]}
                value={String(answers[f.id] ?? '')}
                onChange={(v) => onChange(f.id, v)}
                options={(f.options ?? []).map((o) => ({ value: o.value, label: o.label[lang] }))}
              />
            ) : (
            <TextField
              key={f.id}
              id={`f-${f.id}`}
              multiline={f.type === 'longText'}
              label={
                <>
                  {f.label[lang]} {!f.required && <span className="app-optional">{ui.optional[lang]}</span>}
                </>
              }
              labelEn={f.formRef}
              hint={f.hint?.[lang]}
              placeholder={f.placeholder}
              error={errors[f.id]?.[lang]}
              value={String(answers[f.id] ?? '')}
              onChange={(e) => onChange(f.id, e.target.value)}
              inputMode={inputModes[f.type]}
              autoComplete="off"
            />
            ),
          )}
          {/* Lets Enter submit from any field. */}
          <button type="submit" hidden />
        </form>
      )}

      {q.kind !== 'choice' && errorCount > 1 && <Notice tone="error" title={ui.missingTitle[lang]}>{ui.missingBody[lang]}</Notice>}
    </QuestionCard>
  );
}

const inputModes: Partial<Record<FieldType, 'numeric' | 'tel' | 'email'>> = {
  date: 'numeric',
  pastDate: 'numeric',
  futureDate: 'numeric',
  ssn: 'numeric',
  uscisAccount: 'numeric',
  zip: 'numeric',
  number: 'numeric',
  phone: 'tel',
  email: 'email',
};
