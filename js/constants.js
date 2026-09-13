// Costanti finanziarie e configurazione mesi/spese
export const INITIAL_ACCOUNT_BALANCE = 5348.43; // Base iniziale di partenza al 1° Agosto 2026
export const FIXED_INPS_INCOME = 101.90;

// Limiti di spesa per categoria
export const CATEGORY_BUDGETS = {
  "Carburante": 200.00,
  "Spesa Alimentare": 400.00
};

// Ordine cronologico globale dei mesi per il calcolo del conto accumulato
export const CHRONOLOGICAL_MONTHS = [
  { key: "Agosto_Prev", year: "2026", label: "Agosto 2026" },
  { key: "Settembre", year: "2026", label: "Settembre 2026" },
  { key: "Ottobre", year: "2026", label: "Ottobre 2026" },
  { key: "Novembre", year: "2026", label: "Novembre 2026" },
  { key: "Dicembre", year: "2026", label: "Dicembre 2026" },
  { key: "Gennaio", year: "2027", label: "Gennaio 2027" },
  { key: "Febbraio", year: "2027", label: "Febbraio 2027" },
  { key: "Marzo", year: "2027", label: "Marzo 2027" },
  { key: "Aprile", year: "2027", label: "Aprile 2027" },
  { key: "Maggio", year: "2027", label: "Maggio 2027" },
  { key: "Giugno", year: "2027", label: "Giugno 2027" },
  { key: "Luglio", year: "2027", label: "Luglio 2027" },
  { key: "Agosto", year: "2027", label: "Agosto 2027" },
  { key: "Settembre_27", year: "2027", label: "Settembre 2027" },
  { key: "Ottobre_27", year: "2027", label: "Ottobre 2027" },
  { key: "Novembre_27", year: "2027", label: "Novembre 2027" },
  { key: "Dicembre_27", year: "2027", label: "Dicembre 2027" }
];

