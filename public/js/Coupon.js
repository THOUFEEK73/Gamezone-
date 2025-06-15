function generateCouponCode() {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    document.getElementById('couponCode').value = code;
  }


  document.getElementById('addCouponForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const errorDiv = document.getElementById('couponError');
  errorDiv.classList.add('hidden');
  errorDiv.textContent = '';

  const data = {
    code: document.getElementById('couponCode').value.trim(),
    discountType: document.getElementById('discountType').value,
    discountValue: document.getElementById('discountValue').value,
    minOrderAmount: document.getElementById('minOrderAmount').value,
    maxOrderAmount: document.getElementById('maxOrderAmount').value,
    description: document.getElementById('description').value.trim(),
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value
  };



  try{

    const response = await fetch('/admin/coupons/add',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify(data)
    });

    const result = await response.json();

    const errorFields = [
        'code',
        'discountType',
        'discountValue',
        'minOrderAmount',
        'maxOrderAmount',
        'description',
        'startDate',
        'endDate'
    ];

    errorFields.forEach(field => {
        const el = document.getElementById('error-' + field);
        if (el) el.textContent = '';
    });

    if (response.ok && result.success) {
      console.log('successs')
        showToast(result.message || "Coupon successfully created!");
        setTimeout(() => location.reload(), 1200);
    } else if (result.errors) {
      console.log('error occured');
      
        // Show each field error
        errorFields.forEach(field => {
            if (result.errors[field]) {
                const el = document.getElementById('error-' + field);
                if (el) el.textContent = result.errors[field];
            }
        });
        errorDiv.textContent = "Please fix the errors above.";
        errorDiv.classList.remove('hidden');
    } else {
        errorDiv.textContent = result.message || "Failed to add coupon.";
        errorDiv.classList.remove('hidden');
    }

  }catch(error){
    errorDiv.textContent = "Server error. Please try again.";
    errorDiv.classList.remove('hidden');
  }
  })


  async function toggleCouponStatus(couponId, isActive) {
    try {
      const response = await fetch(`/admin/coupons/toggleStatus/${couponId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      });
  
      const data = await response.json();
  
      if (response.ok && data.success && data.coupon) {
        // Update status badge in the table row
        const row = document.querySelector(`tr[data-coupon-id="${couponId}"]`);
        if (row) {
          const statusTd = row.querySelector('.coupon-status');
          if (statusTd) {
            // Use the same logic as EJS
            const now = new Date();
            const start = new Date(data.coupon.startDate);
            const end = new Date(data.coupon.endDate);
  
            let status = '';
            let statusClass = '';
  
            if (!data.coupon.isActive) {
              status = 'Inactive';
              statusClass = 'bg-red-100 text-red-700';
            } else if (now < start) {
              status = 'Scheduled';
              statusClass = 'bg-yellow-100 text-yellow-700';
            } else if (now > end) {
              status = 'Expired';
              statusClass = 'bg-gray-100 text-gray-700';
            } else {
              status = 'Active';
              statusClass = 'bg-green-100 text-green-700';
            }
  
            statusTd.innerHTML = `<span class="${statusClass} px-2 py-1 rounded text-xs font-semibold">${status}</span>`;
          }
        }
        showToast(isActive ? "Coupon activated" : "Coupon deactivated");
      } else {
        showToast(data.message || "Failed to update status");
      }
    } catch (error) {
      showToast("Server error");
    }
  }

// Attach click event to all edit buttons
document.querySelectorAll('.edit-coupon-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const coupon = JSON.parse(this.dataset.coupon.replace(/&apos;/g, "'"));
    openUpdateCouponModal(coupon);
  });
});

function openUpdateCouponModal(coupon) {
  document.getElementById('updateCouponModal').classList.remove('hidden');
  document.getElementById('updateCouponId').value = coupon._id;
  document.getElementById('updateCouponCode').value = coupon.code || '';
  document.getElementById('updateDiscountType').value = coupon.discountType || '';
  document.getElementById('updateDiscountValue').value = coupon.discountValue || '';
  document.getElementById('updateMinOrderAmount').value = coupon.minOrderAmount || '';
  document.getElementById('updateMaxOrderAmount').value = coupon.maxOrderAmount || '';
  document.getElementById('updateDescription').value = coupon.description || '';
  document.getElementById('updateStartDate').value = coupon.startDate ? coupon.startDate.split('T')[0] : '';
  document.getElementById('updateEndDate').value = coupon.endDate ? coupon.endDate.split('T')[0] : '';
}

document.getElementById('updateCouponForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const fields = [
    'code', 'discountType', 'discountValue', 'minOrderAmount',
    'maxOrderAmount', 'description', 'startDate', 'endDate'
  ];

  // Clear previous errors
  fields.forEach(field => {
    const errorEl = document.getElementById('error-update-' + field);
    if (errorEl) errorEl.textContent = '';
  });

  const generalError = document.getElementById('updateCouponError');
  generalError.classList.add('hidden');
  generalError.textContent = '';

  const couponId = document.getElementById('updateCouponId').value;
  const formData = {
    code: document.getElementById('updateCouponCode').value,
    discountType: document.getElementById('updateDiscountType').value,
    discountValue: document.getElementById('updateDiscountValue').value,
    minOrderAmount: document.getElementById('updateMinOrderAmount').value,
    maxOrderAmount: document.getElementById('updateMaxOrderAmount').value,
    description: document.getElementById('updateDescription').value,
    startDate: document.getElementById('updateStartDate').value,
    endDate: document.getElementById('updateEndDate').value
  };

  try {
    const res = await fetch(`/admin/coupons/update/${couponId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json(); // Read the response first

    if (!res.ok) {
      if (data.errors) {
        for (const field in data.errors) {
          const errorEl = document.getElementById('error-update-' + field);
          if (errorEl) errorEl.textContent = data.errors[field];
        }
      } else {
        generalError.classList.remove('hidden');
        generalError.textContent = data.message || 'Failed to update coupon.';
      }
      return;
    }
    
  
    // ✅ Success
    localStorage.setItem('couponUpdated', 'Coupon updated successfully');
    location.reload();
    
    // Optional: reload or refresh coupon list
  } catch (err) {
    console.log(err)
    generalError.classList.remove('hidden');
    generalError.textContent = 'Server error. Please try again.';
  }
});


  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2000);
  }

  