import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { CreditDisplay } from "./CreditDisplay";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Menu, Settings, ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
 
export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin-nav", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/">
          <Logo size="sm" />
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-4">
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Link to="/rewards">
                  <Button variant="ghost" size="sm">
                    Recompensas
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="gap-2 text-primary">
                      <ShieldAlert className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
              </div>
              <CreditDisplay />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="sm:hidden" onClick={() => navigate("/dashboard")}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem className="sm:hidden" onClick={() => navigate("/rewards")}>
                    Recompensas
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem className="sm:hidden" onClick={() => navigate("/admin")}>
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Panel Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex gap-2">
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Iniciar sesión
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button size="sm" className="glow-green">
                  Registrarse
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}