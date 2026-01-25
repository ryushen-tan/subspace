import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Editor from "./pages/Editor.jsx";
import Billing from "./pages/Billing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import CreateProject from "./pages/CreateProject.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/create-project" element={<CreateProject />} />
      <Route path="/edit" element={<Editor />} />
      <Route path="/billing" element={<Billing />} />
    </Routes>
  );
}

export default App;