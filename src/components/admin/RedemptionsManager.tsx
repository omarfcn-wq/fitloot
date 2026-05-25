import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface RedemptionRow {
  id: string;
  user_id: string;
  reward_id: string | null;
  credits_spent: number;
  status: string;
  redeemed_at: string;
  delivery_code: string | null;
  delivery_notes: string | null;
  delivered_at: string | null;
  rewards: { name: string; category: string } | null;
}

export function RedemptionsManager() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<RedemptionRow | null>(null);
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");

  const { data: redemptions, isLoading } = useQuery({
    queryKey: ["admin-redemptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("redemptions")
        .select("*, rewards(name, category)")
        .order("redeemed_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as unknown as RedemptionRow[];
    },
  });

  const deliver = useMutation({
    mutationFn: async ({ id, code, notes }: { id: string; code: string; notes: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("redemptions")
        .update({
          delivery_code: code,
          delivery_notes: notes || null,
          delivered_at: new Date().toISOString(),
          delivered_by: userData.user?.id,
          status: "delivered",
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-redemptions"] });
      toast.success("Código entregado");
      setSelected(null);
      setCode("");
      setNotes("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleOpen = (r: RedemptionRow) => {
    setSelected(r);
    setCode(r.delivery_code ?? "");
    setNotes(r.delivery_notes ?? "");
  };

  const pendingCount = redemptions?.filter((r) => !r.delivered_at).length ?? 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Canjes ({pendingCount} pendientes)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !redemptions || redemptions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Sin canjes aún</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recompensa</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="text-right">Créditos</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptions.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.rewards?.name ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.user_id.slice(0, 8)}…
                    </TableCell>
                    <TableCell className="text-right">{r.credits_spent}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.redeemed_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell>
                      {r.delivered_at ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Entregado
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          Pendiente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={r.delivered_at ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleOpen(r)}
                        className="gap-2"
                      >
                        <Send className="h-3 w-3" />
                        {r.delivered_at ? "Ver" : "Entregar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Entregar: {selected?.rewards?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Usuario: <code className="text-xs">{selected?.user_id}</code>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código / Link de la gift card</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instrucciones de canje, etc."
                />
              </div>
              <Button
                className="w-full"
                disabled={!code.trim() || deliver.isPending}
                onClick={() =>
                  selected && deliver.mutate({ id: selected.id, code, notes })
                }
              >
                {deliver.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Guardar y marcar como entregado"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
