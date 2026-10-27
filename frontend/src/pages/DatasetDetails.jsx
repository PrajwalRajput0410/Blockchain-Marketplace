import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { downloadDataset, getErrorMessage } from "../api";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

export default function DatasetDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [dataset, setDataset] = useState(null);
  const [access, setAccess] = useState(null);
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    const { data } = await api.get(`/datasets/${id}`);
    setDataset(data.dataset);
    setAccess(data.access);
  };

  useEffect(() => {
    load().catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  const requestAccess = async (event) => {
    event.preventDefault();
    try {
      await api.post("/requests", { datasetId: id, purpose });
      setMessage("Access request sent. The provider must approve consent.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const pay = async () => {
    try {
      await api.post(`/requests/${access._id}/pay`);
      setMessage("Simulated payment recorded on-chain as a payment flag (no real ETH/INR moved).");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!dataset) return <div>Loading...</div>;

  const isOwner = String(dataset.provider?._id) === String(user.id);
  const canDownload =
    user.role === "admin" || isOwner || (access?.consentStatus === "approved" && access?.paymentStatus === "paid");

  return (
    <div className="panel p-4">
      <div className="d-flex justify-content-between flex-wrap gap-2">
        <div>
          <span className="badge text-bg-light">{dataset.category}</span>
          <h2 className="mt-2">{dataset.title}</h2>
          <p className="text-muted">{dataset.description}</p>
        </div>
        <div className="text-end">
          <div className="fs-3 fw-bold">₹{dataset.priceInr}</div>
          <small>Simulated INR price</small>
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      <div className="row g-3 mb-4">
        <div className="col-md-4"><strong>Provider</strong><div>{dataset.provider?.organization}</div></div>
        <div className="col-md-4"><strong>Sample size</strong><div>{dataset.sampleSize}</div></div>
        <div className="col-md-4"><strong>On-chain id</strong><div>{dataset.blockchainDatasetId || "Not yet mined"}</div></div>
      </div>
      <p className="hash-chip">SHA-256: {dataset.sha256Hash}</p>
      {dataset.registerTxHash && <p className="hash-chip">Tx: {dataset.registerTxHash}</p>}

      {user.role === "researcher" && !access && (
        <form onSubmit={requestAccess} className="mt-4">
          <textarea className="form-control mb-2" required minLength={10} rows="3" placeholder="Describe your research purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          <button className="btn btn-success">Request access</button>
        </form>
      )}

      {access && (
        <div className="mt-3 d-flex gap-2 align-items-center flex-wrap">
          <StatusBadge value={access.consentStatus} />
          <StatusBadge value={access.paymentStatus} />
          {access.consentStatus === "approved" && access.paymentStatus === "unpaid" && (
            <button className="btn btn-warning btn-sm" onClick={pay}>Simulate payment</button>
          )}
        </div>
      )}

      {canDownload && (
        <button
          className="btn btn-success mt-3"
          onClick={() =>
            downloadDataset(dataset._id, dataset.originalFileName).catch((err) =>
              setError(getErrorMessage(err, "Download failed."))
            )
          }
        >
          Download decrypted file
        </button>
      )}
    </div>
  );
}
