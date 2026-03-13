const es = {
  // Common
  app_name: "FitLoot",
  loading: "Cargando...",
  save: "Guardar",
  cancel: "Cancelar",
  close: "Cerrar",
  connect: "Conectar",
  disconnect: "Desconectar",
  sync: "Sincronizar",
  connected: "Conectado",
  disconnected: "Desconectado",
  coming_soon: "Próximamente",
  view_all: "Ver todos",
  sign_in: "Iniciar sesión",
  sign_up: "Registrarse",
  sign_out: "Cerrar sesión",

  // Navbar
  nav_dashboard: "Dashboard",
  nav_weekly: "Semanal",
  nav_fitness: "Fitness",
  nav_rewards: "Recompensas",
  nav_achievements: "Logros",
  nav_history: "Historial",
  nav_routines: "Rutinas",
  nav_referrals: "Referidos",
  nav_analytics: "Analytics",
  nav_admin: "Panel Admin",

  // Dashboard
  dashboard_title: "Dashboard",
  dashboard_welcome: "Bienvenido, {name}",
  dashboard_credits_available: "Créditos Disponibles",
  dashboard_credits_earned: "Créditos Ganados",
  dashboard_exercise_minutes: "Minutos de Ejercicio",
  dashboard_current_streak: "Racha Actual",
  dashboard_streak_days: "{count} días",
  dashboard_recent_activity: "Actividad Reciente",
  dashboard_no_activities: "No has registrado actividades aún.",
  dashboard_no_activities_hint: "¡Haz ejercicio y gana tus primeros créditos!",
  dashboard_achievements_earned: "Logros conseguidos",
  dashboard_log_activity: "+ Registrar Actividad",
  dashboard_trust_tutorial: "Tutorial Trust Score",

  // Wearables
  wearable_quick_connect: "Dispositivos",
  wearable_connect_device: "Conectar Dispositivo",
  wearable_no_devices: "Sin dispositivos conectados",
  wearable_last_sync: "Última sincronización: {time}",
  wearable_active_connections: "{count} dispositivo(s) conectado(s)",
  wearable_sync_all: "Sincronizar todo",
  wearable_fitbit: "Fitbit",
  wearable_google_fit: "Google Fit",
  wearable_apple_health: "Apple Health",
  wearable_fitbit_desc: "Sincroniza actividades desde tu Fitbit",
  wearable_google_fit_desc: "Conecta con Google Fit",
  wearable_apple_health_desc: "Conecta con Apple Health",

  // Notifications
  notifications_title: "Notificaciones",
  notifications_empty: "No tienes notificaciones",
  notifications_mark_all_read: "Marcar todas como leídas",
  notifications_delete_all: "Eliminar todas",

  // Level
  level_label: "Nivel",
  level_xp: "XP",
  level_next: "{xp} XP para el siguiente nivel",

  // Settings
  settings_title: "Configuración",
  settings_language: "Idioma",

  // Error
  error_title: "Algo salió mal",
  error_description: "La aplicación encontró un error inesperado. Intenta recargar.",
  error_reload: "Recargar App",
} as const;

export default es;
export type TranslationKeys = keyof typeof es;
