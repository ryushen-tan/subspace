import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Editor from "./pages/Editor.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/edit" element={<Editor />} />
    </Routes>
  );
}

export default App;