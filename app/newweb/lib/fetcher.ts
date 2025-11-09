import axios from "axios";

const base = "https://a-backend-jhdl.onrender.com" ;

const fetcher = async (url: string) => {
  const res = await axios.get(`${base}${url}`);
  return res.data;
};

export default fetcher;
