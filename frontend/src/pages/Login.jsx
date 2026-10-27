import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../api";
import { useAuth } from "../context/AuthContext";

const demos = [
  ["Admin", "admin@marketplace.com"],
  ["Hospital", "hospital@citycare.com"],
  ["Laboratory", "lab@genelab.com"],
  ["Researcher", "researcher@uni.edu"],
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "Password@123" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.token, data.user);
      navigate("/app");
    } catch (err) {
      setError(getErrorMessage(err, "Login failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="public-shell d-flex align-items-center">
      <div className="container py-5" style={{ maxWidth: 520 }}>
        <Link to="/" className="text-muted small">
          ← Back home
        </Link>
        <div className="panel p-4 mt-3">
          <h3 className="mb-1">Sign in</h3>
          <p className="text-muted">Demo password for seeded users: Password@123</p>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={submit} className="d-grid gap-3">
            <input
              className="form-control"
              type="email"
              required
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="form-control"
              type="password"
              required
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button className="btn btn-success" disabled={busy}>
              {busy ? "Signing in..." : "Login"}
            </button>
          </form>
          <div className="d-flex flex-wrap gap-2 mt-3">
            {demos.map(([label, email]) => (
              <button
                key={email}
                className="btn btn-sm btn-outline-secondary"
                type="button"
                onClick={() => setForm({ email, password: "Password@123" })}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 mb-0">
            New user? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
