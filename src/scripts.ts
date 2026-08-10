// src/scripts.ts
// Modular, typed, and safe implementation of the site UI behavior.
// This file is intended to be bundled for the browser (esbuild recommended).

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

function getSavedTheme(defaultTheme = "light"): string {
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
    // Prevent body scroll when sidebar is active
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
        // prevent the document click handler from immediately closing the sidebar
        ev.stopPropagation();
        if (!sidebar) return;
        if (sidebar.classList.contains("active")) closeSidebar();
        else openSidebar();
      },
      { passive: true },
    );
  }
  // Close sidebar when clicking anywhere outside it
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
        // click was outside sidebar/menu, close it
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

  // Close sidebar when clicking on a link inside it
  const sidebarLinks = safeAll<HTMLAnchorElement>(".sidebar-links a");
  if (sidebarLinks && sidebarLinks.length) {
    sidebarLinks.forEach((link) =>
      link.addEventListener("click", closeSidebar, { passive: true }),
    );
  }

  // Theme toggle
  const savedTheme = getSavedTheme("light");
  htmlElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme, themeToggle);

  if (themeToggle) {
    themeToggle.addEventListener(
      "click",
      () => {
        const current = htmlElement.getAttribute("data-theme") || "light";
        const next = current === "light" ? "dark" : "light";
        htmlElement.setAttribute("data-theme", next);
        saveTheme(next);
        updateThemeIcon(next, themeToggle);
      },
      { passive: true },
    );
  }

  // Initialize carousel if we are on index.html
  initCompetencyCarousel();

  // Apply configuration from config.json
  applyConfiguration();

  // Initialize modals
  initModals();

  // Initialize videos if we are on videos.html
  initVideosPage();

  // Initialize articles if we are on articles.html
  initArticlesPage();

  // Initialize Futuristic Canvas, 3D Tilt, and Scroll Reveal
  initHeroCanvas();
  initScrollReveal();
  init3DTilt();
}

async function initVideosPage() {
  const videosContainer = safe("#videosContainer");
  if (!videosContainer) return;

  try {
    const response = await fetch("./videos.json");
    if (!response.ok) throw new Error("Failed to fetch videos");

    const videos: VideoData[] = await response.json();
    const gridItems: GridItem[] = videos.map(v => ({
      title: v.title,
      description: v.description,
      date: v.date,
      thumbnail: v.thumbnail,
      topic: v.topic,
      url: v.youtubeUrl,
      showPlayIcon: true
    }));
    renderGrid(gridItems, videosContainer, { gridClass: 'grid-layout video-grid', cardClass: 'content-card', groupByTopic: true });
  } catch (error) {
    console.error("Error loading videos:", error);
    videosContainer.innerHTML =
      '<p class="error-message">Failed to load videos. Please try again later.</p>';
  }
}

function renderGrid(items: GridItem[], container: HTMLElement, options: { gridClass: string, cardClass: string, groupByTopic?: boolean }) {
  container.innerHTML = "";

  if (options.groupByTopic) {
    const grouped = items.reduce((acc, item) => {
      const topic = item.topic || "Other";
      if (!acc[topic]) acc[topic] = [];
      acc[topic].push(item);
      return acc;
    }, {} as Record<string, GridItem[]>);

    Object.entries(grouped).forEach(([topic, topicItems]) => {
      const section = document.createElement("div");
      section.className = "video-topic-section";

      const header = document.createElement("h2");
      header.className = "video-topic-header";
      header.textContent = topic;
      section.appendChild(header);

      const grid = document.createElement("div");
      grid.className = options.gridClass;

      topicItems.forEach(item => grid.appendChild(createCard(item, options.cardClass)));
      section.appendChild(grid);
      container.appendChild(section);
    });
  } else {
    const grid = document.createElement("div");
    grid.className = options.gridClass;
    items.forEach(item => grid.appendChild(createCard(item, options.cardClass)));
    container.appendChild(grid);
  }

  // Re-bind 3D tilt and scroll reveal observers for newly generated elements
  init3DTilt();
  initScrollReveal();
}

function createCard(item: GridItem, cardClass: string): HTMLElement {
  const card = document.createElement("div");
  card.className = cardClass;
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");

  const playOverlay = item.showPlayIcon ? `
    <div class="play-overlay">
      <div class="play-icon">
        <i class="fas fa-play"></i>
      </div>
    </div>
  ` : '';

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
  showArticles: true
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
    // Use embedded fallback if fetch fails
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
    const gridItems: GridItem[] = articles.map(a => ({
      title: a.title,
      description: a.description,
      date: a.date,
      thumbnail: a.thumbnail,
      topic: a.topic,
      url: a.link
    }));
    renderGrid(gridItems, articlesContainer, { gridClass: 'grid-layout articles-grid', cardClass: 'content-card' });
  } catch (error) {
    console.error("Error loading articles:", error);
    articlesContainer.innerHTML =
      '<p class="error-message">Failed to load articles. Please try again later.</p>';
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
  if (theme === "dark") icon.classList.add("fa-sun");
  else icon.classList.add("fa-moon");
}

