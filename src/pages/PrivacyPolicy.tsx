import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
        <p className="text-muted-foreground mb-8">Última actualización: 11 de marzo de 2026</p>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">1. Información que Recopilamos</h2>
            <p>Recopilamos la siguiente información:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Datos de cuenta:</strong> correo electrónico y nombre.</li>
              <li><strong>Datos de perfil:</strong> edad, peso, altura y objetivos de fitness (opcionales).</li>
              <li><strong>Datos de actividad:</strong> tipo de actividad, duración, calorías quemadas, frecuencia cardíaca y distancia.</li>
              <li><strong>Datos de wearables:</strong> información sincronizada desde dispositivos conectados como Fitbit y Google Fit.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">2. Cómo Usamos tu Información</h2>
            <p>Utilizamos tu información para:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Proporcionar y mejorar el servicio de FitLoot.</li>
              <li>Calcular créditos, niveles y logros.</li>
              <li>Evaluar la autenticidad de las actividades (Trust Score).</li>
              <li>Personalizar tu experiencia en la Aplicación.</li>
              <li>Enviar notificaciones relacionadas con tu actividad.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">3. Integración con Servicios de Terceros</h2>
            <p>Cuando conectas dispositivos wearables, accedemos a tus datos de actividad física a través de las APIs de Fitbit y/o Google Fit. Solo accedemos a los datos necesarios para el funcionamiento de la Aplicación y no compartimos esta información con terceros no autorizados.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">4. Almacenamiento y Seguridad</h2>
            <p>Tus datos se almacenan de forma segura utilizando encriptación estándar de la industria. Los tokens de acceso a servicios de terceros se almacenan de forma segura y se renuevan automáticamente.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">5. Tus Derechos</h2>
            <p>Tienes derecho a:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Acceder a tus datos personales.</li>
              <li>Solicitar la corrección de datos incorrectos.</li>
              <li>Solicitar la eliminación de tu cuenta y datos asociados.</li>
              <li>Desconectar servicios de terceros en cualquier momento.</li>
              <li>Exportar tus datos de actividad.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">6. Cookies y Tecnologías Similares</h2>
            <p>Utilizamos almacenamiento local del navegador para mantener tu sesión y preferencias (como el tema oscuro/claro). No utilizamos cookies de seguimiento de terceros.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">7. Menores de Edad</h2>
            <p>FitLoot no está dirigido a menores de 13 años. No recopilamos intencionalmente información de menores de 13 años.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">8. Cambios a esta Política</h2>
            <p>Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos a través de la Aplicación.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">9. Contacto</h2>
            <p>Para consultas sobre privacidad, contáctanos a través de la Aplicación.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
