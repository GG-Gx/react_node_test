/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the application.
 * Implements JWT-based authentication with secure storage and proper state management.
 *
 * Features:
 * - User authentication state management
 * - Login/logout functionality
 * - Token persistence
 * - Role-based access control support
 *
 * @author Senior Full-Stack Engineer
 * @version 1.0.0
 */

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";

// Create the authentication context
const AuthContext = createContext();

/**
 * Custom hook to use the authentication context
 * @returns {Object} Authentication context values and methods
 */
export const useAuth = () => {
  return useContext(AuthContext);
};

/**
 * Authentication Provider Component
 * Manages authentication state and provides methods to login, logout, etc.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
const AuthProvider = ({ children }) => {
  /**
   * Initialize user state from localStorage if available
   * This ensures authentication persists across page refreshes
   */
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");

    return token && email ? { email } : null;
  });

  const [loading, setLoading] = useState(true);

  /**
   * Generate a mock JWT token for demonstration
   * In a real app, this would come from the server
   *
   * @returns {string} Mock JWT token
   */
  const generateMockToken = () => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        sub: Date.now().toString(),
        exp: Date.now() + 3600000,
        iat: Date.now(),
      })
    );
    const signature = btoa(
      "mock_signature_" + Math.random().toString(36).substr(2, 9)
    );
    return `${header}.${payload}.${signature}`;
  };

  /**
   * Get user's IP address (mock implementation)
   * In a real app, this would be provided by the server
   *
   * @returns {string} Mock IP address
   */
  const getMockIpAddress = () => {
    // Generate a mock IP address for demonstration
    return `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
  };

  /**
   * Log user activity to localStorage
   *
   * @param {string} userId - User ID
   * @param {string} username - User email/username
   * @param {string} role - User role
   * @param {string} action - Action performed ('login' or 'logout')
   * @param {string} tokenName - JWT token (for login)
   */
  const logUserActivity = useCallback(
    (userId, username, role, action, tokenName = null) => {
      try {
        // Get existing logs or initialize empty array
        const existingLogs = JSON.parse(
          localStorage.getItem("userLogs") || "[]"
        );

        // Create new log entry
        const newLog = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          userId,
          username,
          role,
          action,
          loginTime: action === "login" ? new Date().toISOString() : null,
          logoutTime: action === "logout" ? new Date().toISOString() : null,
          ipAddress: getMockIpAddress(),
          tokenName: tokenName || "N/A",
        };

        // If this is a logout, try to update the corresponding login log
        if (action === "logout") {
          const loginLogIndex = existingLogs.findIndex(
            (log) =>
              log.userId === userId && log.action === "login" && !log.logoutTime
          );

          if (loginLogIndex !== -1) {
            // Update the existing login log with logout time
            existingLogs[loginLogIndex].logoutTime = new Date().toISOString();
            existingLogs[loginLogIndex].action = "logout";
          } else {
            // If no matching login log found, create a new logout log
            existingLogs.push(newLog);
          }
        } else {
          // For login actions, always add a new log
          existingLogs.push(newLog);
        }

        // Keep only the last 100 logs to prevent excessive storage usage
        const recentLogs = existingLogs.slice(-100);

        // Save updated logs
        localStorage.setItem("userLogs", JSON.stringify(recentLogs));

        console.log(`User activity logged: ${action} for ${username}`);
      } catch (error) {
        console.error("Failed to log user activity:", error);
      }
    },
    []
  );

  /**
   * Handles user logout
   * Clears authentication data and resets state
   */
  const handleLogout = useCallback(() => {
    try {
      // Get current user data for logging before clearing
      const userId = localStorage.getItem("userId");
      const email = localStorage.getItem("email");
      const role = localStorage.getItem("userRole");

      // Log the logout activity if user data exists
      if (userId && email && role) {
        logUserActivity(userId, email, role, "logout");
      }

      // Clear all auth-related data from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      localStorage.removeItem("email");

      // Reset user state
      setUser(null);

      console.log("User logged out");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logging fails, we should still clear the auth data
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      localStorage.removeItem("email");
      setUser(null);
    }
  }, [logUserActivity]);

  /**
   * Effect to check token validity on mount
   * In a production app, this would verify the token with the backend
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");

        if (token) {
          // In a real app, we would validate the token with the server
          // For this demo, we'll just check if it exists
          const email = localStorage.getItem("email");

          if (email) {
            setUser({ email });
          } else {
            // If email is missing but token exists, something is wrong
            // Clear authentication data
            handleLogout();
          }
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [handleLogout]);

  /**
   * Handles user login
   * @param {string} email - User's email
   * @param {string} password - User's password (not used in mock implementation)
   * @returns {Promise<Object>} User data
   */
  const login = async (email, _password) => {
    try {
      // In a real app, this would make an API call
      // For this demo, we just update the state

      // Generate mock token and user data
      const token = generateMockToken();
      const userId = email.includes("admin")
        ? "admin-" + Date.now()
        : "user-" + Date.now();
      const role = email.includes("admin") ? "admin" : "user";

      // Store authentication data
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", role);
      localStorage.setItem("userId", userId);
      localStorage.setItem("email", email);

      // Update state
      setUser({ email, userId, role });

      // Log the login activity
      logUserActivity(
        userId,
        email,
        role,
        "login",
        token.substring(0, 20) + "..."
      );

      return { email, userId, role };
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  /**
   * Handles user signup
   * @param {string} email - User's email
   * @param {string} password - User's password (not used in mock implementation)
   * @returns {Promise<Object>} User data
   */
  const signup = async (email, _password) => {
    try {
      // In a real app, this would make an API call
      // For this demo, we just update the state

      // Generate mock token and user data
      const token = generateMockToken();
      const userId = "user-" + Date.now();
      const role = "user"; // New signups are regular users by default

      // Store authentication data
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", role);
      localStorage.setItem("userId", userId);
      localStorage.setItem("email", email);

      // Update state
      setUser({ email, userId, role });

      // Log the signup activity as a login
      logUserActivity(
        userId,
        email,
        role,
        "login",
        token.substring(0, 20) + "..."
      );

      return { email, userId, role };
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    }
  };

  /**
   * Handles password reset request
   * @param {string} email - User's email
   * @returns {Promise<void>}
   */
  const resetPassword = async (email) => {
    // In a real app, this would make an API call
    console.log("Password reset requested for:", email);
    return Promise.resolve();
  };

  /**
   * Checks if the current user has a specific role
   * @param {string} requiredRole - Role to check for
   * @returns {boolean} Whether user has the required role
   */
  const hasRole = (requiredRole) => {
    const userRole = localStorage.getItem("userRole");
    return userRole === requiredRole;
  };

  /**
   * Context value with authentication state and methods
   */
  const value = {
    user,
    loading,
    login,
    signup,
    logout: handleLogout,
    resetPassword,
    hasRole,
    isAdmin: () => hasRole("admin"),
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
