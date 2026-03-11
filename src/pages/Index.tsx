 import { Link } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Logo } from "@/components/Logo";
 import { Navbar } from "@/components/Navbar";
 import { 
   Dumbbell, 
   Coins, 
   Gamepad2, 
   Watch, 
   Gift,
   ArrowRight,
   Zap
 } from "lucide-react";
 
 export default function Index() {
   const features = [
     {
       icon: Dumbbell,
       title: "Haz Ejercicio",
       description: "Completa rutinas de ejercicio verificadas por tu dispositivo",
     },
     {
       icon: Coins,
       title: "Gana Créditos",
       description: "Cada minuto de actividad se convierte en créditos canjeables",
     },
     {
       icon: Gift,
       title: "Canjea Recompensas",
       description: "Usa tus créditos en skins, pases de batalla y más",
     },
   ];
 
   const stats = [
     { value: "2x", label: "Créditos por minuto" },
     { value: "100+", label: "Recompensas disponibles" },
     { value: "24/7", label: "Sincronización automática" },
   ];
 
   return (
     <div className="min-h-screen bg-background">
       <Navbar />
       
       {/* Hero Section */}
       <section className="pt-24 pb-16 px-4">
         <div className="container mx-auto max-w-6xl">
           <div className="text-center space-y-6">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm">
               <Zap className="h-4 w-4" />
               Gamificación Saludable
             </div>
             
             <div className="flex justify-center mb-8">
               <Logo size="lg" />
             </div>
             
             <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
               Transforma tu{" "}
               <span className="text-primary text-glow-green">ejercicio</span>
               <br />
               en{" "}
               <span className="text-secondary">recompensas gaming</span>
             </h1>
             
             <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
               Conecta tu reloj inteligente, completa rutinas de ejercicio y gana créditos 
               canjeables por skins, pases de batalla y juegos.
             </p>
             
             <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
               <Link to="/auth?mode=signup">
                 <Button size="lg" className="glow-green text-lg px-8 gap-2">
                   Empezar Gratis
                   <ArrowRight className="h-5 w-5" />
                 </Button>
               </Link>
               <Link to="/rewards">
                 <Button size="lg" variant="outline" className="text-lg px-8">
                   Ver Recompensas
                 </Button>
               </Link>
             </div>
           </div>
           
           {/* Stats */}
           <div className="grid grid-cols-3 gap-4 mt-16 max-w-xl mx-auto">
             {stats.map((stat, i) => (
               <div key={i} className="text-center">
                 <p className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
                 <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
               </div>
             ))}
           </div>
         </div>
       </section>
       
       {/* Features Section */}
       <section className="py-16 px-4 bg-muted/30">
         <div className="container mx-auto max-w-6xl">
           <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
             ¿Cómo funciona?
           </h2>
           
           <div className="grid md:grid-cols-3 gap-8">
             {features.map((feature, i) => (
               <div 
                 key={i} 
                 className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all group"
               >
                 <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:glow-green transition-all">
                   <feature.icon className="h-7 w-7 text-primary" />
                 </div>
                 <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                 <p className="text-muted-foreground">{feature.description}</p>
               </div>
             ))}
           </div>
         </div>
       </section>
       
       {/* Devices Section */}
       <section className="py-16 px-4">
         <div className="container mx-auto max-w-6xl text-center">
           <h2 className="text-3xl font-bold mb-4 text-foreground">
             Compatible con tus dispositivos
           </h2>
           <p className="text-muted-foreground mb-8">
             Sincroniza automáticamente con tus wearables favoritos
           </p>
           
           <div className="flex flex-wrap justify-center gap-8 opacity-60">
             <div className="flex items-center gap-2 text-muted-foreground">
               <Watch className="h-8 w-8" />
               <span>Apple Watch</span>
             </div>
             <div className="flex items-center gap-2 text-muted-foreground">
               <Watch className="h-8 w-8" />
               <span>Fitbit</span>
             </div>
             <div className="flex items-center gap-2 text-muted-foreground">
               <Watch className="h-8 w-8" />
               <span>Garmin</span>
             </div>
             <div className="flex items-center gap-2 text-muted-foreground">
               <Watch className="h-8 w-8" />
               <span>Samsung Health</span>
             </div>
           </div>
         </div>
       </section>
       
       {/* CTA Section */}
       <section className="py-16 px-4">
         <div className="container mx-auto max-w-4xl">
           <div className="p-8 md:p-12 rounded-3xl gradient-gaming text-center">
             <Gamepad2 className="h-12 w-12 mx-auto mb-4 text-background animate-float" />
             <h2 className="text-3xl font-bold mb-4 text-background">
               ¿Listo para subir de nivel?
             </h2>
             <p className="text-background/80 mb-6 max-w-xl mx-auto">
               Únete a miles de gamers que están transformando su salud en recompensas épicas.
             </p>
             <Link to="/auth?mode=signup">
               <Button size="lg" variant="secondary" className="text-lg px-8">
                 Crear Cuenta Gratis
               </Button>
             </Link>
           </div>
         </div>
       </section>
       
       {/* Footer */}
        <footer className="py-8 px-4 border-t border-border">
          <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Política de Privacidad
              </Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Condiciones del Servicio
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 FitLoot. Gamificación saludable.
            </p>
          </div>
        </footer>
     </div>
   );
 }