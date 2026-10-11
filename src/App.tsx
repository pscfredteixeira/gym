import { useState } from "react";

type Section = "Hoje" | "Treinar" | "Exercícios" | "Evolução" | "Perfil";

const sections: Section[] = ["Hoje", "Treinar", "Exercícios", "Evolução", "Perfil"];

const sectionInfo: Record<Section, { title: string; text: string; sprint: string }> = {
  Hoje: {
    title: "Seu treino. Seu ritmo.",
    text: "O espaço para planejar, registrar e acompanhar sua evolução — sem distrações.",
    sprint: "Painel visual • Sprint 01",
  },
  Treinar: {
    title: "Cada série conta.",
    text: "Fichas, cargas, repetições e descanso vão ficar a um toque de distância.",
    sprint: "Registro funcional • Sprints 03–05",
  },
  Exercícios: {
    title: "Movimento com propósito.",
    text: "Uma biblioteca com fotografias, orientações e alternativas para cada exercício.",
    sprint: "Biblioteca visual • Sprint 06",
  },
  Evolução: {
    title: "Evolução que aparece.",
    text: "Gráficos reais, recordes e cards prontos para compartilhar.",
    sprint: "Análises e compartilhamento • Sprints 08–09",
  },
  Perfil: {
    title: "Tudo do seu jeito.",
    text: "Preferências, metas, privacidade, exportação e segurança das suas informações.",
    sprint: "Preferências e backup • Sprint 02",
  },
};

export default function App() {
  const [section, setSection] = useState<Section>("Hoje");
  const current = sectionInfo[section];

  return (
    <div className="gym-app">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="page">
        <header className="topbar">
          <div className="brand" aria-label="GYM">GYM<span>.</span></div>
          <div className="status"><span className="status-dot" /> SPRINT 00</div>
        </header>

        <main id="main-content" className="main-content">
          <div className="eyebrow">SEU ESPAÇO DE TREINAMENTO</div>
          <h1>{current.title}</h1>
          <p className="intro">{current.text}</p>

          {section === "Hoje" ? (
            <>
              <section className="feature hero-panel" aria-label="Visão do projeto">
                <div className="feature-inner">
                  <span className="overline">NOSSO PRÓXIMO PASSO</span>
                  <h2>Mais foco no<br /><em>que importa.</em></h2>
                  <p>Musculação, corrida e resultados em um único lugar.</p>
                  <span className="tag">Design visual em construção</span>
                </div>
                <div className="hero-glyph" aria-hidden="true">G<span>Y</span>M</div>
              </section>

              <div className="section-heading">
                <h2>O que estamos construindo</h2>
                <span>01 / 04</span>
              </div>
              <div className="tiles">
                <article className="tile">
                  <span className="tile-index">01 — FORÇA</span>
                  <h3>Musculação</h3>
                  <p>Fichas, séries, descanso e progressão de carga.</p>
                  <span className="pill">Em desenvolvimento</span>
                </article>
                <article className="tile">
                  <span className="tile-index">02 — CARDIO</span>
                  <h3>Corrida</h3>
                  <p>Esteira, distância, ritmo e histórico de atividades.</p>
                  <span className="pill">Em desenvolvimento</span>
                </article>
              </div>
              <p className="honest-note">Esta é a fundação visual do GYM, ainda sem dados pessoais ou registros de treino. As funcionalidades serão ativadas nas próximas sprints.</p>
            </>
          ) : (
            <section className="feature placeholder" aria-live="polite">
              <span className="overline">{current.sprint}</span>
              <h2>{section}</h2>
              <p>{current.text}</p>
              <div className="placeholder-line"><span /></div>
              <p className="small">Área reservada para a implementação desta etapa.</p>
            </section>
          )}
        </main>

        <nav className="bottom-nav" aria-label="Navegação principal">
          {sections.map((item) => (
            <button
              type="button"
              key={item}
              className={item === section ? "nav-item active" : "nav-item"}
              aria-current={item === section ? "page" : undefined}
              onClick={() => setSection(item)}
            >
              <span className="nav-mark" aria-hidden="true">{item === "Hoje" ? "⌂" : item === "Treinar" ? "▥" : item === "Exercícios" ? "▤" : item === "Evolução" ? "↗" : "◎"}</span>
              <span>{item}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
