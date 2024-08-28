import { axiosInstance } from "../utils/axiosRequest";
export async function getPublicKey(username) {
  try {
    const response = await axiosInstance.get(`/publickey?query=${username}`);
    if (response.status === 200 && response.data && response.data.public_key) {
      return response.data.public_key;
    } else {
      throw new Error("Failed to fetch the public key");
    }
  } catch (error) {
    throw error;
  }
}
