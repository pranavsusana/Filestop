// src/App.js
import React, { useContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem } from "@material-ui/core";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UploadPage from "./pages/UploadPage";
import DashboardPage from "./pages/DashboardPage";
import DecryptFile from "./pages/ServeFile";
import { UserContext, UserProvider } from "./context/UserContext";
const AppContent = () => {
  const { user, setUser } = useContext(UserContext);
  const [anchorEl, setAnchorEl] = useState(null);

  // useEffect(() => {
  //   const storedUsername = localStorage.getItem("user");
  //   if (storedUsername) {
  //     setUsername(storedUsername);
  //   }
  // }, []);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleLogout = () => {
    setUser(null); // Update context
    handleMenuClose();
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  // useEffect(() => {
  //   const handleStorageChange = (event) => {
  //     if (event.key === "user") {
  //       window.location.reload();
  //     }
  //   };
  //   window.addEventListener("storage", handleStorageChange);
  //
  //   return () => {
  //     window.removeEventListener("storage", handleStorageChange);
  //   };
  // }, []);

  return (
    <div className="bg-gray-100 min-h-screen">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component={Link} to="/" style={{ flexGrow: 1, textDecoration: "none", color: "inherit" }}>
            FileStop
          </Typography>
          {user ? (
            <div>
              <Button color="inherit" onClick={handleMenuClick}>
                Hello, {user}
              </Button>
              <Menu anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem component={Link} to={`/profile/${user}`}>
                  Profile
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </div>
          ) : (
            <div>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Register
              </Button>
            </div>
          )}
        </Toolbar>
      </AppBar>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/profile/:username" element={<DashboardPage username="baftol" />} />
        <Route path="/uploads/:filename" element={<DecryptFile />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
};
export default App;
