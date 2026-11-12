// src/scripts.ts
// Modular, typed, and safe implementation of the site UI behavior.
// Bundled for the browser using esbuild.

type Maybe<T> = T | null;

interface CompetencyData {
  icon: string;
  title: string;
  description: string;
  capabilities: string[];
}

type CompetencyMap = Record<string, CompetencyData>;

interface VideoData {
  title: string;
  description: string;
  date: string;
  thumbnail: string;
  youtubeUrl: string;
  topic: string;
}

interface ArticleData {
  title: string;
  description: string;
  date: string;
  thumbnail: string;
  link: string;
  topic: string;
}

interface ConfigData {
  showVideos: boolean;
  showArticles: boolean;
}

interface GridItem {
  title: string;
  description: string;
  date: string;
  thumbnail: string;
  topic: string;
  url: string;
  isExternal?: boolean;
  showPlayIcon?: boolean;
}

function safe<T extends HTMLElement = HTMLElement>(selector: string): Maybe<T> {
  return document.querySelector(selector) as Maybe<T>;
}

function safeAll<T extends HTMLElement = HTMLElement>(
  selector: string,
): NodeListOf<T> {
  return document.querySelectorAll(selector) as NodeListOf<T>;
}

function isStorageAvailable(): boolean {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

function getSavedTheme(defaultTheme = "dark"): string {
  try {
    if (!isStorageAvailable()) return defaultTheme;
    return localStorage.getItem("theme") || defaultTheme;
  } catch (e) {
    return defaultTheme;
  }
}

function saveTheme(theme: string): void {
  try {
    if (!isStorageAvailable()) return;
    localStorage.setItem("theme", theme);
  } catch (e) {
    // ignore storage errors
  }
}

function updateThemeIcon(
  theme: string,
  button: Maybe<HTMLButtonElement>,
): void {
  if (!button) return;
  const icon = button.querySelector("i");
  if (!icon) return;
  icon.classList.remove("fa-moon", "fa-sun");
  if (theme === "dark") {
    icon.classList.add("fa-sun");
    button.setAttribute("aria-label", "Switch to light theme");
    button.setAttribute("title", "Switch to light theme");
  } else {
    icon.classList.add("fa-moon");
    button.setAttribute("aria-label", "Switch to dark theme");
    button.setAttribute("title", "Switch to dark theme");
  }
}

function initUI(): void {
  const menuToggle = safe<HTMLButtonElement>("#menuToggle");
  const sidebarClose = safe<HTMLButtonElement>("#sidebarClose");
  const sidebar = safe<HTMLElement>("#sidebar");
  const sidebarOverlay = safe<HTMLElement>("#sidebarOverlay");
  const themeToggle = safe<HTMLButtonElement>("#themeToggle");
  const htmlElement = document.documentElement;

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add("active");
    if (sidebarOverlay) sidebarOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove("active");
    if (sidebarOverlay) sidebarOverlay.classList.remove("active");
    document.body.style.overflow = "auto";
  }

  if (menuToggle) {
    menuToggle.addEventListener(
      "click",
      (ev: Event) => {
        ev.stopPropagation();
        if (!sidebar) return;
        if (sidebar.classList.contains("active")) closeSidebar();
        else openSidebar();
      },
      { passive: true },
    );
  }

  document.addEventListener(
    "click",
    (ev: Event) => {
      try {
        if (!sidebar) return;
        if (!sidebar.classList.contains("active")) return;
        const target = ev.target as Node | null;
        if (!target) return;
        if (sidebar.contains(target)) return;
        if (menuToggle && menuToggle.contains(target)) return;
        closeSidebar();
      } catch (e) {
        // ignore
      }
    },
    { passive: true },
  );

  if (sidebarClose)
    sidebarClose.addEventListener("click", closeSidebar, { passive: true });
  if (sidebarOverlay)
    sidebarOverlay.addEventListener("click", closeSidebar, { passive: true });

  const sidebarLinks = safeAll<HTMLAnchorElement>(".sidebar-links a");
  if (sidebarLinks && sidebarLinks.length) {
    sidebarLinks.forEach((link) =>
      link.addEventListener("click", closeSidebar, { passive: true }),
    );
  }

  // Theme toggle (dark by default)
  const savedTheme = getSavedTheme("dark");
  htmlElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme, themeToggle);

  if (themeToggle) {
    themeToggle.addEventListener(
      "click",
      () => {
        const current = htmlElement.getAttribute("data-theme") || "dark";
        const next = current === "light" ? "dark" : "light";
        htmlElement.setAttribute("data-theme", next);
        saveTheme(next);
        updateThemeIcon(next, themeToggle);
      },
      { passive: true },
    );
  }

  // Dynamic Year in Footer
  const yearEls = safeAll(".js-year");
  const currentYear = new Date().getFullYear().toString();
  yearEls.forEach((el) => {
    el.textContent = currentYear;
  });

  // Scroll Progress & Navbar Scrolled State
  initScrollHeader();

  // Animated Numbers Counter
  initStatsCounter();

  // Apply configuration from config.json
  applyConfiguration();

  // Initialize modals
  initModals();

  // Initialize videos if on videos.html
  initVideosPage();

  // Initialize articles if on articles.html
  initArticlesPage();

  // Initialize Futuristic Canvas, 3D Tilt, and Scroll Reveal
  initHeroCanvas();
  initScrollReveal();
  init3DTilt();
}

