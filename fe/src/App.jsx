import { Routes, Route } from "react-router-dom";
import Editor from "./pages/Editor.jsx";

function App() {
  return (
    <Routes>
      <Route path="/edit" element={<Editor />} />
    </Routes>
  );
}

export default App;