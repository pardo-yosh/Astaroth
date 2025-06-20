// assets/js/core/visual.js
import { getState, updateState, saveState } from "/assets/js/core/state.js";

/*=============== SIDEBAR ===============*/
export function setupSidebar() {
  const { sidebarExpanded } = getState();
  const toggle = document.getElementById("header-toggle");
  const sidebar = document.getElementById("sidebar");
  const header = document.getElementById("header");
  const main = document.getElementById("main");

  if (!toggle || !sidebar || !header || !main) return;

  // Aplicar estado inicial
  sidebar.classList.toggle("show-sidebar", sidebarExpanded);
  header.classList.toggle("left-pd", sidebarExpanded);
  main.classList.toggle("left-pd", sidebarExpanded);

  // Evento único
  toggle.addEventListener("click", () => {
    const isExpanded = !sidebar.classList.contains("show-sidebar");
    updateState({ sidebarExpanded: isExpanded });

    sidebar.classList.toggle("show-sidebar");
    header.classList.toggle("left-pd");
    main.classList.toggle("left-pd");
  });
}

/*=============== ENLACES ACTIVOS ===============*/
export function setupActiveLinks() {
  const links = document.querySelectorAll(".sidebar__list a");
  if (!links.length) return;

  const currentPath = window.location.pathname.split("/").pop().toLowerCase();

  links.forEach((link) => {
    const linkPath = link.getAttribute("href").split("/").pop().toLowerCase();
    const isActive = linkPath === currentPath;

    link.classList.toggle("active-link", isActive);
    if (isActive) updateState({ activeLink: link.getAttribute("href") });

    link.addEventListener("click", () => {
      updateState({ activeLink: link.getAttribute("href") });
    });
  });
}

/*=============== TEMA OSCURO ===============*/
export function setupDarkMode() {
  const { darkMode } = getState();
  const button = document.getElementById("theme-button");
  if (!button) return;

  // Estado inicial
  document.body.classList.toggle("dark-theme", darkMode);
  button.classList.toggle("ri-sun-fill", darkMode);

  // Evento
  button.addEventListener("click", () => {
    const newDarkMode = !document.body.classList.contains("dark-theme");
    updateState({ darkMode: newDarkMode });
    document.body.classList.toggle("dark-theme");
    button.classList.toggle("ri-sun-fill");
  });
}
