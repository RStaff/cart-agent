import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AICopyGenerator from "./pages/AICopyGenerator";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div>
        <header className="header">
          <div className="header-title">Cart-Agent Command Center</div>
          <nav className="header-nav">
            <Link to="/dashboard"><button className="btn">Dashboard</button></Link>
            <Link to="/ai-copy"><button className="btn">AI Copy Generator</button></Link>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ai-copy" element={<AICopyGenerator />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
