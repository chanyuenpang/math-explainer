import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface Step {
  id: number;
  title: string;
  content: string;
  highlight?: string[];
}

interface StepPlayerProps {
  steps: Step[];
  onComplete?: () => void;
}

export function StepPlayer({ steps, onComplete }: StepPlayerProps) {
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
      setCurrentStep(c => c + 1);
    } else {
      setIsPlaying(false);
      onComplete?.();
    }
  };

  const playPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(c => c - 1);
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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          步骤 {currentStep + 1} / {steps.length}
        </span>
        <div className="flex gap-2">
          <button onClick={playPrev} disabled={currentStep === 0}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">上一步</button>
          <button onClick={playAll}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
            {isPlaying ? '播放中...' : '播放全部'}
          </button>
          <button onClick={playNext} disabled={currentStep === steps.length - 1}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50">下一步</button>
        </div>
      </div>

      <div ref={contentRef} className="mb-6">
        <h3 className="text-xl font-bold mb-3">{step.title}</h3>
        <div className="prose whitespace-pre-wrap">{step.content}</div>
      </div>

      {/* 进度条 */}
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded ${i <= currentStep ? 'bg-blue-500' : 'bg-gray-200'}`} />
        ))}
      </div>
    </div>
  );
}
