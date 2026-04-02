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
    <div className="w-full bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          步骤 {currentStep + 1} / {steps.length}
        </span>
        <div className="flex gap-2">
          <button onClick={playPrev} disabled={currentStep === 0}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 transition-colors">上一步</button>
          <button onClick={playAll}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            {isPlaying ? '⏸ 暂停' : '▶ 播放全部'}
          </button>
          <button onClick={playNext} disabled={currentStep === steps.length - 1}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors">下一步</button>
        </div>
      </div>

      {/* 进度条 */}
      <div className="flex gap-1 mt-3">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded transition-colors ${i <= currentStep ? 'bg-blue-500' : 'bg-gray-200'}`} />
        ))}
      </div>
      
      {/* 版本号 */}
      <div style={{ position: 'fixed', bottom: 8, right: 8, fontSize: 12, color: '#999', zIndex: 9999 }}>
        v2026.04.03-0100
      </div>
    </div>
  );
}
