import { useEffect, useState } from 'react';
import { Button, Notice } from '../design/components';
import type { Lang } from '../i18n';
import { isNativeApp } from '../native';
import { owns, paymentsOn, refreshEntitlements, startCheckout, useAccount } from '../account/account';
import { FORM_PRICE_CENTS, STUDY_PRICE_CENTS, dollars, isFreeForm } from '../account/pricing';
import { metaById } from '../forms/catalog';
import { SignIn } from './Account';

const t = (lang: Lang, es: string, en: string) => (lang === 'es' ? es : en);

/** Whether downloading this form's PDF needs a purchase first. */
export function useNeedsPurchase(formId: string): boolean {
  const { session, entitlements } = useAccount();
  if (!paymentsOn() || isFreeForm(formId)) return false;
  return !session || !owns(entitlements, formId);
}

export function useStudyLocked(): boolean {
  const { entitlements } = useAccount();
  return paymentsOn() && !entitlements.study;
}

function Buy({ lang, product, returnTo, price, perks, title }: { lang: Lang; product: string; returnTo: string; price: string; perks: string[]; title: string }) {
  const { ready, session } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      await startCheckout(product, returnTo, lang);
    } catch {
      setError(t(lang, 'No pudimos abrir la página de pago. Revise su conexión e intente otra vez.', 'We couldn’t open the payment page. Check your connection and try again.'));
    }
    setBusy(false);
  };
  return (
    <div className="cm-card app-paywall">
      <h2 className="app-review-h">{title}</h2>
      <p className="app-price">
        <strong>{price}</strong>
      </p>
      <ul className="app-perks">
        {perks.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      {!ready ? null : isNativeApp() ? (
        // Apple doesn't allow paying for digital content outside its own system inside the app.
        <>
          <Notice tone="info">
            {t(lang, 'Las compras desde la app del iPhone llegan pronto. Si ya lo compró, entre con su cuenta y se desbloquea.', 'Purchases inside the iPhone app are coming soon. If you already bought it, sign in and it unlocks.')}
          </Notice>
          {!session && <SignIn lang={lang} returnTo={returnTo} />}
        </>
      ) : !session ? (
        <SignIn lang={lang} returnTo={returnTo} intro={t(lang, 'Para comprar, entre o cree su cuenta. Así su compra queda guardada.', 'To buy, sign in or create your account, so your purchase is saved.')} />
      ) : (
        <>
          <Button block disabled={busy} onClick={() => void pay()}>
            {t(lang, `Pagar ${price}`, `Pay ${price}`)}
          </Button>
          <p className="app-form-meta">{t(lang, 'Pago seguro con tarjeta a través de Stripe.', 'Secure card payment through Stripe.')}</p>
        </>
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}

/** Instead of the download button, while the form isn't bought. */
export function FormPaywall({ formId, number, lang }: { formId: string; number: string; lang: Lang }) {
  return (
    <Buy
      lang={lang}
      product={`form:${formId}`}
      returnTo={`#${formId}`}
      price={dollars(FORM_PRICE_CENTS)}
      title={t(lang, `Descargue su ${number} oficial ya lleno`, `Download your official ${number}, filled in`)}
      perks={[
        t(lang, 'Un solo pago, solo por este formulario. Sin suscripción.', 'One payment, for this form only. No subscription.'),
        t(lang, 'Descárguelo las veces que quiera, también si cambia una respuesta.', 'Download it as many times as you like, also after changing an answer.'),
        t(lang, 'Con su cuenta, queda desbloqueado en cualquier dispositivo.', 'With your account, it stays unlocked on any device.'),
      ]}
    />
  );
}

/** For the paid study modes (practice interview with a score, English practice). */
export function StudyPaywall({ lang, returnTo }: { lang: Lang; returnTo: string }) {
  return (
    <Buy
      lang={lang}
      product="study"
      returnTo={returnTo}
      price={t(lang, `${dollars(STUDY_PRICE_CENTS)} al mes`, `${dollars(STUDY_PRICE_CENTS)} a month`)}
      title={t(lang, 'Practique con calificación y su inglés', 'Practice with a score, and your English')}
      perks={[
        t(lang, 'Simulacros de entrevista que le dicen si aprobaría.', 'Practice interviews that tell you whether you would pass.'),
        t(lang, 'Práctica del examen de inglés: leer en voz alta y escribir oraciones dictadas.', 'English test practice: reading aloud and writing dictated sentences.'),
        t(lang, 'Cancele cuando quiera, desde «Mis datos».', 'Cancel anytime, from "My data".'),
      ]}
    />
  );
}

/** Where Stripe sends the person back (#pago?estado=ok&producto=…&volver=…). */
export function PaymentReturn({ lang, query }: { lang: Lang; query: URLSearchParams }) {
  const ok = query.get('estado') === 'ok';
  const product = query.get('producto') ?? '';
  const back = query.get('volver') ?? '#';
  const [unlocked, setUnlocked] = useState(false);
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    if (!ok) return;
    let live = true;
    // Stripe confirms the payment to our server a moment after the person comes back.
    void (async () => {
      for (let i = 0; i < 12 && live; i++) {
        const e = await refreshEntitlements();
        if (product === 'study' ? e.study : e.forms.has(product.replace(/^form:/, ''))) {
          if (live) setUnlocked(true);
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (live) setWaited(true);
    })();
    return () => {
      live = false;
    };
  }, [ok, product]);
  const formNumber = product.startsWith('form:') ? metaById(product.slice(5))?.number : null;
  return (
    <section className="cm-card" aria-live="polite">
      <h1 className="app-title">
        {!ok ? t(lang, 'No se hizo ningún cobro', 'You were not charged') : unlocked ? t(lang, '¡Listo, gracias!', 'All set, thank you!') : t(lang, 'Confirmando su pago…', 'Confirming your payment…')}
      </h1>
      <p className="cm-card-why">
        {!ok
          ? t(lang, 'Canceló el pago. Puede volver a intentarlo cuando quiera.', 'You canceled the payment. You can try again anytime.')
          : unlocked
            ? formNumber
              ? t(lang, `Su ${formNumber} ya está desbloqueado. Vuelva al formulario y descárguelo.`, `Your ${formNumber} is unlocked. Go back to the form and download it.`)
              : t(lang, 'Su plan de estudio ya está activo.', 'Your study plan is active.')
            : waited
              ? t(lang, 'Su pago está tardando en confirmarse. Si le cobraron, se desbloquea solo en unos minutos; también puede revisar en «Mis datos».', 'Your payment is taking a while to confirm. If you were charged, it unlocks by itself in a few minutes; you can also check in "My data".')
              : t(lang, 'Esto toma unos segundos.', 'This takes a few seconds.')}
      </p>
      <div className="cm-card-actions">
        <span />
        <Button onClick={() => (window.location.hash = back.replace(/^#/, ''))}>{t(lang, 'Volver', 'Go back')}</Button>
      </div>
    </section>
  );
}
