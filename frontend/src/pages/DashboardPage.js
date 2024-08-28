import React, { useState, useEffect, useContext } from "react";
import { FormControl, InputLabel, MenuItem, Button, Select, Typography, Container, Box, Tabs, Tab, Avatar, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "@material-ui/lab";
import { axiosInstance } from "../utils/axiosRequest";
import { get as idbGet } from "idb-keyval";
import * as crypto from "../utils/crypto";
import { UserContext } from "../context/UserContext";
import { getPrivateKey } from "../components/GetUserPrivateKey";
const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  appBar: {
    backgroundColor: "#3f51b5",
  },
  tab: {
    fontWeight: "bold",
  },
  activeTabIndicator: {
    height: "4px",
    backgroundColor: "#ffeb3b",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "70vh",
  },
  detailsBox: {
    width: "80%",
    padding: theme.spacing(3),
    marginTop: theme.spacing(3),
  },
  avatar: {
    width: theme.spacing(15),
    height: theme.spacing(15),
  },
  paper: {
    padding: theme.spacing(3),
  },
  table: {
    minWidth: 650,
  },
  tableContainer: {
    marginTop: theme.spacing(2),
  },
  tableHeader: {
    backgroundColor: theme.palette.primary.main,
  },
  tableHeaderText: {
    color: theme.palette.common.white,
  },
}));

const ListOfSharedFiles = ({ files, username }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [paginatedFiles, setPaginatedFiles] = useState([]);
  const [cachedFiles, setCachedFiles] = useState({});
  const [error, setError] = useState(null);
  const { setUser } = useContext(UserContext);

  useEffect(() => {
    try {
      paginateFiles();
    } catch (error) {
      setError("Please login again");
      setUser(null);
      const timer = setInterval(() => {
        navigate("/login");
        clearInterval(timer);
      }, 3000);
    }
  }, [files, currentPage, rowsPerPage]);

  const paginateFiles = async () => {
    const indexOfLastFile = currentPage * rowsPerPage;
    const indexOfFirstFile = indexOfLastFile - rowsPerPage;
    const currentFiles = files.slice(indexOfFirstFile, indexOfLastFile);
    const detailedFiles = await Promise.all(
      currentFiles.map(async (file) => {
        if (cachedFiles[file.uri]) {
          return cachedFiles[file.uri];
        }
        const strippedFilename = file.uri.replace(/^uploads\//, "");
        const response = await axiosInstance.get(`/metadata/${strippedFilename}`);
        const encryptedMetadata = response.headers["x-file-metadata"];
        const encryptedSymKey = response.headers["x-file-access-key"];
        try {
          await getPrivateKey(username);
        } catch (error) {
          setError("Please login again");
          setUser(null);
          const timer = setInterval(() => {
            navigate("/login");
            clearInterval(timer);
          }, 3000);
        }
        const encryptedPrivKey = await getPrivateKey(username);
        const iv = response.headers["iv"];
        const derivedKey = await idbGet("encryptionKey");
        const decryptedMetadata = await crypto.decryptMetadata(encryptedMetadata, encryptedSymKey, iv, encryptedPrivKey, derivedKey);
        const detailedFile = {
          ...file,
          fileName: decryptedMetadata.metadata.file_name,
          fileType: decryptedMetadata.metadata.file_type,
        };
        setCachedFiles((prev) => ({ ...prev, [file.uri]: detailedFile }));
        return detailedFile;
      }),
    );

    setPaginatedFiles(detailedFiles);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    setCurrentPage(currentPage - 1);
  };
  const handleRowClick = (filename) => {
    window.open(`/${filename}`, "_blank");
  };
  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <div>
      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table className={classes.table}>
          <TableHead className={classes.tableHeader}>
            <TableRow>
              <TableCell className={classes.tableHeaderText}>Uploader</TableCell>
              <TableCell className={classes.tableHeaderText}>File Name</TableCell>
              <TableCell className={classes.tableHeaderText}>File Type</TableCell>
              <TableCell className={classes.tableHeaderText}>Date Shared</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedFiles.map((file, index) => (
              <TableRow key={index} onClick={() => handleRowClick(file.uri)} style={{ cursor: "pointer" }}>
                <TableCell>{file.uploader}</TableCell>
                <TableCell>{file.fileName}</TableCell>
                <TableCell>{file.fileType}</TableCell>
                <TableCell>{new Date(file.uploaded_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box className={classes.pagination} display="flex" justifyContent="space-between" alignItems="center">
        <div style={{ display: "flex", alignItems: "center", marginRight: "auto" }}>
          <FormControl className={classes.formControl}>
            <Select value={rowsPerPage} onChange={handleChangeRowsPerPage}>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
        </div>
        <div>
          <Button onClick={handlePreviousPage} disabled={currentPage === 1}>
            Previous
          </Button>
          <Button onClick={handleNextPage} disabled={currentPage * rowsPerPage >= files.length}>
            Next
          </Button>
        </div>
      </Box>
    </div>
  );
};

const DashboardPage = () => {
  const classes = useStyles();
  const { username } = useParams();
  const [value, setValue] = useState(0);
  const [loggedInUsername, setLoggedInUsername] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  const [sharedFiles, setSharedFiles] = useState([]);

  useEffect(() => {
    // Assume we have a function to get the logged-in user's username from local storage
    const storedUsername = localStorage.getItem("user");
    setLoggedInUsername(storedUsername);
    getUserData();
  }, []);

  const getUserData = async () => {
    try {
      const response = await axiosInstance.get(`/profile/${username}`);
      setUserDetails(response.data);
      fetchSharedFiles(response.data.shared_files || []);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };
  const fetchSharedFiles = async (sharedFileIds) => {
    try {
      const detailedFiles = await Promise.all(
        sharedFileIds.map(async (filename) => {
          const strippedFilename = filename.replace(/^uploads\//, "");
          const response = await axiosInstance.get(`/file/${strippedFilename}`);
          return response.data;
        }),
      );
      setSharedFiles(detailedFiles);
    } catch (error) {
      console.error("Error fetching file details:", error);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <div className={classes.root}>
      <Container>
        <Tabs value={value} onChange={handleChange} centered TabIndicatorProps={{ className: classes.activeTabIndicator }}>
          <Tab label="General Information" className={classes.tab} />
          {loggedInUsername === username && <Tab label="Shared With Me" className={classes.tab} />}
        </Tabs>
        <Box className={classes.content}>
          {value === 0 && userDetails && (
            <Paper className={classes.detailsBox}>
              <Grid container spacing={3} justify="center">
                <Grid item>
                  <Avatar
                    alt="User Profile"
                    src="https://www.w3schools.com/howto/img_avatar.png" // Placeholder image URL
                    className={classes.avatar}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6">Username: {username}</Typography>
                  <Typography variant="h6">Email: {userDetails.email}</Typography>
                </Grid>
              </Grid>
            </Paper>
          )}
          {value === 1 && loggedInUsername === username && (
            <Paper className={classes.detailsBox}>
              <Typography variant="h6">Files Shared With Me</Typography>
              {sharedFiles.length === 0 ? <Typography variant="body1">No files shared with you.</Typography> : <ListOfSharedFiles files={sharedFiles} username={username} />}
            </Paper>
          )}
        </Box>
      </Container>
    </div>
  );
};

export default DashboardPage;
