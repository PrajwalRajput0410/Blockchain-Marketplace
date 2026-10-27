import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  title: "",
  description: "",
  category: "Clinical Outcomes",
  diseaseArea: "",
  sampleSize: 10,
  priceInr: 1000,
};

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [d, r] = await Promise.all([
      api.get("/datasets/mine"),
      api.get("/requests"),
    ]);
    setDatasets(d.data);
    setRequests(r.data);
  };

  useEffect(() => {
    load().catch((err) => setError(getErrorMessage(err)));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Please choose a synthetic dataset file.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      payload.append("file", file);
      await api.post("/datasets", payload);
      setForm(emptyForm);
      setFile(null);
      event.target.reset();
      setMessage("Dataset encrypted, stored, and hash sent to the blockchain.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Upload failed."));
    } finally {
      setBusy(false);
    }
  };

  const decide = async (id, decision) => {
    try {
      await api.put(`/requests/${id}/consent`, { decision });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div>
      <h2 className="mb-1">{user.role === "laboratory" ? "Laboratory" : "Hospital"} dashboard</h2>
      <p className="text-muted">Upload synthetic datasets only. Files are encrypted with AES-256 before storage.</p>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="stat-card p-3">
            <small>My datasets</small>
            <h3>{datasets.length}</h3>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card p-3">
            <small>Pending consent</small>
            <h3>{requests.filter((r) => r.consentStatus === "pending").length}</h3>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card p-3">
            <small>On-chain records</small>
            <h3>{datasets.filter((d) => d.registerTxHash).length}</h3>
          </div>
        </div>
      </div>

      <div className="panel p-4 mb-4">
        <h5>Publish a dataset</h5>
        <form onSubmit={submit} className="row g-3">
          <div className="col-md-6">
            <input className="form-control" required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="col-md-3">
            <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>Clinical Outcomes</option>
              <option>Epidemiology</option>
              <option>Laboratory</option>
              <option>Genomics (synthetic)</option>
            </select>
          </div>
          <div className="col-md-3">
            <input className="form-control" type="number" min="0" required placeholder="Price INR" value={form.priceInr} onChange={(e) => setForm({ ...form, priceInr: e.target.value })} />
          </div>
          <div className="col-md-6">
            <input className="form-control" required placeholder="Disease / research area" value={form.diseaseArea} onChange={(e) => setForm({ ...form, diseaseArea: e.target.value })} />
          </div>
          <div className="col-md-3">
            <input className="form-control" type="number" min="1" required placeholder="Sample size" value={form.sampleSize} onChange={(e) => setForm({ ...form, sampleSize: e.target.value })} />
          </div>
          <div className="col-md-3">
            <input className="form-control" type="file" accept=".csv,.json,.txt,.xlsx" onChange={(e) => setFile(e.target.files[0])} />
          </div>
          <div className="col-12">
            <textarea className="form-control" required rows="3" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="col-12">
            <button className="btn btn-success" disabled={busy}>{busy ? "Uploading..." : "Encrypt and publish"}</button>
          </div>
        </form>
      </div>

      <div className="panel p-4 mb-4">
        <h5>My datasets</h5>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Title</th>
                <th>Price</th>
                <th>Hash</th>
                <th>Chain id</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d._id}>
                  <td>
                    <Link to={`/app/datasets/${d._id}`} className="fw-semibold">
                      {d.title}
                    </Link>
                    <div>
                      <small className="text-muted">{d.diseaseArea}</small>
                    </div>
                  </td>
                  <td>₹{d.priceInr}</td>
                  <td className="hash-chip">{d.sha256Hash.slice(0, 18)}...</td>
                  <td>{d.blockchainDatasetId || "pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel p-4">
        <h5>Consent requests</h5>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Researcher</th>
                <th>Dataset</th>
                <th>Purpose</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>{r.researcher?.name}</td>
                  <td>{r.dataset?.title}</td>
                  <td>{r.purpose}</td>
                  <td>
                    <StatusBadge value={r.consentStatus} />
                  </td>
                  <td className="text-end">
                    {r.consentStatus === "pending" && (
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-success" onClick={() => decide(r._id, "approved")}>Approve</button>
                        <button className="btn btn-outline-danger" onClick={() => decide(r._id, "rejected")}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
