// Camino components — typed port of the Camino design system bundle.
import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import type * as React from 'react';

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet';
  block?: boolean;
}

export function Button({ variant = 'primary', block, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={cx('cm-btn', `cm-btn--${variant}`, block && 'cm-btn--block', className)} {...rest} />;
}

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  labelEn?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Renders a textarea for explanations. */
  multiline?: boolean;
}

export function TextField({ id, label, labelEn, hint, error, className, multiline, ...rest }: TextFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = `${fieldId}-hint`;
  const errId = `${fieldId}-err`;
  const describedBy = [hint && hintId, error && errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cx('cm-field', !!error && 'cm-field--error', className)}>
      <label className="cm-label" htmlFor={fieldId}>
        {label}
        {labelEn && <span className="cm-label-en">{labelEn}</span>}
      </label>
      {hint && <span className="cm-hint" id={hintId}>{hint}</span>}
      {multiline ? (
        <textarea
          id={fieldId}
          className="cm-input cm-textarea"
          rows={4}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          value={rest.value}
          onChange={rest.onChange as unknown as React.ChangeEventHandler<HTMLTextAreaElement>}
          placeholder={rest.placeholder}
        />
      ) : (
        <input id={fieldId} className="cm-input" aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...rest} />
      )}
      {error && <span className="cm-error" id={errId} role="alert">{error}</span>}
    </div>
  );
}

export interface SelectFieldProps {
  id?: string;
  label: ReactNode;
  labelEn?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField({ id, label, labelEn, hint, error, value, onChange, options, placeholder = '—' }: SelectFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = [hint && `${fieldId}-hint`, error && `${fieldId}-err`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cx('cm-field', !!error && 'cm-field--error')}>
      <label className="cm-label" htmlFor={fieldId}>
        {label}
        {labelEn && <span className="cm-label-en">{labelEn}</span>}
      </label>
      {hint && <span className="cm-hint" id={`${fieldId}-hint`}>{hint}</span>}
      <select id={fieldId} className="cm-input cm-select" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} aria-describedby={describedBy}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span className="cm-error" id={`${fieldId}-err`} role="alert">{error}</span>}
    </div>
  );
}

export interface ChoiceOption {
  value: string;
  label: ReactNode;
}

interface ChoiceGroupBase {
  legend?: ReactNode;
  options: ChoiceOption[];
  className?: string;
}

export type ChoiceGroupProps =
  | (ChoiceGroupBase & { multiple?: false; value: string | null; onChange: (value: string) => void })
  | (ChoiceGroupBase & { multiple: true; value: string[]; onChange: (value: string[]) => void });

