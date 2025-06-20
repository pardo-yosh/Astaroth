// ================ Importamos QUIZ_PATHS desde config.js ================ //
import { getQuizPath } from "/content/tests/templates/config.js";

export function initQuiz(quizKey) {
  const jsonPath = getQuizPath(quizKey);

  if (!jsonPath) {
    console.error(`Quiz no válido: ${quizKey}`);
    return;
  }

  // Limpiar solo el progreso específico de este quiz
  sessionStorage.removeItem(`quiz-${quizKey}-progress`);

  // Estado del quiz
  let quizState = {
    currentQuestionIndex: 0,
    score: 0,
    preguntas: [],
    answeredQuestions: new Set(),
    userAnswers: {},
    quizKey: quizKey,
    timeStarted: new Date(),
    timeSpent: 0,
    timerInterval: null,
  };

  // Configuración para renderizado de LaTeX
  const LATEX_CONFIG = {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
      { left: "\\[", right: "\\]", display: true },
    ],
    throwOnError: false,
  };

  // ==================== FUNCIONES AUXILIARES ==================== //

  function renderLatex(element) {
    if (typeof renderMathInElement === "function") {
      renderMathInElement(element, LATEX_CONFIG);
    }
  }

  function showErrorMessage(message) {
    const container = document.getElementById("quiz-container");
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <p>${message}</p>
          <button class="retry-btn" onclick="location.reload()">Reintentar</button>
        </div>
      `;
    }
  }

  function startTimer() {
    quizState.timeStarted = new Date();
    quizState.timerInterval = setInterval(() => {
      const now = new Date();
      quizState.timeSpent = Math.floor((now - quizState.timeStarted) / 1000);
      updateTimerDisplay();
    }, 1000);
  }

  function stopTimer() {
    if (quizState.timerInterval) {
      clearInterval(quizState.timerInterval);
      quizState.timerInterval = null;
    }
  }

  function updateTimerDisplay() {
    const timerElement = document.getElementById("quiz-timer");
    if (timerElement) {
      const minutes = Math.floor(quizState.timeSpent / 60);
      const seconds = quizState.timeSpent % 60;
      timerElement.textContent = `${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  // ==================== FUNCIONES PRINCIPALES ==================== //

  async function loadQuestions() {
    try {
      const response = await fetch(jsonPath);
      quizState.preguntas = await response.json();

      // Iniciar el temporizador solo si es la primera carga
      if (!quizState.timerInterval) {
        startTimer();
      }

      if (loadProgress()) {
        showQuestion(quizState.currentQuestionIndex);
      } else {
        quizState.currentQuestionIndex = 0;
        showQuestion(0);
      }
    } catch (error) {
      console.error("Error cargando preguntas:", error);
      showErrorMessage("Error al cargar el quiz. Intenta recargar la página.");
    }
  }

  function generateOptionsHTML(options, index, userAnswer) {
    return options
      .map(
        (option, optionIndex) => `
      <li class="option-item">
        <label class="option-label">
          <input type="radio" name="answer-${index}" value="${option}" class="option-input"
            ${userAnswer === option ? "checked" : ""}/>
          <span class="option-text">${String.fromCharCode(
            65 + optionIndex
          )}. ${option}</span>
        </label>
      </li>
    `
      )
      .join("");
  }

  function showQuestion(index) {
    const container = document.getElementById("quiz-container");
    if (!container || index >= quizState.preguntas.length) return;

    const q = quizState.preguntas[index];
    const isLastQuestion = index === quizState.preguntas.length - 1;
    const isFirstQuestion = index === 0;
    const userAnswer = quizState.userAnswers[index];
    const progressPercentage = Math.round(
      ((index + 1) / quizState.preguntas.length) * 100
    );

    container.innerHTML = `
      <div class="quiz-header">
        <div class="quiz-info">
          <span class="quiz-timer" id="quiz-timer">0:00</span>
          <span class="quiz-score">Puntuación: ${quizState.score}/${
      quizState.preguntas.length
    }</span>
        </div>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${progressPercentage}%"></div>
          <span class="progress-text">${index + 1}/${
      quizState.preguntas.length
    }</span>
        </div>
      </div>
      
      <div class="question-card">
        <div class="question-content">
          <h3 class="question-text">${q.question}</h3>
          ${
            q.image
              ? `<img src="${q.image}" alt="Imagen de pregunta" class="question-image">`
              : ""
          }
          <ul class="options-list" id="options-${index}">
            ${generateOptionsHTML(q.options, index, userAnswer)}
          </ul>
        </div>
        <div id="feedback-${index}" class="quiz-feedback"></div>
        <div id="explanation-${index}" class="quiz-explanation"></div>
      </div>
      
      <div class="navigation-buttons">
        <button id="prev-question" class="nav-btn" ${
          isFirstQuestion ? "disabled" : ""
        }>
          <i class="fas fa-arrow-left"></i> Anterior
        </button>
        
        <button id="submit-answer" class="submit-btn" ${
          quizState.answeredQuestions.has(index) ? 'style="display: none;"' : ""
        }>
          Enviar Respuesta
        </button>
        
        <button id="next-question" class="nav-btn" ${
          isLastQuestion ? "disabled" : ""
        }>
          Siguiente <i class="fas fa-arrow-right"></i>
        </button>
        
        <button id="finish-quiz" class="finish-btn" ${
          !isLastQuestion ? 'style="display: none;"' : ""
        }>
          Finalizar Quiz
        </button>
      </div>
      
      <div class="quick-navigation">
        <p>Navegación rápida:</p>
        <div class="quick-nav-buttons">
          ${quizState.preguntas
            .map(
              (_, i) => `
            <button class="quick-nav-btn ${i === index ? "active" : ""} ${
                quizState.answeredQuestions.has(i) ? "answered" : ""
              }" 
              data-index="${i}" ${i === index ? "disabled" : ""}>
              ${i + 1}
            </button>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    // Restaurar respuesta seleccionada si existe
    if (userAnswer) {
      const selectedInput = document.querySelector(
        `input[value="${userAnswer}"]`
      );
      if (selectedInput) {
        selectedInput.checked = true;
        if (quizState.answeredQuestions.has(index)) {
          checkAnswer(index, true);
        }
      }
    }

    renderLatex(container);
    attachEventListeners(index);
    updateTimerDisplay();
  }

  function attachEventListeners(index) {
    // Eventos para las opciones de respuesta
    const inputs = document.querySelectorAll(`#options-${index} input`);
    inputs.forEach((input) => {
      input.addEventListener("change", () => {
        document.getElementById("submit-answer").disabled = false;
      });
    });

    // Eventos para los botones de navegación
    document.getElementById("prev-question")?.addEventListener("click", () => {
      if (quizState.currentQuestionIndex > 0) {
        quizState.currentQuestionIndex--;
        showQuestion(quizState.currentQuestionIndex);
      }
    });

    document.getElementById("next-question")?.addEventListener("click", () => {
      if (quizState.currentQuestionIndex < quizState.preguntas.length - 1) {
        quizState.currentQuestionIndex++;
        showQuestion(quizState.currentQuestionIndex);
      }
    });

    document.getElementById("submit-answer")?.addEventListener("click", () => {
      checkAnswer(index);
    });

    document.getElementById("finish-quiz")?.addEventListener("click", () => {
      stopTimer();
      showFinalScore();
    });

    // Eventos para navegación rápida
    document.querySelectorAll(".quick-nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const targetIndex = parseInt(e.target.dataset.index);
        if (!isNaN(targetIndex)) {
          quizState.currentQuestionIndex = targetIndex;
          showQuestion(targetIndex);
        }
      });
    });

    // Atajos de teclado
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" && quizState.currentQuestionIndex > 0) {
        quizState.currentQuestionIndex--;
        showQuestion(quizState.currentQuestionIndex);
      } else if (
        e.key === "ArrowRight" &&
        quizState.currentQuestionIndex < quizState.preguntas.length - 1
      ) {
        quizState.currentQuestionIndex++;
        showQuestion(quizState.currentQuestionIndex);
      } else if (e.key === "Enter") {
        if (
          document.getElementById("submit-answer")?.style.display !== "none"
        ) {
          checkAnswer(index);
        } else if (
          quizState.currentQuestionIndex ===
          quizState.preguntas.length - 1
        ) {
          stopTimer();
          showFinalScore();
        } else {
          quizState.currentQuestionIndex++;
          showQuestion(quizState.currentQuestionIndex);
        }
      }
    });
  }

  function checkAnswer(index, skipSave = false) {
    const selected = document.querySelector(`#options-${index} input:checked`);
    if (!selected) {
      showFeedback(index, false, "Por favor selecciona una respuesta");
      return;
    }

    const answer = selected.value;
    const correctAnswer = quizState.preguntas[index].answer;
    const isCorrect = answer === correctAnswer;

    if (!skipSave) {
      quizState.userAnswers[index] = answer;
    }

    showFeedback(index, isCorrect);
    showExplanation(index);
    highlightAnswers(index, answer, correctAnswer);

    if (isCorrect && !quizState.answeredQuestions.has(index)) {
      quizState.score++;
      quizState.answeredQuestions.add(index);
      updateScoreDisplay();
    }

    // Mostrar botones apropiados
    document.getElementById("submit-answer").style.display = "none";
    const nextBtn = document.getElementById("next-question");
    const finishBtn = document.getElementById("finish-quiz");

    if (index === quizState.preguntas.length - 1) {
      nextBtn.style.display = "none";
      finishBtn.style.display = "inline-block";
    } else {
      nextBtn.style.display = "inline-block";
    }

    disableOptions(index);
    updateQuickNavButtons();

    if (!skipSave) {
      saveProgress();
    }
  }

  function highlightAnswers(index, userAnswer, correctAnswer) {
    const labels = document.querySelectorAll(`#options-${index} label`);

    labels.forEach((label) => {
      const optionText = label
        .querySelector(".option-text")
        .textContent.replace(/^[A-Z]\.\s/, "")
        .trim();
      label.classList.remove(
        "correct-answer",
        "wrong-answer",
        "selected-answer"
      );

      if (optionText === correctAnswer) {
        label.classList.add("correct-answer");
      } else if (optionText === userAnswer && userAnswer !== correctAnswer) {
        label.classList.add("wrong-answer");
      } else if (optionText === userAnswer) {
        label.classList.add("selected-answer");
      }
    });
  }

  function showFeedback(index, isCorrect, customMessage = null) {
    const feedbackDiv = document.getElementById(`feedback-${index}`);
    if (customMessage) {
      feedbackDiv.innerHTML = `<span class="feedback-message">${customMessage}</span>`;
      return;
    }

    feedbackDiv.innerHTML = `
      <span class="feedback-message ${isCorrect ? "correct" : "incorrect"}">
        ${isCorrect ? "✔️ Correcto!" : "❌ Incorrecto"}
      </span>
    `;
  }

  function showExplanation(index) {
    const explanationDiv = document.getElementById(`explanation-${index}`);
    if (quizState.preguntas[index].explanation) {
      explanationDiv.innerHTML = `
        <div class="explanation-content">
          <h4 class="explanation-title">Explicación:</h4>
          <p class="explanation-text">${
            quizState.preguntas[index].explanation
          }</p>
          ${
            quizState.preguntas[index].reference
              ? `<a href="${quizState.preguntas[index].reference}" target="_blank" class="reference-link">Más información</a>`
              : ""
          }
        </div>
      `;
      renderLatex(explanationDiv);
    }
  }

  function updateScoreDisplay() {
    const scoreElement = document.querySelector(".quiz-score");
    if (scoreElement) {
      scoreElement.textContent = `Puntuación: ${quizState.score}/${quizState.preguntas.length}`;
    }
  }

  function updateQuickNavButtons() {
    document.querySelectorAll(".quick-nav-btn").forEach((btn) => {
      const index = parseInt(btn.dataset.index);
      btn.classList.toggle("answered", quizState.answeredQuestions.has(index));
      btn.disabled = index === quizState.currentQuestionIndex;
    });
  }

  function disableOptions(index) {
    document
      .querySelectorAll(`#options-${index} input`)
      .forEach((input) => (input.disabled = true));
  }

  function showFinalScore() {
    stopTimer();
    const container = document.getElementById("quiz-container");
    const percentage = Math.round(
      (quizState.score / quizState.preguntas.length) * 100
    );
    const timeSpentFormatted = formatTime(quizState.timeSpent);

    let message = "";
    let emoji = "";

    if (percentage >= 90) {
      message = "¡Excelente trabajo! Dominas este tema.";
      emoji = "🌟";
    } else if (percentage >= 70) {
      message = "¡Buen trabajo! Casi lo tienes dominado.";
      emoji = "👏";
    } else if (percentage >= 50) {
      message = "Puedes mejorar. Revisa los conceptos.";
      emoji = "💪";
    } else {
      message = "Necesitas practicar más. ¡Sigue intentándolo!";
      emoji = "📚";
    }

    // Generar resumen de respuestas
    const answersSummary = quizState.preguntas
      .map((q, i) => {
        const userAnswer = quizState.userAnswers[i] || "No respondida";
        const isCorrect = userAnswer === q.answer;
        return `
        <div class="answer-summary ${isCorrect ? "correct" : "incorrect"}">
          <h4>Pregunta ${i + 1}: ${isCorrect ? "✔️" : "❌"}</h4>
          <p><strong>Tu respuesta:</strong> ${userAnswer}</p>
          ${
            !isCorrect
              ? `<p><strong>Respuesta correcta:</strong> ${q.answer}</p>`
              : ""
          }
          ${
            q.explanation
              ? `<p class="explanation"><strong>Explicación:</strong> ${q.explanation}</p>`
              : ""
          }
        </div>
      `;
      })
      .join("");

    container.innerHTML = `
      <div class="result-container">
        <div class="result-header">
          <h2>${emoji} Quiz Completado ${emoji}</h2>
          <div class="result-stats">
            <div class="stat-box">
              <h3>Puntuación Final</h3>
              <p class="final-score">${quizState.score}/${quizState.preguntas.length}</p>
              <p class="percentage">${percentage}%</p>
            </div>
            <div class="stat-box">
              <h3>Tiempo</h3>
              <p class="time-spent">${timeSpentFormatted}</p>
            </div>
          </div>
          <p class="result-message">${message}</p>
        </div>
        
        <div class="answers-summary">
          <h3>Resumen de Respuestas</h3>
          <div class="summary-container">
            ${answersSummary}
          </div>
        </div>
        
        <div class="result-actions">
          <button class="action-btn restart-btn" onclick="restartQuiz()">
            <i class="fas fa-redo"></i> Reiniciar Quiz
          </button>
          <button class="action-btn review-btn" onclick="reviewQuiz()">
            <i class="fas fa-book"></i> Revisar Respuestas
          </button>
          <button class="action-btn exit-btn" onclick="exitQuiz()">
            <i class="fas fa-sign-out-alt"></i> Salir del Quiz
          </button>
        </div>
      </div>
    `;

    saveCompletion();
    renderLatex(container);
  }

  function reviewQuiz() {
    quizState.currentQuestionIndex = 0;
    showQuestion(0);
    startTimer();
  }

  function exitQuiz() {
    // Aquí puedes redirigir al usuario o limpiar el quiz
    window.location.href = "/"; // Cambia esto según tus necesidades
  }

  function restartQuiz() {
    stopTimer();
    quizState = {
      ...quizState,
      currentQuestionIndex: 0,
      score: 0,
      answeredQuestions: new Set(),
      userAnswers: {},
      timeStarted: new Date(),
      timeSpent: 0,
    };
    clearStorage();
    loadQuestions();
  }

  // ==================== MANEJO DEL PROGRESO ==================== //

  function saveProgress() {
    sessionStorage.setItem(
      `quiz-${quizState.quizKey}-progress`,
      JSON.stringify({
        questionIndex: quizState.currentQuestionIndex,
        score: quizState.score,
        answeredQuestions: Array.from(quizState.answeredQuestions),
        userAnswers: quizState.userAnswers,
        timeStarted: quizState.timeStarted.toISOString(),
        timeSpent: quizState.timeSpent,
      })
    );
  }

  function saveCompletion() {
    const completionData = {
      quizKey: quizState.quizKey,
      completed: true,
      score: quizState.score,
      total: quizState.preguntas.length,
      percentage: Math.round(
        (quizState.score / quizState.preguntas.length) * 100
      ),
      date: new Date().toISOString(),
      timeSpent: quizState.timeSpent,
    };

    sessionStorage.setItem(
      `quiz-${quizState.quizKey}-completion`,
      JSON.stringify(completionData)
    );

    // También guardamos en localStorage para historial
    const history = JSON.parse(localStorage.getItem("quiz-history") || "[]");
    history.push(completionData);
    localStorage.setItem("quiz-history", JSON.stringify(history));
  }

  function loadProgress() {
    const completion = sessionStorage.getItem(
      `quiz-${quizState.quizKey}-completion`
    );
    if (completion) {
      showCompletionMessage(JSON.parse(completion));
      return true;
    }

    const progress = sessionStorage.getItem(
      `quiz-${quizState.quizKey}-progress`
    );
    if (progress) {
      const data = JSON.parse(progress);
      quizState.currentQuestionIndex = data.questionIndex || 0;
      quizState.score = data.score || 0;
      quizState.answeredQuestions = new Set(data.answeredQuestions || []);
      quizState.userAnswers = data.userAnswers || {};

      if (data.timeStarted) {
        quizState.timeStarted = new Date(data.timeStarted);
        const now = new Date();
        quizState.timeSpent =
          data.timeSpent || Math.floor((now - quizState.timeStarted) / 1000);
      }

      return true;
    }
    return false;
  }

  function showCompletionMessage(data) {
    document.getElementById("quiz-container").innerHTML = `
      <div class="completion-message">
        <h2>Ya completaste este quiz</h2>
        <p>Fecha: ${new Date(data.date).toLocaleDateString("es-ES")}</p>
        <p>Puntuación: ${data.score}/${data.total} (${data.percentage}%)</p>
        <p>Tiempo: ${formatTime(data.timeSpent)}</p>
        <div class="button-container">
          <button class="action-btn restart-btn" onclick="restartQuiz()">
            <i class="fas fa-redo"></i> Intentar de nuevo
          </button>
          <button class="action-btn exit-btn" onclick="exitQuiz()">
            <i class="fas fa-sign-out-alt"></i> Salir
          </button>
        </div>
      </div>
    `;
  }

  function clearStorage() {
    sessionStorage.removeItem(`quiz-${quizState.quizKey}-progress`);
    sessionStorage.removeItem(`quiz-${quizState.quizKey}-completion`);
  }

  // ==================== ESTILOS ==================== //

  const additionalCSS = `
  /* Estilos generales */
  #quiz-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  /* Encabezado del quiz */
  .quiz-header {
    margin-bottom: 20px;
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .quiz-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  
  .quiz-timer, .quiz-score {
    font-weight: bold;
    color: #495057;
  }
  
  .progress-container {
    height: 20px;
    background-color: #e9ecef;
    border-radius: 10px;
    position: relative;
    overflow: hidden;
  }
  
  .progress-bar {
    height: 100%;
    background-color: #4CAF50;
    transition: width 0.3s ease;
  }
  
  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #fff;
    font-weight: bold;
    font-size: 12px;
  }
  
  /* Tarjeta de pregunta */
  .question-card {
    background-color: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .question-content {
    margin-bottom: 20px;
  }
  
  .question-text {
    color: #212529;
    margin-bottom: 20px;
    font-size: 1.2rem;
  }
  
  .question-image {
    max-width: 100%;
    height: auto;
    margin: 10px 0;
    border-radius: 4px;
    display: block;
  }
  
  /* Opciones de respuesta */
  .options-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .option-item {
    margin: 8px 0;
  }
  
  .option-label {
    display: flex;
    align-items: center;
    padding: 12px 15px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid #dee2e6;
    background-color: #f8f9fa;
  }
  
  .option-label:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
  }
  
  .option-input {
    margin-right: 12px;
    cursor: pointer;
  }
  
  .option-text {
    flex: 1;
  }
  
  /* Estados de las opciones */
  .correct-answer {
    background-color: #d4edda !important;
    border-color: #c3e6cb !important;
    color: #155724;
  }
  
  .wrong-answer {
    background-color: #f8d7da !important;
    border-color: #f5c6cb !important;
    color: #721c24;
  }
  
  .selected-answer {
    background-color: #fff3cd !important;
    border-color: #ffeeba !important;
    color: #856404;
  }
  
  /* Retroalimentación */
  .quiz-feedback {
    margin: 15px 0;
    padding: 10px;
    border-radius: 6px;
    text-align: center;
  }
  
  .feedback-message {
    font-weight: bold;
    font-size: 1.1rem;
  }
  
  .feedback-message.correct {
    color: #28a745;
  }
  
  .feedback-message.incorrect {
    color: #dc3545;
  }
  
  /* Explicación */
  .quiz-explanation {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
    margin-top: 15px;
    border-left: 4px solid #6c757d;
  }
  
  .explanation-title {
    margin-top: 0;
    color: #495057;
    font-size: 1rem;
  }
  
  .explanation-text {
    margin-bottom: 0;
    color: #6c757d;
  }
  
  .reference-link {
    display: inline-block;
    margin-top: 10px;
    color: #007bff;
    text-decoration: none;
  }
  
  .reference-link:hover {
    text-decoration: underline;
  }
  
  /* Botones de navegación */
  .navigation-buttons {
    display: flex;
    justify-content: space-between;
    margin: 20px 0;
    gap: 10px;
  }
  
  .nav-btn, .submit-btn, .finish-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .nav-btn {
    background-color: #6c757d;
    color: white;
  }
  
  .nav-btn:hover {
    background-color: #5a6268;
  }
  
  .nav-btn:disabled {
    background-color: #d6d8db;
    cursor: not-allowed;
  }
  
  .submit-btn {
    background-color: #007bff;
    color: white;
    flex-grow: 1;
  }
  
  .submit-btn:hover {
    background-color: #0069d9;
  }
  
  .submit-btn:disabled {
    background-color: #b3d7ff;
    cursor: not-allowed;
  }
  
  .finish-btn {
    background-color: #28a745;
    color: white;
    flex-grow: 1;
  }
  
  .finish-btn:hover {
    background-color: #218838;
  }
  
  /* Navegación rápida */
  .quick-navigation {
    margin-top: 20px;
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
  }
  
  .quick-navigation p {
    margin-top: 0;
    margin-bottom: 10px;
    font-weight: bold;
    color: #495057;
  }
  
  .quick-nav-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .quick-nav-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid #dee2e6;
    background-color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    transition: all 0.2s;
  }
  
  .quick-nav-btn:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
  }
  
  .quick-nav-btn.active {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
  }
  
  .quick-nav-btn.answered {
    background-color: #4CAF50;
    color: white;
    border-color: #4CAF50;
  }
  
  /* Resultados */
  .result-container {
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .result-header {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .result-stats {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin: 20px 0;
  }
  
  .stat-box {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    min-width: 120px;
    text-align: center;
  }
  
  .stat-box h3 {
    margin-top: 0;
    color: #495057;
    font-size: 1rem;
  }
  
  .final-score {
    font-size: 1.8rem;
    font-weight: bold;
    margin: 5px 0;
    color: #212529;
  }
  
  .percentage {
    font-size: 1.5rem;
    font-weight: bold;
    color: #28a745;
    margin: 5px 0;
  }
  
  .time-spent {
    font-size: 1.5rem;
    font-weight: bold;
    color: #17a2b8;
    margin: 5px 0;
  }
  
  .result-message {
    font-size: 1.2rem;
    color: #212529;
    margin: 15px 0;
  }
  
  /* Resumen de respuestas */
  .answers-summary {
    margin-top: 30px;
  }
  
  .answers-summary h3 {
    color: #212529;
    border-bottom: 2px solid #dee2e6;
    padding-bottom: 8px;
  }
  
  .summary-container {
    max-height: 400px;
    overflow-y: auto;
    margin-top: 15px;
    padding-right: 10px;
  }
  
  .answer-summary {
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 6px;
    background-color: #f8f9fa;
  }
  
  .answer-summary h4 {
    margin-top: 0;
    margin-bottom: 10px;
  }
  
  .answer-summary p {
    margin: 5px 0;
  }
  
  .answer-summary.correct {
    border-left: 4px solid #28a745;
  }
  
  .answer-summary.incorrect {
    border-left: 4px solid #dc3545;
  }
  
  .explanation {
    font-style: italic;
    color: #6c757d;
  }
  
  /* Botones de acción */
  .result-actions {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 30px;
    flex-wrap: wrap;
  }
  
  .action-btn {
    padding: 12px 20px;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .restart-btn {
    background-color: #ffc107;
    color: #212529;
  }
  
  .restart-btn:hover {
    background-color: #e0a800;
  }
  
  .review-btn {
    background-color: #17a2b8;
    color: white;
  }
  
  .review-btn:hover {
    background-color: #138496;
  }
  
  .exit-btn {
    background-color: #dc3545;
    color: white;
  }
  
  .exit-btn:hover {
    background-color: #c82333;
  }
  
  /* Mensaje de error */
  .error-message {
    text-align: center;
    padding: 20px;
    background-color: #f8d7da;
    border-radius: 8px;
    color: #721c24;
  }
  
  .retry-btn {
    margin-top: 15px;
    padding: 8px 16px;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .retry-btn:hover {
    background-color: #c82333;
  }
  
  /* Mensaje de completado */
  .completion-message {
    text-align: center;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .navigation-buttons {
      flex-direction: column;
    }
    
    .result-stats {
      flex-direction: column;
      align-items: center;
    }
    
    .result-actions {
      flex-direction: column;
    }
    
    .action-btn {
      width: 100%;
    }
  }
`;

  // Añadir estilos al documento
  if (!document.getElementById("quiz-additional-styles")) {
    const style = document.createElement("style");
    style.id = "quiz-additional-styles";
    style.textContent = additionalCSS;
    document.head.appendChild(style);
  }

  // Añadir Font Awesome si no está presente
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const faLink = document.createElement("link");
    faLink.rel = "stylesheet";
    faLink.href =
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css";
    document.head.appendChild(faLink);
  }

  // Iniciar el quiz
  document.addEventListener("DOMContentLoaded", loadQuestions);
  window.restartQuiz = restartQuiz;
  window.reviewQuiz = reviewQuiz;
  window.exitQuiz = exitQuiz;

  loadQuestions();
}
