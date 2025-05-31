
// Wait for DOM content
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');
  // const loadingOverlay = document.getElementById('loadingOverlay');
  // const mainContent = document.getElementById('mainContent');

  // Simulate loading time (you can remove this in production)
  // setTimeout(() => {
  //   loadingOverlay.classList.add('hidden');
  //   mainContent.classList.add('loaded');
  // }, 2000);

  // Filter Games
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

  // Genre and Company checkbox change
  document.querySelector('#sidebar').addEventListener('change', (e) => {
    if (e.target.classList.contains('genre-checkbox') || e.target.classList.contains('company-checkbox')) {
      fetchFilteredGames();
    }
  });

  // Mobile Menu
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

  document.addEventListener('click', (e) => {
    if (isMenuOpen && !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
      mobileMenu.classList.add('hidden');
      mobileMenuBtn.innerHTML = '<i class="fas fa-bars text-2xl"></i>';
      isMenuOpen = false;
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && isMenuOpen) {
      mobileMenu.classList.add('hidden');
      mobileMenuBtn.innerHTML = '<i class="fas fa-bars text-2xl"></i>';
      isMenuOpen = false;
    }
  });

  // Search Functionality
  let debounceTimer;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchGames(query);
    }, 300);
  });

  async function searchGames(query) {
    try {
      const response = await fetch(`/allsearch?query=${query}`);
      const data = await response.json();
      const resultsContainer = document.getElementById('result');
      resultsContainer.innerHTML = '';

      if (data.length > 0) {
        data.forEach(game => {
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
        });
      } else {
        resultsContainer.innerHTML = '<p class="text-gray-600 col-span-full text-center">Game Not Found.</p>';
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  }
});

// Track image loading
// window.addEventListener('load', () => {
//   const images = document.querySelectorAll('img');
//   let loadedImages = 0;
//   const totalImages = images.length;

//   function imageLoaded() {
//     loadedImages++;
//     if (loadedImages === totalImages) {
//       const loadingOverlay = document.getElementById('loadingOverlay');
//       const mainContent = document.getElementById('mainContent');
//       loadingOverlay.classList.add('hidden');
//       mainContent.classList.add('loaded');
//     }
//   }

//   images.forEach(img => {
//     if (img.complete) {
//       imageLoaded();
//     } else {
//       img.addEventListener('load', imageLoaded);
//       img.addEventListener('error', imageLoaded);
//     }
//   });


  
// });


document.addEventListener('DOMContentLoaded', () => {
  const priceRange = document.getElementById('price-range');
  const priceLabel = document.getElementById('price-label');
  const genreCheckboxes = document.querySelectorAll('.genre-checkbox');
  const companyCheckboxes = document.querySelectorAll('.company-checkbox');
  const sortRadios = document.querySelectorAll('.sort-radio');
  const resultDiv = document.getElementById('result');

  // Update price label
  priceRange.addEventListener('input', function() {
    priceLabel.textContent = `Up to ₹${parseInt(this.value).toLocaleString('en-IN')}`;
  });

  async function fetchFilteredGames() {
    try {
      // Show loading state
      resultDiv.classList.add('opacity-50');

      // Get filter values
      const filterData = {
        maxPrice: parseInt(priceRange.value),
        genres: Array.from(genreCheckboxes)
          .filter(cb => cb.checked)
          .map(cb => cb.value),
        companies: Array.from(companyCheckboxes)
          .filter(cb => cb.checked)
          .map(cb => cb.value),
        sort: document.querySelector('input[name="sort-order"]:checked')?.value || 'az'
      };

      // Fetch filtered results
      const response = await fetch('/filter-games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filterData)
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      if (data.games.length === 0) {
        resultDiv.innerHTML = `
          <div class="col-span-full text-center py-8">
            <p class="text-gray-500">No games found matching your criteria.</p>
          </div>
        `;
        return;
      }

      // Update UI with filtered results
      resultDiv.innerHTML = data.games.map(game => `
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
            ${game.discountPrice 
              ? `<span class="text-sm text-red-600 font-semibold">₹${game.discountPrice}</span>
                 <span class="text-xs text-gray-400 line-through ml-1">₹${game.price}</span>`
              : game.price === 0
                ? '<span class="text-sm text-green-600 font-semibold">Free</span>'
                : `<span class="text-sm text-gray-800 font-semibold">₹${game.price}</span>`
            }
          </div>
        </div>
      `).join('');

    } catch (error) {
      console.error('Error:', error);
      resultDiv.innerHTML = `
        <div class="col-span-full text-center py-8">
          <p class="text-red-500">Failed to load games. Please try again.</p>
        </div>
      `;
    } finally {
      resultDiv.classList.remove('opacity-50');
    }
  }

  // Add event listeners with debounce for price range
  let priceTimeout;
  priceRange.addEventListener('input', () => {
    clearTimeout(priceTimeout);
    priceTimeout = setTimeout(fetchFilteredGames, 300);
  });

  // Immediate filtering for checkboxes and radio buttons
  genreCheckboxes.forEach(cb => cb.addEventListener('change', fetchFilteredGames));
  companyCheckboxes.forEach(cb => cb.addEventListener('change', fetchFilteredGames));
  sortRadios.forEach(radio => radio.addEventListener('change', fetchFilteredGames));

  // Initial load
  fetchFilteredGames();
});