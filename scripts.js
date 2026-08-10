"use strict";
(() => {
  function safe(e) { return document.querySelector(e); }
  function safeAll(e) { return document.querySelectorAll(e); }

  function isStorageAvailable() {
    try {
      const e = "__storage_test__";
      localStorage.setItem(e, e);
      localStorage.removeItem(e);
      return true;
    } catch {
      return false;
    }
  }

  function getSavedTheme(defaultTheme = "light") {
    try {
      return isStorageAvailable() && localStorage.getItem("theme") || defaultTheme;
    } catch {
      return defaultTheme;
    }
  }

  function saveTheme(theme) {
    try {
      if (!isStorageAvailable()) return;
      localStorage.setItem("theme", theme);
    } catch {}
  }

  function initUI() {
    const menuToggle = safe("#menuToggle");
    const sidebarClose = safe("#sidebarClose");
    const sidebar = safe("#sidebar");
    const sidebarOverlay = safe("#sidebarOverlay");
    const themeToggle = safe("#themeToggle");
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
      menuToggle.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (!sidebar) return;
        if (sidebar.classList.contains("active")) closeSidebar();
        else openSidebar();
      }, { passive: true });
    }

    document.addEventListener("click", (ev) => {
      try {
        if (!sidebar || !sidebar.classList.contains("active")) return;
        const target = ev.target;
        if (!target || sidebar.contains(target) || (menuToggle && menuToggle.contains(target))) return;
        closeSidebar();
      } catch {}
    }, { passive: true });

    if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar, { passive: true });
    if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar, { passive: true });

    const sidebarLinks = safeAll(".sidebar-links a");
    if (sidebarLinks && sidebarLinks.length) {
      sidebarLinks.forEach(link => link.addEventListener("click", closeSidebar, { passive: true }));
    }

    const savedTheme = getSavedTheme("light");
    htmlElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme, themeToggle);

    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const current = htmlElement.getAttribute("data-theme") || "light";
        const next = current === "light" ? "dark" : "light";
        htmlElement.setAttribute("data-theme", next);
        saveTheme(next);
        updateThemeIcon(next, themeToggle);
      }, { passive: true });
    }

    initCompetencyCarousel();
    applyConfiguration();
    initModals();
    initVideosPage();
    initArticlesPage();
    initHeroCanvas();
    initScrollReveal();
    init3DTilt();
  }

  const EMBEDDED_VIDEOS = [
    {
      "title": "LinkedIn Profile View",
      "description": "A walkthrough of my LinkedIn professional profile, showcasing my experience, skills, and professional network.",
      "date": "January 18, 2026",
      "thumbnail": "./assets/videos/linkedin_profile_view.webp",
      "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "topic": "Profile Walkthroughs"
    },
    {
      "title": "Strategy & Prioritization Walkthrough",
      "description": "A deep dive into product strategy, prioritization frameworks, and driving impactful outcomes.",
      "date": "January 19, 2026",
      "thumbnail": "https://img.youtube.com/vi/3JmPWUrpnS0/maxresdefault.jpg",
      "youtubeUrl": "https://www.youtube.com/watch?v=3JmPWUrpnS0",
      "topic": "Product Strategy & Insights"
    },
    {
      "title": "Technical Roadmap Session",
      "description": "How to align technical debt, feature requests, and long-term vision into a cohesive product roadmap.",
      "date": "January 20, 2026",
      "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "topic": "Product Strategy & Insights"
    }
  ];

  const EMBEDDED_ARTICLES = [
    {
      "title": "Wickets to Widgets",
      "description": "Wickets to Widgets - Similarities between Cricket and Software Industry",
      "date": "2026-01-15",
      "thumbnail": "https://miro.medium.com/v2/resize:fit:1100/format:webp/1*oThTsM0q-ri1SLrQ6TOi_A.jpeg",
      "link": "https://medium.com/@keshavvprabhu/wickets-to-widgets-cricket-to-software-industry-69188dffbfff",
      "topic": "Wickets to Widgets"
    },
    {
      "title": "Learn Fast, Learn Well",
      "description": "How to learn something really fast.",
      "date": "2026-01-20",
      "thumbnail": "https://miro.medium.com/v2/resize:fit:786/format:webp/1*gnLozTVKrxn5fAlm7YwSjA.png",
      "link": "https://medium.com/@keshavvprabhu/how-to-learn-something-really-fast-fb39f0f0420a",
      "topic": "Learn Fast, Learn Well"
    },
    {
      "title": "Virtual Accounts — Why they matter?",
      "description": "A brief overview of Virtual Accounts and how they help in Cash Management.",
      "date": "2026-02-01",
      "thumbnail": "https://miro.medium.com/v2/resize:fit:1100/format:webp/1*wwbqvQOCqygF4FRkiEbYew.jpeg",
      "link": "https://medium.com/@keshavvprabhu/understanding-virtual-accounts-68d8759e8f83",
      "topic": "Virtual Accounts"
    },
    {
      "title": "Smart Contracts - A brief overview",
      "description": "A brief overview of Smart Contracts and how they help in Cash Management.",
      "date": "2026-02-01",
      "thumbnail": "https://miro.medium.com/v2/resize:fit:1100/format:webp/1*2wCCgzQaC9ubtEDMqdExbw.jpeg",
      "link": "https://medium.com/@keshavvprabhu/smart-contracts-what-is-it-and-why-it-matters-f04e702f3549",
      "topic": "Smart Contracts"
    },
    {
      "title": "Let's (not) take it offline",
      "description": "How to Prevent “Let’s Take It Offline” From Killing Momentum or Accountability",
      "date": "2026-02-15",
      "thumbnail": "https://miro.medium.com/v2/resize:fit:1100/format:webp/1*vECPysuGyBYaCMY_Ny9ODA.jpeg",
      "link": "https://medium.com/@keshavvprabhu/how-to-prevent-lets-take-it-offline-from-killing-momentum-or-accountability-dea0a607005f",
      "topic": "Let's (not) take it offline"
    },
    {
      "title": "Driving Effective Meetings",
      "description": "Driving Effective Meetings — A scripted approach",
      "date": "2026-02-15",
      "thumbnail": "https://miro.medium.com/v2/resize:fit:1100/format:webp/1*-DgFbEmJdCbe6eAbYgZWuA.jpeg",
      "link": "https://medium.com/@keshavvprabhu/driving-effective-meetings-a-scripted-approach-b3462e95659a",
      "topic": "Driving Effective Meetings"
    },
    {
      "title": "SWIFT MT to MX Quick Reference",
      "description": "SWIFT MT to MX Quick Reference",
      "date": "2026-06-08",
      "thumbnail": "https://miro.medium.com/v2/resize:fit:1100/format:webp/1*mdDv03n2LJRjmMr4qhvKag.jpeg",
      "link": "https://medium.com/@keshavvprabhu/mt-to-mx-quick-reference-6243a0437ce3",
      "topic": "SWIFT MT to MX Quick Reference"
    }
  ];

  async function initVideosPage() {
    const container = safe("#videosContainer");
    if (!container) return;
    let videos = EMBEDDED_VIDEOS;
    try {
      const res = await fetch("./videos.json");
      if (res.ok) videos = await res.json();
    } catch (err) {
      // Use embedded videos fallback
    }
    const items = videos.map(v => ({
      title: v.title,
      description: v.description,
      date: v.date,
      thumbnail: v.thumbnail,
      topic: v.topic,
      url: v.youtubeUrl,
      showPlayIcon: true
    }));
    renderGrid(items, container, { gridClass: "grid-layout video-grid", cardClass: "content-card", groupByTopic: true });
  }

  function renderGrid(items, container, options) {
    container.innerHTML = "";
    if (options.groupByTopic) {
      const grouped = items.reduce((acc, item) => {
        const topic = item.topic || "Other";
        if (!acc[topic]) acc[topic] = [];
        acc[topic].push(item);
        return acc;
      }, {});

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
    init3DTilt();
    initScrollReveal();
  }

  function createCard(item, cardClass) {
    const card = document.createElement("div");
    card.className = cardClass;
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    const playOverlay = item.showPlayIcon ? `
      <div class="play-overlay">
        <div class="play-icon">
          <i class="fas fa-play"></i>
        </div>
      </div>` : "";
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

  async function applyConfiguration() {
    try {
      const res = await fetch("./config.json");
      if (!res.ok) return;
      const config = await res.json();
      if (config.showVideos === false) {
        document.querySelectorAll('a[href="videos.html"]').forEach(link => {
          const li = link.closest("li");
          if (li) li.style.display = "none";
          else link.style.display = "none";
        });
      }
      if (config.showArticles === false) {
        document.querySelectorAll('a[href="articles.html"]').forEach(link => {
          const li = link.closest("li");
          if (li) li.style.display = "none";
          else link.style.display = "none";
        });
      }
    } catch (err) {
      console.error("Failed to apply configuration:", err);
    }
  }

  async function initArticlesPage() {
    const container = safe("#articlesContainer");
    if (!container) return;
    let articles = EMBEDDED_ARTICLES;
    try {
      const res = await fetch("./articles.json");
      if (res.ok) articles = await res.json();
    } catch (err) {
      // Use embedded articles fallback
    }
    const items = articles.map(a => ({
      title: a.title,
      description: a.description,
      date: a.date,
      thumbnail: a.thumbnail,
      topic: a.topic,
      url: a.link
    }));
    renderGrid(items, container, { gridClass: "grid-layout articles-grid", cardClass: "content-card" });
  }

  function updateThemeIcon(theme, button) {
    if (!button) return;
    const icon = button.querySelector("i");
    if (!icon) return;
    icon.classList.remove("fa-moon", "fa-sun");
    if (theme === "dark") icon.classList.add("fa-sun");
    else icon.classList.add("fa-moon");
  }

  const EMBEDDED_SITE_DATA = {
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
    let dataMap = Object.assign({}, EMBEDDED_SITE_DATA);
    try {
      const res = await fetch("./site_data.json");
      if (res.ok) {
        const fetched = await res.json();
        dataMap = Object.assign({}, dataMap, fetched);
      }
    } catch (err) {
      // Use embedded fallback if fetch fails on file:// or CORS block
    }

    const triggers = safeAll("[data-modal-id], [data-competency]");
    triggers.forEach(trigger => {
      const key = trigger.dataset.modalId || trigger.dataset.competency;
      if (!key) return;
      const handler = (e) => {
        e.stopPropagation();
        openModal(key, dataMap, modal);
      };
      trigger.addEventListener("click", handler);
      trigger.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handler(e);
        }
      });
      if (!trigger.getAttribute("tabindex")) trigger.setAttribute("tabindex", "0");
      if (!trigger.getAttribute("role")) trigger.setAttribute("role", "button");
    });

    const closeBtn = modal.querySelector(".modal-close");
    const overlay = modal.querySelector(".modal-overlay");
    function closeModal() {
      modal.classList.remove("active");
      document.body.style.overflow = "auto";
    }
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (overlay) overlay.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("active")) closeModal();
    });
  }

  function openModal(key, dataMap, modal) {
    const data = dataMap[key];
    if (!data) return;
    const iconEl = modal.querySelector(".modal-icon i");
    const titleEl = modal.querySelector(".modal-title");
    const descEl = modal.querySelector(".modal-description");
    const capEl = modal.querySelector(".modal-capabilities");

    if (iconEl) iconEl.className = "fas " + data.icon;
    if (titleEl) titleEl.textContent = data.title;
    if (descEl) descEl.textContent = data.description;
    if (capEl) {
      capEl.innerHTML = "";
      data.capabilities.forEach(cap => {
        const li = document.createElement("li");
        li.textContent = cap;
        capEl.appendChild(li);
      });
    }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
    const closeBtn = modal.querySelector(".modal-close");
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  async function initCompetencyCarousel() {
    const carousel = safe(".competency-carousel");
    const prevBtn = safe(".carousel-prev");
    const nextBtn = safe(".carousel-next");
    const indicatorsContainer = safe(".carousel-indicators");
    const cards = safeAll(".competency-card");

    if (!carousel || !cards.length) return;

    cards.forEach((_, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "indicator" + (idx === 0 ? " active" : "");
      btn.setAttribute("aria-label", "Go to slide " + (idx + 1));
      btn.addEventListener("click", () => scrollToCard(idx));
      if (indicatorsContainer) indicatorsContainer.appendChild(btn);
    });

    const indicators = indicatorsContainer ? indicatorsContainer.querySelectorAll(".indicator") : [];

    function scrollToCard(idx) {
      const card = cards[idx];
      if (card && carousel) {
        const cardLeft = card.offsetLeft;
        const carouselWidth = carousel.offsetWidth;
        const cardWidth = card.offsetWidth;
        carousel.scrollTo({
          left: cardLeft - carouselWidth / 2 + cardWidth / 2,
          behavior: "smooth"
        });
      }
    }

    function updateIndicators() {
      if (!carousel) return;
      const scrollLeft = carousel.scrollLeft;
      const carouselWidth = carousel.offsetWidth;
      let activeIndex = 0;
      let minDistance = Infinity;

      cards.forEach((card, idx) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const carouselCenter = scrollLeft + carouselWidth / 2;
        const dist = Math.abs(cardCenter - carouselCenter);
        if (dist < minDistance) {
          minDistance = dist;
          activeIndex = idx;
        }
      });

      indicators.forEach((ind, i) => ind.classList.toggle("active", i === activeIndex));
      if (prevBtn) prevBtn.disabled = scrollLeft <= 10;
      if (nextBtn) nextBtn.disabled = scrollLeft >= carousel.scrollWidth - carousel.offsetWidth - 10;
    }

    if (prevBtn) prevBtn.addEventListener("click", () => carousel.scrollBy({ left: -300, behavior: "smooth" }));
    if (nextBtn) nextBtn.addEventListener("click", () => carousel.scrollBy({ left: 300, behavior: "smooth" }));
    carousel.addEventListener("scroll", updateIndicators, { passive: true });
    updateIndicators();
  }

  function initHeroCanvas() {
    const canvas = safe("#heroCanvas");
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
    const particles = [];
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

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

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

  function initScrollReveal() {
    const elements = document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale");
    if (!elements.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("active");
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    elements.forEach(el => observer.observe(el));
  }

  function init3DTilt() {
    const cards = document.querySelectorAll(
      ".competency-card, .content-card, .tech-card, .domain-card, .cert-card, .stat-card, .portfolio-card, .timeline-content, .contact-form, .contact-info"
    );
    cards.forEach(card => {
      card.addEventListener("mousemove", (e) => {
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUI, { once: true, passive: true });
  } else {
    initUI();
  }
})();
