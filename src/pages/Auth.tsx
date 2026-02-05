 import { useState, useEffect } from "react";
 import { useNavigate, useSearchParams } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
 import { Logo } from "@/components/Logo";
 import { useAuth } from "@/hooks/useAuth";
 import { toast } from "sonner";
 import { Loader2 } from "lucide-react";
 import { z } from "zod";
 
 const authSchema = z.object({
   email: z.string().email("Email inválido").max(255),
   password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(72),
 });
 
 export default function Auth() {
   const [searchParams] = useSearchParams();
   const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [loading, setLoading] = useState(false);
   const { user, signIn, signUp } = useAuth();
   const navigate = useNavigate();
 
   useEffect(() => {
     if (user) {
       navigate("/dashboard");
     }
   }, [user, navigate]);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     const validation = authSchema.safeParse({ email, password });
     if (!validation.success) {
       toast.error(validation.error.errors[0].message);
       return;
     }
     
     setLoading(true);
 
     try {
       if (isSignUp) {
         const { error } = await signUp(email, password);
         if (error) {
           toast.error(error.message);
         } else {
           toast.success("¡Revisa tu email para confirmar tu cuenta!");
         }
       } else {
         const { error } = await signIn(email, password);
         if (error) {
           toast.error(error.message);
         } else {
           toast.success("¡Bienvenido de vuelta!");
           navigate("/dashboard");
         }
       }
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <div className="min-h-screen flex items-center justify-center bg-background p-4">
       <Card className="w-full max-w-md">
         <CardHeader className="text-center">
           <div className="flex justify-center mb-4">
             <Logo />
           </div>
           <CardTitle>{isSignUp ? "Crear Cuenta" : "Iniciar Sesión"}</CardTitle>
           <CardDescription>
             {isSignUp 
               ? "Únete y empieza a ganar recompensas" 
               : "Ingresa para continuar tu progreso"}
           </CardDescription>
         </CardHeader>
         <form onSubmit={handleSubmit}>
           <CardContent className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="email">Email</Label>
               <Input
                 id="email"
                 type="email"
                 placeholder="tu@email.com"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="password">Contraseña</Label>
               <Input
                 id="password"
                 type="password"
                 placeholder="••••••••"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 required
               />
             </div>
           </CardContent>
           <CardFooter className="flex flex-col gap-4">
             <Button type="submit" className="w-full glow-green" disabled={loading}>
               {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               {isSignUp ? "Crear Cuenta" : "Iniciar Sesión"}
             </Button>
             <Button
               type="button"
               variant="link"
               className="text-muted-foreground"
               onClick={() => setIsSignUp(!isSignUp)}
             >
               {isSignUp 
                 ? "¿Ya tienes cuenta? Inicia sesión" 
                 : "¿No tienes cuenta? Regístrate"}
             </Button>
           </CardFooter>
         </form>
       </Card>
     </div>
   );
 }