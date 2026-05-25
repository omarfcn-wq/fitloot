import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <h1 className="text-3xl font-bold mb-2">Política de Reembolsos</h1>
        <p className="text-muted-foreground mb-8">Última actualización: 25 de mayo de 2026</p>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">1. Garantía de devolución de 30 días</h2>
            <p>
              FitLoot, operado por <strong>Omar Fernando Croquer Nadal</strong>, ofrece una garantía de
              devolución de dinero de <strong>30 días</strong> para todas las suscripciones de pago. Si no
              estás satisfecho con tu compra, podés solicitar el reembolso íntegro dentro de los 30 días
              posteriores a la fecha del pago.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">2. Cómo solicitar un reembolso</h2>
            <p>
              Nuestros pagos son procesados por <strong>Paddle.com</strong>, que actúa como Merchant of
              Record (vendedor oficial). Para solicitar un reembolso podés:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                Visitar <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="underline">paddle.net</a> e
                ingresar el correo electrónico utilizado en la compra para gestionar tu pedido.
              </li>
              <li>Contactarnos directamente desde la Aplicación y te ayudaremos a coordinar el reembolso con Paddle.</li>
            </ul>
            <p className="mt-2">
              Los reembolsos aprobados se procesan al medio de pago original, normalmente dentro de los 5 a 10
              días hábiles, dependiendo de tu banco o emisor de tarjeta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">3. Cancelación de la suscripción</h2>
            <p>
              Podés cancelar tu suscripción Premium en cualquier momento desde el portal de Paddle
              (paddle.net) o contactando soporte. Al cancelar, mantenés el acceso Premium hasta el final del
              período de facturación ya pagado y no se realizan cargos posteriores.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">4. Términos del comprador de Paddle</h2>
            <p>
              Esta política complementa los{" "}
              <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer" className="underline">
                Términos del comprador de Paddle
              </a>{" "}
              y la{" "}
              <a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noopener noreferrer" className="underline">
                Política de reembolsos de Paddle
              </a>
              , que también se aplican a tu compra.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">5. Contacto</h2>
            <p>Para consultas sobre reembolsos, contactanos desde la Aplicación o a través de paddle.net.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
