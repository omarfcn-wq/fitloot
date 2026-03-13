import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReload = () => {
    // Unregister service workers and clear caches before reloading
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((r) => r.unregister());
      });
    }
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    setTimeout(() => window.location.reload(), 300);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a0a",
            color: "#fff",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Algo salió mal
          </h1>
          <p
            style={{
              color: "#888",
              marginBottom: "1.5rem",
              maxWidth: "400px",
            }}
          >
            La aplicación encontró un error inesperado. Intenta recargar.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              background: "#22c55e",
              color: "#000",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Recargar App
          </button>
          <p
            style={{
              color: "#555",
              fontSize: "0.75rem",
              marginTop: "2rem",
              maxWidth: "400px",
              wordBreak: "break-all",
            }}
          >
            {this.state.error?.message}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
