import { useState } from 'react';
import { Button, Notice, TextField } from '../design/components';
import type { Lang } from '../i18n';
import { metaById } from '../forms/catalog';
import { deleteAccount, googleAvailable, openBillingPortal, paymentsOn, sendCode, signInWithGoogle, signOut, useAccount, verifyCode } from '../account/account';

const t = (lang: Lang, es: string, en: string) => (lang === 'es' ? es : en);

/** Sign up or sign in: a code emailed to them (6 to 8 digits, per the Supabase setting) (no password), or Google on the website. */
export function SignIn({ lang, returnTo, intro }: { lang: Lang; returnTo: string; intro?: string }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError(t(lang, 'Escriba un correo válido.', 'Enter a valid email.'));
    setBusy(true);
    setError(null);
    try {
      await sendCode(email.trim());
      setStep('code');
    } catch {
      setError(t(lang, 'No pudimos enviar el código. Espere un minuto e intente otra vez.', 'We couldn’t send the code. Wait a minute and try again.'));
    }
    setBusy(false);
  };
  const verify = async () => {
    setBusy(true);
    setError(null);
    try {
      await verifyCode(email.trim(), code.replace(/\D/g, ''));
    } catch {
      setError(t(lang, 'El código no es correcto o ya venció. Revíselo o pida uno nuevo.', 'The code is wrong or expired. Check it or ask for a new one.'));
    }
    setBusy(false);
  };

  return (
    <div className="app-signin">
      {intro && <p className="cm-card-why">{intro}</p>}
      {step === 'email' ? (
        <form
          className="app-fields"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <TextField
            id="signin-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            label={t(lang, 'Su correo electrónico', 'Your email')}
            hint={t(lang, 'Le enviamos un código por correo. No necesita contraseña.', 'We’ll email you a code. No password needed.')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error ?? undefined}
          />
          <Button type="submit" block disabled={busy}>
            {t(lang, 'Enviarme el código', 'Send me the code')}
          </Button>
        </form>
      ) : (
        <form
          className="app-fields"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
        >
          <TextField
            id="signin-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            label={t(lang, 'El código que le llegó', 'The code you received')}
            hint={t(lang, `Lo enviamos a ${email}. Revise también el correo no deseado.`, `We sent it to ${email}. Check your spam folder too.`)}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={error ?? undefined}
          />
          <Button type="submit" block disabled={busy || code.replace(/\D/g, '').length < 6}>
            {t(lang, 'Entrar', 'Sign in')}
          </Button>
          <Button variant="quiet" onClick={() => (setStep('email'), setCode(''), setError(null))}>
            {t(lang, 'Usar otro correo', 'Use another email')}
          </Button>
        </form>
      )}
      {googleAvailable() && step === 'email' && (
        <>
          <p className="app-or" aria-hidden="true">
            {t(lang, 'o', 'or')}
          </p>
          <Button variant="secondary" block onClick={() => void signInWithGoogle(returnTo)}>
            <GoogleMark /> {t(lang, 'Continuar con Google', 'Continue with Google')}
          </Button>
        </>
      )}
    </div>
  );
}

const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.4 5.7c4.3-4 6.9-9.9 6.9-17.2z" />
    <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z" />
  </svg>
);

/** "Su cuenta" in Mis datos: sign in, what they bought, the study plan, sign out and delete. */
export function AccountCard({ lang }: { lang: Lang }) {
  const { ready, session, entitlements } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!ready) return null;

  if (!session)
    return (
      <section className="cm-card app-account" aria-labelledby="account-h">
        <h2 id="account-h" className="app-review-h">{t(lang, 'Su cuenta', 'Your account')}</h2>
        <SignIn
          lang={lang}
          returnTo="#datos"
          intro={t(
            lang,
            'Cree una cuenta o entre a la suya para comprar formularios y tener sus compras en cualquier teléfono o computadora. Sus respuestas siguen guardadas solo en este dispositivo.',
            'Create an account or sign in to buy forms and have your purchases on any phone or computer. Your answers stay saved only on this device.',
          )}
        />
      </section>
    );

  const forms = [...entitlements.forms].map((id) => metaById(id)?.number ?? id).sort();
  const remove = async () => {
    if (!window.confirm(t(lang, '¿Borrar su cuenta? Se cancela su suscripción y pierde los formularios comprados. Sus respuestas en este dispositivo no se borran.', 'Delete your account? Your subscription is canceled and you lose the forms you bought. Your answers on this device are not erased.'))) return;
    setBusy(true);
    try {
      await deleteAccount();
    } catch {
      setError(t(lang, 'No pudimos borrar la cuenta. Intente otra vez.', 'We couldn’t delete the account. Try again.'));
    }
    setBusy(false);
  };

  return (
    <section className="cm-card app-account" aria-labelledby="account-h">
      <h2 id="account-h" className="app-review-h">{t(lang, 'Su cuenta', 'Your account')}</h2>
      <p className="app-account-email">{session.user.email}</p>
      {paymentsOn() && (
        <dl className="app-account-list">
          <div>
            <dt>{t(lang, 'Formularios comprados', 'Forms bought')}</dt>
            <dd>{forms.length ? forms.join(', ') : t(lang, 'Ninguno todavía', 'None yet')}</dd>
          </div>
          <div>
            <dt>{t(lang, 'Plan de estudio', 'Study plan')}</dt>
            <dd>{entitlements.study ? t(lang, 'Activo', 'Active') : t(lang, 'No tiene', 'None')}</dd>
          </div>
        </dl>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      <div className="app-mydata-actions">
        {paymentsOn() && entitlements.study && (
          <Button variant="secondary" onClick={() => void openBillingPortal().catch(() => setError(t(lang, 'No pudimos abrir la página de pagos.', 'We couldn’t open the billing page.')))}>
            {t(lang, 'Cambiar o cancelar el plan', 'Change or cancel the plan')}
          </Button>
        )}
        <Button variant="secondary" onClick={() => void signOut()}>{t(lang, 'Cerrar sesión', 'Sign out')}</Button>
        <Button variant="quiet" disabled={busy} onClick={() => void remove()}>{t(lang, 'Borrar mi cuenta', 'Delete my account')}</Button>
      </div>
    </section>
  );
}
