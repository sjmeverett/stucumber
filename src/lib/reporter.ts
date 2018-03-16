import {
  FeatureContext,
  ScenarioContext,
  ScenarioContextStep
} from './cucumber';
import * as path from 'path';

export interface ReportElement {
  name: string;
  description?: string;
  uri?: string;
  id: string;
  keyword: string;
  elements?: ReportElement[];
  steps?: ReportStep[];
  tags: ReportTag[];
}

export interface ReportTag {
  name: string;
}

export interface ReportStep extends ScenarioContextStep {
  result: ReportStepResult;
}

export interface ReportStepResult {
  status: string;
  duration?: number;
  error_message?: string;
}

export default class Reporter {
  results: ReportElement[];
  currentFeature: ReportElement;
  currentScenario: ReportElement;
  currentStep: number;
  private timestamp: number;

  constructor() {
    this.results = [];
  }

  startFeature(feature: FeatureContext) {
    this.currentFeature = {
      name: feature.name,
      description: '',
      uri: path.relative(process.cwd(), feature.filename),
      id: feature.name.replace(/ /g, '-'),
      keyword: 'Feature',
      tags: feature.annotations.map(annotation => ({ name: annotation.name })),
      elements: []
    };

    this.results.push(this.currentFeature);
  }

  startScenario(scenario: ScenarioContext) {
    this.currentScenario = {
      name: scenario.name,
      id: `${scenario.feature.name};${scenario.name}`.replace(/ /g, '-'),
      keyword: 'Scenario',
      tags: scenario.annotations.map(annotation => ({ name: annotation.name })),
      steps: scenario.steps.map(step => ({
        ...step,
        result: { status: 'skipped' }
      }))
    };

    this.currentFeature.elements.push(this.currentScenario);
    this.currentStep = 0;
    this.timestamp = Date.now();
  }

  private getStep(name: string) {
    if (!this.currentScenario) return null;
    const step = this.currentScenario.steps[this.currentStep];

    if (!step || step.name !== name) {
      return null;
    }

    this.currentStep++;
    return step;
  }

  private getDuration() {
    const now = Date.now();
    const time = now - this.timestamp;
    this.timestamp = now;
    return time;
  }

  passStep(name: string) {
    const step = this.getStep(name);
    if (!step) return;

    step.result.status = 'passed';
    step.result.duration = this.getDuration();
  }

  failStep(name: string, message: string) {
    const step = this.getStep(name);
    if (!step) return;

    step.result.status = 'failed';
    step.result.duration = this.getDuration();
    step.result.error_message = message;
  }

  getResults() {
    return this.results;
  }
}
