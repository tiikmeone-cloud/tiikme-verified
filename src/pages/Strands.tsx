import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** Legacy redirect: /app/strands → /app/connections */
const Strands = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate("/app/connections", { replace: true }); }, [navigate]);
  return null;
};

export default Strands;
