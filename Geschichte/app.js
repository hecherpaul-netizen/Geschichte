// =========================================================
// NACHRICHTEN (aus localStorage laden)
// =========================================================
let messages = [];

function loadMessagesFromStorage() {
    const stored = localStorage.getItem('isla_leones_messages');
    if (stored) {
        try {
            messages = JSON.parse(stored);
        } catch (e) {
            messages = [];
        }
    }
    console.log('✓ Messages geladen:', messages.length);
}

function saveMessagesToStorage() {
    localStorage.setItem('isla_leones_messages', JSON.stringify(messages));
    updateAverageRating();
    console.log('✓ Messages gespeichert');
}

function updateAverageRating() {
    if (messages.length === 0) {
        document.getElementById('avg-rating').textContent = '0.0';
        return;
    }

    const sum = messages.reduce((total, msg) => total + msg.sterne, 0);
    const average = (sum / messages.length).toFixed(1);
    document.getElementById('avg-rating').textContent = average;
    console.log('⭐ Durchschnitt:', average);
}

// =========================================================
// STATE
// =========================================================
let selectedRating = 0;
const ratedKey = 'isla_leones_rated';
let db = null;
let firebaseReady = false;

// =========================================================
// DOM ELEMENTS
// =========================================================
const starsContainer = document.getElementById('stars');
const messageBox = document.getElementById('message-box');
const messageTextarea = document.getElementById('message-textarea');
const submitBtn = document.getElementById('submit-btn');
const ratingForm = document.getElementById('rating-form');
const thankYouDiv = document.getElementById('thank-you');
const loadingDiv = document.getElementById('loading');
const wallDiv = document.getElementById('wall');
const charCountSpan = document.getElementById('char-count');

console.log('✓ App geladen');

// =========================================================
// STAR SELECTION
// =========================================================
function initStars() {
    const stars = document.querySelectorAll('.star');
    console.log('Sterne init:', stars.length);

    stars.forEach((star) => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            updateStarDisplay(selectedRating);
            showMessageBox();
        });

        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.dataset.rating);
            updateStarDisplay(rating, true);
        });
    });

    starsContainer.addEventListener('mouseleave', () => {
        updateStarDisplay(selectedRating);
    });
}

function updateStarDisplay(rating, isHover = false) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star) => {
        const starRating = parseInt(star.dataset.rating);
        if (starRating <= rating) {
            if (isHover) {
                star.classList.add('hovered');
                star.classList.remove('selected');
            } else {
                star.classList.add('selected');
                star.classList.remove('hovered');
            }
        } else {
            star.classList.remove('hovered', 'selected');
        }
    });
}

function showMessageBox() {
    messageBox.style.display = 'block';
    messageTextarea.focus();
}

// =========================================================
// CHARACTER COUNT
// =========================================================
if (messageTextarea) {
    messageTextarea.addEventListener('input', () => {
        const count = messageTextarea.value.length;
        charCountSpan.textContent = `${count}/50`;
    });
}

// =========================================================
// SUBMIT BUTTON
// =========================================================
if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
        if (selectedRating === 0) {
            alert('Bitte wähle eine Sternbewertung');
            return;
        }

        const message = messageTextarea.value.trim();

        // Neue Bewertung erstellen
        const newMessage = {
            sterne: selectedRating,
            nachricht: message || '(Keine Nachricht)',
            zeitstempel: new Date().toISOString()
        };

        // Zu messages hinzufügen und speichern
        messages.unshift(newMessage);
        saveMessagesToStorage();

        // Set "already rated" flag
        localStorage.setItem(ratedKey, 'true');

        ratingForm.style.display = 'none';
        thankYouDiv.style.display = 'block';

        // Wall aktualisieren
        loadWall();

        console.log('✓ Bewertung gespeichert!');
    });
}

