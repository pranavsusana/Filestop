const crypto = require("crypto");
const fs = require("fs");

function base64ToArrayBuffer(base64) {
  return Buffer.from(base64, "base64");
}

async function decryptSymmetricKey(encryptedSymKey, privateKey) {
  const symKey = crypto.privateDecrypt(privateKey, encryptedSymKey);
  return symKey;
}

async function decryptFile(encryptedFilePath, encryptedSymKey, iv, authTag, privateKey) {
  const encryptedFileBuffer = fs.readFileSync(encryptedFilePath);
  const symKey = await decryptSymmetricKey(base64ToArrayBuffer(encryptedSymKey), privateKey);

  const decipher = crypto.createDecipheriv("aes-256-gcm", symKey, base64ToArrayBuffer(iv));
  decipher.setAuthTag(base64ToArrayBuffer(authTag));
  const decryptedFileBuffer = Buffer.concat([decipher.update(encryptedFileBuffer), decipher.final()]);

  return decryptedFileBuffer;
}

async function main() {
  const encryptedFilePath = "encrypted_test_file.mkv"; // Change this to the encrypted file path
  const result = JSON.parse(fs.readFileSync("result.txt", "utf8"));

  const decryptedFileBuffer = await decryptFile(encryptedFilePath, result.encryptedSymKey, result.iv, result.authTag, result.privateKey);

  fs.writeFileSync("decrypted_test_file", decryptedFileBuffer);
  console.log("Decryption complete. Decrypted file saved.");
}

main().catch(console.error);
