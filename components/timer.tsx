"use client"

interface TimerProps {
  seconds: number
}

export default function Timer({ seconds }: TimerProps) {
  // Format seconds as MM:SS
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`

  // Calculate percentage for progress bar
  const percentage = (seconds / 120) * 100

  // Determine color based on time remaining
  let color = "bg-green-500"
  if (seconds < 30) {
    color = "bg-red-500"
  } else if (seconds < 60) {
    color = "bg-yellow-500"
  }

  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-mono font-bold mb-1 gradient-text">{formattedTime}</div>
      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-1000 ease-linear`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
