import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import ExaminerDashboard from "./components/examiner/ExaminerDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/examiner/dashboard"
          element={<ExaminerDashboard />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;