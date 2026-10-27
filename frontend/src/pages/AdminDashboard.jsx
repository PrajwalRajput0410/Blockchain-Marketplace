import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api";
import StatusBadge from "../components/StatusBadge";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/users"),
      api.get("/admin/datasets"),
      api.get("/admin/requests"),
      api.get("/admin/transactions"),
    ])
      .then(([s, u, d, r, t]) => {
        setStats(s.data);
        setUsers(u.data);
        setDatasets(d.data);
        setRequests(r.data);
        setTransactions(t.data);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  return (
    <div>
      <h2>Admin dashboard</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {stats && (
        <div className="row g-3 mb-4">
          {[
            ["Users", stats.users],
            ["Datasets", stats.datasets],
            ["Requests", stats.requests],
            ["Paid", stats.paid],
          ].map(([label, value]) => (
            <div className="col-md-3" key={label}>
              <div className="stat-card p-3">
                <small>{label}</small>
                <h3>{value}</h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {stats?.blockchain && (
        <div className={`alert ${stats.blockchain.connected ? "alert-success" : "alert-warning"}`}>
          {stats.blockchain.connected
            ? `Blockchain connected · contract ${stats.blockchain.contractAddress} · datasets on-chain ${stats.blockchain.datasetCount}`
            : `Blockchain offline: ${stats.blockchain.error}. The web app still uses MongoDB.`}
        </div>
      )}

      <div className="panel p-4 mb-4">
        <h5>Users</h5>
        <div className="table-responsive">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Organization</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><StatusBadge value={u.role} /></td>
                  <td>{u.organization}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel p-4 mb-4">
        <h5>Datasets</h5>
        <div className="table-responsive">
          <table className="table">
            <thead><tr><th>Title</th><th>Provider</th><th>Price</th><th>Hash</th></tr></thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d._id}>
                  <td>{d.title}</td>
                  <td>{d.provider?.organization}</td>
                  <td>₹{d.priceInr}</td>
                  <td className="hash-chip">{d.sha256Hash.slice(0, 20)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel p-4 mb-4">
        <h5>Access requests</h5>
        <div className="table-responsive">
          <table className="table">
            <thead><tr><th>Dataset</th><th>Researcher</th><th>Consent</th><th>Payment</th></tr></thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>{r.dataset?.title}</td>
                  <td>{r.researcher?.name}</td>
                  <td><StatusBadge value={r.consentStatus} /></td>
                  <td><StatusBadge value={r.paymentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel p-4">
        <h5>Transaction history</h5>
        <div className="table-responsive">
          <table className="table">
            <thead><tr><th>Type</th><th>Actor</th><th>On-chain</th><th>Tx hash</th><th>Details</th></tr></thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t._id}>
                  <td>{t.type}</td>
                  <td>{t.actor?.name}</td>
                  <td>{t.onChain ? "yes" : "no"}</td>
                  <td className="hash-chip">{t.txHash ? `${t.txHash.slice(0, 18)}...` : "-"}</td>
                  <td>{t.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
