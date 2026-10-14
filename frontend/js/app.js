/**
 * InternHub — Main Frontend Application Logic
 * Vanilla JavaScript (ES Module) with Safe DOM Construction,
 * Accessible Dialog Management, Real-time Validation, and Resilient UX States.
 */

import { fetchInternships, submitApplicationApi, ApiError } from './api.js';

// Application State
const state = {
  internships: [],
  search: '',
  domain: 'All',
  page: 1,
  limit: 6,
  total: 0,
  totalPages: 1,
  status: 'idle', // 'idle' | 'loading' | 'success' | 'empty' | 'error'
  errorMessage: '',
  activeAbortController: null,
  activeInternship: null,
  triggerButton: null,
  isSubmitting: false
};

// DOM Elements (Live Getters to ensure elements exist regardless of script execution order)
const elements = {
  get gridContainer() { return document.getElementById('internships-grid'); },
  get stateContainer() { return document.getElementById('state-container'); },
  get searchInput() { return document.getElementById('search-input'); },
  get domainFilterBtns() { return document.querySelectorAll('.filter-btn'); },
  get resultsCount() { return document.getElementById('results-count'); },
  get paginationContainer() { return document.getElementById('pagination-container'); },
  get prevPageBtn() { return document.getElementById('btn-prev-page'); },
  get nextPageBtn() { return document.getElementById('btn-next-page'); },
  get pageIndicator() { return document.getElementById('page-indicator'); },
  get applicationDialog() { return document.getElementById('application-dialog'); },
  get applicationForm() { return document.getElementById('application-form'); },
  get dialogCloseBtn() { return document.getElementById('btn-close-dialog'); },
  get dialogCancelBtn() { return document.getElementById('btn-cancel-dialog'); },
  get dialogJobTitle() { return document.getElementById('dialog-job-title'); },
  get dialogJobCompany() { return document.getElementById('dialog-job-company'); },
  get internshipIdInput() { return document.getElementById('internship-id-input'); },
  get formAlertBanner() { return document.getElementById('form-alert-banner'); },
  get formSubmitBtn() { return document.getElementById('btn-submit-application'); },
  get coverLetterInput() { return document.getElementById('coverLetter'); },
  get charCountSpan() { return document.getElementById('char-count'); },
  get submissionSuccessView() { return document.getElementById('submission-success-view'); },
  get successRefCode() { return document.getElementById('success-ref-code'); },
  get successJobTitle() { return document.getElementById('success-job-title'); },
  get successCloseBtn() { return document.getElementById('btn-success-close'); }
};

/**
 * Safe DOM creation helper to prevent XSS.
 * NEVER inserts untrusted string directly into innerHTML.
 */
function createElement(tag, attributes = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      for (const [dataKey, dataValue] of Object.entries(value)) {
        el.dataset[dataKey] = dataValue;
      }
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value !== false && value !== null && value !== undefined) {
      el.setAttribute(key, value === true ? '' : value);
    }
  }

  for (const child of children) {
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      el.appendChild(child);
    } else if (Array.isArray(child)) {
      child.forEach(c => {
        if (typeof c === 'string' || typeof c === 'number') {
          el.appendChild(document.createTextNode(String(c)));
        } else if (c instanceof Node) {
          el.appendChild(c);
        }
      });
    }
  }

  return el;
}

/**
 * Build a single safe internship card element
 */
