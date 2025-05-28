

async function addToCart(productId) {
  console.log('helooo')
  try {
    const response = await fetch("/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setTimeout(() => {
      window.location.reload();
    }, 900);
    await response.json();

    if (response.ok) {
      showCartFlash("Product added to cart!");
      
    } else {
      showToast("  Failed to cart!");
    }
  } catch (error) {
    console.error("Error adding product to cart", error);
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast show";
  setTimeout(() => {
    toast.className = "toast";
  }, 3000); // Hide after 3 seconds
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


document.getElementById('placeOrderBtn').addEventListener('click',async()=>{
    console.log('function triggered')
})




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

