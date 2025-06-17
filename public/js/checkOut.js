

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

  const appliedCouponInput = document.getElementById('appliedCouponInput');
  const appliedCoupon = appliedCouponInput ? appliedCouponInput.value : null;

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



  if (selectPayment === 'razorpay') {
    try {
     
      const orderResponse = await fetch('/placeOrder/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: selectPayment,
          shippingAddress,
          coupon: appliedCoupon
        })
      });

      const orderData = await orderResponse.json();
      console.log(orderData);
      if (!orderData.success) {
        showFlash(orderData.message || 'Failed to initiate payment', 'error');
        return;
      }

    
      const options = {
        key: orderData.key, 
        amount: orderData.amount, 
        currency: 'INR',
        name: 'GameZone',
        description: 'Order Payment',
        order_id: orderData.orderId, 
        handler: async function (response) {
       
          try {
            const verifyRes = await fetch('/verify/razorpay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              window.location.href = verifyData.redirectUrl || '/orders';
            } else {
              window.location.href = '/payments-failed?orderId=' + encodeURIComponent(orderData._id);
              showFlash(verifyData.message || 'Payment verification failed', 'error');
            }
          } catch (err) {
            showFlash('Payment verification failed. Please try again.', 'error');
          }
        },
        prefill: {
          name: orderData.userName,
          email: orderData.userEmail,
          contact: orderData.userPhone
        },
        theme: {
          color: "#3399cc"
        },
        modal: {
          ondismiss: function() {
          
            window.location.href = '/payments-failed?orderId=' + encodeURIComponent(orderData._id);
          }
        }


      };
 
      const rzp = new Razorpay(options);
      rzp.open();
    } catch (error) {
      showFlash('Razorpay payment failed. Please try again.', 'error');
      console.error('Razorpay Order failed:', error);
    }
  }
  
});

function showFlash(message, type = "success") {
  let flash = document.getElementById("flashMessage");
  if (!flash) {
    flash = document.createElement("div");
    flash.id = "flashMessage";
    document.body.appendChild(flash);
  }
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





document.addEventListener('DOMContentLoaded', function () {
  console.log('triggered')
  // Apply coupon: reload with coupon code in URL
  document.querySelectorAll('.applyCouponBtn').forEach(btn => {
    console.log('Button found:', btn);
    btn.addEventListener('click', function () {
      console.log('Apply button clicked', this.dataset.code);
      const code = this.dataset.code;
      const url = new URL(window.location.href);
      url.searchParams.set('coupon', code);
      window.location.href = url.toString();
    });
  });

  // Remove coupon: remove coupon param and reload
  const removeCouponBtn = document.getElementById('removeCouponBtn');
  if (removeCouponBtn) {
    removeCouponBtn.addEventListener('click', function () {
      const url = new URL(window.location.href);
      url.searchParams.delete('coupon');
      window.location.href = url.toString();
    });
  }
});