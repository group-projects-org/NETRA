import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import ExaminerDashboard from "./components/examiner/ExaminerDashboard";
import UploadQuestionPaper from "./components/examiner/UploadQuestionPaper";
import AdminDashboard from "./components/admin/AdminDashboard";

import {
  About,
  HowItWorks,
  FeaturesPage,
  Contact
} from "./components/InfoPages";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route path="/about" element={<About />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/contact" element={<Contact />} />

        <Route
          path="/examiner/dashboard"
          element={<ExaminerDashboard />}
        />
        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />
        <Route
          path="/examiner/upload"
          element={<UploadQuestionPaper />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
