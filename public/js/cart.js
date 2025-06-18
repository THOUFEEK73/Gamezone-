

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

async function removeItem(itemId, button) {
  try {
    const response = await fetch(`/cart/remove/${itemId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (response.ok) {
      const row = button.closest("tr");
      row.remove();

      showToast("✅Item removed successfully !");
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } else {
      showToast("❌Failed To Remove Item !");
    }
  } catch (error) {
    console.error('Error updating product quantity', error);
  }
}



async function updateQuantity(itemId, action) {

  try {
    console.log('testing...')

    const response = await fetch('/cart/update-Quantity', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ itemId, action }),
    })

    const result = await response.json();

    if (response.ok) {
      location.reload();
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


function updateCartCount(increment = 1) {
  const cartCounter = document.getElementById('cartCounter');
  if (cartCounter) {
    let currentCount = parseInt(cartCounter.textContent || '0');
    currentCount += increment;
    
    // Update the count
    cartCounter.textContent = currentCount;
    
    // Add animation
    cartCounter.classList.add('scale-125', 'bg-green-500');
    
    // Remove animation after transition
    setTimeout(() => {
      cartCounter.classList.remove('scale-125', 'bg-green-500');
    }, 200);
  }
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
      updateCartCount(); // Increment cart count
      showCartFlash("success", "Product added to cart!");
    } else {
      showCartFlash('error', data.message || 'Failed to add to cart');
    }
  } catch (error) {
    console.error("Error adding product to cart", error);
    showCartFlash('error', 'You Exceeded The Stock Limit!');
  }
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
      updateCartCount(); // Increment cart count
      showCartFlash("success", "Product added to cart!");
    } else {
      showCartFlash('error', data.message || 'Failed to add to cart');
    }
  } catch (error) {
    console.error("Error adding product to cart", error);
    showCartFlash('error', 'You Exceeded The Stock Limit!');
  }
}