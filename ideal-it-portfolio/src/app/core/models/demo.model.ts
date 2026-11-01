export type DemoStatus = 'live' | 'mvp' | 'planned' | 'coming-soon' | 'landing';

export interface Demo {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  technologies: string[];
  status: DemoStatus;
  sourcePaths: string[];
  previewPath?: string;
  previewUrl?: string;
}

export interface DemoApiSample {
  userId: number;
  id: number;
  title: string;
  body: string;
}
