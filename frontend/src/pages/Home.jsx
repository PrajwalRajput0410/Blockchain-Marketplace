import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="public-shell">
      <nav className="container py-4 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <div className="brand-mark">M</div>
          <strong>MedChain Marketplace</strong>
        </div>
        <div className="d-flex gap-2">
          <Link to="/login" className="btn btn-outline-dark">
            Login
          </Link>
          <Link to="/register" className="btn btn-success">
            Register
          </Link>
        </div>
      </nav>

      <div className="container py-5">
        <div className="hero-grid">
          <div>
            <p className="text-uppercase small text-success fw-semibold mb-2">
              College project · synthetic data only
            </p>
            <h1 className="display-5 fw-bold mb-3">
              Blockchain-Based Medical Research Data Marketplace
            </h1>
            <p className="lead text-muted">
              Hospitals and labs publish encrypted research datasets. Researchers
              request consent, complete a simulated payment, and then download
              verified files. Dataset hashes live on a local Ethereum network.
            </p>
            <div className="d-flex gap-2">
              <Link to="/register" className="btn btn-success btn-lg">
                Get started
              </Link>
              <Link to="/login" className="btn btn-outline-secondary btn-lg">
                Use demo accounts
              </Link>
            </div>
          </div>
          <div className="hero-card p-4">
            <h5>What is on-chain vs simulated</h5>
            <ul className="mb-0">
              <li>
                <strong>Implemented on blockchain:</strong> file hash, provider id,
                consent status, payment record.
              </li>
              <li>
                <strong>Simulated:</strong> money transfer / UPI / card checkout.
              </li>
              <li>
                <strong>Off-chain:</strong> AES-256 encrypted files in MongoDB + disk.
              </li>
            </ul>
          </div>
        </div>

        <div className="row g-3 mt-5">
          {[
            ["bi-building", "Hospitals & labs", "Upload datasets, set INR prices, approve consent."],
            ["bi-person-badge", "Researchers", "Browse, request access, pay (demo), download."],
            ["bi-shield-lock", "Integrity", "SHA-256 hash compared with the smart contract."],
          ].map(([icon, title, text]) => (
            <div className="col-md-4" key={title}>
              <div className="panel p-4 h-100">
                <i className={`bi ${icon} fs-3 text-success`}></i>
                <h5 className="mt-3">{title}</h5>
                <p className="text-muted mb-0">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
