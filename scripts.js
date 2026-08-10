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

  async function initVideosPage() {
    const container = safe("#videosContainer");
    if (!container) return;
    try {
      const res = await fetch("./videos.json");
      if (!res.ok) throw new Error("Failed to fetch videos");
      const videos = await res.json();
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
    } catch (err) {
      console.error("Error loading videos:", err);
      container.innerHTML = '<p class="error-message">Failed to load videos. Please try again later.</p>';
    }
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
    try {
      const res = await fetch("./articles.json");
      if (!res.ok) throw new Error("Failed to fetch articles");
      const articles = await res.json();
      const items = articles.map(a => ({
        title: a.title,
        description: a.description,
        date: a.date,
        thumbnail: a.thumbnail,
        topic: a.topic,
        url: a.link
      }));
      renderGrid(items, container, { gridClass: "grid-layout articles-grid", cardClass: "content-card" });
    } catch (err) {
      console.error("Error loading articles:", err);
      container.innerHTML = '<p class="error-message">Failed to load articles. Please try again later.</p>';
    }
  }

  function updateThemeIcon(theme, button) {
    if (!button) return;
    const icon = button.querySelector("i");
    if (!icon) return;
    icon.classList.remove("fa-moon", "fa-sun");
    if (theme === "dark") icon.classList.add("fa-sun");
    else icon.classList.add("fa-moon");
  }

  async function initModals() {
    const modal = safe("#siteModal");
    if (!modal) return;
    let dataMap = {};
    try {
      const res = await fetch("./site_data.json");
      if (res.ok) dataMap = await res.json();
    } catch (err) {
      console.error("Failed to load site data:", err);
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