/**
 * Scroll Progress Bar and Sticky Header Elevation
 */
function initScrollHeader(): void {
  const progressBar = safe<HTMLElement>("#scrollProgress");
  const navbar = safe<HTMLElement>(".navbar");

  let ticking = false;

  function update() {
    const scrollY = window.scrollY || window.pageYOffset;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    if (progressBar && docHeight > 0) {
      const progress = Math.min(Math.max(scrollY / docHeight, 0), 1);
      progressBar.style.transform = `scaleX(${progress})`;
    }

    if (navbar) {
      if (scrollY > 20) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    }

    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true },
  );

  update();
}

/**
 * Animated Number Counter for Stats Strip
 */
function initStatsCounter(): void {
  const statNumbers = safeAll<HTMLElement>("[data-count]");
  if (!statNumbers.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          const target = parseInt(el.dataset.count || "0", 10);
          if (target > 0) {
            animateCount(el, target);
          }
          obs.unobserve(el);
        }
      });
    },
    { threshold: 0.3 },
  );

  statNumbers.forEach((el) => observer.observe(el));
}

function animateCount(element: HTMLElement, target: number): void {
  const duration = 1200; // ms
  const start = 0;
  const startTime = performance.now();

  function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  function frame(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.floor(start + (target - start) * easeOutCubic(progress));
    element.textContent = current.toString();

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      element.textContent = target.toString();
    }
  }

  requestAnimationFrame(frame);
}

async function initVideosPage() {
  const videosContainer = safe("#videosContainer");
  if (!videosContainer) return;

  try {
    const response = await fetch("./videos.json");
    if (!response.ok) throw new Error("Failed to fetch videos");

    const videos: VideoData[] = await response.json();
    const gridItems: GridItem[] = videos.map((v) => ({
      title: v.title,
      description: v.description,
      date: v.date,
      thumbnail: v.thumbnail,
      topic: v.topic,
      url: v.youtubeUrl,
      showPlayIcon: true,
    }));
    renderGrid(gridItems, videosContainer, {
      gridClass: "grid-layout video-grid",
      cardClass: "content-card",
      groupByTopic: true,
    });
  } catch (error) {
    console.error("Error loading videos:", error);
    videosContainer.innerHTML =
      '<p class="error-message">Failed to load videos. Please try again later.</p>';
  }
}

function renderGrid(
  items: GridItem[],
  container: HTMLElement,
  options: { gridClass: string; cardClass: string; groupByTopic?: boolean },
) {
  container.innerHTML = "";

  if (options.groupByTopic) {
    const grouped = items.reduce(
      (acc, item) => {
        const topic = item.topic || "Other";
        if (!acc[topic]) acc[topic] = [];
        acc[topic].push(item);
        return acc;
      },
      {} as Record<string, GridItem[]>,
    );

    Object.entries(grouped).forEach(([topic, topicItems]) => {
      const section = document.createElement("div");
      section.className = "video-topic-section";

      const header = document.createElement("h2");
      header.className = "video-topic-header";
      header.textContent = topic;
      section.appendChild(header);

      const grid = document.createElement("div");
      grid.className = options.gridClass;

      topicItems.forEach((item) =>
        grid.appendChild(createCard(item, options.cardClass)),
      );
      section.appendChild(grid);
      container.appendChild(section);
    });
  } else {
    const grid = document.createElement("div");
    grid.className = options.gridClass;
    items.forEach((item) =>
      grid.appendChild(createCard(item, options.cardClass)),
    );
    container.appendChild(grid);
  }

  init3DTilt();
  initScrollReveal();
}

