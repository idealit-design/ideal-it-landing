import { useState, type FormEvent } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, Leaf, Sprout, Sun, Truck } from 'lucide-react';

const imagePath = (filename: string) => `${import.meta.env.BASE_URL}images/${filename}.webp`;

const plans = [
  { id: 'mini', name: 'Brotes', servings: '1–2 personas', weekly: 14500, contents: '6 variedades · 4 kg', tag: '' },
  { id: 'casa', name: 'La Casa', servings: '3–4 personas', weekly: 22500, contents: '9 variedades · 7 kg', tag: 'EL MÁS ELEGIDO' },
  { id: 'huerta', name: 'Huerta Grande', servings: '5+ personas', weekly: 31500, contents: '12 variedades · 10 kg', tag: '' },
];
const faqs = [
  ['¿Qué verduras recibo?', 'Cada semana armamos el bolsón con lo que está en su mejor momento. Siempre vas a encontrar una mezcla de hojas, raíces y frutos; nunca una caja idéntica a la anterior.'],
  ['¿De dónde vienen?', 'Trabajamos con tres huertas agroecológicas familiares a menos de 80 km de la ciudad. Conocemos a quienes cultivan y visitamos sus campos.'],
  ['¿Puedo elegir lo que viene?', 'Podés marcar hasta dos cosas que preferís no recibir. Armamos tu caja y, si querés, agregás extras de temporada desde el correo de confirmación.'],
  ['¿Cómo cambio o pauso mi suscripción?', 'Avisanos hasta el miércoles anterior a tu entrega y pausamos, cambiamos el tamaño o reprogramamos. Sin permanencia y sin vueltas.'],
];

