// Modulo calcoli finanziari e formattazione
import {
  INITIAL_ACCOUNT_BALANCE,
  CHRONOLOGICAL_MONTHS,
  YEAR_MONTHS,
  baseMonthlyFixed,
  periodicExpenses
} from './constants.js';

export function formatEuro(val) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);
}

export function formatDate(dStr) {
  if (!dStr) return "-";
  const [y, m, d] = dStr.split("-");
  return `${d}/${m}`;
}

export function getMonthFixedExpenses(month) {
  return [...baseMonthlyFixed, ...(periodicExpenses[month] || [])];
}

export function getCurrentMonthConfig(currentYear, currentMonth) {
  const monthsInYear = YEAR_MONTHS[currentYear] || [];
  const found = monthsInYear.find(m => m.key === currentMonth);
  if (found) return found;

  const allMonths = [...(YEAR_MONTHS["2026"] || []), ...(YEAR_MONTHS["2027"] || [])];
  return allMonths.find(m => m.key === currentMonth) || { baseIncome: 0, tag: "Base", breakdown: [] };
}

// Calcola il margine netto di un singolo mese
export function getMonthNetMargin(mKey, mYear, expensesData = {}, incomesData = {}) {
  const yearMonths = YEAR_MONTHS[mYear] || [];
  const monthConf = yearMonths.find(m => m.key === mKey) || { baseIncome: 0 };

  const currentExpenses = Object.values(expensesData[mKey] || {});
  const currentIncomes = Object.values(incomesData[mKey] || {});

  const extraIncomeTotal = currentIncomes.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalIncome = monthConf.baseIncome + extraIncomeTotal;
  const totalFixedMonth = getMonthFixedExpenses(mKey).reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalVariable = currentExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);

  return totalIncome - (totalFixedMonth + totalVariable);
}

// Calcola sia la Base Iniziale (startOfMonthBalance) sia il Saldo Finale a fine mese
export function calculateCumulativeAccountBalance(currentYear, currentMonth, expensesData = {}, incomesData = {}) {
  const currentIndex = CHRONOLOGICAL_MONTHS.findIndex(
    m => m.key === currentMonth && m.year === currentYear
  );
  const targetIndex = currentIndex !== -1 ? currentIndex : 0;

  let runningBalance = INITIAL_ACCOUNT_BALANCE;

  // Sommiamo i margini netti di tutti i mesi PRECEDENTI
  for (let i = 0; i < targetIndex; i++) {
    const item = CHRONOLOGICAL_MONTHS[i];
    runningBalance += getMonthNetMargin(item.key, item.year, expensesData, incomesData);
  }

  const startOfMonthBalance = runningBalance; // Base di partenza ad inizio mese
  const targetItem = CHRONOLOGICAL_MONTHS[targetIndex];
  const currentMargin = targetItem
    ? getMonthNetMargin(targetItem.key, targetItem.year, expensesData, incomesData)
    : 0;
  const endOfMonthBalance = startOfMonthBalance + currentMargin; // Saldo calcolato a fine mese
  const currentLabel = targetItem ? targetItem.label : "";

  return { startOfMonthBalance, endOfMonthBalance, currentLabel };
}
