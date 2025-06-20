import { loadComponent } from "/assets/js/components/initComponents.js";

export async function initHeader() {
  await loadComponent("header", "header-placeholder");
  // Aquí puedes inicializar eventos del header si es necesario
}