function createInternshipCard(internship) {
  const card = createElement('article', {
    className: 'internship-card',
    'aria-labelledby': `internship-title-${internship.id}`
  });

  // Header: Title, Domain, Company
  const header = createElement('div', { className: 'card-header' },
    createElement('div', { style: 'flex-grow: 1;' },
      createElement('h3', {
        className: 'card-title',
        id: `internship-title-${internship.id}`
      }, internship.title),
      createElement('div', { className: 'card-company' },
        createElement('span', { 'aria-hidden': 'true' }, '🏢'),
        internship.company
      )
    ),
    createElement('span', { className: 'card-domain-badge' }, internship.domain)
  );

  // Details Row
  const detailsRow = createElement('div', { className: 'card-details-row' },
    createElement('div', { className: 'detail-item' },
      createElement('span', { 'aria-hidden': 'true' }, '📍'),
      internship.location
    ),
    createElement('div', { className: 'detail-item' },
      createElement('span', { 'aria-hidden': 'true' }, '⏱️'),
      internship.duration
    ),
    createElement('div', { className: 'detail-item' },
      createElement('span', { 'aria-hidden': 'true' }, '💼'),
      internship.type
    ),
    createElement('div', { className: 'detail-item stipend-badge' },
      createElement('span', { 'aria-hidden': 'true' }, '💰'),
      internship.stipend
    )
  );

  // Description
  const description = createElement('p', { className: 'card-description' }, internship.description);

  // Skills
  const skillsList = createElement('ul', { className: 'skills-list', 'aria-label': 'Required skills' });
  const skillsArray = Array.isArray(internship.skills_required) ? internship.skills_required : [];
  skillsArray.forEach(skill => {
    skillsList.appendChild(createElement('li', { className: 'skill-tag' }, skill));
  });

  const skillsWrapper = createElement('div', { className: 'card-skills-wrapper' }, skillsList);

  // Footer: Deadline and Apply Button
  const applyButton = createElement('button', {
    type: 'button',
    className: 'btn-apply',
    'aria-label': `Apply for ${internship.title} at ${internship.company}`,
    onClick: () => openApplicationModal(internship, applyButton)
  },
    'Apply Now',
    createElement('span', { 'aria-hidden': 'true' }, '→')
  );

  const footer = createElement('div', { className: 'card-footer' },
    createElement('div', { className: 'deadline-text' },
      'Deadline: ',
      createElement('strong', {}, internship.deadline)
    ),
    applyButton
  );

  card.appendChild(header);
  card.appendChild(detailsRow);
  card.appendChild(description);
  card.appendChild(skillsWrapper);
  card.appendChild(footer);

  return card;
}

/**
 * Render the loading state
 */
function renderLoadingState() {
  elements.gridContainer.style.display = 'none';
  elements.paginationContainer.style.display = 'none';
  elements.stateContainer.style.display = 'block';

  elements.stateContainer.replaceChildren(
    createElement('div', { className: 'state-container', role: 'status', 'aria-live': 'polite' },
      createElement('div', { className: 'state-icon loading' },
        createElement('div', { className: 'spinner' })
      ),
      createElement('h3', { className: 'state-title' }, 'Loading internships...'),
      createElement('p', { className: 'state-description' }, 'Fetching real-time opportunities from our verified API.')
    )
  );
}

/**
 * Render the empty state
 */
function renderEmptyState() {
  elements.gridContainer.style.display = 'none';
  elements.paginationContainer.style.display = 'none';
  elements.stateContainer.style.display = 'block';

  elements.stateContainer.replaceChildren(
    createElement('div', { className: 'state-container', role: 'status' },
      createElement('div', { className: 'state-icon empty' }, '🔍'),
      createElement('h3', { className: 'state-title' }, 'No internships found.'),
      createElement('p', { className: 'state-description' },
        'We couldn\'t find any opportunities matching your current search or domain filter.'
      ),
      createElement('button', {
        type: 'button',
        className: 'btn-primary',
        onClick: resetFilters
      }, 'Reset Filters')
    )
  );

  elements.resultsCount.textContent = 'Showing 0 results';
}

/**
 * Render the failure state with Retry
 */
function renderFailureState(message) {
  elements.gridContainer.style.display = 'none';
  elements.paginationContainer.style.display = 'none';
  elements.stateContainer.style.display = 'block';

  elements.stateContainer.replaceChildren(
    createElement('div', { className: 'state-container', role: 'alert' },
      createElement('div', { className: 'state-icon error' }, '⚠️'),
      createElement('h3', { className: 'state-title' }, 'Unable to load internships. Please try again.'),
      createElement('p', { className: 'state-description' }, message || 'A network or server error occurred while retrieving data.'),
      createElement('button', {
        type: 'button',
        className: 'btn-primary',
        onClick: () => loadInternships()
      }, 'Retry')
    )
  );

  elements.resultsCount.textContent = 'Error loading results';
}

/**
 * Render the success state with grid cards & pagination
 */
function renderSuccessState() {
  elements.stateContainer.style.display = 'none';
  elements.gridContainer.style.display = 'grid';

  elements.gridContainer.replaceChildren();
  state.internships.forEach(internship => {
    elements.gridContainer.appendChild(createInternshipCard(internship));
  });

  // Results count
  const startItem = (state.page - 1) * state.limit + 1;
  const endItem = Math.min(state.page * state.limit, state.total);
  elements.resultsCount.textContent = `Showing ${state.internships.length > 0 ? `${startItem}–${endItem} of ${state.total}` : 0} internships`;

  // Pagination controls
  if (state.totalPages > 1) {
    elements.paginationContainer.style.display = 'flex';
    elements.pageIndicator.textContent = `Page ${state.page} of ${state.totalPages}`;
    elements.prevPageBtn.disabled = state.page <= 1;
    elements.nextPageBtn.disabled = state.page >= state.totalPages;
  } else {
    elements.paginationContainer.style.display = 'none';
  }
}

