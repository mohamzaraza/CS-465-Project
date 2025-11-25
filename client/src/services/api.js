const API_URL = "http://localhost:5000";

export async function testConnection() {
  try {
    const response = await fetch(API_URL + "/api/test");
    return await response.text();
  } catch (error) {
    return "Error connecting to backend";
  }
}