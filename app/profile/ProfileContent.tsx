import { Card, CardContent } from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";

interface ProfileData {
  id: Id<"users">;
  username: string;
  email: string;
  avatar_url?: string;
  total_score: number;
  games_played: number;
}

export function ProfileContent({ profile }: { profile: ProfileData }) {
  return (
    <div className="flex flex-col justify-center items-center py-12 min-h-[calc(100vh-64px)] container">
      <div className="mb-12 text-center">
        <h1 className="drop-shadow-[4px_4px_0_var(--color-primary)] dark:drop-shadow-[4px_4px_0_var(--color-primary)] font-display font-black text-foreground text-5xl md:text-7xl uppercase tracking-tight">
          Il tuo <span className="text-secondary italic">Profilo</span>
        </h1>
      </div>

      <Card className="shadow-[8px_8px_0_0_var(--color-primary)] w-full max-w-md">
        <CardContent className="flex flex-col justify-center items-center bg-[radial-gradient(var(--color-muted)_1px,transparent_1px)] p-8 [background-size:16px_16px]">
          {profile.avatar_url && (
            <div className="group relative mb-6">
              <div className="absolute inset-0 bg-primary border-4 border-foreground rounded-full transition-transform translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3"></div>
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="z-10 relative bg-white border-4 border-foreground rounded-full w-32 h-32 object-center object-cover"
              />
            </div>
          )}

          <h2 className="bg-white dark:bg-black shadow-[4px_4px_0_0_var(--color-secondary)] mb-2 px-4 py-2 border-4 border-foreground font-display font-black text-foreground text-4xl uppercase tracking-widest -rotate-2">
            {profile.username}
          </h2>

          <p className="bg-muted shadow-[2px_2px_0_0_var(--color-foreground)] mb-8 px-4 py-1 border-2 border-foreground rounded-full font-bold text-foreground">
            {profile.email}
          </p>

          <div className="gap-6 grid grid-cols-2 mt-4 w-full">
            <div className="flex flex-col items-center bg-primary/10 shadow-[4px_4px_0_0_var(--color-primary)] hover:shadow-[6px_6px_0_0_var(--color-primary)] p-4 border-4 border-foreground rounded-2xl transition-transform hover:-translate-y-1">
              <span className="mb-2 font-sans font-bold text-foreground text-sm uppercase tracking-wider">
                Punteggio
              </span>
              <span className="drop-shadow-[2px_2px_0_var(--color-foreground)] font-display font-black text-primary text-4xl">
                {profile.total_score}
              </span>
            </div>

            <div className="flex flex-col items-center bg-secondary/10 shadow-[4px_4px_0_0_var(--color-secondary)] hover:shadow-[6px_6px_0_0_var(--color-secondary)] p-4 border-4 border-foreground rounded-2xl transition-transform hover:-translate-y-1">
              <span className="mb-2 font-sans font-bold text-foreground text-sm uppercase tracking-wider">
                Partite
              </span>
              <span className="drop-shadow-[2px_2px_0_var(--color-foreground)] font-display font-black text-secondary text-4xl">
                {profile.games_played}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
