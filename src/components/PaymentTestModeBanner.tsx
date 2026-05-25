import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;
  return (
    <div className="w-full bg-orange-500/10 border-b border-orange-500/30 px-4 py-2 text-center text-xs text-orange-400">
      Modo de prueba: los pagos en el preview no son reales.{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-medium"
      >
        Más info
      </a>
    </div>
  );
}