function App() {
  const [period, setPeriod] = useState<'semanal' | 'mensual'>('semanal');
  const [people, setPeople] = useState(2);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selected, setSelected] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const activePlan = plans.find((plan) => plan.id === selected);
  const monthlySavings = people * 11500 * 4 - (activePlan?.weekly ?? 22500) * (period === 'mensual' ? 3.68 : 4);
  const estimate = Math.max(0, Math.round(monthlySavings));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    event.currentTarget.reset();
  };
  return <main className="eco-page min-h-screen bg-[#f3f5e9] text-[#233a2b]">
    <div className="eco-announcement"><span className="eco-dot" /> Entregas frescas en CABA · Reservá hasta el miércoles</div>
    <header className="eco-nav"><a className="eco-brand" href="#inicio"><span className="brand-leaf"><Leaf size={19} /></span><span>ECOHUERTA<small>URBANA</small></span></a><nav className={navOpen ? 'eco-links open' : 'eco-links'}><a href="#funciona" onClick={() => setNavOpen(false)}>Cómo funciona</a><a href="#planes" onClick={() => setNavOpen(false)}>Bolsones</a><a href="#impacto" onClick={() => setNavOpen(false)}>Nuestro impacto</a><a className="eco-nav-cta" href="#planes" onClick={() => setNavOpen(false)}>Elegí tu bolsón <ArrowUpRight size={14} /></a></nav><button className="eco-menu" aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={navOpen} onClick={() => setNavOpen(!navOpen)}>☰</button></header>

    <section id="inicio" className="eco-hero"><div className="eco-hero-copy"><span className="eco-kicker"><span /> CULTIVADO CERCA. ELEGIDO CON CARIÑO.</span><h1>Lo fresco<br />tiene <em>otro ritmo.</em></h1><p>Verduras agroecológicas de estación, cosechadas para vos y entregadas en la puerta de tu casa.</p><div className="eco-actions"><a className="eco-button" href="#planes">Encontrá tu bolsón <ArrowRight size={16} /></a><span><b>+</b> de 40 familias ya reciben su huerta</span></div><div className="eco-trust"><span><Sprout /> Sin agroquímicos</span><span><Truck /> Entrega local</span><span><Sun /> De estación</span></div></div><div className="eco-hero-art"><div className="hero-blob" /><img src={imagePath('vegetables')} alt="Selección colorida de vegetales frescos de estación" /><div className="harvest-sticker"><span>COSECHADO<br />ESTA SEMANA</span><Leaf size={18} /></div><div className="hero-image-note">Directo de nuestras huertas asociadas <span>↗</span></div></div><div className="eco-sunburst">BUENO PARA VOS<br />BUENO PARA LA TIERRA <span>✳</span></div></section>

    <section id="funciona" className="how-section"><div className="eco-section-head"><span className="eco-kicker">DE LA HUERTA A TU MESA</span><h2>Fresco, sin complicaciones.</h2><p>Tres pasos sencillos para comer más rico y más cerca.</p></div><div className="how-grid"><article><div className="how-icon"><span>01</span><Sprout /></div><h3>Elegís tu bolsón</h3><p>Encontrá el tamaño que va con vos. Podés cambiarlo cuando quieras.</p></article><article><div className="how-icon"><span>02</span><Leaf /></div><h3>Cosechamos para vos</h3><p>Tu caja se arma con lo que está listo en las huertas esta semana.</p></article><article><div className="how-icon"><span>03</span><Truck /></div><h3>Llega a tu puerta</h3><p>Entregamos los jueves y viernes, en caja retornable y sin intermediarios.</p></article></div></section>

    <section id="planes" className="plans-section"><div className="plans-top"><div><span className="eco-kicker">UN BOLSÓN PARA CADA MESA</span><h2>Elegí tu ritmo.</h2><p>Sin permanencia, sin letra chica. Pausás cuando quieras.</p></div><div className="period-switch" role="group" aria-label="Frecuencia de entrega"><button className={period === 'semanal' ? 'selected' : ''} onClick={() => setPeriod('semanal')}>Semanal</button><button className={period === 'mensual' ? 'selected' : ''} onClick={() => setPeriod('mensual')}>Mensual <span>−8%</span></button></div></div><div className="plan-cards">{plans.map((plan) => <article key={plan.id} className={selected === plan.id ? 'plan-card picked' : 'plan-card'}>{plan.tag && <span className="plan-tag">{plan.tag}</span>}<span className="plan-servings">{plan.servings}</span><h3>{plan.name}</h3><p className="plan-content">{plan.contents}</p><p className="plan-price"><strong>$ {Math.round(plan.weekly * (period === 'mensual' ? 3.68 : 1)).toLocaleString('es-AR')}</strong><span> / {period === 'mensual' ? 'mes' : 'entrega'}</span></p><ul><li><Check /> Cosecha agroecológica</li><li><Check /> Entrega a domicilio</li><li><Check /> Caja retornable</li></ul><button className="choose-plan" onClick={() => setSelected(plan.id)}>{selected === plan.id ? 'Elegido para calcular ✓' : 'Elegir este bolsón'} <ArrowRight size={15} /></button></article>)}</div><div className="plan-footnote">* Precios de referencia para esta demo. La entrega se coordina en CABA.</div></section>

    <section id="impacto" className="impact-section"><div className="impact-copy"><span className="eco-kicker">UN CAMBIO QUE SE NOTA</span><h2>Comer cerca<br />también <em>cuida lejos.</em></h2><p>Una caja compartida hace bien a tu mesa y sostiene a las huertas que cultivan con respeto.</p><div className="impact-metrics"><span><strong>−72%</strong><small>menos recorrido<br />que una verdura importada</small></span><span><strong>0</strong><small>agroquímicos<br />de síntesis</small></span></div></div><div className="calculator"><div className="calculator-heading"><span className="calculator-icon"><Leaf /></span><div><span>CALCULADORA DE AHORRO</span><h3>¿Cuánto te devuelve la huerta?</h3></div></div><label>¿Cuántas personas comen en casa?<div className="people-picker"><button onClick={() => setPeople(Math.max(1, people - 1))} aria-label="Menos personas">−</button><strong>{people}</strong><button onClick={() => setPeople(Math.min(8, people + 1))} aria-label="Más personas">+</button><small>{people === 1 ? 'persona' : 'personas'}</small></div></label><div className="calc-line"><span>Estimado de ahorro mensual*</span><strong>$ {estimate.toLocaleString('es-AR')}</strong></div><p>* Comparación estimativa con compras minoristas y de estación; varía según el bolsón y el consumo.</p></div></section>

    <section className="faq-section"><div><span className="eco-kicker">PREGUNTAS DE LA HUERTA</span><h2>¿Tenés dudas?<br /><em>Nos gusta conversar.</em></h2><a href="#planes" className="faq-link">Ver los bolsones <ArrowRight size={15} /></a></div><div className="faq-list">{faqs.map(([question, answer], index) => <article className={openFaq === index ? 'faq open' : 'faq'} key={question}><button aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>{question}</span><ChevronDown size={17} /></button>{openFaq === index && <p>{answer}</p>}</article>)}</div></section>
    <section className="eco-signup"><div><span className="eco-kicker">LA HUERTA EN TU MESA</span><h2>Una caja fresca.<br /><em>Un buen comienzo.</em></h2><p>Elegí tu bolsón y dejá que la estación haga el resto.</p></div><form onSubmit={submit}><label>Quiero recibir novedades de la huerta<input type="email" placeholder="Tu correo electrónico" required /></label><button type="submit">Sumarme <ArrowRight size={15} /></button>{submitted && <span role="status">¡Gracias! Quedaste en la lista de esta demo.</span>}<small>No enviamos correos desde esta demostración.</small></form></section>
    <footer className="eco-footer"><a className="eco-brand" href="#inicio"><span className="brand-leaf"><Leaf size={18} /></span><span>ECOHUERTA<small>URBANA</small></span></a><span>Cultivamos cerca para compartir mejor.</span><a href="#inicio">Volver a la huerta ↑</a></footer>
  </main>;
}
export default App;
