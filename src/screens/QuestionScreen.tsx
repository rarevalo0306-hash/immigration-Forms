import { ChoiceGroup, FormBadge, Notice, QuestionCard, TextField } from '../design/components';
import { ui, type Lang } from '../i18n';
import type { Answers, FormDefinition, Question } from '../forms/types';
import type { Errors } from '../engine/flow';

interface Props {
  form: FormDefinition;
  question: Question;
  part: string;
  answers: Answers;
  errors: Errors;
  lang: Lang;
  onChange: (id: string, value: string) => void;
  onBack?: () => void;
  onNext: () => void;
}

export function QuestionScreen({ form, question: q, part, answers, errors, lang, onChange, onBack, onNext }: Props) {
  const hasErrors = Object.keys(errors).length > 0;
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
      {q.kind === 'choice' && <p className="app-formref">{q.formRef}</p>}
      {q.notice && <Notice tone={q.notice.tone} title={q.notice.title[lang]}>{q.notice.body[lang]}</Notice>}
      {q.kind === 'choice' ? (
        <>
          <ChoiceGroup
            options={q.options.map((o) => ({ value: o.value, label: o.label[lang] }))}
            value={typeof answers[q.id] === 'string' ? (answers[q.id] as string) : null}
            onChange={(v) => onChange(q.id, v)}
          />
          {errors[q.id] && <span className="cm-error" role="alert">{errors[q.id][lang]}</span>}
        </>
      ) : (
        <form
          className="app-fields"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            onNext();
          }}
        >
          {q.fields.map((f) => (
            <TextField
              key={f.id}
              id={`f-${f.id}`}
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
          ))}
          {/* Lets Enter submit from any field. */}
          <button type="submit" hidden />
        </form>
      )}
      {hasErrors && q.kind === 'fields' && Object.keys(errors).length > 1 && (
        <Notice tone="error" title={ui.missingTitle[lang]}>{ui.missingBody[lang]}</Notice>
      )}
    </QuestionCard>
  );
}

const inputModes: Partial<Record<string, 'numeric' | 'tel' | 'email'>> = {
  date: 'numeric',
  pastDate: 'numeric',
  futureDate: 'numeric',
  ssn: 'numeric',
  uscisAccount: 'numeric',
  zip: 'numeric',
  phone: 'tel',
  email: 'email',
};
