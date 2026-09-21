import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const homePath = user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <p className="text-[7rem] font-extrabold leading-none tracking-tighter text-border-strong select-none mb-2">
          404
        </p>
        <h1 className="text-xl font-bold text-foreground mb-2">Page not found</h1>
        <p className="text-sm text-foreground-muted mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Go Back
          </Button>
          <Link to={homePath}>
            <Button size="sm">
              <Home className="h-3.5 w-3.5 mr-1.5" />
              {user?.role === "admin" ? "Admin Dashboard" : "Dashboard"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
