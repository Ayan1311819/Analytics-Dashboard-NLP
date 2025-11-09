import axios from "axios";

const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

const fetcher = async (url: string) => {
  const res = await axios.get(`${base}${url}`);
  return res.data;
};

export default fetcher;
