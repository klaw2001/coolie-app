export interface CoolieSeed {
  id: string;
  name: string;
  nameHi: string;
  rating: number;
  trips: number;
  years: number;
  phone: string;
}

/** Dummy roster of licensed porters. Each gets a station-specific brass badge ("billa") number. */
export const COOLIES: CoolieSeed[] = [
  { id: 'k1', name: 'Dinesh Chauhan', nameHi: 'दिनेश चौहान', rating: 4.9, trips: 3105, years: 13, phone: '9820041188' },
  { id: 'k2', name: 'Suresh Kumar', nameHi: 'सुरेश कुमार', rating: 4.8, trips: 2185, years: 9, phone: '9811023456' },
  { id: 'k3', name: 'Mohammad Iqbal', nameHi: 'मोहम्मद इक़बाल', rating: 4.9, trips: 4012, years: 18, phone: '9830077812' },
  { id: 'k4', name: 'Raju Paswan', nameHi: 'राजू पासवान', rating: 4.7, trips: 1320, years: 6, phone: '9431088215' },
  { id: 'k5', name: 'Shankar Gowda', nameHi: 'शंकर गौड़ा', rating: 4.8, trips: 2760, years: 11, phone: '9845012390' },
  { id: 'k6', name: 'Bablu Singh', nameHi: 'बबलू सिंह', rating: 4.6, trips: 980, years: 4, phone: '9415066021' },
  { id: 'k7', name: 'Murugan S.', nameHi: 'मुरुगन एस.', rating: 4.8, trips: 2290, years: 12, phone: '9840033471' },
  { id: 'k8', name: 'Abdul Rashid', nameHi: 'अब्दुल रशीद', rating: 4.9, trips: 3655, years: 16, phone: '9829055813' },
  { id: 'k9', name: 'Prakash Meena', nameHi: 'प्रकाश मीणा', rating: 4.7, trips: 1544, years: 7, phone: '9414029934' },
  { id: 'k10', name: 'Gopal Das', nameHi: 'गोपाल दास', rating: 4.8, trips: 2071, years: 10, phone: '9849017725' },
];

export const PASSENGERS = [
  { name: 'Neha Kulkarni', phone: '9876512345' },
  { name: 'Rahul Verma', phone: '9988012345' },
  { name: 'Priya Nair', phone: '9447012399' },
  { name: 'Vikram Rao', phone: '9900123456' },
  { name: 'Fatima Khan', phone: '9819034567' },
  { name: 'Arjun Mehta', phone: '9825045678' },
  { name: 'Sneha Patil', phone: '9822056789' },
  { name: 'Karan Malhotra', phone: '9810067890' },
  { name: 'Meera Iyer', phone: '9884078901' },
  { name: 'Rohit Banerjee', phone: '9831089012' },
];

export const AVATAR_COLORS = ['#D3252B', '#B98A22', '#2459D6', '#15925A', '#8E3FBF', '#C2410C', '#0E7490', '#9D174D'];

export function badgeNo(stationCode: string, id: string): string {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) % 900;
  return `${stationCode}-${n + 100}`;
}

export const LANGUAGES: { en: string; hi: string }[] = [
  { en: 'Hindi', hi: 'हिंदी' },
  { en: 'English', hi: 'अंग्रेज़ी' },
  { en: 'Marathi', hi: 'मराठी' },
  { en: 'Gujarati', hi: 'गुजराती' },
  { en: 'Bengali', hi: 'बंगाली' },
  { en: 'Tamil', hi: 'तमिल' },
  { en: 'Telugu', hi: 'तेलुगु' },
  { en: 'Kannada', hi: 'कन्नड़' },
  { en: 'Urdu', hi: 'उर्दू' },
  { en: 'Bhojpuri', hi: 'भोजपुरी' },
];

export function languageLabel(en: string, lang: 'en' | 'hi'): string {
  return lang === 'hi' ? (LANGUAGES.find((l) => l.en === en)?.hi ?? en) : en;
}
