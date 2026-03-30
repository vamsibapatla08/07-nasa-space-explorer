// Find page elements we need
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');
const apodModal = document.getElementById('apodModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalImage = document.getElementById('modalImage');
const modalVideo = document.getElementById('modalVideo');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const factText = document.getElementById('factText');

// Space facts shown in the Did you know modal
const spaceFacts = [
  'One day on Venus is longer than one year on Venus.',
  'The footprints left by astronauts on the Moon can last for millions of years.',
  'Neutron stars are so dense that one teaspoon of material would weigh about a billion tons on Earth.',
  'Jupiter has the shortest day of all planets in our solar system, lasting about 10 hours.',
  'Sunlight takes about 8 minutes and 20 seconds to travel from the Sun to Earth.',
  'Saturn could float in water because its average density is lower than water.',
  'A year on Mercury is only 88 Earth days.',
  'There are more stars in the universe than grains of sand on all of Earth\'s beaches.',
  'If you could stand on the surface of the Sun, you would weigh 28 times more than you do on Earth.',
  'The Great Red Spot on Jupiter is a storm that has been raging for at least 400 years.',
  'A day on Venus is 243 Earth days, but a year on Venus is only 225 Earth days.',
  'The Moon is slowly drifting away from Earth at about 1.5 inches per year.',
  'Mars has the largest volcano in the solar system, called Olympus Mons.',
  'The Andromeda Galaxy is on a collision course with our Milky Way Galaxy and will merge in about 5 billion years.',
  'Uranus rotates on its side, likely due to a collision with an Earth-sized object early in its history.',
  'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth, so we always see the Sun as it was 8 minutes ago.'
];

// NASA APOD endpoint and public demo key
const APOD_URL = 'https://api.nasa.gov/planetary/apod';
const API_KEY = 'idbKGPLpQCKzgo3O3ROXP1rgezft5NtlcG4ndUds';
const FALLBACK_API_KEY = 'DEMO_KEY';
const APOD_FIRST_DATE = '1995-06-16';
const GALLERY_ITEM_COUNT = 9;

// Set up the date inputs (from dateRange.js)
setupDateInputs(startInput, endInput);

// Pick one random fact and display it above the gallery
function showRandomSpaceFact() {
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);
  factText.textContent = spaceFacts[randomIndex];
}

showRandomSpaceFact();

// Format Date object as YYYY-MM-DD for API requests and date inputs
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Build a 9-day consecutive range from the selected start date
function buildNineDayRange(startDateValue) {
  const startDate = new Date(startDateValue);
  const todayDate = new Date();
  const minDate = new Date(APOD_FIRST_DATE);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 8);

  // If range would pass today, shift backward so it still contains 9 days
  if (endDate > todayDate) {
    endDate.setTime(todayDate.getTime());
    startDate.setTime(todayDate.getTime());
    startDate.setDate(todayDate.getDate() - 8);
  }

  // If range would go before APOD start date, shift forward
  if (startDate < minDate) {
    startDate.setTime(minDate.getTime());
    endDate.setTime(minDate.getTime());
    endDate.setDate(minDate.getDate() + 8);
  }

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
}

// Convert common video links into embeddable links (for example YouTube watch URLs)
function toEmbedUrl(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes('youtube.com') && parsedUrl.pathname === '/watch') {
      const videoId = parsedUrl.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    if (parsedUrl.hostname === 'youtu.be') {
      const videoId = parsedUrl.pathname.replace('/', '');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    return url;

  } catch {
    return url;
  }
}

// Open modal with details for the selected image
function openModal(apodItem) {
  if (apodItem.mediaType === 'video') {
    modalImage.hidden = true;
    modalImage.src = '';

    modalVideo.hidden = false;
    modalVideo.src = apodItem.embedUrl;

  } else {
    modalVideo.hidden = true;
    modalVideo.src = '';

    modalImage.hidden = false;
    modalImage.src = apodItem.fullImageUrl;
    modalImage.alt = apodItem.title;
  }

  modalTitle.textContent = apodItem.title;
  modalDate.textContent = apodItem.date;
  modalExplanation.textContent = apodItem.explanation;

  apodModal.classList.add('is-open');
  apodModal.setAttribute('aria-hidden', 'false');
}

// Close modal and clean up image source
function closeModal() {
  apodModal.classList.remove('is-open');
  apodModal.setAttribute('aria-hidden', 'true');
  modalImage.src = '';
  modalVideo.src = '';
}

// Show a simple message in the gallery (placeholder, loading, or error)
function showGalleryMessage(message, icon = '🔭') {
  gallery.innerHTML = '';

  const placeholder = document.createElement('div');
  placeholder.className = 'placeholder';

  const iconElement = document.createElement('div');
  iconElement.className = 'placeholder-icon';
  iconElement.textContent = icon;

  const messageElement = document.createElement('p');
  messageElement.textContent = message;

  placeholder.appendChild(iconElement);
  placeholder.appendChild(messageElement);
  gallery.appendChild(placeholder);
}

