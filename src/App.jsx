import { useEffect, useMemo, useRef, useState } from "react";
import logo from "../assets/images/logo.png";
import { initialProjects, projectStacks, technologies } from "./data.js";

const statusMeta = { green: ["dot-green", "Live"], live: ["dot-green", "Live"], yellow: ["dot-yellow", "Under Maintenance"], red: ["dot-red", "Offline"], blue: ["dot-blue", "Planning"] };

function useProjects() {
  const [projects, setProjects] = useState(initialProjects);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const response = await fetch("/api/project-statuses", { signal: controller.signal });
        if (!response.ok) throw new Error(String(response.status));
        const statuses = await response.json();
        if (active) setProjects(initialProjects.map((project) => ({ ...project, status: statuses[project.number] ?? project.status })));
      } catch { if (active) setProjects(initialProjects); }
      finally { clearTimeout(timeout); }
    };
    refresh();
    const timer = setInterval(refresh, 300000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  return projects;
}

function Navigation({ archive = false }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const prefix = archive ? "./index.html" : "";
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > Math.max(120, window.innerHeight * .65));
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("keydown", onKey); };
  }, []);
  return <nav className={`${open ? "menu-open " : ""}${scrolled || archive ? "is-scrolled" : ""}`} aria-label="Primary navigation">
    <a id="site-logo" href={`${prefix}#hero`} aria-label="Nathaniel Ponce Home"><img src={logo} alt="Nathaniel Ponce Logo" /></a>
    <button id="nav-toggle" className="nav-toggle" type="button" aria-expanded={open} aria-controls="primary-nav-links" aria-label={`${open ? "Close" : "Open"} navigation menu`} onClick={() => setOpen(!open)}><span/><span/><span/></button>
    <div className="nav-link-container" id="primary-nav-links"><ul>{[["hero","Home"],["about","About"],["projects","Projects"],["contact","Contact"]].map(([id,label]) => <li key={id}><a className="nav-button" href={`${prefix}#${id}`} onClick={() => setOpen(false)}>{label}</a></li>)}</ul></div>
  </nav>;
}

function PageLoader() {
  const [visible, setVisible] = useState(true);
  useEffect(() => { document.body.classList.add("is-loading"); const timer = setTimeout(() => { setVisible(false); document.body.classList.remove("is-loading"); document.body.classList.add("page-ready"); }, 900); return () => clearTimeout(timer); }, []);
  return visible ? <div id="page-loader"><img src={logo} alt="Nathaniel Ponce Logo" /></div> : null;
}

function Hero() {
  return <section id="hero"><canvas id="hero-canvas"/><div id="hero-overlay"/><div id="hero-content">
    <p id="hero-eyebrow">USC CS Student &amp; Sysadmin <span>Served from Ubuntu 24.04.4 LTS</span></p>
    <h1 id="hero-name">Nathaniel Ryan <span>Ponce</span></h1>
    <p id="hero-role"><strong>SysAdmin &amp; DevSecOps</strong> · Computer Science</p>
    <p id="hero-tagline">Building resilient systems and clean software — from bare-metal servers to full-stack web. Currently studying at USC while keeping the infrastructure running and the servers humming.</p>
    <div id="hero-buttons"><a href="#projects" className="hero-btn btn-primary">▦ Projects</a><a href="https://github.com/nateponds" className="hero-btn btn-secondary" target="_blank" rel="noreferrer">● GitHub</a><a href="#contact" className="hero-btn btn-secondary">✉ Contact Me</a></div>
  </div><div id="hero-symbols" aria-hidden="true"><span className="ps-sym sym-t">△</span><span className="ps-sym sym-o">○</span><span className="ps-sym sym-x">✕</span><span className="ps-sym sym-s">□</span></div><div id="hero-scroll" aria-hidden="true"><div className="scroll-line"/><span>Scroll</span></div></section>;
}

const terminalLines = [["whoami", "nathaniel / cs-student / sysadmin"], ["current_focus", "learning by building real systems, not just studying about them"], ["driven_motivation", "I am always eager to learn new technologies and adapt to changes"]];
function Terminal() {
  const [shown, setShown] = useState(false); const ref = useRef(null);
  useEffect(() => { const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setShown(true), { threshold: .35 }); if (ref.current) observer.observe(ref.current); return () => observer.disconnect(); }, []);
  return <aside ref={ref} className="about-terminal" aria-label="Current focus"><div className="terminal-topbar"><span/><span/><span/></div><div className="terminal-body" id="about-terminal-output">{shown && terminalLines.map(([command, output], i) => <div key={command} style={{animationDelay:`${i*180}ms`}}><p className="terminal-line"><span>$</span> {command}</p><p className="terminal-output">{output}</p></div>)}</div></aside>;
}

function StackCarousel() {
  const items = [...technologies, ...technologies];
  return <section className="stack-showcase" aria-labelledby="stack-title"><div className="stack-showcase-header"><p className="section-kicker">Stack / Tools</p><h3 id="stack-title">Technologies I work with and learn</h3></div><div className="stack-carousel" aria-label="Technology stack carousel"><div className="stack-track" id="stack-track">{items.map((stack, index) => <article className="stack-item" key={`${stack.name}-${index}`}><img src={stack.icon} alt={`${stack.name} logo`} loading="lazy" className={stack.inverted ? "stack-icon-inverted" : ""}/><span>{stack.name}</span></article>)}</div></div></section>;
}

