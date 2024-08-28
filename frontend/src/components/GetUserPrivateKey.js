import { axiosInstance } from "../utils/axiosRequest";
export async function getPrivateKey(username) {
  try {
    const response = await axiosInstance.get(`/privatekey/${username}`);
    if (response.status === 200 && response.data && response.data.private_key) {
      return response.data.private_key;
    } else {
      throw new Error("Failed to fetch the encrypted private key");
    }
  } catch (error) {
    throw error;
  }
}
