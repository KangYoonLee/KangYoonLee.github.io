/**
 * Design system: a restrained al-folio-inspired academic page — one clear
 * reading column, compact records, direct links, and no decorative chrome.
 */
import { useEffect, useState } from "react";
import { ArrowUpRight, Download, Github, Linkedin, Mail, Moon, Sun } from "lucide-react";

const portraits = [
  "/assets/kangyoon-lee-photo.webp",
  "/assets/kangyoon-lee-photo-2.webp",
];
const portraitCaptions = [
  "On my way to a deep learning course.",
  "Climbing at JHU's Ralph S. O'Connor Recreation Center.",
];
const cvFile = "/assets/Kangyoon-Lee-CV.pdf";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Research Experience", href: "#research" },
  { label: "Publications", href: "#publications" },
  { label: "CV", href: "#cv" },
];

const experiences = [
  {
    logo: "KIST",
    institution: "Korea Institute of Science and Technology",
    role: "Research Intern · AI & Robotics Institute",
    title: "Multi-modal Crowd Density Prediction for Public Safety Enhancement",
    period: "Mar. 2025 — May. 2026",
    detail: "Built a multi-modal deep learning pipeline combining network, CCTV, and transportation signals for real-time urban prediction.",
    tone: "red",
    logoImage: "/assets/kist.png",
  },
  {
    logo: "HSU",
    institution: "Hansung University · AI Education Institute",
    role: "Research Project",
    title: "Extracting Structural Causality in Data Feature Dependencies",
    period: "Jun. 2024 — Jun. 2025",
    detail: "Embedded Bayesian Network-derived feature causality into CTGAN to make synthetic data generation intrinsically explainable.",
    tone: "blue",
    logoImage: "/assets/hansung.png",
  },
  {
    logo: "HUFS",
    institution: "Hankuk University of Foreign Studies · Information Systems Lab",
    role: "Undergraduate Research",
    title: "Modeling Physical Infrastructure Causality for Adaptive Traffic Routing",
    period: "Mar. 2024 — Oct. 2024",
    detail: "Developed an adaptive multipath forwarding algorithm through traffic–infrastructure causal modeling.",
    tone: "navy",
    logoImage: "/assets/hufs.gif",
  },
  {
    logo: "HUFS",
    institution: "Hankuk University of Foreign Studies · AI Education Institute",
    role: "Undergraduate Research",
    title: "Benchmarking Generative Models for Data Synthesis",
    period: "Sep. 2023 — Dec. 2023",
    detail: "Benchmarked GAN, CTGAN, and VAE architectures for preserving temporal and structural relationships in multivariate data.",
    tone: "navy",
    logoImage: "/assets/hufs.gif",
  },
  {
    logo: "HUFS",
    institution: "Hankuk University of Foreign Studies · Mobile Distributed Computing Lab",
    role: "Undergraduate Research",
    title: "Uncovering Temporal Causality in Network Traffic Patterns",
    period: "Sep. 2022 — May. 2023",
    detail: "Validated temporal causality in traffic patterns with LSTM-based prediction on a Raspberry Pi LAN testbed.",
    tone: "navy",
    logoImage: "/assets/hufs.gif",
  },
];

const publications = [
  {
    year: "2026",
    venue: "IPIU · Poster",
    title: "Frequency-Aware Multi-Resolution Architecture for High-Resolution Spatiotemporal Map Reconstruction from Sparse Observations",
    authors: <>Eunshik Kim, <strong>Kangyoon Lee</strong>, Yekwon Kim, Hyungjoo Jung, Heeseung Choi, Igjae Kim, and Haesol Park</>,
  },
  {
    year: "2025",
    venue: "IEIE · Poster",
    title: "Learnable Adjacency Matrix Based Spatio-Temporal Graph Convolutional Network for Traffic Prediction",
    authors: <>Yekwon Kim, Eunshik Kim, <strong>Kangyoon Lee</strong>, Haesol Park, Heeseung Choi, Igjae Kim, and Hyungjoo Jung</>,
  },
  {
    year: "2023",
    venue: "ICAEIC · Oral · Best Paper Award",
    title: "A Comparative Study of Synthetic Data with Generative AI Models: Safely Reproducing Sensitive Transportation Worker Data",
    authors: <><strong>Kangyoon Lee</strong>, Hanbin Ryou, Jihwan Baek, Sejong Oh, and Illchul Doo</>,
  },
];

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
    </div>
  );
}

