document.addEventListener('DOMContentLoaded',function(){

    const removeButtons = document.querySelectorAll('.remove-from-wishlist');

    removeButtons.forEach(button=>{
        button.addEventListener('click',async function(){
            const productId = this.dataset.productId;
            const row = this.closest('tr');

            try{
                const response = await fetch(`/wishlist/remove/${productId}`,{
                    method:'DELETE',
                  
                    
                });
                if(response.ok){
                    row.remove();
                    showToast('Product removed from wishlist');
                }else{
                    showToast('Failed to remove product from wishlist','error');
                }
            }catch(error){
                console.error('Error removing product from wishlist:', error);
                showToast('Error removing product from wishlist','error');
            }
        })
    })
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

    addToCartButtons.forEach(button=>{
        button.addEventListener('click',async function(){
            const productId = this.dataset.productId;
            const row = this.closest('tr');

            try{
                const response = await fetch(`/cart/add`,{
                    method:'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ productId })
                })

                if(response.ok){
                   const wishlistResponse = await fetch(`/wishlist/remove/${productId}`,{
                     method:'DELETE'
                   })

                   if(wishlistResponse.ok){
                      row.remove();
                      showToast('Product added to cart');
                   }
                }else{
                    showToast('Failed to add product to cart','error');
                } 
            }catch(error){
                console.error('Error adding product to cart:', error);
                showToast('Error adding product to cart','error');
            }

            
        })
    })

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 p-4 rounded-lg ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white z-50`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
})


