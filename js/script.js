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
  'There are more stars in the universe than grains of sand on all of Earth\'s beaches.'
];

// NASA APOD endpoint and public demo key
const APOD_URL = 'https://api.nasa.gov/planetary/apod';
const API_KEY = 'idbKGPLpQCKzgo3O3ROXP1rgezft5NtlcG4ndUds';

// Set up the date inputs (from dateRange.js)
setupDateInputs(startInput, endInput);

// Pick one random fact and display it above the gallery
function showRandomSpaceFact() {
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);
  factText.textContent = spaceFacts[randomIndex];
}

showRandomSpaceFact();

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
    modalImage.src = apodItem.imageUrl;
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

  if (apodItem.mediaType === 'video') {
    const video = document.createElement('iframe');
    video.src = apodItem.embedUrl;
    video.title = apodItem.title || 'NASA Astronomy Picture of the Day video';
    //video.loading = 'lazy';
    video.setAttribute('allowfullscreen', 'true');
    card.appendChild(video);
    
  } else {
    const image = document.createElement('img');
    image.src = apodItem.imageUrl;
    image.alt = apodItem.title || 'NASA Astronomy Picture of the Day';
    image.loading = 'lazy';
    card.appendChild(image);
  }

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

      return {
        mediaType,
        imageUrl: mediaType === 'image' ? item.url : item.thumbnail_url || '',
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

  sortedItems.forEach((item) => {
    const card = createGalleryCard(item);
    gallery.appendChild(card);
  });
}

// Fetch APOD entries between selected start and end date
async function fetchApodByDateRange(startDate, endDate) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    start_date: startDate,
    end_date: endDate,
    thumbs: 'true'
  });

  const response = await fetch(`${APOD_URL}?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data?.error?.message || 'Unable to load NASA images right now.';
    throw new Error(errorMessage);
  }

  return normalizeApodItems(data);
}

// Handle user click: validate dates, fetch data, render results
getImagesButton.addEventListener('click', async () => {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    showGalleryMessage('Please choose both a start date and end date.', '⚠️');
    return;
  }

  if (startDate > endDate) {
    showGalleryMessage('Start date must be before or equal to end date.', '⚠️');
    return;
  }

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
