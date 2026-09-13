// Modulo di gestione dell'interfaccia utente (Rendering, Tabelle, Modali, Dropdown)
import { state, setCurrentMonth } from './state.js';
import { YEAR_MONTHS, CATEGORY_BUDGETS } from './constants.js';
import {
  formatEuro,
  formatDate,
  getMonthFixedExpenses,
  getCurrentMonthConfig,
  calculateCumulativeAccountBalance
} from './calculator.js';
import { deleteIncomeRecord, deleteExpenseRecord } from './database.js';

export function safeAlert(msg) {
  try {
    alert(msg);
  } catch (e) {
    console.warn("Alert:", msg);
  }
}

export function safeConfirm(msg) {
  try {
    return confirm(msg);
  } catch (e) {
    return true;
  }
}

export function populateMonthDropdown() {
  const monthSelect = document.getElementById("monthSelect");
  if (!monthSelect) return;

  monthSelect.innerHTML = "";
  const months = YEAR_MONTHS[state.currentYear] || [];
  if (months.length === 0) return;

  months.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.key;
    opt.className = "bg-slate-800";
    opt.innerText = `${m.label} (${m.baseIncome.toLocaleString('it-IT')} €)`;
    monthSelect.appendChild(opt);
  });

  const today = new Date();
  const systemMonthIndex = today.getMonth();
  const monthNamesItalian = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];
  const currentMonthName = monthNamesItalian[systemMonthIndex];

  const matchedMonth = months.find(
    (m) =>
      m.key === currentMonthName ||
      m.key.startsWith(currentMonthName) ||
      m.label.toLowerCase().includes(currentMonthName.toLowerCase())
  );

  if (matchedMonth) {
    setCurrentMonth(matchedMonth.key);
  } else {
    setCurrentMonth(months[0].key);
  }

  monthSelect.value = state.currentMonth;
}

export function updateView() {
  const monthConfig = getCurrentMonthConfig(state.currentYear, state.currentMonth);
  const currentExpenses = Object.values(state.expensesData[state.currentMonth] || {});
  const currentIncomes = Object.values(state.incomesData[state.currentMonth] || {});

  const extraIncomeTotal = currentIncomes.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalIncome = monthConfig.baseIncome + extraIncomeTotal;
  const totalFixedMonth = getMonthFixedExpenses(state.currentMonth).reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );
  const totalVariable = currentExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const remaining = totalIncome - (totalFixedMonth + totalVariable);

  // Aggiornamento Conto Generale
  const accountInfo = calculateCumulativeAccountBalance(
    state.currentYear,
    state.currentMonth,
    state.expensesData,
    state.incomesData
  );

  const displayTotalAccount = document.getElementById("displayTotalAccount");
  if (displayTotalAccount) {
    displayTotalAccount.innerText = formatEuro(accountInfo.endOfMonthBalance);
  }

  // Aggiorna la visualizzazione della Base Iniziale
  const displayInitialBaseElements = document.querySelectorAll(".displayInitialBase, #displayInitialBase");
  displayInitialBaseElements.forEach((el) => {
    el.innerText = formatEuro(accountInfo.startOfMonthBalance);
  });

  const accountMonthLabel = document.getElementById("accountCurrentMonthLabel");
  if (accountMonthLabel) {
    accountMonthLabel.innerText = accountInfo.currentLabel;
  }

  const displayIncome = document.getElementById("displayIncome");
  if (displayIncome) displayIncome.innerText = formatEuro(totalIncome);

  const displayFixed = document.getElementById("displayFixed");
  if (displayFixed) displayFixed.innerText = formatEuro(totalFixedMonth);

  const displayVariable = document.getElementById("displayVariable");
  if (displayVariable) displayVariable.innerText = formatEuro(totalVariable);

  // Barre budget
  const totalFuel = currentExpenses
    .filter((e) => e.category === "Carburante")
    .reduce((s, e) => s + (e.amount || 0), 0);
  const totalFood = currentExpenses
    .filter((e) => e.category === "Spesa Alimentare")
    .reduce((s, e) => s + (e.amount || 0), 0);

  const fuelBar = document.getElementById("fuelBudgetBar");
  if (fuelBar) fuelBar.innerText = `${Math.round(totalFuel)}/${CATEGORY_BUDGETS["Carburante"] || 200}€`;

  const foodBar = document.getElementById("foodBudgetBar");
  if (foodBar) foodBar.innerText = `${Math.round(totalFood)}/${CATEGORY_BUDGETS["Spesa Alimentare"] || 400}€`;

  const remainingElem = document.getElementById("displayRemaining");
  if (remainingElem) {
    remainingElem.innerText = (remaining >= 0 ? "+" : "") + formatEuro(remaining);
    remainingElem.className =
      remaining < 0
        ? "text-lg md:text-xl font-bold text-rose-400"
        : "text-lg md:text-xl font-bold text-emerald-400";
  }

  renderTables(currentIncomes, currentExpenses);

  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }
}

