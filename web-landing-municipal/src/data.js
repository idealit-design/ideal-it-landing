import {
  Building2,
  BusFront,
  HeartPulse,
  Leaf,
  MapPin,
  ShieldCheck,
} from 'lucide-react'

export const budgetViews = {
  Ingresos: [
    { label: 'Tasas y contribuciones', amount: '$ 4.280 M', percentage: 51, color: 'blue' },
    { label: 'Coparticipación', amount: '$ 2.860 M', percentage: 34, color: 'mint' },
    { label: 'Otros ingresos', amount: '$ 1.280 M', percentage: 15, color: 'yellow' },
  ],
  'En qué invertimos': [
    { label: 'Servicios y mantenimiento', amount: '$ 3.116 M', percentage: 37, color: 'blue' },
    { label: 'Obras públicas', amount: '$ 2.358 M', percentage: 28, color: 'mint' },
    { label: 'Salud y desarrollo social', amount: '$ 1.768 M', percentage: 21, color: 'yellow' },
    { label: 'Educación y cultura', amount: '$ 1.178 M', percentage: 14, color: 'coral' },
  ],
  'Obras públicas': [
    { label: 'Pavimentación y veredas', amount: '$ 1.010 M', percentage: 43, color: 'blue' },
    { label: 'Alumbrado LED', amount: '$ 668 M', percentage: 28, color: 'mint' },
    { label: 'Espacios verdes', amount: '$ 420 M', percentage: 18, color: 'yellow' },
    { label: 'Agua y saneamiento', amount: '$ 260 M', percentage: 11, color: 'coral' },
  ],
}

export const services = [
  {
    id: 'licencias',
    name: 'Licencias de conducir',
    category: 'Trámites',
    description: 'Renová o solicitá tu licencia. Consultá requisitos y turnos disponibles.',
    location: 'Centro Cívico · Planta baja',
    hours: 'Lun a vie · 8:00 a 14:00',
    icon: ShieldCheck,
    tone: 'sky',
  },
  {
    id: 'salud',
    name: 'Centros de salud',
    category: 'Salud',
    description: 'Encontrá tu centro de atención, especialidades y horarios de guardia.',
    location: '6 centros en la ciudad',
    hours: 'Atención según sede',
    icon: HeartPulse,
    tone: 'rose',
  },
  {
    id: 'comercios',
    name: 'Habilitación comercial',
    category: 'Trámites',
    description: 'Iniciá la habilitación de tu comercio y seguí el estado del trámite.',
    location: 'Centro Cívico · Oficina 12',
    hours: 'Lun a vie · 8:00 a 13:00',
    icon: Building2,
    tone: 'lilac',
  },
  {
    id: 'transporte',
    name: 'Transporte público',
    category: 'Ciudad',
    description: 'Recorridos, paradas y horarios actualizados de las líneas urbanas.',
    location: 'Recorridos y paradas',
    hours: 'Servicio todos los días',
    icon: BusFront,
    tone: 'amber',
  },
  {
    id: 'ambiente',
    name: 'Ambiente y reciclaje',
    category: 'Ciudad',
    description: 'Puntos verdes, calendario de recolección y consejos para separar residuos.',
    location: 'Puntos verdes municipales',
    hours: 'Lun a sáb · 8:00 a 18:00',
    icon: Leaf,
    tone: 'green',
  },
  {
    id: 'espacios',
    name: 'Espacios públicos',
    category: 'Ciudad',
    description: 'Conocé plazas, parques, polideportivos y sus actividades abiertas.',
    location: 'Mapa de espacios municipales',
    hours: 'Acceso libre',
    icon: MapPin,
    tone: 'blue',
  },
]

export const news = [
  {
    id: 'plaza',
    category: 'OBRAS',
    date: '29 OCT 2026',
    title: 'La Plaza del Encuentro renueva sus juegos y suma más espacios verdes',
    summary: 'Comenzaron los trabajos de puesta en valor de uno de los espacios más queridos del barrio.',
    readTime: '3 min de lectura',
    color: 'news-green',
  },
  {
    id: 'vacunacion',
    category: 'SALUD',
    date: '24 OCT 2026',
    title: 'Nueva jornada de vacunación gratuita en los barrios',
    summary: 'El equipo de salud recorre la ciudad con todas las vacunas del calendario nacional.',
    readTime: '2 min de lectura',
    color: 'news-blue',
  },
  {
    id: 'cultura',
    category: 'CULTURA',
    date: '17 OCT 2026',
    title: 'Llega el ciclo de primavera con música y teatro para toda la familia',
    summary: 'Una agenda de actividades gratuitas para disfrutar al aire libre en los espacios culturales.',
    readTime: '4 min de lectura',
    color: 'news-orange',
  },
]

export const procedures = [
  { title: 'Pagar tasas', detail: 'Consultá y pagá tus tasas municipales', icon: 'receipt' },
  { title: 'Solicitar un turno', detail: 'Elegí día y horario para atención presencial', icon: 'calendar' },
  { title: 'Hacer un reclamo', detail: 'Contanos qué necesita mejorar en tu barrio', icon: 'message' },
]
