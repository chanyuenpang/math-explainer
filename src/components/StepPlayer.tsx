import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface Step {
  id: number;
  title: string;         // 做什么
  content: string;       // 为什么（详细讲解）
  conclusion?: string;   // 得出什么（结论）
  highlight?: string[];
}

interface StepPlayerProps {
  steps: Step[];
  onComplete?: () => void;
  onStepChange?: (step: number) => void;
}

export function StepPlayer({ steps, onComplete, onStepChange }: StepPlayerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [currentStep]);

  const playNext = () => {
    if (currentStep < steps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    } else {
      setIsPlaying(false);
      onComplete?.();
    }
  };

  const playPrev = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const playAll = () => {
    setIsPlaying(true);
    setCurrentStep(0);
  };

  // 自动播放逻辑
  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(playNext, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isPlaying]);

  const step = steps[currentStep];

  return (
    <div className="w-full bg-white rounded-t-lg shadow-lg border-t border-gray-200 p-2 md:p-3 shrink-0 z-40">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <span className="text-sm text-gray-500 font-medium">
          步骤 {currentStep + 1} / {steps.length}
        </span>
        <div className="flex gap-1.5">
          <button onClick={playPrev} disabled={currentStep === 0}
            className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            上一步
          </button>
          <button onClick={playAll}
            className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-all text-sm font-medium flex items-center gap-1 shadow-sm">
            {isPlaying ? (
              <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg> 暂停</>
            ) : (
              <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> 播放</>
            )}
          </button>
          <button onClick={playNext} disabled={currentStep === steps.length - 1}
            className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center gap-1 shadow-sm">
            下一步
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* 进度条 */}
      <div className="flex gap-1 mt-3">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= currentStep ? 'bg-blue-500' : 'bg-gray-200'}`} />
        ))}
      </div>
      
      <div style={{ position: 'fixed', bottom: 8, right: 8, fontSize: 11, color: '#9CA3AF', zIndex: 9999 }}>
        v2026.04.03-0146
      </div>
    </div>
  );
}
