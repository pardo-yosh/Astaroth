import { loadComponent } from "/Astaroth/assets/js/components/initComponents.js";
import {
  setupSidebar,
  setupDarkMode,
} from "/Astaroth/assets/js/core/visual.js";

async function initializeApp() {
  // 1. Primero carga TODOS los componentes
  await Promise.all([
    loadComponent("/Astaroth/components/header.html", "header-placeholder"),
    loadComponent("/Astaroth/components/sidebar.html", "sidebar-placeholder"),
  ]);

  // 2. Luego configura las funcionalidades
  setupSidebar(); // Sidebar ya está en el DOM
  setupDarkMode(); // Tema oscuro ya puede encontrar #theme-button
}

document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});
