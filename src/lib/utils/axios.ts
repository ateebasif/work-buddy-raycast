import axios from "axios";

const BASE_URL_Local = "http://localhost:4000/api";

const instance = axios.create({
  baseURL: BASE_URL_Local,
  headers: { "Content-Type": "application/json" },
});

export default instance;
