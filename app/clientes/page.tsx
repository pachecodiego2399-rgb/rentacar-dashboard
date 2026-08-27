import Header from "@/components/Header";
import ClientesDashboard from "@/components/ClientesDashboard";

export default function ClientesPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <ClientesDashboard />
      </main>
    </>
  );
}
