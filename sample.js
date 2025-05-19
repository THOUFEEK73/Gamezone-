
   document.addEventListener('DOMContentLoaded', () => {
      const loadingOverlay = document.getElementById('loadingOverlay');
      const mainContent = document.getElementById('mainContent');
      
      // Simulate loading time (you can remove this setTimeout in production)
      setTimeout(() => {
        // Hide loading overlay
        loadingOverlay.classList.add('hidden');
        // Show main content
        mainContent.classList.add('loaded');
      }, 2000); // 2 seconds loading time
    });

    // Track image loading
    window.addEventListener('load', () => {
      const images = document.querySelectorAll('img');
      let loadedImages = 0;
      const totalImages = images.length;
      
      function imageLoaded() {
        loadedImages++;
        if (loadedImages === totalImages) {
          // All images are loaded
          const loadingOverlay = document.getElementById('loadingOverlay');
          const mainContent = document.getElementById('mainContent');
          
          loadingOverlay.classList.add('hidden');
          mainContent.classList.add('loaded');
        }
      }

      // Check each image
      images.forEach(img => {
        if (img.complete) {
          imageLoaded();
        } else {
          img.addEventListener('load', imageLoaded);
          img.addEventListener('error', imageLoaded); 
        }
      });
    });

   
    document.addEventListener('DOMContentLoaded', () => {
  const priceRange = document.getElementById('price-range');
  const priceLabel = document.getElementById('price-label');
  const gamesContainer = document.querySelector('.grid');

  const fetchFilteredGames = async () => {
    const selectedGenres = Array.from(document.querySelectorAll('.genre-checkbox:checked')).map(cb => cb.value);
    const selectedCompanies = Array.from(document.querySelectorAll('.company-checkbox:checked')).map(cb => cb.value);
    const maxPrice = priceRange.value;

    try {
      const response = await fetch('/filter-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genres: selectedGenres, companies: selectedCompanies, maxPrice })
      });

      const data = await response.json();
      gamesContainer.innerHTML = '';

      if (data.games.length > 0) {
        data.games.forEach(game => {
          const gameCard = `
            <div class="text-center">
              <a href="/gamedetail/${game._id}" class="block hover:scale-[1.03] transition duration-300 overflow-hidden">
                <div class="rounded-2xl overflow-hidden">
                  <img src="${game.media.coverImage}" alt="${game.title}" class="w-full h-auto object-contain">
                </div>
              </a>
              <h3 class="mt-2 text-sm font-semibold text-gray-900">${game.title}</h3>
              ${game.type === 'trial'
                ? '<p class="text-xs text-red-500 font-medium mt-1">🛡️ Game Trial</p>'
                : '<p class="text-xs text-gray-400 mt-1">Demo Tag</p>'
              }
              <div class="mt-1">
                ${
                  game.discountPrice
                    ? `<span class="text-sm text-red-600 font-semibold">Rs ${game.discountPrice}</span>
                       <span class="text-xs text-gray-400 line-through ml-1">Rs ${game.price}</span>`
                    : game.price === 0
                    ? `<span class="text-sm text-green-600 font-semibold">Free</span>`
                    : `<span class="text-sm text-gray-800 font-semibold">Rs ${game.price}</span>`
                }
              </div>
            </div>
          `;
          gamesContainer.innerHTML += gameCard;
        });
      } else {
        gamesContainer.innerHTML = '<p class="text-gray-600 col-span-full text-center">No games found matching your filters.</p>';
      }
    } catch (error) {
      console.error('Error fetching filtered games:', error);
    }
  };

  // Price range change
  priceRange.addEventListener('input', () => {
    priceLabel.textContent = `Up to ₹${priceRange.value}`;
    fetchFilteredGames();
  });

  // Delegate genre/company checkbox change
  document.querySelector('#sidebar').addEventListener('change', (e) => {
    if (e.target.classList.contains('genre-checkbox') || e.target.classList.contains('company-checkbox')) {
      fetchFilteredGames();
    }
  });
});


    
    // Mobile Menu Functionality
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    let isMenuOpen = false;

    mobileMenuBtn.addEventListener('click', () => {
        isMenuOpen = !isMenuOpen;
        mobileMenu.classList.toggle('hidden');
        mobileMenuBtn.innerHTML = isMenuOpen ? 
            '<i class="fas fa-times text-2xl"></i>' : 
            '<i class="fas fa-bars text-2xl"></i>';
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (isMenuOpen && !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            mobileMenu.classList.add('hidden');
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars text-2xl"></i>';
            isMenuOpen = false;
        }
    });

    // Close mobile menu on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768 && isMenuOpen) {
            mobileMenu.classList.add('hidden');
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars text-2xl"></i>';
            isMenuOpen = false;
        }
    });


    //search functionality

     let debounceTimer;

     async function searchGames(query){
      try{        
        console.log('searching games...')
        const response = await fetch(`/allsearch?query=${query}`);
        const data  = await response.json();
        const resultsContainer = document.getElementById('result');
        resultsContainer.innerHTML = '';
        if(data.length >0){
          data.forEach(game=>{

            const gameCard = `
                <div class="text-center">
                  <a href="/gamedetail/${game._id}" class="block hover:scale-[1.03] transition duration-300 overflow-hidden">
                    <div class="rounded-2xl overflow-hidden">
                      <img src="${game.media.coverImage}" alt="${game.title}" class="w-full h-auto object-contain">
                    </div>
                  </a>
                  <h3 class="mt-2 text-sm font-semibold text-gray-900">${game.title}</h3>
                  ${game.type === 'trial'
                    ? '<p class="text-xs text-red-500 font-medium mt-1">🛡️ Game Trial</p>'
                    : '<p class="text-xs text-gray-400 mt-1">Demo Tag</p>'
                  }
                  <div class="mt-1">
                    ${
                      game.discountPrice
                        ? `<span class="text-sm text-red-600 font-semibold">Rs ${game.discountPrice}</span>
                           <span class="text-xs text-gray-400 line-through ml-1">Rs ${game.price}</span>`
                        : game.price === 0
                        ? `<span class="text-sm text-green-600 font-semibold">Free</span>`
                        : `<span class="text-sm text-gray-800 font-semibold">Rs ${game.price}</span>`
                    }
                  </div>
                </div>
              `;

              resultsContainer.insertAdjacentHTML('beforeend', gameCard);


          })
        }else{
          resultsContainer.innerHTML = '<p class="text-gray-600 col-span-full text-center">Game Not Found .</p>';
        }
      }catch(error){
        console.error('Error fetching search results:', error);
        
      }
     }

     // debounce funtionn

     document.getElementById('searchInput').addEventListener('input', (e) => {
    const query = e.target.value.trim();

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        
            searchGames(query);
      
    }, 300); // 300ms debounce delay
});
