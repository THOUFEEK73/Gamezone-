

async function addToCart(productId) {
 
  try {
    const response = await fetch("/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    // setTimeout(() => {
    //   window.location.reload();
    // }, 900);
    await response.json();

    if (response.ok) {
      
      showCartFlash("success", "Product added to cart!");

      
    } else {
      showCartFlash('error', data.message || 'Failed to add to cart');
    }
  } catch (error) {
    console.error("Error adding product to cart", error);
    showCartFlash('error', 'You Exceeded The Stock Limit !');
  }
}

// function showToast(message) {
//   const toast = document.getElementById("toast");
//   toast.textContent = message;
//   toast.className = "toast show";
//   setTimeout(() => {
//     toast.className = "toast";
//   }, 3000); // Hide after 3 seconds
// }

function showCartFlash(type, message) {
  const flash = document.getElementById('cartFlash');
  const flashMessage = document.getElementById('cartFlashMessage');
  const icon = flash.querySelector('i');

  // Reset styles
  flash.classList.remove('border-l-green-500', 'border-l-red-500', 'from-white', 'from-red-50', 'from-green-50');
  icon.classList.remove('fa-check-circle', 'fa-times-circle', 'text-green-500', 'text-red-500');

  if (type === 'success') {
    flash.classList.add('border-l-green-500', 'from-green-50');
    icon.classList.add('fa-check-circle', 'text-green-500');
  } else {
    flash.classList.add('border-l-red-500', 'from-red-50');
    icon.classList.add('fa-times-circle', 'text-red-500');
  }

  flashMessage.textContent = message;
  flash.classList.remove('hidden', 'opacity-0');
  flash.classList.add('opacity-100');

  setTimeout(() => {
    flash.classList.add('opacity-0');
    setTimeout(() => flash.classList.add('hidden'), 300);
  }, 3000);
}



// remove cart

// async function removeItem(itemId, button) {
//   try {
//     const response = await fetch(`/cart/remove/${itemId}`, {
//       method: "DELETE",
//     });

//     const result = await response.json();

//     if (response.ok) {
//       const row = button.closest("tr");
//       row.remove();

//       showToast("✅Item removed successfully !");
//       setTimeout(() => {
//         window.location.reload();
//       }, 800);
//     } else {
//       showToast("❌Failed To Remove Item !");
//     }
//   } catch (error) {
//     console.error('Error updating product quantity', error);
//   }
// }


async function removeItem(itemId, button) {
  try {
    const confirmed = await showCustomConfirm("Remove Item", "Are you sure you want to remove this item from your cart?");

    if (!confirmed) return;
    const response = await fetch(`/cart/remove/${itemId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (response.ok) {
      const row = button.closest("tr");
      row.remove();

      // Update cart counter if backend returns new count
      if (typeof result.cartCount !== 'undefined') {
        updateCartCount(result.cartCount - parseInt(document.getElementById('cartCounter').textContent || '0'));
        // Or just set it directly:
        // document.getElementById('cartCounter').textContent = result.cartCount;
      } else {
        updateCartCount(-1); // fallback: decrement by 1
      }

      // Update cart count in cart page header
      const cartCountHeader = document.getElementById('cartCountHeader');
      if (cartCountHeader && typeof result.cartCount !== 'undefined') {
        cartCountHeader.textContent = `${result.cartCount} items`;
      }

      // Update subtotal, grand total, savings, etc.
      if (result.subTotal !== undefined) {
        const subTotalElem = document.getElementById('subTotal');
        if (subTotalElem) subTotalElem.textContent = `₹ ${result.subTotal.toLocaleString('en-IN')}`;
      }
      if (result.total !== undefined) {
        const cartTotalElem = document.getElementById('cartTotal');
        if (cartTotalElem) cartTotalElem.textContent = `₹ ${result.total.toLocaleString('en-IN')}`;
      }
      if (result.totalSavings !== undefined) {
        const savingsElem = document.getElementById('totalSavings');
        if (savingsElem) savingsElem.textContent = `-₹${result.totalSavings.toLocaleString('en-IN')}`;
      }

      // If cart is empty, show empty cart message
      const cartItemsSection = document.getElementById('cart-items-section');
      if (cartItemsSection && cartItemsSection.querySelectorAll('tr').length === 0) {
        cartItemsSection.innerHTML = `
          <div class="empty-cart text-center py-16">
            <i class="fas fa-shopping-cart text-5xl text-gray-300 mb-4"></i>
            <h2 class="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
            <p class="text-gray-500 mb-6">Looks like you haven't added any games to your cart yet.</p>
            <a href="/allgames" class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200">
              Browse Games <i class="fas fa-arrow-right ml-2"></i>
            </a>
          </div>
        `;
      }

      showToast("✅ Item removed successfully!");
    } else {
      showToast("❌ Failed To Remove Item!");
    }
  } catch (error) {
    console.error('Error removing product from cart', error);
    showToast('❌ Error removing item!');
  }
}

function showCustomConfirm(title = "Are you sure?", message = "Confirm action.") {
  return new Promise((resolve) => {
    const modal = document.getElementById('custom-confirm');
    const titleElem = document.getElementById('confirm-title');
    const messageElem = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');

    titleElem.textContent = title;
    messageElem.textContent = message;

    modal.classList.remove('hidden');

    const cleanup = () => {
      modal.classList.add('hidden');
      yesBtn.removeEventListener('click', onYes);
      noBtn.removeEventListener('click', onNo);
    };

    const onYes = () => {
      cleanup();
      resolve(true);
    };

    const onNo = () => {
      cleanup();
      resolve(false);
    };

    yesBtn.addEventListener('click', onYes);
    noBtn.addEventListener('click', onNo);
  });
}


async function updateQuantity(itemId, action) {

  try {
   

    const response = await fetch('/cart/update-Quantity', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ itemId, action }),
    })

    const result = await response.json();
  
    
    if (response.ok && result.success) {
      // Update quantity using backend value only
      const qtyElem = document.getElementById(`qty-${result.itemId}`);
      if (qtyElem) qtyElem.textContent = result.updateQty;
    
      const incBtn = document.getElementById(`increment-${result.itemId}`);
      const decBtn = document.getElementById(`decrement-${result.itemId}`);
      if (incBtn) incBtn.disabled = result.updateQty >= result.stockQuantity;
      if (decBtn) decBtn.disabled = result.updateQty <= 1;


      // After updating the quantity in the DOM
const warningElem = document.getElementById(`stock-warning-${result.itemId}`);
if (warningElem) {
  if (result.updateQty >= result.stockQuantity) {
    warningElem.style.display = '';
  } else {
    warningElem.style.display = 'none';
  }
}
      // Update item total
      const totalElem = document.getElementById(`total-${result.itemId}`);
      if (totalElem) totalElem.textContent = `₹${result.itemTotal.toLocaleString('en-IN')}`;

    
      // Update cart subtotal
      const subTotalElem = document.getElementById('subTotal');
      if (subTotalElem) subTotalElem.textContent = `₹ ${result.subTotal.toLocaleString('en-IN')}`;
    
      // Update cart grand total
      const cartTotalElem = document.getElementById('cartTotal');
      if (cartTotalElem) cartTotalElem.textContent = `₹ ${result.total.toLocaleString('en-IN')}`;
    
      // Optionally update total savings
      const savingsElem = document.getElementById('totalSavings');
      if (savingsElem) savingsElem.textContent = `-₹${result.totalSavings.toLocaleString('en-IN')}`;
    
      // Update cart counter
      const cartCounter = document.getElementById('cartCounter');
      if (cartCounter && typeof result.cartCount !== 'undefined') {
        cartCounter.textContent = result.cartCount;
        cartCounter.classList.add('scale-125', 'bg-green-500');
        setTimeout(() => {
          cartCounter.classList.remove('scale-125', 'bg-green-500');
        }, 200);
      }
      // Update cart count in cart page header
const cartCountHeader = document.getElementById('cartCountHeader');
if (cartCountHeader && typeof result.cartCount !== 'undefined') {
  cartCountHeader.textContent = `${result.cartCount} items`;
}
      
    }

  } catch (error) {
    
    console.error('Error updating product quantity', error);



  }

}


const placeOrderBtn = document.getElementById('placeOrderBtn');
if (placeOrderBtn) {
  placeOrderBtn.addEventListener('click', async () => {
    console.log('function triggered');
  });
}




async function toggleWishlist(gameId) {
  try {
    const btn = document.getElementById('wishlistBtn');
    const icon = document.getElementById('wishlistIcon');
    const isAdding = !btn.classList.contains('active');

    const response = await fetch('/wishlist/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: gameId })
    });

    const data = await response.json();

    if (response.ok) {
      if (isAdding) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        icon.style.color = 'red';
        btn.classList.add('active');
      } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        icon.style.color = '#555';
        btn.classList.remove('active');
      }
    } else {
      alert(data.message || 'Error updating wishlist');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Something went wrong!');
  }
}


function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2000);
}


// function updateCartCount(increment = 1) {
//   const cartCounter = document.getElementById('cartCounter');
//   if (cartCounter) {
//     let currentCount = parseInt(cartCounter.textContent || '0');
//     currentCount += increment;
    
//     // Update the count
//     cartCounter.textContent = currentCount;
    
//     // Add animation
//     cartCounter.classList.add('scale-125', 'bg-green-500');
    
//     // Remove animation after transition
//     setTimeout(() => {
//       cartCounter.classList.remove('scale-125', 'bg-green-500');
//     }, 200);
//   }
// }

function updateCartCount(change = 1) {
  const cartCounter = document.getElementById('cartCounter');
  if (cartCounter) {
    let currentCount = parseInt(cartCounter.textContent || '0');
    currentCount += change;

    // Prevent negative count
    currentCount = Math.max(0, currentCount);

    // Update the count
    cartCounter.textContent = currentCount;

    // Add animation based on change
    const animationClass = change > 0 ? 'bg-green-500' : 'bg-red-500';
    cartCounter.classList.add('scale-125', animationClass);

    // Remove animation after a short delay
    setTimeout(() => {
      cartCounter.classList.remove('scale-125', 'bg-green-500', 'bg-red-500');
    }, 200);
  }
}

function buyNow(gameId) {
  fetch('/buy-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId })
  })
  .then(res => res.json())
  .then(result => {
      if (result.success && result.redirectUrl) {
          window.location.href = result.redirectUrl;
      } else if (result.error) {
          alert(result.error);
      }
  })
  .catch(() => alert('Something went wrong!'));
}

async function addToCart(productId) {
  try {
    const response = await fetch("/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });

    const data = await response.json();

    if (response.ok) {
      // Update cart counter
      const cartCounter = document.getElementById('cartCounter');
      if (cartCounter && typeof data.cartCount !== 'undefined') {
        cartCounter.textContent = data.cartCount;
        cartCounter.classList.add('scale-125', 'bg-green-500');
        setTimeout(() => {
          cartCounter.classList.remove('scale-125', 'bg-green-500');
        }, 200);
      }
      // Remove the added recommendation from the DOM
      const recBtn = document.querySelector(`button[onclick="addToCart('${productId}')"]`);
      if (recBtn) {
        const recItem = recBtn.closest('.recommendation-item');
        if (recItem) recItem.remove();
      }
      showCartFlash("success", "Product added to cart!");
      fetch('/cart/partial')
      .then(res => res.text())
      .then(html => {
        document.getElementById('cart-items-section').innerHTML = html;
      });
    } else {
      showCartFlash('error', data.message || 'Failed to add to cart');
    }

    // if (response.ok) {
    //    // Use backend value for cart count
    //    const cartCounter = document.getElementById('cartCounter');
    //    if (cartCounter && typeof data.cartCount !== 'undefined') {
    //      cartCounter.textContent = data.cartCount;
    //      cartCounter.classList.add('scale-125', 'bg-green-500');
    //      setTimeout(() => {
    //        cartCounter.classList.remove('scale-125', 'bg-green-500');
    //      }, 200);
    //    }// Increment cart count
    //   showCartFlash("success", "Product added to cart!");
    // } else {
    //   showCartFlash('error', data.message || 'Failed to add to cart');
    // }
  } catch (error) {
    console.error("Error adding product to cart", error);
    showCartFlash('error', 'You Exceeded The Stock Limit!');
  }
}

