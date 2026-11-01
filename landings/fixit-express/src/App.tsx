import { useState, type FormEvent } from 'react';
import {
  ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, BatteryCharging, Check,
  ChevronLeft, ChevronRight, Clock3, Laptop, MapPin, Smartphone, Tablet,
  Wrench, X,
} from 'lucide-react';

const imagePath = (filename: string) => `${import.meta.env.BASE_URL}images/${filename}.webp`;

const devices = [
  { id: 'notebook', label: 'Notebook', icon: Laptop },
  { id: 'celular', label: 'Celular', icon: Smartphone },
  { id: 'tablet', label: 'Tablet', icon: Tablet },
];
const issueOptions: Record<string, { id: string; label: string; price: number }[]> = {
  notebook: [
    { id: 'bateria', label: 'Batería / carga', price: 42000 },
    { id: 'pantalla', label: 'Pantalla rota', price: 68500 },
    { id: 'rendimiento', label: 'Lenta / no inicia', price: 28000 },
    { id: 'teclado', label: 'Teclado / periféricos', price: 35000 },
  ],
  celular: [
    { id: 'bateria', label: 'Batería / carga', price: 32000 },
    { id: 'pantalla', label: 'Pantalla rota', price: 56000 },
    { id: 'rendimiento', label: 'Lenta / no inicia', price: 22000 },
    { id: 'teclado', label: 'Cámara / conectores', price: 29500 },
  ],
  tablet: [
    { id: 'bateria', label: 'Batería / carga', price: 36000 },
    { id: 'pantalla', label: 'Pantalla rota', price: 49000 },
    { id: 'rendimiento', label: 'Lenta / no inicia', price: 24500 },
    { id: 'teclado', label: 'Conector / botones', price: 26000 },
  ],
};
const reviews = [
  ['“Me explicaron todo antes de tocar nada y en dos horas tenía la notebook lista.”', 'Mariana R.', 'Hace 2 semanas'],
  ['“Vinieron a casa, cambiaron la batería y quedó como nueva. Súper claros con el precio.”', 'Diego P.', 'Hace 1 mes'],
  ['“La pantalla del celu quedó impecable y cumplieron con el horario que habíamos acordado.”', 'Paula M.', 'Hace 3 semanas'],
];

function QuoteWizard() {
  const [device, setDevice] = useState('');
  const [issue, setIssue] = useState('');
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const foundIssue = issueOptions[device]?.find((option) => option.id === issue);
  const selectDevice = (value: string) => {
    setDevice(value);
    setIssue('');
    setStep(2);
    setSent(false);
  };
  const selectIssue = (value: string) => {
    setIssue(value);
    setStep(3);
    setSent(false);
  };
  return <section className="quote-card" aria-label="Cotizador de reparación">
    <div className="quote-head"><span className="quote-live"><i /> COTIZACIÓN EXPRESS</span><span className="quote-steps">0{step}<i> / 03</i></span></div>
    <h2>{step === 1 ? '¿Qué se rompió?' : step === 2 ? '¿Qué le pasa?' : 'Este es un buen comienzo.'}</h2>
    <p className="quote-subtitle">Un estimado claro, antes de coordinar.</p>
    {step === 1 && <div className="device-options">{devices.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => selectDevice(id)}><Icon /><span>{label}</span><ArrowRight /></button>)}</div>}
    {step === 2 && <div className="wizard-options"><button className="back-step" onClick={() => setStep(1)}><ChevronLeft size={14} /> Cambiar dispositivo: {devices.find((item) => item.id === device)?.label}</button>{issueOptions[device].map((option) => <button key={option.id} className="issue-option" onClick={() => selectIssue(option.id)}><span>{option.label}</span><ArrowRight size={15} /></button>)}</div>}
    {step === 3 && foundIssue && <div className="estimate"><button className="back-step" onClick={() => setStep(2)}><ChevronLeft size={14} /> Cambiar falla</button><div className="estimate-label"><span>{devices.find((item) => item.id === device)?.label}</span><span>·</span><span>{foundIssue.label}</span></div><strong>$ {foundIssue.price.toLocaleString('es-AR')}</strong><small>Estimado de reparación · repuestos sujetos a diagnóstico</small><button className="quote-submit" onClick={() => setSent(true)}>Solicitar diagnóstico <ArrowRight size={15} /></button>{sent && <p className="quote-success" role="status"><Check size={14} /> Solicitud lista. Un técnico confirmará el valor final después del diagnóstico.</p>}</div>}
    <div className="quote-foot"><BadgeCheck size={14} /> Diagnóstico claro · Sin sorpresas</div>
  </section>;
}

