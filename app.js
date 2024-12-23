let originalData = [];
    const SHEET_ID = '1JjEyKiVgBQQMHvIRi6GG_OqzdMNARj_fQMuysUaTYw4';
    const ITEMS_PER_PAGE = 10;
    let currentPage = 1;
    let totalPages = 0;
    let selectedUser = null;

    // Initial load
    loadData();
    loadTokens();

    // Search listener
    document.getElementById('searchInput').addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      filterData(searchTerm);
    });

    function filterData(searchTerm) {
      const filteredData = originalData.filter(row => 
        row['NAME']?.toLowerCase().includes(searchTerm)
      );
      currentPage = 1;
      renderTable(paginate(filteredData, currentPage));
      updatePagination(filteredData.length);
      const totals = calculateTotals(filteredData);
      updateSummaryDisplay(totals);
    }

    function openSettingsModal() {
      document.getElementById('settingsModal').classList.remove('hidden');
      loadTokens();
      updateUserList();
    }

    function closeSettingsModal() {
      document.getElementById('settingsModal').classList.add('hidden');
    }

    function loadTokens() {
      google.script.run
        .withSuccessHandler(displayTokens)
        .withFailureHandler(handleError)
        .getLineTokens();
    }

    function displayTokens(tokens) {
      const tokenList = document.getElementById('tokenList');
      tokenList.innerHTML = '';

      tokens.forEach(token => {
        const div = document.createElement('div');
        div.className = 'flex gap-2 items-center';
        div.innerHTML = `
        <span class="flex-1">${token.name}</span>
        <input type="password" value="${token.value}" readonly class="px-2 py-1 border rounded flex-1">
        <button onclick="deleteToken('${token.name}')" class="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">
          <i class="fas fa-trash"></i>
        </button>
      `;
        tokenList.appendChild(div);
      });
    }

    function addToken() {
      const name = document.getElementById('newTokenName').value;
      const value = document.getElementById('newTokenValue').value;

      if (!name || !value) {
        showNotification('กรุณากรอกข้อมูลให้ครบถ้วน', false);
        return;
      }

      google.script.run
        .withSuccessHandler(() => {
          loadTokens();
          document.getElementById('newTokenName').value = '';
          document.getElementById('newTokenValue').value = '';
          showNotification('เพิ่ม Token สำเร็จ', true);
        })
        .withFailureHandler(handleError)
        .addLineToken(name, value);
    }

    function deleteToken(name) {
      if (confirm(`ต้องการลบ Token "${name}" ใช่หรือไม่?`)) {
        google.script.run
          .withSuccessHandler(() => {
            loadTokens();
            showNotification('ลบ Token สำเร็จ', true);
          })
          .withFailureHandler(handleError)
          .deleteLineToken(name);
      }
    }
// เพิ่ม Event Listener สำหรับช่องค้นหา LINE ID
document.getElementById('searchUserInput').addEventListener('input', function() {
  updateUserList();
});

// ปรับปรุงฟังก์ชัน updateUserList
function updateUserList() {
  const searchTerm = document.getElementById('searchUserInput').value.toLowerCase();
  const userList = document.getElementById('userList');
  userList.innerHTML = '';

  if (searchTerm === '') {
    userList.innerHTML = '<div class="p-4 text-gray-500 text-center">กรุณาพิมพ์ชื่อผู้ใช้เพื่อค้นหา</div>';
    return;
  }

  const filteredData = originalData.filter(row =>
    row['NAME']?.toLowerCase().includes(searchTerm)
  );

  if (filteredData.length === 0) {
    userList.innerHTML = '<div class="p-4 text-gray-500 text-center">ไม่พบข้อมูลที่ค้นหา</div>';
    return;
  }

  filteredData.forEach(user => {
    const div = document.createElement('div');
    div.className = 'flex gap-2 items-center p-3 border-b hover:bg-gray-100 cursor-pointer transition-colors';
    div.onclick = () => selectUser(user);
    
    // กำหนด UI ที่ชัดเจนขึ้น
    const idType = user.LineID ? 'User ID' : user.GroupID ? 'Group ID' : 'ไม่มี ID';
    const idValue = user.LineID || user.GroupID || '-';
    const idStatus = user.LineID || user.GroupID ? 'text-green-600' : 'text-red-600';
    
    div.innerHTML = `
      <div class="flex-1">
        <div class="font-medium">${user.NAME}</div>
        <div class="text-sm text-gray-600">
          ประเภท: <span class="${idStatus}">${idType}</span>
        </div>
        <div class="text-sm text-gray-600">
          ID: <span class="font-mono ${idStatus}">${idValue}</span>
        </div>
      </div>
      <div>
        <button class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
          <i class="fas fa-edit mr-1"></i>แก้ไข
        </button>
      </div>
    `;
    userList.appendChild(div);
  });
}