// =========================================================
// WALL ANZEIGEN
// =========================================================
function loadWall() {
    wallDiv.innerHTML = '';

    if (messages.length === 0) {
        wallDiv.innerHTML = '<div class="empty-state"><p>Noch keine Bewertungen. Sei der/die Erste!</p></div>';
        return;
    }

    messages.forEach((data) => {
        const card = createCard(data);
        wallDiv.appendChild(card);
    });
}

function createCard(data) {
    const card = document.createElement('div');
    card.className = 'card';

    const starsHtml = Array.from({ length: 5 }, (_, i) => {
        const filled = i < data.sterne ? 'star-filled' : 'star-empty';
        return `<span class="${filled}">★</span>`;
    }).join('');

    // Convert ISO string to Date if needed
    const timestamp = typeof data.zeitstempel === 'string'
        ? new Date(data.zeitstempel)
        : data.zeitstempel;

    const relativeTime = getRelativeTime(timestamp);
    const message = data.nachricht || '(Keine Nachricht)';

    card.innerHTML = `
        <div class="card-stars">${starsHtml}</div>
        <div class="card-message">${escapeHtml(message)}</div>
        <div class="card-timestamp">${relativeTime}</div>
    `;

    return card;
}

function getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Minute${diffMins > 1 ? 'n' : ''}`;
    if (diffHours < 24) return `vor ${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`;
    if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
    return date.toLocaleDateString('de-DE');
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, (char) => map[char]);
}

// =========================================================
// CHECK IF ALREADY RATED
// =========================================================
function checkIfAlreadyRated() {
    if (localStorage.getItem(ratedKey) === 'true') {
        ratingForm.style.display = 'none';
        thankYouDiv.style.display = 'block';
    }
}

// =========================================================
// ADMIN PANEL
// =========================================================
const ADMIN_CODE_STATS = '515';
const ADMIN_CODE_DELETE = '313';
const ADMIN_CODE_RESET = '414';
let adminCurrentMode = null;

const adminBtn = document.getElementById('admin-btn');
const adminModal = document.getElementById('admin-modal');
const adminClose = document.getElementById('admin-close');
const adminLogin = document.getElementById('admin-login');
const adminPanel = document.getElementById('admin-panel');
const adminStatsPanel = document.getElementById('admin-stats-panel');
const adminCodeInput = document.getElementById('admin-code');
const adminSubmit = document.getElementById('admin-submit');
const adminCommentsList = document.getElementById('admin-comments-list');
const adminOptionDelete = document.getElementById('admin-option-delete');
const adminOptionReset = document.getElementById('admin-option-reset');
const adminOptionStats = document.getElementById('admin-option-stats');
const adminCodeSection = document.getElementById('admin-code-section');

adminBtn.addEventListener('click', () => {
    adminModal.style.display = 'flex';
});

adminClose.addEventListener('click', () => {
    adminModal.style.display = 'none';
    adminLogin.style.display = 'block';
    adminPanel.style.display = 'none';
    adminStatsPanel.style.display = 'none';
    adminCodeSection.style.display = 'none';
    adminCodeInput.value = '';
    adminCurrentMode = null;
});

adminOptionDelete.addEventListener('click', () => {
    adminCurrentMode = 'delete';
    adminCodeSection.style.display = 'block';
    adminCodeInput.placeholder = 'Code für Löschen eingeben...';
    adminCodeInput.focus();
});

adminOptionStats.addEventListener('click', () => {
    adminCurrentMode = 'stats';
    adminCodeSection.style.display = 'block';
    adminCodeInput.placeholder = 'Code für Statistiken eingeben...';
    adminCodeInput.focus();
});

adminOptionReset.addEventListener('click', () => {
    adminCurrentMode = 'reset';
    adminCodeSection.style.display = 'block';
    adminCodeInput.placeholder = 'Code für Reset eingeben...';
    adminCodeInput.focus();
});

adminSubmit.addEventListener('click', () => {
    const code = adminCodeInput.value;

    if (adminCurrentMode === 'stats' && code === ADMIN_CODE_STATS) {
        adminLogin.style.display = 'none';
        adminStatsPanel.style.display = 'block';
        loadStatistics();
    } else if (adminCurrentMode === 'delete' && code === ADMIN_CODE_DELETE) {
        adminLogin.style.display = 'none';
        adminPanel.style.display = 'block';
        loadAdminComments();
    } else if (adminCurrentMode === 'reset' && code === ADMIN_CODE_RESET) {
        localStorage.removeItem(ratedKey);
        ratingForm.style.display = 'block';
        thankYouDiv.style.display = 'none';
        messageTextarea.value = '';
        selectedRating = 0;
        updateStarDisplay(0);
        adminModal.style.display = 'none';
        adminLogin.style.display = 'block';
        adminCodeSection.style.display = 'none';
        adminCodeInput.value = '';
        adminCurrentMode = null;
        alert('✓ Bewertung wurde zurückgesetzt! Du kannst jetzt erneut bewerten.');
    } else {
        alert('Falscher Code!');
        adminCodeInput.value = '';
    }
});

function loadStatistics() {
    const statsContent = document.getElementById('stats-content');
    statsContent.innerHTML = '';

    if (messages.length === 0) {
        statsContent.innerHTML = '<p style="color: #999; text-align: center;">Noch keine Bewertungen</p>';
        return;
    }

    const total = messages.length;
    const sum = messages.reduce((acc, msg) => acc + msg.sterne, 0);
    const average = (sum / total).toFixed(1);

    // Zähle Sterne
    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    messages.forEach(msg => {
        starCounts[msg.sterne]++;
    });

    // Berechne Prozente
    const starPercentages = {};
    for (let i = 1; i <= 5; i++) {
        starPercentages[i] = Math.round((starCounts[i] / total) * 100);
    }

    // HTML zusammensetzen
    let html = `
        <div class="stat-box">
            <div class="stat-label">Gesamt Bewertungen</div>
            <div class="stat-value">${total}</div>
        </div>

        <div class="stat-box">
            <div class="stat-label">Durchschnittliche Bewertung</div>
            <div class="stat-value">${average} ⭐</div>
        </div>

        <div class="stat-box">
            <div class="stat-label">Verteilung der Bewertungen</div>
    `;

    for (let i = 5; i >= 1; i--) {
        const count = starCounts[i];
        const percent = starPercentages[i];
        html += `
            <div class="stat-bar">
                <div class="stat-bar-label">${i}★</div>
                <div class="stat-bar-fill">
                    <div class="stat-bar-progress" style="width: ${percent}%">
                        ${percent > 5 ? percent + '%' : ''}
                    </div>
                </div>
                <div style="min-width: 40px; text-align: right; color: #666;">${count}</div>
            </div>
        `;
    }

    html += '</div>';
    statsContent.innerHTML = html;

    console.log('📊 Statistiken angezeigt');
}

function loadAdminComments() {
    adminCommentsList.innerHTML = '';

    if (messages.length === 0) {
        adminCommentsList.innerHTML = '<p style="color: #999;">Keine Kommentare zum löschen</p>';
        return;
    }

    messages.forEach((msg, index) => {
        const item = document.createElement('div');
        item.className = 'admin-comment-item';

        const text = document.createElement('div');
        text.className = 'admin-comment-text';
        text.innerHTML = `<strong>${msg.sterne}★</strong> ${escapeHtml(msg.nachricht)}`;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'admin-delete-btn';
        deleteBtn.textContent = 'Löschen';
        deleteBtn.addEventListener('click', () => {
            messages.splice(index, 1);
            saveMessagesToStorage();
            loadWall();
            loadAdminComments();
            console.log('✓ Kommentar gelöscht');
        });

        item.appendChild(text);
        item.appendChild(deleteBtn);
        adminCommentsList.appendChild(item);
    });
}

// =========================================================
// START
// =========================================================
loadMessagesFromStorage();
updateAverageRating();
initStars();
checkIfAlreadyRated();
loadWall();
console.log('✓ App bereit! Bisherige Bewertungen:', messages.length);
