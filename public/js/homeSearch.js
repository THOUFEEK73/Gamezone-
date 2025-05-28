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
        const response = await fetch(`/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (!resultsContainer) return;

        resultsContainer.innerHTML = ''; // Clear previous results

        if (data.games && data.games.length > 0) {
            // Hide default games and show results
            if (defaultGames) {
                defaultGames.classList.add('hidden');
            }
            resultsContainer.classList.remove('hidden');

            // Create and append game cards
            data.games.forEach(game => {
                const gameCard = `
                    <div class="group">
                        <a href="/gamedetail/${game._id}" class="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                            <div class="relative aspect-[4/3] overflow-hidden bg-gray-50">
                                <img 
                                    src="${game.media.coverImage}" 
                                    alt="${game.title}" 
                                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                >
                                ${game.type === 'trial' ? `
                                    <span class="absolute top-2 right-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                                        Trial
                                    </span>
                                ` : ''}
                            </div>
                            <div class="p-4">
                                <h3 class="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">
                                    ${game.title}
                                </h3>
                                <div class="mt-2 flex items-center justify-between">
                                    <div class="flex items-center space-x-2">
                                        ${game.discountPrice ? `
                                            <span class="text-base font-bold text-red-600">₹${game.discountPrice}</span>
                                            <span class="text-sm text-gray-400 line-through">₹${game.price}</span>
                                        ` : game.price === 0 ? `
                                            <span class="text-base font-bold text-green-600">Free</span>
                                        ` : `
                                            <span class="text-base font-bold text-gray-900">₹${game.price}</span>
                                        `}
                                    </div>
                                </div>
                            </div>
                        </a>
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
