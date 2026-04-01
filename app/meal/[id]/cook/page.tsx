"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import recipesData from "@/data/recipes.json";

interface Step { id: number; title: string; instruction: string; timerSeconds?: number; }
interface Recipe { id: string; title: string; emoji: string; steps: Step[]; }

export default function CookPage() {
  const { id } = useParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const recipe = (recipesData as Recipe[]).find((r) => r.id === id);

  useEffect(() => {
    if (timerRunning && timeLeft !== null && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft((t) => (t ?? 0) - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerRunning(false);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning, timeLeft]);

  if (!recipe) return <div style={{ padding: 20, fontFamily: "'Nunito', sans-serif" }}>Recipe not found</div>;

  const step = recipe.steps[currentStep];
  const isLast = currentStep === recipe.steps.length - 1;
  const progress = ((currentStep + 1) / recipe.steps.length) * 100;

  function startTimer() {
    if (step.timerSeconds) {
      setTimeLeft(step.timerSeconds);
      setTimerRunning(true);
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function nextStep() {
    setTimeLeft(null);
    setTimerRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isLast) { router.push(`/meal/${id}`); }
    else setCurrentStep((s) => s + 1);
  }

  function prevStep() {
    setTimeLeft(null);
    setTimerRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrentStep((s) => s - 1);
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f0e8de" }}>
        <button onClick={() => router.push(`/meal/${id}`)} style={{ background: "none", border: "none", fontSize: 13, fontWeight: 700, color: "#c09878", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Exit</button>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d" }}>{recipe.emoji} {recipe.title}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#c09878" }}>{currentStep + 1}/{recipe.steps.length}</div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: "#f0e8de" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "#e8470d", transition: "width 0.3s ease" }} />
      </div>

      {/* Step content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 24px" }}>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 12 }}>Step {step.id} of {recipe.steps.length}</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#3a1f0d", margin: "0 0 16px", lineHeight: 1.3 }}>{step.title}</h2>
        <p style={{ fontSize: 16, color: "#6b4c30", fontWeight: 600, lineHeight: 1.7, margin: 0 }}>{step.instruction}</p>

        {/* Timer */}
        {step.timerSeconds && (
          <div style={{ marginTop: 32, textAlign: "center" }}>
            {timeLeft !== null ? (
              <div>
                <div style={{ fontSize: 56, fontWeight: 800, color: timeLeft === 0 ? "#2d6a3f" : "#e8470d", marginBottom: 12 }}>
                  {timeLeft === 0 ? "Done! ✓" : formatTime(timeLeft)}
                </div>
                {!timerRunning && timeLeft > 0 && (
                  <button onClick={() => setTimerRunning(true)} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#e8470d", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Resume</button>
                )}
                {timerRunning && (
                  <button onClick={() => setTimerRunning(false)} style={{ padding: "10px 24px", borderRadius: 10, border: "1.5px solid #e8d8c8", background: "#fff", color: "#c09878", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Pause</button>
                )}
              </div>
            ) : (
              <button onClick={startTimer} style={{ padding: "14px 32px", borderRadius: 12, border: "none", background: "#fff8f4", color: "#e8470d", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", border: "1.5px solid #fad8c8" }}>
                Start timer — {formatTime(step.timerSeconds)}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ padding: "16px 20px 80px", display: "flex", gap: 10, borderTop: "1px solid #f0e8de" }}>
        {currentStep > 0 && (
          <button onClick={prevStep} style={{ flex: 1, padding: "14px", borderRadius: 12, border: "1.5px solid #e8d8c8", background: "#fff", color: "#c09878", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Back</button>
        )}
        <button onClick={nextStep} style={{ flex: 2, padding: "14px", borderRadius: 12, border: "none", background: "#e8470d", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
          {isLast ? "Finish cooking ✓" : "Next step →"}
        </button>
      </div>
    </main>
  );
}

