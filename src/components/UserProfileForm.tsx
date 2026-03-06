import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useProfile, ProfileUpdate } from "@/hooks/useProfile";
import { Loader2, User, Save } from "lucide-react";
import { toast } from "sonner";

const profileSchema = z.object({
  name: z.string().trim().max(100, "Máximo 100 caracteres").optional().or(z.literal("")),
  age: z.coerce.number().int().min(10, "Mínimo 10 años").max(120, "Máximo 120 años").optional().or(z.literal("")),
  weight_kg: z.coerce.number().min(20, "Mínimo 20 kg").max(300, "Máximo 300 kg").optional().or(z.literal("")),
  height_cm: z.coerce.number().min(100, "Mínimo 100 cm").max(250, "Máximo 250 cm").optional().or(z.literal("")),
  fitness_goal: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const fitnessGoals = [
  { value: "general", label: "Salud General" },
  { value: "weight_loss", label: "Perder Peso" },
  { value: "muscle_gain", label: "Ganar Músculo" },
  { value: "endurance", label: "Resistencia" },
  { value: "flexibility", label: "Flexibilidad" },
  { value: "performance", label: "Rendimiento Deportivo" },
];

export function UserProfileForm() {
  const { profile, isLoading, updateProfile } = useProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      age: "",
      weight_kg: "",
      height_cm: "",
      fitness_goal: "general",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name ?? "",
        age: profile.age ?? "",
        weight_kg: profile.weight_kg ?? "",
        height_cm: profile.height_cm ?? "",
        fitness_goal: profile.fitness_goal ?? "general",
      });
    }
  }, [profile, form]);

  const onSubmit = (values: ProfileFormValues) => {
    const updates: ProfileUpdate = {
      name: values.name || null,
      age: values.age === "" ? null : Number(values.age),
      weight_kg: values.weight_kg === "" ? null : Number(values.weight_kg),
      height_cm: values.height_cm === "" ? null : Number(values.height_cm),
      fitness_goal: values.fitness_goal || "general",
    };

    updateProfile.mutate(updates, {
      onSuccess: () => toast.success("Perfil actualizado correctamente ✅"),
      onError: () => toast.error("Error al actualizar el perfil"),
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <User className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Perfil Personal</CardTitle>
            <CardDescription>
              Tus datos básicos para personalizar la experiencia fitness
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Edad</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="25" {...field} />
                    </FormControl>
                    <FormDescription>Años</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="70" {...field} />
                    </FormControl>
                    <FormDescription>Kilogramos</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height_cm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Altura</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="170" {...field} />
                    </FormControl>
                    <FormDescription>Centímetros</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fitness_goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo Fitness</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu objetivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fitnessGoals.map((goal) => (
                        <SelectItem key={goal.value} value={goal.value}>
                          {goal.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={updateProfile.isPending}
              className="gap-2"
            >
              {updateProfile.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar Perfil
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
