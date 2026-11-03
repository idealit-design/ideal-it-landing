export type DemoStatus = 'live' | 'mvp' | 'planned' | 'coming-soon' | 'landing';
export type DemoServiceType = 'development' | 'application' | 'commercial-page' | 'utility';
export type DemoAvailability = 'vm-private' | 'planned';

export interface Demo {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  technologies: string[];
  status: DemoStatus;
  serviceType: DemoServiceType;
  hasDemo: boolean;
  isPreview: boolean;
  hasBackend: boolean;
  availability?: DemoAvailability;
  availabilityNote?: string;
  sourcePaths: string[];
  monitorId?: string;
  previewPath?: string;
  previewUrl?: string;
}
