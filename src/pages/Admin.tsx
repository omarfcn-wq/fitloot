import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminStats } from "@/components/admin/AdminStats";
import { RewardsManager } from "@/components/admin/RewardsManager";
import { UsersManager } from "@/components/admin/UsersManager";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Loader2, BarChart3, Gift, Users, ShieldAlert } from "lucide-react";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const {
    isAdmin,
    isCheckingAdmin,
    stats,
    isLoadingStats,
    rewards,
    isLoadingRewards,
    createReward,
    updateReward,
    deleteReward,
    users,
    isLoadingUsers,
    toggleAdminRole,
  } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!isCheckingAdmin && !isAdmin && user) {
      navigate("/dashboard");
    }
  }, [isAdmin, isCheckingAdmin, user, navigate]);

  if (authLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold text-foreground">Acceso Denegado</h1>
        <p className="text-muted-foreground">No tienes permisos de administrador</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-primary" />
            Panel de Administración
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona recompensas, usuarios y visualiza estadísticas
          </p>
        </div>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Estadísticas</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-2">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Recompensas</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuarios</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            {isLoadingStats || !stats ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <AdminStats stats={stats} />
            )}
          </TabsContent>

          <TabsContent value="rewards">
            <RewardsManager
              rewards={rewards}
              isLoading={isLoadingRewards}
              createReward={createReward}
              updateReward={updateReward}
              deleteReward={deleteReward}
            />
          </TabsContent>

          <TabsContent value="users">
            <UsersManager
              users={users}
              isLoading={isLoadingUsers}
              toggleAdminRole={toggleAdminRole}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
