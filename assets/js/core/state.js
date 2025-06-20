// assets/js/core/state.js
let APP_STATE = {
  sidebarExpanded: true,
  activeLink: null,
  darkMode: false,
  lastScroll: 0,
};

export function loadState() {
  const saved = localStorage.getItem("aetherisState");
  try {
    APP_STATE = JSON.parse(saved);
  } catch (e) {
    console.error("Error al leer el estado guardado", e);
    localStorage.removeItem("aetherisState"); // Limpia el dato inválido
  }
}

export function saveState() {
  localStorage.setItem(
    "aetherisState",
    JSON.stringify({
      sidebarExpanded: APP_STATE.sidebarExpanded,
      darkMode: APP_STATE.darkMode,
      activeLink: APP_STATE.activeLink,
    })
  );
}

export function getState() {
  return APP_STATE;
}

export function updateState(newState) {
  APP_STATE = { ...APP_STATE, ...newState };
  saveState();
}

// Inicializar al cargar
loadState();
