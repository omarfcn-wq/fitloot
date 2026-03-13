import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { CreditDisplay } from "./CreditDisplay";
import { LevelBadge } from "./LevelBadge";
import { NotificationBell } from "./notifications/NotificationBell";
import { WearableQuickConnect } from "./WearableQuickConnect";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAchievements } from "@/hooks/useAchievements";
import { useI18n } from "@/i18n";
import { LogOut, Menu, Settings, ShieldAlert, Trophy, BarChart3, History, UserPlus, CalendarDays, Heart, Dumbbell } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
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
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { levelInfo } = useAchievements();
  const { t } = useI18n();

  const displayName = profile?.name || user?.email?.split("@")[0] || "Usuario";

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

  const navItems = [
    { to: "/dashboard", label: t("nav_dashboard") },
    { to: "/weekly", label: t("nav_weekly"), icon: CalendarDays },
    { to: "/fitness", label: t("nav_fitness"), icon: Heart },
    { to: "/rewards", label: t("nav_rewards") },
    { to: "/achievements", label: t("nav_achievements"), icon: Trophy },
    { to: "/history", label: t("nav_history"), icon: History },
    { to: "/routines", label: t("nav_routines"), icon: Dumbbell },
    { to: "/referrals", label: t("nav_referrals"), icon: UserPlus },
  ];

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
                {navItems.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to}>
                    <Button variant="ghost" size="sm" className={Icon ? "gap-2" : ""}>
                      {Icon && <Icon className="h-4 w-4" />}
                      {label}
                    </Button>
                  </Link>
                ))}
                {isAdmin && (
                  <>
                    <Link to="/analytics">
                      <Button variant="ghost" size="sm" className="gap-2 text-primary">
                        <BarChart3 className="h-4 w-4" />
                        {t("nav_analytics")}
                      </Button>
                    </Link>
                    <Link to="/admin">
                      <Button variant="ghost" size="sm" className="gap-2 text-primary">
                        <ShieldAlert className="h-4 w-4" />
                        Admin
                      </Button>
                    </Link>
                  </>
                )}
              </div>
              <WearableQuickConnect variant="icon" />
              <NotificationBell />
              <LevelBadge
                level={levelInfo.level}
                currentXP={levelInfo.currentLevelXP}
                nextLevelXP={levelInfo.nextLevelXP}
                compact
              />
              <CreditDisplay />
              <LanguageSwitcher />
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border">
                  {navItems.map(({ to, label, icon: Icon }) => (
                    <DropdownMenuItem key={to} className="sm:hidden" onClick={() => navigate(to)}>
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      {label}
                    </DropdownMenuItem>
                  ))}
                  {isAdmin && (
                    <>
                      <DropdownMenuItem className="sm:hidden" onClick={() => navigate("/analytics")}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        {t("nav_analytics")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="sm:hidden" onClick={() => navigate("/admin")}>
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        {t("nav_admin")}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    {displayName}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("sign_out")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex gap-2 items-center">
              <LanguageSwitcher />
              <ThemeToggle />
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  {t("sign_in")}
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button size="sm" className="glow-green">
                  {t("sign_up")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
