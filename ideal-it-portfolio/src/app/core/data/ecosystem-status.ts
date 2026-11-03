export type EcosystemStatus = 'online' | 'degraded' | 'offline';

export interface EcosystemService {
  id: string;
  name: string;
  port: number | null;
  pattern: string;
  status: EcosystemStatus;
  landingDemoId?: string;
}

export const ECOSYSTEM_SURVEY_AT = '2026-11-02T03:46:23.724876+00:00';

export const ECOSYSTEM_SERVICES: EcosystemService[] = [
  { id: 'app-alantia-frigorifico', name: 'ALANTIA Frigorífico', port: 8012, pattern: 'Docker Container', status: 'online', landingDemoId: 'frigorifico-trazabilidad' },
  { id: 'app-portal-ciudadano', name: 'Portal Ciudadano', port: 8013, pattern: 'Docker Container', status: 'offline', landingDemoId: 'portal-ciudadano' },
  { id: 'app-valentin-cripto', name: 'Valentín Cripto', port: 8014, pattern: 'Docker Container', status: 'online', landingDemoId: 'valentin-cripto' },
  { id: 'mvp-agrotech-iot', name: 'AgroTech IoT', port: 8015, pattern: 'Docker Container', status: 'online', landingDemoId: 'agrotech-iot' },
  { id: 'mvp-agrotech-postgres', name: 'AgroTech PostgreSQL', port: null, pattern: 'Docker Container', status: 'offline' },
  { id: 'mvp-auditoria', name: 'Auditoría HealthCore', port: 8016, pattern: 'Docker Container', status: 'offline', landingDemoId: 'auditoria-healthcore' },
  { id: 'mvp-formularios', name: 'Formularios & Turismo', port: 8017, pattern: 'Docker Container', status: 'offline', landingDemoId: 'formularios-turismo' },
  { id: 'mvp-logistica-fleet', name: 'Logística Fleet', port: 8018, pattern: 'Systemd Daemon', status: 'online', landingDemoId: 'logistica-fleet' },
  { id: 'mvp-osma-inspecciones', name: 'OSMA Inspecciones', port: 8019, pattern: 'Docker Container', status: 'offline', landingDemoId: 'osma-inspecciones' },
  { id: 'service-mcp-gateway', name: 'MCP Gateway', port: 8020, pattern: 'MCP Isolated', status: 'offline' },
  { id: 'mvp-personal', name: 'Gestión de Personal', port: 8021, pattern: 'Docker Container', status: 'online', landingDemoId: 'personal-biometrico' },
  { id: 'mvp-visitor-pass', name: 'Visitor Pass', port: 8022, pattern: 'Systemd Daemon', status: 'online', landingDemoId: 'visitor-pass' },
  { id: 'service-devops-monitor', name: 'DevOps Monitor', port: 8023, pattern: 'Systemd Daemon', status: 'online' },
  { id: 'service-synthetic-factory', name: 'Synthetic Factory', port: 8024, pattern: 'Docker Container', status: 'online' },
  { id: 'web-pos-comercial', name: 'POS Comercial', port: 8027, pattern: 'Docker Container', status: 'online', landingDemoId: 'pos-comercio' },
  { id: 'web-tienda-virtual', name: 'Tienda Virtual', port: 8028, pattern: 'Docker Container', status: 'online', landingDemoId: 'tienda-virtual' },
  { id: 'idealit-hub-web-landing-municipal', name: 'Landing municipal', port: 8080, pattern: 'Static CDN', status: 'online', landingDemoId: 'municipium-landing' },
  { id: 'service-docs-hub-automator', name: 'Docs Hub Automator', port: null, pattern: 'CLI Runner', status: 'offline' },
];

export const ECOSYSTEM_COUNTS = {
  online: ECOSYSTEM_SERVICES.filter((service) => service.status === 'online').length,
  degraded: ECOSYSTEM_SERVICES.filter((service) => service.status === 'degraded').length,
  offline: ECOSYSTEM_SERVICES.filter((service) => service.status === 'offline').length,
};
