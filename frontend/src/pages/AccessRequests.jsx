import { useEffect, useState } from "react";
import api, { downloadDataset, getErrorMessage } from "../api";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

export default function AccessRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    const { data } = await api.get("/requests");
    setRequests(data);
  };

  useEffect(() => {
    load().catch((err) => setError(getErrorMessage(err)));
  }, []);

  const decide = async (id, decision) => {
    try {
      await api.put(`/requests/${id}/consent`, { decision });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const pay = async (id) => {
    try {
      await api.post(`/requests/${id}/pay`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="panel p-4">
      <h2>Access requests</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Dataset</th>
              <th>Researcher</th>
              <th>Consent</th>
              <th>Payment</th>
              <th>Chain</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r._id}>
                <td>{r.dataset?.title}</td>
                <td>{r.researcher?.name}</td>
                <td><StatusBadge value={r.consentStatus} /></td>
                <td><StatusBadge value={r.paymentStatus} /></td>
                <td className="hash-chip">{r.blockchainRequestId || "-"}</td>
                <td className="text-end">
                  {(user.role === "hospital" || user.role === "laboratory") && r.consentStatus === "pending" && (
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-success" onClick={() => decide(r._id, "approved")}>Approve</button>
                      <button className="btn btn-outline-danger" onClick={() => decide(r._id, "rejected")}>Reject</button>
                    </div>
                  )}
                  {user.role === "researcher" && r.consentStatus === "approved" && r.paymentStatus === "unpaid" && (
                    <button className="btn btn-sm btn-warning" onClick={() => pay(r._id)}>Pay (simulated)</button>
                  )}
                  {user.role === "researcher" && r.paymentStatus === "paid" && (
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
  );
}