// Mappatura Anni e Mesi con dettagli base per le entrate
export const YEAR_MONTHS = {
  "2026": [
    { key: "Agosto_Prev", label: "Agosto (Prev)", baseIncome: 1800 + FIXED_INPS_INCOME, tag: "Expleo + INPS", breakdown: [{ name: "Stipendio Expleo", amount: 1800.00 }, { name: "Pensione INPS", amount: FIXED_INPS_INCOME }] },
    { key: "Settembre", label: "Settembre", baseIncome: 1800 + FIXED_INPS_INCOME, tag: "Expleo + INPS", breakdown: [{ name: "Stipendio Expleo", amount: 1800.00 }, { name: "Pensione INPS", amount: FIXED_INPS_INCOME }] },
    { key: "Ottobre", label: "Ottobre", baseIncome: 2500 + FIXED_INPS_INCOME, tag: "Expleo + Spes + INPS", breakdown: [{ name: "Stipendio Expleo", amount: 1800.00 }, { name: "Spes Montesacro", amount: 700.00 }, { name: "Pensione INPS", amount: FIXED_INPS_INCOME }] },
    { key: "Novembre", label: "Novembre", baseIncome: 2500 + FIXED_INPS_INCOME, tag: "Expleo + Spes + INPS", breakdown: [{ name: "Stipendio Expleo", amount: 1800.00 }, { name: "Spes Montesacro", amount: 700.00 }, { name: "Pensione INPS", amount: FIXED_INPS_INCOME }] },
    { key: "Dicembre", label: "Dicembre", baseIncome: 2500 + FIXED_INPS_INCOME, tag: "Expleo + Spes + INPS", breakdown: [{ name: "Stipendio Expleo", amount: 1800.00 }, { name: "Spes Montesacro", amount: 700.00 }, { name: "Pensione INPS", amount: FIXED_INPS_INCOME }] }
  ],
  "2027": [
    { key: "Gennaio", label: "Gennaio", baseIncome: 2500 + FIXED_INPS_INCOME, tag: "Expleo + Spes + INPS", breakdown: [{ name: "Stipendio Expleo", amount: 1800.00 }, { name: "Spes Montesacro", amount: 700.00 }, { name: "Pensione INPS", amount: FIXED_INPS_INCOME }] },
    { key: "Febbraio", label: "Febbraio", baseIncome: 2500 + FIXED_INPS_INCOME, tag: "Expleo + Spes + INPS", breakdown: [{ name: "Stipendio Expleo", amount: 1800.00 }, { name: "Spes Montesacro", amount: 700.00 }, { name: "Pensione INPS", amount: FIXED_INPS_INCOME }] },
    { key: "Marzo", label: "Marzo", baseIncome: 2500 + FIXED_INPS_INCOME, tag: "Expleo + Spes + INPS", breakdown: [{ name: "Stipendio Expleo", amount: 1800.00 }, { name: "Spes Montesacro", amount: 700.00 }, { name: "Pensione INPS", amount: FIXED_INPS_INCOME }] },
    { key: "Aprile", label: "Aprile", baseIncome: 2500 + FIXED_INPS_INCOME, tag: "Expleo + Spes + INPS", breakdown: [{ name: "Stipendio Expleo", amount: 1800.00 }, { name: "Spes Montesacro", amount: 700.00 }, { name: "Pensione INPS", amount: FIXED_INPS_INCOME }] },
    { key: "Maggio", label: "Maggio", baseIncome: 2500 + FIXED_INPS_INCOME, tag: "Expleo + Spes + INPS", breakdown: [{ name: "Stipendio Expleo", amount: 1800.00 }, { name: "Spes Montesacro", amount: 700.00 }, { name: "Pensione INPS", amount: FIXED_INPS_INCOME }] },
    { key: "Giugno", label: "Giugno", baseIncome: 2500 + FIXED_INPS_INCOME, tag: "Expleo + Spes + INPS", breakdown: [{ name: "Stipendio Expleo", amount: 1800.00 }, { name: "Spes Montesacro", amount: 700.00 }, { name: "Pensione INPS", amount: FIXED_INPS_INCOME }] },
    { key: "Luglio", label: "Luglio", baseIncome: 1800 + FIXED_INPS_INCOME, tag: "Expleo + INPS", breakdown: [{ name: "Stipendio Expleo", amount: 1800.00 }, { name: "Pensione INPS", amount: FIXED_INPS_INCOME }] },
    { key: "Agosto", label: "Agosto", baseIncome: 1800 + FIXED_INPS_INCOME, tag: "Expleo + INPS", breakdown: [{ name: "Stipendio Expleo", amount: 1800.00 }, { name: "Pensione INPS", amount: FIXED_INPS_INCOME }] },
    { key: "Settembre_27", label: "Settembre", baseIncome: 1800 + FIXED_INPS_INCOME, tag: "Expleo + INPS", breakdown: [{ name: "Stipendio Expleo", amount: 1800.00 }, { name: "Pensione INPS", amount: FIXED_INPS_INCOME }] },
    { key: "Ottobre_27", label: "Ottobre", baseIncome: 2500 + FIXED_INPS_INCOME, tag: "Expleo + Spes + INPS", breakdown: [{ name: "Stipendio Expleo", amount: 1800.00 }, { name: "Spes Montesacro", amount: 700.00 }, { name: "Pensione INPS", amount: FIXED_INPS_INCOME }] },
    { key: "Novembre_27", label: "Novembre", baseIncome: 2500 + FIXED_INPS_INCOME, tag: "Expleo + Spes + INPS", breakdown: [{ name: "Stipendio Expleo", amount: 1800.00 }, { name: "Spes Montesacro", amount: 700.00 }, { name: "Pensione INPS", amount: FIXED_INPS_INCOME }] },
    { key: "Dicembre_27", label: "Dicembre", baseIncome: 2500 + FIXED_INPS_INCOME, tag: "Expleo + Spes + INPS", breakdown: [{ name: "Stipendio Expleo", amount: 1800.00 }, { name: "Spes Montesacro", amount: 700.00 }, { name: "Pensione INPS", amount: FIXED_INPS_INCOME }] }
  ]
};

