import { Routes, Route, Navigate } from "react-router-dom";
// import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Profil from "./pages/Profil";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      {/* <Route path="/signin" element={<SignIn />} /> */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  );
}
