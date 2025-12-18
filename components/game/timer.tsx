"use client";

interface TimerProps {
  seconds: number;
  totalTime: number; // Total time for percentage calculation
  isWaiting?: boolean; // True if waiting for first stroke (draw-to-start timer)
}

export default function Timer({ seconds, totalTime, isWaiting }: TimerProps) {
  // If waiting for first stroke, show waiting message
  if (isWaiting) {
    return (
      <div className="flex flex-col items-center">
        <div className="mb-1 font-mono font-bold text-gradient text-2xl">
          ⏱️
        </div>
        <div className="text-muted-foreground text-sm text-center">
          Waiting for drawer...
        </div>
      </div>
    );
  }

  // Format seconds as MM:SS
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formattedTime = `${minutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;

  // Calculate percentage for progress bar
  const percentage = (seconds / totalTime) * 100;

  // Determine color based on time remaining
  let color = "bg-green-500";
  if (seconds < 10) {
    color = "bg-red-500";
  } else if (seconds < 30) {
    color = "bg-yellow-500";
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-1 font-mono font-bold text-gradient text-2xl">
        {formattedTime}
      </div>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-full w-32 h-2 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-1000 ease-linear`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