// ปรับปรุงฟังก์ชัน selectUser
function selectUser(user) {
  selectedUser = user;
  
  // ไฮไลท์รายการที่เลือก
  const allItems = document.querySelectorAll('#userList > div');
  allItems.forEach(item => item.classList.remove('bg-blue-50'));
  event.currentTarget.classList.add('bg-blue-50');

  // อัพเดทฟอร์มแก้ไข
  document.getElementById('idType').value = user.LineID ? 'LineID' : 'GroupID';
  document.getElementById('lineIdValue').value = user.LineID || user.GroupID || '';

  // แสดงสถานะการเลือก
  const userInfo = document.createElement('div');
  userInfo.className = 'mt-4 p-3 bg-green-50 text-green-800 rounded-lg';
  userInfo.innerHTML = `กำลังแก้ไข: ${user.NAME}`;
  
  const previousInfo = document.querySelector('.editing-info');
  if (previousInfo) {
    previousInfo.remove();
  }
  userInfo.classList.add('editing-info');
  document.getElementById('lineIdValue').parentElement.insertBefore(userInfo, document.getElementById('lineIdValue'));
}

    function updateLineId() {
      if (!selectedUser) {
        showNotification('กรุณาเลือกผู้ใช้ก่อน', false);
        return;
      }

      const idType = document.getElementById('idType').value;
      const idValue = document.getElementById('lineIdValue').value;

      google.script.run
        .withSuccessHandler(() => {
          loadData();
          showNotification('อัพเดท LINE ID สำเร็จ', true);
        })
        .withFailureHandler(handleError)
        .updateLineId(selectedUser.index, idType, idValue);
    }

    function showLoading(show) {
      document.getElementById('loadingState').style.display = show ? 'block' : 'none';
      document.getElementById('errorState').style.display = 'none';
    }

    function showNotification(message, isSuccess) {
      const notificationDiv = document.getElementById('notificationStatus');
      notificationDiv.className = `mb-4 p-4 rounded-lg ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;
      notificationDiv.textContent = message;
      notificationDiv.classList.remove('hidden');
      setTimeout(() => {
        notificationDiv.classList.add('hidden');
      }, 3000);
    }

    function handleError(error) {
      showLoading(false);
      document.getElementById('errorState').style.display = 'block';
      document.getElementById('errorMessage').textContent = error;
      showNotification('เกิดข้อผิดพลาด: ' + error, false);
    }

    function loadData() {
      showLoading(true);
      google.script.run
        .withSuccessHandler(handleDataSuccess)
        .withFailureHandler(handleError)
        .getData(SHEET_ID);
    }

    function handleDataSuccess(response) {
      showLoading(false);
      if (response.success) {
        originalData = response.data;
        const totals = calculateTotals(originalData);
        updateSummaryDisplay(totals);
        renderTable(paginate(originalData, currentPage));
        updatePagination(originalData.length);
      } else {
        handleError(response.error);
      }
    }

    function calculateTotals(data) {
      return data.reduce((acc, row) => {
        const withdrawAmount = Number(row['เบิก']?.replace(/[^0-9.-]+/g, '') || 0);
        const returnAmount = Number(row['คืน']?.replace(/[^0-9.-]+/g, '') || 0);
        const pendingAmount = Number(row['ค้าง']?.replace(/[^0-9.-]+/g, '') || 0);

        acc.withdraw += withdrawAmount;
        acc.return += returnAmount;
        acc.pending += pendingAmount;
        return acc;
      }, { withdraw: 0, return: 0, pending: 0 });
    }

    function updateSummaryDisplay(totals) {
      document.getElementById('totalWithdraw').textContent = totals.withdraw.toLocaleString('th-TH') + ' TP';
      document.getElementById('totalReturn').textContent = totals.return.toLocaleString('th-TH') + ' TP';
      document.getElementById('totalPending').textContent = totals.pending.toLocaleString('th-TH') + ' TP';
    }

    function paginate(data, page) {
      const start = (page - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      return data.slice(start, end);
    }

    function updatePagination(totalItems) {
      totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
      const paginationContainer = document.getElementById('pagination');
      paginationContainer.innerHTML = '';

      // Previous button
      const prevButton = document.createElement('button');
      prevButton.innerHTML = '&laquo; ก่อนหน้า';
      prevButton.className = `px-3 py-1 mx-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`;
      prevButton.onclick = () => {
        if (currentPage > 1) {
          currentPage--;
          renderTable(paginate(originalData, currentPage));
          updatePagination(originalData.length);
        }
      };
      paginationContainer.appendChild(prevButton);

      // Page numbers
      for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = `px-3 py-1 mx-1 rounded ${currentPage === i ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`;
        pageButton.onclick = () => {
          currentPage = i;
          renderTable(paginate(originalData, currentPage));
          updatePagination(originalData.length);
        };
        paginationContainer.appendChild(pageButton);
      }

      // Next button
      const nextButton = document.createElement('button');
      nextButton.innerHTML = 'ถัดไป &raquo;';
      nextButton.className = `px-3 py-1 mx-1 rounded ${currentPage === totalPages ? 'bg-gray-200 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`;
      nextButton.onclick = () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderTable(paginate(originalData, currentPage));
          updatePagination(originalData.length);
        }
      };
      paginationContainer.appendChild(nextButton);

      // Update page info
      document.getElementById('pageInfo').textContent =
        `หน้า ${currentPage} จาก ${totalPages} (${totalItems} รายการ)`;
    }

    function renderTable(data) {
      const tableBody = document.getElementById('data-table');
      tableBody.innerHTML = '';

      data.forEach((row, index) => {
        const actualIndex = ((currentPage - 1) * ITEMS_PER_PAGE) + index + 1;
        const tr = document.createElement('tr');
        tr.className = index % 2 === 0 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-100';

        tr.innerHTML = `
        <td class="py-3 px-4 border text-center">${actualIndex}</td>
        <td class="py-3 px-4 border">${row['NAME'] || '-'}</td>
        <td class="py-3 px-4 border text-right font-medium text-red-600">${row['เบิก'] || '0'}</td>
        <td class="py-3 px-4 border text-right font-medium text-green-600">${row['คืน'] || '0'}</td>
        <td class="py-3 px-4 border text-right font-medium text-orange-600">${row['ค้าง'] || '0'}</td>
        <td class="py-3 px-4 border text-center">
          <div class="flex justify-center gap-2">
            <a href="${row['Link'] || '#'}" 
              target="_blank"
              class="inline-block px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              <i class="fas fa-external-link-alt mr-1"></i>ดูข้อมูล
            </a>
            <button onclick="notifyUser(${actualIndex - 1})" 
              class="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
              <i class="fas fa-bell mr-1"></i>แจ้งเตือน
            </button>
          </div>
        </td>
      `;
        tableBody.appendChild(tr);
      });
    }

    function exportToExcel() {
      let csvContent = "data:text/csv;charset=utf-8,\uFEFF";

      // Add headers
      const headers = ["ลำดับ", "ชื่อ-สกุล", "ยอดเบิก", "ยอดคืน", "ยอดค้าง", "Link"];
      csvContent += headers.join(",") + "\n";

      // Add data rows
      originalData.forEach((row, index) => {
        const rowData = [
          index + 1,
          row['NAME'] || '',
          row['เบิก'] || '0',
          row['คืน'] || '0',
          row['ค้าง'] || '0',
          row['Link'] || ''
        ];
        csvContent += rowData.join(",") + "\n";
      });

      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "ข้อมูลการเบิกสินค้า.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    function notifyUser(index) {
      const rowData = originalData[index];
      if (!rowData) {
        showNotification('ไม่พบข้อมูลที่ต้องการส่งแจ้งเตือน', false);
        return;
      }

      showLoading(true);
      google.script.run
        .withSuccessHandler(function (response) {
          showLoading(false);
          if (response.success) {
            showNotification('ส่งแจ้งเตือนสำเร็จ', true);
          } else {
            showNotification('เกิดข้อผิดพลาดในการส่งแจ้งเตือน: ' + response.error, false);
          }
        })
        .withFailureHandler(function (error) {
          showLoading(false);
          showNotification('เกิดข้อผิดพลาด: ' + error.message, false);
        })
        .sendLineNotification(rowData);
    }

    function refreshData() {
      document.getElementById('searchInput').value = ''; // Clear search input
      loadData();
    }
    function sendNotification() {
      const searchTerm = document.getElementById('searchInput').value.toLowerCase();
      let dataToNotify;

      if (searchTerm) {
        dataToNotify = originalData.find(row =>
          row.NAME?.toLowerCase().includes(searchTerm)
        );
      }

      if (!dataToNotify) {
        showNotification('กรุณาค้นหาและเลือกรายการที่ต้องการส่งแจ้งเตือน', false);
        return;
      }

      showLoading(true);
      google.script.run
        .withSuccessHandler(function (response) {
          showLoading(false);
          if (response.success) {
            showNotification('ส่งแจ้งเตือนสำเร็จ', true);
          } else {
            showNotification('เกิดข้อผิดพลาดในการส่งแจ้งเตือน: ' + response.error, false);
          }
        })
        .withFailureHandler(function (error) {
          showLoading(false);
          showNotification('เกิดข้อผิดพลาด: ' + error.message, false);
        })
        .sendLineNotification(dataToNotify);
    }

    function setButtonLoading(buttonId, isLoading) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  const originalContent = button.innerHTML;
  button.disabled = isLoading;

  if (isLoading) {
    button.innerHTML = `
      <div class="flex items-center justify-center">
        <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
        กำลังดำเนินการ...
      </div>
    `;
  } else {
    // ตรวจสอบว่าเป็นปุ่มไหนแล้วใส่ content กลับไปตามเดิม
    if (buttonId === 'addTokenButton') {
      button.innerHTML = 'เพิ่ม';
    } else if (buttonId === 'updateLineIdButton') {
      button.innerHTML = '<i class="fas fa-save mr-2"></i>บันทึกการเปลี่ยนแปลง';
    }
  }
}

