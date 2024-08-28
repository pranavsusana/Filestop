import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { handleLogin } from "../components/LoginUser";
import { Box, TextField, Button, Typography, Paper, Link, CssBaseline, Container, Grid, InputLabel, Snackbar } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import MuiAlert from "@mui/material/Alert";
import backgroundImage from "../assets/background-image.png"; // Ensure this path is correct
import { UserContext } from "../context/UserContext";

const theme = createTheme();

const Alert = React.forwardRef((props, ref) => {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const LoginPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("success");
  const { user } = useContext(UserContext);
  const { setUser } = useContext(UserContext);
  useEffect(() => {
    if (message) {
      setAlertOpen(true);
      if (message === "Login Successful") {
        navigate("/");
      } else {
        setAlertSeverity("error");
      }
    }
  }, [message]);
  if (user !== null) {
    navigate("/");
    return;
  }

  const handleCloseAlert = (event) => {
    setAlertOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
          overflow: "hidden",
          padding: "0 1rem",
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
        }}
      >
        <Container component="main" maxWidth="xs" sx={{ position: "relative", zIndex: 1 }}>
          <Paper elevation={3} sx={{ padding: 4, borderRadius: 2, backgroundColor: "#2c2f33" }}>
            <Box>
              <Typography variant="h4" sx={{ mb: 5 }} component="h1" align="center" color="#e0e0e0" gutterBottom>
                Welcome back!
              </Typography>
              <form onSubmit={(e) => handleLogin(e, username, password, setMessage, setUser)}>
                <InputLabel htmlFor="username" style={{ color: "#e0e0e0" }}>
                  Username*
                </InputLabel>
                <TextField margin="normal" required fullWidth id="username" name="username" autoComplete="username" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mb: 3, mt: 0, backgroundColor: "#000", input: { color: "#fff" }, borderRadius: 1 }} />
                <InputLabel htmlFor="password" style={{ color: "#e0e0e0" }}>
                  Password*
                </InputLabel>
                <TextField margin="normal" required fullWidth name="password" type="password" id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 3, mt: 0, backgroundColor: "#000", input: { color: "#fff" }, borderRadius: 1 }} />
                <Link href="#" variant="body2" display="block" align="center">
                  Forgot your password?
                </Link>
                <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2 }}>
                  Log In
                </Button>
              </form>
              <Grid container justifyContent="center">
                <Grid item>
                  <Typography variant="body2" color="#e0e0e0">
                    Need an account?{" "}
                    <Link href="#" variant="body2" onClick={() => navigate("/register")}>
                      Register
                    </Link>
                  </Typography>
                </Grid>
              </Grid>
              {message && (
                <Snackbar open={alertOpen} autoHideDuration={30000} onClose={handleCloseAlert} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                  <Alert onClose={handleCloseAlert} severity={alertSeverity} variant="filled">
                    {message}
                  </Alert>
                </Snackbar>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default LoginPage;
