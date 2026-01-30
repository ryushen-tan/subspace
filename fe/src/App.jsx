import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Su3 from "./pages/su3.jsx";
import Research from "./pages/Research.jsx";
import Pricing from "./pages/Pricing.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/su3" element={<Su3 />} />
      <Route path="/research" element={<Research />} />
      <Route path="/pricing" element={<Pricing />} />
    </Routes>
  );
}

export default App;