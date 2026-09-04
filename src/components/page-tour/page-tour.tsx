import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, X, Lightbulb, RotateCcw } from "lucide-react";
import { getTourConfig, type TourStep, type PageTourConfig } from "./tour-steps";

function getStorageKey(route: string, role: string): string {
  return `habico_tour_seen_${route}_${role}`;
}

function hasTourBeenSeen(route: string, role: string): boolean {
  try {
    return localStorage.getItem(getStorageKey(route, role)) === "1";
  } catch {
    return false;
  }
}

function markTourSeen(route: string, role: string): void {
  try {
    localStorage.setItem(getStorageKey(route, role), "1");
  } catch {
    // ignore
  }
}

function clearTourSeen(route: string, role: string): void {
  try {
    localStorage.removeItem(getStorageKey(route, role));
  } catch {
    // ignore
  }
}

function getSpotlightRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

interface PageTourProps {
  route: string;
  role: string;
  autoStart?: boolean;
}

export function PageTour({ route, role, autoStart = true }: PageTourProps) {
  const config = getTourConfig(route);
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [spotlight, setSpotlight] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const configRef = useRef(config);
  configRef.current = config;

  const startTour = useCallback(() => {
    setStepIdx(0);
    setActive(true);
  }, []);

  useEffect(() => {
    if (!autoStart || !config) return;
    if (hasTourBeenSeen(route, role)) return;
    const timer = setTimeout(() => startTour(), 600);
    return () => clearTimeout(timer);
  }, [autoStart, config, route, role, startTour]);

  useEffect(() => {
    if (!active || !config) return;
    const step = config.steps[stepIdx];
    if (!step) {
      setActive(false);
      markTourSeen(route, role);
      return;
    }
    const update = () => {
      const rect = getSpotlightRect(step.selector);
      setSpotlight(rect);
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active, stepIdx, config, route, role]);

  const close = () => {
    setActive(false);
    markTourSeen(route, role);
  };

  const next = () => {
    if (!config) return;
    if (stepIdx >= config.steps.length - 1) {
      close();
    } else {
      setStepIdx(stepIdx + 1);
    }
  };

  const prev = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  };

  if (!config) return null;

  return (
    <>
      {!active && (
        <button
          onClick={() => { clearTourSeen(route, role); startTour(); }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          title="Start page tour"
        >
          <Lightbulb className="h-4 w-4" />
          <span className="hidden sm:inline">Page Tour</span>
        </button>
      )}
      {active && (
        <>
          <div className="fixed inset-0 z-[99] bg-black/40 transition-opacity" onClick={close} />
          {spotlight && (
            <div
              className="fixed z-[100] rounded-lg ring-2 ring-accent ring-offset-2 transition-all duration-300"
              style={{
                top: spotlight.top - 6,
                left: spotlight.left - 6,
                width: spotlight.width + 12,
                height: spotlight.height + 12,
              }}
            />
          )}
          <div className="fixed inset-0 z-[101] pointer-events-none flex items-center justify-center">
            <TourTooltip
              ref={tooltipRef}
              config={config}
              stepIdx={stepIdx}
              spotlight={spotlight}
              onNext={next}
              onPrev={prev}
              onClose={close}
            />
          </div>
        </>
      )}
    </>
  );
}

interface TourTooltipProps {
  config: PageTourConfig;
  stepIdx: number;
  spotlight: DOMRect | null;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

import { forwardRef } from "react";

const TourTooltip = forwardRef<HTMLDivElement, TourTooltipProps>(
  ({ config, stepIdx, spotlight, onNext, onPrev, onClose }, ref) => {
    const step = config.steps[stepIdx];
    if (!step) return null;

    const totalSteps = config.steps.length;
    const progress = ((stepIdx + 1) / totalSteps) * 100;

    let tooltipStyle: React.CSSProperties = {
      position: "fixed",
      zIndex: 102,
      maxWidth: 420,
      width: "90vw",
    };

    if (spotlight) {
      const placement = step.placement ?? "bottom";
      if (placement === "bottom") {
        tooltipStyle.top = spotlight.bottom + 16;
        tooltipStyle.left = Math.max(16, Math.min(spotlight.left, window.innerWidth - 440));
      } else if (placement === "top") {
        tooltipStyle.bottom = window.innerHeight - spotlight.top + 16;
        tooltipStyle.left = Math.max(16, Math.min(spotlight.left, window.innerWidth - 440));
      } else if (placement === "right") {
        tooltipStyle.top = Math.max(16, Math.min(spotlight.top, window.innerHeight - 300));
        tooltipStyle.left = spotlight.right + 16;
      } else {
        tooltipStyle.top = Math.max(16, Math.min(spotlight.top, window.innerHeight - 300));
        tooltipStyle.right = window.innerWidth - spotlight.left + 16;
      }
    } else {
      tooltipStyle.top = "30%";
      tooltipStyle.left = "50%";
      tooltipStyle.transform = "translateX(-50%)";
    }

    return (
      <div ref={ref} style={tooltipStyle} className="pointer-events-auto">
        <Card className="shadow-2xl border-accent/30 overflow-hidden">
          <div className="bg-accent/10 px-5 pt-4 pb-3 border-b">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                {config.title} — Step {stepIdx + 1} of {totalSteps}
              </span>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="w-full bg-accent/20 rounded-full h-1 mt-2">
              <div className="bg-accent h-1 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            <h3 className="text-base font-bold text-foreground">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.content}</p>
            {step.example && (
              <div className="rounded-md bg-accent/5 border border-accent/20 p-3">
                <p className="text-xs font-semibold text-accent mb-1">Example</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.example}</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/30">
            <Button variant="ghost" size="sm" onClick={onPrev} disabled={stepIdx === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex gap-1">
              {config.steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === stepIdx ? "w-6 bg-accent" : i < stepIdx ? "w-1.5 bg-accent/50" : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>
            <Button size="sm" onClick={onNext} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {stepIdx === totalSteps - 1 ? "Finish" : "Next"}
              {stepIdx < totalSteps - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </Card>
      </div>
    );
  }
);

TourTooltip.displayName = "TourTooltip";

export function TourResetButton({ route, role }: { route: string; role: string }) {
  const resetTour = () => {
    clearTourSeen(route, role);
  };
  return (
    <button onClick={resetTour} className="text-xs text-muted-foreground hover:text-foreground" title="Reset tour">
      <RotateCcw className="h-3 w-3" />
    </button>
  );
}
