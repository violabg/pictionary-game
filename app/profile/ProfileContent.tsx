import { Card } from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";

interface ProfileData {
  id: Id<"profiles">;
  username: string;
  email: string;
  avatar_url?: string;
  total_score: number;
  games_played: number;
}

export function ProfileContent({ profile }: { profile: ProfileData }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh]">
      <Card className="flex flex-col items-center bg-gradient-to-br from-[oklch(0.98_0.01_220)] dark:from-[oklch(0.25_0.02_220)] to-[oklch(0.85_0.04_270)] dark:to-[oklch(0.45_0.04_270)] p-8 border border-gradient w-full max-w-md">
        {profile.avatar_url && (
          <img
            src={profile.avatar_url}
            alt={profile.username}
            className="mb-4 border-4 border-gradient rounded-full w-20 h-20"
          />
        )}
        <h2 className="mb-2 font-bold text-gradient text-2xl">
          {profile.username}
        </h2>
        <p className="mb-4 text-muted-foreground text-sm">{profile.email}</p>

        <div className="gap-4 grid grid-cols-2 w-full">
          <div className="flex flex-col items-center">
            <span className="font-semibold text-muted-foreground text-sm">
              Punteggio totale
            </span>
            <span className="bg-clip-text bg-gradient-to-r from-[oklch(0.7_0.15_200)] to-[oklch(0.7_0.15_320)] font-bold text-transparent text-2xl">
              {profile.total_score}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-semibold text-muted-foreground text-sm">
              Partite giocate
            </span>
            <span className="bg-clip-text bg-gradient-to-r from-[oklch(0.7_0.15_200)] to-[oklch(0.7_0.15_320)] font-bold text-transparent text-2xl">
              {profile.games_played}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