export default function Home() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("kangyoon-theme") === "dark");
  const [photoIndex, setPhotoIndex] = useState(0);

  const changePhoto = (direction: 1 | -1) => {
    setPhotoIndex((current) => (current + direction + portraits.length) % portraits.length);
  };

  const handlePhotoKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") changePhoto(1);
    if (event.key === "ArrowLeft") changePhoto(-1);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("kangyoon-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <div className="page">
      <header className="topbar">
        <a className="wordmark" href="#home">Kangyoon (Kay) Lee</a>
        <nav aria-label="Primary navigation">
          {navItems.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
        </nav>
        <button className="theme-toggle" type="button" onClick={() => setDarkMode((value) => !value)} aria-label={darkMode ? "Switch to daytime mode" : "Switch to night mode"}>
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          <span>{darkMode ? "Day mode" : "Night mode"}</span>
        </button>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-intro-layout">
            <div className="hero-copy">
            <h1>Kangyoon (Kay) Lee</h1>
            <p className="bio">I&apos;m a Ph.D. student in the Department of Computer Science at <a href="https://engineering.jhu.edu/" target="_blank" rel="noreferrer">Johns Hopkins University</a> under the supervision of <a href="http://soudeh.net/#bio" target="_blank" rel="noreferrer">Dr. Soudeh Ghorbani</a>. Prior to joining JHU, I worked as a Data Engineer at the AI and Robotics Institute of the <a href="https://www.kist.re.kr/eng/" target="_blank" rel="noreferrer">Korea Institute of Science and Technology</a> (KIST). I received my B.Eng. in Information and Communications Engineering from <a href="https://www.hufs.ac.kr/" target="_blank" rel="noreferrer">Hankuk University of Foreign Studies</a> (HUFS).</p>
            <p className="bio">My research establishes causal domain knowledge underlying network traffic patterns—spanning temporal user behaviors, physical infrastructure interactions, and structural feature dependencies. By embedding these causal principles as a priori constraints within predictive models, I build trustworthy AI systems that enable proactive congestion control in datacenters, explainable anomaly prediction, and real-time QoS guarantees.</p>
          </div>
          <div className="hero-photo-wrap">
            <div
              className="hero-photo"
              role="region"
              aria-label="Profile photos"
              aria-roledescription="carousel"
              tabIndex={0}
              onKeyDown={handlePhotoKeyDown}
              onClick={() => changePhoto(1)}
            >
              <img
                key={portraits[photoIndex]}
                className="photo-image"
                src={portraits[photoIndex]}
                alt={`Kangyoon Lee profile photo ${photoIndex + 1}`}
                draggable={false}
              />
              <div className="photo-dots" aria-label="Choose profile photo">
                {portraits.map((portrait, index) => (
                  <button
                    className={`photo-dot ${index === photoIndex ? "is-active" : ""}`}
                    type="button"
                    key={portrait}
                    aria-label={`Show profile photo ${index + 1}`}
                    aria-current={index === photoIndex ? "true" : undefined}
                    onClick={(event) => {
                      event.stopPropagation();
                      setPhotoIndex(index);
                    }}
                  />
                ))}
              </div>
            </div>
            <p className="photo-caption" aria-live="polite">{portraitCaptions[photoIndex]}</p>
            <div className="social-links" aria-label="External profiles">
              <a href="https://github.com/KangYoonLee" target="_blank" rel="noreferrer"><Github size={16} /> GitHub <ArrowUpRight size={13} /></a>
              <a href="https://www.linkedin.com/in/kangyoon-lee-a5141427a/" target="_blank" rel="noreferrer"><Linkedin size={16} /> LinkedIn <ArrowUpRight size={13} /></a>
              <a href="mailto:klee320@jh.edu"><Mail size={16} /> Email</a>
            </div>
          </div>
          </div>

        <blockquote className="research-quote">
          <p className="quote-original">Bouloimēn an mallon hen aitiologian heurein ē tēn Persōn basileian genesthai moi.</p>
          <p className="quote-english">“I would rather discover one cause than gain the kingdom of Persia.”</p>
          <cite>— Democritus <span>(5th-century BCE Greek philosopher)</span></cite>
        </blockquote>
        </section>

        <section id="research" className="content-section">
          <SectionTitle title="Research Experience" />
          <div className="experience-list">
            {experiences.map((experience) => (
              <article className="experience-row" key={experience.title}>
                <div className={`institution-logo ${experience.tone}`}>
                  {experience.logoImage ? (
                    <img src={experience.logoImage} alt={`${experience.institution} logo`} />
                  ) : (
                    experience.logo
                  )}
                </div>
                <div className="experience-body">
                  <div className="row-meta"><span>{experience.role}</span><time>{experience.period}</time></div>
                  <h3>{experience.title}</h3>
                  <p className="institution-name">{experience.institution}</p>
                  <p className="experience-detail">{experience.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="publications" className="content-section publications-section">
          <SectionTitle title="Publications" />
          <div className="publication-list">
            {publications.map((publication, index) => (
              <article className="publication-row" key={publication.title}>
                <span className="publication-index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <div className="row-meta"><span>{publication.venue}</span><time>{publication.year}</time></div>
                  <h3>{publication.title}</h3>
                  <p>{publication.authors}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="cv" className="cv-section">
          <div><p className="kicker">Curriculum Vitae</p><h2>More about my work and background.</h2></div>
          <a className="cv-button" href={cvFile} download="Kangyoon-Lee-CV.pdf"><Download size={17} /> Download CV <ArrowUpRight size={14} /></a>
        </section>
      </main>

      <footer className="footer"><span>© {new Date().getFullYear()} Kangyoon Lee</span><span>Johns Hopkins University · Department of Computer Science</span></footer>
    </div>
  );
}