/**
 * Main Controller: Fetch and render internships
 * Ensures older search requests cannot overwrite newer results via AbortController.
 */
async function loadInternships() {
  // Abort any ongoing request before firing a new one
  if (state.activeAbortController) {
    state.activeAbortController.abort();
  }

  const controller = new AbortController();
  state.activeAbortController = controller;
  state.status = 'loading';
  renderLoadingState();

  try {
    const response = await fetchInternships({
      search: state.search,
      domain: state.domain,
      page: state.page,
      limit: state.limit
    }, controller.signal);

    // If another request was initiated after this one, ignore
    if (state.activeAbortController !== controller) {
      return;
    }

    state.internships = response.data || [];
    state.total = response.total || 0;
    state.totalPages = response.totalPages || 1;

    if (state.internships.length === 0) {
      state.status = 'empty';
      renderEmptyState();
    } else {
      state.status = 'success';
      renderSuccessState();
    }
  } catch (err) {
    // If request was aborted because a newer search took place, ignore quietly
    if (state.activeAbortController !== controller || (err instanceof ApiError && err.status === 0 && err.message.includes('superseded'))) {
      return;
    }

    state.status = 'error';
    state.errorMessage = err.message || 'Unable to load internships.';
    renderFailureState(state.errorMessage);
  } finally {
    if (state.activeAbortController === controller) {
      state.activeAbortController = null;
    }
  }
}

/**
 * Reset all filters to default
 */
function resetFilters() {
  state.search = '';
  state.domain = 'All';
  state.page = 1;
  elements.searchInput.value = '';

  elements.domainFilterBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.domain === 'All');
  });

  loadInternships();
}

/**
 * Setup debounced search & filter events
 */
let debounceTimeout = null;
function handleSearchInput(e) {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    state.search = e.target.value.trim();
    state.page = 1;
    loadInternships();
  }, 300);
}

function handleDomainClick(e) {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;

  const domain = btn.dataset.domain;
  if (domain === state.domain) return;

  elements.domainFilterBtns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  state.domain = domain;
  state.page = 1;
  loadInternships();
}

function handlePagination(direction) {
  if (direction === 'prev' && state.page > 1) {
    state.page -= 1;
    loadInternships();
    window.scrollTo({ top: elements.gridContainer.offsetTop - 100, behavior: 'smooth' });
  } else if (direction === 'next' && state.page < state.totalPages) {
    state.page += 1;
    loadInternships();
    window.scrollTo({ top: elements.gridContainer.offsetTop - 100, behavior: 'smooth' });
  }
}

/* ==========================================================================
   Application Modal & Form Logic
   ========================================================================== */

/**
 * Open the accessible application dialog
 */
function openApplicationModal(internship, triggerButton) {
  state.activeInternship = internship;
  state.triggerButton = triggerButton;

  // Set modal header details
  elements.dialogJobTitle.textContent = internship.title;
  elements.dialogJobCompany.textContent = `${internship.company} • ${internship.location}`;
  elements.internshipIdInput.value = internship.id;

  // Reset form and view states
  elements.applicationForm.reset();
  elements.internshipIdInput.value = internship.id; // ensure reset didn't wipe it
  clearAllValidationErrors();
  elements.formAlertBanner.style.display = 'none';
  elements.formAlertBanner.className = 'form-alert-banner';
  elements.charCountSpan.textContent = '0';

  // Toggle views
  elements.applicationForm.style.display = 'block';
  elements.submissionSuccessView.style.display = 'none';
  elements.formSubmitBtn.disabled = false;
  elements.formSubmitBtn.textContent = 'Submit Application';

  // Show native modal
  if (typeof elements.applicationDialog.showModal === 'function') {
    elements.applicationDialog.showModal();
  } else {
    // Fallback if dialog tag unsupported
    elements.applicationDialog.setAttribute('open', '');
  }

  // Set initial focus to Full Name input
  const firstInput = elements.applicationForm.querySelector('#fullName');
  if (firstInput) firstInput.focus();
}

/**
 * Close the application dialog and restore focus
 */
