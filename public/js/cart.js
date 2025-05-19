async function addToCart(productId){

    try{
        const response = await fetch('/cart/add',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({productId})
            
        })
           window.location.reload()
         await response.json();

        if(response.ok){
          showToast("✅ Added to cart!");

        }else{
           showToast("  Failed to cart!");

        }
    }catch(error){
        console.error('Error adding product to cart',error);
        
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
