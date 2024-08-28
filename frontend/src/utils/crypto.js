export function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function generateKeyPair() {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: { name: "SHA-256" },
      },
      true,
      ["encrypt", "decrypt"],
    );

    const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    return {
      publicKey: arrayBufferToBase64(publicKey),
      privateKey: arrayBufferToBase64(privateKey),
    };
  } catch (error) {
    throw error;
  }
}

export async function hashPassword(password, username) {
  try {
    const enc = new TextEncoder();
    const passwordBuffer = enc.encode(password);
    const saltBuffer = enc.encode(username); // Using the username as the salt

    // Combine the password and salt buffers
    const combinedBuffer = new Uint8Array(passwordBuffer.length + saltBuffer.length);
    combinedBuffer.set(passwordBuffer);
    combinedBuffer.set(saltBuffer, passwordBuffer.length);

    // Hash the combined buffer
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", combinedBuffer);

    return arrayBufferToBase64(hashBuffer);
  } catch (error) {
    throw error;
  }
}
async function importPrivateKey(base64PrivateKey) {
  const binaryDer = base64ToArrayBuffer(base64PrivateKey);
  return window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"],
  );
}
async function importPublicKey(base64PublicKey) {
  const binaryDer = base64ToArrayBuffer(base64PublicKey);
  return window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"],
  );
}
export async function generateSymKey() {
  return window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
}
export async function deriveKeyFromPassword(password, salt) {
  try {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);

    const key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: enc.encode(salt),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"],
    );

    return key;
  } catch (error) {
    throw error;
  }
}
export async function encryptPrivateKey(privateKey, derivedKey) {
  // Convert the private key (assumed to be in base64) to an ArrayBuffer
  try {
    const privateKeyBuffer = base64ToArrayBuffer(privateKey);

    // Generate a random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the private key using AES-GCM
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      derivedKey,
      privateKeyBuffer,
    );
    return JSON.stringify({
      iv: arrayBufferToBase64(iv),
      ciphertext: arrayBufferToBase64(encrypted),
    });
  } catch (error) {
    throw error;
  }

  // Return the IV and ciphertext as base64 strings
}
async function decryptPrivateKey(encryptedPrivateKey, derivedKey) {
  const jsonobject = JSON.parse(encryptedPrivateKey);
  const iv = jsonobject.iv;
  console.log(iv);
  const ciphertext = jsonobject.ciphertext;
  console.log(ciphertext);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToArrayBuffer(iv),
    },
    derivedKey,
    base64ToArrayBuffer(ciphertext),
  );
  return arrayBufferToBase64(decrypted);
}
export async function encryptSymKey(symKey, publicKey) {
  // Import the public key
  const importedPublicKey = await importPublicKey(publicKey);
  const symKeyArrayBuffer = await window.crypto.subtle.exportKey("raw", symKey);

  // Encrypt the symmetric key using RSA-OAEP
  const encryptedSymKey = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    importedPublicKey,
    symKeyArrayBuffer,
  );

  return arrayBufferToBase64(encryptedSymKey);
}
async function importKey(rawKeyBuffer) {
  const key = await crypto.subtle.importKey(
    "raw",
    rawKeyBuffer,
    {
      name: "AES-GCM",
    },
    true,
    ["encrypt", "decrypt"],
  );
  return key;
}

export async function decryptSymKey(base64EncryptedSymKey, encryptedPrivateKey, derivedKey) {
  const base64PrivateKey = await decryptPrivateKey(encryptedPrivateKey, derivedKey);
  const privateKey = await importPrivateKey(base64PrivateKey);
  const encryptedSymKeyArrayBuffer = base64ToArrayBuffer(base64EncryptedSymKey);
  const symKey = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    encryptedSymKeyArrayBuffer,
  );

  return await importKey(symKey);
  return new Uint8Array(symKey);
}

export async function encryptFileAndMetadata(file, metadata, symKey) {
  const fileBuffer = await file.arrayBuffer();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Generate a random IV

  // Encrypt the file content with the symmetric key
  const encryptedFileBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    symKey,
    fileBuffer,
  );

  // Convert metadata to a JSON string and then to an ArrayBuffer
  const metadataBuffer = new TextEncoder().encode(JSON.stringify(metadata));

  // Encrypt the metadata with the symmetric key
  const encryptedMetadataBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    symKey,
    metadataBuffer,
  );
  return {
    encryptedFile: arrayBufferToBase64(encryptedFileBuffer),
    encryptedMetadata: arrayBufferToBase64(encryptedMetadataBuffer),
    iv: arrayBufferToBase64(iv),
  };
}

export async function decryptFileAndMetadata(encryptedFile, encryptedMetadata, encryptedSymKey, iv, encryptedPrivateKey, derivedKey) {
  try {
    const symKey = await decryptSymKey(encryptedSymKey, encryptedPrivateKey, derivedKey);

    // Decrypt the file content
    const fileBuffer = encryptedFile; // arraybuffer
    const decryptedFileBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToArrayBuffer(iv),
      },
      symKey,
      fileBuffer,
    );

    // Decrypt the metadata
    const decryptedMetadataBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToArrayBuffer(iv),
      },
      symKey,
      base64ToArrayBuffer(encryptedMetadata),
    );
    const decryptedMetadataString = new TextDecoder().decode(decryptedMetadataBuffer);
    console.log(decryptedMetadataString);
    const metadata = JSON.parse(decryptedMetadataString);
    console.log(metadata);
    return {
      decryptedFile: new Blob([decryptedFileBuffer], { type: metadata.type }),
      metadata: metadata,
    }; // returns json
  } catch (error) {
    console.error("Error decrypting file and metadata:", error);
    throw error;
  }
}
export async function decryptMetadata(encryptedMetadata, encryptedSymKey, iv, encryptedPrivateKey, derivedKey) {
  try {
    const symKey = await decryptSymKey(encryptedSymKey, encryptedPrivateKey, derivedKey);

    // Decrypt the file content

    const decryptedMetadataBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToArrayBuffer(iv),
      },
      symKey,
      base64ToArrayBuffer(encryptedMetadata),
    );
    const decryptedMetadataString = new TextDecoder().decode(decryptedMetadataBuffer);
    const metadata = JSON.parse(decryptedMetadataString);
    return {
      metadata: metadata,
    }; // returns json
  } catch (error) {
    console.error("Error decrypting file and metadata:", error);
    throw error;
  }
}
