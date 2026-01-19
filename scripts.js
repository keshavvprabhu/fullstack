"use strict";
(() => {
  function g(t) {
    return document.querySelector(t);
  }
  function h() {
    let t = g("#subsidiaryForm");
    if (!t) return;
    let o = g("#addSubsidiary"),
      n = g("#subsidiaryList"),
      i = g("#formMessage"),
      d = g("#subsidiaryDetailsSection"),
      l = [];
    function p() {
      let e = new FormData(t);
      return {
        immediateOriginId: String(e.get("immediateOriginId") || "").trim(),
        companyId: String(e.get("companyId") || "").trim(),
        onBehalf: String(e.get("onBehalf") || "self"),
        subsidiaryName: String(e.get("subsidiaryName") || "").trim(),
        address1: String(e.get("address1") || "").trim(),
        address2: String(e.get("address2") || "").trim(),
        city: String(e.get("city") || "").trim(),
        state: String(e.get("state") || "").trim(),
        postal: String(e.get("postal") || "").trim(),
        country: String(e.get("country") || "US"),
      };
    }
    function c(e) {
      if (!e.immediateOriginId || e.immediateOriginId.length > 10)
        return "Immediate Origin ID is required (max 10 chars).";
      if (!e.companyId || e.companyId.length > 10)
        return "Company ID is required (max 10 chars).";
      if (e.onBehalf === "other") {
        if (!e.subsidiaryName) return "Subsidiary Name is required.";
        if (!e.address1) return "Address Line 1 is required.";
        if (!e.city) return "City is required.";
        if (!e.state) return "State/Province is required.";
        if (!e.postal) return "Postal Code is required.";
        if (!e.country) return "Country is required.";
      }
      return "";
    }
    function y(e) {
      if (e) for (; e.firstChild;) e.removeChild(e.firstChild);
    }
    function m() {
      if (!n) return;
      if ((y(n), !l.length)) {
        let r = document.createElement("p");
        (r.textContent = "No subsidiaries added yet."), n.appendChild(r);
        return;
      }
      let e = document.createElement("ul");
      (e.className = "expertise-list subsidiary-list"),
        l.forEach((r) => {
          let a = document.createElement("li");
          a.className = "subsidiary-item";
          let f = document.createElement("strong");
          (f.textContent = r.subsidiaryName || "(no name)"), a.appendChild(f);
          let M = document.createTextNode(
            " (" + (r.city || "") + ", " + (r.state || "") + ")"
          );
          a.appendChild(M);
          let E = document.createElement("div");
          (E.className = "subsidiary-meta"),
            (E.textContent =
              "Origin ID: " +
              r.immediateOriginId +
              "  Company ID: " +
              r.companyId),
            a.appendChild(E),
            e.appendChild(a);
        }),
        n.appendChild(e);
    }
    function u() { }
    function s() {
      try {
        if (!d || !t) return;
        let e = t.querySelector('select[name="onBehalf"]'),
          r = e ? e.value : "self",
          a = d.querySelectorAll("input, select, textarea");
        r === "other"
          ? (d.classList.remove("hidden"),
            a.forEach((f) => {
              f.disabled = !1;
            }))
          : (d.classList.add("hidden"),
            a.forEach((f) => {
              f.disabled = !0;
            }));
      } catch (e) {
        console.warn("updateSubsidiaryVisibility", e);
      }
    }
    o &&
      o.addEventListener(
        "click",
        () => {
          let e = p(),
            r = c(e);
          if (r) {
            i && (i.textContent = r);
            return;
          }
          l.push(e),
            m(),
            i &&
            ((i.textContent = "Subsidiary added."),
              setTimeout(() => {
                i && (i.textContent = "");
              }, 2500));
        },
        { passive: !0 }
      ),
      t &&
      t.addEventListener("submit", (e) => {
        e.preventDefault();
        let r = p(),
          a = c(r);
        if (a) {
          i && (i.textContent = a);
          return;
        }
        l.push(r),
          m(),
          i &&
          (i.textContent =
            "Enrollment submitted. " +
            l.length +
            " subsidiaries included.");
      });
    let T = g('select[name="onBehalf"]');
    T &&
      T.addEventListener(
        "change",
        () => {
          s();
        },
        { passive: !0 }
      ),
      m(),
      s();
  }
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", h, {
      once: !0,
      passive: !0,
    })
    : h();
  function L(t) {
    return document.querySelector(t);
  }
  function H(t) {
    return document.querySelectorAll(t);
  }
  if (typeof angular < "u")
    try {
      angular.module("siteApp", []);
    } catch { }
  function S() {
    try {
      let t = "__storage_test__";
      return localStorage.setItem(t, t), localStorage.removeItem(t), !0;
    } catch {
      return !1;
    }
  }
  function C(t = "light") {
    try {
      return (S() && localStorage.getItem("theme")) || t;
    } catch {
      return t;
    }
  }
  function I(t) {
    try {
      if (!S()) return;
      localStorage.setItem("theme", t);
    } catch { }
  }
  function v() {
    let t = L("#menuToggle"),
      o = L("#sidebarClose"),
      n = L("#sidebar"),
      i = L("#sidebarOverlay"),
      d = L("#themeToggle"),
      l = document.documentElement;
    function p() {
      n &&
        (n.classList.add("active"),
          i && i.classList.add("active"),
          (document.body.style.overflow = "hidden"));
    }
    function c() {
      n &&
        (n.classList.remove("active"),
          i && i.classList.remove("active"),
          (document.body.style.overflow = "auto"));
    }
    t &&
      t.addEventListener(
        "click",
        (u) => {
          u.stopPropagation(),
            n && (n.classList.contains("active") ? c() : p());
        },
        { passive: !0 }
      ),
      document.addEventListener(
        "click",
        (u) => {
          try {
            if (!n || !n.classList.contains("active")) return;
            let s = u.target;
            if (!s || n.contains(s) || (t && t.contains(s))) return;
            c();
          } catch { }
        },
        { passive: !0 }
      ),
      o && o.addEventListener("click", c, { passive: !0 }),
      i && i.addEventListener("click", c, { passive: !0 });
    let y = H(".sidebar-links a");
    y &&
      y.length &&
      y.forEach((u) => u.addEventListener("click", c, { passive: !0 }));
    let m = C("light");
    l.setAttribute("data-theme", m),
      b(m, d),
      d &&
      d.addEventListener(
        "click",
        () => {
          let s =
            (l.getAttribute("data-theme") || "light") === "light"
              ? "dark"
              : "light";
          l.setAttribute("data-theme", s), I(s), b(s, d);
        },
        { passive: !0 }
      );
  }
  function b(t, o) {
    if (!o) return;
    let n = o.querySelector("i");
    n &&
      (n.classList.remove("fa-moon", "fa-sun"),
        t === "dark" ? n.classList.add("fa-sun") : n.classList.add("fa-moon"));
  }
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", v, {
      once: !0,
      passive: !0,
    })
    : v();
})();

