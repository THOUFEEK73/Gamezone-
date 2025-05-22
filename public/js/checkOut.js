document.getElementById('placeOrderBtn').addEventListener('click',async()=>{
  
       const selectPayment = document.querySelector('input[name="paymentMethod"]:checked')?.value;
       
    //    const couponCode 

    if(!selectPayment){
        alert('Please select a payment method');
        return 
    }

    if(selectPayment === 'cod'){
        try{
            const response = await fetch('/placeOrder',{
                method:'POST',
                headers:{
                    'Content-Type':'application/json'
                },
                body:JSON.stringify({paymentMethod:selectPayment})
            })
                 
                if(response.redirected){
                    window.location.href = response.url;
                }else{
                    const data = await response.json();
                    alert(data.message || 'Order placed!');
                }
              
        }catch(error){
             console.error('COD Order failed:',error);
            //  alert('Something went wrong Try again');
        }
    }

})