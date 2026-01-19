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

function safe<T extends HTMLElement = HTMLElement>(selector: string): Maybe<T> {
  return document.querySelector(selector) as Maybe<T>;
}

function safeAll<T extends HTMLElement = HTMLElement>(selector: string): NodeListOf<T> {
  return document.querySelectorAll(selector) as NodeListOf<T>;
}


function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

function getSavedTheme(defaultTheme = 'light'): string {
  try {
    if (!isStorageAvailable()) return defaultTheme;
    return localStorage.getItem('theme') || defaultTheme;
  } catch (e) {
    return defaultTheme;
  }
}

function saveTheme(theme: string): void {
  try {
    if (!isStorageAvailable()) return;
    localStorage.setItem('theme', theme);
  } catch (e) {
    // ignore storage errors
  }
}

function initUI(): void {
  const menuToggle = safe<HTMLButtonElement>('#menuToggle');
  const sidebarClose = safe<HTMLButtonElement>('#sidebarClose');
  const sidebar = safe<HTMLElement>('#sidebar');
  const sidebarOverlay = safe<HTMLElement>('#sidebarOverlay');
  const themeToggle = safe<HTMLButtonElement>('#themeToggle');
  const htmlElement = document.documentElement;

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('active');
    if (sidebarOverlay) sidebarOverlay.classList.add('active');
    // Prevent body scroll when sidebar is active
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('active');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
  if (menuToggle) {
    menuToggle.addEventListener('click', (ev: Event) => {
      // prevent the document click handler from immediately closing the sidebar
      ev.stopPropagation();
      if (!sidebar) return;
      if (sidebar.classList.contains('active')) closeSidebar(); else openSidebar();
    }, { passive: true });
  }
  // Close sidebar when clicking anywhere outside it
  document.addEventListener('click', (ev: Event) => {
    try {
      if (!sidebar) return;
      if (!sidebar.classList.contains('active')) return;
      const target = ev.target as Node | null;
      if (!target) return;
      if (sidebar.contains(target)) return;
      if (menuToggle && menuToggle.contains(target)) return;
      // click was outside sidebar/menu, close it
      closeSidebar();
    } catch (e) {
      // ignore
    }
  }, { passive: true });
  if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar, { passive: true });
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar, { passive: true });

  // Close sidebar when clicking on a link inside it
  const sidebarLinks = safeAll<HTMLAnchorElement>('.sidebar-links a');
  if (sidebarLinks && sidebarLinks.length) {
    sidebarLinks.forEach((link) => link.addEventListener('click', closeSidebar, { passive: true }));
  }

  // Theme toggle
  const savedTheme = getSavedTheme('light');
  htmlElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme, themeToggle);

  if (themeToggle) {
    themeToggle.addEventListener(
      'click',
      () => {
        const current = htmlElement.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        htmlElement.setAttribute('data-theme', next);
        saveTheme(next);
        updateThemeIcon(next, themeToggle);
      },
      { passive: true }
    );
  }

  // Initialize carousel if we are on index.html
  initCompetencyCarousel();

  // Initialize videos if we are on videos.html
  initVideosPage();
}

async function initVideosPage() {
  const videosContainer = safe('#videosContainer');
  if (!videosContainer) return;

  try {
    const response = await fetch('./videos.json');
    if (!response.ok) throw new Error('Failed to fetch videos');
    
    const videos: VideoData[] = await response.json();
    renderVideos(videos, videosContainer);
  } catch (error) {
    console.error('Error loading videos:', error);
    videosContainer.innerHTML = '<p class="error-message">Failed to load videos. Please try again later.</p>';
  }
}

