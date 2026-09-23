import DatosProvider from "@/components/panel/DatosProvider";
import Shell from "@/components/panel/Shell";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <DatosProvider>
      <Shell>{children}</Shell>
    </DatosProvider>
  );
}
