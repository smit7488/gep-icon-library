let currentConfig = null;
    let spriteText = '';
    let observer = null;
    let debounceTimer;

    // 1. CALCULATE DYNAMIC BASE PATH
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);

    function formatColorLabel(cls) {
    // Remove 'icon-' prefix
    let label = cls.replace('icon-', '');
    
    // Handle tint variations (t1, t2, t3, t4)
    const tintMatch = label.match(/-t(\d)$/);
    if (tintMatch) {
        label = label.replace(/-t\d$/, '');
        const tintNumber = tintMatch[1];
        
        // Capitalize each word
        label = label.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        return `${label} Tint ${tintNumber}`;
    }
    
    // For non-tint colors, just capitalize
    return label.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}


    // --- SYSTEM LOGIC ---
    async function loadConfig() {
        const configFile = document.getElementById('config-file').value;
        try {
            const response = await fetch(configFile);
            currentConfig = await response.json();

            if (currentConfig.spriteUrl.startsWith('.')) {
                currentConfig.spriteUrl = currentConfig.spriteUrl.replace(/^\./, baseUrl).replace(/\/+/g, '/').replace(':/', '://');
            }
            if (currentConfig.spriteFile.startsWith('.')) {
                currentConfig.spriteFile = currentConfig.spriteFile.replace(/^\./, baseUrl).replace(/\/+/g, '/').replace(':/', '://');
            }
            
            document.getElementById('sprite-info').innerHTML = `
              
                Sprite URL: <a href="${currentConfig.spriteUrl}">${currentConfig.spriteUrl}</a>
            `;

            await loadSprite();
            setupFilters();
            renderIcons();

            const masterCss = document.getElementById('master-css-code');
            if (masterCss) {
    masterCss.className = 'language-css';
    hljs.highlightElement(masterCss);
}
            
        } catch (e) { console.error("Config load failed", e); }
    }

    async function loadSprite() {
        const response = await fetch(currentConfig.spriteFile);
        spriteText = await response.text();
        document.getElementById('sprite-container').innerHTML = spriteText;
    }

    function setupFilters() {
        const types = new Set();
        const categories = new Set();
        currentConfig.icons.forEach(i => { if(i.type) types.add(i.type); if(i.category) categories.add(i.category); });
        const tSel = document.getElementById('type-filter');
        const cSel = document.getElementById('category-filter');
        types.forEach(t => {
  const cap = t.charAt(0).toUpperCase() + t.slice(1);
  tSel.innerHTML += `<option value="${t}">${cap}</option>`;
});

        categories.forEach(c => cSel.innerHTML += `<option value="${c}">${c}</option>`);
        document.getElementById('filter-container').style.display = 'flex';
    }


// --- PAGINATION STATE ---
let PAGE_SIZE = 20; // Changed from const to let
let itemsToShow = 20;
let filteredIconsGlobal = [];


function updatePageSize() {
    const selector = document.getElementById('page-size-filter');
    PAGE_SIZE = parseInt(selector.value);
    
    // Reset pagination to the new batch size
    itemsToShow = PAGE_SIZE;
    
    // Re-render the current filtered set with the new size
    renderIcons(true);
}

// Update loadConfig to initialize the global list
async function loadConfig() {
    const configFile = document.getElementById('config-file').value;
    try {
        const response = await fetch(configFile);
        currentConfig = await response.json();

        // Fix dynamic paths
        if (currentConfig.spriteUrl.startsWith('.')) {
            currentConfig.spriteUrl = currentConfig.spriteUrl.replace(/^\./, baseUrl).replace(/\/+/g, '/').replace(':/', '://');
        }
        if (currentConfig.spriteFile.startsWith('.')) {
            currentConfig.spriteFile = currentConfig.spriteFile.replace(/^\./, baseUrl).replace(/\/+/g, '/').replace(':/', '://');
        }
        
        document.getElementById('sprite-info').innerHTML = `Sprite URL: <a href="${currentConfig.spriteUrl}">${currentConfig.spriteUrl}</a>`;

        // INITIALIZE GLOBAL LIST
        filteredIconsGlobal = currentConfig.icons;

        await loadSprite();
        setupFilters();
        renderIcons(true); // Initial render

        const masterCss = document.getElementById('master-css-code');
        if (masterCss) {
            masterCss.className = 'language-css';
            hljs.highlightElement(masterCss);
        }
        
    } catch (e) { console.error("Config load failed", e); }
}

function filterIcons() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const q = document.getElementById('search-input').value.toLowerCase();
        const t = document.getElementById('type-filter').value;
        const c = document.getElementById('category-filter').value;
        
        filteredIconsGlobal = currentConfig.icons.filter(i => 
            i.id.toLowerCase().includes(q) && (t === 'all' || i.type === t) && (c === 'all' || i.category === c)
        );

        // --- NO RESULTS LOGIC ---
        const noResults = document.getElementById('no-results');
        const bgSection = document.getElementById('background-section');
        const grid = document.getElementById('grid');
        const loadMoreBtn = document.getElementById('load-more-btn');

        if (filteredIconsGlobal.length === 0) {
            noResults.style.display = 'block';
            bgSection.style.display = 'none';
            grid.style.display = 'none';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        } else {
            noResults.style.display = 'none';
            grid.style.display = 'grid'; // Or 'flex' depending on your CSS
            // background-section display is handled inside renderIcons()
            itemsToShow = PAGE_SIZE;
            renderIcons(true);
        }
    }, 250);
}

// Helper to clear everything
function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('type-filter').value = 'all';
    document.getElementById('category-filter').value = 'all';
    filterIcons();
}

function handleLoadMore() {
    const btn = document.getElementById('load-more-btn');
    const originalText = btn.innerHTML;
    
    // Quick visual feedback
    btn.innerHTML = "Loading...";
    btn.style.opacity = "0.7";
    btn.style.pointerEvents = "none";

    // Small timeout to allow the browser to breathe before rendering
    setTimeout(() => {
        itemsToShow += PAGE_SIZE;
        renderIcons(false);
        
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
        // updateLoadMoreButton() will handle the text reset via renderIcons()
    }, 100);
}

function renderIcons(resetGrid = true) {
    const grid = document.getElementById('grid');
    const bgSection = document.getElementById('background-section');
    const bgList = document.getElementById('background-list');
    
    if (resetGrid) {
        grid.innerHTML = '';
        bgList.innerHTML = '';
        bgSection.style.display = 'none';
    }

    const start = resetGrid ? 0 : (itemsToShow - PAGE_SIZE);
    const batch = filteredIconsGlobal.slice(start, itemsToShow);

    batch.forEach((i, index) => {
        const card = document.createElement('div');
        const safeId = i.id.replace(/[^a-zA-Z0-9-_]/g, '_');
        card.dataset.id = i.id;
        card.id = `card-${safeId}`;

        // 1. Add the animation class
        card.classList.add('animate-in');
        
        // 2. Add staggered delay (e.g., 30ms per item)
        // This makes the 20 items "cascade" in
        card.style.animationDelay = `${index * 30}ms`;

        if (i.type === 'background') {
            bgSection.style.display = 'block';
            card.className += ' card-wide is-loading';
            bgList.appendChild(card);
        } else {
            card.className += ' card is-loading';
            grid.appendChild(card);
        }

        card.innerHTML = `<div class="preview-area"></div>`;
        loadActualContent(card, i);
    });

    updateLoadMoreButton();
}

