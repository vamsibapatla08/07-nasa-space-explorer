// Find page elements we need
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');
const apodModal = document.getElementById('apodModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');

// NASA APOD endpoint and public demo key
const APOD_URL = 'https://api.nasa.gov/planetary/apod';
const API_KEY = 'idbKGPLpQCKzgo3O3ROXP1rgezft5NtlcG4ndUds';

// Set up the date inputs (from dateRange.js)
setupDateInputs(startInput, endInput);

// Open modal with details for the selected image
function openModal(apodItem) {
  modalImage.src = apodItem.imageUrl;
  modalImage.alt = apodItem.title;
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

  const image = document.createElement('img');
  image.src = apodItem.imageUrl;
  image.alt = apodItem.title || 'NASA Astronomy Picture of the Day';
  image.loading = 'lazy';
  card.appendChild(image);

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
    // Only keep APOD entries that are actual images
    .filter((item) => item.media_type === 'image')
    .map((item) => {
      return {
        imageUrl: item.url,
        title: item.title,
        date: item.date,
        explanation: item.explanation
      };
    })
    // Keep only complete entries so the gallery always has usable content
    .filter((item) => item.imageUrl && item.title && item.date && item.explanation);
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
