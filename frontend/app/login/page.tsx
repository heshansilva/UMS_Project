"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, AuthResponse } from "@/lib/api"; // Import AuthResponse
import { Database } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Free stock video from Pexels
  const videoUrl = "https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4";

  // This is the updated handleLogin function
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data: AuthResponse = await login({ Username: username, Password: password });
      
      // Save the token and role
      localStorage.setItem("ums_token", data.token);
      localStorage.setItem("ums_role", data.Role);

      // --- Smart Redirect Logic ---
      // Redirect based on the user's role
      switch (data.Role) {
        case "Admin":
        case "Manager":
          router.push("/dashboard"); // Admins/Managers go to the main dashboard
          break;
        case "BillingClerk":
          router.push("/dashboard/bills"); // Billers go to the Bills page
          break;
        case "FieldOfficer":
          router.push("/dashboard/meters"); // Field Officers go to the Meters page
          break;
          case "Customer":
          // Redirect the customer to their specific profile page
          router.push(`/dashboard/customers/${data.UserID}`);
          break;
        // ------------------------
        default:
          router.push("/login"); // Fallback to login
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Main container
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/70 z-10"></div>

      {/* Login Card */}
      <Card className="w-full max-w-sm bg-card border-border z-20 relative">
        <CardHeader className="items-center text-center">
          <Database className="h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-2xl font-bold text-foreground">
            Utility Management System
          </CardTitle>
          <CardDescription>
            Please log in to access the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <Button variant="link" asChild>
            <Link href="/" className="text-muted-foreground hover:text-primary">
              &larr; Back to Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
    </div>
  );
}