function updateLoadMoreButton() {
    let btn = document.getElementById('load-more-btn');
    const remaining = filteredIconsGlobal.length - itemsToShow;
    const grid = document.getElementById('grid');

    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'load-more-btn';
        btn.className = 'load-more-btn';
        btn.onclick = handleLoadMore;
        // Place it after the grid
        grid.parentNode.insertBefore(btn, grid.nextSibling);
    }

    if (remaining > 0) {
        btn.style.display = 'block';
        btn.innerHTML = `Load More (${remaining} remaining)`;
    } else {
        btn.style.display = 'none';
    }
}
function loadActualContent(card, item) {
    const safeId = item.id.replace(/[^a-zA-Z0-9-_]/g, '_');
    const isMask = item.type === 'background';
    const typeClass = item.type ? item.type.toLowerCase() : 'general';
    const typeDisplay = item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'General';
    
    // Store item data on card for callbacks
    card.dataset.id = item.id;
    card.dataset.currentColor = 'icon-blue';
    card.dataset.currentHex = '#0072BC';
    if (item.path) card.dataset.path = item.path;
    
    if (isMask) {
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <div>
                    <span class="label" style="font-size: 1.2rem;">${item.id}</span>
                    <div class="type-badge background">Background Wireblock</div>
                </div>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <div style="width: 200px;">
                        <label style="font-size: 11px; font-weight: bold; color: #002F6E; display: block; margin-bottom: 4px;">WIREBLOCK COLOR</label>
                        ${createColorPicker(safeId, 'wireblock', 'icon-blue', 'updateMask')}
                    </div>
                    <div style="width: 200px;">
                        <label style="font-size: 11px; font-weight: bold; color: #002F6E; display: block; margin-bottom: 4px;">PREVIEW BG COLOR</label>
                        ${createColorPicker(safeId, 'background', 'icon-blue-t1', 'updateMaskBackground')}
                    </div>
                </div>
            </div>

            <div id="preview-wrapper-${safeId}" style="background-color: #F5F9FC; border-radius: 8px; padding: 0;">
                <div class="preview-area-wide" id="preview-${safeId}" 
                     style="-webkit-mask: url('https://assets.henryschein.com/${item.id}.svg') no-repeat center; 
                            mask: url('https://assets.henryschein.com/${item.id}.svg') no-repeat center; 
                            mask-size: cover; 
                            -webkit-mask-size: cover; 
                            background-color: #0072BC;">
                </div>
            </div>
            
            <div class="code-block">
                <button class="copy-btn" onclick="copyToClipboard('code-${safeId}', this)">
    <svg class="checkmark-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
    <span class="btn-text">Copy CSS</span>
</button>
                <code id="code-${safeId}"></code>
            </div>
            <button class="download-btn" style="max-width: 200px;" onclick="downloadMaskSVG('${item.id}', '${item.path}')">Download Source SVG</button>
        `;
        card.classList.remove('is-loading');
        // Re-store the data after innerHTML wipe
        card.dataset.id = item.id;
        card.dataset.path = item.path;
        card.dataset.currentColor = 'icon-blue';
        card.dataset.currentHex = '#0072BC';
        updateMask(item.id, 'icon-blue', '#0072BC', item.path);
    }
    else {
        card.innerHTML = `
            <span class="label">${item.id}</span>
            <div class="type-badge-wrapper"><div class="type-badge ${typeClass}">${typeDisplay}</div></div>
            <div class="preview-area" id="preview-${safeId}" style="color: #0072BC;">
                <svg><use href="${currentConfig.spriteUrl}#${item.id}"></use></svg>
            </div>
            
            ${createColorPicker(safeId, 'icon', 'icon-blue', 'updateIcon')}

            <div class="button-group" style="display: flex; gap: 4px; margin-top: 10px;">
                <button class="download-btn" onclick="downloadSVG('${item.id}', '${safeId}')">SVG</button>
                
                <div class="png-download-container" style="display: flex; flex: 1;">
                    <select id="size-${safeId}" style="border-radius: 4px 0 0 4px; border-right: none; padding: 4px; flex: 1;">
                        <option value="1024">1024</option>
                        <option value="512" selected>512</option>
                        <option value="256">256</option>
                        <option value="128">128</option>
                        <option value="64">64</option>
                    </select>
                    <button class="download-btn" 
                            style="background:#474F50; border-radius: 0 4px 4px 0; padding: 4px 8px; flex: 1;" 
                            onclick="downloadPNG('${item.id}', '${safeId}')">
                        PNG
                    </button>
                </div>
            </div>

            <div class="code-block">
                <button class="copy-btn" onclick="copyToClipboard('code-${safeId}', this)">
    <svg class="checkmark-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
    <span class="btn-text">Copy</span>
</button>
                <code id="code-${safeId}"></code>
            </div>
        `;
        card.classList.remove('is-loading');
        // Re-store the data after innerHTML wipe
        card.dataset.id = item.id;
        card.dataset.currentColor = 'icon-blue';
        card.dataset.currentHex = '#0072BC';
        updateIcon(item.id, 'icon-blue', '#0072BC');
    }
}

// Replace your buildColorOptions usage with this new function:

function createColorPicker(safeId, type, defaultColor = 'icon-blue', onChangeCallback) {
    const pickerId = `color-picker-${type}-${safeId}`;
    const defaultColorData = findColorData(defaultColor);
    
    return `
        <div class="color-picker-container">
            <button type="button" class="color-picker-button" onclick="toggleColorPicker('${pickerId}')">
                <span class="color-swatch" style="background-color: ${defaultColorData.hex};"></span>
                <span>${formatColorLabel(defaultColor)}</span>
                <span style="margin-left: auto;">▼</span>
            </button>
            <div id="${pickerId}" class="color-dropdown">
                ${buildColorGrid(safeId, type, defaultColor, onChangeCallback)}
            </div>
        </div>
    `;
}

function findColorData(colorClass) {
    for (const [group, colors] of Object.entries(currentConfig.colors)) {
        if (colors[colorClass]) {
            return { class: colorClass, hex: colors[colorClass], group };
        }
    }
    return { class: 'icon-blue', hex: '#0072BC', group: 'Primary Blues' };
}

function buildColorGrid(safeId, type, selectedColor, onChangeCallback) {
    let html = '';
    for (const [group, colors] of Object.entries(currentConfig.colors)) {
        html += `<div class="color-group">`;
        html += `<div class="color-group-title">${group}</div>`;
        html += `<div class="color-grid">`;
        
        for (const [cls, hex] of Object.entries(colors)) {
            const label = formatColorLabel(cls);
            const isSelected = cls === selectedColor ? 'selected' : '';
            html += `
                <div class="color-option ${isSelected}" 
                     onclick="selectColor('${safeId}', '${type}', '${cls}', '${hex}', '${onChangeCallback}')">
                    <div class="color-option-swatch" style="background-color: ${hex};"></div>
                    <div class="color-option-label">${label}</div>
                </div>
            `;
        }
        
        html += `</div></div>`;
    }
    return html;
}

function toggleColorPicker(pickerId) {
    // Close all other pickers
    document.querySelectorAll('.color-dropdown').forEach(dropdown => {
        if (dropdown.id !== pickerId) {
            dropdown.classList.remove('open');
        }
    });
    
    const picker = document.getElementById(pickerId);
    picker.classList.toggle('open');
}

function selectColor(safeId, type, colorClass, hex, callbackName) {
    const pickerId = `color-picker-${type}-${safeId}`;
    const picker = document.getElementById(pickerId);
    const button = picker.previousElementSibling;
    const card = document.getElementById(`card-${safeId}`);
    
    // Update button display
    const swatch = button.querySelector('.color-swatch');
    const label = button.querySelector('span:nth-child(2)');
    swatch.style.backgroundColor = hex;
    label.textContent = formatColorLabel(colorClass);
    
    // Update selected state in grid
    picker.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    event.target.closest('.color-option').classList.add('selected');
    
    // Close picker
    picker.classList.remove('open');
    
    // Store current color in card dataset for downloads
    if (type === 'icon' || type === 'wireblock') {
        card.dataset.currentColor = colorClass;
        card.dataset.currentHex = hex;
    }
    
    // Execute callback
    if (callbackName === 'updateMask') {
        updateMask(card.dataset.id, colorClass, hex, card.dataset.path);
    } else if (callbackName === 'updateMaskBackground') {
        updateMaskBackground(safeId, `${colorClass}|${hex}`);
    } else if (callbackName === 'updateIcon') {
        updateIcon(card.dataset.id, colorClass, hex);
    }
}

// Close pickers when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.color-picker-container')) {
        document.querySelectorAll('.color-dropdown').forEach(dropdown => {
            dropdown.classList.remove('open');
        });
    }
});
// Add this new function to update the background wrapper color
function updateMaskBackground(safeId, colorValue) {
    const [colorClass, hex] = colorValue.split('|');
    const wrapper = document.getElementById(`preview-wrapper-${safeId}`);
    if (wrapper) {
        wrapper.style.backgroundColor = hex;
    }
}


function updateIcon(id, cls, hex) {
    const safeId = id.replace(/[^a-zA-Z0-9-_]/g, '_');
    const preview = document.getElementById(`preview-${safeId}`);
    if (preview) preview.style.color = hex;
    
    const codeElement = document.getElementById(`code-${safeId}`);
    if (codeElement) {
        const raw = `<svg class="icon ${cls}">\n  <use href="${currentConfig.spriteUrl}#${id}"></use>\n</svg>`;
        
        // Remove existing highlighting classes before re-highlighting
        codeElement.className = '';
        codeElement.removeAttribute('data-highlighted');
        codeElement.textContent = raw; 
        codeElement.className = 'language-xml';
        
        // Re-apply syntax highlighting
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(codeElement);
        }
    }
}
    function updateMask(id, colorClass, hex, path) {
    const safeId = id.replace(/[^a-zA-Z0-9-_]/g, '_');
    const preview = document.getElementById(`preview-${safeId}`);
    const codeElement = document.getElementById(`code-${safeId}`);

    // Update the visual preview area
    if (preview) {
        preview.style.backgroundColor = hex;
    }

    // Update the code block with the correct CSS
    if (codeElement) {
        const cssCode = `.full-background {position: relative !important;overflow: hidden!important;z-index: 1!important;}     
.full-background::before {content: "" !important;position: absolute !important;top: 0!important;left: 0!important;width: 100%!important;height: 100%!important;background-color: ${hex}; /* ${colorClass} */opacity: 1; /* Adjust Transparency */-webkit-mask-image: url('https://assets.henryschein.com/${safeId}.svg')!important;mask-image: url('https://assets.henryschein.com/${safeId}.svg')!important;-webkit-mask-repeat: no-repeat!important;mask-repeat: no-repeat!important; -webkit-mask-position: center right!important; mask-position: center right!important; -webkit-mask-size: cover!important; mask-size: cover!important; z-index: -1!important;pointer-events: none!important;}
.full-background > .maincontent {position: relative;z-index: 2;}`;
        
        // Remove existing highlighting before re-highlighting
        codeElement.className = '';
        codeElement.removeAttribute('data-highlighted');
        codeElement.textContent = cssCode;
        codeElement.className = 'language-css';
        
        // Re-apply syntax highlighting
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(codeElement);
        }
    }
}

function copyToClipboard(id, btn) {
    const el = document.getElementById(id);
    const textToCopy = el.innerText;

    // 1. Try the modern Navigator API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            handleCopySuccess(btn);
        }).catch(err => {
            console.error('Modern copy failed, trying fallback', err);
            fallbackCopy(textToCopy, btn);
        });
    } else {
        // 2. Fallback for non-HTTPS or older browsers
        fallbackCopy(textToCopy, btn);
    }
}

// Fallback using a hidden textarea
function fallbackCopy(text, btn) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Ensure textarea is not visible but part of the DOM
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            handleCopySuccess(btn);
        } else {
            console.error('Fallback copy failed');
        }
    } catch (err) {
        console.error('Fallback copy error', err);
    }

    document.body.removeChild(textArea);
}

// Helper to handle the button UI change
function handleCopySuccess(btn) {
    const oldText = btn.innerText;
    btn.innerText = "Copied!";
    btn.classList.add('copied'); // Optional: add a class for CSS styling
    
    setTimeout(() => {
        btn.innerText = oldText;
        btn.classList.remove('copied');
    }, 1500);
}

    function downloadSVG(iconId, safeId) {
    if (!spriteText) return;
    
    // Get color from card dataset (FIXED - no longer uses select)
    const card = document.getElementById(`card-${safeId}`);
    const colorClass = card.dataset.currentColor || 'icon-blue';
    const colorHex = card.dataset.currentHex || '#0072BC';
    
    const match = spriteText.match(new RegExp(`<symbol[^>]*id="${iconId}"[^>]*>(.*?)</symbol>`, 's'));
    if (!match) return;

    const viewBox = match[0].match(/viewBox="([^"]*)"/)?.[1] || '0 0 110 110';
    let content = match[1]
        .replace(/fill:\s*currentColor/g, `fill:${colorHex}`)
        .replace(/stroke:\s*currentColor/g, `stroke:${colorHex}`)
        .replace(/fill="currentColor"/g, `fill="${colorHex}"`)
        .replace(/stroke="currentColor"/g, `stroke="${colorHex}"`);

    const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ns0="http://www.w3.org/2000/svg" xmlns:ns1="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="110" height="110">
${content}
</svg>`;

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${iconId}_${colorClass}.svg`;
    a.click();
    URL.revokeObjectURL(url);
}
    // Ensure you have a way to download the raw SVG even if it's not in the sprite
function downloadMaskSVG(id, path) {
    fetch(path)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${id}.svg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        });
}


    function downloadPNG(iconId, safeId) {
    // Get color from card dataset (FIXED - no longer uses select)
    const card = document.getElementById(`card-${safeId}`);
    const colorClass = card.dataset.currentColor || 'icon-blue';
    const colorHex = card.dataset.currentHex || '#0072BC';

    // Get the size from the size select
    const sizeSelect = document.getElementById(`size-${safeId}`);
    const size = parseInt(sizeSelect.value) || 512;

    const match = spriteText.match(new RegExp(`<symbol[^>]*id="${iconId}"[^>]*>(.*?)</symbol>`, 's'));
    if (!match) return;

    const viewBox = match[0].match(/viewBox="([^"]*)"/)?.[1] || '0 0 110 110';
    let cleanContent = match[1]
        .replace(/<(\/?)ns[0-9]+:/g, '<$1')
        .replace(/\s+ns[0-9]+:[a-z-]+="[^"]*"/gi, '')
        .replace(/sketch:type="[^"]*"/gi, '')
        .replace(/currentColor/g, colorHex);

    const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}">${cleanContent}</svg>`;
    
    const canvas = document.createElement('canvas');
    canvas.width = size; 
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function() {
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = `${iconId}_${size}px_${colorClass}.png`;
        a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgHeader)));
}

    window.addEventListener('DOMContentLoaded', loadConfig);

    const backToTopButton = document.querySelector("#backToTop");

window.addEventListener("scroll", () => {
  if (window.pageYOffset > 300) {
    backToTopButton.classList.add("show");
  } else {
    backToTopButton.classList.remove("show");
  }
});

backToTopButton.addEventListener("click", () => {
  window.scrollTo(0, 0);
});