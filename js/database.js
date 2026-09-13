// Modulo di sincronizzazione dati (Firebase Realtime Database + LocalStorage Fallback)
import { db } from './firebase-config.js';
import { state, saveLocalData, loadLocalData } from './state.js';

let dataUpdateCallback = null;

export function initDatabaseSync(onUpdate) {
  dataUpdateCallback = onUpdate;

  if (!db) {
    loadLocalData();
    if (dataUpdateCallback) dataUpdateCallback();
    return;
  }

  db.ref("user_budget").on(
    "value",
    (snapshot) => {
      const data = snapshot.val() || {};
      state.expensesData = data.expenses || {};
      state.incomesData = data.incomes || {};
      saveLocalData();
      if (dataUpdateCallback) dataUpdateCallback();
    },
    (err) => {
      console.warn("Firebase RTDB listener non riuscito, uso localStorage:", err);
      loadLocalData();
      if (dataUpdateCallback) dataUpdateCallback();
    }
  );
}

export function addIncomeRecord({ category, amount, note, date }) {
  const month = state.currentMonth;
  const newId = Date.now().toString();

  if (!state.incomesData[month]) {
    state.incomesData[month] = {};
  }
  state.incomesData[month][newId] = { id: newId, category, amount, note, date };
  saveLocalData();

  if (db && state.currentUser && !state.currentUser.isGuest) {
    db.ref(`user_budget/incomes/${month}/${newId}`)
      .set({ id: newId, category, amount, note, date })
      .catch((err) => console.warn("Errore sync Firebase:", err));
  }

  return newId;
}

export function addExpenseRecord({ category, amount, note, date }) {
  const month = state.currentMonth;
  const newId = Date.now().toString();

  if (!state.expensesData[month]) {
    state.expensesData[month] = {};
  }
  state.expensesData[month][newId] = { id: newId, category, amount, note, date };
  saveLocalData();

  if (db && state.currentUser && !state.currentUser.isGuest) {
    db.ref(`user_budget/expenses/${month}/${newId}`)
      .set({ id: newId, category, amount, note, date })
      .catch((err) => console.warn("Errore sync Firebase:", err));
  }

  return newId;
}

export function deleteIncomeRecord(id) {
  const month = state.currentMonth;
  if (state.incomesData[month]) {
    delete state.incomesData[month][id];
    saveLocalData();
  }

  if (db && state.currentUser && !state.currentUser.isGuest) {
    db.ref(`user_budget/incomes/${month}/${id}`)
      .remove()
      .catch((err) => console.warn(err));
  }
}

export function deleteExpenseRecord(id) {
  const month = state.currentMonth;
  if (state.expensesData[month]) {
    delete state.expensesData[month][id];
    saveLocalData();
  }

  if (db && state.currentUser && !state.currentUser.isGuest) {
    db.ref(`user_budget/expenses/${month}/${id}`)
      .remove()
      .catch((err) => console.warn(err));
  }
}

export function clearIncomesForCurrentMonth() {
  const month = state.currentMonth;
  state.incomesData[month] = {};
  saveLocalData();

  if (db && state.currentUser && !state.currentUser.isGuest) {
    db.ref(`user_budget/incomes/${month}`)
      .remove()
      .catch((err) => console.warn(err));
  }
}

export function clearExpensesForCurrentMonth() {
  const month = state.currentMonth;
  state.expensesData[month] = {};
  saveLocalData();

  if (db && state.currentUser && !state.currentUser.isGuest) {
    db.ref(`user_budget/expenses/${month}`)
      .remove()
      .catch((err) => console.warn(err));
  }
}
