document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const resultsDiv = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    const loadingDiv = document.getElementById('loading');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        loadingDiv.classList.remove('hidden');
        resultsDiv.classList.add('hidden');
        
        // Get form data
        const location = document.getElementById('location').value;
        const radius = document.getElementById('radiusRange').value;
        const establishmentType = document.getElementById('establishmentType').value;
        const foodType = document.getElementById('foodType').value;
        
        // Validate required fields
        if (!location) {
            alert('Please enter a location');
            loadingDiv.classList.add('hidden');
            return;
        }

        console.log('Submitting search with:', { location, radius, establishmentType, foodType });
        
        // Get selected dietary preferences
        const dietaryPreferences = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        // Prepare request data
        const data = {
            location,
            radius: `${radius}km`,
            establishment_type: establishmentType,
            food_type: foodType,
            dietary_preferences: dietaryPreferences
        };

        try {
            console.log('Sending request with data:', data);
            const response = await fetch('/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log('Received response:', result);

            if (result.success) {
                try {
                    const parsedResults = JSON.parse(result.results);
                    console.log('Parsed results:', parsedResults);
                    
                    if (!parsedResults.restaurants || !Array.isArray(parsedResults.restaurants)) {
                        throw new Error('Invalid restaurant data format');
                    }

                    const formattedResults = parsedResults.restaurants
                        .map(restaurant => createRestaurantCard(restaurant))
                        .join('');
                    
                    resultsContent.innerHTML = `
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            ${formattedResults}
                        </div>
                    `;
                    resultsDiv.classList.remove('hidden');
                } catch (e) {
                    console.error('Error parsing results:', e);
                    resultsContent.innerHTML = `
                        <div class="text-red-600 text-center">
                            <i class="fas fa-exclamation-circle mr-2"></i>
                            Error parsing results: ${e.message}
                        </div>
                    `;
                    resultsDiv.classList.remove('hidden');
                }
            } else {
                console.error('API error:', result.error);
                resultsContent.innerHTML = `
                    <div class="text-red-600 text-center">
                        <i class="fas fa-exclamation-circle mr-2"></i>
                        Error: ${result.error}
                    </div>
                `;
                resultsDiv.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Network error:', error);
            resultsContent.innerHTML = `
                <div class="text-red-600 text-center">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Network error: ${error.message}
                </div>
            `;
            resultsDiv.classList.remove('hidden');
        } finally {
            loadingDiv.classList.add('hidden');
        }
    });
});

function getRestaurantIcon(type) {
    const icons = {
        'fine-dining': 'utensils',
        'casual': 'hamburger',
        'cafe': 'coffee',
        'fast-food': 'pizza-slice'
    };
    return icons[type] || 'store';
}

function getPriceRangeClass(priceRange) {
    const count = (priceRange.match(/₹/g) || []).length;
    return count <= 2 ? 'text-green-600' : count === 3 ? 'text-yellow-600' : 'text-red-600';
}

function createRestaurantCard(restaurant) {
    const hasLinks = restaurant.links && Object.keys(restaurant.links).length > 0;
    const hasPhotos = restaurant.photos && restaurant.photos.length > 0;
    
    return `
        <div class="bg-gray-800 rounded-lg shadow-xl overflow-hidden transform hover:scale-102 transition-all duration-200">
            ${hasPhotos ? `
                <div class="relative h-48 overflow-hidden">
                    <img src="${restaurant.photos[0]}" alt="${restaurant.name}" 
                         class="w-full h-full object-cover">
                    <div class="absolute top-0 right-0 m-4">
                        <span class="px-2 py-1 bg-gray-900 bg-opacity-75 rounded-full text-sm">
                            <i class="fas fa-star text-yellow-400"></i>
                            ${restaurant.rating}
                        </span>
                    </div>
                </div>
            ` : ''}
            
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-semibold text-gray-100 mb-2">${restaurant.name}</h3>
                        <p class="text-gray-400">${restaurant.cuisine}</p>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-${getRestaurantIcon(restaurant.image)} text-2xl text-indigo-400"></i>
                    </div>
                </div>
                
                <div class="flex flex-wrap items-center gap-4 mb-4 text-sm">
                    <span class="flex items-center text-gray-400">
                        <i class="fas fa-map-marker-alt text-red-500 mr-1"></i>
                        ${restaurant.distance}
                    </span>
                    <span class="${getPriceRangeClass(restaurant.priceRange)} font-semibold">
                        ${restaurant.priceRange}
                    </span>
                    ${restaurant.averageCost ? `
                        <span class="text-gray-400">
                            <i class="fas fa-wallet mr-1"></i>
                            ${restaurant.averageCost}
                        </span>
                    ` : ''}
                </div>

                <div class="flex flex-wrap gap-2 mb-4">
                    ${restaurant.features.map(feature => 
                        `<span class="px-2 py-1 bg-gray-700 text-gray-300 text-sm rounded-full">
                            ${feature}
                        </span>`
                    ).join('')}
                </div>

                ${restaurant.popularDishes ? `
                    <div class="mb-4">
                        <h4 class="text-gray-300 text-sm font-semibold mb-2">Popular Dishes</h4>
                        <div class="flex flex-wrap gap-2">
                            ${restaurant.popularDishes.map(dish => 
                                `<span class="px-2 py-1 bg-indigo-900 text-indigo-300 text-sm rounded-full">
                                    ${dish}
                                </span>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}

                ${hasLinks ? `
                    <div class="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-700">
                        ${Object.entries(restaurant.links).map(([platform, url]) => 
                            `<a href="${url}" target="_blank" rel="noopener noreferrer"
                                class="text-indigo-400 hover:text-indigo-300">
                                <i class="fas fa-${getPlatformIcon(platform)} mr-1"></i>
                                ${platform}
                            </a>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function getPlatformIcon(platform) {
    const icons = {
        website: 'globe',
        zomato: 'utensils',
        swiggy: 'shopping-bag',
        googleMaps: 'map-marker-alt'
    };
    return icons[platform.toLowerCase()] || 'link';
}

// Add radius range functionality
document.getElementById('radiusRange').addEventListener('input', (e) => {
    document.getElementById('radiusValue').textContent = `${e.target.value} km`;
});

// Add geolocation support
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                
                // Reverse geocode to get address
                fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=YOUR_GOOGLE_MAPS_API_KEY`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.results[0]) {
                            document.getElementById('location').value = data.results[0].formatted_address;
                        }
                    });
            },
            (error) => {
                console.error("Error getting location:", error);
                alert("Unable to get your location. Please enter it manually.");
            }
        );
    } else {
        alert("Geolocation is not supported by your browser");
    }
}

// Add view toggle functionality
let currentView = 'grid';

function toggleView(view) {
    currentView = view;
    const resultsContainer = document.getElementById('resultsContent').firstElementChild;
    
    if (view === 'grid') {
        resultsContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    } else {
        resultsContainer.className = 'space-y-6';
    }
} 