// อัพเดทฟังก์ชัน addToken
function addToken() {
  const name = document.getElementById('newTokenName').value;
  const value = document.getElementById('newTokenValue').value;

  if (!name || !value) {
    showNotification('กรุณากรอกข้อมูลให้ครบถ้วน', false);
    return;
  }

  setButtonLoading('addTokenButton', true);

  google.script.run
    .withSuccessHandler(() => {
      loadTokens();
      document.getElementById('newTokenName').value = '';
      document.getElementById('newTokenValue').value = '';
      showNotification('เพิ่ม Token สำเร็จ', true);
      setButtonLoading('addTokenButton', false);
    })
    .withFailureHandler((error) => {
      handleError(error);
      setButtonLoading('addTokenButton', false);
    })
    .addLineToken(name, value);
}

// อัพเดทฟังก์ชัน updateLineId
function updateLineId() {
  if (!selectedUser) {
    showNotification('กรุณาเลือกผู้ใช้ก่อน', false);
    return;
  }

  const idType = document.getElementById('idType').value;
  const idValue = document.getElementById('lineIdValue').value;

  setButtonLoading('updateLineIdButton', true);

  google.script.run
    .withSuccessHandler(() => {
      loadData();
      showNotification('อัพเดท LINE ID สำเร็จ', true);
      setButtonLoading('updateLineIdButton', false);
    })
    .withFailureHandler((error) => {
      handleError(error);
      setButtonLoading('updateLineIdButton', false);
    })
    .updateLineId(selectedUser.index, idType, idValue);
}

  <!-- เพิ่ม Script -->