// Spese fisse mensili ricorrenti
export const baseMonthlyFixed = [
  { cat: "Casa", name: "Affitto Mensile", amount: 650.00, desc: "Mensile (il 10)" },
  { cat: "Famiglia", name: "Mantenimento Valerio", amount: 305.00, desc: "Mensile" },
  { cat: "Abbonamenti", name: "Wi-Fi / Internet Casa", amount: 54.90, desc: "Mensile" },
  { cat: "Abbonamenti", name: "DAZN", amount: 34.99, desc: "Mensile" },
  { cat: "Abbonamenti", name: "Prime Video", amount: 8.99, desc: "Mensile" },
  { cat: "Abbonamenti", name: "Netflix", amount: 6.99, desc: "Mensile" }
];

// Spese periodiche e scadenze specifiche
export const periodicExpenses = {
  // --- 2026 ---
  "Agosto_Prev": [],
  "Settembre": [
    { cat: "Utenze", name: "Luce (Bimestrale)", amount: 130.00, desc: "Scadenza Settembre" },
    { cat: "Utenze", name: "Acqua (Bimestrale)", amount: 30.00, desc: "Scadenza Settembre" }
  ],
  "Ottobre": [],
  "Novembre": [
    { cat: "Utenze", name: "Luce (Bimestrale)", amount: 130.00, desc: "Scadenza Novembre" },
    { cat: "Utenze", name: "Acqua (Bimestrale)", amount: 30.00, desc: "Scadenza Novembre" },
    { cat: "Utenze", name: "TARI (Tassa Rifiuti)", amount: 40.00, desc: "Quota Trimestrale" }
  ],
  "Dicembre": [],
  // --- 2027 ---
  "Gennaio": [
    { cat: "Utenze", name: "Luce (Bimestrale)", amount: 130.00, desc: "Scadenza Gennaio" },
    { cat: "Utenze", name: "Acqua (Bimestrale)", amount: 30.00, desc: "Scadenza Gennaio" }
  ],
  "Febbraio": [],
  "Marzo": [
    { cat: "Utenze", name: "Luce (Bimestrale)", amount: 130.00, desc: "Scadenza Marzo" },
    { cat: "Utenze", name: "Acqua (Bimestrale)", amount: 30.00, desc: "Scadenza Marzo" },
    { cat: "Utenze", name: "TARI (Tassa Rifiuti)", amount: 40.00, desc: "Quota Trimestrale" }
  ],
  "Aprile": [],
  "Maggio": [
    { cat: "Utenze", name: "Luce (Bimestrale)", amount: 130.00, desc: "Scadenza Maggio" },
    { cat: "Utenze", name: "Acqua (Bimestrale)", amount: 30.00, desc: "Scadenza Maggio" },
    { cat: "Trasporti", name: "Bollo Auto", amount: 170.00, desc: "Scadenza Annuale" }
  ],
  "Giugno": [
    { cat: "Utenze", name: "TARI (Tassa Rifiuti)", amount: 40.00, desc: "Quota Trimestrale" },
    { cat: "Tempo Libero", name: "Rimessaggio Roulotte", amount: 500.00, desc: "Scadenza Annuale" }
  ],
  "Luglio": [
    { cat: "Utenze", name: "Luce (Bimestrale)", amount: 130.00, desc: "Scadenza Luglio" },
    { cat: "Utenze", name: "Acqua (Bimestrale)", amount: 30.00, desc: "Scadenza Luglio" },
    { cat: "Trasporti", name: "Assicurazione Auto", amount: 360.00, desc: "Scadenza Annuale" }
  ],
  "Agosto": [
    { cat: "Extra", name: "Campeggio Estivo", amount: 1800.00, desc: "Quota Straordinaria" }
  ],
  "Settembre_27": [
    { cat: "Utenze", name: "Luce (Bimestrale)", amount: 130.00, desc: "Scadenza Settembre" },
    { cat: "Utenze", name: "Acqua (Bimestrale)", amount: 30.00, desc: "Scadenza Settembre" }
  ],
  "Ottobre_27": [],
  "Novembre_27": [
    { cat: "Utenze", name: "Luce (Bimestrale)", amount: 130.00, desc: "Scadenza Novembre" },
    { cat: "Utenze", name: "Acqua (Bimestrale)", amount: 30.00, desc: "Scadenza Novembre" },
    { cat: "Utenze", name: "TARI (Tassa Rifiuti)", amount: 40.00, desc: "Quota Trimestrale" }
  ],
  "Dicembre_27": []
};
