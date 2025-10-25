import { signInWithPopup, signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { auth, googleProvider } from "../firebase";

const Header = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      toast.success("Signed in successfully!");
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("Failed to sign in");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      toast.success("Signed out successfully!");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <header className="header">
      <h1>General Planner</h1>
      <div className="auth-section">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : user ? (
          <div className="user-info">
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="user-avatar"
            />
            <span className="user-name">{user.displayName}</span>
            <button className="btn-auth btn-signout" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        ) : (
          <button className="btn-auth btn-signin" onClick={handleGoogleSignIn}>
            <span>🔐</span> Sign in with Google
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
