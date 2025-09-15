import React from "react";
import { Link } from "react-router";

const Navbar: React.FC = () => {
  return (
    <nav
      style={{
        background: "#333",
        color: "white",
        padding: "5px 10px",
        display: "flex",
        justifyContent: "space-between",
        height: "40px",
      }}
    >
      <div>
        <Link
          to="/"
          style={{
            color: "white",
            marginRight: "20px",
            textDecoration: "none",
          }}
        >
          Home
        </Link>
        <Link
          to="/charts/eurusd"
          style={{ color: "white", textDecoration: "none" }}
        >
          Charts
        </Link>
      </div>
      <div>Financial Chart App</div>
    </nav>
  );
};

export default Navbar;
