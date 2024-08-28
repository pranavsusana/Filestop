const crypto = require("crypto");
const fs = require("fs");

function arrayBufferToBase64(buffer) {
  return Buffer.from(buffer).toString("base64");
}

async function generateKeyPair() {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      "rsa",
      {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: "spki",
          format: "pem",
        },
        privateKeyEncoding: {
          type: "pkcs8",
          format: "pem",
        },
      },
      (err, publicKey, privateKey) => {
        if (err) reject(err);
        else resolve({ publicKey, privateKey });
      },
    );
  });
}

async function encryptSymmetricKey(symKey, publicKey) {
  const encryptedSymKey = crypto.publicEncrypt(publicKey, symKey);
  return encryptedSymKey;
}

async function encryptFile(filePath, publicKey) {
  const fileBuffer = fs.readFileSync(filePath);
  const symKey = crypto.randomBytes(32); // Generate a random symmetric key
  const iv = crypto.randomBytes(12); // Generate a random IV

  const cipher = crypto.createCipheriv("aes-256-gcm", symKey, iv);
  const encryptedFileBuffer = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const encryptedSymKey = await encryptSymmetricKey(symKey, publicKey);

  return {
    encryptedFile: encryptedFileBuffer,
    encryptedSymKey: arrayBufferToBase64(encryptedSymKey),
    iv: arrayBufferToBase64(iv),
    authTag: arrayBufferToBase64(authTag),
  };
}

async function main() {
  const filePath = "test_file.mkv"; // Change this to the file you want to encrypt
  const { publicKey, privateKey } = await generateKeyPair();

  const { encryptedFile, encryptedSymKey, iv, authTag } = await encryptFile(filePath, publicKey);

  fs.writeFileSync("encrypted_" + filePath, encryptedFile);

  const result = {
    publicKey,
    privateKey,
    encryptedSymKey,
    iv,
    authTag,
  };

  fs.writeFileSync("result.txt", JSON.stringify(result, null, 2));
  console.log("Encryption complete. Keys and encrypted file saved.");
}

main().catch(console.error);
