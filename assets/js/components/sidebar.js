import { loadComponent } from "/Astaroth/assets/js/components/initComponents.js";

export async function initSidebar() {
  await loadComponent("sidebar", "sidebar-placeholder");
  // Aquí puedes inicializar eventos del sidebar si es necesario
}
