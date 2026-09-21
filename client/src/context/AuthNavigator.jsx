import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";

// AuthProvider lives above <Router>, so it cannot navigate on its own. This
// renders nothing; it only hands the router's navigate to the provider so a
// 401 mid-session can send the user to /login without a full page reload.
export default function AuthNavigator() {
  const navigate = useNavigate();
  const { registerNavigate } = useAuth();

  useEffect(() => {
    registerNavigate(navigate);
    return () => registerNavigate(null);
  }, [navigate, registerNavigate]);

  return null;
}
