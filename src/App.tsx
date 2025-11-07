import { Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import SignUp from "./pages/SignUp";
import ResetRequest from "./pages/ResetRequest";
import ResetConfirm from "./pages/ResetConfirm";
import ProfilePage from "./pages/Profile";
import ProfileView from "./pages/ProfileView";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import SwipePage from "./pages/SwipePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/reset" element={<ResetRequest />} />
      <Route path="/reset/confirm" element={<ResetConfirm />} />
      <Route element={<ProtectedRoute />}> 
        <Route element={<AppLayout />}> 
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/swipe" element={<SwipePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/u/:id" element={<ProfileView />} />
        </Route>
      </Route>
      <Route path="*" element={<div>404</div>} />
    </Routes>
  );
}
