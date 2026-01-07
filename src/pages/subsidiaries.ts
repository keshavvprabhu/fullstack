// src/pages/subsidiaries.ts
// Page-specific logic for subsidiaries.html — DOM-safe and typed.
type Subsidiary = {
  immediateOriginId: string;
  companyId: string;
  onBehalf: string;
  subsidiaryName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postal: string;
  country: string;
};

function q<T extends HTMLElement = HTMLElement>(sel: string): T | null {
  return document.querySelector(sel) as T | null;
}

function qAll<T extends HTMLElement = HTMLElement>(sel: string): NodeListOf<T> {
  return document.querySelectorAll(sel) as NodeListOf<T>;
}

function initSubsidiaries(): void {
  const form = q<HTMLFormElement>('#subsidiaryForm');
  if (!form) return; // not on this page

  const addButton = q<HTMLButtonElement>('#addSubsidiary');
  const listRoot = q<HTMLElement>('#subsidiaryList');
  const message = q<HTMLElement>('#formMessage');
  const detailsSection = q<HTMLElement>('#subsidiaryDetailsSection');

  const subsidiaries: Subsidiary[] = [];

  function readForm(): Subsidiary {
    const fd = new FormData(form as HTMLFormElement);
    return {
      immediateOriginId: String(fd.get('immediateOriginId') || '').trim(),
      companyId: String(fd.get('companyId') || '').trim(),
      onBehalf: String(fd.get('onBehalf') || 'self'),
      subsidiaryName: String(fd.get('subsidiaryName') || '').trim(),
      address1: String(fd.get('address1') || '').trim(),
      address2: String(fd.get('address2') || '').trim(),
      city: String(fd.get('city') || '').trim(),
      state: String(fd.get('state') || '').trim(),
      postal: String(fd.get('postal') || '').trim(),
      country: String(fd.get('country') || 'US')
    };
  }

  function validate(item: Subsidiary): string {
    if (!item.immediateOriginId || item.immediateOriginId.length > 10) return 'Immediate Origin ID is required (max 10 chars).';
    if (!item.companyId || item.companyId.length > 10) return 'Company ID is required (max 10 chars).';
    if (item.onBehalf === 'other') {
      if (!item.subsidiaryName) return 'Subsidiary Name is required.';
      if (!item.address1) return 'Address Line 1 is required.';
      if (!item.city) return 'City is required.';
      if (!item.state) return 'State/Province is required.';
      if (!item.postal) return 'Postal Code is required.';
      if (!item.country) return 'Country is required.';
    }
    return '';
  }

  function clearChildren(el: HTMLElement | null) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function renderList() {
    if (!listRoot) return;
    clearChildren(listRoot);
    if (!subsidiaries.length) {
      const p = document.createElement('p');
      p.textContent = 'No subsidiaries added yet.';
      listRoot.appendChild(p);
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'expertise-list subsidiary-list';

    subsidiaries.forEach((s) => {
      const li = document.createElement('li');
      li.className = 'subsidiary-item';

      const strong = document.createElement('strong');
      strong.textContent = s.subsidiaryName || '(no name)';
      li.appendChild(strong);

      const metaText = document.createTextNode(' (' + (s.city || '') + ', ' + (s.state || '') + ')');
      li.appendChild(metaText);

      const meta = document.createElement('div');
      meta.className = 'subsidiary-meta';
      meta.textContent = 'Origin ID: ' + s.immediateOriginId + '  Company ID: ' + s.companyId;
      li.appendChild(meta);

      ul.appendChild(li);
    });

    listRoot.appendChild(ul);
  }

  function updateRadioLabels() {
    // no-op now that we use a select dropdown instead of radios
  }

  function updateSubsidiaryVisibility() {
    try {
      if (!detailsSection || !form) return;
      const sel = form.querySelector<HTMLSelectElement>('select[name="onBehalf"]');
      const value = sel ? sel.value : 'self';
      const controls = detailsSection.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea');
      if (value === 'other') {
        detailsSection.classList.remove('hidden');
        controls.forEach((c) => { (c as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).disabled = false; });
      } else {
        detailsSection.classList.add('hidden');
        controls.forEach((c) => { (c as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).disabled = true; });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('updateSubsidiaryVisibility', e);
    }
  }

  if (addButton) {
    addButton.addEventListener('click', () => {
      const item = readForm();
      const err = validate(item);
      if (err) {
        if (message) message.textContent = err;
        return;
      }
      subsidiaries.push(item);
      renderList();
      if (message) {
        message.textContent = 'Subsidiary added.';
        setTimeout(() => { if (message) message.textContent = ''; }, 2500);
      }
    }, { passive: true });
  }

  if (form) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const item = readForm();
      const err = validate(item);
      if (err) {
        if (message) message.textContent = err;
        return;
      }
      subsidiaries.push(item);
      renderList();
      if (message) message.textContent = 'Enrollment submitted. ' + subsidiaries.length + ' subsidiaries included.';
    });
  }

  // wire select change handler
  const selectElement = q<HTMLSelectElement>('select[name="onBehalf"]');
  if (selectElement) {
    selectElement.addEventListener('change', () => { updateSubsidiaryVisibility(); }, { passive: true });
  }

  // initial sync
  renderList();
  updateSubsidiaryVisibility();
}

// auto-init when present
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSubsidiaries, { once: true, passive: true });
} else {
  initSubsidiaries();
}

export {};
