// assets/js/components/initComponents.js
export async function loadComponent(componentPath, targetId) {
  try {
    // Usa rutas absolutas desde la raíz
    const response = await fetch(componentPath);
    const html = await response.text();
    document.getElementById(targetId).innerHTML = html;
  } catch (error) {
    console.error(`Error cargando ${componentPath}:`, error);
  }
}
