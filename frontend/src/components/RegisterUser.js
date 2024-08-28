import axios from "axios";
import * as crypto from "../utils/crypto";

export const handleRegister = async (e, username, password, email, setmessage, navigate) => {
  e.preventDefault();

  try {
    const { publicKey, privateKey } = await crypto.generateKeyPair();
    const derivedKey = await crypto.deriveKeyFromPassword(password, username);
    const hashedPassword = await crypto.hashPassword(password, username);
    const encryptedPrivateKey = await crypto.encryptPrivateKey(privateKey, derivedKey);

    const response = await axios.post("/api/register", {
      username: username,
      password: hashedPassword,
      email: email,
      public_key: publicKey,
      encrypted_priv_key: encryptedPrivateKey,
    });

    if (response.status === 201) {
      setmessage(response.data.message);
      // Redirect to login page after successful registration without reloading
      // setTimeout(() => {
      //   navigate("/login");
      // }, 2000);
    }
  } catch (error) {
    setmessage(error.response ? error.response.data : "Registration failed");
  }
};