function closeApplicationModal() {
  if (state.isSubmitting) return; // Prevent closing mid-flight

  if (typeof elements.applicationDialog.close === 'function') {
    elements.applicationDialog.close();
  } else {
    elements.applicationDialog.removeAttribute('open');
  }

  // Restore focus to the trigger button for keyboard accessibility
  if (state.triggerButton && typeof state.triggerButton.focus === 'function') {
    state.triggerButton.focus();
  }
}

/**
 * Validation rules and field validations
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const PHONE_REGEX = /^\+?[\d\s\-().]{10,20}$/;

function validateField(fieldName, value) {
  const currentYear = new Date().getFullYear();

  switch (fieldName) {
    case 'fullName':
      if (!value || value.trim().length < 2 || value.trim().length > 100) {
        return 'Full name must be between 2 and 100 characters.';
      }
      return null;

    case 'email':
      if (!value || !EMAIL_REGEX.test(value.trim()) || value.trim().length > 120) {
        return 'Please enter a valid email address (e.g., student@university.edu).';
      }
      return null;

    case 'phone':
      if (!value || !PHONE_REGEX.test(value.trim())) {
        return 'Please enter a valid phone number (10–20 digits).';
      }
      return null;

    case 'college':
      if (!value || value.trim().length < 2 || value.trim().length > 150) {
        return 'College / University name must be between 2 and 150 characters.';
      }
      return null;

    case 'degree':
      if (!value || value.trim().length < 2 || value.trim().length > 100) {
        return 'Course / Degree must be between 2 and 100 characters.';
      }
      return null;

    case 'graduationYear': {
      const year = Number(value);
      if (!value || !Number.isInteger(year) || year < currentYear - 5 || year > currentYear + 8) {
        return `Please enter a graduation year between ${currentYear - 5} and ${currentYear + 8}.`;
      }
      return null;
    }

    case 'skills': {
      const skills = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
      if (skills.length === 0) {
        return 'Please enter at least one skill.';
      }
      if (skills.length > 20) {
        return 'Please enter at most 20 skills.';
      }
      if (skills.some(s => s.length > 50)) {
        return 'Individual skills must not exceed 50 characters.';
      }
      return null;
    }

    case 'coverLetter':
      if (value && value.length > 2000) {
        return 'Cover letter must not exceed 2000 characters.';
      }
      return null;

    default:
      return null;
  }
}

function setFieldError(fieldName, message) {
  const input = document.getElementById(fieldName);
  const errorEl = document.getElementById(`${fieldName}-error`);

  if (input) {
    if (message) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
    }
  }

  if (errorEl) {
    errorEl.textContent = message || '';
  }
}

function clearAllValidationErrors() {
  const fields = ['fullName', 'email', 'phone', 'college', 'degree', 'graduationYear', 'skills', 'coverLetter'];
  fields.forEach(f => setFieldError(f, null));
}

/**
 * Handle live input changes & validation
 */
