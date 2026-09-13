// Gestore Budget & Spese - Entry Point Modulare
import { CATEGORY_BUDGETS } from './js/constants.js';
import { state, setCurrentYear, setCurrentMonth, loadLocalData } from './js/state.js';
import { formatEuro } from './js/calculator.js';
import {
  initDatabaseSync,
  addIncomeRecord,
  addExpenseRecord,
  clearIncomesForCurrentMonth,
  clearExpensesForCurrentMonth,
  deleteIncomeRecord,
  deleteExpenseRecord
} from './js/database.js';
import { initAuth, handleAuth, continueAsGuest, logout } from './js/auth.js';
import {
  populateMonthDropdown,
  updateView,
  openIncomeModal,
  closeIncomeModal,
  openFixedModal,
  closeFixedModal,
  safeAlert,
  safeConfirm
} from './js/ui.js';

// Funzioni per la gestione form
function handleIncomeSubmit(e) {
  if (e) e.preventDefault();
  const categoryInput = document.getElementById("incomeCategory");
  const amountInput = document.getElementById("incomeAmount");
  const noteInput = document.getElementById("incomeNote");
  const dateInput = document.getElementById("incomeDate");

  if (!categoryInput || !amountInput || !dateInput) return;

  const category = categoryInput.value;
  const amount = parseFloat(amountInput.value);
  const note = noteInput?.value.trim() || "-";
  const date = dateInput.value;

  if (isNaN(amount) || amount <= 0) return;

  addIncomeRecord({ category, amount, note, date });
  updateView();

  amountInput.value = "";
  if (noteInput) noteInput.value = "";
}

function handleExpenseSubmit(e) {
  if (e) e.preventDefault();
  const categoryInput = document.getElementById("expenseCategory");
  const amountInput = document.getElementById("expenseAmount");
  const noteInput = document.getElementById("expenseNote");
  const dateInput = document.getElementById("expenseDate");

  if (!categoryInput || !amountInput || !dateInput) return;

  const category = categoryInput.value;
  const amount = parseFloat(amountInput.value);
  const note = noteInput?.value.trim() || "-";
  const date = dateInput.value;

  if (isNaN(amount) || amount <= 0) return;

  // Verifica budget limite categoria
  const currentExpenses = Object.values(state.expensesData[state.currentMonth] || {});
  if (CATEGORY_BUDGETS[category]) {
    const limit = CATEGORY_BUDGETS[category];
    const currentSpent = currentExpenses
      .filter((i) => i.category === category)
      .reduce((s, i) => s + (i.amount || 0), 0);
    if (currentSpent + amount > limit) {
      safeAlert(
        `⚠️ LIMITE SUPERATO!\n\nPer "${category}" hai impostato un tetto di ${formatEuro(
          limit
        )}.\nSpesi finora: ${formatEuro(currentSpent)}.`
      );
      return;
    }
  }

  addExpenseRecord({ category, amount, note, date });
  updateView();

  amountInput.value = "";
  if (noteInput) noteInput.value = "";
}

function handleChangeYear(e) {
  const year = e?.target?.value || document.getElementById("yearSelect")?.value;
  if (year) {
    setCurrentYear(year);
    populateMonthDropdown();
    updateView();
  }
}

function handleChangeMonth(e) {
  const month = e?.target?.value || document.getElementById("monthSelect")?.value;
  if (month) {
    setCurrentMonth(month);
    updateView();
  }
}

function handleClearIncomes() {
  if (safeConfirm("Svuotare entrate extra del mese?")) {
    clearIncomesForCurrentMonth();
    updateView();
  }
}

function handleClearExpenses() {
  if (safeConfirm("Svuotare uscite variabili del mese?")) {
    clearExpensesForCurrentMonth();
    updateView();
  }
}

// Inizializzazione al caricamento del DOM
document.addEventListener("DOMContentLoaded", () => {
  // Imposta date odierne di default
  const today = new Date();
  const expDateInput = document.getElementById("expenseDate");
  const incDateInput = document.getElementById("incomeDate");
  if (expDateInput) expDateInput.valueAsDate = today;
  if (incDateInput) incDateInput.valueAsDate = today;

  // Popola selettore mesi
  populateMonthDropdown();

  // Carica cache locale iniziale
  loadLocalData();

  // Listener cambio anno e mese
  document.getElementById("yearSelect")?.addEventListener("change", handleChangeYear);
  document.getElementById("monthSelect")?.addEventListener("change", handleChangeMonth);

  // Listener form entrate ed uscite
  document.getElementById("incomeForm")?.addEventListener("submit", handleIncomeSubmit);
  document.getElementById("expenseForm")?.addEventListener("submit", handleExpenseSubmit);

  // Inizializza icone Lucide
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }

  // Inizializza Auth e Realtime DB
  initAuth((user) => {
    if (user) {
      initDatabaseSync(() => updateView());
    }
  });

  // Prima render view
  updateView();
});

// Registrazione Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('Service Worker registrato con successo!', reg))
      .catch((err) => console.error('Errore registrazione Service Worker:', err));
  });
}

// Esportazione su window per garantire piena retrocompatibilità con handler inline
window.handleAuth = handleAuth;
window.continueAsGuest = () => continueAsGuest(() => updateView());
window.logout = logout;
window.changeYear = handleChangeYear;
window.changeMonth = handleChangeMonth;
window.addIncome = handleIncomeSubmit;
window.addExpense = handleExpenseSubmit;
window.deleteIncome = (id) => { deleteIncomeRecord(id); updateView(); };
window.deleteExpense = (id) => { deleteExpenseRecord(id); updateView(); };
window.clearIncomesData = handleClearIncomes;
window.clearExpensesData = handleClearExpenses;
window.openIncomeModal = openIncomeModal;
window.closeIncomeModal = closeIncomeModal;
window.openFixedModal = openFixedModal;
window.closeFixedModal = closeFixedModal;
