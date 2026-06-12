import { useState, useEffect, useCallback } from "react";
import { Scenario, ScenarioStep, scenarios } from "../data/scenarios";

export const useSimulation = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0].id);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isAutoplay, setIsAutoplay] = useState<boolean>(false);

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];
  const currentStep: ScenarioStep = currentScenario.steps[currentStepIndex];

  const selectScenario = useCallback((id: string) => {
    setSelectedScenarioId(id);
    setCurrentStepIndex(0);
    setIsAutoplay(false);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev < currentScenario.steps.length - 1) {
        return prev + 1;
      }
      setIsAutoplay(false); // Stop autoplay when reaching the end
      return prev;
    });
  }, [currentScenario.steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const resetSimulation = useCallback(() => {
    setCurrentStepIndex(0);
    setIsAutoplay(false);
  }, []);

  // Autoplay effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAutoplay) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < currentScenario.steps.length - 1) {
            return prev + 1;
          } else {
            setIsAutoplay(false);
            return prev;
          }
        });
      }, 6500); // 6.5s per step to allow logs to be parsed and chat to be read
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoplay, currentScenario.steps.length]);

  return {
    scenarios,
    currentScenario,
    currentStep,
    currentStepIndex,
    totalSteps: currentScenario.steps.length,
    isAutoplay,
    setIsAutoplay,
    selectScenario,
    nextStep,
    prevStep,
    resetSimulation,
    setCurrentStepIndex,
  };
};
