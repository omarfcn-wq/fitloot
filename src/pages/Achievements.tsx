import { Navbar } from "@/components/Navbar";
import { LevelBadge } from "@/components/LevelBadge";
import { AchievementCard } from "@/components/AchievementCard";
import { useAchievements } from "@/hooks/useAchievements";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Trophy, Flame, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Achievements() {
  const { user } = useAuth();
  const { 
    achievements, 
    userAchievements, 
    levelInfo, 
    userStats,
    isLoading, 
    hasAchievement 
  } = useAchievements();

  const earnedAchievements = achievements.filter(a => hasAchievement(a.id));
  const pendingAchievements = achievements.filter(a => !hasAchievement(a.id));

  const getProgress = (achievement: typeof achievements[0]) => {
    if (!userStats) return 0;
    switch (achievement.requirement_type) {
      case "activities_count":
        return (userStats.totalActivities / achievement.requirement_value) * 100;
      case "total_minutes":
        return (userStats.totalMinutes / achievement.requirement_value) * 100;
      case "credits_earned":
        return (userStats.totalCredits / achievement.requirement_value) * 100;
      case "streak_days":
        return (userStats.streak / achievement.requirement_value) * 100;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Logros y Niveles
          </h1>
          <p className="text-muted-foreground">
            Completa desafíos para ganar XP y subir de nivel
          </p>
        </div>
        
        {!user ? (
          <div className="p-6 rounded-xl bg-muted border border-border text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">
              Inicia sesión para ver tus logros y nivel
            </p>
            <Link to="/auth">
              <Button className="glow-green">Iniciar Sesión</Button>
            </Link>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Level and Stats */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <LevelBadge 
                level={levelInfo.level}
                currentXP={levelInfo.currentLevelXP}
                nextLevelXP={levelInfo.nextLevelXP}
              />
              
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground text-sm">Logros</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {earnedAchievements.length} / {achievements.length}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="text-muted-foreground text-sm">Racha actual</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {userStats?.streak ?? 0} días
                </p>
              </div>
            </div>

            {/* Achievements Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="all">
                  Todos ({achievements.length})
                </TabsTrigger>
                <TabsTrigger value="earned">
                  Conseguidos ({earnedAchievements.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pendientes ({pendingAchievements.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <div className="grid sm:grid-cols-2 gap-4">
                  {achievements.map((achievement) => {
                    const userAch = userAchievements.find(
                      ua => ua.achievement_id === achievement.id
                    );
                    return (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        earned={!!userAch}
                        earnedAt={userAch?.earned_at}
                        progress={!userAch ? getProgress(achievement) : undefined}
                      />
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="earned">
                {earnedAchievements.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">
                      Aún no has conseguido ningún logro. ¡Empieza a hacer ejercicio!
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {earnedAchievements.map((achievement) => {
                      const userAch = userAchievements.find(
                        ua => ua.achievement_id === achievement.id
                      );
                      return (
                        <AchievementCard
                          key={achievement.id}
                          achievement={achievement}
                          earned={true}
                          earnedAt={userAch?.earned_at}
                        />
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending">
                {pendingAchievements.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 mx-auto text-primary mb-4" />
                    <p className="text-primary font-semibold">
                      ¡Felicidades! Has conseguido todos los logros.
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {pendingAchievements.map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        earned={false}
                        progress={getProgress(achievement)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