// ========================================
// Competency Carousel & Modal Functionality
// ========================================

async function initModals() {
const EMBEDDED_SITE_DATA: CompetencyMap = {
  "product-strategy": {
    "icon": "fa-chess",
    "title": "Product Strategy",
    "description": "Defining vision, roadmaps, and go-to-market strategies that capture market opportunities and drive sustainable growth.",
    "capabilities": [
      "Market research and competitive analysis",
      "Product vision and roadmap development",
      "Prioritization frameworks (RICE, MoSCoW, Value vs. Effort)",
      "Go-to-market strategy and launch planning",
      "Stakeholder alignment and executive presentations"
    ]
  },
  "leadership": {
    "icon": "fa-users",
    "title": "Cross-functional Leadership",
    "description": "Building and empowering high-performance teams across engineering, design, and business functions to deliver exceptional outcomes.",
    "capabilities": [
      "Team building and mentorship",
      "Agile/Scrum methodology implementation",
      "Stakeholder management and communication",
      "Conflict resolution and decision-making",
      "Fostering innovation and continuous improvement"
    ]
  },
  "ux": {
    "icon": "fa-lightbulb",
    "title": "User Experience",
    "description": "Championing user-centric design thinking to create intuitive, accessible, and delightful product experiences.",
    "capabilities": [
      "User research and persona development",
      "Journey mapping and experience design",
      "Usability testing and feedback integration",
      "Accessibility compliance (WCAG)",
      "Design system governance and consistency"
    ]
  },
  "business": {
    "icon": "fa-chart-line",
    "title": "Business Goals",
    "description": "Aligning product initiatives with business objectives to drive revenue growth, operational efficiency, and measurable ROI.",
    "capabilities": [
      "KPI definition and OKR frameworks",
      "Revenue optimization and pricing strategy",
      "Cost-benefit analysis and business cases",
      "P&L ownership and budget management",
      "Data-driven decision making and analytics"
    ]
  },
  "testing": {
    "icon": "fa-cogs",
    "title": "Software Testing & Automation",
    "description": "Establishing robust quality assurance practices and automation frameworks to accelerate delivery while maintaining excellence.",
    "capabilities": [
      "Test Strategy and Planning",
      "Automation Framework Design (Robot Framework, Pytest, Playwright, Python)",
      "CI/CD Pipeline Integration (Jenkins, GitHub Actions)",
      "Performance and Load Testing (Locust)",
      "Quality Metrics Reporting and Defect Management"
    ]
  },
  "technical": {
    "icon": "fa-microchip",
    "title": "Technical & Domain Knowledge",
    "description": "Bridging the gap between complex technical systems and business outcomes with deep FinTech domain expertise.",
    "capabilities": [
      "API Design and Integration Patterns",
      "Database and Data Modeling Concepts",
      "Technical Debt Management and Modernization"
    ]
  },
  "cash-management": {
    "icon": "fa-money-bill-wave",
    "title": "Cash Management",
    "description": "Expertise in managing and optimizing organizational liquidity, treasury operations, and transaction flows.",
    "capabilities": [
      "Treasury Management Solutions",
      "Liquidity Forecasting and Optimization",
      "Cash Flow Analysis and Reporting",
      "Bank Relationship Management"
    ]
  },
  "core-banking": {
    "icon": "fa-university",
    "title": "Core Banking Products",
    "description": "Deep understanding of fundamental banking systems, deposit accounts, and term assets.",
    "capabilities": [
      "DDA (Demand Deposit Accounts) Management",
      "TDA (Term Deposit Accounts) and Savings Products",
      "Interest Calculation and Posting Engines",
      "Regulatory Reporting for Retail Banking"
    ]
  },
  "payments": {
    "icon": "fa-credit-card",
    "title": "Payments",
    "description": "Specialized in the architecture and delivery of modern transaction processing systems.",
    "capabilities": [
      "Cross-border and Domestic Payment Rails",
      "Tokenization and Secure Payment Processing",
      "ISO 20022 Messaging Standards",
      "Fraud Detection and Mitigation"
    ]
  },
  "collateral-management": {
    "icon": "fa-balance-scale",
    "title": "Collateral Management",
    "description": "Optimizing asset utilization and ensuring compliance in trading and credit operations.",
    "capabilities": [
      "Asset Optimization and Substitution",
      "Margin Call Automation and Management",
      "Regulatory Compliance (EMIR, Dodd-Frank)",
      "Risk Mitigation and Inventory Tracking"
    ]
  },
  "counterparty-risk": {
    "icon": "fa-user-shield",
    "title": "Counterparty Risk",
    "description": "Managing trading credit risk and ensuring organizational stability in financial markets.",
    "capabilities": [
      "Exposure Monitoring and Limit Management",
      "Credit Risk Scoring and Assessment",
      "Default Scenario Modeling",
      "Reporting and Stakeholder Dashboards"
    ]
  },
  "securities-data": {
    "icon": "fa-database",
    "title": "Securities Data",
    "description": "Mastery of reference data management for complex financial instruments.",
    "capabilities": [
      "Instrument Master Data Management",
      "Pricing Data Feeds and Integration",
      "Corporate Actions Processing",
      "Data Quality and Governance"
    ]
  },
  "software-dev": {
    "icon": "fa-code",
    "title": "Software Development",
    "description": "Technical foundation built on engineering excellence and robust architectural principles.",
    "capabilities": [
      "Full-Stack Development Experience",
      "System Architecture and Design",
      "Cloud-Native Application Development",
      "DevOps Mindset and Tooling"
    ]
  },
  "software-testing": {
    "icon": "fa-vial",
    "title": "Software Testing",
    "description": "Championing Quality Engineering to ensure reliable and high-performance product delivery.",
    "capabilities": [
      "Automated Testing Frameworks",
      "Functionality, Acceptance, and Regression Testing",
      "Quality Metrics and Analytics",
      "Shift-Left Test Strategies - Inspections, Reviews, and BDD"
    ]
  },
  "scrum-master": {
    "icon": "fa-users-cog",
    "title": "Scrum Master",
    "description": "Facilitating Agile delivery and empowering teams to reach peak performance.",
    "capabilities": [
      "Agile Ceremony Facilitation",
      "Team Coaching and Mentorship",
      "Roadblock Removal and Flow Optimization",
      "Servant Leadership"
    ]
  },
  "product-management": {
    "icon": "fa-briefcase",
    "title": "Product Management",
    "description": "Strategic leadership in product discovery, delivery, and lifecycle management.",
    "capabilities": [
      "Strategic Vision and Execution",
      "Customer Discovery and Insights",
      "Prioritization and Stakeholder Alignment",
      "Outcome-Driven Product Roadmaps"
    ]
  },
  "rbc-director": {
    "icon": "fa-building",
    "title": "Director, Product Management",
    "description": "Leading product strategy and delivery at RBC Capital Markets, focusing on process optimization and enterprise solutions.",
    "capabilities": [
      "Product Vision for Capital Markets Solutions",
      "Process Optimization and Digitization",
      "Cross-Functional Team Leadership",
      "Executive Stakeholder Management"
    ]
  },
  "citi-vp": {
    "icon": "fa-landmark",
    "title": "Vice President",
    "description": "Led key product initiatives at Citi, focusing on transaction processing and treasury solutions.",
    "capabilities": [
      "Technical Delivery Oversight for NAM (US)",
      "Platform Modernization",
      "Regulatory Compliance Technical Delivery",
      "Team Performance Management",
      "Technical Demands and Release Management"
    ]
  },
  "td-practice-lead": {
    "icon": "fa-check-circle",
    "title": "Practice Lead I",
    "description": "Championed Quality Engineering and practice standards at TD, driving excellence across multiple product lines.",
    "capabilities": [
      "Quality Engineering strategy and governance",
      "Automation COE leadership",
      "Strategic planning and resource optimization",
      "Mentorship of practice members"
    ]
  },
  "cognizant-sqe": {
    "icon": "fa-shield-halved",
    "title": "Senior Quality Engineer",
    "description": "Delivered high-quality software solutions for global financial clients at Cognizant.",
    "capabilities": [
      "Lead QA Engineer for Complex Fintech Projects",
      "Automation Framework Architecture",
      "Functionalities and Acceptance Testing",
      "Progress Reporting and Stakeholder Communication"
    ]
  }
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
    // Use embedded fallback if fetch fails on file:// or CORS block
  }

  const triggers = document.querySelectorAll("[data-modal-id], [data-competency]");
  
  triggers.forEach((trigger) => {
    const triggerEl = trigger as HTMLElement;
    const modalId = triggerEl.dataset.modalId || triggerEl.dataset.competency;
    
    if (!modalId) return;

    const openHandler = (ev: Event) => {
      ev.stopPropagation(); // Prevent document click handler from firing
      openModal(modalId, siteData, modal);
    };
    
    triggerEl.addEventListener("click", openHandler);
    triggerEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openHandler(e);
      }
    });

    // Ensure it's interactive
    if (!triggerEl.getAttribute("tabindex")) {
      triggerEl.setAttribute("tabindex", "0");
    }
    if (!triggerEl.getAttribute("role")) {
      triggerEl.setAttribute("role", "button");
    }
  });

  // Close logic
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
    // preventScroll helps in some browsers to avoid jumping to the element
    closeBtn.focus({ preventScroll: true });
  }
}

