import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleRegister } from "../components/RegisterUser";
import { Box, TextField, Button, Typography, Paper, Link, CssBaseline, Container, Grid, InputLabel } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import backgroundImage from "../assets/background-image.png"; // Ensure this path is correct
import { Snackbar } from "@material-ui/core";
import { Alert } from "@material-ui/lab";

const theme = createTheme();

const RegisterPage = () => {
  const navigate = useNavigate();
  const [username, setusername] = useState("");
  const [password, setpassword] = useState("");
  const [email, setemail] = useState("");
  const [message, setmessage] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState("success");

  useEffect(() => {
    if (message) {
      setAlertOpen(true);
      if (message === "User Registered Successfully") {
        setAlertSeverity("success");
        const timer = setInterval(() => {
          navigate("/login");
          clearInterval(timer);
        }, 3000);
      } else {
        setAlertSeverity("error");
        setAlertOpen(true);
      }
    }
  }, [message]);
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
              <Typography variant="h4" component="h1" align="center" color="#e0e0e0" gutterBottom>
                Create an account
              </Typography>
              <form onSubmit={(e) => handleRegister(e, username, password, email, setmessage, navigate)}>
                <InputLabel htmlFor="email" style={{ color: "#e0e0e0" }}>
                  Email
                </InputLabel>
                <TextField margin="normal" required fullWidth id="email" name="email" autoComplete="email" autoFocus value={email} onChange={(e) => setemail(e.target.value)} sx={{ mb: 3, mt: 0, backgroundColor: "#000", input: { color: "#fff" }, borderRadius: 1 }} />
                <InputLabel htmlFor="name" style={{ color: "#e0e0e0" }}>
                  Name
                </InputLabel>
                <TextField margin="normal" required fullWidth id="name" name="name" autoComplete="name" sx={{ mb: 3, mt: 0, backgroundColor: "#000", input: { color: "#fff" }, borderRadius: 1 }} />
                <InputLabel htmlFor="username" style={{ color: "#e0e0e0" }}>
                  Username
                </InputLabel>
                <TextField margin="normal" required fullWidth id="username" name="username" autoComplete="username" value={username} onChange={(e) => setusername(e.target.value)} sx={{ mb: 3, mt: 0, backgroundColor: "#000", input: { color: "#fff" }, borderRadius: 1 }} />
                <InputLabel htmlFor="password" style={{ color: "#e0e0e0" }}>
                  Password
                </InputLabel>
                <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" value={password} onChange={(e) => setpassword(e.target.value)} sx={{ mb: 3, mt: 0, input: { color: "#fff" }, backgroundColor: "#000", borderRadius: 1 }} />
                <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2 }}>
                  Register
                </Button>
              </form>
              <Grid container justifyContent="center">
                <Grid item>
                  <Typography variant="body2" color="#e0e0e0">
                    Already have an account?{" "}
                    <Link component="button" href="#" variant="body2" onClick={() => navigate("/login")}>
                      Log In
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

export default RegisterPage;
