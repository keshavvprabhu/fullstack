// src/scripts.ts
// Modular, typed, and safe implementation of the site UI behavior.
// This file is intended to be bundled for the browser (esbuild recommended).

declare const angular: any;

type Maybe<T> = T | null;

function safe<T extends HTMLElement = HTMLElement>(selector: string): Maybe<T> {
  return document.querySelector(selector) as Maybe<T>;
}

function safeAll<T extends HTMLElement = HTMLElement>(selector: string): NodeListOf<T> {
  return document.querySelectorAll(selector) as NodeListOf<T>;
}

// Initialize AngularJS module if available
if (typeof angular !== 'undefined') {
  try {
    angular.module('siteApp', []);
  } catch (e) {
    // module may already exist; ignore
  }
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
}

function updateThemeIcon(theme: string, button: Maybe<HTMLButtonElement>): void {
  if (!button) return;
  const icon = button.querySelector('i');
  if (!icon) return;
  icon.classList.remove('fa-moon', 'fa-sun');
  if (theme === 'dark') icon.classList.add('fa-sun');
  else icon.classList.add('fa-moon');
}

// Run initialization on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUI, { once: true, passive: true });
} else {
  // DOM already loaded
  initUI();
}

// Export nothing — this file is used for side effects when bundled
export {};

// Import page-specific modules so they are bundled. Each module checks whether
// the relevant DOM exists before running.
import './pages/subsidiaries';