function App() {
  const [review, setReview] = useState(0);
  const [request, setRequest] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatNotice, setChatNotice] = useState(false);
  const sendRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setRequest(`¡Listo, ${String(formData.get('name'))}! Tu solicitud para la franja ${String(formData.get('time'))} quedó registrada en esta demo.`);
    event.currentTarget.reset();
  };
  return <main className="fixit-page min-h-screen bg-[#111824] text-[#e8edf4]">
    <header className="fixit-nav"><a className="fixit-logo" href="#inicio"><span className="fixit-mark"><Wrench /></span><span>fixit<span>express</span><small>SOPORTE QUE SÍ RESPONDE</small></span></a><button className="fixit-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir navegación">☰</button><nav className={menuOpen ? 'fixit-links open' : 'fixit-links'}><a href="#servicios" onClick={() => setMenuOpen(false)}>Servicios</a><a href="#opiniones" onClick={() => setMenuOpen(false)}>Opiniones</a><a href="#solicitud" onClick={() => setMenuOpen(false)}>Cobertura</a><a href="#solicitud" className="nav-contact" onClick={() => setMenuOpen(false)}>Pedir visita <ArrowUpRight size={14} /></a></nav></header>

    <section id="inicio" className="fixit-hero"><div className="hero-glow" /><div className="fixit-hero-copy"><span className="fixit-kicker"><i /> TÉCNICO EN TU CASA · HOY</span><h1>Tu día no<br />se pausa por<br /><em>una pantalla.</em></h1><p>Reparación de celulares y computadoras con diagnóstico transparente, técnicos de confianza y atención en el día.</p><div className="hero-benefits"><span><Clock3 /> Respuesta en 15 min</span><span><BadgeCheck /> 90 días de garantía</span></div><a className="hero-down" href="#servicios">CONOCÉ EL SERVICIO <ArrowDown size={14} /></a></div><div className="hero-visual"><div className="hero-photo"><img src={imagePath('repair')} alt="Técnico especializado trabajando en la reparación de un dispositivo" /></div><div className="floating-status"><span><i /> TÉCNICO DISPONIBLE</span><strong>Hoy · 14:30–16:00</strong><small>Palermo y alrededores</small></div><div className="hero-corner">01 <span>—</span> 03</div></div><QuoteWizard /></section>

    <section id="servicios" className="services"><div className="services-heading"><div><span className="fixit-kicker">CUIDAMOS LO QUE USÁS TODOS LOS DÍAS</span><h2>Arreglarlo debería<br /><em>ser lo más fácil.</em></h2></div><p>Un buen diagnóstico, una solución real y todas las opciones sobre la mesa.</p></div><div className="service-grid"><article><span className="service-icon"><Laptop /></span><span className="service-number">01 / COMPUTADORAS</span><h3>Notebook & PC</h3><p>Baterías, pantallas, sistema operativo, limpieza interna y puesta a punto.</p><a href="#solicitud">Ver opciones <ArrowRight size={14} /></a></article><article><span className="service-icon"><Smartphone /></span><span className="service-number">02 / DISPOSITIVOS MÓVILES</span><h3>Celulares & tablets</h3><p>Pantallas, conectores, baterías y problemas de software, con repuestos de calidad.</p><a href="#solicitud">Ver opciones <ArrowRight size={14} /></a></article><article><span className="service-icon"><BatteryCharging /></span><span className="service-number">03 / HOGAR CONECTADO</span><h3>Smart & accesorios</h3><p>Configuración, redes domésticas y puesta en marcha de tus equipos conectados.</p><a href="#solicitud">Ver opciones <ArrowRight size={14} /></a></article></div></section>

    <section className="fixit-stats"><div><strong>4.8<span>/5</span></strong><small>Valoración promedio</small></div><div><strong>2.4k<span>+</span></strong><small>Equipos recuperados</small></div><div><strong>90<span>d</span></strong><small>Garantía de reparación</small></div><div><strong>15<span>min</span></strong><small>Tiempo de respuesta</small></div></section>

    <section id="opiniones" className="reviews-section"><div className="review-top"><div><span className="fixit-kicker">GENTE REAL, EQUIPOS REALES</span><h2>Nos recomiendan<br /><em>por lo que hacemos.</em></h2></div><div className="google-mark"><span>G</span><div><strong>Google reviews</strong><small>4.8 <i>★★★★★</i> · 286 opiniones</small></div></div></div><article className="google-review"><div className="review-avatar">{reviews[review][1][0]}</div><div className="review-content"><div className="reviewer"><strong>{reviews[review][1]}</strong><BadgeCheck size={14} /><span>· Local Guide</span></div><div className="review-stars">★★★★★</div><p>{reviews[review][0]}</p><small>{reviews[review][2]} · Reseña verificada en esta demo</small></div><div className="review-arrows"><button onClick={() => setReview((review + reviews.length - 1) % reviews.length)} aria-label="Reseña anterior"><ChevronLeft /></button><button onClick={() => setReview((review + 1) % reviews.length)} aria-label="Reseña siguiente"><ChevronRight /></button></div></article><div className="review-pagination">0{review + 1} <span>/ 0{reviews.length}</span></div></section>

    <section id="solicitud" className="service-request"><div className="request-copy"><span className="fixit-kicker">COBERTURA EN BUENOS AIRES</span><h2>Vamos a donde<br /><em>nos necesitás.</em></h2><p>Atendemos en Palermo, Belgrano, Colegiales, Villa Crespo y zonas cercanas. ¿Estás más lejos? Consultanos.</p><div className="coverage-map"><span className="map-grid" /><span className="coverage-ring ring-outer" /><span className="coverage-ring ring-inner" /><span className="map-center"><MapPin /></span><span className="map-pin-dot pin-a" /><span className="map-pin-dot pin-b" /><span className="map-pin-dot pin-c" /><small>RADIO DE ATENCIÓN · CABA</small></div><div className="coverage-line"><MapPin size={15} /> Palermo · Belgrano · Colegiales · Villa Crespo</div></div><form className="request-form" onSubmit={sendRequest}><span className="fixit-kicker">SEGUIMOS NOSOTROS</span><h3>Pedí tu visita técnica</h3><p>Te contactamos para confirmar equipo, falla y disponibilidad.</p><div className="request-fields"><label>Nombre<input name="name" required placeholder="Tu nombre" /></label><label>Teléfono<input name="phone" type="tel" required placeholder="+54 9 11 ..." /></label><label>Dispositivo<select name="device" defaultValue="Notebook"><option>Notebook</option><option>Celular</option><option>Tablet</option><option>Otro</option></select></label><label>Franja horaria<select name="time" defaultValue=""><option value="" disabled>Elegí una franja</option><option>Mañana · 9 a 12 h</option><option>Mediodía · 12 a 15 h</option><option>Tarde · 15 a 19 h</option></select></label></div><button className="request-submit" type="submit">Coordinar diagnóstico <ArrowRight size={15} /></button>{request && <p className="request-status" role="status"><Check size={15} /> {request}</p>}<small>Al enviar, guardamos tu consulta en esta demo. No se realizan llamadas.</small></form></section>
    <footer className="fixit-footer"><a className="fixit-logo" href="#inicio"><span className="fixit-mark"><Wrench /></span><span>fixit<span>express</span><small>SOPORTE QUE SÍ RESPONDE</small></span></a><span>Atención de lunes a sábado · 9 a 19 h</span><a href="#inicio">Inicio ↑</a></footer>
    <button className="fixit-chat" aria-label="Abrir chat simulado" onClick={() => { setChatNotice(true); window.setTimeout(() => setChatNotice(false), 2600); }}><span>●</span>{chatNotice ? '¡Hola! Un técnico te responderá pronto.' : '¿Necesitás ayuda?'}</button>
  </main>;
}
export default App;