function createCard(item: GridItem, cardClass: string): HTMLElement {
  const card = document.createElement("div");
  card.className = cardClass;
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");

  const playOverlay = item.showPlayIcon
    ? `
    <div class="play-overlay">
      <div class="play-icon">
        <i class="fas fa-play"></i>
      </div>
    </div>
  `
    : "";

  card.innerHTML = `
    <div class="card-thumbnail">
      <img src="${item.thumbnail}" alt="${item.title}" class="card-image" loading="lazy">
      ${playOverlay}
    </div>
    <div class="card-info">
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <div class="card-date"><i class="fas fa-calendar-alt"></i> ${item.date}</div>
    </div>
  `;

  const openUrl = () => window.open(item.url, "_blank", "noopener,noreferrer");
  card.addEventListener("click", openUrl);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openUrl();
    }
  });

  return card;
}

const EMBEDDED_CONFIG: ConfigData = {
  showVideos: false,
  showArticles: true,
};

async function applyConfiguration() {
  let config: ConfigData = { ...EMBEDDED_CONFIG };
  try {
    const response = await fetch("./config.json");
    if (response.ok) {
      const fetched = await response.json();
      config = { ...config, ...fetched };
    }
  } catch (error) {
    // fallback
  }

  if (config.showVideos === false) {
    const videoLinks = document.querySelectorAll('a[href="videos.html"]');
    videoLinks.forEach((link) => {
      const li = link.closest("li");
      if (li) li.style.display = "none";
      else (link as HTMLElement).style.display = "none";
    });
  }

  if (config.showArticles === false) {
    const articleLinks = document.querySelectorAll('a[href="articles.html"]');
    articleLinks.forEach((link) => {
      const li = link.closest("li");
      if (li) li.style.display = "none";
      else (link as HTMLElement).style.display = "none";
    });
  }
}

async function initArticlesPage() {
  const articlesContainer = safe("#articlesContainer");
  if (!articlesContainer) return;

  try {
    const response = await fetch("./articles.json");
    if (!response.ok) throw new Error("Failed to fetch articles");

    const articles: ArticleData[] = await response.json();
    const gridItems: GridItem[] = articles.map((a) => ({
      title: a.title,
      description: a.description,
      date: a.date,
      thumbnail: a.thumbnail,
      topic: a.topic,
      url: a.link,
    }));
    renderGrid(gridItems, articlesContainer, {
      gridClass: "grid-layout articles-grid",
      cardClass: "content-card",
    });
  } catch (error) {
    console.error("Error loading articles:", error);
    articlesContainer.innerHTML =
      '<p class="error-message">Failed to load articles. Please try again later.</p>';
  }
}

