import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Database } from "lucide-react"; // Use a familiar icon

export default function Home() {
  // Free stock video from Pexels
  const videoUrl = "https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4";

  return (
    // 1. Make the main container relative and remove padding
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      
      {/* 2. Add the background video */}
      <video
        autoPlay
        loop
        muted
        playsInline // Ensures it plays on mobile devices
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* 3. Add a dark overlay for readability */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/70 z-10"></div>

      {/* 4. Make the Card relative and bring it to the front */}
      <Card className="w-full max-w-md bg-card border-border z-20 relative">
        <CardHeader className="items-center text-center">
          <Database className="h-12 w-12 text-primary mb-4" />
          
          <CardTitle className="text-3xl font-bold text-foreground">
            Utility Management System
          </CardTitle>
          <CardDescription className="pt-2">
            Welcome. Please log in to access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" size="lg">
            <Link href="/login">Login</Link>
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Utility Management System. All rights reserved.
          </p>
        </CardFooter>
      </Card>
      
    </div>
  );
}