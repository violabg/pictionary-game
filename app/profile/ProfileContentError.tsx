import { Card, CardContent } from "@/components/ui/card";

export function ProfileContentError({ error }: { error: string }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-64px)] container">
      <Card className="shadow-[8px_8px_0_0_var(--color-destructive)] border-4 border-foreground w-full max-w-md text-center -rotate-2">
        <CardContent className="flex flex-col justify-center items-center gap-4 p-8">
          <h2 className="mb-4 font-display font-black text-primary text-4xl uppercase tracking-widest">
            Errore Profilo
          </h2>
          <p className="font-bold text-destructive text-lg">{error}</p>
        </CardContent>
      </Card>
    </div>
  );
}
