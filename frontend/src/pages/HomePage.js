import React, { useContext } from "react";
import { Container, Box, Typography, Button, Grid, Paper } from "@material-ui/core";
import { Link } from "react-router-dom";
import lock from "../assets/lock.jpg";
import { UserContext } from "../context/UserContext";

const HomePage = () => {
  const { user } = useContext(UserContext);
  return (
    <Box py={10}>
      <Box py={10} textAlign="center" style={{ backgroundImage: `url(${lock})`, backgroundSize: "auto", color: "white" }}>
        <Typography variant="h3" gutterBottom>
          Welcome to FileStop
        </Typography>
        {user ? (
          <Typography variant="h5" gutterBottom>
            Welcome back, Explore and share your files securely.
          </Typography>
        ) : (
          <Typography variant="h5" gutterBottom>
            The best place to manage and share your files securely.
          </Typography>
        )}
        <Button variant="contained" color="secondary" size="large" component={Link} to={user ? "/upload" : "/register"}>
          {user ? "Upload Files" : "Get Started"}
        </Button>
      </Box>
      <Box py={10}>
        <Container>
          <Typography variant="h4" gutterBottom align="center">
            Features
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} style={{ padding: "20px", height: "100%" }}>
                <Typography variant="h6" gutterBottom>
                  Secure Storage
                </Typography>
                <Typography>Your files are stored securely with end-to-end encryption.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} style={{ padding: "20px", height: "100%" }}>
                <Typography variant="h6" gutterBottom>
                  Easy Sharing
                </Typography>
                <Typography>Share files with specific users effortlessly.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} style={{ padding: "20px", height: "100%" }}>
                <Typography variant="h6" gutterBottom>
                  User-Friendly
                </Typography>
                <Typography>A simple and intuitive interface for everyone.</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
