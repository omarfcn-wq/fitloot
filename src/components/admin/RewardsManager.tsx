import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Reward } from "@/lib/supabase-types";
import type { UseMutationResult } from "@tanstack/react-query";

interface RewardsManagerProps {
  rewards: Reward[];
  isLoading: boolean;
  createReward: UseMutationResult<Reward, Error, Omit<Reward, "id" | "created_at" | "updated_at">>;
  updateReward: UseMutationResult<Reward, Error, Partial<Reward> & { id: string }>;
  deleteReward: UseMutationResult<void, Error, string>;
}

interface RewardFormData {
  name: string;
  description: string;
  credits_cost: number;
  category: string;
  image_url: string;
  stock: number | null;
  is_available: boolean;
}

const defaultFormData: RewardFormData = {
  name: "",
  description: "",
  credits_cost: 100,
  category: "general",
  image_url: "",
  stock: null,
  is_available: true,
};

export function RewardsManager({
  rewards,
  isLoading,
  createReward,
  updateReward,
  deleteReward,
}: RewardsManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState<RewardFormData>(defaultFormData);

  const handleOpenCreate = () => {
    setEditingReward(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description || "",
      credits_cost: reward.credits_cost,
      category: reward.category,
      image_url: reward.image_url || "",
      stock: reward.stock,
      is_available: reward.is_available,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (formData.credits_cost < 1) {
      toast.error("El costo debe ser al menos 1 crédito");
      return;
    }

    try {
      if (editingReward) {
        await updateReward.mutateAsync({
          id: editingReward.id,
          ...formData,
        });
        toast.success("Recompensa actualizada");
      } else {
        await createReward.mutateAsync(formData);
        toast.success("Recompensa creada");
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Error al guardar la recompensa");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta recompensa?")) return;

    try {
      await deleteReward.mutateAsync(id);
      toast.success("Recompensa eliminada");
    } catch (error) {
      toast.error("Error al eliminar la recompensa");
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Recompensas</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Recompensa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingReward ? "Editar Recompensa" : "Nueva Recompensa"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre de la recompensa"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción de la recompensa"
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credits_cost">Costo (créditos)</Label>
                  <Input
                    id="credits_cost"
                    type="number"
                    min={1}
                    value={formData.credits_cost}
                    onChange={(e) =>
                      setFormData({ ...formData, credits_cost: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock (vacío = ilimitado)</Label>
                  <Input
                    id="stock"
                    type="number"
                    min={0}
                    value={formData.stock ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="general, premium, etc."
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL de Imagen</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_available">Disponible</Label>
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_available: checked })
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createReward.isPending || updateReward.isPending}
              >
                {createReward.isPending || updateReward.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingReward ? (
                  "Actualizar"
                ) : (
                  "Crear"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rewards.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay recompensas creadas aún
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell className="font-medium">{reward.name}</TableCell>
                    <TableCell>{reward.category}</TableCell>
                    <TableCell className="text-right">{reward.credits_cost}</TableCell>
                    <TableCell className="text-right">
                      {reward.stock ?? "∞"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          reward.is_available
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {reward.is_available ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(reward)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(reward.id)}
                          disabled={deleteReward.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
