import { Card } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/ui/player-avatar";

interface ProfileData {
  id: string;
  full_name: string;
  user_name: string;
  avatar_url?: string | null;
  total_score: number;
}

export function ProfileContent({ profile }: { profile: ProfileData }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh]">
      <Card className="flex flex-col items-center bg-gradient-to-br from-[oklch(0.98_0.01_220)] dark:from-[oklch(0.25_0.02_220)] to-[oklch(0.85_0.04_270)] dark:to-[oklch(0.45_0.04_270)] p-8 border border-gradient w-full max-w-md">
        <PlayerAvatar
          profile={profile}
          className="mb-4 border-4 border-gradient w-20 h-20"
          fallbackClassName="text-3xl"
        />
        <h2 className="mb-2 font-bold text-gradient text-2xl">
          {profile.user_name}
        </h2>
        <h2 className="mb-2 font-bold text-gradient text-2xl">
          {profile.full_name}
        </h2>
        <div className="flex flex-col items-center gap-2">
          <span className="font-semibold text-lg">Punteggio totale</span>
          <span className="bg-clip-text bg-gradient-to-r from-[oklch(0.7_0.15_200)] to-[oklch(0.7_0.15_320)] font-bold text-gradient text-transparent text-3xl">
            {profile.total_score}
          </span>
        </div>
      </Card>
    </div>
  );
}