// Embedded Site Data for fallback / fast offline rendering
const EMBEDDED_SITE_DATA: CompetencyMap = {
  "product-strategy": {
    icon: "fa-chess",
    title: "Product Strategy",
    description:
      "Defining vision, roadmaps, and go-to-market strategies that capture market opportunities and drive sustainable growth in financial services.",
    capabilities: [
      "Market research and competitive analysis in capital markets",
      "Product vision, OKRs and multi-year roadmap development",
      "Prioritization frameworks (RICE, MoSCoW, Value vs. Effort)",
      "Go-to-market strategy, commercialization and launch planning",
      "Executive stakeholder alignment and business case modeling",
    ],
  },
  leadership: {
    icon: "fa-users",
    title: "Cross-functional Leadership",
    description:
      "Building and empowering high-performance teams across engineering, design, architecture, and business operations to deliver enterprise outcomes.",
    capabilities: [
      "High-performance team mentorship and talent development",
      "Agile & Scrum transformation at institutional scale",
      "Cross-functional stakeholder management across front, middle and back office",
      "Clear escalation, risk mitigation and decision-making frameworks",
      "Fostering psychological safety and engineering excellence",
    ],
  },
  ux: {
    icon: "fa-lightbulb",
    title: "User Experience",
    description:
      "Championing user-centric design thinking to make complex institutional workflows fast, intuitive, and error-resilient.",
    capabilities: [
      "User research, contextual inquiry and persona development",
      "Institutional customer journey mapping and friction reduction",
      "Usability testing and rapid prototyping feedback loops",
      "Accessibility compliance (WCAG standards)",
      "Design system governance across multiple product squads",
    ],
  },
  business: {
    icon: "fa-chart-line",
    title: "Business Outcomes & ROI",
    description:
      "Aligning product initiatives with commercial objectives to drive revenue growth, operational efficiency, and quantifiable ROI.",
    capabilities: [
      "Outcome-based KPI definition and OKR alignment",
      "Revenue optimization, unit economics and business case ownership",
      "Operational cost-reduction and process digitization",
      "P&L stewardship and resource prioritization",
      "Data-driven decision making and platform telemetry",
    ],
  },
  testing: {
    icon: "fa-gears",
    title: "Software Testing & Automation",
    description:
      "Deep foundation in quality engineering, test automation frameworks, and CI/CD pipelines to ensure enterprise release resilience.",
    capabilities: [
      "Enterprise test strategy, risk-based testing, and quality governance",
      "Automation framework architecture (Python, Playwright, Pytest, Robot Framework)",
      "CI/CD pipeline integration (Jenkins, GitHub Actions)",
      "Performance, stress, and load testing (Locust)",
      "Shift-left quality practices, BDD and automated compliance gates",
    ],
  },
  technical: {
    icon: "fa-microchip",
    title: "Technical & Domain Knowledge",
    description:
      "Bridging the gap between complex financial architecture and business outcomes with deep technical empathy and FinTech expertise.",
    capabilities: [
      "API design, event-driven messaging (Kafka, MQ) and integration patterns",
      "Relational & distributed data modeling for financial instruments",
      "Technical debt management, refactoring roadmaps, and modernization",
      "Cloud-native design principles and microservices patterns",
    ],
  },
  "cash-management": {
    icon: "fa-money-bill-wave",
    title: "Cash Management",
    description:
      "Expertise in managing and optimizing organizational liquidity, treasury operations, and transaction flows.",
    capabilities: [
      "Treasury Management Solutions & corporate cash forecasting",
      "Liquidity optimization and automated sweeping mechanisms",
      "Cash flow analytics, position reporting and reconciliation",
      "Virtual Accounts & multi-bank relationship management",
    ],
  },
  "core-banking": {
    icon: "fa-university",
    title: "Core Banking Products",
    description:
      "Deep understanding of fundamental deposit architectures, DDA/TDA platforms, and ledger accounting engines.",
    capabilities: [
      "Demand Deposit Accounts (DDA) lifecycle and architecture",
      "Term Deposit Accounts (TDA), sweep accounts and interest engines",
      "Posting, settlement, and end-of-day batch processing",
      "Regulatory reporting, compliance and AML integration",
    ],
  },
  payments: {
    icon: "fa-credit-card",
    title: "Payments & Transaction Processing",
    description:
      "Specialized in the architecture, rails, and modernization of high-throughput payment processing systems.",
    capabilities: [
      "Domestic & cross-border payment rails (Fedwire, CHIPS, SWIFT, SEPA)",
      "ISO 20022 messaging standards migration (MT to MX transition)",
      "Tokenization, encryption, and secure transaction workflows",
      "Real-time fraud screening, sanctions filtering, and exception processing",
    ],
  },
  "collateral-management": {
    icon: "fa-balance-scale",
    title: "Collateral Management",
    description:
      "Optimizing asset utilization and ensuring compliance across trading, margin, and credit operations.",
    capabilities: [
      "Collateral optimization, allocation and substitution engines",
      "Margin call automation, dispute management and tri-party workflows",
      "Regulatory compliance (BCBS-IOSCO, EMIR, Dodd-Frank)",
      "Inventory tracking, rehypothecation and valuation feeds",
    ],
  },
  "counterparty-risk": {
    icon: "fa-user-shield",
    title: "Counterparty Risk",
    description:
      "Managing trading credit risk, exposure limits, and capital adequacy in volatile financial markets.",
    capabilities: [
      "Real-time exposure monitoring and limit management systems",
      "Credit risk scoring, rating models and risk mitigation",
      "Default simulation and stress-testing scenario modeling",
      "Executive risk dashboards and regulatory reporting",
    ],
  },
  "securities-data": {
    icon: "fa-database",
    title: "Securities Data & Reference Data",
    description:
      "Mastery of reference data management for complex financial instruments, corporate actions, and pricing feeds.",
    capabilities: [
      "Instrument master data management (ISIN, CUSIP, SEDOL, FIGI)",
      "Market data feeds integration (Bloomberg, Refinitiv) and golden copy engines",
      "Corporate actions processing and distribution workflows",
      "Data lineage, governance, and audit compliance",
    ],
  },
  "software-dev": {
    icon: "fa-code",
    title: "Software Development",
    description:
      "Engineering foundation built on full-stack principles, clean code, and robust distributed systems architecture.",
    capabilities: [
      "Full-stack software development experience across the stack",
      "Modular system architecture and enterprise design patterns",
      "Cloud-native applications and service-oriented architectures",
      "Engineering empathy that earns trust from development squads",
    ],
  },
  "software-testing": {
    icon: "fa-vial",
    title: "Software Testing & QA",
    description:
      "Championing Quality Engineering to ensure resilient, bug-free, and high-performance financial delivery.",
    capabilities: [
      "Enterprise test automation frameworks and regression suites",
      "End-to-end integration, performance and latency testing",
      "Quality metrics, defect density reduction and release readiness",
      "Shift-left test strategies, BDD and automated regression gates",
    ],
  },
  "scrum-master": {
    icon: "fa-users-cog",
    title: "Scrum Master & Agile Leadership",
    description:
      "Facilitating Agile delivery, eliminating impediments, and empowering squads to reach peak velocity and predictability.",
    capabilities: [
      "Agile ceremonies facilitation (Sprint Planning, Retrospectives, Dailies)",
      "Continuous velocity tracking, burn-down analysis and flow optimization",
      "Roadblock removal, cross-squad dependency coordination and servant leadership",
      "Coaching teams through organizational Agile transformations",
    ],
  },
  "product-management": {
    icon: "fa-compass",
    title: "Product Management Leadership",
    description:
      "Strategic product leadership from customer discovery and market definition through delivery and continuous scaling.",
    capabilities: [
      "Strategic vision, product thesis and outcome-driven roadmaps",
      "Customer discovery, institutional interview synthesis and pain-point mapping",
      "Prioritization, stakeholder consensus and executive governance",
      "Lifecycle management from zero-to-one through multi-year scale",
    ],
  },
  "rbc-director": {
    icon: "fa-building",
    title: "Director, Product Management — RBC Capital Markets",
    description:
      "Leading product strategy and delivery at RBC Capital Markets, with an emphasis on process optimization, digitization, and enterprise platform excellence.",
    capabilities: [
      "Product Vision for Capital Markets and enterprise optimization solutions",
      "Process digitization and operational throughput acceleration",
      "Cross-functional leadership across engineering, operations, and compliance",
      "Executive stakeholder alignment and strategic program roadmapping",
    ],
  },
  "citi-vp": {
    icon: "fa-landmark",
    title: "Vice President — Citi",
    description:
      "Led high-impact product and technical delivery initiatives at Citi, focusing on transaction processing and treasury solutions across North America.",
    capabilities: [
      "Technical delivery oversight for North America (NAM) platforms",
      "Platform modernization from legacy frameworks to modern architectures",
      "Regulatory compliance technical delivery and audit assurance",
      "Cross-squad performance management and release orchestration",
    ],
  },
  "td-practice-lead": {
    icon: "fa-check-circle",
    title: "Practice Lead I — TD",
    description:
      "Championed Quality Engineering strategy and practice standards at TD, driving automation across multiple business lines and squads.",
    capabilities: [
      "Quality Engineering strategy and governance across enterprise squads",
      "Automation Center of Excellence (CoE) leadership and tooling standards",
      "Resource optimization, technical hiring, and skill upleveling",
      "Mentorship and community of practice leadership",
    ],
  },
  "cognizant-sqe": {
    icon: "fa-shield-halved",
    title: "Senior Quality Engineer — Cognizant",
    description:
      "Delivered mission-critical software solutions and automation frameworks for premier global financial institutions.",
    capabilities: [
      "Lead QA Engineer for complex FinTech integration programs",
      "Automation framework architecture across UI and backend APIs",
      "Functional, regression and user acceptance testing ownership",
      "Executive progress reporting and cross-geography collaboration",
    ],
  },
};

