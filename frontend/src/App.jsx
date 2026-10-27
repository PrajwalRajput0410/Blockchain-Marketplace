import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AppLayout from "./components/AppLayout";
import ProviderDashboard from "./pages/ProviderDashboard";
import ResearcherDashboard from "./pages/ResearcherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import BrowseDatasets from "./pages/BrowseDatasets";
import DatasetDetails from "./pages/DatasetDetails";
import AccessRequests from "./pages/AccessRequests";
import VerifyDataset from "./pages/VerifyDataset";

function Guard({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="p-5 text-center">Loading session...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }
  return children;
}

function RoleHome() {
  const { user } = useAuth();
  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "researcher") return <ResearcherDashboard />;
  return <ProviderDashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/app"
        element={
          <Guard>
            <AppLayout />
          </Guard>
        }
      >
        <Route index element={<RoleHome />} />
        <Route path="browse" element={<BrowseDatasets />} />
        <Route path="datasets/:id" element={<DatasetDetails />} />
        <Route path="requests" element={<AccessRequests />} />
        <Route path="verify" element={<VerifyDataset />} />
        <Route
          path="admin"
          element={
            <Guard roles={["admin"]}>
              <AdminDashboard />
            </Guard>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
