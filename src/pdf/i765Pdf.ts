import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { CATEGORY_OTHER } from '../forms/i765';
import { assistance, type HelperPerson } from '../forms/assistance';
import { parseCategory, parseUnit } from '../engine/validation';
import { selectOption, setFieldText, toFormText } from './common';

// Field names of USCIS Form I-765, edition 08/21/25 (public/forms/i-765.pdf).
const P1 = 'form1[0].Page1[0].';
const P2 = 'form1[0].Page2[0].';
const P3 = 'form1[0].Page3[0].';
const P4 = 'form1[0].Page4[0].';
const P5 = 'form1[0].Page5[0].';
const P6 = 'form1[0].Page6[0].';
const P7 = 'form1[0].Page7[0].';

type Plan = { text: Record<string, string>; check: string[]; select: Record<string, string> };

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

export { toFormText };

function category(a: Answers) {
  return a.category === CATEGORY_OTHER ? str(a, 'category.other') : str(a, 'category');
}

/** Works out every field value from the answers, without touching a PDF. */
export function planI765(a: Answers): Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const select: Record<string, string> = {};
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const yesNo = (answer: string, yesField: string, noField: string) => {
    if (answer === 'yes') check.push(yesField);
    if (answer === 'no') check.push(noField);
  };

  // Part 1 · Item 1
  const reason = { initial: 0, replacement: 1, renewal: 2 }[str(a, 'reason')];
  if (reason !== undefined) check.push(`${P1}Part1_Checkbox[${reason}]`);

  // Part 2 · Items 1–2
  put(`${P1}Line1a_FamilyName[0]`, str(a, 'name.family'));
  put(`${P1}Line1b_GivenName[0]`, str(a, 'name.given'));
  put(`${P1}Line1c_MiddleName[0]`, str(a, 'name.middle'));
  if (a.hasOtherNames === 'yes') {
    put(`${P1}Line2a_FamilyName[0]`, str(a, 'otherName.family'));
    put(`${P1}Line2b_GivenName[0]`, str(a, 'otherName.given'));
    put(`${P1}Line2c_MiddleName[0]`, str(a, 'otherName.middle'));
  }

  // Part 2 · Items 5–7
  const address = (prefix: string, street: string, unitField: string, unitNumber: string, city: string, state: string, zip: string) => {
    put(street, str(a, `${prefix}.street`));
    const unit = parseUnit(str(a, `${prefix}.unit`));
    if (unit) {
      check.push(`${unitField}[${{ STE: 0, FLR: 1, APT: 2 }[unit.kind]}]`);
      put(unitNumber, unit.number);
    }
    put(city, str(a, `${prefix}.city`));
    const st = str(a, `${prefix}.state`).toUpperCase();
    if (st) select[state] = st;
    put(zip, str(a, `${prefix}.zip`));
  };
  put(`${P2}Line4a_InCareofName[0]`, str(a, 'mailing.careOf'));
  address('mailing', `${P2}Line4b_StreetNumberName[0]`, `${P2}Pt2Line5_Unit`, `${P2}Pt2Line5_AptSteFlrNumber[0]`, `${P2}Pt2Line5_CityOrTown[0]`, `${P2}Pt2Line5_State[0]`, `${P2}Pt2Line5_ZipCode[0]`);
  yesNo(str(a, 'sameAddress'), `${P2}Part2Line5_Checkbox[1]`, `${P2}Part2Line5_Checkbox[0]`);
  if (a.sameAddress === 'no') {
    address('physical', `${P2}Pt2Line7_StreetNumberName[0]`, `${P2}Pt2Line7_Unit`, `${P2}Pt2Line7_AptSteFlrNumber[0]`, `${P2}Pt2Line7_CityOrTown[0]`, `${P2}Pt2Line7_State[0]`, `${P2}Pt2Line7_ZipCode[0]`);
  }

  // Part 2 · Items 8–13. The A-Number boxes take 9 digits, without the "A".
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) put(`${P2}Line7_AlienNumber[0]`, aNumber.padStart(9, '0'));
  put(`${P2}Line8_ElisAccountNumber[0]`, digits(str(a, 'uscisAccount')));
  if (a.sex === 'female') check.push(`${P2}Line9_Checkbox[0]`);
  if (a.sex === 'male') check.push(`${P2}Line9_Checkbox[1]`);
  const marital = { widowed: 0, divorced: 1, single: 2, married: 3 }[str(a, 'marital')];
  if (marital !== undefined) check.push(`${P2}Line10_Checkbox[${marital}]`);
  yesNo(str(a, 'previousI765'), `${P2}Line19_Checkbox[1]`, `${P2}Line19_Checkbox[0]`);
  put(`${P2}Line12b_SSN[0]`, digits(str(a, 'ssnValue')));

  // Part 2 · Items 14–16
  put(`${P2}Line17a_CountryOfBirth[0]`, str(a, 'citizenship.1'));
  put(`${P2}Line17b_CountryOfBirth[0]`, str(a, 'citizenship.2'));
  put(`${P3}Line18a_CityTownOfBirth[0]`, str(a, 'birth.city'));
  put(`${P3}Line18b_CityTownOfBirth[0]`, str(a, 'birth.state'));
  put(`${P3}Line18c_CountryOfBirth[0]`, str(a, 'birth.country'));
  put(`${P3}Line19_DOB[0]`, str(a, 'dobValue'));

  // Part 2 · Items 17–26
  put(`${P3}Line20a_I94Number[0]`, str(a, 'i94').replace(/[\s-]/g, '').toUpperCase());
  put(`${P3}Line20b_Passport[0]`, str(a, 'passport'));
  put(`${P3}Line20c_TravelDoc[0]`, str(a, 'travelDoc'));
  put(`${P3}Line20d_CountryOfIssuance[0]`, str(a, 'passportCountry'));
  put(`${P3}Line20e_ExpDate[0]`, str(a, 'passportExpiry'));
  put(`${P3}Line21_DateOfLastEntry[0]`, str(a, 'arrival.date'));
  put(`${P3}place_entry[0]`, str(a, 'arrival.place'));
  put(`${P3}Line23_StatusLastEntry[0]`, str(a, 'status.arrival'));
  put(`${P3}Line24_CurrentStatus[0]`, str(a, 'status.current'));
  // The form prints the "N-" before the SEVIS boxes.
  const sevis = digits(str(a, 'sevisNumber'));
  if (sevis) put(`${P3}Line26_SEVISnumber[0]`, sevis.padStart(10, '0'));

  // Part 2 · Items 27–31. The form prints the parentheses around each part of the category.
  const cat = parseCategory(category(a));
  if (cat) {
    put(`${P3}#area[1].section_1[0]`, cat[0]);
    put(`${P3}#area[1].section_2[0]`, cat[1]);
    put(`${P3}#area[1].section_3[0]`, cat[2]);
  }
  const catKey = cat ? `(${cat[0]})(${cat[1]})${cat[2] ? `(${cat[2].toLowerCase()})` : ''}` : '';
  if (catKey === '(c)(3)(c)') {
    put(`${P3}Line27a_Degree[0]`, str(a, 'stem.degree'));
    put(`${P3}Line27b_Everify[0]`, str(a, 'stem.employer'));
    put(`${P3}Line27c_EverifyIDNumber[0]`, str(a, 'stem.everify'));
  }
  if (catKey === '(c)(26)') put(`${P3}Line28_ReceiptNumber[0]`, str(a, 'h1b.receipt'));
  if (catKey === '(c)(8)') yesNo(str(a, 'arrested'), `${P3}PtLine29_YesNo[0]`, `${P3}PtLine29_YesNo[1]`);
  if (catKey === '(c)(35)' || catKey === '(c)(36)') {
    put(`${P3}Line18a_Receipt[0].Line30a_ReceiptNumber[0]`, str(a, 'i140.receipt'));
    yesNo(str(a, 'arrested'), `${P3}PtLine30b_YesNo[0]`, `${P3}PtLine30b_YesNo[1]`);
  }

  // Part 3 · Items 1–5. The signature (Item 7) stays empty: it must be signed by hand.
  if (a.readsEnglish === 'yes') check.push(`${P4}Pt3Line1Checkbox[1]`);
  if (a.readsEnglish === 'interpreter') {
    check.push(`${P4}Pt3Line1Checkbox[0]`);
    put(`${P4}Pt3Line1b_Language[0]`, str(a, 'fluentLanguage'));
  }
  if (a.preparer === 'yes') {
    check.push(`${P4}Part3_Checkbox[0]`);
    put(`${P4}Pt3Line2_RepresentativeName[0]`, str(a, 'preparer.name'));
  }
  put(`${P4}Pt3Line3_DaytimePhoneNumber1[0]`, digits(str(a, 'phone')).replace(/^1(?=\d{10}$)/, ''));
  put(`${P4}Pt3Line4_MobileNumber1[0]`, digits(str(a, 'mobile')).replace(/^1(?=\d{10}$)/, ''));
  put(`${P4}Pt3Line5_Email[0]`, str(a, 'email'));

  // Parts 4–5 · the interpreter's and preparer's details. Their signatures and dates stay empty.
  // The field names lie: the interpreter's address is named Pt5*, the preparer's Pt6*, and the
  // Apt./Ste./Flr. boxes of both are in the order Flr, Apt, Ste by export value (picked by position here).
  const phone = (s: string) => digits(s).replace(/^1(?=\d{10}$)/, '');
  const helper = (p: HelperPerson, f: { family: string; given: string; business: string; addr: string; unit: string; phone: string; mobile: string; email: string }) => {
    put(f.family, p.family);
    put(f.given, p.given);
    put(f.business, p.business);
    put(`${f.addr}3a_StreetNumberName[0]`, p.street);
    const unit = parseUnit(p.unit);
    if (unit) {
      check.push(`${f.unit}[${{ APT: 1, STE: 2, FLR: 0 }[unit.kind]}]`);
      put(`${f.addr}3b_AptSteFlrNumber[0]`, unit.number);
    }
    put(`${f.addr}3c_CityOrTown[0]`, p.city);
    if (p.state) select[`${f.addr}3d_State[0]`] = p.state.toUpperCase();
    put(`${f.addr}3e_ZipCode[0]`, p.zip);
    put(`${f.addr}3f_Province[0]`, p.province);
    put(`${f.addr}3g_PostalCode[0]`, p.postal);
    put(`${f.addr}3h_Country[0]`, p.country);
    put(f.phone, phone(p.phone));
    put(f.mobile, phone(p.mobile));
    put(f.email, p.email);
  };
  const help = assistance(a, { interpreter: a.readsEnglish === 'interpreter', preparer: a.preparer === 'yes' });
  if (help.interpreter) {
    helper(help.interpreter, {
      family: `${P4}Pt4Line1a_InterpreterFamilyName[0]`,
      given: `${P4}Pt4Line1b_InterpreterGivenName[0]`,
      business: `${P4}Pt4Line2_InterpreterBusinessorOrg[0]`,
      addr: `${P5}Pt5Line`,
      unit: `${P5}Pt5Line3b_Unit`,
      phone: `${P5}Pt4Line4_InterpreterDaytimeTelephone[0]`,
      mobile: `${P5}Pt4Line5_MobileNumber[0]`,
      email: `${P5}Pt4Line6_Email[0]`,
    });
    put(`${P5}Part4_NameofLanguage[0]`, help.interpreter.language);
  }
  if (help.preparer) {
    helper(help.preparer, {
      family: `${P5}Pt5Line1a_PreparerFamilyName[0]`,
      given: `${P5}Pt5Line1b_PreparerGivenName[0]`,
      business: `${P5}Pt5Line2_BusinessName[0]`,
      addr: `${P5}Pt6Line`,
      unit: `${P5}Pt6Line3b_Unit`,
      phone: `${P5}Pt5Line4_DaytimePhoneNumber1[0]`,
      mobile: `${P5}Pt5Line5_PreparerFaxNumber[0]`,
      email: `${P5}Pt5Line6_Email[0]`,
    });
    const st = help.preparer.statement;
    if (st === 'notAttorney') check.push(`${P6}Part5Line7_Checkbox[0]`);
    if (st === 'attorneyExtends' || st === 'attorneyNotExtends') {
      check.push(`${P6}Part5Line7_Checkbox[1]`);
      check.push(`${P6}Part5Line7b_Checkbox[${st === 'attorneyExtends' ? 0 : 1}]`);
    }
  }

  // Part 6 repeats the name and A-Number at the top of the additional-information page.
  put(`${P7}Line1a_FamilyName[0]`, str(a, 'name.family'));
  put(`${P7}Line1b_GivenName[0]`, str(a, 'name.given'));
  put(`${P7}Line1c_MiddleName[0]`, str(a, 'name.middle'));
  if (aNumber) put(`${P7}Line7_AlienNumber[0]`, aNumber.padStart(9, '0'));

  return { text, check, select };
}

/** Fills the official I-765 PDF with the answers and returns the new file's bytes. */
export async function fillI765(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const plan = planI765(a);

  for (const [name, raw] of Object.entries(plan.text)) {
    const field = form.getField(name);
    if (!(field instanceof PDFTextField)) throw new Error(`Not a text field: ${name}`);
    setFieldText(field, raw);
  }
  for (const name of plan.check) {
    const field = form.getField(name);
    if (!(field instanceof PDFCheckBox)) throw new Error(`Not a checkbox: ${name}`);
    field.check();
  }
  for (const [name, value] of Object.entries(plan.select)) {
    const field = form.getField(name);
    if (!(field instanceof PDFDropdown)) throw new Error(`Not a dropdown: ${name}`);
    selectOption(field, value);
  }

  doc.setTitle('Form I-765, Application For Employment Authorization');
  return doc.save();
}
