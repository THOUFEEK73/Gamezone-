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

  if (selectPayment === 'cod') {
    try {
      const response = await fetch('/placeOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethod: selectPayment,
          shippingAddress
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
});
