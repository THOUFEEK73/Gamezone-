// Search Functionality
let debounceTimer;

// Get search elements
const desktopSearchInput = document.getElementById('searchInput');
const mobileSearchInput = document.getElementById('mobileSearchInput');
const resultsContainer = document.getElementById('results');
const defaultGames = document.getElementById('defaultGames');

// Function to handle search results
async function searchGames(query) {
    try {
        console.log('triggered search with query');
        
        const response = await fetch(`/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (!resultsContainer) return;

        resultsContainer.innerHTML = ''; // preveious search result will go

        if (data.games && data.games.length > 0) {
            // Hide default games and show results
            if (defaultGames) {
                defaultGames.classList.add('hidden');
            }
            resultsContainer.classList.remove('hidden');

            // Create and append game cards
            data.games.forEach(game => {
                const gameCard = `
                  <div class="text-center">
                    <a href="/gamedetail/${game._id}" class="block hover:scale-[1.03] transition duration-300">
                      <div class="bg-white p-4 shadow-md h-[320px] flex flex-col justify-between">
                        <div class="rounded-md overflow-hidden bg-white h-48 flex items-center justify-center">
                          <img 
                            src="${game.media.coverImage}" 
                            alt="${game.title}" 
                            class="max-h-full max-w-full object-contain"
                          >
                        </div>
                      </div>
                    </a>
              
                    <h3 class="mt-3 text-base font-semibold text-gray-900 sm:text-lg">${game.title}</h3>
              
                    <div class="mt-2 space-y-1">
                      ${game.originalPrice && game.discountPercentage ? `
                        <div class="flex items-center justify-center gap-2">
                          <span class="text-base text-green-600 font-semibold">₹${game.price}</span>
                          <span class="text-sm text-gray-400 line-through">₹${game.originalPrice}</span>
                          <span class="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                            ${game.discountPercentage}% OFF
                          </span>
                        </div>
                        ${game.offerName ? `
                          <div class="text-xs text-green-600 font-medium">
                            ${game.offerName}
                          </div>
                        ` : ''}
                      ` : game.price === 0 ? `
                        <span class="text-base text-green-600 font-semibold">Free</span>
                      ` : `
                        <span class="text-base text-gray-800 font-semibold">₹${game.price}</span>
                      `}
                    </div>
                  </div>
                `;
                resultsContainer.insertAdjacentHTML('beforeend', gameCard);
              });
              
        } else {
            // Show no results message
            if (defaultGames) {
                defaultGames.classList.add('hidden');
            }
            resultsContainer.classList.remove('hidden');
            resultsContainer.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-gray-400 mb-4">
                        <i class="fas fa-search text-4xl"></i>
                    </div>
                    <p class="text-gray-500 text-lg">No games found</p>
                    <p class="text-gray-400 text-sm mt-1">Try different keywords or browse our collection</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching search results:', error);
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-red-400 mb-4">
                        <i class="fas fa-exclamation-circle text-4xl"></i>
                    </div>
                    <p class="text-gray-500 text-lg">Something went wrong</p>
                    <p class="text-gray-400 text-sm mt-1">Please try again later</p>
                </div>
            `;
        }
    }
}

// Function to handle search input
function setupSearchInput(inputElement) {
    if (!inputElement) return;

    inputElement.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            if (query === '') {
                // Show default games and hide results
                if (defaultGames) {
                    defaultGames.classList.remove('hidden');
                }
                if (resultsContainer) {
                    resultsContainer.classList.add('hidden');
                    resultsContainer.innerHTML = '';
                }
            } else {
                searchGames(query);
            }
        }, 300);
    });
}

// Setup search inputs when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupSearchInput(desktopSearchInput);
    setupSearchInput(mobileSearchInput);
});

// Prevent form resubmission on refresh
if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
}
