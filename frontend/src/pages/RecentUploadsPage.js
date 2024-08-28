import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RecentUploadsPage.css";

const RecentUploadsPage = () => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    // Fetch recent uploads from the backend (replace with actual API call)
    const fetchFiles = async () => {
      try {
        const response = await axios.get("/api/recent-uploads"); // Replace with actual endpoint
        setFiles(response.data);
      } catch (error) {
        console.error("Error fetching recent uploads:", error);
      }
    };

    fetchFiles();
  }, []);

  const getPreview = (file) => {
    const fileType = file.type.split("/")[0];

    switch (fileType) {
      case "image":
        return <img src={file.url} alt={file.name} className="file-preview" />;
      case "video":
        return <video src={file.url} controls className="file-preview" />;
      case "audio":
        return <audio src={file.url} controls className="file-preview" />;
      default:
      // return <img src="/default-preview.png" alt="Default preview" className="file-preview" />; // Replace with the path to your default image
    }
  };

  return (
    <div className="recent-uploads">
      <h1>Recent Uploads</h1>
      <div className="files-container">
        {files.map((file) => (
          <div key={file.id} className="file-box">
            {getPreview(file)}
            <p className="file-name">{file.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentUploadsPage;
