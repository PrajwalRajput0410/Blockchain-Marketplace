import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { downloadDataset, getErrorMessage } from "../api";
import StatusBadge from "../components/StatusBadge";

export default function ResearcherDashboard() {
  const [datasets, setDatasets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    const [d, r] = await Promise.all([api.get("/datasets"), api.get("/requests")]);
    setDatasets(d.data);
    setRequests(r.data);
  };

  useEffect(() => {
    load().catch((err) => setError(getErrorMessage(err)));
  }, []);

  const pay = async (id) => {
    try {
      await api.post(`/requests/${id}/pay`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div>
      <h2>Researcher dashboard</h2>
      <p className="text-muted">Browse synthetic datasets, request consent, then complete a simulated payment.</p>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-4">
        <div className="col-md-4"><div className="stat-card p-3"><small>Available datasets</small><h3>{datasets.length}</h3></div></div>
        <div className="col-md-4"><div className="stat-card p-3"><small>My requests</small><h3>{requests.length}</h3></div></div>
        <div className="col-md-4"><div className="stat-card p-3"><small>Unlocked downloads</small><h3>{requests.filter((r) => r.paymentStatus === "paid").length}</h3></div></div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Latest datasets</h5>
        <Link to="/app/browse" className="btn btn-sm btn-outline-success">Browse all</Link>
      </div>
      <div className="row g-3 mb-4">
        {datasets.slice(0, 3).map((d) => (
          <div className="col-md-4" key={d._id}>
            <div className="dataset-card p-3 h-100">
              <StatusBadge value={d.category.toLowerCase().includes("lab") ? "laboratory" : "hospital"} />
              <h5 className="mt-2">{d.title}</h5>
              <p className="text-muted small">{d.description.slice(0, 90)}...</p>
              <div className="fw-semibold mb-2">₹{d.priceInr}</div>
              <Link className="btn btn-sm btn-success" to={`/app/datasets/${d._id}`}>View</Link>
            </div>
          </div>
        ))}
      </div>

      <div className="panel p-4">
        <h5>My access requests</h5>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Dataset</th>
                <th>Consent</th>
                <th>Payment</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>{r.dataset?.title}</td>
                  <td><StatusBadge value={r.consentStatus} /></td>
                  <td><StatusBadge value={r.paymentStatus} /></td>
                  <td className="text-end">
                    {r.consentStatus === "approved" && r.paymentStatus === "unpaid" && (
                      <button className="btn btn-sm btn-warning" onClick={() => pay(r._id)}>
                        Simulate payment
                      </button>
                    )}
                    {r.paymentStatus === "paid" && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() =>
                          downloadDataset(r.dataset._id, r.dataset.originalFileName).catch((err) =>
                            setError(getErrorMessage(err, "Download failed."))
                          )
                        }
                      >
                        Download
                      </button>
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
