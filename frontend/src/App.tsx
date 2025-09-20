import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Pairs from "./pages/pairs/Pairs";
import { ChartProvider } from "./components/charts/chartContext";

function App() {
  return (
    <ChartProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/charts/:pair" element={<Pairs />} />
      </Routes>
    </ChartProvider>
  );
}

export default App;
