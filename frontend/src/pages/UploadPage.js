import React, { useEffect, useState, useRef, useContext } from "react";
import { AppBar, Toolbar, Typography, Container, Box, Button, Snackbar, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Chip } from "@material-ui/core";
import { Circle } from "rc-progress";
import Alert from "@material-ui/lab/Alert";
import Autocomplete from "@material-ui/lab/Autocomplete";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import * as crypto from "../utils/crypto";
import { axiosInstance } from "../utils/axiosRequest";
import { getPublicKey } from "../components/GetUserPublicKey.js";
import { UserContext } from "../context/UserContext.js";
import { useNavigate } from "react-router-dom";

const UploadPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("success");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  const inputRef = useRef();
  const [username, setUsername] = useState("");
  useEffect(() => {
    const storedUsername = localStorage.getItem("user");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (file) {
      setDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  const { setUser } = useContext(UserContext);
  const handleUserSearch = async (event, value) => {
    setUsername(localStorage.getItem("user"));
    if (value) {
      try {
        const response = await axiosInstance.get(`/users?query=${value}`);
        if (response.status === 200) {
          const filteredOptions = response.data.filter((user) => !selectedUsers.some((selected) => selected.username === user.username) && user.username !== username);
          setUserOptions(filteredOptions);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        setAlertOpen(true);
        setAlertSeverity("error");
        setUser(null);
        setAlertMessage("Error fetching users, Please login again!");
        setUserOptions([]);
        const timer = setInterval(() => {
          navigate("/login");
          clearInterval(timer);
        }, 2000);
      }
    } else {
      setUserOptions([]);
    }
  };

  const handleUserSelect = (event, newValue) => {
    setSelectedUsers(newValue);
  };
  const handleCloseUrlDialog = () => {
    setUrlDialogOpen(false);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fileUrl);
    setAlertMessage("URL copied to clipboard");
    setAlertSeverity("success");
    setAlertOpen(true);
  };

  const handleSubmit = async () => {
    if (file && selectedUsers.length > 0) {
      try {
        const formData = new FormData();
        const symKey = await crypto.generateSymKey();
        const metadata = { file_name: file.name, file_type: file.type };
        const { encryptedFile, encryptedMetadata, iv } = await crypto.encryptFileAndMetadata(file, metadata, symKey);

        const encryptedSymKeys = await Promise.all(
          selectedUsers.map(async (user) => {
            const encryptedSymKey = await crypto.encryptSymKey(symKey, user.public_key);
            return { username: user.username, encryptedSymKey: encryptedSymKey };
          }),
        );
        setUsername(localStorage.getItem("user"));
        const uploaderPublicKey = await getPublicKey(username);
        const encryptedSymKeyForUploader = await crypto.encryptSymKey(symKey, uploaderPublicKey);
        encryptedSymKeys.push({ username: username, encryptedSymKey: encryptedSymKeyForUploader });

        formData.append("file", new Blob([crypto.base64ToArrayBuffer(encryptedFile)]));
        formData.append("metadata", encryptedMetadata);
        formData.append("iv", iv);
        formData.append("encryptedKeys", JSON.stringify(encryptedSymKeys));
        formData.append("uploader", username);
        const response = await axiosInstance.post("/upload", formData, {
          onUploadProgress: (progressEvent) => {
            const { loaded, total } = progressEvent;
            const percentCompleted = Math.floor((loaded * 100) / total);
            setUploadProgress(percentCompleted);
          },
        });
        if (response.status === 201) {
          setFileUrl(response.data.url);
          setUrlDialogOpen(true);
          setAlertSeverity("success");
          setAlertMessage("File uploaded successfully");
        } else {
          setAlertSeverity("error");
          setAlertMessage("Failed to upload file");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        setAlertSeverity("error");
        setAlertMessage("Error uploading file");
      } finally {
        setAlertOpen(true);
        setDialogOpen(false);
        setUploadProgress(0);
      }
    } else {
      setAlertSeverity("error");
      setAlertMessage("No users selected");
      setAlertOpen(true);
    }
  };

  const handleCloseAlert = () => {
    setAlertOpen(false);
  };

  const renderPreview = () => {
    if (!file) {
      return <InsertDriveFileIcon style={{ fontSize: 100 }} />;
    }

    const fileURL = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {
      return <img src={fileURL} alt="preview" style={{ maxWidth: "100%", maxHeight: "100%" }} />;
    }

    if (file.type === "application/pdf") {
      return <embed src={fileURL} type="application/pdf" width="100%" height="100%" />;
    }

    return <InsertDriveFileIcon style={{ fontSize: 100 }} />;
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Upload Files
          </Typography>
          <Typography variant="h6">Hello, {username}</Typography>
        </Toolbar>
      </AppBar>
      <Container>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="80vh">
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" mb={2} style={{ width: 450, height: 450, border: "1px solid #ccc", borderRadius: "8px" }}>
            {renderPreview()}
          </Box>
          {file && (
            <Typography variant="body1" style={{ marginTop: "10px" }}>
              {file.name}
            </Typography>
          )}
          <input ref={inputRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />
          <Button variant="contained" color="primary" onClick={() => inputRef.current.click()} style={{ marginTop: "20px" }}>
            Select File
          </Button>
          {file && (
            <Box mt={2}>
              <Button variant="contained" color="secondary" onClick={handleUpload}>
                Upload
              </Button>
            </Box>
          )}
          {uploadProgress > 0 && (
            <Box mt={2} width="100px">
              <Circle strokeWidth={2} strokeColor={uploadProgress === 100 ? "#00a626" : "#2db7f5"} percent={uploadProgress} />
              <Typography variant="body2">{uploadProgress}%</Typography>
            </Box>
          )}
        </Box>
        <Snackbar open={alertOpen} autoHideDuration={30000} onClose={handleCloseAlert} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
          <Alert onClose={handleCloseAlert} severity={alertSeverity} variant="filled">
            {alertMessage}
          </Alert>
        </Snackbar>
        <Dialog open={dialogOpen} onClose={handleCloseDialog}>
          <DialogTitle>Select Users to Share</DialogTitle>
          <DialogContent>
            <Autocomplete multiple options={userOptions} getOptionLabel={(option) => option.username} filterSelectedOptions onInputChange={handleUserSearch} onChange={handleUserSelect} renderInput={(params) => <TextField {...params} variant="outlined" label="Search Users" placeholder="Add user" />} renderTags={(value, getTagProps) => value.map((option, index) => <Chip variant="outlined" label={option.username} {...getTagProps({ index })} />)} />{" "}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary">
              Cancel
            </Button>
            <Button onClick={handleSubmit} color="primary">
              Share and Upload
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={urlDialogOpen} onClose={handleCloseUrlDialog}>
          <DialogTitle>File URL</DialogTitle>
          <DialogContent>
            <Typography>Your file has been uploaded successfully. Here is the URL:</Typography>
            <Box display="flex" alignItems="center" mt={2}>
              <TextField value={fileUrl} fullWidth InputProps={{ readOnly: true }} />
              <Button onClick={handleCopyUrl} color="primary">
                Copy
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUrlDialog} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </div>
  );
};

export default UploadPage;
