// State management
const AppState = {
  originalData: [],
  currentPage: 1,
  totalPages: 0,
  selectedUser: null,
  isShowingAll: false,
  currentFilter: 'all',
  ITEMS_PER_PAGE: 10
};

// Input validation
function validateInput(input) {
  const sanitized = DOMPurify.sanitize(input);
  return sanitized.trim();
}

// Error handler wrapper
function errorHandler(fn) {
  return async function (...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      console.error(error);
      showNotification(`เกิดข้อผิดพลาด: ${error.message}`, false);
      throw error;
    }
  };
}

// Improved addToken with validation
async function addToken() {
  const name = validateInput(document.getElementById('newTokenName').value);
  const value = validateInput(document.getElementById('newTokenValue').value);

  if (!name || !value) {
    showNotification('กรุณากรอกข้อมูลให้ครบถ้วน', false);
    return;
  }

  setButtonLoading('addTokenButton', true);

  try {
    await google.script.run
      .withSuccessHandler(() => {
        loadTokens();
        document.getElementById('newTokenName').value = '';
        document.getElementById('newTokenValue').value = '';
        showNotification('เพิ่ม Token สำเร็จ', true);
      })
      .withFailureHandler(handleError)
      .addLineToken(name, value);
  } finally {
    setButtonLoading('addTokenButton', false);
  }
}

// Improved updateLineId with validation
async function updateLineId() {
  if (!AppState.selectedUser) {
    showNotification('กรุณาเลือกผู้ใช้ก่อน', false);
    return;
  }

  const idType = validateInput(document.getElementById('idType').value);
  const idValue = validateInput(document.getElementById('lineIdValue').value);

  if (!idValue) {
    showNotification('กรุณากรอก ID ให้ถูกต้อง', false);
    return;
  }

  setButtonLoading('updateLineIdButton', true);

  try {
    await google.script.run
      .withSuccessHandler(() => {
        loadData();
        showNotification('อัพเดท LINE ID สำเร็จ', true);
        resetUserSelection();
      })
      .withFailureHandler(handleError)
      .updateLineId(AppState.selectedUser.index, idType, idValue);
  } finally {
    setButtonLoading('updateLineIdButton', false);
  }
}

// Reset user selection
function resetUserSelection() {
  AppState.selectedUser = null;
  document.getElementById('idType').value = 'LineID';
  document.getElementById('lineIdValue').value = '';
  const editingInfo = document.querySelector('.editing-info');
  if (editingInfo) {
    editingInfo.remove();
  }
}

// Improved filterData with validation
function filterData(searchTerm) {
  const sanitizedTerm = validateInput(searchTerm);
  const filteredData = AppState.originalData.filter(row => 
    row['NAME']?.toLowerCase().includes(sanitizedTerm.toLowerCase())
  );
  
  AppState.currentPage = 1;
  renderTable(paginate(filteredData, AppState.currentPage));
  updatePagination(filteredData.length);
  const totals = calculateTotals(filteredData);
  updateSummaryDisplay(totals);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
  // Add CSRF token to all requests
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  if (csrfToken) {
    google.script.run.withToken(csrfToken);
  }

  // Initialize sanitizer
  window.DOMPurify = createDOMPurifier(window);

  // Load initial data
  loadData();
  loadTokens();

  // Add event listeners
  document.getElementById('searchInput').addEventListener('input', function() {
    filterData(this.value);
  });
});
