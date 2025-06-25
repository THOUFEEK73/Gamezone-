document.addEventListener('DOMContentLoaded',function(){

    const removeButtons = document.querySelectorAll('.remove-from-wishlist');

    removeButtons.forEach(button => {
        button.addEventListener('click', async function () {
            const productId = this.dataset.productId;
            const row = this.closest('tr');
    
            try {
                const response = await fetch(`/wishlist/remove/${productId}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    row.remove();
                    checkAndShowEmptyWishlist(); // <-- ADD THIS LINE
                    showToast('Product removed from wishlist');
                } else {
                    showToast('Failed to remove product from wishlist', 'error');
                }
            } catch (error) {
                console.error('Error removing product from wishlist:', error);
                showToast('Error removing product from wishlist', 'error');
            }
        });
    });
    
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 p-4 rounded-lg ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white z-50`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }









    // add the wishlsit product to cart

    const addToCartButtons = document.querySelectorAll('.add-to-cart');

    addToCartButtons.forEach(button => {
        button.addEventListener('click', async function () {
            const productId = this.dataset.productId;
            const row = this.closest('tr');
    
            try {
                const response = await fetch(`/cart/add`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ productId })
                });
    
                if (response.ok) {
                    const wishlistResponse = await fetch(`/wishlist/remove/${productId}`, {
                        method: 'DELETE'
                    });
    
                    if (wishlistResponse.ok) {
                        row.remove();
                        checkAndShowEmptyWishlist(); // <-- ADD THIS LINE
                        showToast('Product added to cart');
                        updateCartCount(1);
                    }
                } else {
                    showToast('Failed to add product to cart', 'error');
                }
            } catch (error) {
                console.error('Error adding product to cart:', error);
                showToast('Error adding product to cart', 'error');
            }
        });
    });

    function updateCartCount(change = 1) {
        const cartCounter = document.getElementById('cartCounter');
        if (cartCounter) {
            let currentCount = parseInt(cartCounter.textContent || '0');
            currentCount += change;
            cartCounter.textContent = currentCount;
            // Optional: add animation
            cartCounter.classList.add('scale-125', 'bg-green-500');
            setTimeout(() => {
                cartCounter.classList.remove('scale-125', 'bg-green-500');
            }, 200);
        }
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 p-4 rounded-lg ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white z-50`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function ensureWishlistTableHead() {
        let thead = document.getElementById('wishlistTableHead');
        if (!thead) {
            const table = document.querySelector('table');
            thead = document.createElement('thead');
            thead.id = 'wishlistTableHead';
            thead.className = 'bg-gray-100 text-sm text-gray-700 font-semibold';
            thead.innerHTML = `
              <tr>
                <th class="px-4 py-3 text-left">Image</th>
                <th class="px-4 py-3 text-left">Name</th>
                <th class="px-4 py-3 text-left">Category</th>
                <th class="px-4 py-3 text-left">Price</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            `;
            // Insert after <table>'s first child (which is probably <caption> or directly before <tbody>)
            const tableBody = document.getElementById('wishlistTableBody');
            table.insertBefore(thead, tableBody);
        } else {
            thead.style.display = '';
        }
    }
    
    
    function showEmptyWishlistRow() {
        const tbody = document.getElementById('wishlistTableBody');
        const thead = document.getElementById('wishlistTableHead');
        if (thead) thead.style.display = 'none';
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center px-6 py-10">
              <div class="flex flex-col items-center justify-center space-y-4 text-gray-500">
                <i class="fas fa-heart-broken text-4xl text-red-400"></i>
                <p class="text-lg font-medium">Your wishlist is empty</p>
                <p class="text-sm">Start adding your favorite items to keep track of them here!</p>
                <a href="/allgames" class="inline-block mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                  Browse Products
                </a>
              </div>
            </td>
          </tr>
        `;
    }
    
    function checkAndShowEmptyWishlist() {
        const tbody = document.getElementById('wishlistTableBody');
        const productRows = tbody.querySelectorAll('tr[data-product-id]');
        if (productRows.length === 0) {
            showEmptyWishlistRow();
        }
    }
    

})

