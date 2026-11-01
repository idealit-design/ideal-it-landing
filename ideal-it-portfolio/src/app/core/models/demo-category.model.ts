import { Demo } from './demo.model';

export type DemoCategoryId = 'desarrollos' | 'aplicaciones' | 'paginas-comerciales';

export interface DemoCategory {
  id: DemoCategoryId;
  path: string;
  title: string;
  eyebrow: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  demoIds: Demo['id'][];
}

export const DEMO_CATEGORIES: DemoCategory[] = [
  {
    id: 'desarrollos',
    path: '/categorias/desarrollos',
    title: 'Desarrollos y MVPs Core',
    eyebrow: 'Ingeniería de producto · Sistemas integrados',
    description:
      'Sistemas complejos diseñados para resolver procesos centrales del negocio: auditoría, automatización, gestión y backend integrado. Explorá MVPs y propuestas con alcance y estado documentados.',
    seoTitle: 'Desarrollos y MVPs Core | Ideal-IT',
    seoDescription:
      'Explorá desarrollos de software core de Ideal-IT: sistemas integrados, auditoría, automatización, gestión y propuestas de backend.',
    demoIds: [
      'personal-biometrico',
      'auditoria-healthcore',
      'valentin-cripto',
      'frigorifico-trazabilidad',
      'pos-comercio',
    ],
  },
  {
    id: 'aplicaciones',
    path: '/categorias/aplicaciones',
    title: 'Aplicaciones y Portales',
    eyebrow: 'Herramientas funcionales · Experiencias digitales',
    description:
      'Aplicaciones y portales para operaciones, servicios ciudadanos y trabajo en campo. Incluye soluciones de logística, agro, turismo y herramientas funcionales en distintos estados de implementación.',
    seoTitle: 'Aplicaciones y Portales | Ideal-IT',
    seoDescription:
      'Conocé aplicaciones y portales de Ideal-IT para ciudadanía, logística, agro, turismo, inspecciones y operaciones.',
    demoIds: [
      'formularios-turismo',
      'osma-inspecciones',
      'logistica-fleet',
      'agrotech-iot',
      'visitor-pass',
      'educacion-cientifica',
      'municipium-landing',
    ],
  },
  {
    id: 'paginas-comerciales',
    path: '/categorias/paginas-comerciales',
    title: 'Páginas Comerciales',
    eyebrow: 'Landings de nicho · Comunicación de marca',
    description:
      'Landings y sitios comerciales para gastronomía, autores, oficios, consumo responsable y servicios. Cada propuesta presenta una identidad propia y experiencias demostrativas adaptadas a su audiencia.',
    seoTitle: 'Páginas Comerciales y Landings | Ideal-IT',
    seoDescription:
      'Descubrí páginas comerciales y landings de Ideal-IT para restaurantes, escritores, artesanos, huertas y servicios especializados.',
    demoIds: [
      'idealseo-web',
      'rincon-gourmet',
      'pluma-y-tinta',
      'manos-maestras',
      'ecohuerta-urbana',
      'fixit-express',
    ],
  },
];

export function getDemoCategoryPath(demoId: Demo['id']): string | undefined {
  return DEMO_CATEGORIES.find((category) => category.demoIds.includes(demoId))?.path;
}