export function ChoiceGroup(props: ChoiceGroupProps) {
  const name = useId();
  const isOn = (v: string) => (props.multiple ? props.value.includes(v) : props.value === v);
  const toggle = (v: string) => {
    if (props.multiple) props.onChange(isOn(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    else props.onChange(v);
  };
  return (
    <fieldset className={cx('cm-choices', props.className)}>
      {props.legend && <legend>{props.legend}</legend>}
      {props.options.map((o) => (
        <label key={o.value} className={cx('cm-choice', props.multiple && 'cm-choice--checkbox')}>
          <input type={props.multiple ? 'checkbox' : 'radio'} name={name} value={o.value} checked={isOn(o.value)} onChange={() => toggle(o.value)} />
          <span className="cm-choice-box" aria-hidden />
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export interface ProgressStepsProps {
  total: number;
  current: number;
  label?: ReactNode;
  stepWord?: (current: number, total: number) => string;
  ariaLabel?: string;
}

export function ProgressSteps({ total, current, label, stepWord, ariaLabel = 'Progreso' }: ProgressStepsProps) {
  const cur = Math.min(Math.max(current, 1), total);
  const items: ReactNode[] = [];
  for (let i = 1; i <= total; i++) {
    if (i > 1) items.push(<li key={`b${i}`} className={cx('cm-step-bar', i <= cur && 'cm-step-bar--done')} aria-hidden />);
    items.push(
      <li key={`s${i}`} className={cx('cm-step', i < cur && 'cm-step--done', i === cur && 'cm-step--current')} aria-current={i === cur ? 'step' : undefined} />,
    );
  }
  return (
    <div className="cm-progress">
      <div className="cm-progress-meta">
        <strong>{stepWord ? stepWord(cur, total) : `Paso ${cur} de ${total}`}</strong>
        {label ? <> · {label}</> : null}
      </div>
      <ol className="cm-steps" aria-label={ariaLabel}>{items}</ol>
    </div>
  );
}

export interface QuestionCardProps {
  question: ReactNode;
  eyebrow?: ReactNode;
  why?: ReactNode;
  children?: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
}

export function QuestionCard({ question, eyebrow, why, children, onBack, onNext, backLabel = 'Atrás', nextLabel = 'Continuar' }: QuestionCardProps) {
  return (
    <section className="cm-card">
      {eyebrow && <div className="cm-card-eyebrow">{eyebrow}</div>}
      <h2 className="cm-card-q">{question}</h2>
      {why && <p className="cm-card-why">{why}</p>}
      {children}
      {(onBack || onNext) && (
        <div className="cm-card-actions">
          {onBack ? <Button variant="quiet" onClick={onBack}>{backLabel}</Button> : <span />}
          {onNext && <Button onClick={onNext}>{nextLabel}</Button>}
        </div>
      )}
    </section>
  );
}

export interface YesNoRowProps {
  label: ReactNode;
  labelEn?: ReactNode;
  value: string | null;
  onChange: (value: 'yes' | 'no') => void;
  yesLabel?: string;
  noLabel?: string;
  error?: ReactNode;
}

/** One yes/no question in a list of them: the question, then two side-by-side choices. */
export function YesNoRow({ label, labelEn, value, onChange, yesLabel = 'Sí', noLabel = 'No', error }: YesNoRowProps) {
  const name = useId();
  return (
    <fieldset className={cx('cm-yn', !!error && 'cm-yn--error')}>
      <legend className="cm-yn-q">
        {label}
        {labelEn && <span className="cm-label-en">{labelEn}</span>}
      </legend>
      <div className="cm-yn-opts">
        {(['yes', 'no'] as const).map((v) => (
          <label key={v} className="cm-choice cm-yn-opt">
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
            <span className="cm-choice-box" aria-hidden />
            <span>{v === 'yes' ? yesLabel : noLabel}</span>
          </label>
        ))}
      </div>
      {error && <span className="cm-error" role="alert">{error}</span>}
    </fieldset>
  );
}

const MARKS = { info: 'i', legal: '!', error: '×' } as const;

export interface NoticeProps {
  tone?: 'info' | 'legal' | 'error';
  title?: ReactNode;
  children?: ReactNode;
}

export function Notice({ tone = 'info', title, children }: NoticeProps) {
  return (
    <div className={cx('cm-notice', `cm-notice--${tone}`)} role={tone === 'error' ? 'alert' : 'note'}>
      <span className="cm-notice-mark" aria-hidden>{MARKS[tone]}</span>
      <div>
        {title && <strong className="cm-notice-title">{title}</strong>}
        {children}
      </div>
    </div>
  );
}

export interface LanguageToggleProps<L extends string> {
  value: L;
  onChange: (value: L) => void;
  languages: { value: L; label: string }[];
  ariaLabel?: string;
}

export function LanguageToggle<L extends string>({ value, onChange, languages, ariaLabel = 'Idioma / Language' }: LanguageToggleProps<L>) {
  return (
    <div className="cm-lang" role="group" aria-label={ariaLabel}>
      {languages.map((l) => (
        <button key={l.value} type="button" lang={l.value} aria-pressed={value === l.value} onClick={() => onChange(l.value)}>
          {l.label}
        </button>
      ))}
    </div>
  );
}

export interface FormBadgeProps {
  form: string;
  title?: ReactNode;
  tone?: 'ink' | 'soft';
}

export function FormBadge({ form, title, tone = 'ink' }: FormBadgeProps) {
  return (
    <span className={cx('cm-badge', tone === 'soft' && 'cm-badge--soft')}>
      {form}
      {title && <span>{title}</span>}
    </span>
  );
}
