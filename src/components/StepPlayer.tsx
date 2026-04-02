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
    <div className="w-full bg-white rounded-lg shadow-lg p-4 md:p-6">
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
        {/* 标题 - 做什么 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm font-semibold">
            第 {currentStep + 1} 步
          </span>
          <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
        </div>
        
        {/* 讲解 - 为什么 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-3">
          <div className="text-sm text-blue-600 font-semibold mb-2">📖 讲解：</div>
          <div className="prose text-gray-700 whitespace-pre-wrap">{step.content}</div>
        </div>
        
        {/* 结论 - 得出什么 */}
        {step.conclusion && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded p-3">
            <div className="text-sm text-green-600 font-semibold mb-1">✅ 结论：</div>
            <div className="text-gray-800 font-medium">{step.conclusion}</div>
          </div>
        )}
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
