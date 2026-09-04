import { useState, useRef } from "react"

const slides = [
  {
    icon: "H",
    title: "Welcome to Habico",
    subtitle: "Elevate the Value of Your Residences",
    body: "The all-in-one platform for property managers, landlords, and tenants. Manage, track, and grow — all from one place.",
  },
  {
    icon: "🏠",
    title: "Manage Everything",
    subtitle: "Properties, Tenants & Finances",
    body: "Track rent payments, manage maintenance requests, communicate with tenants, and generate reports — all in real time.",
  },
  {
    icon: "📊",
    title: "Smart Insights",
    subtitle: "Data-Driven Decisions",
    body: "Get clear dashboards with occupancy rates, revenue trends, and expense tracking. Know your portfolio inside out.",
  },
]

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const touchX = useRef(0)

  function next() {
    if (step < slides.length - 1) {
      setStep(step + 1)
    } else {
      onDone()
    }
  }

  function prev() {
    if (step > 0) setStep(step - 1)
  }

  function skip() {
    onDone()
  }

  const s = slides[step]

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touchX.current
        if (dx > 60) prev()
        else if (dx < -60) next()
      }}
    >
      <div className="flex justify-end px-4 pt-3 pb-0 sm:px-6 sm:pt-4">
        <button onClick={skip} className="text-xs font-medium text-muted-foreground hover:text-foreground sm:text-sm">
          Skip
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center sm:px-8">
        {step === 0 ? (
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-teal-500 to-emerald-600 text-4xl font-black text-white shadow-lg sm:mb-8 sm:h-24 sm:w-24 sm:rounded-[28px] sm:text-5xl">
            H
          </div>
        ) : (
          <div className="mb-6 text-5xl sm:mb-8 sm:text-7xl">{s.icon}</div>
        )}
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">{s.title}</h2>
        <p className="mt-1.5 text-xs font-medium text-teal-500 sm:mt-2 sm:text-sm">{s.subtitle}</p>
        <p className="mt-3 max-w-[280px] text-xs leading-relaxed text-muted-foreground sm:mt-4 sm:max-w-xs sm:text-sm">{s.body}</p>
      </div>

      <div className="px-6 pb-2 sm:px-8">
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 sm:h-2 ${i === step ? "w-6 bg-teal-500 sm:w-8" : "w-1.5 bg-muted-foreground/20 sm:w-2"}`}
            />
          ))}
        </div>
      </div>

      <div className="px-6 pb-10 pt-5 sm:px-8 sm:pb-12 sm:pt-6">
        <button
          onClick={next}
          className="flex w-full items-center justify-center rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 active:scale-[0.98] sm:py-3.5 sm:text-base"
        >
          {step < slides.length - 1 ? "Next" : "Get Started"}
        </button>
      </div>
    </div>
  )
}