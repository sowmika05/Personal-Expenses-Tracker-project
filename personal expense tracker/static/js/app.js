/**
 * SpendPulse — Frontend Application Logic
 * Full-stack Personal Expense Tracker
 * Features: Fetch API, real-time statistics, category breakdown, search & filter, currency conversion, dark/light theme
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // State
  // ==========================================
  let expenses = [];
  let currentCurrency = localStorage.getItem('spendpulse_currency') || '$';
  let activeCategoryFilter = 'all';
  let searchQuery = '';
  let currentSort = 'newest';
  let pendingDeleteExpense = null;

  // Category Configuration
  const categoryConfig = {
    Food: { icon: '🍔', label: 'Food & Dining', color: '#fbbf24' },
    Travel: { icon: '✈️', label: 'Travel & Commute', color: '#22d3ee' },
    Shopping: { icon: '🛍️', label: 'Shopping & Retail', color: '#e879f9' },
    Education: { icon: '📚', label: 'Education & Learning', color: '#60a5fa' },
    Utilities: { icon: '⚡', label: 'Bills & Utilities', color: '#facc15' },
    Entertainment: { icon: '🎬', label: 'Entertainment & Leisure', color: '#c084fc' },
    Healthcare: { icon: '💊', label: 'Healthcare & Wellness', color: '#34d399' },
    Other: { icon: '🏷️', label: 'Other Miscellaneous', color: '#94a3b8' }
  };

  // ==========================================
  // DOM Elements
  // ==========================================
  const form = document.getElementById('expense-form');
  const titleInput = document.getElementById('expense-title');
  const amountInput = document.getElementById('expense-amount');
  const categorySelect = document.getElementById('expense-category');
  const dateInput = document.getElementById('expense-date');
  const addBtn = document.getElementById('add-expense-btn');

  const titleError = document.getElementById('title-error');
  const amountError = document.getElementById('amount-error');
  const categoryError = document.getElementById('category-error');

  const expenseList = document.getElementById('expense-list');
  const emptyState = document.getElementById('empty-state');
  const emptyStateTitle = document.getElementById('empty-state-title');
  const emptyStateDesc = document.getElementById('empty-state-desc');
  const loadingState = document.getElementById('loading-state');
  const listCounter = document.getElementById('list-counter');

  const statTotal = document.getElementById('stat-total-amount');
  const statCount = document.getElementById('stat-count');
  const statTopCategory = document.getElementById('stat-top-category');
  const statTopCategoryAmount = document.getElementById('stat-top-category-amount');
  const statAverage = document.getElementById('stat-average-amount');

  const categoryBreakdownSection = document.getElementById('category-breakdown-section');
  const categoryProgressBar = document.getElementById('category-progress-bar');
  const categoryLegend = document.getElementById('category-legend');

  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const sortSelect = document.getElementById('sort-select');
  const filterChips = document.getElementById('category-filter-chips');

  const currencySelect = document.getElementById('currency-select');
  const inputCurrencyPrefix = document.getElementById('input-currency-prefix');
  const themeToggle = document.getElementById('theme-toggle');

  const deleteModal = document.getElementById('delete-modal');
  const modalExpenseTitle = document.getElementById('modal-expense-title');
  const modalExpenseAmount = document.getElementById('modal-expense-amount');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');

  const toastContainer = document.getElementById('toast-container');

  // ==========================================
  // Initialization
  // ==========================================
  initDefaults();
  initTheme();
  setupEventListeners();
  loadExpenses();

  function initDefaults() {
    // Set default date to today's date YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Set saved currency
    if (currencySelect) {
      currencySelect.value = currentCurrency;
    }
    if (inputCurrencyPrefix) {
      inputCurrencyPrefix.textContent = currentCurrency;
    }
  }

  // ==========================================
  // Theme Management
  // ==========================================
  function initTheme() {
    const savedTheme = localStorage.getItem('spendpulse_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const target = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('spendpulse_theme', target);
    showToast(`Switched to ${target} mode`, 'info');
  }

  // ==========================================
  // Currency Management
  // ==========================================
  function setCurrency(symbol) {
    currentCurrency = symbol;
    localStorage.setItem('spendpulse_currency', symbol);
    if (inputCurrencyPrefix) {
      inputCurrencyPrefix.textContent = symbol;
    }
    updateStatistics();
    renderExpenseList();
  }

  function formatMoney(amount) {
    const parsed = Number(amount) || 0;
    return `${currentCurrency}${parsed.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  // ==========================================
  // API Operations
  // ==========================================
  async function loadExpenses() {
    try {
      loadingState.style.display = 'flex';
      expenseList.style.display = 'none';
      emptyState.style.display = 'none';

      const response = await fetch('/api/expenses');
      if (!response.ok) {
        throw new Error(`Failed to load expenses (${response.status})`);
      }
      expenses = await response.json();

      updateStatistics();
      renderExpenseList();
    } catch (err) {
      console.error('Error loading expenses:', err);
      showToast('Error connecting to backend API.', 'error');
    } finally {
      loadingState.style.display = 'none';
    }
  }

  async function handleAddExpense(e) {
    e.preventDefault();
    clearErrors();

    const title = titleInput.value.trim();
    const amountVal = amountInput.value.trim();
    const category = categorySelect.value;
    const dateVal = dateInput.value || new Date().toISOString().split('T')[0];

    // Client-side validation
    let hasError = false;

    if (!title) {
      showFieldError(titleInput, titleError, 'Please enter an expense title.');
      hasError = true;
    }

    if (!amountVal || isNaN(amountVal) || Number(amountVal) <= 0) {
      showFieldError(amountInput, amountError, 'Please enter a valid amount greater than 0.');
      hasError = true;
    }

    if (!category) {
      showFieldError(categorySelect, categoryError, 'Please select a category.');
      hasError = true;
    }

    if (hasError) return;

    // Set button loading
    setButtonLoading(addBtn, true);

    try {
      const payload = {
        title,
        amount: parseFloat(amountVal),
        category,
        date: dateVal
      };

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add expense');
      }

      // Add newly created expense to state
      expenses.unshift(result);

      // Reset form (keep date as today)
      titleInput.value = '';
      amountInput.value = '';
      categorySelect.selectedIndex = 0;
      titleInput.focus();

      updateStatistics();
      renderExpenseList();

      showToast(`Added "${result.title}" (${formatMoney(result.amount)})`, 'success');
    } catch (err) {
      console.error('Add expense error:', err);
      showToast(err.message, 'error');
    } finally {
      setButtonLoading(addBtn, false);
    }
  }

  async function confirmDeleteExpense() {
    if (!pendingDeleteExpense) return;

    const { id, title } = pendingDeleteExpense;
    closeDeleteModal();

    // Visual feedback in list
    const itemEl = document.getElementById(`expense-item-${id}`);
    if (itemEl) {
      itemEl.classList.add('deleting');
    }

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete expense');
      }

      // Remove from state
      expenses = expenses.filter(item => item.id !== id);
      updateStatistics();
      renderExpenseList();

      showToast(`Deleted "${title}"`, 'info');
    } catch (err) {
      console.error('Delete expense error:', err);
      showToast(err.message, 'error');
      if (itemEl) itemEl.classList.remove('deleting');
    }
  }

  // ==========================================
  // Statistics & Category Breakdown
  // ==========================================
  function updateStatistics() {
    const totalAmount = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const count = expenses.length;
    const average = count > 0 ? (totalAmount / count) : 0;

    // Aggregate category totals
    const categoryTotals = {};
    expenses.forEach(item => {
      const cat = item.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(item.amount) || 0);
    });

    // Find top category
    let topCat = 'None';
    let maxSpent = 0;
    for (const [cat, spent] of Object.entries(categoryTotals)) {
      if (spent > maxSpent) {
        maxSpent = spent;
        topCat = cat;
      }
    }

    // Render Stat Cards
    statTotal.textContent = formatMoney(totalAmount);
    statCount.textContent = count.toString();
    statAverage.textContent = formatMoney(average);

    if (count > 0 && maxSpent > 0) {
      const catInfo = categoryConfig[topCat] || { icon: '🏷️' };
      statTopCategory.textContent = `${catInfo.icon} ${topCat}`;
      const percentage = Math.round((maxSpent / totalAmount) * 100);
      statTopCategoryAmount.textContent = `${formatMoney(maxSpent)} (${percentage}%)`;
    } else {
      statTopCategory.textContent = 'None';
      statTopCategoryAmount.textContent = 'No spending data';
    }

    // Render Category Distribution Progress Bar
    renderCategoryBreakdown(categoryTotals, totalAmount);
  }

  function renderCategoryBreakdown(categoryTotals, totalAmount) {
    if (totalAmount <= 0) {
      categoryBreakdownSection.style.display = 'none';
      return;
    }

    categoryBreakdownSection.style.display = 'flex';
    categoryProgressBar.innerHTML = '';
    categoryLegend.innerHTML = '';

    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1]);

    sortedCategories.forEach(([category, amount]) => {
      const percentage = (amount / totalAmount) * 100;
      if (percentage <= 0) return;

      const conf = categoryConfig[category] || { icon: '🏷️', color: '#94a3b8' };

      // Progress bar segment
      const segment = document.createElement('div');
      segment.className = 'progress-bar-segment';
      segment.style.width = `${percentage}%`;
      segment.style.backgroundColor = conf.color;
      segment.title = `${category}: ${formatMoney(amount)} (${percentage.toFixed(1)}%)`;
      categoryProgressBar.appendChild(segment);

      // Legend Item
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.innerHTML = `
        <span class="legend-dot" style="background-color: ${conf.color};"></span>
        <span>${conf.icon} ${category}:</span>
        <span class="legend-value">${percentage.toFixed(0)}%</span>
      `;
      categoryLegend.appendChild(legendItem);
    });
  }

  // ==========================================
  // List Rendering, Search & Filters
  // ==========================================
  function renderExpenseList() {
    let filtered = [...expenses];

    // Filter by Category
    if (activeCategoryFilter !== 'all') {
      filtered = filtered.filter(item => 
        (item.category || '').toLowerCase() === activeCategoryFilter.toLowerCase()
      );
    }

    // Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        (item.title || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q)
      );
    }

    // Sort Items
    filtered.sort((a, b) => {
      const amountA = Number(a.amount) || 0;
      const amountB = Number(b.amount) || 0;
      const idA = Number(a.id) || 0;
      const idB = Number(b.id) || 0;

      switch (currentSort) {
        case 'oldest':
          return idA - idB;
        case 'highest':
          return amountB - amountA;
        case 'lowest':
          return amountA - amountB;
        case 'newest':
        default:
          return idB - idA;
      }
    });

    // Update Counter
    listCounter.textContent = `${filtered.length} of ${expenses.length} Items`;

    // Handle Empty States
    if (filtered.length === 0) {
      expenseList.innerHTML = '';
      expenseList.style.display = 'none';
      emptyState.style.display = 'flex';

      if (expenses.length === 0) {
        emptyStateTitle.textContent = 'No expenses recorded yet';
        emptyStateDesc.textContent = 'Use the form on the left to add your first expense and start tracking your spending.';
      } else {
        emptyStateTitle.textContent = 'No matching expenses found';
        emptyStateDesc.textContent = 'Try adjusting your search query or filter category to find what you are looking for.';
      }
      return;
    }

    // Display List
    emptyState.style.display = 'none';
    expenseList.style.display = 'flex';
    expenseList.innerHTML = '';

    filtered.forEach(item => {
      const itemNode = createExpenseNode(item);
      expenseList.appendChild(itemNode);
    });
  }

  function createExpenseNode(item) {
    const card = document.createElement('div');
    card.className = 'expense-item';
    card.id = `expense-item-${item.id}`;
    card.setAttribute('role', 'listitem');

    const catKey = item.category || 'Other';
    const conf = categoryConfig[catKey] || { icon: '🏷️', label: catKey };

    // Format display date
    let displayDate = item.date || 'Today';
    try {
      if (item.date && item.date.includes('-')) {
        const [year, month, day] = item.date.split('-');
        const dateObj = new Date(year, month - 1, day);
        displayDate = dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch {
      displayDate = item.date;
    }

    card.innerHTML = `
      <div class="item-left">
        <div class="item-category-icon cat-${escapeHtml(catKey)}">
          <span>${conf.icon}</span>
        </div>
        <div class="item-details">
          <span class="item-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</span>
          <div class="item-meta">
            <span class="cat-badge cat-${escapeHtml(catKey)}">${escapeHtml(catKey)}</span>
            <span>&bull;</span>
            <span class="item-date">${escapeHtml(displayDate)}</span>
          </div>
        </div>
      </div>
      <div class="item-right">
        <span class="item-amount">${formatMoney(item.amount)}</span>
        <button 
          type="button" 
          class="btn-delete" 
          id="delete-btn-${item.id}"
          title="Delete this expense"
          aria-label="Delete expense ${escapeHtml(item.title)}"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // Attach delete button handler
    const deleteBtn = card.querySelector('.btn-delete');
    deleteBtn.addEventListener('click', () => {
      openDeleteModal(item);
    });

    return card;
  }

  // ==========================================
  // Modal Handlers
  // ==========================================
  function openDeleteModal(expense) {
    pendingDeleteExpense = expense;
    modalExpenseTitle.textContent = `"${expense.title}"`;
    modalExpenseAmount.textContent = formatMoney(expense.amount);
    deleteModal.style.display = 'flex';
  }

  function closeDeleteModal() {
    deleteModal.style.display = 'none';
    pendingDeleteExpense = null;
  }

  // ==========================================
  // Form & Input Error Helpers
  // ==========================================
  function showFieldError(inputEl, errorEl, message) {
    inputEl.classList.add('input-error');
    errorEl.textContent = message;
  }

  function clearErrors() {
    [titleInput, amountInput, categorySelect].forEach(el => el.classList.remove('input-error'));
    titleError.textContent = '';
    amountError.textContent = '';
    categoryError.textContent = '';
  }

  function setButtonLoading(button, isLoading) {
    if (isLoading) {
      button.classList.add('loading');
      button.disabled = true;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
    }
  }

  // ==========================================
  // Toast Notifications
  // ==========================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
      <button type="button" class="toast-close" aria-label="Close notification">&times;</button>
    `;

    toastContainer.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 250);
    };

    closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, 3500);
  }

  // ==========================================
  // Event Listeners
  // ==========================================
  function setupEventListeners() {
    // Form submission
    form.addEventListener('submit', handleAddExpense);

    // Clear field errors on input
    titleInput.addEventListener('input', () => {
      titleInput.classList.remove('input-error');
      titleError.textContent = '';
    });
    amountInput.addEventListener('input', () => {
      amountInput.classList.remove('input-error');
      amountError.textContent = '';
    });
    categorySelect.addEventListener('change', () => {
      categorySelect.classList.remove('input-error');
      categoryError.textContent = '';
    });

    // Quick Fill Suggestions
    document.querySelectorAll('.quick-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        titleInput.value = chip.getAttribute('data-title') || '';
        amountInput.value = chip.getAttribute('data-amount') || '';
        categorySelect.value = chip.getAttribute('data-cat') || 'Food';
        clearErrors();
        titleInput.focus();
      });
    });

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Currency selector
    currencySelect.addEventListener('change', (e) => {
      setCurrency(e.target.value);
    });

    // Search input
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      renderExpenseList();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      renderExpenseList();
      searchInput.focus();
    });

    // Category filter pills
    filterChips.addEventListener('click', (e) => {
      const targetPill = e.target.closest('.filter-pill');
      if (!targetPill) return;

      filterChips.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      targetPill.classList.add('active');

      activeCategoryFilter = targetPill.getAttribute('data-category') || 'all';
      renderExpenseList();
    });

    // Sort selector
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderExpenseList();
    });

    // Delete modal confirmation
    modalConfirmBtn.addEventListener('click', confirmDeleteExpense);
    modalCancelBtn.addEventListener('click', closeDeleteModal);

    // Dismiss modal on backdrop click or Escape key
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) closeDeleteModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && deleteModal.style.display === 'flex') {
        closeDeleteModal();
      }
    });
  }

  // ==========================================
  // Utilities
  // ==========================================
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});