// Build one gallery card from normalized APOD data
function createGalleryCard(apodItem) {
  const card = document.createElement('article');
  card.className = 'gallery-item';
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Open details for ${apodItem.title}`);

  const mediaWrapper = document.createElement('div');
  mediaWrapper.className = 'gallery-media';

  const image = document.createElement('img');
  image.src = apodItem.imageUrl;
  image.alt = apodItem.title || 'NASA Astronomy Picture of the Day';
  image.loading = 'lazy';
  mediaWrapper.appendChild(image);

  const overlay = document.createElement('div');
  overlay.className = 'gallery-overlay';

  const overlayText = document.createElement('span');
  overlayText.className = 'overlay-action';
  overlayText.textContent = 'View details';

  const mediaBadge = document.createElement('span');
  mediaBadge.className = 'media-badge';
  mediaBadge.textContent = apodItem.mediaType.toUpperCase();

  overlay.appendChild(overlayText);
  overlay.appendChild(mediaBadge);
  mediaWrapper.appendChild(overlay);
  card.appendChild(mediaWrapper);

  const title = document.createElement('p');
  title.innerHTML = `<strong>${apodItem.title}</strong> (${apodItem.date})`;

  card.appendChild(title);

  card.addEventListener('click', () => {
    openModal(apodItem);
  });

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openModal(apodItem);
    }
  });

  return card;
}

// Convert NASA APOD data into a consistent object shape for the gallery
function normalizeApodItems(apodData) {
  const apodItems = Array.isArray(apodData) ? apodData : [apodData];

  return apodItems
    .map((item) => {
      const mediaType = item.media_type === 'video' ? 'video' : 'image';
      const imageUrl = mediaType === 'image' ? item.url : (item.thumbnail_url || 'img/nasa-worm-logo.png');

      return {
        mediaType,
        imageUrl,
        fullImageUrl: mediaType === 'image' ? (item.hdurl || item.url) : imageUrl,
        embedUrl: mediaType === 'video' ? toEmbedUrl(item.url) : '',
        title: item.title,
        date: item.date,
        explanation: item.explanation
      };
    })
    // Keep only complete entries so the gallery always has usable content
    .filter((item) => {
      const hasMedia = item.mediaType === 'video' ? item.embedUrl : item.imageUrl;
      return hasMedia && item.title && item.date && item.explanation;
    });
}

// Render the full gallery list
function renderGallery(apodItems) {
  gallery.innerHTML = '';

  if (!apodItems.length) {
    showGalleryMessage('No space images found for this date range.', '🛰️');
    return;
  }

  // Show newest first for easier browsing
  const sortedItems = [...apodItems].sort((a, b) => b.date.localeCompare(a.date));
  const nineItems = sortedItems.slice(0, GALLERY_ITEM_COUNT);

  nineItems.forEach((item) => {
    const card = createGalleryCard(item);
    gallery.appendChild(card);
  });
}

// Fetch APOD entries between selected start and end date, expanding range if needed to get 9 items
async function fetchApodByDateRange(startDate, endDate) {
  const requestWithKey = async (apiKey, rangeStart, rangeEnd) => {
    const baseParams = {
      start_date: rangeStart,
      end_date: rangeEnd,
      thumbs: 'true'
    };

    const params = new URLSearchParams({
      api_key: apiKey,
      ...baseParams
    });

    const response = await fetch(`${APOD_URL}?${params.toString()}`);
    const data = await response.json();

    return { response, data };
  };

  let currentStart = new Date(startDate);
  let currentEnd = new Date(endDate);
  let allItems = [];
  let attempts = 0;
  const maxAttempts = 3; // Try expanding up to 3 times

  while (allItems.length < GALLERY_ITEM_COUNT && attempts < maxAttempts) {
    const rangeStart = formatDate(currentStart);
    const rangeEnd = formatDate(currentEnd);

    let { response, data } = await requestWithKey(API_KEY, rangeStart, rangeEnd);

    // If custom key fails, retry with NASA demo key so students can still use the app
    const invalidApiKey = data?.error?.code === 'API_KEY_INVALID' || data?.error?.message?.includes('api_key');
    if (!response.ok && invalidApiKey) {
      ({ response, data } = await requestWithKey(FALLBACK_API_KEY, rangeStart, rangeEnd));
    }

    if (!response.ok) {
      const errorMessage = data?.error?.message || 'Unable to load NASA images right now.';
      throw new Error(errorMessage);
    }

    allItems = normalizeApodItems(data);

    // If we have enough items, return them
    if (allItems.length >= GALLERY_ITEM_COUNT) {
      return allItems;
    }

    // If not, expand the date range and try again
    currentStart.setDate(currentStart.getDate() - 5);
    currentEnd.setDate(currentEnd.getDate() + 5);
    attempts++;
  }

  return allItems;
}

// Handle user click: validate dates, fetch data, render results
getImagesButton.addEventListener('click', async () => {
  const selectedStartDate = startInput.value;
  const selectedEndDate = endInput.value;

  if (!selectedStartDate || !selectedEndDate) {
    showGalleryMessage('Please choose both a start date and end date.', '⚠️');
    return;
  }

  if (selectedStartDate > selectedEndDate) {
    showGalleryMessage('Start date must be before or equal to end date.', '⚠️');
    return;
  }

  // Always fetch exactly 9 consecutive APOD days from the selected start date
  const { startDate, endDate } = buildNineDayRange(selectedStartDate);
  startInput.value = startDate;
  endInput.value = endDate;

  try {
    getImagesButton.disabled = true;
    showGalleryMessage('Loading space images from NASA...', '🚀');

    const apodItems = await fetchApodByDateRange(startDate, endDate);
    renderGallery(apodItems);
  } catch (error) {
    showGalleryMessage(error.message, '❌');
  } finally {
    getImagesButton.disabled = false;
  }
});

closeModalBtn.addEventListener('click', closeModal);

apodModal.addEventListener('click', (event) => {
  if (event.target === apodModal) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && apodModal.classList.contains('is-open')) {
    closeModal();
  }
});
