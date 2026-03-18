import PictionAILogo from "@/assets";
import { LoginButton } from "@/components/auth/login-button";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
  return (
    <div className="relative flex flex-col items-center pb-16 min-h-screen overflow-hidden">
      {/* Decorative blobs */}
      <div className="top-0 left-1/2 absolute bg-primary/15 dark:bg-primary/10 blur-3xl rounded-full w-175 h-100 -translate-x-1/2 pointer-events-none" />
      <div className="top-32 left-10 absolute bg-accent/20 blur-2xl rounded-full w-48 h-48 pointer-events-none" />
      <div className="absolute top-20 right-8 w-40 h-40 bg-(--color-mint)/20 rounded-full blur-2xl pointer-events-none" />

      {/* Hero */}
      <div className="z-10 relative flex flex-col items-center gap-6 px-4 pt-20 text-center">
        <div className="animate-bounce-in" style={{ animationDelay: "0ms" }}>
          <PictionAILogo
            height={100}
            className="drop-shadow-lg text-black dark:text-white"
          />
        </div>

        <div className="animate-bounce-in" style={{ animationDelay: "80ms" }}>
          <p className="max-w-sm font-medium text-foreground/70 text-lg">
            Disegna, indovina, vinci — con l&apos;AI che giudica le risposte
          </p>
        </div>

        {/* CTA block */}
        <div
          className="flex flex-col gap-4 bg-card mt-4 p-6 border-3 border-foreground rounded-xl w-full max-w-sm"
          style={{
            boxShadow: "6px 6px 0 0 var(--foreground)",
            animation: "slide-up 0.5s ease 160ms both",
          }}
        >
          <h2 className="font-display text-2xl text-left tracking-wide">
            Pronto a giocare?
          </h2>
          <div className="flex sm:flex-row flex-col gap-3">
            <Link
              className={`${buttonVariants({ size: "lg" })} font-bold text-base flex-1 justify-center`}
              href="/gioca"
            >
              🎨 Inizia a giocare
            </Link>
            <LoginButton />
          </div>
        </div>
      </div>

      {/* Feature grid */}
      <div
        className="z-10 relative gap-5 grid sm:grid-cols-3 mt-16 px-4 w-full max-w-3xl"
        style={{ animation: "slide-up 0.5s ease 300ms both" }}
      >
        {[
          {
            icon: "✏️",
            title: "Disegna",
            desc: "Sketch libero con canvas HD in tempo reale",
            color: "var(--color-yellow)",
          },
          {
            icon: "🤖",
            title: "AI giudica",
            desc: "Groq AI valida le risposte istantaneamente",
            color: "var(--color-mint)",
          },
          {
            icon: "🏆",
            title: "Vinci",
            desc: "Scala la classifica turno dopo turno",
            color: "var(--color-coral)",
          },
        ].map((feat) => (
          <div
            key={feat.title}
            className="flex flex-col gap-2 bg-card p-5 border-2 border-foreground rounded-xl"
            style={{
              boxShadow: `4px 4px 0 0 ${feat.color}`,
              borderColor: feat.color,
            }}
          >
            <span className="text-3xl">{feat.icon}</span>
            <h3 className="font-display text-xl tracking-wide">{feat.title}</h3>
            <p className="font-medium text-muted-foreground text-sm">
              {feat.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
