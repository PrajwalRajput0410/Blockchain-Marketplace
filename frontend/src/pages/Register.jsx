import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    organization: "",
    role: "researcher",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/auth/register", form);
      login(data.token, data.user);
      navigate("/app");
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="public-shell d-flex align-items-center">
      <div className="container py-5" style={{ maxWidth: 560 }}>
        <Link to="/" className="text-muted small">
          ← Back home
        </Link>
        <div className="panel p-4 mt-3">
          <h3>Create account</h3>
          <p className="text-muted">Hospitals, laboratories, and researchers can register.</p>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={submit} className="d-grid gap-3">
            <input className="form-control" required placeholder="Full name" value={form.name} onChange={change("name")} />
            <input className="form-control" type="email" required placeholder="Email" value={form.email} onChange={change("email")} />
            <input className="form-control" required placeholder="Organization" value={form.organization} onChange={change("organization")} />
            <select className="form-select" value={form.role} onChange={change("role")}>
              <option value="hospital">Hospital</option>
              <option value="laboratory">Laboratory</option>
              <option value="researcher">Researcher</option>
            </select>
            <input className="form-control" type="password" minLength={6} required placeholder="Password (min 6 characters)" value={form.password} onChange={change("password")} />
            <button className="btn btn-success" disabled={busy}>
              {busy ? "Creating..." : "Register"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
