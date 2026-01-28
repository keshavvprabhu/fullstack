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

async function applyConfiguration() {
  try {
    const response = await fetch("./config.json");
    if (!response.ok) return;

    const config: ConfigData = await response.json();

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
  } catch (error) {
    console.error("Failed to apply configuration:", error);
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
  const modal = safe("#siteModal");
  if (!modal) return;

  let siteData: CompetencyMap = {};
  try {
    const response = await fetch("./site_data.json");
    if (response.ok) {
      siteData = await response.json();
    }
  } catch (error) {
    console.error("Failed to load site data:", error);
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
    // Optional: return focus to last trigger if tracked
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
