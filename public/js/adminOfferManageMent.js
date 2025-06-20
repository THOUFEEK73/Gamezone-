// filepath: /home/thoufeek/GameZone/public/js/adminOfferManageMent.js
document.addEventListener('DOMContentLoaded', function() {
    const offerForm = document.getElementById('offerForm');
    const offerType = document.getElementById('offerType');
    const productSelectDiv = document.getElementById('productSelectDiv');
    const categorySelectDiv = document.getElementById('categorySelectDiv');
    const productSelect = document.getElementById('productSelect');
    const categorySelect = document.getElementById('categorySelect');


    

    // Handle offer type change
    offerType.addEventListener('change', function() {
        console.log('Offer type changed to:', this.value); // Debug log

        // Reset display for both divs
        productSelectDiv.style.display = 'none';
        categorySelectDiv.style.display = 'none';
        productSelect.required = false;
        categorySelect.required = false;

        // Show relevant div based on selection
        if (this.value === 'product') {
            productSelectDiv.style.display = 'block';
            productSelect.required = true;
        } else if (this.value === 'category') {
            categorySelectDiv.style.display = 'block';
            categorySelect.required = true;
        }
    });
    

    // Form submission
    offerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearAllErrors();
        
        try {
            const formData = {
                offerName: document.getElementById('offerName').value.trim(),
                offerType: offerType.value,
                discountPercentage: document.getElementById('discountPercentage').value,
                startDate: document.getElementById('startDate').value,
                endDate: document.getElementById('endDate').value,
                items: offerType.value === 'product' 
                    ? [productSelect.value]
                    : offerType.value === 'category'
                    ? [categorySelect.value]
                    : []
            };
           
            console.log('Sending form data',formData)
            const response = await fetch('/admin/offers/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            console.log(data)

            if (response.ok) {
                showToast('Success', ' Offer created successfully!', 'success');
                offerForm.reset();
                document.getElementById('modalOverlay').classList.add('hidden');
                setTimeout(() => window.location.reload(), 2500);
            } else {
                if (data.errors) {
                    // Clear previous errors
                    document.querySelectorAll("[id$='Error']").forEach(el => {
                        el.textContent = '';
                        el.classList.add('hidden');
                    });

                    // Display new errors
                    Object.entries(data.errors).forEach(([field, message]) => {
                        const errorElement = document.getElementById(`${field}Error`);
                        if (errorElement) {
                            errorElement.textContent = message;
                            errorElement.classList.remove('hidden');
                            
                            // Add red border to invalid field
                            const inputField = document.getElementById(field);
                            if (inputField) {
                                inputField.classList.add('border-red-500');
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error:', error);
            const generalError = document.getElementById('generalError');
            if (generalError) {
                generalError.textContent = 'Network error occurred';
                generalError.classList.remove('hidden');
            }
        }
    });

    

    function clearAllErrors() {
        // Clear error messages
        document.querySelectorAll("[id$='Error']").forEach(el => {
            el.textContent = '';
            el.classList.add('hidden');
        });

        // Remove red borders
        document.querySelectorAll('input, select').forEach(input => {
            input.classList.remove('border-red-500');
        });
    }

    // Clear individual field error on input
    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', function() {
            const errorElement = document.getElementById(`${this.id}Error`);
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.classList.add('hidden');
            }
            this.classList.remove('border-red-500');
        });
    });


    document.querySelectorAll('.offer-status-toggle').forEach(toggle => {
        toggle.addEventListener('change', async function() {
            const offerId = this.dataset.offerId;
            const newState = this.checked;
    
            try {
                const response = await fetch(`/admin/offers/toggle/${offerId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ isActive: newState })
                });
    
                const data = await response.json();
                
                if (response.ok) {
                    const row = this.closest('tr');
                    const statusBadge = row.querySelector('.status-badge');
                    const startDate = new Date(row.querySelector('td:nth-child(4)').textContent);
                    const endDate = new Date(row.querySelector('td:nth-child(5)').textContent);
                    const now = new Date();
    
                    let status;
                    let statusClass;
    
                    if (!newState) {
                        status = 'Inactive';
                        statusClass = 'bg-red-100 text-red-600';
                    } else {
                        if (now < startDate) {
                            status = 'Scheduled';
                            statusClass = 'bg-yellow-100 text-yellow-600';
                        } else if (now > endDate) {
                            status = 'Expired';
                            statusClass = 'bg-gray-100 text-gray-600';
                        } else {
                            status = 'Active';
                            statusClass = 'bg-green-100 text-green-600';
                        }
                    }
    
                    statusBadge.className = `status-badge ${statusClass} text-xs font-semibold px-3 py-1 rounded-full`;
                    statusBadge.textContent = status;
                    showToast('Success', data.message, 'success');
                } else {
                    // Revert the toggle state
                    this.checked = !newState;
                    showToast('Error', data.message || 'Failed to update status', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                // Revert the toggle state
                this.checked = !newState;
                showToast('Error', 'Failed to update offer status', 'error');
            }
        });
    });


    



});



function showToast(title, message, type = 'success') {
    const backgroundColor = type === 'success' ? '#4CAF50' : '#f44336';
    const icon = type === 'success' ? '✓' : '✗';
    
    Toastify({
        text: `${icon} ${message}`,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: {
            background: backgroundColor,
            color: '#ffffff',
            borderRadius: '8px',
            padding: '12px 24px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            fontSize: '14px',
            fontWeight: '500'
        }
    }).showToast();
}



document.getElementById('editOfferForm').addEventListener('submit', async function(e) {
    e.preventDefault();
  
    // Clear previous errors
    document.querySelectorAll("[id^='edit'][id$='Error']").forEach(el => {
      el.textContent = '';
      el.classList.add('hidden');
    });
    document.querySelectorAll('#editOfferForm input, #editOfferForm select').forEach(input => {
      input.classList.remove('border-red-500');
    });
  
    const form = e.target;
    const formData = new FormData(form);
    const data = {
      offerId: formData.get('offerId'),
      offerName: formData.get('offerName'),
      offerType: formData.get('offerType'),
      discountPercentage: formData.get('discountPercentage'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      productSelect: formData.get('productSelect'),
      categorySelect: formData.get('categorySelect')
    };
  
    try {
      const response = await fetch('/admin/offers/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        showToast('Success', result.message, 'success');
        document.getElementById('editModalOverlay').classList.add('hidden');
        setTimeout(() => location.reload(), 1200);
      } else {
        // Show field errors if present
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, message]) => {
            // Show toast for each error
            showToast('Error', message, 'error');
            // Show error under the field if possible
            const errorElement = document.getElementById(`edit${capitalizeFirstLetter(field)}Error`);
            if (errorElement) {
              errorElement.textContent = message;
              errorElement.classList.remove('hidden');
              // Add red border to invalid field
              const inputField = document.getElementById(`edit${capitalizeFirstLetter(field)}`);
              if (inputField) {
                inputField.classList.add('border-red-500');
              }
            }
          });
        } else {
          showToast('Error', result.message || "Update failed", 'error');
        }
      }
    } catch (err) {
      showToast('Error', "Server error", 'error');
    }
  });
  
  // Helper function to capitalize first letter
  function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }