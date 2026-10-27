import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api";

export default function BrowseDatasets() {
  const [datasets, setDatasets] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");

  const load = async (query = q, cat = category) => {
    try {
      const { data } = await api.get("/datasets", { params: { q: query, category: cat } });
      setDatasets(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h2>Browse datasets</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form
        className="row g-2 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <div className="col-md-6">
          <input className="form-control" placeholder="Search title, disease, description" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="col-md-3">
            <select
              className="form-select"
              value={category}
              onChange={(e) => {
                const next = e.target.value;
                setCategory(next);
                load(q, next);
              }}
            >
            <option value="">All categories</option>
            <option>Clinical Outcomes</option>
            <option>Epidemiology</option>
            <option>Laboratory</option>
            <option>Genomics (synthetic)</option>
          </select>
        </div>
        <div className="col-md-3">
          <button className="btn btn-success w-100">Search</button>
        </div>
      </form>
      <div className="row g-3">
        {datasets.map((d) => (
          <div className="col-md-6" key={d._id}>
            <div className="dataset-card p-4 h-100">
              <div className="d-flex justify-content-between">
                <span className="badge text-bg-light">{d.category}</span>
                <strong>₹{d.priceInr}</strong>
              </div>
              <h4 className="mt-3">{d.title}</h4>
              <p className="text-muted">{d.description}</p>
              <div className="small mb-3">
                {d.provider?.organization} · {d.sampleSize} records · {d.diseaseArea}
              </div>
              <Link to={`/app/datasets/${d._id}`} className="btn btn-outline-success">
                Open details
              </Link>
            </div>
          </div>
        ))}
        {datasets.length === 0 && <p>No datasets match your search.</p>}
      </div>
    </div>
  );
}
