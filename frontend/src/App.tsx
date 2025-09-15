import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Pairs from "./pages/pairs/Pairs";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/charts/:pair" element={<Pairs />} />
      </Routes>
    </>
  );
}

export default App;
