

// --- Search Functionality ---
let debounceTimer;

const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('results');
const defaultGames = document.getElementById('defaultGames');

async function searchGames(query) {
  try {
    const response = await fetch(`/search?query=${encodeURIComponent(query)}`);
    const data = await response.json();

    resultsContainer.innerHTML = ''; // Clear previous results

    if (data.games && data.games.length > 0) {
      defaultGames.classList.add('hidden');
      resultsContainer.classList.remove('hidden');

      data.games.forEach((game) => {
        const gameCard = `
          <div class="text-center">
            <a href="/gamedetail/${game._id}" class="block bg-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.04] transition duration-300 overflow-hidden">
              <div class="h-60 sm:h-64 md:h-72 lg:h-80 flex items-center justify-center bg-white p-3">
                <img src="${game.media.coverImage}" alt="${game.title}" class="object-contain max-h-full w-full">
              </div>
            </a>
            <h3 class="mt-3 text-base font-semibold text-gray-900 sm:text-lg">${game.title}</h3>
            <div class="mt-1">
              <span class="text-base text-gray-800 font-semibold">
                ${game.price === 0 ? 'Free' : `₹${game.price}`}
              </span>
            </div>
          </div>
        `;
        resultsContainer.insertAdjacentHTML('beforeend', gameCard);
      });
    } else {
      defaultGames.classList.add('hidden');
      resultsContainer.classList.remove('hidden');
      resultsContainer.innerHTML = '<p class="text-gray-500">No games found.</p>';
    }
  } catch (error) {
    console.error('Error fetching search results:', error);
  }
}

searchInput?.addEventListener('input', (e) => {
  const query = e.target.value.trim();

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (query === '') {
      defaultGames.classList.remove('hidden');
      resultsContainer.classList.add('hidden');
      resultsContainer.innerHTML = '';
    } else {
      searchGames(query);
    }
  }, 300);
});

// Prevent form resubmission on refresh
if (window.history.replaceState) {
  window.history.replaceState(null, null, window.location.href);
}
