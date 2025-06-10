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
  
      if (response.ok && data.success) {
        // Update status badge in the table row
        const row = document.querySelector(`tr[data-coupon-id="${couponId}"]`);
        if (row) {
          const statusTd = row.querySelector('.coupon-status');
          if (statusTd) {
            if (isActive) {
              statusTd.innerHTML = '<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Active</span>';
            } else {
              statusTd.innerHTML = '<span class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">Inactive</span>';
            }
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


  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2000);
  }

  