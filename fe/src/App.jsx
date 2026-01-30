import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuthStore } from "./state/useAuthStore";
import Landing from "./pages/Landing.jsx";
import Su3 from "./pages/su3.jsx";
import Research from "./pages/Research.jsx";
import Pricing from "./pages/Pricing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";

function App() {
  useEffect(() => {
    useAuthStore.getState().init();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/su3" element={<Su3 />} />
      <Route path="/research" element={<Research />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
}

export default App;