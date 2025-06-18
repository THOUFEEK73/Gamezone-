


document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const priceRange = document.getElementById('price-range');
  const priceLabel = document.getElementById('price-label');
  const genreCheckboxes = document.querySelectorAll('.genre-checkbox');
  const companyCheckboxes = document.querySelectorAll('.company-checkbox');
  const sortRadios = document.querySelectorAll('.sort-radio');
  const resultDiv = document.getElementById('results');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const searchInput = document.getElementById('searchInput');

  let isMenuOpen = false;

  // Game Card Template
  function createGameCard(game) {
      return `
          <div class="text-center">
              <a href="/gamedetail/${game._id}" class="block hover:scale-[1.03] transition duration-300">
                  <div class="bg-white p-4 shadow-md h-[320px] flex flex-col justify-between">
                      <div class="rounded-md overflow-hidden bg-white h-48 flex items-center justify-center">
                          <img src="${game.media.coverImage}" 
                               alt="${game.title}"
                               class="max-h-full max-w-full object-contain">
                      </div>
                  </div>
              </a>

              <h3 class="mt-3 text-base font-semibold text-gray-900 sm:text-lg truncate">
                  ${game.title}
              </h3>

              <div class="mt-2 space-y-1">
                  ${renderPriceSection(game)}
              </div>
          </div>
      `;
  }

  function renderPriceSection(game) {
      if (game.originalPrice && game.discountPercentage) {
          return `
              <div class="flex items-center justify-center gap-2">
                  <span class="text-base text-red-600 font-semibold">₹${game.price}</span>
                  <span class="text-sm text-gray-400 line-through">₹${game.originalPrice}</span>
                  <span class="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                      ${game.discountPercentage}% OFF
                  </span>
              </div>
              ${game.offerName 
                  ? `<div class="text-xs text-green-600 font-medium">${game.offerName}</div>`
                  : ''
              }
          `;
      }
      return game.price === 0
          ? `<span class="text-base text-green-600 font-semibold">Free</span>`
          : `<span class="text-base text-gray-800 font-semibold">₹${game.price}</span>`;
  }

  // Filter Games Function
  async function fetchFilteredGames() {
      try {
          resultDiv.classList.add('opacity-50');

          const filterData = {
              maxPrice: priceRange ? parseInt(priceRange.value):20000,
              genres: Array.from(genreCheckboxes)
                  .filter(cb => cb.checked)
                  .map(cb => cb.value),
              companies: Array.from(companyCheckboxes)
                  .filter(cb => cb.checked)
                  .map(cb => cb.value),
              sort: document.querySelector('input[name="sort-order"]:checked')?.value || 'az'
          };

          const response = await fetch('/filter-games', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(filterData)
          });

          const data = await response.json();

          if (!response.ok) throw new Error(data.message);

          if (!data.games?.length) {
              resultDiv.innerHTML = `
                  <div class="col-span-full text-center py-8">
                      <p class="text-gray-500">No games found matching your criteria.</p>
                  </div>
              `;
              return;
          }

          resultDiv.innerHTML = data.games.map(createGameCard).join('');

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

  // Search Games Function
  async function searchGames(query) {
      try {
          const response = await fetch(`/allsearch?query=${query}`);
          const data = await response.json();
          
          if (!data?.length) {
              resultDiv.innerHTML = `
                  <div class="col-span-full text-center py-8">
                      <p class="text-gray-600">No games found.</p>
                  </div>
              `;
              return;
          }

          resultDiv.innerHTML = data.map(createGameCard).join('');
      } catch (error) {
          console.error('Error fetching search results:', error);
          resultDiv.innerHTML = `
              <div class="col-span-full text-center py-8">
                  <p class="text-red-500">Error searching games. Please try again.</p>
              </div>
          `;
      }
  }

  // Event Listeners
  if (priceRange && priceLabel) {
      let priceTimeout;
      priceRange.addEventListener('input', (e) => {
          priceLabel.textContent = `Up to ₹${parseInt(e.target.value).toLocaleString('en-IN')}`;
          clearTimeout(priceTimeout);
          priceTimeout = setTimeout(fetchFilteredGames, 300);
      });
  }

  // Filter Event Listeners
  genreCheckboxes.forEach(cb => cb.addEventListener('change', fetchFilteredGames));
  companyCheckboxes.forEach(cb => cb.addEventListener('change', fetchFilteredGames));
  sortRadios.forEach(radio => radio.addEventListener('change', fetchFilteredGames));

  // Mobile Menu Event Listeners
  mobileMenuBtn?.addEventListener('click', () => {
      isMenuOpen = !isMenuOpen;
      mobileMenu.classList.toggle('hidden');
      mobileMenuBtn.innerHTML = isMenuOpen ? 
          '<i class="fas fa-times text-2xl"></i>' : 
          '<i class="fas fa-bars text-2xl"></i>';
  });

  document.addEventListener('click', (e) => {
      if (isMenuOpen && !mobileMenu?.contains(e.target) && !mobileMenuBtn?.contains(e.target)) {
          mobileMenu.classList.add('hidden');
          mobileMenuBtn.innerHTML = '<i class="fas fa-bars text-2xl"></i>';
          isMenuOpen = false;
      }
  });

  // Search Event Listener
  let debounceTimer;
  searchInput?.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => searchGames(query), 300);
  });

  // Window Resize Event
  window.addEventListener('resize', () => {
      if (window.innerWidth >= 768 && isMenuOpen && mobileMenu) {
          mobileMenu.classList.add('hidden');
          mobileMenuBtn.innerHTML = '<i class="fas fa-bars text-2xl"></i>';
          isMenuOpen = false;
      }
  });

  // Initial Load
  fetchFilteredGames();
});