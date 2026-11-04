import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import "./App.css";
import Admin from "./Admin";

function App() {
  const [questions, setQuestions] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);

  // Prevent duplicate result submissions
  const savingRef = useRef(false);
  const savedRef = useRef(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;

      setQuestions(data || []);
    } catch (error) {
      setQuestions([]);
      setMessage("Unable to load questions: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  function getOptions(question) {
    if (Array.isArray(question?.options)) {
      return question.options;
    }

    if (typeof question?.options === "string") {
      try {
        const parsed = JSON.parse(question.options);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    return [];
  }

  const currentQuestion = questions[currentIndex];

  const selectedAnswer = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;

  const answered = selectedAnswer !== undefined;

  const progress = questions.length
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;

  const percentage = questions.length
    ? Math.round((score / questions.length) * 100)
    : 0;

  function startQuiz() {
    if (!studentName.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    if (questions.length === 0) {
      setMessage("No questions available. Please try again later.");
      return;
    }

    const invalidQuestion = questions.some((question) => {
      const options = getOptions(question);

      return (
        !question.question ||
        options.length < 2 ||
        question.answer === null ||
        question.answer === undefined ||
        !Number.isInteger(Number(question.answer)) ||
        Number(question.answer) < 0 ||
        Number(question.answer) >= options.length
      );
    });

    if (invalidQuestion) {
      setMessage(
        "Some questions have invalid options or answers. Please contact the administrator."
      );
      return;
    }

    savingRef.current = false;
    savedRef.current = false;

    setCurrentIndex(0);
    setAnswers({});
    setFinished(false);
    setScore(0);
    setMessage("");
    setStarted(true);
  }

  function selectAnswer(index) {
    if (answered || !currentQuestion || saving) return;

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: index,
    }));
  }

  async function finishQuiz() {
    if (savingRef.current || savedRef.current) return;

    savingRef.current = true;
    setSaving(true);
    setMessage("");

    try {
      let totalScore = 0;

      questions.forEach((question) => {
        if (
          answers[question.id] !== undefined &&
          Number(answers[question.id]) === Number(question.answer)
        ) {
          totalScore++;
        }
      });

      const result = {
        student_name: studentName.trim(),
        score: totalScore,
        total_questions: questions.length,
        answers: answers,
      };

      const { error } = await supabase
        .from("quiz_results")
        .insert([result]);

      if (error) throw error;

      savedRef.current = true;

      setScore(totalScore);
      setFinished(true);
      setMessage("");
    } catch (error) {
      setMessage("Could not save result: " + error.message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function nextQuestion() {
    if (!answered || saving) return;

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((previous) => previous + 1);
    } else {
      finishQuiz();
    }
  }

  function restartQuiz() {
    savingRef.current = false;
    savedRef.current = false;

    setCurrentIndex(0);
    setAnswers({});
    setFinished(false);
    setStarted(false);
    setStudentName("");
    setScore(0);
    setMessage("");
  }

  if (showAdmin) {
    return (
      <div>
        <button
          onClick={() => setShowAdmin(false)}
          style={{
            padding: "12px 20px",
            margin: "15px",
            cursor: "pointer",
          }}
        >
          ← Back to Quiz
        </button>

        <Admin />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app">
        <h2 style={{ textAlign: "center", padding: "100px" }}>
          Loading QuizMaster...
        </h2>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <a href="#" className="logo">
          <span className="logo-icon">Q</span>
          QuizMaster
        </a>

        <button
          onClick={() => setShowAdmin(true)}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            background: "#7c3aed",
            color: "white",
            border: "none",
            cursor: "pointer",
            marginRight: "15px",
          }}
        >
          Admin
        </button>

        <div className="nav-status">
          <span className="status-dot"></span>
          Online Learning Platform
        </div>
      </nav>

      {!started && !finished && (
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">
              WELCOME TO QUIZMASTER
            </span>

            <h1>
              Challenge Your
              <span> Knowledge.</span>
              <br />
              Discover Your Potential.
            </h1>

            <p>
              Test your knowledge, improve your skills,
              and track your progress with QuizMaster.
              Learning has never been this exciting.
            </p>

            <input
              type="text"
              placeholder="Enter your full name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") startQuiz();
              }}
              maxLength={100}
              style={{
                width: "100%",
                maxWidth: "350px",
                padding: "15px",
                borderRadius: "10px",
                border: "1px solid #475569",
                background: "#1e293b",
                color: "white",
                marginBottom: "15px",
                fontSize: "15px",
              }}
            />

            <br />

            <button
              className="primary-button"
              onClick={startQuiz}
            >
              Start Your Quiz
              <span>→</span>
            </button>

            {message && (
              <p style={{ color: "#f87171", marginTop: "15px" }}>
                {message}
              </p>
            )}

            {questions.length === 0 && (
              <button
                onClick={loadQuestions}
                style={{
                  display: "block",
                  margin: "15px auto",
                  padding: "10px 18px",
                  cursor: "pointer",
                }}
              >
                Refresh Questions
              </button>
            )}

            <div className="hero-stats">
              <div>
                <strong>{questions.length}</strong>
                <span>Questions</span>
              </div>

              <div>
                <strong>100%</strong>
                <span>Learning</span>
              </div>

              <div>
                <strong>∞</strong>
                <span>Possibilities</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card">
              <div className="visual-top">
                <span className="visual-icon">✦</span>
                <span className="live-label">QUIZ EXPERIENCE</span>
              </div>

              <div className="visual-circle">
                <span>Q</span>
              </div>

              <h2>Ready to Learn?</h2>

              <p>
                Every question is an opportunity
                to discover something new.
              </p>

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
        </section>
      )}

      {started && !finished && currentQuestion && (
        <section className="quiz-section">
          <div className="quiz-container">
            <div className="quiz-heading">
              <div>
                <span className="eyebrow">QUIZ IN PROGRESS</span>
                <h1>Let's Test Your Knowledge</h1>

                <p style={{ color: "#94a3b8", marginTop: "10px" }}>
                  Student: {studentName}
                </p>
              </div>

              <span className="question-count">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>

            <div className="progress-info">
              <span>Your Progress</span>
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
                QUESTION {currentIndex + 1}
              </span>

              <h2>{currentQuestion.question}</h2>

              <p className="choose-text">
                Choose the correct answer below.
              </p>

              <div className="options-list">
                {getOptions(currentQuestion).map((option, index) => {
                  const isCorrect =
                    Number(index) === Number(currentQuestion.answer);

                  const isSelected = selectedAnswer === index;

                  let optionClass = "option-button";

                  if (answered && isCorrect) {
                    optionClass += " correct";
                  } else if (answered && isSelected && !isCorrect) {
                    optionClass += " incorrect";
                  } else if (isSelected) {
                    optionClass += " selected";
                  }

                  return (
                    <button
                      key={index}
                      className={optionClass}
                      onClick={() => selectAnswer(index)}
                      disabled={answered || saving}
                    >
                      <span className="option-letter">
                        {String.fromCharCode(65 + index)}
                      </span>

                      <span>{option}</span>

                      {answered && isCorrect && (
                        <span className="option-check">✓</span>
                      )}

                      {answered && isSelected && !isCorrect && (
                        <span className="option-check">✕</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div className="explanation">
                  <strong>
                    {Number(selectedAnswer) === Number(currentQuestion.answer)
                      ? "Correct Answer!"
                      : "Incorrect Answer"}
                  </strong>

                  <p>
                    {currentQuestion.explanation ||
                      "Keep learning and improving your knowledge!"}
                  </p>
                </div>
              )}

              {message && (
                <p style={{ color: "#f87171", marginTop: "15px" }}>
                  {message}
                </p>
              )}

              <div className="quiz-actions">
                <button
                  className="primary-button submit-button"
                  onClick={nextQuestion}
                  disabled={!answered || saving}
                >
                  {saving
                    ? "Saving Result..."
                    : currentIndex === questions.length - 1
                    ? "Finish Quiz"
                    : "Next Question →"}
                </button>
              </div>
            </div>

            <div className="quiz-footer">
              Take your time. Choose your best answer.
            </div>
          </div>
        </section>
      )}

      {started && !finished && !currentQuestion && (
        <section className="quiz-section">
          <div className="result-card">
            <h2>Question not found.</h2>
            <button className="primary-button" onClick={restartQuiz}>
              Back to Home
            </button>
          </div>
        </section>
      )}

      {finished && (
        <section className="quiz-section">
          <div className="result-card">
            <div className="result-icon">🏆</div>

            <span className="eyebrow">QUIZ COMPLETED</span>

            <h1>Congratulations, {studentName}!</h1>

            <p>You have successfully completed your quiz.</p>

            <div className="score-circle">
              <strong>{score}</strong>
              <span>OUT OF {questions.length}</span>
            </div>

            <h2>{percentage}%</h2>
            <p>Your final percentage</p>

            <h3>
              {score === questions.length
                ? "Perfect Score! Excellent Work!"
                : score >= questions.length / 2
                ? "Great Job! Keep Improving!"
                : "Good Effort! Keep Practicing!"}
            </h3>

            <button
              className="primary-button"
              onClick={restartQuiz}
            >
              Take Another Quiz →
            </button>

            <div className="answer-review">
              <h2>Answer Review</h2>

              {questions.map((question, index) => {
                const correct =
                  Number(answers[question.id]) ===
                  Number(question.answer);

                const options = getOptions(question);

                return (
                  <div className="review-item" key={question.id}>
                    <p className="review-question">
                      {index + 1}. {question.question}
                    </p>

                    <p>
                      Your answer:{" "}
                      <span
                        className={
                          correct ? "correct-answer" : "wrong-answer"
                        }
                      >
                        {options[answers[question.id]] ?? "Not answered"}
                      </span>
                    </p>

                    <p>
                      Correct answer:{" "}
                      <span className="correct-answer">
                        {options[Number(question.answer)] ?? "Not available"}
                      </span>
                    </p>

                    {question.explanation && (
                      <p className="review-explanation">
                        Explanation: {question.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <footer className="footer">
        <span>© 2026 QuizMaster. All rights reserved.</span>
        <span>Learn More. Achieve More.</span>
      </footer>
    </div>
  );
}

export default App;