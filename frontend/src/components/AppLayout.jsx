import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: "/app", label: "Dashboard", icon: "bi-grid", end: true },
    { to: "/app/browse", label: "Browse datasets", icon: "bi-collection" },
    { to: "/app/requests", label: "Access requests", icon: "bi-clipboard-check" },
    { to: "/app/verify", label: "Verify hash", icon: "bi-shield-check" },
  ];
  if (user.role === "admin") {
    links.push({ to: "/app/admin", label: "Admin overview", icon: "bi-gear" });
  }

  return (
    <div className="sidebar-layout">
      <aside className="sidebar">
        <div className="d-flex align-items-center gap-2 mb-4 px-2">
          <div className="brand-mark">M</div>
          <div>
            <div className="fw-bold text-white">MedChain</div>
            <small>Research marketplace</small>
          </div>
        </div>
        <nav className="d-grid gap-1 flex-grow-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <i className={`bi ${link.icon}`}></i>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button
          className="linkish mt-3"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          <i className="bi bi-box-arrow-left"></i>
          Sign out
        </button>
      </aside>
      <div>
        <div className="topbar d-flex justify-content-between align-items-center">
          <div>
            <div className="fw-semibold">{user.name}</div>
            <small className="text-muted">
              {user.role} · {user.organization}
            </small>
          </div>
          <span className="badge text-bg-light text-capitalize">{user.role}</span>
        </div>
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