export function renderTables(incomes, expenses) {
  const incBody = document.getElementById("incomeTableBody");
  const expBody = document.getElementById("expenseTableBody");
  if (!incBody || !expBody) return;

  incBody.innerHTML = "";
  expBody.innerHTML = "";

  const emptyInc = document.getElementById("emptyIncomeMessage");
  if (emptyInc) emptyInc.classList.toggle("hidden", incomes.length > 0);

  const emptyExp = document.getElementById("emptyExpenseMessage");
  if (emptyExp) emptyExp.classList.toggle("hidden", expenses.length > 0);

  incomes
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="p-2">${formatDate(i.date)}</td>
        <td class="p-2"><span class="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold">${i.category}</span></td>
        <td class="p-2 text-slate-500">${i.note}</td>
        <td class="p-2 text-right font-bold text-emerald-600">+${formatEuro(i.amount)}</td>
        <td class="p-2 text-center">
          <button type="button" data-del-income="${i.id}" class="text-slate-400 hover:text-rose-600 transition">
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
          </button>
        </td>
      `;
      tr.querySelector('[data-del-income]')?.addEventListener('click', () => {
        deleteIncomeRecord(i.id);
        updateView();
      });
      incBody.appendChild(tr);
    });

  expenses
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((e) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="p-2">${formatDate(e.date)}</td>
        <td class="p-2"><span class="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold">${e.category}</span></td>
        <td class="p-2 text-slate-500">${e.note}</td>
        <td class="p-2 text-right font-bold text-slate-900">-${formatEuro(e.amount)}</td>
        <td class="p-2 text-center">
          <button type="button" data-del-expense="${e.id}" class="text-slate-400 hover:text-rose-600 transition">
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
          </button>
        </td>
      `;
      tr.querySelector('[data-del-expense]')?.addEventListener('click', () => {
        deleteExpenseRecord(e.id);
        updateView();
      });
      expBody.appendChild(tr);
    });
}

// Modal Dettaglio Entrate
export function openIncomeModal() {
  const monthConfig = getCurrentMonthConfig(state.currentYear, state.currentMonth);
  const modalMonth = document.getElementById("modalIncomeMonthName");
  if (modalMonth) {
    modalMonth.innerText = `${monthConfig.label} ${state.currentYear}`;
  }

  const modalBody = document.getElementById("modalIncomeTableBody");
  if (!modalBody) return;
  modalBody.innerHTML = "";

  let total = 0;

  // Entrate Fisse / Ricorrenti
  if (monthConfig.breakdown && monthConfig.breakdown.length > 0) {
    monthConfig.breakdown.forEach((item) => {
      total += item.amount;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="p-2 font-semibold text-emerald-900"><span class="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">Fissa</span></td>
        <td class="p-2 font-medium text-slate-800">${item.name}</td>
        <td class="p-2 text-slate-400">Ricorrente mensile</td>
        <td class="p-2 text-right font-bold text-emerald-600">+${formatEuro(item.amount)}</td>
      `;
      modalBody.appendChild(tr);
    });
  }

  // Entrate Extra Registrate
  const currentIncomes = Object.values(state.incomesData[state.currentMonth] || {});
  currentIncomes.forEach((i) => {
    total += i.amount;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-2 font-semibold text-blue-900"><span class="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px]">Extra</span></td>
      <td class="p-2 font-medium text-slate-800">${i.category}</td>
      <td class="p-2 text-slate-500">${i.note} (${formatDate(i.date)})</td>
      <td class="p-2 text-right font-bold text-emerald-600">+${formatEuro(i.amount)}</td>
    `;
    modalBody.appendChild(tr);
  });

  const modalTotal = document.getElementById("modalIncomeTotal");
  if (modalTotal) modalTotal.innerText = formatEuro(total);

  document.getElementById("incomeModal")?.classList.remove("hidden");
  if (typeof lucide !== "undefined" && lucide.createIcons) lucide.createIcons();
}

export function closeIncomeModal() {
  document.getElementById("incomeModal")?.classList.add("hidden");
}

// Modal Uscite Fisse
export function openFixedModal() {
  const monthConfig = getCurrentMonthConfig(state.currentYear, state.currentMonth);
  const modalMonth = document.getElementById("modalMonthName");
  if (modalMonth) modalMonth.innerText = `${monthConfig.label} ${state.currentYear}`;

  const modalBody = document.getElementById("modalFixedTableBody");
  if (!modalBody) return;
  modalBody.innerHTML = "";

  const list = getMonthFixedExpenses(state.currentMonth);
  let total = 0;
  list.forEach((i) => {
    total += i.amount;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-2 font-semibold text-blue-900">${i.cat}</td>
      <td class="p-2">${i.name}</td>
      <td class="p-2 text-slate-400">${i.desc}</td>
      <td class="p-2 text-right font-bold">${formatEuro(i.amount)}</td>
    `;
    modalBody.appendChild(tr);
  });

  const modalTotal = document.getElementById("modalFixedTotal");
  if (modalTotal) modalTotal.innerText = formatEuro(total);

  document.getElementById("fixedModal")?.classList.remove("hidden");
  if (typeof lucide !== "undefined" && lucide.createIcons) lucide.createIcons();
}

export function closeFixedModal() {
  document.getElementById("fixedModal")?.classList.add("hidden");
}