let isShowingAll = false;
let currentFilter = 'all';

function toggleShowAll() {
  isShowingAll = !isShowingAll;
  const button = document.getElementById('showAllButton');
  button.innerHTML = isShowingAll ? 
    '<i class="fas fa-list mr-2"></i>ซ่อนรายการ' : 
    '<i class="fas fa-list mr-2"></i>แสดงทั้งหมด';
  
  if (isShowingAll) {
    document.getElementById('searchUserInput').value = '';
  }
  
  updateUserList();
}

function filterByIdType(type) {
  currentFilter = type;
  // Update active state of filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    if (btn.dataset.type === type) {
      btn.classList.add('bg-blue-600', 'text-white');
      btn.classList.remove('bg-gray-200');
    } else {
      btn.classList.remove('bg-blue-600', 'text-white');
      btn.classList.add('bg-gray-200');
    }
  });
  updateUserList();
}

function updateUserList() {
  const searchTerm = document.getElementById('searchUserInput').value.toLowerCase();
  const userList = document.getElementById('userList');
  userList.innerHTML = '';

  // ถ้าไม่ได้แสดงทั้งหมดและไม่มีคำค้นหา
  if (!isShowingAll && searchTerm === '') {
    userList.innerHTML = '<div class="p-4 text-gray-500 text-center">กรุณาพิมพ์ชื่อผู้ใช้เพื่อค้นหา หรือคลิก \'แสดงทั้งหมด\'</div>';
    return;
  }

  let filteredData = originalData;

  // กรองตามการค้นหา
  if (searchTerm) {
    filteredData = filteredData.filter(row =>
      row['NAME']?.toLowerCase().includes(searchTerm)
    );
  }

  // กรองตามประเภท ID
  if (currentFilter !== 'all') {
    filteredData = filteredData.filter(row => {
      const hasId = row.LineID || row.GroupID;
      return currentFilter === 'hasId' ? hasId : !hasId;
    });
  }

  if (filteredData.length === 0) {
    userList.innerHTML = '<div class="p-4 text-gray-500 text-center">ไม่พบข้อมูลที่ค้นหา</div>';
    return;
  }

  // แสดงจำนวนรายการที่พบ
  const countDiv = document.createElement('div');
  countDiv.className = 'p-2 bg-gray-50 text-gray-600 text-sm border-b';
  countDiv.textContent = `พบ ${filteredData.length} รายการ`;
  userList.appendChild(countDiv);

  filteredData.forEach(user => {
    const div = document.createElement('div');
    div.className = 'flex gap-2 items-center p-3 hover:bg-gray-100 cursor-pointer transition-colors';
    div.onclick = () => selectUser(user);
    
    const idType = user.LineID ? 'User ID' : user.GroupID ? 'Group ID' : 'ไม่มี ID';
    const idValue = user.LineID || user.GroupID || '-';
    const idStatus = user.LineID || user.GroupID ? 'text-green-600' : 'text-red-600';
    
    div.innerHTML = `
      <div class="flex-1">
        <div class="font-medium">${user.NAME}</div>
        <div class="text-sm text-gray-600">
          ประเภท: <span class="${idStatus}">${idType}</span>
        </div>
        <div class="text-sm text-gray-600">
          ID: <span class="font-mono ${idStatus}">${idValue}</span>
        </div>
      </div>
      <div>
        <button class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
          <i class="fas fa-edit mr-1"></i>แก้ไข
        </button>
      </div>
    `;
    userList.appendChild(div);
  });
}

// Update existing event listener
document.getElementById('searchUserInput').addEventListener('input', function() {
  isShowingAll = false;
  document.getElementById('showAllButton').innerHTML = '<i class="fas fa-list mr-2"></i>แสดงทั้งหมด';
  updateUserList();
});
