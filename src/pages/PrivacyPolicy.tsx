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
        <p className="text-muted-foreground mb-8">Última actualización: 25 de mayo de 2026</p>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">1. Responsable del tratamiento</h2>
            <p>
              FitLoot ("la Aplicación") es operada por <strong>Omar Fernando Croquer Nadal</strong>, quien
              actúa como <strong>responsable del tratamiento (data controller)</strong> de los datos
              personales recopilados a través de la Aplicación. Esta política describe qué datos recopilamos,
              con qué finalidad, sobre qué base legal y con quién los compartimos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">2. Información que Recopilamos</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Datos de cuenta:</strong> correo electrónico y nombre.</li>
              <li><strong>Datos de perfil:</strong> edad, peso, altura y objetivos de fitness (opcionales).</li>
              <li><strong>Datos de actividad:</strong> tipo, duración, calorías, frecuencia cardíaca y distancia.</li>
              <li><strong>Datos de wearables:</strong> información sincronizada desde Fitbit, Google Fit u otros dispositivos conectados.</li>
              <li><strong>Datos técnicos:</strong> dirección IP, identificadores de dispositivo y datos de uso para seguridad y diagnóstico.</li>
              <li><strong>Datos de suscripción:</strong> estado, fechas de renovación y referencias de transacción provistas por Paddle. No almacenamos datos completos de tarjetas — son gestionados por Paddle.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">3. Finalidades y base legal del tratamiento</h2>
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="text-left text-foreground">
                  <th className="py-1 pr-4">Finalidad</th>
                  <th className="py-1">Base legal</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="py-1 pr-4">Prestar y mantener el Servicio</td><td>Ejecución del contrato</td></tr>
                <tr><td className="py-1 pr-4">Calcular créditos, niveles, logros y Trust Score</td><td>Ejecución del contrato</td></tr>
                <tr><td className="py-1 pr-4">Gestionar suscripciones Premium y procesar pagos</td><td>Ejecución del contrato</td></tr>
                <tr><td className="py-1 pr-4">Prevención de fraude y seguridad</td><td>Interés legítimo</td></tr>
                <tr><td className="py-1 pr-4">Mejorar el producto y métricas de uso</td><td>Interés legítimo</td></tr>
                <tr><td className="py-1 pr-4">Envío de notificaciones operativas</td><td>Ejecución del contrato</td></tr>
                <tr><td className="py-1 pr-4">Cumplimiento de obligaciones legales (fiscales, contables)</td><td>Obligación legal</td></tr>
                <tr><td className="py-1 pr-4">Comunicaciones de marketing opcionales</td><td>Consentimiento</td></tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">4. Con quién compartimos tus datos</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Paddle.com Market Limited</strong> — actúa como Merchant of Record para procesar pagos,
                gestionar suscripciones, calcular impuestos, emitir facturas y atender solicitudes de
                reembolso. Compartimos con Paddle tu correo, identificador interno y datos mínimos de la
                transacción. Más información en la{" "}
                <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                  política de privacidad de Paddle
                </a>.
              </li>
              <li><strong>Proveedores de infraestructura</strong> — alojamiento, base de datos, almacenamiento y envío de notificaciones, bajo acuerdos de encargado del tratamiento.</li>
              <li><strong>Fitbit y Google Fit</strong> — únicamente cuando vos autorizás expresamente la conexión de tu wearable; accedemos solo a los datos necesarios para el funcionamiento de la Aplicación.</li>
              <li><strong>Asesores profesionales</strong> (legales, contables) cuando sea necesario.</li>
              <li><strong>Autoridades</strong> cuando lo exija la ley.</li>
            </ul>
            <p className="mt-2">No vendemos tus datos personales a terceros.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">5. Plazos de conservación</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Datos de cuenta y perfil:</strong> mientras tu cuenta esté activa. Se eliminan o anonimizan hasta 30 días después de la baja, salvo obligación legal de conservación.</li>
              <li><strong>Datos de actividad y wearables:</strong> mientras tu cuenta esté activa; podés solicitar su eliminación en cualquier momento.</li>
              <li><strong>Datos de facturación y transacciones:</strong> conservados por Paddle y por nosotros durante el plazo legal aplicable (típicamente 7 años por obligaciones fiscales y contables).</li>
              <li><strong>Logs de seguridad y prevención de fraude:</strong> hasta 12 meses.</li>
              <li><strong>Comunicaciones de soporte:</strong> hasta 24 meses tras el cierre del ticket.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">6. Tus derechos</h2>
            <p>Según la normativa aplicable, tenés derecho a:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Acceder, rectificar o eliminar tus datos personales.</li>
              <li>Limitar u oponerte a determinados tratamientos.</li>
              <li>Solicitar la portabilidad de tus datos de actividad.</li>
              <li>Retirar tu consentimiento en cualquier momento (sin efecto retroactivo).</li>
              <li>Desconectar servicios de terceros desde la Aplicación.</li>
              <li>Presentar una reclamación ante la autoridad de protección de datos competente.</li>
            </ul>
            <p className="mt-2">Para ejercer estos derechos contactanos a través de la Aplicación.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">7. Seguridad</h2>
            <p>
              Aplicamos medidas técnicas y organizativas razonables, incluyendo cifrado en tránsito y en
              reposo, controles de acceso y rotación segura de tokens, para proteger tus datos contra acceso
              no autorizado, pérdida o alteración.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">8. Cookies y almacenamiento local</h2>
            <p>
              Utilizamos almacenamiento local del navegador para mantener tu sesión y preferencias (como el
              tema oscuro/claro) y cookies estrictamente necesarias para el funcionamiento del Servicio. No
              utilizamos cookies de seguimiento publicitario de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">9. Transferencias internacionales</h2>
            <p>
              Algunos de nuestros proveedores (incluido Paddle) pueden tratar datos fuera de tu país de
              residencia. En esos casos exigimos garantías contractuales adecuadas (como las Cláusulas
              Contractuales Tipo de la UE) para proteger tus datos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">10. Menores de edad</h2>
            <p>FitLoot no está dirigido a menores de 13 años y no recopilamos intencionalmente datos de menores.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">11. Cambios a esta Política</h2>
            <p>Podemos actualizar esta política periódicamente. Te notificaremos los cambios significativos a través de la Aplicación.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">12. Contacto</h2>
            <p>Responsable: Omar Fernando Croquer Nadal. Para consultas de privacidad, contactanos a través de la Aplicación.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