function setupFormLiveValidation() {
  const fields = ['fullName', 'email', 'phone', 'college', 'degree', 'graduationYear', 'skills'];

  fields.forEach(fieldName => {
    const input = document.getElementById(fieldName);
    if (!input) return;

    input.addEventListener('blur', () => {
      const error = validateField(fieldName, input.value);
      setFieldError(fieldName, error);
    });

    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid')) {
        const error = validateField(fieldName, input.value);
        setFieldError(fieldName, error);
      }
    });
  });

  // Cover Letter live character counter
  if (elements.coverLetterInput && elements.charCountSpan) {
    elements.coverLetterInput.addEventListener('input', () => {
      const len = elements.coverLetterInput.value.length;
      elements.charCountSpan.textContent = String(len);
      if (len > 2000) {
        setFieldError('coverLetter', 'Cover letter must not exceed 2000 characters.');
      } else {
        setFieldError('coverLetter', null);
      }
    });
  }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  if (state.isSubmitting || !elements.applicationForm) return;

  const formData = new FormData(elements.applicationForm);
  const payload = {
    internship_id: Number(formData.get('internship_id')),
    full_name: String(formData.get('fullName') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    college: String(formData.get('college') || '').trim(),
    degree: String(formData.get('degree') || '').trim(),
    graduation_year: Number(formData.get('graduationYear')),
    skills: String(formData.get('skills') || '').split(',').map(s => s.trim()).filter(Boolean),
    cover_letter: String(formData.get('coverLetter') || '').trim()
  };

  // Perform client-side validation across all fields
  let hasErrors = false;
  let firstInvalidInput = null;

  const validationChecks = [
    { field: 'fullName', val: payload.full_name },
    { field: 'email', val: payload.email },
    { field: 'phone', val: payload.phone },
    { field: 'college', val: payload.college },
    { field: 'degree', val: payload.degree },
    { field: 'graduationYear', val: payload.graduation_year },
    { field: 'skills', val: formData.get('skills') },
    { field: 'coverLetter', val: payload.cover_letter }
  ];

  validationChecks.forEach(({ field, val }) => {
    const error = validateField(field, val);
    if (error) {
      setFieldError(field, error);
      hasErrors = true;
      if (!firstInvalidInput) {
        firstInvalidInput = document.getElementById(field);
      }
    } else {
      setFieldError(field, null);
    }
  });

  if (hasErrors) {
    if (firstInvalidInput) firstInvalidInput.focus();
    return;
  }

  // Validation succeeded: trigger submission state
  state.isSubmitting = true;
  if (elements.formSubmitBtn) {
    elements.formSubmitBtn.disabled = true;
    elements.formSubmitBtn.textContent = 'Submitting application...';
  }
  if (elements.formAlertBanner) {
    elements.formAlertBanner.style.display = 'none';
  }

  try {
    const response = await submitApplicationApi(payload);

    // On Success: Transition to confirmation view inside the dialog
    if (elements.applicationForm) elements.applicationForm.style.display = 'none';
    if (elements.submissionSuccessView) elements.submissionSuccessView.style.display = 'block';

    const appId = response.data?.applicationId ? `#APP-${response.data.applicationId}` : '#APP-SUCCESS';
    if (elements.successRefCode) elements.successRefCode.textContent = appId;
    if (elements.successJobTitle) {
      elements.successJobTitle.textContent = state.activeInternship ? state.activeInternship.title : 'Internship Position';
    }

    // Focus close button on success view
    if (elements.successCloseBtn) elements.successCloseBtn.focus();
  } catch (err) {
    // On Failure: Preserve user's inputs, present clear error feedback, allow retry
    if (elements.formAlertBanner) {
      elements.formAlertBanner.className = 'form-alert-banner error';
      elements.formAlertBanner.textContent = err.message || 'Application submission failed. Please try again.';
      elements.formAlertBanner.style.display = 'flex';
    }

    // Highlight server-reported validation errors if present
    if (err.data && err.data.errors) {
      for (const [serverField, serverMsg] of Object.entries(err.data.errors)) {
        const clientField = serverField === 'full_name' ? 'fullName'
          : serverField === 'graduation_year' ? 'graduationYear'
          : serverField === 'cover_letter' ? 'coverLetter'
          : serverField;
        setFieldError(clientField, serverMsg);
      }
    }
  } finally {
    state.isSubmitting = false;
    if (elements.formSubmitBtn) {
      elements.formSubmitBtn.disabled = false;
      elements.formSubmitBtn.textContent = 'Submit Application';
    }
  }
}

/* ==========================================================================
   Initialization & Event Listeners
   ========================================================================== */
function init() {
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', handleSearchInput);
  }
  if (elements.domainFilterBtns) {
    elements.domainFilterBtns.forEach(btn => {
      btn.addEventListener('click', handleDomainClick);
    });
  }

  if (elements.prevPageBtn) {
    elements.prevPageBtn.addEventListener('click', () => handlePagination('prev'));
  }
  if (elements.nextPageBtn) {
    elements.nextPageBtn.addEventListener('click', () => handlePagination('next'));
  }

  if (elements.applicationForm) {
    elements.applicationForm.addEventListener('submit', handleFormSubmit);
  }
  setupFormLiveValidation();

  if (elements.dialogCloseBtn) elements.dialogCloseBtn.addEventListener('click', closeApplicationModal);
  if (elements.dialogCancelBtn) elements.dialogCancelBtn.addEventListener('click', closeApplicationModal);
  if (elements.successCloseBtn) elements.successCloseBtn.addEventListener('click', closeApplicationModal);

  if (elements.applicationDialog) {
    elements.applicationDialog.addEventListener('click', e => {
      const rect = elements.applicationDialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        closeApplicationModal();
      }
    });

    elements.applicationDialog.addEventListener('cancel', e => {
      if (state.isSubmitting) {
        e.preventDefault();
      } else {
        setTimeout(() => {
          if (state.triggerButton) state.triggerButton.focus();
        }, 50);
      }
    });
  }

  window.addEventListener('online', () => {
    if (state.status === 'error') {
      loadInternships();
    }
  });

  loadInternships();
}

// Kick off when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
