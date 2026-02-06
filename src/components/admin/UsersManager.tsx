import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, ShieldOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { UserWithStats } from "@/hooks/useAdmin";
import type { UseMutationResult } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface UsersManagerProps {
  users: UserWithStats[];
  isLoading: boolean;
  toggleAdminRole: UseMutationResult<void, Error, { userId: string; makeAdmin: boolean }>;
}

export function UsersManager({ users, isLoading, toggleAdminRole }: UsersManagerProps) {
  const { user: currentUser } = useAuth();

  const handleToggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    if (userId === currentUser?.id) {
      toast.error("No puedes modificar tu propio rol");
      return;
    }

    const action = currentlyAdmin ? "quitar privilegios de admin a" : "hacer admin a";
    if (!confirm(`¿Estás seguro de ${action} este usuario?`)) return;

    try {
      await toggleAdminRole.mutateAsync({ userId, makeAdmin: !currentlyAdmin });
      toast.success(currentlyAdmin ? "Privilegios de admin removidos" : "Usuario promovido a admin");
    } catch (error) {
      toast.error("Error al modificar el rol");
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Gestión de Usuarios</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay usuarios registrados
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Actividades</TableHead>
                  <TableHead className="text-right">Créditos Ganados</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">
                      {user.id.slice(0, 8)}...
                      {user.id === currentUser?.id && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Tú
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.is_admin ? "default" : "secondary"}
                        className={user.is_admin ? "bg-primary/20 text-primary" : ""}
                      >
                        {user.is_admin ? "Admin" : "Usuario"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {user.balance}
                    </TableCell>
                    <TableCell className="text-right">{user.total_activities}</TableCell>
                    <TableCell className="text-right">{user.total_credits_earned}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(user.created_at).toLocaleDateString("es-ES")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                        disabled={toggleAdminRole.isPending || user.id === currentUser?.id}
                        className="gap-2"
                      >
                        {user.is_admin ? (
                          <>
                            <ShieldOff className="h-4 w-4" />
                            <span className="hidden sm:inline">Quitar Admin</span>
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4" />
                            <span className="hidden sm:inline">Hacer Admin</span>
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
