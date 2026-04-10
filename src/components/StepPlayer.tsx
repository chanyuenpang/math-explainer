import { useState, useEffect, useRef } from 'react';
import { version } from '../../package.json';
import { gsap } from 'gsap';
import { renderMathText } from '../lib/katex-renderer';
import 'katex/dist/katex.min.css';

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

  const togglePlay = () => {
    if (isPlaying) {
      // 暂停：停止自动播放，不重置步骤
      setIsPlaying(false);
    } else {
      // 播放：从当前步骤继续；如果已在第0步则从头开始
      setIsPlaying(true);
    }
  };

  // 自动播放逻辑
  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(playNext, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isPlaying]);

  // 键盘支持：左右箭头切换步骤，空格键播放/暂停
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略当焦点在输入框等元素上时
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
        e.preventDefault();
        playPrev();
      } else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
        e.preventDefault();
        playNext();
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, isPlaying, steps.length]);

  const step = steps[currentStep];

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-2 shrink-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500 font-medium">
          步骤 {currentStep + 1} / {steps.length}
        </span>
        <div className="flex gap-1.5">
          <button onClick={playPrev} disabled={currentStep === 0} aria-label="上一步"
            className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            上一步
          </button>
          <button onClick={togglePlay} aria-label={isPlaying ? '暂停' : '播放'}
            className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-all text-sm font-medium flex items-center gap-1 shadow-sm">
            {isPlaying ? (
              <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg> 暂停</>
            ) : (
              <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> 播放</>
            )}
          </button>
          <button onClick={playNext} disabled={currentStep === steps.length - 1} aria-label="下一步"
            className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center gap-1 shadow-sm">
            下一步
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* 步骤内容 */}
      <div ref={contentRef} className="mt-3">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">{step.title}</h3>
        <div
          className="text-sm text-gray-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderMathText(step.content) }}
        />
        {step.conclusion && (
          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
            <span className="text-xs font-medium text-blue-700">结论：</span>
            <span
              className="text-sm text-blue-800"
              dangerouslySetInnerHTML={{ __html: renderMathText(step.conclusion!) }}
            />
          </div>
        )}
      </div>

      {/* 进度条 */}
      <div 
        className="flex gap-1 mt-3" 
        role="progressbar" 
        aria-valuenow={currentStep + 1} 
        aria-valuemin={1} 
        aria-valuemax={steps.length}
        aria-label={`步骤进度：${currentStep + 1} / ${steps.length}`}
      >
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= currentStep ? 'bg-blue-500' : 'bg-gray-200'}`} />
        ))}
      </div>
      
      <div className="text-[10px] text-gray-400 text-right mt-1">
        v{version}
      </div>
    </div>
  );
}
