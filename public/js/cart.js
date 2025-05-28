

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