// ========================================
// Competency Carousel & Modal Functionality
// ========================================
(function () {
  'use strict';

  // Competency data with detailed capabilities
  const competencyData = {
    'product-strategy': {
      icon: 'fa-chess',
      title: 'Product Strategy',
      description: 'Defining vision, roadmaps, and go-to-market strategies that capture market opportunities and drive sustainable growth.',
      capabilities: [
        'Market research and competitive analysis',
        'Product vision and roadmap development',
        'Prioritization frameworks (RICE, MoSCoW, Value vs. Effort)',
        'Go-to-market strategy and launch planning',
        'Stakeholder alignment and executive presentations'
      ]
    },
    'leadership': {
      icon: 'fa-users',
      title: 'Cross-functional Leadership',
      description: 'Building and empowering high-performance teams across engineering, design, and business functions to deliver exceptional outcomes.',
      capabilities: [
        'Team building and mentorship',
        'Agile/Scrum methodology implementation',
        'Stakeholder management and communication',
        'Conflict resolution and decision-making',
        'Fostering innovation and continuous improvement'
      ]
    },
    'ux': {
      icon: 'fa-lightbulb',
      title: 'User Experience',
      description: 'Championing user-centric design thinking to create intuitive, accessible, and delightful product experiences.',
      capabilities: [
        'User research and persona development',
        'Journey mapping and experience design',
        'Usability testing and feedback integration',
        'Accessibility compliance (WCAG)',
        'Design system governance and consistency'
      ]
    },
    'business': {
      icon: 'fa-chart-line',
      title: 'Business Goals',
      description: 'Aligning product initiatives with business objectives to drive revenue growth, operational efficiency, and measurable ROI.',
      capabilities: [
        'KPI definition and OKR frameworks',
        'Revenue optimization and pricing strategy',
        'Cost-benefit analysis and business cases',
        'P&L ownership and budget management',
        'Data-driven decision making and analytics'
      ]
    },
    'testing': {
      icon: 'fa-cogs',
      title: 'Software Testing & Automation',
      description: 'Establishing robust quality assurance practices and automation frameworks to accelerate delivery while maintaining excellence.',
      capabilities: [
        'Test Strategy and Planning',
        'Automation Framework Design (Robot Framework, Pytest, Playwright)',
        'CI/CD Pipeline Integration (Jenkins, GitHub Actions)',
        'Performance and Load Testing (Locust)',
        'Quality Metrics and Defect Management'
      ]
    },
    'technical': {
      icon: 'fa-microchip',
      title: 'Technical & Domain Knowledge',
      description: 'Bridging the gap between complex technical systems and business outcomes with deep FinTech domain expertise.',
      capabilities: [
        'API design and integration patterns',
        'Database and data modeling concepts',
        'Technical debt management and modernization'
      ]
    }
  };

  function initCompetencyCarousel() {
    const carousel = document.querySelector('.competency-carousel');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    const indicatorsContainer = document.querySelector('.carousel-indicators');
    const cards = document.querySelectorAll('.competency-card');
    const modal = document.getElementById('competencyModal');

    if (!carousel || !cards.length) return;

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
    function scrollToCard(index) {
      const card = cards[index];
      if (card) {
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
        openModal(competencyKey);
      });

      // Keyboard accessibility
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const competencyKey = card.dataset.competency;
          openModal(competencyKey);
        }
      });
    });

    // Modal functionality
    function openModal(competencyKey) {
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
      const closeBtn = modal.querySelector('.modal-close');
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

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCompetencyCarousel, { once: true, passive: true });
  } else {
    initCompetencyCarousel();
  }
})();
//# sourceMappingURL=scripts.js.map
