// src/pages/UserProfile.js

import React from "react";
import { useParams } from "react-router-dom";

const UserProfile = () => {
  const { username } = useParams();
  const loggedInUser = "currentLoggedInUsername"; // Replace this with the actual logic to get the logged-in user

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Profile: {username}</h1>
      <div className="bg-white shadow-md rounded p-4">
        <p>Username: {username}</p>
        {/* Additional user profile details can go here */}
        {username === loggedInUser && (
          <div className="mt-4">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Settings</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