function renderVideos(videos: VideoData[], container: HTMLElement) {
  container.innerHTML = '';

  // Group videos by topic
  const groupedVideos = videos.reduce((acc, video) => {
    const topic = video.topic || 'Other';
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(video);
    return acc;
  }, {} as Record<string, VideoData[]>);

  // Render sections for each topic
  Object.entries(groupedVideos).forEach(([topic, topicVideos]) => {
    const section = document.createElement('div');
    section.className = 'video-topic-section';

    const header = document.createElement('h2');
    header.className = 'video-topic-header';
    header.textContent = topic;
    section.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'recordings-grid';

    topicVideos.forEach(video => {
      const card = document.createElement('div');
      card.className = 'recording-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      
      card.innerHTML = `
        <div class="recording-thumbnail">
          <img src="${video.thumbnail}" alt="${video.title}" class="recording-video">
          <div class="play-overlay">
            <div class="play-icon">
              <i class="fas fa-play"></i>
            </div>
          </div>
        </div>
        <div class="recording-info">
          <h3>${video.title}</h3>
          <p>${video.description}</p>
          <div class="recording-date"><i class="fas fa-calendar-alt"></i> ${video.date}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        window.open(video.youtubeUrl, '_blank', 'noopener,noreferrer');
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.open(video.youtubeUrl, '_blank', 'noopener,noreferrer');
        }
      });

      grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
  });
}

function updateThemeIcon(theme: string, button: Maybe<HTMLButtonElement>): void {
  if (!button) return;
  const icon = button.querySelector('i');
  if (!icon) return;
  icon.classList.remove('fa-moon', 'fa-sun');
  if (theme === 'dark') icon.classList.add('fa-sun');
  else icon.classList.add('fa-moon');
}

// ========================================
// Competency Carousel & Modal Functionality
// ========================================

async function initCompetencyCarousel() {
  const carousel = safe('.competency-carousel');
  const prevBtn = safe<HTMLButtonElement>('.carousel-prev');
  const nextBtn = safe<HTMLButtonElement>('.carousel-next');
  const indicatorsContainer = safe('.carousel-indicators');
  const cards = safeAll<HTMLElement>('.competency-card');
  const modal = safe('#competencyModal');

  if (!carousel || !cards.length) return;

  // Load competency data from external JSON
  let competencyData: CompetencyMap = {};
  try {
    const response = await fetch('./competencies.json');
    if (response.ok) {
      competencyData = await response.json();
    }
  } catch (error) {
    console.error('Failed to load competency data:', error);
    // Data won't be available, modal won't show content properly
  }

  // Create indicators
  cards.forEach((_, index) => {
    const indicator = document.createElement('button');
    indicator.type = 'button';
    indicator.className = 'indicator' + (index === 0 ? ' active' : '');
    indicator.setAttribute('aria-label', 'Go to slide ' + (index + 1));
    indicator.addEventListener('click', () => scrollToCard(index));
    if (indicatorsContainer) {
      indicatorsContainer.appendChild(indicator);
    }
  });

  const indicators = indicatorsContainer ? indicatorsContainer.querySelectorAll('.indicator') : [];

  // Scroll to specific card
  function scrollToCard(index: number) {
    const card = cards[index];
    if (card && carousel) {
      const cardLeft = card.offsetLeft;
      const carouselWidth = carousel.offsetWidth;
      const cardWidth = card.offsetWidth;
      carousel.scrollTo({
        left: cardLeft - (carouselWidth / 2) + (cardWidth / 2),
        behavior: 'smooth'
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
      ind.classList.toggle('active', i === activeIndex);
    });

    // Update navigation button states
    if (prevBtn) {
      prevBtn.disabled = scrollLeft <= 10;
    }
    if (nextBtn) {
      nextBtn.disabled = scrollLeft >= carousel.scrollWidth - carousel.offsetWidth - 10;
    }
  }

  // Navigation
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: -300, behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: 300, behavior: 'smooth' });
    });
  }

  // Update indicators on scroll
  carousel.addEventListener('scroll', updateIndicators, { passive: true });
  updateIndicators();

  // Card click - open modal
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const competencyKey = card.dataset.competency;
      if (competencyKey) openModal(competencyKey);
    });

    // Keyboard accessibility
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const competencyKey = card.dataset.competency;
        if (competencyKey) openModal(competencyKey);
      }
    });
  });

  // Modal functionality
  function openModal(competencyKey: string) {
    const data = competencyData[competencyKey];
    if (!data || !modal) return;

    // Update modal content
    const modalIcon = modal.querySelector('.modal-icon i');
    const modalTitle = modal.querySelector('.modal-title');
    const modalDesc = modal.querySelector('.modal-description');
    const modalCaps = modal.querySelector('.modal-capabilities');

    if (modalIcon) {
      modalIcon.className = 'fas ' + data.icon;
    }
    if (modalTitle) {
      modalTitle.textContent = data.title;
    }
    if (modalDesc) {
      modalDesc.textContent = data.description;
    }
    if (modalCaps) {
      modalCaps.innerHTML = '';
      data.capabilities.forEach(cap => {
        const li = document.createElement('li');
        li.textContent = cap;
        modalCaps.appendChild(li);
      });
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus trap
    const closeBtn = modal.querySelector<HTMLButtonElement>('.modal-close');
    if (closeBtn) {
      closeBtn.focus();
    }
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  // Close modal events
  const closeBtn = modal ? modal.querySelector('.modal-close') : null;
  const overlay = modal ? modal.querySelector('.modal-overlay') : null;

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
  if (overlay) {
    overlay.addEventListener('click', closeModal);
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

// Run initialization on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUI, { once: true, passive: true });
} else {
  // DOM already loaded
  initUI();
}

