import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./admin.css";

const ADMIN_EMAIL = "ebalemesa05@gmail.com";

const emptyForm = {
  question: "",
  options: ["", "", "", ""],
  answer: "0",
  explanation: "",
};

export default function Admin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (data.session) {
        if (
          data.session.user.email?.toLowerCase() ===
          ADMIN_EMAIL.toLowerCase()
        ) {
          setSession(data.session);
          await loadData();
        } else {
          await supabase.auth.signOut();
          setMessage("This email is not authorized.");
        }
      }
    } catch (error) {
      setMessage("Session error: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function login(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) throw error;

      if (
        data.user.email?.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
      ) {
        await supabase.auth.signOut();
        throw new Error("This admin email is not authorized.");
      }

      setSession(data.session);
      setPassword("");
      setMessage("Login successful!");

      await loadData();
    } catch (error) {
      setMessage("Login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setSession(null);
      setQuestions([]);
      setResults([]);
      setSelectedResult(null);
      setForm(emptyForm);
      setEditingId(null);
      setMessage("");
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessage("Logout failed: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadData() {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;

      setQuestions(data || []);
    } catch (error) {
      setMessage("Could not load questions: " + error.message);
    }

    await refreshResults(false);
  }

  async function refreshResults(showMessage = true) {
    setRefreshing(true);

    try {
      const { data, error } = await supabase
        .from("quiz_results")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setResults(data || []);

      if (showMessage) {
        setMessage("Student results refreshed successfully!");
      }
    } catch (error) {
      setMessage("Could not load student results: " + error.message);
    } finally {
      setRefreshing(false);
    }
  }

  function updateOption(index, value) {
    setForm((previous) => {
      const newOptions = [...previous.options];
      newOptions[index] = value;

      return {
        ...previous,
        options: newOptions,
      };
    });
  }

  async function saveQuestion(e) {
    e.preventDefault();

    if (!form.question.trim()) {
      setMessage("Please enter the question.");
      return;
    }

    if (
      form.options.length !== 4 ||
      form.options.some((option) => !option.trim())
    ) {
      setMessage("Please fill in all four options.");
      return;
    }

    const correctAnswer = Number(form.answer);

    if (
      !Number.isInteger(correctAnswer) ||
      correctAnswer < 0 ||
      correctAnswer > 3
    ) {
      setMessage("Please select a valid correct answer.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const questionData = {
        question: form.question.trim(),
        options: form.options.map((option) => option.trim()),
        answer: correctAnswer,
        explanation: form.explanation.trim(),
      };

      let response;

      if (editingId !== null) {
        response = await supabase
          .from("questions")
          .update(questionData)
          .eq("id", editingId);
      } else {
        response = await supabase
          .from("questions")
          .insert([questionData]);
      }

      if (response.error) throw response.error;

      setMessage(
        editingId !== null
          ? "Question updated successfully!"
          : "Question added successfully!"
      );

      setForm(emptyForm);
      setEditingId(null);

      await loadData();
    } catch (error) {
      setMessage("Could not save question: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  function getOptions(question) {
    let options = question?.options;

    if (typeof options === "string") {
      try {
        options = JSON.parse(options);
      } catch {
        return [];
      }
    }

    return Array.isArray(options) ? options : [];
  }

  function editQuestion(question) {
    const options = getOptions(question);

    if (options.length !== 4) {
      setMessage("This question does not have four valid options.");
      return;
    }

    setForm({
      question: question.question || "",
      options,
      answer: String(question.answer ?? 0),
      explanation: question.explanation || "",
    });

    setEditingId(question.id);
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteQuestion(id) {
    if (
      !window.confirm(
        "Are you sure you want to delete this question?"
      )
    ) {
      return;
    }

    setDeleting(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMessage("Question deleted successfully.");

      if (editingId === id) {
        setForm(emptyForm);
        setEditingId(null);
      }

      await loadData();
    } catch (error) {
      setMessage("Could not delete question: " + error.message);
    } finally {
      setDeleting(false);
    }
  }

  function cancelEdit() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
  }

  function getAnswers(result) {
    try {
      if (!result?.answers) return {};

      return typeof result.answers === "string"
        ? JSON.parse(result.answers)
        : result.answers;
    } catch {
      return {};
    }
  }

  function getPercentage(score, total) {
    const totalQuestions = Number(total);
    const studentScore = Number(score);

    if (
      !Number.isFinite(totalQuestions) ||
      !Number.isFinite(studentScore) ||
      totalQuestions <= 0
    ) {
      return 0;
    }

    return Math.round(
      (studentScore / totalQuestions) * 100
    );
  }

  async function deleteResult(id) {
    if (
      !window.confirm(
        "Are you sure you want to delete this student result?"
      )
    ) {
      return;
    }

    setDeleting(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("quiz_results")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSelectedResult(null);
      setMessage("Student result deleted successfully!");

      await refreshResults(false);
    } catch (error) {
      setMessage("Could not delete result: " + error.message);
    } finally {
      setDeleting(false);
    }
  }

  function viewResult(result) {
    setSelectedResult(result);

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }

  // LOADING SCREEN
  if (loading) {
    return (
      <div className="admin-page">
        <div className="quiz-container">
          <div className="question-card">
            <h2>Loading Admin Dashboard...</h2>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN LOGIN
  if (!session) {
    return (
      <div className="admin-page">
        <div className="quiz-container">
          <div className="question-card">
            <h1>Admin Login</h1>
            <p>Enter your admin email and password.</p>

            <form onSubmit={login}>
              <label>Admin Email</label>

              <input
                type="email"
                placeholder="Admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label>Password</label>

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                className="submit-button"
                type="submit"
                disabled={loading}
              >
                Login
              </button>
            </form>

            {message && (
              <p style={{ color: "#f87171", marginTop: "15px" }}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD
  return (
    <div className="admin-page">
      <div className="quiz-container">

        {/* ADMIN HEADER */}
        <div className="question-card">
          <h1>Admin Dashboard</h1>
          <p>Manage questions and student results.</p>

          <p>
            Logged in as: <strong>{session.user.email}</strong>
          </p>

          <button
            className="submit-button"
            onClick={logout}
            disabled={loading}
          >
            Logout
          </button>

          {message && (
            <p style={{ marginTop: "15px" }}>{message}</p>
          )}
        </div>

        {/* ADD AND EDIT QUESTIONS */}
        <div className="question-card">
          <h2>
            {editingId !== null ? "Edit Question" : "Add New Question"}
          </h2>

          <form onSubmit={saveQuestion}>
            <label>Question</label>

            <textarea
              value={form.question}
              onChange={(e) =>
                setForm((previous) => ({
                  ...previous,
                  question: e.target.value,
                }))
              }
              required
            />

            {form.options.map((option, index) => (
              <div key={index}>
                <label>
                  Option {String.fromCharCode(65 + index)}
                </label>

                <input
                  value={option}
                  onChange={(e) =>
                    updateOption(index, e.target.value)
                  }
                  required
                />
              </div>
            ))}

            <label>Correct Answer</label>

            <select
              value={form.answer}
              onChange={(e) =>
                setForm((previous) => ({
                  ...previous,
                  answer: e.target.value,
                }))
              }
            >
              <option value="0">Option A</option>
              <option value="1">Option B</option>
              <option value="2">Option C</option>
              <option value="3">Option D</option>
            </select>

            <label>Explanation</label>

            <textarea
              value={form.explanation}
              onChange={(e) =>
                setForm((previous) => ({
                  ...previous,
                  explanation: e.target.value,
                }))
              }
            />

            <button
              className="submit-button"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Save Changes"
                  : "Add Question"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* QUESTIONS LIST */}
        <div className="question-card">
          <h2>Questions ({questions.length})</h2>

          {questions.length === 0 ? (
            <p>No questions found.</p>
          ) : (
            questions.map((question) => (
              <div key={question.id} className="review-item">
                <p>{question.question}</p>

                <button
                  onClick={() => editQuestion(question)}
                  disabled={deleting}
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteQuestion(question.id)}
                  disabled={deleting}
                >
                  {deleting ? "Please wait..." : "Delete"}
                </button>
              </div>
            ))
          )}
        </div>

        {/* STUDENT RESULTS */}
        <div className="question-card">
          <h2>Student Results ({results.length})</h2>

          <button
            className="submit-button"
            onClick={() => refreshResults(true)}
            disabled={refreshing}
          >
            {refreshing ? "Loading..." : "Refresh Results"}
          </button>

          {results.length === 0 ? (
            <p>No student results found.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "15px",
                marginTop: "20px",
              }}
            >
              {results.map((result) => {
                const score = Number(result.score) || 0;
                const total =
                  Number(result.total_questions) || 0;
                const percentage = getPercentage(score, total);

                return (
                  <div
                    key={result.id}
                    className="review-item"
                    style={{
                      padding: "20px",
                      borderRadius: "12px",
                      border: "1px solid #38bdf8",
                    }}
                  >
                    <h3>
                      {result.student_name || "Unknown Student"}
                    </h3>

                    <p>
                      <strong>Score:</strong> {score} / {total}
                    </p>

                    <div style={{ margin: "15px 0" }}>
                      <h2
                        style={{
                          color: "#38bdf8",
                          fontSize: "32px",
                        }}
                      >
                        {percentage}%
                      </h2>

                      <p>Student Percentage</p>

                      <div
                        style={{
                          width: "100%",
                          height: "12px",
                          background: "#334155",
                          borderRadius: "10px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: "100%",
                            background: "#38bdf8",
                            borderRadius: "10px",
                          }}
                        />
                      </div>
                    </div>

                    <p>
                      <strong>Date:</strong>{" "}
                      {result.created_at
                        ? new Date(
                            result.created_at
                          ).toLocaleString()
                        : "Unknown"}
                    </p>

                    <button onClick={() => viewResult(result)}>
                      View Details
                    </button>

                    <button
                      onClick={() => deleteResult(result.id)}
                      disabled={deleting}
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* STUDENT RESULT DETAILS */}
        {selectedResult && (
          <div className="question-card">
            <h2>Student Result Details</h2>

            <p>
              <strong>Student Name:</strong>{" "}
              {selectedResult.student_name}
            </p>

            <p>
              <strong>Score:</strong>{" "}
              {selectedResult.score} /{" "}
              {selectedResult.total_questions}
            </p>

            <p>
              <strong>Percentage:</strong>{" "}
              {getPercentage(
                selectedResult.score,
                selectedResult.total_questions
              )}%
            </p>

            <p>
              <strong>Date:</strong>{" "}
              {selectedResult.created_at
                ? new Date(
                    selectedResult.created_at
                  ).toLocaleString()
                : "Unknown"}
            </p>

            <h3>Answer Review</h3>

            {(() => {
              const studentAnswers = getAnswers(selectedResult);

              return questions.map((question, index) => {
                const options = getOptions(question);
                const selectedAnswer =
                  studentAnswers[question.id];
                const correctAnswer = Number(question.answer);

                const isAnswered =
                  selectedAnswer !== undefined;

                const isCorrect =
                  isAnswered &&
                  Number(selectedAnswer) === correctAnswer;

                return (
                  <div
                    key={question.id}
                    className="review-item"
                  >
                    <p>
                      <strong>
                        {index + 1}. {question.question}
                      </strong>
                    </p>

                    <p>
                      <strong>Student Answer:</strong>{" "}
                      {isAnswered
                        ? options[Number(selectedAnswer)] ??
                          "Unknown"
                        : "Not answered"}
                    </p>

                    <p>
                      <strong>Correct Answer:</strong>{" "}
                      {options[correctAnswer] ?? "Unknown"}
                    </p>

                    <p>
                      {isCorrect ? (
                        <strong style={{ color: "#22c55e" }}>
                          Correct
                        </strong>
                      ) : (
                        <strong style={{ color: "#ef4444" }}>
                          Incorrect
                        </strong>
                      )}
                    </p>
                  </div>
                );
              });
            })()}

            <button
              className="submit-button"
              onClick={() => setSelectedResult(null)}
            >
              Close Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}