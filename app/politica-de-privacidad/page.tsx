import type { Metadata } from "next";
import { clientConfig } from "@/config/client";

export const metadata: Metadata = {
  title: `Política de privacidad — ${clientConfig.businessName}`,
  description: `Cómo ${clientConfig.businessName} recopila y usa tus datos al escribirnos por WhatsApp.`,
};

export default function PoliticaDePrivacidadPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-stone-800">
      <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-stone-900">
        Política de privacidad
      </h1>
      <p className="mt-2 text-sm text-stone-500">
        {clientConfig.businessName} — última actualización: septiembre de 2026
      </p>

      <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed">
        <p>
          Esta página explica, en términos simples, qué información recopilamos
          cuando nos escribes por WhatsApp o Telegram para consultar o reservar
          un vehículo, y cómo la usamos.
        </p>

        <section>
          <h2 className="font-display text-base font-bold uppercase tracking-wide text-stone-900">
            Qué información recopilamos
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Tu número de teléfono (necesario para responderte por WhatsApp).</li>
            <li>Tu nombre, si nos lo compartes durante la conversación.</li>
            <li>El contenido de los mensajes que nos envías, incluyendo mensajes de voz transcritos a texto.</li>
            <li>El vehículo de tu interés y los datos de la reserva (fechas, horario de retiro).</li>
            <li>Si nos confirmas que cuentas con tarjeta de crédito para la garantía (no almacenamos números de tarjeta).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase tracking-wide text-stone-900">
            Para qué la usamos
          </h2>
          <p className="mt-2">
            Usamos esta información únicamente para responder tus consultas,
            gestionar la disponibilidad de nuestra flota, coordinar la entrega
            del vehículo y mantener un registro de tu reserva. No vendemos ni
            compartimos tu información con terceros para fines publicitarios.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase tracking-wide text-stone-900">
            Con quién la compartimos
          </h2>
          <p className="mt-2">
            Para poder ofrecer este servicio, parte de tu información pasa por
            los siguientes proveedores, únicamente con el fin de operar el
            servicio:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Meta / WhatsApp Business Platform, como canal de mensajería.</li>
            <li>OpenAI, para generar las respuestas automáticas de nuestro asistente virtual.</li>
            <li>Airtable, donde almacenamos de forma segura el registro de tu conversación y tu reserva.</li>
            <li>Google Calendar, para agendar el horario de entrega del vehículo.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase tracking-wide text-stone-900">
            Cuánto tiempo guardamos tu información
          </h2>
          <p className="mt-2">
            Conservamos el registro de tu conversación y reserva mientras
            mantengamos una relación comercial contigo o mientras sea necesario
            para fines de soporte y registro interno.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase tracking-wide text-stone-900">
            Tus derechos
          </h2>
          <p className="mt-2">
            Puedes pedirnos en cualquier momento que te confirmemos, corrijamos
            o eliminemos la información que tenemos sobre ti, escribiéndonos a
            través de los mismos canales de contacto o al correo indicado abajo.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase tracking-wide text-stone-900">
            Contacto
          </h2>
          <p className="mt-2">
            Si tienes preguntas sobre esta política de privacidad, escríbenos a{" "}
            <a
              href="mailto:diegopachecorobles2399@gmail.com"
              className="text-brand-primary underline underline-offset-2"
            >
              diegopachecorobles2399@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
