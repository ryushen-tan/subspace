import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuthStore } from "./state/useAuthStore";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Su3 from "./pages/su3.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";

function App() {
  useEffect(() => {
    useAuthStore.getState().init();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/su3" element={<Su3 />} />
      <Route path="/su3/:projectId" element={<Su3 />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
}

export default App;