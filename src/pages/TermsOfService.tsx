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
        <p className="text-muted-foreground mb-8">Última actualización: 11 de marzo de 2026</p>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">1. Aceptación de los Términos</h2>
            <p>Al acceder y utilizar FitLoot ("la Aplicación"), aceptas estar sujeto a estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar la Aplicación.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">2. Descripción del Servicio</h2>
            <p>FitLoot es una plataforma de gamificación fitness que permite a los usuarios registrar actividades físicas, ganar créditos virtuales y canjearlos por recompensas. La Aplicación puede conectarse con dispositivos wearables y servicios de terceros como Fitbit y Google Fit para sincronizar datos de actividad.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">3. Cuentas de Usuario</h2>
            <p>Para utilizar ciertas funciones de la Aplicación, debes crear una cuenta proporcionando información válida. Eres responsable de mantener la confidencialidad de tu cuenta y contraseña.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">4. Uso Aceptable</h2>
            <p>Te comprometes a no manipular, falsificar o alterar los datos de actividad física. El sistema de Trust Score monitorea la autenticidad de las actividades registradas. El uso fraudulento puede resultar en la suspensión o eliminación de tu cuenta.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">5. Créditos y Recompensas</h2>
            <p>Los créditos virtuales ganados no tienen valor monetario y no son transferibles. Las recompensas están sujetas a disponibilidad. FitLoot se reserva el derecho de modificar el sistema de créditos y recompensas en cualquier momento.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">6. Integración con Terceros</h2>
            <p>La Aplicación puede integrarse con servicios de terceros (Fitbit, Google Fit). El uso de estos servicios está sujeto a sus propios términos y políticas de privacidad. FitLoot no se hace responsable de la disponibilidad o precisión de los datos proporcionados por estos servicios.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">7. Limitación de Responsabilidad</h2>
            <p>FitLoot se proporciona "tal cual". No garantizamos que la Aplicación sea ininterrumpida o libre de errores. La Aplicación no proporciona asesoramiento médico. Consulta a un profesional de la salud antes de iniciar cualquier programa de ejercicio.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">8. Modificaciones</h2>
            <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán efectivos al publicarse en la Aplicación. El uso continuado después de los cambios constituye aceptación de los nuevos términos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">9. Contacto</h2>
            <p>Para preguntas sobre estos términos, contáctanos a través de la Aplicación.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