async function initModals() {
  const modal = safe("#siteModal");
  if (!modal) return;

  let siteData: CompetencyMap = { ...EMBEDDED_SITE_DATA };
  try {
    const response = await fetch("./site_data.json");
    if (response.ok) {
      const fetched = await response.json();
      siteData = { ...siteData, ...fetched };
    }
  } catch (error) {
    // fallback
  }

  const triggers = document.querySelectorAll(
    "[data-modal-id], [data-competency]",
  );

  triggers.forEach((trigger) => {
    const triggerEl = trigger as HTMLElement;
    const modalId = triggerEl.dataset.modalId || triggerEl.dataset.competency;

    if (!modalId) return;

    const openHandler = (ev: Event) => {
      ev.stopPropagation();
      openModal(modalId, siteData, modal);
    };

    triggerEl.addEventListener("click", openHandler);
    triggerEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openHandler(e);
      }
    });

    if (!triggerEl.getAttribute("tabindex")) {
      triggerEl.setAttribute("tabindex", "0");
    }
    if (!triggerEl.getAttribute("role")) {
      triggerEl.setAttribute("role", "button");
    }
  });

  const closeBtn = modal.querySelector(".modal-close");
  const overlay = modal.querySelector(".modal-overlay");

  function closeModal() {
    modal!.classList.remove("active");
    document.body.style.overflow = "auto";
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (overlay) overlay.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      closeModal();
    }
  });
}

