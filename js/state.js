// Gestione dello stato applicativo e persistenza locale
export const state = {
  currentUser: null,
  expensesData: {},
  incomesData: {},
  currentYear: "2026",
  currentMonth: "Agosto_Prev"
};

export function loadLocalData() {
  try {
    const saved = localStorage.getItem("user_budget");
    if (saved) {
      const data = JSON.parse(saved);
      state.expensesData = data.expenses || {};
      state.incomesData = data.incomes || {};
    }
  } catch (e) {
    console.warn("Lettura localStorage:", e);
  }
}

export function saveLocalData() {
  try {
    localStorage.setItem(
      "user_budget",
      JSON.stringify({
        expenses: state.expensesData,
        incomes: state.incomesData
      })
    );
  } catch (e) {
    console.warn("Salvataggio localStorage:", e);
  }
}

export function setCurrentYear(year) {
  state.currentYear = year;
}

export function setCurrentMonth(month) {
  state.currentMonth = month;
}

export function setCurrentUser(user) {
  state.currentUser = user;
}
