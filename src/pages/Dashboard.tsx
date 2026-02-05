 import { useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Navbar } from "@/components/Navbar";
 import { LogActivityDialog } from "@/components/LogActivityDialog";
 import { ActivityCard } from "@/components/ActivityCard";
 import { useAuth } from "@/hooks/useAuth";
 import { useCredits } from "@/hooks/useCredits";
 import { useActivities } from "@/hooks/useActivities";
 import { Coins, TrendingUp, Clock, Target, Loader2 } from "lucide-react";
 
 export default function Dashboard() {
   const { user, loading: authLoading } = useAuth();
   const { credits, isLoading: creditsLoading } = useCredits();
   const { activities, isLoading: activitiesLoading, totalCreditsEarned } = useActivities();
   const navigate = useNavigate();
 
   useEffect(() => {
     if (!authLoading && !user) {
       navigate("/auth");
     }
   }, [user, authLoading, navigate]);
 
   if (authLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   const totalMinutes = activities.reduce((sum, a) => sum + a.duration_minutes, 0);
 
   const stats = [
     {
       title: "Créditos Disponibles",
       value: creditsLoading ? "..." : credits.toLocaleString(),
       icon: Coins,
       color: "text-primary",
     },
     {
       title: "Créditos Ganados",
       value: totalCreditsEarned.toLocaleString(),
       icon: TrendingUp,
       color: "text-green-400",
     },
     {
       title: "Minutos de Ejercicio",
       value: totalMinutes.toLocaleString(),
       icon: Clock,
       color: "text-blue-400",
     },
     {
       title: "Actividades",
       value: activities.length.toString(),
       icon: Target,
       color: "text-purple-400",
     },
   ];
 
   return (
     <div className="min-h-screen bg-background">
       <Navbar />
       
       <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
           <div>
             <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
             <p className="text-muted-foreground">
               Bienvenido, {user?.email?.split("@")[0]}
             </p>
           </div>
           <LogActivityDialog />
         </div>
         
         {/* Stats Grid */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
           {stats.map((stat, i) => (
             <Card key={i} className="bg-card border-border">
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-sm font-medium text-muted-foreground">
                   {stat.title}
                 </CardTitle>
                 <stat.icon className={`h-4 w-4 ${stat.color}`} />
               </CardHeader>
               <CardContent>
                 <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
               </CardContent>
             </Card>
           ))}
         </div>
         
         {/* Recent Activities */}
         <Card className="bg-card border-border">
           <CardHeader>
             <CardTitle>Actividad Reciente</CardTitle>
           </CardHeader>
           <CardContent>
             {activitiesLoading ? (
               <div className="flex justify-center py-8">
                 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
               </div>
             ) : activities.length === 0 ? (
               <div className="text-center py-12">
                 <Target className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                 <p className="text-muted-foreground">
                   No has registrado actividades aún.
                 </p>
                 <p className="text-sm text-muted-foreground">
                   ¡Haz ejercicio y gana tus primeros créditos!
                 </p>
               </div>
             ) : (
               <div className="space-y-3">
                 {activities.map((activity) => (
                   <ActivityCard key={activity.id} activity={activity} />
                 ))}
               </div>
             )}
           </CardContent>
         </Card>
       </main>
     </div>
   );
 }