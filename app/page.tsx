import PictionAILogo from "@/assets";
import { LoginButton } from "@/components/auth/login-button";
import { Pen, Shapes, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  return (
    <div className="relative flex flex-col justify-center items-center py-12 min-h-[calc(100vh-64px)] overflow-hidden container">
      {/* Decorative background elements */}
      <div className="top-1/4 left-10 absolute opacity-20 text-primary -rotate-12 pointer-events-none">
        <Pen size={120} strokeWidth={1} />
      </div>
      <div className="right-10 bottom-1/4 absolute opacity-20 text-secondary rotate-12 pointer-events-none">
        <Shapes size={100} strokeWidth={1} />
      </div>

      <div className="z-10 flex flex-col items-center gap-6 px-4 w-full max-w-3xl">
        <div className="group relative">
          <PictionAILogo height={100} className="text-black dark:text-white" />
          <div className="-top-6 -right-6 md:-right-12 absolute animate-bounce">
            <Sparkles className="fill-secondary w-10 md:w-16 h-10 md:h-16 text-secondary" />
          </div>
        </div>

        <p className="bg-white dark:bg-black shadow-[6px_6px_0px_0px_var(--color-foreground)] dark:shadow-[6px_6px_0px_0px_var(--color-foreground)] p-4 border-4 border-foreground rounded-xl max-w-2xl font-sans font-bold text-xl md:text-2xl text-center tracking-wide">
          Un gioco multiplayer in tempo reale di disegno e indovinelli,{" "}
          <span className="text-primary decoration-wavy underline">
            alimentato dall&apos;AI
          </span>
          !
        </p>
      </div>

      <div className="z-10 bg-card shadow-[8px_8px_0_0_var(--color-primary)] mx-auto mt-16 p-8 border-4 border-foreground rounded-2xl w-full max-w-xl transition-all active:translate-x-1 active:translate-y-1 transform">
        <div className="flex flex-col items-center space-y-4 mb-8 text-center">
          <h2 className="font-display font-bold text-foreground text-4xl uppercase tracking-tight">
            Inizia una partita
          </h2>
          <p className="font-bold text-muted-foreground text-lg">
            Crea una nuova stanza di PictionAI o fai l&apos;accesso per giocare
            con i tuoi amici.
          </p>
        </div>

        <div className="flex sm:flex-row flex-col justify-center items-center gap-6">
          <Link
            href="/gioca"
            className="inline-flex justify-center items-center bg-primary disabled:opacity-50 shadow-[4px_4px_0_0_var(--color-primary)] hover:shadow-[6px_6px_0_0_var(--color-primary)] active:shadow-none px-8 py-4 border-4 border-foreground rounded-xl outline-none w-full sm:w-auto h-16 font-display font-black text-primary-foreground text-xl uppercase tracking-widest whitespace-nowrap transition-all hover:-translate-y-1 active:translate-x-1 active:translate-y-1 disabled:pointer-events-none select-none"
          >
            <span>Gioca Ora</span>
            <Pen className="ml-3 w-6 h-6" />
          </Link>

          <LoginButton />
        </div>
      </div>
    </div>
  );
}
