import { createContext, useContext, useEffect, useState } from "react";
import { UserData } from "./user-info-types";
import { buildAuthUrl, fetchUserData } from "./auth-service";
import axios from "axios";

type AuthContextType = {
  isLoggedIn: boolean;
  userData: UserData | null;
  username: string | null;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const username = userData ? userData.name : null;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetchUserData(token)
        .then((data) => {
          setUserData(data);
          setIsLoggedIn(true);
          setAuthLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch user data:", err);
          logout();
          setAuthLoading(false);
        });
    } else {
      setAuthLoading(false);
    }
  }, []);

  const login = async () => {
    try {
      const response = await axios.get("/get-csrf-token");
      const csrfToken = response.data.csrfToken;
      const authUrl = buildAuthUrl(csrfToken);
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error fetching CSRF token or building auth URL:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setIsLoggedIn(false);
    setUserData(null);
    setAuthLoading(true);
    window.location.href = "/profile";
    window.dispatchEvent(new CustomEvent("authUpdate"));
  };

  if (authLoading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, userData, username, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
