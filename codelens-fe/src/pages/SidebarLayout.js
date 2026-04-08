// pages/SidebarLayout.jsx
import React from "react";
import Sidebar from "../components/common/Sidebar";
import Header from "../components/common/Header";
import { Outlet } from "react-router-dom";

const SidebarLayout = () => {
  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <Outlet />
      </div>
    </div>
  );
};

export default SidebarLayout;
