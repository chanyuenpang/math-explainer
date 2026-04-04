import { describe, it, expect } from 'vitest';
import { convertStepAnimationToIntents } from '../geometry-engine';
import math001 from '../../data/problems/math-001.json';

describe('Snapshot Tests: convertStepAnimationToIntents for math-001', () => {
  it('should match snapshot for step 0: draw edges', () => {
    const stepAnimation = math001.stepAnimations[0];
    const intents = convertStepAnimationToIntents(stepAnimation as Record<string, any>);
    expect(intents).toMatchSnapshot();
  });

  it('should match snapshot for step 1: flash angle A', () => {
    const stepAnimation = math001.stepAnimations[1];
    const intents = convertStepAnimationToIntents(stepAnimation as Record<string, any>);
    expect(intents).toMatchSnapshot();
  });

  it('should match snapshot for step 2: flash angle BCD', () => {
    const stepAnimation = math001.stepAnimations[2];
    const intents = convertStepAnimationToIntents(stepAnimation as Record<string, any>);
    expect(intents).toMatchSnapshot();
  });

  it('should match snapshot for step 3: flyout compare BC=CD', () => {
    const stepAnimation = math001.stepAnimations[3];
    const intents = convertStepAnimationToIntents(stepAnimation as Record<string, any>);
    expect(intents).toMatchSnapshot();
  });

  it('should match snapshot for step 4: draw edge DE and highlights', () => {
    const stepAnimation = math001.stepAnimations[4];
    const intents = convertStepAnimationToIntents(stepAnimation as Record<string, any>);
    expect(intents).toMatchSnapshot();
  });

  it('should match snapshot for step 5: flyout compare AB=DE', () => {
    const stepAnimation = math001.stepAnimations[5];
    const intents = convertStepAnimationToIntents(stepAnimation as Record<string, any>);
    expect(intents).toMatchSnapshot();
  });

  it('should match snapshot for step 6: flash angles A and BCD', () => {
    const stepAnimation = math001.stepAnimations[6];
    const intents = convertStepAnimationToIntents(stepAnimation as Record<string, any>);
    expect(intents).toMatchSnapshot();
  });

  it('should match snapshot for step 7: flash angles ABC and ADC', () => {
    const stepAnimation = math001.stepAnimations[7];
    const intents = convertStepAnimationToIntents(stepAnimation as Record<string, any>);
    expect(intents).toMatchSnapshot();
  });

  it('should match snapshot for step 8: flash angles ADC and EDC', () => {
    const stepAnimation = math001.stepAnimations[8];
    const intents = convertStepAnimationToIntents(stepAnimation as Record<string, any>);
    expect(intents).toMatchSnapshot();
  });

  it('should match snapshot for step 9: flash angles ABC and EDC', () => {
    const stepAnimation = math001.stepAnimations[9];
    const intents = convertStepAnimationToIntents(stepAnimation as Record<string, any>);
    expect(intents).toMatchSnapshot();
  });

  it('should match snapshot for step 10: highlight edges AB and DE', () => {
    const stepAnimation = math001.stepAnimations[10];
    const intents = convertStepAnimationToIntents(stepAnimation as Record<string, any>);
    expect(intents).toMatchSnapshot();
  });

  it('should match snapshot for step 11: highlight edges and fill triangle ABC', () => {
    const stepAnimation = math001.stepAnimations[11];
    const intents = convertStepAnimationToIntents(stepAnimation as Record<string, any>);
    expect(intents).toMatchSnapshot();
  });

  it('should match snapshot for step 12: highlight edges, show equal marks, fill triangle EDC', () => {
    const stepAnimation = math001.stepAnimations[12];
    const intents = convertStepAnimationToIntents(stepAnimation as Record<string, any>);
    expect(intents).toMatchSnapshot();
  });

  it('should match snapshot for step 13: fill triangles ABC and EDC', () => {
    const stepAnimation = math001.stepAnimations[13];
    const intents = convertStepAnimationToIntents(stepAnimation as Record<string, any>);
    expect(intents).toMatchSnapshot();
  });

  it('should match snapshot for step 14: highlight edges and fill both triangles', () => {
    const stepAnimation = math001.stepAnimations[14];
    const intents = convertStepAnimationToIntents(stepAnimation as Record<string, any>);
    expect(intents).toMatchSnapshot();
  });
});
