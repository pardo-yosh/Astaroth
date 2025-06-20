// assets/js/config.js
// config.js
export const QUIZ_PATHS = {
  automatizacion: {
    tema6: "/content/tests/questions/automatizacion/tema6.json",
    tema7: "/content/tests/questions/automatizacion/tema7.json",
  },
  control: {
    clase8: "/content/tests/questions/control/clase8.json",
    clase10: "/content/tests/questions/control/clase10.json",
    clase11: "/content/tests/questions/control/clase11.json",
    clase12: "/content/tests/questions/control/clase12.json",
  },
  procesamiento: {
    clase8: "/content/tests/questions/procesamiento/clase8.json",
    clase9: "/content/tests/questions/procesamiento/clase9.json",
    clase10: "/content/tests/questions/procesamiento/clase10.json",
  },
  sostenible: {
    control2: "/content/tests/questions/sostenible/control2.json",
  },
};

// Función de ayuda para validar rutas
export function getQuizPath(quizPath) {
  const pathParts = quizPath.split(".");
  let current = QUIZ_PATHS;

  for (const part of pathParts) {
    if (!current[part]) return null;
    current = current[part];
  }

  return typeof current === "string" ? current : null;
}