function openModal(id: string, dataMap: CompetencyMap, modal: HTMLElement) {
  const data = dataMap[id];
  if (!data) return;

  const modalIcon = modal.querySelector(".modal-icon i");
  const modalTitle = modal.querySelector(".modal-title");
  const modalDesc = modal.querySelector(".modal-description");
  const modalCaps = modal.querySelector(".modal-capabilities");

  if (modalIcon) modalIcon.className = "fas " + data.icon;
  if (modalTitle) modalTitle.textContent = data.title;
  if (modalDesc) modalDesc.textContent = data.description;
  if (modalCaps) {
    modalCaps.innerHTML = "";
    data.capabilities.forEach((cap) => {
      const li = document.createElement("li");
      li.textContent = cap;
      modalCaps.appendChild(li);
    });
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  const closeBtn = modal.querySelector<HTMLButtonElement>(".modal-close");
  if (closeBtn) {
    closeBtn.focus({ preventScroll: true });
  }
}

/**
 * Interactive Sci-Fi Particle Constellation Background for Hero Canvas
 */
function initHeroCanvas(): void {
  const canvas = safe<HTMLCanvasElement>("#heroCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const parent = canvas.parentElement;
  if (!parent) return;

  let width = (canvas.width = parent.offsetWidth || window.innerWidth);
  let height = (canvas.height = parent.offsetHeight || window.innerHeight);

  window.addEventListener(
    "resize",
    () => {
      width = canvas.width = parent.offsetWidth || window.innerWidth;
      height = canvas.height = parent.offsetHeight || window.innerHeight;
    },
    { passive: true },
  );

  const numParticles = Math.min(Math.floor((width * height) / 14000), 55);
  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
  }> = [];

  const colors = ["#3b82f6", "#60a5fa", "#93c5fd", "#64748b"];

  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 1.6 + 0.6,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  let mouseX = width / 2;
  let mouseY = height / 2;

  window.addEventListener(
    "mousemove",
    (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    },
    { passive: true },
  );

  function animate() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // Draw particle connection lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(96, 165, 250, ${0.14 * (1 - dist / 110)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Update & draw particles
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      // Subtle mouse reaction
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const mouseDist = Math.sqrt(dx * dx + dy * dy);
      if (mouseDist < 110) {
        p.x -= (dx / mouseDist) * 0.35;
        p.y -= (dy / mouseDist) * 0.35;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    requestAnimationFrame(animate);
  }

  animate();
}

/**
 * Scroll Reveal Animation via IntersectionObserver
 */
function initScrollReveal(): void {
  const revealElements = document.querySelectorAll(
    ".reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger",
  );
  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
  );

  revealElements.forEach((el) => observer.observe(el));
}

/**
 * 3D Interactive Card Tilt & Mouse Spotlight Tracking
 */
function init3DTilt(): void {
  const tiltCards = document.querySelectorAll<HTMLElement>(
    ".competency-card, .content-card, .tech-card, .domain-card, .cert-card, .step-card, .stat, .timeline-content, .highlights-card, .contact-form, .contact-info",
  );

  tiltCards.forEach((card) => {
    card.addEventListener(
      "mousemove",
      (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);

        // Subtle 3D tilt
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
      },
      { passive: true },
    );

    card.addEventListener(
      "mouseleave",
      () => {
        card.style.transform =
          "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)";
      },
      { passive: true },
    );
  });
}

// Run initialization on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUI, {
    once: true,
    passive: true,
  });
} else {
  initUI();
}
