import React, { useContext, useEffect, useState } from "react";
import { CircularProgress, Container, Typography, Card, CardContent, CardActions, Button, Box } from "@material-ui/core";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";

import Alert from "@material-ui/lab/Alert";
import { axiosInstance } from "../utils/axiosRequest.js";
import { get as idbGet } from "idb-keyval";
import * as crypto from "../utils/crypto.js";
import { getPrivateKey } from "../components/GetUserPrivateKey.js";
import { useNavigate, useParams } from "react-router-dom";
import { UserContext } from "../context/UserContext.js";

const DecryptFile = () => {
  const navigate = useNavigate();
  const { filename } = useParams();
  const [decryptedMetadata, setDecryptedMetadata] = useState(null);
  const [decryptedFile, setDecryptedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const username = localStorage.getItem("user");
  const { setUser } = useContext(UserContext);

  useEffect(() => {
    const fetchAndDecrypt = async () => {
      try {
        // Fetch the file from the backend
        const response = await axiosInstance.get(`/uploads/${filename}`, {
          responseType: "arraybuffer",
        });

        // Read headers
        const encryptedMetadata = response.headers["x-file-metadata"];
        const encryptedSymKey = response.headers["x-file-access-key"];
        const iv = response.headers["iv"]; // Assuming you get IV from metadata or another source
        const derivedKey = await idbGet("encryptionKey");
        if (!(derivedKey instanceof CryptoKey)) {
          throw new Error("Retrieved key is not a valid CryptoKey");
        }
        if (!derivedKey) {
          throw new Error("No derived key found in IndexedDB");
        }
        const fileBuffer = response.data;
        console.log(username);
        try {
          await getPrivateKey(username);
        } catch (error) {
          setError("Please login again");
          setUser(null);
          setLoading(false);
          const timer = setInterval(() => {
            navigate("/login");
            clearInterval(timer);
          }, 3000);
        }
        const encryptedPrivKey = await getPrivateKey(username);
        const result = await crypto.decryptFileAndMetadata(fileBuffer, encryptedMetadata, encryptedSymKey, iv, encryptedPrivKey, derivedKey);
        const decryptedFile = result.decryptedFile;
        const metadata = result.metadata;
        setDecryptedMetadata(metadata);
        setDecryptedFile(decryptedFile);
        setLoading(false);
      } catch (err) {
        setError("Access Denied");
        setLoading(false);
      }
    };

    fetchAndDecrypt();
  }, [filename]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  const fileUrl = URL.createObjectURL(decryptedFile);

  return (
    <Container maxWidth="md" style={{ marginTop: "30px" }}>
      <Card style={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {decryptedMetadata.file_name}
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
            {decryptedMetadata.file_type.startsWith("image/") && <img src={fileUrl} alt="Decrypted" style={{ maxWidth: "100%", maxHeight: "600px" }} />}
            {decryptedMetadata.file_type === "application/pdf" && <embed src={fileUrl} type="application/pdf" width="100%" height="600px" />}
            {!decryptedMetadata.file_type.startsWith("image/") && decryptedMetadata.file_type !== "application/pdf" && (
              <Box display="flex" flexDirection="column" alignItems="center">
                <InsertDriveFileIcon style={{ fontSize: 100, color: "#757575" }} />
                <Typography variant="body1">File type not supported for preview. Please download the file.</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
        <CardActions>
          <Button variant="contained" color="primary" href={fileUrl} download={decryptedMetadata.file_name} style={{ margin: "auto" }}>
            Download File
          </Button>
        </CardActions>
      </Card>
    </Container>
  );
};

export default DecryptFile;
