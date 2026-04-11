import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const JoinRedirect = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("tiikme-referrer", ref);
    }
    navigate("/signup", { replace: true });
  }, [navigate, params]);

  return null;
};

export default JoinRedirect;
