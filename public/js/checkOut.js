

document.getElementById('placeOrderBtn').addEventListener('click', async () => {
  const selectPayment = document.querySelector('input[name="paymentMethod"]:checked')?.value;

  if (!selectPayment) {
    alert('Please select a payment method');
    return;
  }

  // ✅ Find the default address div
  const defaultAddressDiv = document.querySelector('[data-is-default="true"]');

  if (!defaultAddressDiv) {
    alert("Please set a default address first.");
    return;
  }

  const shippingAddress = JSON.parse(defaultAddressDiv.getAttribute('data-address'));

  const appliedCouponBtn = document.querySelector('.applyCouponBtn[disabled]');
  const appliedCoupon = appliedCouponBtn ? appliedCouponBtn.dataset.code : null;


  if (selectPayment === 'cod') {
    try {
      const response = await fetch('/placeOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethod: selectPayment,
          shippingAddress,
           coupon:appliedCoupon,
        })
      });

      if (response.redirected) {
        window.location.href = response.url;
      } else {
        const data = await response.json();
        alert(data.message || 'Order placed!');
      }
    } catch (error) {
      console.error('COD Order failed:', error);
    }
  }

   if(selectPayment === 'wallet'){
    try{
      const response = await fetch('/placeOrder/wallet',{
        method:'POST',
        headers:{
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(
          {paymentMethod:selectPayment,
            shippingAddress,
            coupon:appliedCoupon
          })
      })
      const data = await response.json();

      if(response.ok){
        if(data.success){
          window.location.href = data.redirectUrl || '/orders';
        }else{
          showFlash(data.message || 'Insufficient wallet balance', 'error');
        }
      }else{
        showFlash(data.message || 'Wallet payment failed', 'error');
      }
    }catch(error){
      console.error('Wallet Order failed:', error);
      showFlash('Wallet payment failed. Please try again.', 'error');
    }
  }
});


document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.applyCouponBtn').forEach(btn => {
    btn.addEventListener('click', async function () {
      const code = this.dataset.code;
      const subtotalEl = document.getElementById('subTotal');
      let cartTotal = 0;
      if (subtotalEl) {
        cartTotal = Number(subtotalEl.textContent.replace(/[^\d]/g, ''));
      }
      try {
        const response = await fetch('/apply-coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, cartTotal })
        });
        const data = await response.json();
        if (data.success) {
          // Strike-through subtotal and add "Coupon Applied" badge
          if (subtotalEl) {
            subtotalEl.classList.add('line-through', 'text-gray-400');
            // Add badge if not present
            let badge = document.getElementById('couponAppliedBadge');
            if (!badge) {
              badge = document.createElement('span');
              badge.id = 'couponAppliedBadge';
              badge.className = 'ml-2 inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-semibold align-middle';
              badge.textContent = 'Coupon Applied';
              subtotalEl.parentNode.appendChild(badge);
            }
          }
          // Update only the total amount in order summary
          const totalEl = document.getElementById('orderTotal');
          if (totalEl) {
            totalEl.textContent = `₹${data.newTotal}`;
            totalEl.classList.add('bg-green-100', 'rounded', 'px-2', 'transition');
            setTimeout(() => totalEl.classList.remove('bg-green-100', 'rounded', 'px-2', 'transition'), 1500);
          }
          const summaryDiv = document.getElementById('orderSummary');
          const subtotalRow = document.getElementById('subTotal')?.parentNode;
          let savingsEl = document.getElementById('couponSavings');
          if (!savingsEl && summaryDiv && subtotalRow) {
            savingsEl = document.createElement('div');
            savingsEl.id = 'couponSavings';
            savingsEl.className = 'flex justify-between items-center border-b border-blue-200 pb-2 bg-blue-50 rounded transition';
            summaryDiv.insertBefore(savingsEl, subtotalRow.nextSibling);
          }
          if (savingsEl) {
            savingsEl.innerHTML = `
              <span class="text-blue-700 font-semibold flex items-center gap-1">
                <svg class="w-4 h-4 text-blue-500 inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 14l2-2 4 4m0 0l-4-4-2 2"></path></svg>
                Coupon Discount
              </span>
              <span class="font-semibold text-blue-700">-₹${data.discount}</span>
            `;
            savingsEl.classList.add('animate-pulse');
            setTimeout(() => savingsEl.classList.remove('animate-pulse'), 1200);
          }
          // Change button to "Applied"
          document.querySelectorAll('.applyCouponBtn').forEach(b => {
            b.textContent = 'Apply';
            b.disabled = false;
            b.classList.remove('bg-green-600', 'text-white', 'cursor-not-allowed');
            b.classList.add('text-blue-600', 'hover:underline');
          });
          this.textContent = 'Applied';
          this.disabled = true;
          this.classList.remove('text-blue-600', 'hover:underline');
          this.classList.add('bg-green-600', 'text-white', 'cursor-not-allowed');
          // Show flash message
          showFlash(data.message || "Coupon applied successfully !", "success");
        } else {
          showFlash(data.message || "Invalid coupon", "error");
        }
      } catch (error) {
        console.error('Error applying coupon:', error);
        showFlash("Server error. Please try again.", "error");
      }
    });
  });
});
function showFlash(message, type = "success") {
  const flash = document.getElementById("flashMessage");
  flash.textContent = message;
  flash.className =
    "fixed bottom-8 right-8 px-4 py-3 rounded-md shadow-lg z-[9999] transition-all duration-300 " +
    (type === "error"
      ? "bg-red-500 text-white"
      : "bg-green-500 text-white");
  flash.classList.remove("hidden");
  setTimeout(() => {
    flash.classList.add("hidden");
  }, 3000);
}