function About() {
  const cards = [["01","Systems","I enjoy understanding how servers, networks, and deployments work behind the scenes."],["02","Software","I build with HTML, CSS, JavaScript, and backend concepts while expanding toward full-stack development."],["03","Growth","I treat each project as a chance to improve my structure, project design management, and problem-solving process."]];
  return <section id="about" aria-labelledby="about-title"><div className="section-container"><p className="section-kicker">About / Background</p><div className="about-grid"><div className="about-copy"><h2 id="about-title">Hi, call me <span>Nathan</span></h2><p>My name is Nathaniel Ryan Ponce, a Computer Science student at the University of San Carlos with a growing focus on system administration, DevSecOps, and full-stack web development.</p><p>I like working close to the machine: Linux servers, deployment flows, web infrastructure, and the practical side of keeping things online. I am expanding my depth in cybersecurity so the systems I build are as secure as they are stable.</p><p>This portfolio is both a personal website and a live project, served from my own Ubuntu Server setup with an AMD Ryzen 3 4300GE and 16 GB DDR5 RAM.</p><div className="about-actions"><a href="#projects" className="about-link">View projects</a><a href="https://github.com/nateponds" className="about-link about-link-muted" target="_blank" rel="noreferrer">GitHub profile</a></div></div><Terminal/></div><StackCarousel/><div className="about-focus-grid" aria-label="Technical focus areas">{cards.map(([number,title,text]) => <article className="about-card" key={number}><span className="about-card-number">{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>;
}

function ProjectCard({ project }) {
  const [dot, defaultLabel] = statusMeta[project.status] || statusMeta.yellow;
  const available = ["green", "live"].includes(project.status);
  return <article className="project-row projects-reveal-item projects-reveal-visible"><div className={`project-visual${project.image ? " has-image" : ""}`}>{project.image ? <img src={project.image} alt={project.imageAlt || `${project.name} project preview`} loading="lazy"/> : <span>{project.name}</span>}</div><div className="project-card"><span className="project-number">{project.number}</span><h3>{project.name}</h3><p>{project.description}</p><div className="project-stack-tags" aria-label="Technology stack">{project.stacks.map((name) => <span className={`project-stack-tag ${projectStacks.find((stack) => stack.name.toLowerCase() === name.toLowerCase())?.className || "stack-default"}`} key={name}>{name}</span>)}</div><div className="project-card-footer">{available ? <a href={project.url} className="project-link" target="_blank" rel="noreferrer">View Project</a> : <span className="project-link project-link-disabled" aria-disabled="true">Unavailable</span>}<span className="status-badge"><span className={`status-dot ${dot}`} aria-hidden="true"/>{project.statusLabel || defaultLabel}</span></div></div></article>;
}

function Projects({ projects, archive = false }) {
  const visible = archive ? projects : projects.filter((project) => project.featured).slice(0, 4);
  return <section id="projects" className={archive ? "projects-archive" : ""} aria-labelledby={archive ? "projects-title" : undefined}><div className="section-container"><div className="projects-heading projects-reveal-item projects-reveal-visible">{archive ? <><div className="projects-heading-topline"><a className="projects-back-link" href="./index.html#projects">← Go Back</a><p className="section-kicker">Portfolio Archive</p></div><h1 id="projects-title">All Projects</h1></> : <><p className="section-kicker">Featured Projects</p><h2>Hosted builds with sharp edges and practical systems.</h2></>}</div><div className="projects-list" aria-label={archive ? "All projects" : "Featured projects"}>{visible.map((project) => <ProjectCard project={project} key={project.number}/>)}</div>{!archive && <div className="projects-actions projects-reveal-item projects-reveal-visible">{projects.length > 4 ? <a href="./projects.html" className="project-link projects-more-link">View More Projects</a> : <span className="project-link projects-more-link project-link-disabled">More Projects Coming Soon</span>}</div>}</div></section>;
}

function Contact() {
  return <footer id="contact" className="site-footer" aria-labelledby="contact-title"><canvas id="contact-canvas" aria-hidden="true"/><div className="section-container contact-container"><div className="contact-heading"><p className="contact-kicker">Contact / Open Channel</p><h2 id="contact-title">Built to <span>scale</span><br/>Engineered to <span>execute</span></h2><p>Have a project idea, internship opportunity, or systems problem that needs a steady pair of hands? I am open to conversations around system builds, infrastructure, security-minded workflows, and student-led technical projects.</p></div><div className="contact-layout"><div className="contact-primary"><div className="contact-circle-mark"/><span className="contact-label">Available for Internship</span><a className="contact-email" href="mailto:nathanielryanponce@gmail.com">✉ nathanielryanponce@gmail.com</a><p>Best for collaboration ideas, build requests, school projects, infrastructure questions, and opportunities where practical systems work matters.</p></div><div className="contact-methods"><a className="contact-method" href="https://github.com/nateponds" target="_blank" rel="noreferrer"><span><strong>GitHub</strong><small>Code, experiments, and hosted projects</small></span></a><div className="contact-method contact-method-muted"><span><strong>LinkedIn</strong><small>Professional updates and opportunities</small></span></div><a className="contact-method" href="tel:+639563585873"><span><strong>Phone</strong><small>+63 (956) 358-5873</small></span></a></div></div><div className="contact-bottom"><div className="contact-legal"><p>© 2026 Nathaniel Ryan Ponce. All rights reserved.</p><p>Designed, built, and served by Nathaniel Ponce.</p></div><a className="contact-top-link" href="#hero"><span>Back to top</span><span>↑</span></a></div></div></footer>;
}

export default function App() {
  const archive = document.documentElement.dataset.page === "projects";
  const projects = useProjects();
  useEffect(() => { document.body.className = archive ? "projects-page" : ""; if (!archive) import("../js/webgl.js"); }, [archive]);
  if (archive) return <><Navigation archive/><main><Projects projects={projects} archive/></main></>;
  return <><PageLoader/><Navigation/><Hero/><main><About/><Projects projects={projects}/></main><Contact/></>;
}
