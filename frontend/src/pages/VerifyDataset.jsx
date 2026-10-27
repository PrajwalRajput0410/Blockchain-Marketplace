import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api";

export default function VerifyDataset() {
  const [datasets, setDatasets] = useState([]);
  const [datasetId, setDatasetId] = useState("");
  const [hash, setHash] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/datasets")
      .then((res) => {
        setDatasets(res.data);
        if (res.data[0]) setDatasetId(res.data[0]._id);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);
    try {
      const payload = new FormData();
      if (hash) payload.append("hash", hash);
      if (file) payload.append("file", file);
      const { data } = await api.post(`/datasets/${datasetId}/verify`, payload);
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err, "Verification failed."));
    }
  };

  return (
    <div className="panel p-4">
      <h2>Dataset integrity check</h2>
      <p className="text-muted">
        Compare a SHA-256 hash (or re-upload the original synthetic file) with MongoDB and the smart contract.
      </p>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={submit} className="d-grid gap-3 mb-4">
        <select className="form-select" value={datasetId} onChange={(e) => setDatasetId(e.target.value)}>
          {datasets.map((d) => (
            <option key={d._id} value={d._id}>
              {d.title}
            </option>
          ))}
        </select>
        <input className="form-control" placeholder="Paste SHA-256 hash (optional if you upload a file)" value={hash} onChange={(e) => setHash(e.target.value)} />
        <input className="form-control" type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button className="btn btn-success">Verify against blockchain</button>
      </form>
      {result && (
        <div className="alert alert-light border">
          <p><strong>Provided hash:</strong> <span className="hash-chip">{result.providedHash}</span></p>
          <p><strong>Stored hash:</strong> <span className="hash-chip">{result.storedHash}</span></p>
          <p>
            <strong>Database match:</strong>{" "}
            {result.databaseMatch ? "Yes — file matches MongoDB" : "No — hash does not match MongoDB"}
          </p>
          {result.blockchain?.error && (
            <p className="mb-0 text-warning">Blockchain check skipped: {result.blockchain.error}</p>
          )}
          {result.blockchain && !result.blockchain.error && (
            <p className="mb-0">
              <strong>On-chain match:</strong>{" "}
              {result.blockchain.matches
                ? "Yes — smart contract hash matches"
                : "No — smart contract hash is different"}
              <br />
              <span className="hash-chip">On-chain hash: {result.blockchain.onChainHash}</span>
            </p>
          )}
          {!result.blockchain && (
            <p className="mb-0 text-muted">This dataset does not have a blockchain id yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
