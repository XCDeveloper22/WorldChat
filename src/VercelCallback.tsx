import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function VercelCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Here we could extract parameters from the URL if needed
        // const searchParams = new URLSearchParams(location.search);
        
        // Let's get the token from our backend which calls getToken()
        const res = await fetch("/api/auth/vercel-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // Store vercel integration token if needed for gmail access
        localStorage.setItem("vercel_access_token", data.accessToken);
        
        // For the chat to work, we need a generic user token/data
        // For demonstration, we'll create a generic user based on the fixed usr_123 ID
        const userId = "usr_123";
        localStorage.setItem("auth_token", userId);
        localStorage.setItem("user_data", JSON.stringify({
          id: userId,
          name: "Vercel User",
          email: "user@vercel.demo",
          avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=VercelUser`
        }));
        
        navigate("/chat");
      } catch (err: any) {
        console.error(err);
        setError("Failed to complete authentication. Redirecting...");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [navigate, location]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-50 font-sans">
      <div className="flex flex-col items-center gap-4">
        {error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <p className="text-sm font-medium tracking-wide text-zinc-400">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  );
}
