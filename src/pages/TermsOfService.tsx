import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <h1 className="text-3xl font-bold mb-2">Términos de Servicio</h1>
        <p className="text-muted-foreground mb-8">Última actualización: 25 de mayo de 2026</p>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">1. Identificación del vendedor</h2>
            <p>
              FitLoot ("la Aplicación" o "el Servicio") es operado por <strong>Omar Fernando Croquer Nadal</strong>{" "}
              ("nosotros", "el vendedor"). Al utilizar la Aplicación, estás contratando directamente con Omar
              Fernando Croquer Nadal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">2. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar FitLoot aceptás estar sujeto a estos Términos de Servicio. Si no estás de
              acuerdo con alguna parte de estos términos, no debés utilizar la Aplicación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">3. Descripción del Servicio</h2>
            <p>
              FitLoot es una plataforma de gamificación fitness que permite registrar actividades físicas,
              ganar créditos virtuales y canjearlos por recompensas. La Aplicación puede conectarse con
              dispositivos wearables y servicios de terceros como Fitbit y Google Fit para sincronizar datos
              de actividad.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">4. Cuentas de Usuario</h2>
            <p>
              Para utilizar ciertas funciones debés crear una cuenta proporcionando información válida. Sos
              responsable de mantener la confidencialidad de tu cuenta y contraseña, y de toda la actividad
              que ocurra bajo tu cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">5. Uso Aceptable</h2>
            <p>
              Te comprometés a no manipular, falsificar o alterar los datos de actividad física. El sistema de
              Trust Score monitorea la autenticidad de las actividades registradas. El uso fraudulento,
              ilegal, la interferencia con la seguridad del sistema, el scraping o el envío de malware pueden
              resultar en la suspensión o eliminación de tu cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">6. Créditos y Recompensas</h2>
            <p>
              Los créditos virtuales ganados no tienen valor monetario y no son transferibles. Las recompensas
              están sujetas a disponibilidad. FitLoot se reserva el derecho de modificar el sistema de
              créditos y recompensas en cualquier momento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">7. Suscripciones Premium y Pagos</h2>
            <p>
              <strong>
                Nuestro proceso de pedidos es realizado por nuestro revendedor en línea Paddle.com.
                Paddle.com es el Merchant of Record (vendedor oficial) para todos nuestros pedidos. Paddle
                gestiona todas las consultas de servicio al cliente relacionadas con pagos y maneja las
                devoluciones.
              </strong>
            </p>
            <p className="mt-2">
              Las suscripciones Premium son recurrentes y se renuevan automáticamente al final de cada
              período de facturación al precio vigente, salvo que canceles antes de la fecha de renovación.
              Podés cancelar en cualquier momento desde el portal de Paddle (paddle.net) y conservás el
              acceso Premium hasta el final del período ya pagado.
            </p>
            <p className="mt-2">
              Los pagos, impuestos aplicables, facturación, renovaciones, disputas de cargos y devoluciones
              se rigen por los{" "}
              <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer" className="underline">
                Términos del comprador de Paddle
              </a>
              . Las solicitudes de reembolso se rigen por nuestra{" "}
              <Link to="/refund" className="underline">Política de Reembolsos</Link> y por la{" "}
              <a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noopener noreferrer" className="underline">
                Política de reembolsos de Paddle
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">8. Integración con Terceros</h2>
            <p>
              La Aplicación puede integrarse con servicios de terceros (Fitbit, Google Fit, Paddle). El uso de
              estos servicios está sujeto a sus propios términos y políticas de privacidad. FitLoot no se hace
              responsable de la disponibilidad o precisión de los datos proporcionados por estos servicios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">9. Propiedad Intelectual</h2>
            <p>
              Omar Fernando Croquer Nadal retiene la propiedad de la Aplicación, su software, documentación,
              marcas y demás materiales asociados. Se te otorga una licencia limitada, no exclusiva y no
              transferible para usar el Servicio conforme al plan contratado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">10. Limitación de Responsabilidad</h2>
            <p>
              FitLoot se proporciona "tal cual". No garantizamos que la Aplicación sea ininterrumpida o libre
              de errores. La Aplicación no proporciona asesoramiento médico — consultá a un profesional de la
              salud antes de iniciar cualquier programa de ejercicio. En la máxima medida permitida por la
              ley, no seremos responsables por daños indirectos, consecuentes o pérdida de datos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">11. Suspensión y Terminación</h2>
            <p>
              Podemos suspender o terminar tu acceso por incumplimiento material de estos términos,
              falta de pago, riesgo de fraude o violaciones repetidas de las políticas. Podés cerrar tu cuenta
              en cualquier momento desde la configuración de la Aplicación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">12. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán
              efectivos al publicarse en la Aplicación. El uso continuado constituye aceptación de los nuevos
              términos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">13. Contacto</h2>
            <p>
              Para preguntas sobre estos términos, contactanos a través de la Aplicación. Para consultas
              relativas a pagos o reembolsos, contactá a Paddle en paddle.net.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
