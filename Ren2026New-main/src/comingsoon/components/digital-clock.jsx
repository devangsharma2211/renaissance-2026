import { useState, useEffect } from "react"

export function DigitalClock() {
  const [time, setTime] = useState(null)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!time) {
    return (
      <div className="font-mono text-2xl md:text-3xl lg:text-4xl tracking-widest text-primary">
        <span className="opacity-50">--:--:--</span>
      </div>
    )
  }

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const currentDay = time.getDay()

  // Target date set to 03-02-2026 (dd-mm-yyyy) per request
  const targetDate = new Date("2026-02-03T15:30:00").getTime()
  const currentTime = time.getTime()
  const difference = Math.max(0, targetDate - currentTime)

  const countdownDays = Math.floor(difference / (1000 * 60 * 60 * 24)).toString().padStart(2, "0")
  const countdownHours = Math.floor((difference / (1000 * 60 * 60)) % 24).toString().padStart(2, "0")
  const countdownMinutes = Math.floor((difference / 1000 / 60) % 60).toString().padStart(2, "0")
  const countdownSeconds = Math.floor((difference / 1000) % 60).toString().padStart(2, "0")

  return (
    <div className="relative">
      <div className="absolute inset-0 blur-3xl opacity-25 bg-gradient-to-r from-red-500 via-red-400 to-red-500" />

      <div className="relative font-mono text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-widest">
        <div className="flex items-center justify-center gap-2 md:gap-3 mb-4 md:mb-6">
          {days.map((day, index) => (
            <div
              key={day}
              className={`text-xs sm:text-sm md:text-base font-semibold px-2 py-1 rounded-md transition-all ${
                index === currentDay
                  ? "bg-red-500/40 text-red-300 border border-red-400"
                  : "text-red-400/50 border border-red-500/30"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-4">
          <TimeUnit value={countdownDays} />
          <Separator />
          <TimeUnit value={countdownHours} />
          <Separator />
          <TimeUnit value={countdownMinutes} />
          <Separator />
          <TimeUnit value={countdownSeconds} />
        </div>
      </div>
    </div>
  )
}

function TimeUnit({ value }) {
  return (
    <div className="relative group">
      <div className="relative bg-black/50 backdrop-blur-md rounded-lg md:rounded-xl p-2 sm:p-3 md:p-4 lg:p-6 border border-red-500/40 shadow-lg">
        <span className="bg-gradient-to-b from-red-400 via-red-300 to-red-500 bg-clip-text text-transparent font-bold">
          {value}
        </span>
      </div>
      <div className="absolute -bottom-2 md:-bottom-4 left-0 right-0 h-4 md:h-8 bg-gradient-to-b from-red-500/20 to-transparent rounded-b-xl opacity-50 blur-sm" />
    </div>
  )
}

function Separator() {
  return (
    <div className="flex flex-col gap-2 md:gap-4 px-1 md:px-2">
      <div className="w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4 rounded-full bg-red-400 animate-pulse" />
      <div className="w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4 rounded-full bg-red-500 animate-pulse delay-500" />
    </div>
  )
}
