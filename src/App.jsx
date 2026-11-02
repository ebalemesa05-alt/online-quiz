
import { useState } from "react";
import "./App.css";

const questions = [
  {
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "High Text Machine Language",
      "Hyper Transfer Markup Language",
      "Home Tool Markup Language"
    ],
    answer: 0,
    explanation: "HTML stands for Hyper Text Markup Language. It structures web pages."
  },
  {
    question: "Which language is used to style web pages?",
    options: ["HTML", "CSS", "Python", "Java"],
    answer: 1,
    explanation: "CSS controls the colors, layout, fonts and visual appearance of web pages."
  },
  {
    question: "Which symbol selects an ID in CSS?",
    options: [".", "#", "*", "&"],
    answer: 1,
    explanation: "The # symbol is used to select an HTML element by its ID in CSS."
  },
  {
    question: "Which keyword declares a variable in JavaScript?",
    options: ["style", "design", "let", "color"],
    answer: 2,
    explanation: "The let keyword declares a block-scoped variable in JavaScript."
  },
  {
    question: "Which HTML tag creates a hyperlink?",
    options: ["<link>", "<a>", "<p>", "<img>"],
    answer: 1,
    explanation: "The anchor tag <a> creates hyperlinks to other pages or resources."
  }
];

function App() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [finalScore, setFinalScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  function startQuiz() {
    setStarted(true);
    setCurrent(0);
    setSelected(null);
    setSubmitted(false);
    setUserAnswers([]);
    setFinalScore(0);
    setFinished(false);
  }

  function nextQuestion() {
    const updatedAnswers = [...userAnswers, selected];
    setUserAnswers(updatedAnswers);

    const newScore = updatedAnswers.reduce(
      (total, answer, index) =>
        total + (answer === questions[index].answer ? 1 : 0),
      0
    );

    if (current === questions.length - 1) {
      setFinalScore(newScore);
      setFinished(true);
    } else {
      setCurrent(current + 1);
      setSelected(null);
      setSubmitted(false);
    }
  }

  function restartQuiz() {
    setStarted(false);
    setCurrent(0);
    setSelected(null);
    setSubmitted(false);
    setUserAnswers([]);
    setFinalScore(0);
    setFinished(false);
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="logo" href="#">
          <span className="logo-icon">Q</span>
          QuizMaster
        </a>

        <div className="nav-right">
          <span className="nav-status">
            <span className="status-dot"></span>
            Learning Platform
          </span>
        </div>
      </header>

      {!started ? (
        <main className="hero">
          <div className="hero-content">
            <span className="eyebrow">WELCOME TO QUIZMASTER</span>

            <h1>
              Learn More.
              <br />
              <span>Challenge Yourself.</span>
            </h1>

            <p>
              Test your knowledge, improve your skills, and
              discover how much you know with our interactive quizzes.
            </p>

            <button className="primary-button" onClick={startQuiz}>
              Start Quiz <span>→</span>
            </button>

            <div className="hero-stats">
              <div>
                <strong>05</strong>
                <span>Questions</span>
              </div>
              <div>
                <strong>01</strong>
                <span>Quiz</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>Learning</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card">
              <div className="visual-top">
                <span className="visual-icon">✦</span>
                <span className="live-label">INTERACTIVE QUIZ</span>
              </div>

              <div className="visual-circle">
                <span>Q</span>
              </div>

              <h2>Your Knowledge</h2>
              <p>Every question brings you one step forward.</p>

              <div className="visual-line">
                <span></span>
              </div>
              <div className="visual-bottom">
                <span>LEARN</span>
                <span>GROW</span>
                <span>SUCCEED</span>
              </div>
            </div>
          </div>
        </main>
      ) : finished ? (
        <main className="quiz-section">
          <div className="result-card">
            <div className="result-icon">🏆</div>
            <span className="eyebrow">QUIZ COMPLETED</span>
            <h1>Excellent Work!</h1>
            <p>You have completed all the questions.</p>

            <div className="score-circle">
              <strong>{finalScore}/{questions.length}</strong>
              <span>Your Score</span>
            </div>

            <h3>
              {finalScore === questions.length
                ? "Perfect Score! Amazing!"
                : finalScore >= 3
                ? "Great job! Keep learning!"
                : "Good effort! Practice makes progress!"}
            </h3>

            <div className="answer-review">
              <h2>Answer Review</h2>

              {questions.map((q, index) => {
                const isCorrect = userAnswers[index] === q.answer;

                return (
                  <div className="review-item" key={index}>
                    <p className="review-question">
                      Question {index + 1}: {q.question}
                    </p>

                    <p>
                      Your Answer:{" "}
                      <strong className={isCorrect ? "correct-answer" : "wrong-answer"}>
                        {q.options[userAnswers[index]] ?? "Not answered"}
                      </strong>
                    </p>

                    <p>
                      Correct Answer:{" "}
                      <strong className="correct-answer">
                        {q.options[q.answer]}
                      </strong>
                    </p>

                    <p className="review-explanation">
                      Explanation: {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>

            <button className="primary-button" onClick={restartQuiz}>
              Try Again <span>↻</span>
            </button>
          </div>
        </main>
      ) : (
        <main className="quiz-section">
          <div className="quiz-container">
            <div className="quiz-heading">
              <div>
                <span className="eyebrow">KNOWLEDGE CHALLENGE</span>
                <h1>Test Your Skills</h1>
              </div>
              <span className="question-count">
                {current + 1} / {questions.length}
              </span>
            </div>

            <div className="progress-info">
              <span>Quiz Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="question-card">
              <span className="question-label">
                QUESTION {String(current + 1).padStart(2, "0")}
              </span>

              <h2>{question.question}</h2>

              <p className="choose-text">
                Select the correct answer below.
              </p>

              <div className="options-list">
                {question.options.map((option, index) => {
                  let optionClass = "option-button";

                  if (selected === index) {
                    optionClass += " selected";
                  }

                  return (
                    <button
                      key={index}
                      className={optionClass}
                      onClick={() => !submitted && setSelected(index)}
                      disabled={submitted}
                    >
                      <span className="option-letter">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span>{option}</span>
                      <span className="option-check">
                        {selected === index ? "●" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="quiz-actions">
                {!submitted ? (
                  <button
                    className="primary-button submit-button"
                    onClick={() => setSubmitted(true)}
                    disabled={selected === null}
                  >
                    Submit Answer →
                  </button>
                ) : (
                  <button
                    className="primary-button submit-button"
                    onClick={nextQuestion}
                  >
                    {current === questions.length - 1
                      ? "View Results →"
                      : "Next Question →"}
                  </button>
                )}
              </div>
            </div>

            <p className="quiz-footer">
              Take your time. Think carefully and choose your best answer.
            </p>
          </div>
        </main>
      )}

      <footer className="footer">
        <span>© 2026 QuizMaster. All rights reserved.</span>
        <span>Learn • Practice • Succeed</span>
      </footer>
    </div>
  );
}

export default App;