async function initCompetencyCarousel() {
  const carousel = safe(".competency-carousel");
  const prevBtn = safe<HTMLButtonElement>(".carousel-prev");
  const nextBtn = safe<HTMLButtonElement>(".carousel-next");
  const indicatorsContainer = safe(".carousel-indicators");
  const cards = safeAll<HTMLElement>(".competency-card");

  if (!carousel || !cards.length) return;

  // Create indicators
  cards.forEach((_, index) => {
    const indicator = document.createElement("button");
    indicator.type = "button";
    indicator.className = "indicator" + (index === 0 ? " active" : "");
    indicator.setAttribute("aria-label", "Go to slide " + (index + 1));
    indicator.addEventListener("click", () => scrollToCard(index));
    if (indicatorsContainer) {
      indicatorsContainer.appendChild(indicator);
    }
  });

  const indicators = indicatorsContainer
    ? indicatorsContainer.querySelectorAll(".indicator")
    : [];

  // Scroll to specific card
  function scrollToCard(index: number) {
    const card = cards[index];
    if (card && carousel) {
      const cardLeft = card.offsetLeft;
      const carouselWidth = carousel.offsetWidth;
      const cardWidth = card.offsetWidth;
      carousel.scrollTo({
        left: cardLeft - carouselWidth / 2 + cardWidth / 2,
        behavior: "smooth",
      });
    }
  }

  // Update active indicator based on scroll
  function updateIndicators() {
    if (!carousel) return;
    const scrollLeft = carousel.scrollLeft;
    const carouselWidth = carousel.offsetWidth;

    let activeIndex = 0;
    let minDistance = Infinity;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const carouselCenter = scrollLeft + carouselWidth / 2;
      const distance = Math.abs(cardCenter - carouselCenter);

      if (distance < minDistance) {
        minDistance = distance;
        activeIndex = index;
      }
    });

    indicators.forEach((ind, i) => {
      ind.classList.toggle("active", i === activeIndex);
    });

    // Update navigation button states
    if (prevBtn) {
      prevBtn.disabled = scrollLeft <= 10;
    }
    if (nextBtn) {
      nextBtn.disabled =
        scrollLeft >= carousel.scrollWidth - carousel.offsetWidth - 10;
    }
  }

  // Navigation
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      carousel.scrollBy({ left: -300, behavior: "smooth" });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      carousel.scrollBy({ left: 300, behavior: "smooth" });
    });
  }

  // Update indicators on scroll
  carousel.addEventListener("scroll", updateIndicators, { passive: true });
  updateIndicators();
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

  window.addEventListener("resize", () => {
    width = canvas.width = parent.offsetWidth || window.innerWidth;
    height = canvas.height = parent.offsetHeight || window.innerHeight;
  }, { passive: true });

  const numParticles = Math.min(Math.floor((width * height) / 11000), 75);
  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
  }> = [];

  const colors = ["#00f2fe", "#4facfe", "#8b5cf6", "#38bdf8"];

  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 2 + 1,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  let mouseX = width / 2;
  let mouseY = height / 2;

  window.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }, { passive: true });

  function animate() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // Draw particle connection lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 125) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 242, 254, ${0.22 * (1 - dist / 125)})`;
          ctx.lineWidth = 0.6;
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

      // Mouse attraction / repulsion
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const mouseDist = Math.sqrt(dx * dx + dy * dy);
      if (mouseDist < 120) {
        p.x -= (dx / mouseDist) * 0.4;
        p.y -= (dy / mouseDist) * 0.4;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
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
  const revealElements = document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale");
  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  revealElements.forEach((el) => observer.observe(el));
}

/**
 * 3D Interactive Card Tilt & Mouse Spotlight Tracking
 */
function init3DTilt(): void {
  const tiltCards = document.querySelectorAll<HTMLElement>(
    ".competency-card, .content-card, .tech-card, .domain-card, .cert-card, .stat-card, .portfolio-card, .timeline-content, .contact-form, .contact-info"
  );

  tiltCards.forEach((card) => {
    card.addEventListener("mousemove", (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    }, { passive: true });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)";
    }, { passive: true });
  });
}

// Run initialization on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUI, {
    once: true,
    passive: true,
  });
} else {
  // DOM already loaded
  initUI();
}
