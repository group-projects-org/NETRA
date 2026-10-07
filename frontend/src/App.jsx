import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import ExaminerDashboard from "./components/examiner/ExaminerDashboard";
import UploadQuestionPaper from "./components/examiner/UploadQuestionPaper";
import AdminDashboard from "./components/admin/AdminDashboard";

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
        <Route
         path="/admin/dashboard" 
         element={<AdminDashboard />}
        />     
        
        <Route path="/examiner/upload" element={<UploadQuestionPaper />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;