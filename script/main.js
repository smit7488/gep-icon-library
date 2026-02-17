let currentConfig = null;
let spriteText = '';
let observer = null;
let debounceTimer;
let currentTab = 'pictograph'; // Track current tab - default to Pictographs

// 1. CALCULATE DYNAMIC BASE PATH
const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
let iconTagsData = null; // Will store the icon-tags.json data



// Reset settings to defaults
function resetToDefaults(safeId) {
    const card = document.getElementById(`card-${safeId}`);
    
    // Update all inputs and sliders to default values
    document.getElementById(`scale-${safeId}`).value = 150;
    document.getElementById(`scale-input-${safeId}`).value = 150;
    
    document.getElementById(`h-pos-${safeId}`).value = 10;
    document.getElementById(`h-pos-input-${safeId}`).value = 10;
    
    document.getElementById(`v-pos-${safeId}`).value = -25;
    document.getElementById(`v-pos-input-${safeId}`).value = -25;
    
    document.getElementById(`rotation-${safeId}`).value = 0;
    document.getElementById(`rotation-input-${safeId}`).value = 0;
    
    document.getElementById(`opacity-${safeId}`).value = 60;
    document.getElementById(`opacity-input-${safeId}`).value = 60;
    
    document.getElementById(`hide-mobile-${safeId}`).checked = false;
    
    // Reset second wireblock controls
    const showTwoCheckbox = document.getElementById(`show-two-${safeId}`);
    if (showTwoCheckbox) {
        showTwoCheckbox.checked = false;
        const controls = document.getElementById(`second-wireblock-controls-${safeId}`);
        if (controls) controls.style.display = 'none';
    }
    
    const scale2 = document.getElementById(`scale2-${safeId}`);
    if (scale2) {
        scale2.value = 150;
        document.getElementById(`scale2-input-${safeId}`).value = 150;
        document.getElementById(`h-pos2-${safeId}`).value = 50;
        document.getElementById(`h-pos2-input-${safeId}`).value = 50;
        document.getElementById(`v-pos2-${safeId}`).value = -25;
        document.getElementById(`v-pos2-input-${safeId}`).value = -25;
        document.getElementById(`rotation2-${safeId}`).value = 0;
        document.getElementById(`rotation2-input-${safeId}`).value = 0;
        document.getElementById(`opacity2-${safeId}`).value = 60;
        document.getElementById(`opacity2-input-${safeId}`).value = 60;
    }
    
    // Reset colors
    card.dataset.currentColor = 'hs-blue';
    card.dataset.currentHex = '#0072BC';
    
    // Update the mask
    updateMask(card.dataset.id, 'hs-blue', '#0072BC', card.dataset.path);
}

// Increment/Decrement functions
function incrementValue(safeId, controlName, step = 1) {
    const input = document.getElementById(`${controlName}-input-${safeId}`);
    const slider = document.getElementById(`${controlName}-${safeId}`);
    
    let currentValue = parseInt(input.value) || 0;
    let min = parseInt(slider.min);
    let max = parseInt(slider.max);
    
    let newValue = currentValue + step;
    newValue = Math.max(min, Math.min(max, newValue));
    
    input.value = newValue;
    slider.value = newValue;
    
    // Trigger the appropriate update function
    const updateFunctions = {
        'scale': updateMaskScaleFromInput,
        'h-pos': updateMaskPositionFromInput,
        'v-pos': updateMaskPositionFromInput,
        'rotation': updateMaskRotationFromInput,
        'opacity': updateMaskOpacityFromInput
    };
    
    if (updateFunctions[controlName]) {
        updateFunctions[controlName](safeId);
    }
}

function decrementValue(safeId, controlName, step = 1) {
    incrementValue(safeId, controlName, -step);
}

function formatColorLabel(cls) {
    // Remove 'hs-' prefix
    let label = cls.replace('hs-', '');
    
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
    
    // Handle shade variations (s1, s2, s3, s4)
    const shadeMatch = label.match(/-s(\d)$/);
    if (shadeMatch) {
        label = label.replace(/-s\d$/, '');
        const shadeNumber = shadeMatch[1];
        
        // Capitalize each word
        label = label.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        return `${label} Shade ${shadeNumber}`;
    }
    
    // For non-tint/shade colors, just capitalize
    return label.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// *** UPDATED: Load tags and categories from separate icon-tags.json file ***
async function loadIconTags() {
    try {
        const response = await fetch('./dist/icon-tags.json');
        if (response.ok) {
            iconTagsData = await response.json();
            console.log('Loaded icon tags & categories from icon-tags.json');
        } else {
            console.log('No icon-tags.json file found (tags/categories feature optional)');
        }
    } catch (e) {
        console.log('Tags file not available:', e.message);
    }
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
        
        const spriteInfo = document.getElementById('sprite-info');
        if (spriteInfo) {
            spriteInfo.innerHTML = `
              
                Sprite URL: <a href="${currentConfig.spriteUrl}">${currentConfig.spriteUrl}</a>
            `;
        }

        // INITIALIZE GLOBAL LIST
        filteredIconsGlobal = currentConfig.icons;

        await loadSprite();
        
        // *** Load tags & categories from separate file ***
        await loadIconTags();
        
        setupFilters();
        
        // Show tab navigation immediately
        const tabNav = document.getElementById('tab-navigation');
        if (tabNav) {
            tabNav.style.display = 'flex';
        }
        
        // Make sure the correct tab is active on load
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Set pictograph as active
        const pictographBtn = document.querySelector('.tab-btn');
        if (pictographBtn) pictographBtn.classList.add('active');
        
        const pictographTab = document.getElementById('pictograph-tab');
        if (pictographTab) pictographTab.classList.add('active');
        
        // Initial render for the default tab (pictograph)
        filterIcons();

        const masterCss = document.getElementById('master-css-code');
        if (masterCss && typeof hljs !== 'undefined') {
            masterCss.className = 'language-css';
            hljs.highlightElement(masterCss);
        }
        
    } catch (e) { 
        console.error("Config load failed", e);
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.innerHTML = `<div style="color: red; padding: 20px;">Error loading config: ${e.message}</div>`;
        }
    }
}

async function loadSprite() {
    const response = await fetch(currentConfig.spriteFile);
    spriteText = await response.text();
    document.getElementById('sprite-container').innerHTML = spriteText;
}

// *** UPDATED: Build category dropdown from icon-tags.json ***
function setupFilters() {
    const categories = new Set();
    
    // Extract categories from icon-tags.json
    if (iconTagsData) {
        Object.values(iconTagsData).forEach(item => {
            if (item.categories && Array.isArray(item.categories)) {
                item.categories.forEach(cat => categories.add(cat));
            }
        });
    }
    
    const cSel = document.getElementById('category-filter');
    cSel.innerHTML = '<option value="all">All Categories</option>';
    
    // Sort and capitalize categories
    const sortedCategories = Array.from(categories).sort();
    sortedCategories.forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        // Capitalize first letter of each word
        option.textContent = c.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        cSel.appendChild(option);
    });
    
    document.getElementById('filter-container').style.display = 'flex';
}

// --- PAGINATION STATE ---
let PAGE_SIZE = 20;
let itemsToShow = 20;
let filteredIconsGlobal = [];

function updatePageSize() {
    const selector = document.getElementById('page-size-filter');
    const rawValue = selector.value;

    if (rawValue === "all") {
        PAGE_SIZE = filteredIconsGlobal.length;  // show everything
    } else {
        PAGE_SIZE = parseInt(rawValue);
    }

    itemsToShow = PAGE_SIZE;

    renderIcons(true);
}


// *** UPDATED: Filter icons by category AND search in tags ***
function filterIcons() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const q = document.getElementById('search-input').value.toLowerCase();
        const c = document.getElementById('category-filter').value;
        
        filteredIconsGlobal = currentConfig.icons.filter(i => {
            // Filter by current tab type
            if (currentTab === 'ui' && i.type !== 'UI') return false;
            if (currentTab === 'pictograph' && i.type !== 'pictograph') return false;
            if (currentTab === 'wireblock' && i.type !== 'wireblock') return false;
            
            // *** UPDATED: Category filter from icon-tags.json ***
            if (c !== 'all' && iconTagsData && iconTagsData[i.id]) {
                const iconCategories = iconTagsData[i.id].categories || [];
                if (!iconCategories.includes(c)) return false;
            } else if (c !== 'all' && (!iconTagsData || !iconTagsData[i.id])) {
                // If category is selected but icon has no tags data, exclude it
                return false;
            }
            
            // Search in name
            const matchesName = i.id.toLowerCase().includes(q);
            
            // *** UPDATED: Search in tags AND categories from icon-tags.json ***
            let matchesTags = false;
            let matchesCategories = false;
            
            if (iconTagsData && iconTagsData[i.id]) {
                // Search in tags
                const tags = iconTagsData[i.id].tags || [];
                matchesTags = tags.some(tag => 
                    tag.toLowerCase().includes(q)
                );
                
                // Search in categories
                const categories = iconTagsData[i.id].categories || [];
                matchesCategories = categories.some(cat => 
                    cat.toLowerCase().includes(q)
                );
            }
            
            return matchesName || matchesTags || matchesCategories;
        });

        const noResults = document.getElementById('no-results');
        const currentGrid = document.getElementById(`${currentTab}-grid`);

        if (filteredIconsGlobal.length === 0) {
            noResults.style.display = 'block';
            if (currentGrid) currentGrid.style.display = 'none';
            
            const tabContent = currentGrid?.parentElement;
            const loadMoreBtn = tabContent?.querySelector('.load-more-btn');
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        } else {
            noResults.style.display = 'none';
            if (currentGrid) {
                currentGrid.style.display = 'grid';
            }
            itemsToShow = PAGE_SIZE;
            renderIcons(true);
        }
    }, 250);
}
// Helper to clear everything
function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = 'all';
    filterIcons();
}

function handleLoadMore() {
    // Get current grid container
    const currentContainer = document.getElementById(`${currentTab}-grid`);

    if (!currentContainer) return;

    // Get the parent tab content
    const tabContent = currentContainer.parentElement;
    
    // Look for existing button in this tab
    const btn = tabContent.querySelector('.load-more-btn');
    
    if (!btn) return;
    
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
    }, 100);
}

function renderIcons(resetGrid = true) {
    const tabNav = document.getElementById('tab-navigation');
    
    // Show tab navigation
    tabNav.style.display = 'flex';
    
    // Get the current grid container
    const currentGrid = document.getElementById(`${currentTab}-grid`);
    
    if (!currentGrid) return;
    
    // Check if grid already has content (returning to a tab)
    const hasExistingContent = currentGrid.children.length > 0;
    
    if (resetGrid) {
        currentGrid.innerHTML = '';
    }

    const start = resetGrid ? 0 : (itemsToShow - PAGE_SIZE);
    const batch = filteredIconsGlobal.slice(start, itemsToShow);

    batch.forEach((i, index) => {
        const card = document.createElement('div');
        const safeId = i.id.replace(/[^a-zA-Z0-9-_]/g, '_');
        card.dataset.id = i.id;
        card.id = `card-${safeId}`;
        card.className = 'card';
        
        // Only animate on first load, not when returning to tab
        if (hasExistingContent && resetGrid) {
            card.style.animation = 'none';
        }
        
        card.className += ' is-loading';
        
        currentGrid.appendChild(card);
        card.innerHTML = `<div class="preview-area"></div>`;
        loadActualContent(card, i);
    });

    updateLoadMoreButton();
}

function updateLoadMoreButton() {
    const remaining = filteredIconsGlobal.length - itemsToShow;
    
    // Get current grid container
    const currentContainer = document.getElementById(`${currentTab}-grid`);

    if (!currentContainer) return;

    // Get the parent tab content
    const tabContent = currentContainer.parentElement;
    
    // Look for existing button in this tab
    let btn = tabContent.querySelector('.load-more-btn');
    
    if (!btn) {
        btn = document.createElement('button');
        btn.className = 'load-more-btn';
        btn.onclick = handleLoadMore;
        // Append to tab content (after the grid)
        tabContent.appendChild(btn);
    }

    if (remaining > 0) {
        btn.style.display = 'block';
        btn.innerHTML = `Load More (${remaining} remaining)`;
    } else {
        btn.style.display = 'none';
    }
}
function formatBackgroundLabel(id) {
    // Pattern: HS_US_EN_Wireblock_non-scaling-stroke-2_[ACTUAL_NAME]
    // We want to extract just the [ACTUAL_NAME] part
    
    // Use regex to match the prefix pattern and capture everything after it
    const match = id.match(/^HS_US_EN_Wireblock_non-scaling-stroke-\d+_(.+)$/);
    
    if (match && match[1]) {
        return match[1]; // Return the captured group (everything after the prefix)
    }
    
    // Fallback: return the original id if pattern doesn't match
    return id;
}

function loadActualContent(card, item) {
    const safeId = item.id.replace(/[^a-zA-Z0-9-_]/g, '_');
    const isMask = item.type === 'background';
    const typeClass = item.type ? item.type.toLowerCase() : 'general';
    const typeDisplay = item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'General';
    
    // Store item data on card for callbacks
    card.dataset.id = item.id;
    card.dataset.currentColor = 'hs-blue';
    card.dataset.currentHex = '#0072BC';
    if (item.path) card.dataset.path = item.path;
    
    if (isMask) {
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 0px;">
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <div style="width: 200px;">
                        <label style="font-size: 11px; font-weight: bold; color: #002F6E; display: block; margin-bottom: 4px;">WIREBLOCK COLOR</label>
                        ${createColorPicker(safeId, 'wireblock', 'hs-blue', 'updateMask')}
                    </div>
                    <div style="width: 200px;">
                        <label style="font-size: 11px; font-weight: bold; color: #002F6E; display: block; margin-bottom: 4px;">PREVIEW BG COLOR</label>
                        ${createColorPicker(safeId, 'background', 'hs-blue-t1', 'updateMaskBackground')}
                    </div>
                </div>
                 <div>
                    <button onclick="resetToDefaults(\'${safeId}\')" class="download-btn" style="background: #ED1C24; padding: 8px 16px; font-size: 12px; white-space: nowrap;">Reset to Defaults</button>
                    </div>
            </div>

                          

            <div id="preview-wrapper-${safeId}" class="preview-wrapper" style="background-color: #F5F9FC; border-radius: 8px; padding: 0; overflow: hidden; position: relative; height: 360px; margin-bottom: 20px;">
                <div id="preview-bg-${safeId}" class="preview-full-background" style="position: relative; overflow: hidden; z-index: 1; height: 100%; width: 100%;">
                    <div class="preview-maincontent" style="position: relative; z-index: 2; padding: 40px; color: #002F6E;">
                        <h3 style="margin: 0 0 10px 0;">Preview</h3>
                        <p style="margin: 0; opacity: 0.7;">This shows how the wireblock will appear as a background element in the ContentHero component.</p>
                    </div>
                </div>
            </div>
            
            <div class="grid" style="margin-bottom: 20px;">
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <label style="font-size: 11px; font-weight: bold; color: #002F6E;">SCALE</label>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <button onclick="decrementValue(\'${safeId}\', \'scale\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">&ndash;</button>
                            <input type="number" id="scale-input-${safeId}" min="100" max="300" value="150"
                               oninput="updateMaskScaleFromInput('${safeId}')"
                               style="width: 70px; padding: 4px 8px; border: 1px solid #E6EBF1; border-radius: 4px; text-align: center; font-size: 12px;">
                            <button onclick="incrementValue(\'${safeId}\', \'scale\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">+</button>
                        </div>
                    </div>
                    <input type="range" id="scale-${safeId}" min="100" max="300" value="150" step="1"
                           oninput="updateMaskScale('${safeId}')" 
                           style="width: 100%;">
                </div>
                
               
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <label style="font-size: 11px; font-weight: bold; color: #002F6E;">HORIZONTAL</label>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <button onclick="decrementValue(\'${safeId}\', \'h-pos\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">&ndash;</button>
                                <input type="number" id="h-pos-input-${safeId}" min="-300" max="300" value="10"
                                   oninput="updateMaskPositionFromInput('${safeId}')"
                                   style="width: 60px; padding: 4px 8px; border: 1px solid #E6EBF1; border-radius: 4px; text-align: center; font-size: 12px;">
                                <button onclick="incrementValue(\'${safeId}\', \'h-pos\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">+</button>
                            </div>
                        </div>
                        <input type="range" id="h-pos-${safeId}" min="-300" max="300" value="10" step="1"
                               oninput="updateMaskPosition('${safeId}')" 
                               style="width: 100%;">
                    </div>
                    
                   <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <label style="font-size: 11px; font-weight: bold; color: #002F6E;">VERTICAL</label>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <button onclick="decrementValue(\'${safeId}\', \'v-pos\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">&ndash;</button>
                                <input type="number" id="v-pos-input-${safeId}" min="-300" max="300" value="-25"
                                   oninput="updateMaskPositionFromInput('${safeId}')"
                                   style="width: 60px; padding: 4px 8px; border: 1px solid #E6EBF1; border-radius: 4px; text-align: center; font-size: 12px;">
                                <button onclick="incrementValue(\'${safeId}\', \'v-pos\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">+</button>
                            </div>
                        </div>
                        <input type="range" id="v-pos-${safeId}" min="-300" max="300" value="-25" step="1"
                               oninput="updateMaskPosition('${safeId}')" 
                               style="width: 100%;">
                    </div>
              
                <div style="margin-bottom: 15px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <label style="font-size: 11px; font-weight: bold; color: #002F6E;">ROTATION</label>
        <div style="display: flex; align-items: center; gap: 4px;">
            <button onclick="decrementValue(\'${safeId}\', \'rotation\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">&ndash;</button>
            <input type="number" id="rotation-input-${safeId}" min="-180" max="180" value="0"
               oninput="updateMaskRotationFromInput('${safeId}')"
               style="width: 60px; padding: 4px 8px; border: 1px solid #E6EBF1; border-radius: 4px; text-align: center; font-size: 12px;">
            <button onclick="incrementValue(\'${safeId}\', \'rotation\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">+</button>
        </div>
    </div>
    <input type="range" id="rotation-${safeId}" min="-180" max="180" value="0" step="1"
           oninput="updateMaskRotation('${safeId}')" 
           style="width: 100%;">
</div>
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <label style="font-size: 11px; font-weight: bold; color: #002F6E;">OPACITY</label>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <button onclick="decrementValue(\'${safeId}\', \'opacity\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">&ndash;</button>
                            <input type="number" id="opacity-input-${safeId}" min="0" max="100" value="60"
                               oninput="updateMaskOpacityFromInput('${safeId}')"
                               style="width: 60px; padding: 4px 8px; border: 1px solid #E6EBF1; border-radius: 4px; text-align: center; font-size: 12px;">
                            <button onclick="incrementValue(\'${safeId}\', \'opacity\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">+</button>
                        </div>
                    </div>
                    <input type="range" id="opacity-${safeId}" min="0" max="100" value="60" step="1"
                           oninput="updateMaskOpacity('${safeId}')" 
                           style="width: 100%;">
                </div>
                
               
            </div>

             <div style="display: flex; gap: 10px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #E6EBF1; align-items: center; flex-wrap: wrap; ">
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 13px; color: #002F6E;min-width: 200px;">
                        <input type="checkbox" id="hide-mobile-${safeId}" onchange="updateMaskMobile(\'${safeId}\')" 
                               style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                        <span style="font-weight: 600;">Hide on mobile (&#x2264;991px)</span>
                    </label>
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 13px; color: #002F6E; min-width: 200px;">
                        <input type="checkbox" id="show-two-${safeId}" onchange="toggleSecondWireblock(\'${safeId}\')" 
                               style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                        <span style="font-weight: 600;">Show two wireblocks</span>
                    </label>
                </div>

            <div id="second-wireblock-controls-${safeId}" style="display: none; margin-top: 20px; padding-top: 15px; border-top: 2px dashed #E6EBF1;">
                <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: bold; color: #002F6E; text-transform: uppercase; letter-spacing: 0.5px;">Second Wireblock (::after)</h4>
                <div class="grid" style="margin-bottom: 0;">
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <label style="font-size: 11px; font-weight: bold; color: #002F6E;">SCALE</label>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <button onclick="decrementValue2(\'${safeId}\', \'scale2\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">&ndash;</button>
                                <input type="number" id="scale2-input-${safeId}" min="100" max="300" value="150"
                                   oninput="updateMask2ScaleFromInput('${safeId}')"
                                   style="width: 70px; padding: 4px 8px; border: 1px solid #E6EBF1; border-radius: 4px; text-align: center; font-size: 12px;">
                                <button onclick="incrementValue2(\'${safeId}\', \'scale2\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">+</button>
                            </div>
                        </div>
                        <input type="range" id="scale2-${safeId}" min="100" max="300" value="150" step="1"
                               oninput="updateMask2Scale('${safeId}')" 
                               style="width: 100%;">
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <label style="font-size: 11px; font-weight: bold; color: #002F6E;">HORIZONTAL</label>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <button onclick="decrementValue2(\'${safeId}\', \'h-pos2\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">&ndash;</button>
                                <input type="number" id="h-pos2-input-${safeId}" min="-300" max="300" value="50"
                                   oninput="updateMask2PositionFromInput('${safeId}')"
                                   style="width: 60px; padding: 4px 8px; border: 1px solid #E6EBF1; border-radius: 4px; text-align: center; font-size: 12px;">
                                <button onclick="incrementValue2(\'${safeId}\', \'h-pos2\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">+</button>
                            </div>
                        </div>
                        <input type="range" id="h-pos2-${safeId}" min="-300" max="300" value="50" step="1"
                               oninput="updateMask2Position('${safeId}')" 
                               style="width: 100%;">
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <label style="font-size: 11px; font-weight: bold; color: #002F6E;">VERTICAL</label>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <button onclick="decrementValue2(\'${safeId}\', \'v-pos2\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">&ndash;</button>
                                <input type="number" id="v-pos2-input-${safeId}" min="-300" max="300" value="-25"
                                   oninput="updateMask2PositionFromInput('${safeId}')"
                                   style="width: 60px; padding: 4px 8px; border: 1px solid #E6EBF1; border-radius: 4px; text-align: center; font-size: 12px;">
                                <button onclick="incrementValue2(\'${safeId}\', \'v-pos2\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">+</button>
                            </div>
                        </div>
                        <input type="range" id="v-pos2-${safeId}" min="-300" max="300" value="-25" step="1"
                               oninput="updateMask2Position('${safeId}')" 
                               style="width: 100%;">
                    </div>
              
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <label style="font-size: 11px; font-weight: bold; color: #002F6E;">ROTATION</label>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <button onclick="decrementValue2(\'${safeId}\', \'rotation2\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">&ndash;</button>
                                <input type="number" id="rotation2-input-${safeId}" min="-180" max="180" value="0"
                                   oninput="updateMask2RotationFromInput('${safeId}')"
                                   style="width: 60px; padding: 4px 8px; border: 1px solid #E6EBF1; border-radius: 4px; text-align: center; font-size: 12px;">
                                <button onclick="incrementValue2(\'${safeId}\', \'rotation2\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">+</button>
                            </div>
                        </div>
                        <input type="range" id="rotation2-${safeId}" min="-180" max="180" value="0" step="1"
                               oninput="updateMask2Rotation('${safeId}')" 
                               style="width: 100%;">
                    </div>

                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <label style="font-size: 11px; font-weight: bold; color: #002F6E;">OPACITY</label>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <button onclick="decrementValue2(\'${safeId}\', \'opacity2\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">&ndash;</button>
                                <input type="number" id="opacity2-input-${safeId}" min="0" max="100" value="60"
                                   oninput="updateMask2OpacityFromInput('${safeId}')"
                                   style="width: 60px; padding: 4px 8px; border: 1px solid #E6EBF1; border-radius: 4px; text-align: center; font-size: 12px;">
                                <button onclick="incrementValue2(\'${safeId}\', \'opacity2\', 1)" style="width: 24px; height: 24px; padding: 0; border: 1px solid #E6EBF1; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: #002F6E;">+</button>
                            </div>
                        </div>
                        <input type="range" id="opacity2-${safeId}" min="0" max="100" value="60" step="1"
                               oninput="updateMask2Opacity('${safeId}')" 
                               style="width: 100%;">
                    </div>
                </div>
            </div>
            <p class="small mb-0">Put the following CSS into a RichText component within a style tag at the top of your page in Sitecore to apply the background wireblock mask:</p>

            <div class="code-block">
                <button class="copy-btn" onclick="copyToClipboard('code-${safeId}', this)">
                    <svg class="checkmark-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span class="btn-text">Copy CSS</span>
                </button>
                <code id="code-${safeId}"></code>
            </div>
           <!-- <button class="download-btn" style="max-width: 200px;" onclick="downloadMaskSVG('${item.id}', '${item.path}')">Download Source SVG</button> -->
        `;
        card.classList.remove('is-loading');
        // Re-store the data after innerHTML wipe
        card.dataset.id = item.id;
        card.dataset.path = item.path;
        card.dataset.currentColor = 'hs-blue';
        card.dataset.currentHex = '#0072BC';
        updateMask(item.id, 'hs-blue', '#0072BC', item.path);
    }
    else {
        // Check if this is a wireblock to add the generate background button
        const isWireblock = item.type === 'wireblock';
        
        card.innerHTML = `
            <span class="label">${item.id}</span>
            <div class="type-badge-wrapper"><div class="type-badge ${typeClass}">${typeDisplay}</div></div>
            <div class="preview-area" id="preview-${safeId}" style="color: #0072BC;">
                <svg><use href="${currentConfig.spriteUrl}#${item.id}"></use></svg>
            </div>
            
            ${createColorPicker(safeId, 'icon', 'hs-blue', 'updateIcon')}
            
            ${item.type === 'pictograph' ? `
            <div style="margin-top: 10px;">
                <label style="display: flex; align-items: center; cursor: pointer; font-size: 13px; color: #002F6E;">
                    <input type="checkbox" id="border-${safeId}" onchange="updateIconBorder('${safeId}')" 
                           style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                    <span style="font-weight: 600;">Add border</span>
                </label>
            </div>
            ` : ''}
            
            ${isWireblock ? `
            <button class="download-btn" style="background: #008996; width: 100%; margin-top: 10px;" onclick="openBackgroundGenerator('${item.id}')">
                Generate Background
            </button>
            ` : ''}

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
        card.dataset.currentColor = 'hs-blue';
        card.dataset.currentHex = '#0072BC';
        updateIcon(item.id, 'hs-blue', '#0072BC');
    }
}

function createColorPicker(safeId, type, defaultColor = 'hs-blue', onChangeCallback) {
    const pickerId = `color-picker-${type}-${safeId}`;
    const defaultColorData = findColorData(defaultColor);
    
    return `
        <div class="color-picker-container">
            <button type="button" class="color-picker-button" onclick="toggleColorPicker('${pickerId}')">
                <span class="color-swatch" style="background-color: ${defaultColorData.hex};"></span>
                <span>${formatColorLabel(defaultColor)}</span>
                <span style="margin-left: auto;">&#9660;</span>
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
    return { class: 'hs-blue', hex: '#0072BC', group: 'Primary Blues' };
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
    
    // Check if border is enabled
    const borderCheckbox = document.getElementById(`border-${safeId}`);
    const hasBorder = borderCheckbox && borderCheckbox.checked;
    
    const codeElement = document.getElementById(`code-${safeId}`);
    if (codeElement) {
        const borderClass = hasBorder ? ' hs-pictograph-border' : '';
        const raw = `<svg class="hs-pictograph ${cls}${borderClass}">\n  <use href="${currentConfig.spriteUrl}#${id}"></use>\n</svg>`;
        
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

// New function for border checkbox
function updateIconBorder(safeId) {
    const card = document.getElementById(`card-${safeId}`);
    const borderCheckbox = document.getElementById(`border-${safeId}`);
    const preview = document.getElementById(`preview-${safeId}`);
    
    // Update preview SVG
    if (preview && preview.querySelector('svg')) {
        const svg = preview.querySelector('svg');
        if (borderCheckbox.checked) {
            svg.classList.add('hs-pictograph-border');
        } else {
            svg.classList.remove('hs-pictograph-border');
        }
    }
    
    // Update the code block
    updateIcon(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex);
}

function updateMask(id, colorClass, hex, path) {
    const safeId = id.replace(/[^a-zA-Z0-9-_]/g, '_');
    const previewBg = document.getElementById(`preview-bg-${safeId}`);
    const codeElement = document.getElementById(`code-${safeId}`);

    // Get current slider values (or use defaults)
    const scale = document.getElementById(`scale-${safeId}`)?.value || '150';
    const hPos = document.getElementById(`h-pos-${safeId}`)?.value || '10';
    const vPos = document.getElementById(`v-pos-${safeId}`)?.value || '-25';
    const opacity = document.getElementById(`opacity-${safeId}`)?.value || '60';
    const rotation = document.getElementById(`rotation-${safeId}`)?.value || '0';
    const hideMobile = document.getElementById(`hide-mobile-${safeId}`)?.checked || false;
    const showTwo = document.getElementById(`show-two-${safeId}`)?.checked || false;

    // Get second wireblock values
    const scale2 = document.getElementById(`scale2-${safeId}`)?.value || '150';
    const hPos2 = document.getElementById(`h-pos2-${safeId}`)?.value || '50';
    const vPos2 = document.getElementById(`v-pos2-${safeId}`)?.value || '-25';
    const opacity2 = document.getElementById(`opacity2-${safeId}`)?.value || '60';
    const rotation2 = document.getElementById(`rotation2-${safeId}`)?.value || '0';

    // Create or update the dynamic style element
    let styleEl = document.getElementById(`style-${safeId}`);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = `style-${safeId}`;
        document.head.appendChild(styleEl);
    }

    // Calculate transform origin (center of the element)
    const transformOrigin = '50% 50%';

    // Update the preview with dynamic CSS
    let previewCSS = `
        #preview-bg-${safeId}::before {
            content: "" !important;
            position: absolute !important;
            top: ${vPos}% !important;
            width: ${scale}% !important;
            right: ${hPos}% !important;
            height: ${scale}% !important;
            background-color: ${hex};
            opacity: ${parseFloat(opacity) / 100};
            mask-image: url('${path}') !important;
            -webkit-mask-image: url('${path}') !important;
            mask-repeat: no-repeat !important;
            -webkit-mask-repeat: no-repeat !important;
            mask-position: center right !important;
            -webkit-mask-position: center right !important;
            mask-size: contain !important;
            -webkit-mask-size: contain !important;
            transform: rotate(${rotation}deg) !important;
            transform-origin: ${transformOrigin} !important;
            z-index: -1 !important;
            pointer-events: none !important;
        }
    `;

    if (showTwo) {
        previewCSS += `
        #preview-bg-${safeId}::after {
            content: "" !important;
            position: absolute !important;
            top: ${vPos2}% !important;
            width: ${scale2}% !important;
            right: ${hPos2}% !important;
            height: ${scale2}% !important;
            background-color: ${hex};
            opacity: ${parseFloat(opacity2) / 100};
            mask-image: url('${path}') !important;
            -webkit-mask-image: url('${path}') !important;
            mask-repeat: no-repeat !important;
            -webkit-mask-repeat: no-repeat !important;
            mask-position: center right !important;
            -webkit-mask-position: center right !important;
            mask-size: contain !important;
            -webkit-mask-size: contain !important;
            transform: rotate(${rotation2}deg) !important;
            transform-origin: ${transformOrigin} !important;
            z-index: -1 !important;
            pointer-events: none !important;
        }
        `;
    }

    styleEl.textContent = previewCSS;

    // Update the code block
    if (codeElement) {
        let cssCode = `
/* If you have multiple ContentHero components on a page, make sure to adjust the selector accordingly */
/* You can do this with section[id="db81b8ce-daf1-49c9-9ad0-87c5ed96291c"] .full-background ---- where the id is the actual id of the component*/


.full-background {
  position: relative !important;
  overflow: hidden !important;
  z-index: 1 !important;
}

.full-background::before {
    content: "" !important;
    position: absolute !important;
    top: ${vPos}% !important;
    width: ${scale}% !important;
    right: ${hPos}% !important;
    height: ${scale}% !important;
    background-color: ${hex};
    opacity: ${parseFloat(opacity) / 100};
    transform: rotate(${rotation}deg);
    transform-origin: center center;
    mask-image: url('${path}') !important;
    -webkit-mask-image: url('${path}') !important;
    mask-repeat: no-repeat !important;
    -webkit-mask-repeat: no-repeat !important;
    mask-position: center right !important;
    -webkit-mask-position: center right !important;
    mask-size: contain !important;
    -webkit-mask-size: contain !important;
    z-index: -1 !important;
    pointer-events: none !important;
}

.full-background > .maincontent {
  position: relative;
  z-index: 2;
}`;

        if (showTwo) {
            cssCode += `

.full-background::after {
    content: "" !important;
    position: absolute !important;
    top: ${vPos2}% !important;
    width: ${scale2}% !important;
    right: ${hPos2}% !important;
    height: ${scale2}% !important;
    background-color: ${hex};
    opacity: ${parseFloat(opacity2) / 100};
    transform: rotate(${rotation2}deg);
    transform-origin: center center;
    mask-image: url('${path}') !important;
    -webkit-mask-image: url('${path}') !important;
    mask-repeat: no-repeat !important;
    -webkit-mask-repeat: no-repeat !important;
    mask-position: center right !important;
    -webkit-mask-position: center right !important;
    mask-size: contain !important;
    -webkit-mask-size: contain !important;
    z-index: -1 !important;
    pointer-events: none !important;
}`;
        }

        if (hideMobile) {
            cssCode += `

@media (max-width: 991px) {
  .full-background::before {
    display: none !important;
  }`;
            if (showTwo) {
                cssCode += `
  .full-background::after {
    display: none !important;
  }`;
            }
            cssCode += `
}`;
        }
        
        codeElement.className = '';
        codeElement.removeAttribute('data-highlighted');
        codeElement.textContent = cssCode;
        codeElement.className = 'language-css';
        
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(codeElement);
        }
}
}

// New function for mobile checkbox
function updateMaskMobile(safeId) {
    const card = document.getElementById(`card-${safeId}`);
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

// Toggle second wireblock controls visibility
function toggleSecondWireblock(safeId) {
    const showTwo = document.getElementById(`show-two-${safeId}`).checked;
    const controls = document.getElementById(`second-wireblock-controls-${safeId}`);
    controls.style.display = showTwo ? 'block' : 'none';
    
    const card = document.getElementById(`card-${safeId}`);
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

// Second wireblock increment/decrement
function incrementValue2(safeId, controlName, step = 1) {
    const input = document.getElementById(`${controlName}-input-${safeId}`);
    const slider = document.getElementById(`${controlName}-${safeId}`);
    
    let currentValue = parseInt(input.value) || 0;
    let min = parseInt(slider.min);
    let max = parseInt(slider.max);
    
    let newValue = currentValue + step;
    newValue = Math.max(min, Math.min(max, newValue));
    
    input.value = newValue;
    slider.value = newValue;
    
    const card = document.getElementById(`card-${safeId}`);
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

function decrementValue2(safeId, controlName, step = 1) {
    incrementValue2(safeId, controlName, -step);
}

// Second wireblock scale functions
function updateMask2Scale(safeId) {
    const slider = document.getElementById(`scale2-${safeId}`);
    const input = document.getElementById(`scale2-input-${safeId}`);
    input.value = slider.value;
    const card = document.getElementById(`card-${safeId}`);
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

function updateMask2ScaleFromInput(safeId) {
    const slider = document.getElementById(`scale2-${safeId}`);
    const input = document.getElementById(`scale2-input-${safeId}`);
    let value = parseInt(input.value) || 150;
    value = Math.max(100, Math.min(300, value));
    input.value = value;
    slider.value = value;
    const card = document.getElementById(`card-${safeId}`);
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

// Second wireblock position functions
function updateMask2Position(safeId) {
    const hSlider = document.getElementById(`h-pos2-${safeId}`);
    const vSlider = document.getElementById(`v-pos2-${safeId}`);
    const hInput = document.getElementById(`h-pos2-input-${safeId}`);
    const vInput = document.getElementById(`v-pos2-input-${safeId}`);
    hInput.value = hSlider.value;
    vInput.value = vSlider.value;
    const card = document.getElementById(`card-${safeId}`);
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

function updateMask2PositionFromInput(safeId) {
    const hSlider = document.getElementById(`h-pos2-${safeId}`);
    const vSlider = document.getElementById(`v-pos2-${safeId}`);
    const hInput = document.getElementById(`h-pos2-input-${safeId}`);
    const vInput = document.getElementById(`v-pos2-input-${safeId}`);
    let hValue = parseInt(hInput.value) || 50;
    let vValue = parseInt(vInput.value) || -25;
    hValue = Math.max(-300, Math.min(300, hValue));
    vValue = Math.max(-300, Math.min(300, vValue));
    hInput.value = hValue;
    vInput.value = vValue;
    hSlider.value = hValue;
    vSlider.value = vValue;
    const card = document.getElementById(`card-${safeId}`);
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

// Second wireblock rotation functions
function updateMask2Rotation(safeId) {
    const slider = document.getElementById(`rotation2-${safeId}`);
    const input = document.getElementById(`rotation2-input-${safeId}`);
    input.value = slider.value;
    const card = document.getElementById(`card-${safeId}`);
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

function updateMask2RotationFromInput(safeId) {
    const slider = document.getElementById(`rotation2-${safeId}`);
    const input = document.getElementById(`rotation2-input-${safeId}`);
    let value = parseInt(input.value) || 0;
    value = Math.max(-180, Math.min(180, value));
    input.value = value;
    slider.value = value;
    const card = document.getElementById(`card-${safeId}`);
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

// Second wireblock opacity functions
function updateMask2Opacity(safeId) {
    const slider = document.getElementById(`opacity2-${safeId}`);
    const input = document.getElementById(`opacity2-input-${safeId}`);
    input.value = slider.value;
    const card = document.getElementById(`card-${safeId}`);
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

function updateMask2OpacityFromInput(safeId) {
    const slider = document.getElementById(`opacity2-${safeId}`);
    const input = document.getElementById(`opacity2-input-${safeId}`);
    let value = parseInt(input.value) || 60;
    value = Math.max(0, Math.min(100, value));
    input.value = value;
    slider.value = value;
    const card = document.getElementById(`card-${safeId}`);
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

// New functions for slider controls
function updateMaskScale(safeId) {
    const slider = document.getElementById(`scale-${safeId}`);
    const input = document.getElementById(`scale-input-${safeId}`);
    const card = document.getElementById(`card-${safeId}`);
    
    // Sync input with slider
    input.value = slider.value;
    
    // Trigger CSS update
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

function updateMaskScaleFromInput(safeId) {
    const slider = document.getElementById(`scale-${safeId}`);
    const input = document.getElementById(`scale-input-${safeId}`);
    const card = document.getElementById(`card-${safeId}`);
    
    // Clamp value to valid range
    let value = parseInt(input.value) || 150;
    value = Math.max(100, Math.min(300, value));
    input.value = value;
    
    // Sync slider with input
    slider.value = value;
    
    // Trigger CSS update
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

function updateMaskPosition(safeId) {
    const hSlider = document.getElementById(`h-pos-${safeId}`);
    const vSlider = document.getElementById(`v-pos-${safeId}`);
    const hInput = document.getElementById(`h-pos-input-${safeId}`);
    const vInput = document.getElementById(`v-pos-input-${safeId}`);
    const card = document.getElementById(`card-${safeId}`);
    
    // Sync inputs with sliders
    hInput.value = hSlider.value;
    vInput.value = vSlider.value;
    
    // Trigger CSS update
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

function updateMaskPositionFromInput(safeId) {
    const hSlider = document.getElementById(`h-pos-${safeId}`);
    const vSlider = document.getElementById(`v-pos-${safeId}`);
    const hInput = document.getElementById(`h-pos-input-${safeId}`);
    const vInput = document.getElementById(`v-pos-input-${safeId}`);
    const card = document.getElementById(`card-${safeId}`);
    
    // Clamp values to valid range
    let hValue = parseInt(hInput.value) || 10;
    let vValue = parseInt(vInput.value) || -25;
    hValue = Math.max(-100, Math.min(100, hValue));
    vValue = Math.max(-100, Math.min(100, vValue));
    hInput.value = hValue;
    vInput.value = vValue;
    
    // Sync sliders with inputs
    hSlider.value = hValue;
    vSlider.value = vValue;
    
    // Trigger CSS update
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

function updateMaskRotation(safeId) {
    const slider = document.getElementById(`rotation-${safeId}`);
    const input = document.getElementById(`rotation-input-${safeId}`);
    const card = document.getElementById(`card-${safeId}`);
    
    // Sync input with slider
    input.value = slider.value;
    
    // Trigger CSS update
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

function updateMaskRotationFromInput(safeId) {
    const slider = document.getElementById(`rotation-${safeId}`);
    const input = document.getElementById(`rotation-input-${safeId}`);
    const card = document.getElementById(`card-${safeId}`);
    
    // Clamp value to valid range
    let value = parseInt(input.value) || 0;
    value = Math.max(-180, Math.min(180, value));
    input.value = value;
    
    // Sync slider with input
    slider.value = value;
    
    // Trigger CSS update
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

function updateMaskOpacity(safeId) {
    const slider = document.getElementById(`opacity-${safeId}`);
    const input = document.getElementById(`opacity-input-${safeId}`);
    const card = document.getElementById(`card-${safeId}`);
    
    // Sync input with slider
    input.value = slider.value;
    
    // Trigger CSS update
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

function updateMaskOpacityFromInput(safeId) {
    const slider = document.getElementById(`opacity-${safeId}`);
    const input = document.getElementById(`opacity-input-${safeId}`);
    const card = document.getElementById(`card-${safeId}`);
    
    // Clamp value to valid range
    let value = parseInt(input.value) || 60;
    value = Math.max(0, Math.min(100, value));
    input.value = value;
    
    // Sync slider with input
    slider.value = value;
    
    // Trigger CSS update
    updateMask(card.dataset.id, card.dataset.currentColor, card.dataset.currentHex, card.dataset.path);
}

// Tab switching function
function switchTab(tab) {
    // Don't do anything if already on this tab
    if (currentTab === tab) return false;
    
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find and activate the clicked button
    const clickedBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
        btn.getAttribute('onclick').includes(`'${tab}'`)
    );
    if (clickedBtn) clickedBtn.classList.add('active');
    
    // Update tab content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tab}-tab`).classList.add('active');
    
    // Reset pagination and filters
    itemsToShow = PAGE_SIZE;
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = 'all';
    
    // Filter and render for the new tab
    filterIcons();
    
    return false;
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
    btn.classList.add('copied');
    
    setTimeout(() => {
        btn.innerText = oldText;
        btn.classList.remove('copied');
    }, 1500);
}

// UPDATED downloadSVG function - includes border if checkbox is checked
function downloadSVG(iconId, safeId) {
    if (!spriteText) return;
    
    // Get color from card dataset
    const card = document.getElementById(`card-${safeId}`);
    const colorClass = card.dataset.currentColor || 'hs-blue';
    const colorHex = card.dataset.currentHex || '#0072BC';
    
    // Check if border is enabled
    const borderCheckbox = document.getElementById(`border-${safeId}`);
    const hasBorder = borderCheckbox && borderCheckbox.checked;
    
    const match = spriteText.match(new RegExp(`<symbol[^>]*id="${iconId}"[^>]*>(.*?)</symbol>`, 's'));
    if (!match) return;

    const viewBox = match[0].match(/viewBox="([^"]*)"/)?.[1] || '0 0 110 110';
    let content = match[1]
        .replace(/fill:\s*currentColor/g, `fill:${colorHex}`)
        .replace(/stroke:\s*currentColor/g, `stroke:${colorHex}`)
        .replace(/fill="currentColor"/g, `fill="${colorHex}"`)
        .replace(/stroke="currentColor"/g, `stroke="${colorHex}"`);

    // Add border rectangle if enabled (square on the outside of artboard)
    let borderElement = '';
    if (hasBorder) {
        borderElement = `<rect x="0.75" y="0.75" width="108.5" height="108.5" fill="none" stroke="${colorHex}" stroke-width="1.5"/>`;
    }

    const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ns0="http://www.w3.org/2000/svg" xmlns:ns1="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="110" height="110">
${borderElement}${content}
</svg>`;

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const borderSuffix = hasBorder ? '_with-border' : '';
    a.download = `${iconId}_${colorClass}${borderSuffix}.svg`;
    a.click();
    URL.revokeObjectURL(url);
}


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

// UPDATED downloadPNG function - includes border if checkbox is checked
function downloadPNG(iconId, safeId) {
    // Get color from card dataset
    const card = document.getElementById(`card-${safeId}`);
    const colorClass = card.dataset.currentColor || 'hs-blue';
    const colorHex = card.dataset.currentHex || '#0072BC';

    // Check if border is enabled
    const borderCheckbox = document.getElementById(`border-${safeId}`);
    const hasBorder = borderCheckbox && borderCheckbox.checked;

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

    // Add border rectangle if enabled (square on the outside of artboard)
    // Calculate stroke width to maintain 1.5px visual appearance at any output size
    let borderElement = '';
    if (hasBorder) {
        // Scale stroke inversely: we want 1.5px at the output size, so divide by scale factor
        const scaleFactor = size / 110;
        const adjustedStroke = 1.5 / scaleFactor;
        const offset = adjustedStroke / 2;
        const rectSize = 110 - adjustedStroke;
        
        borderElement = `<rect x="${offset}" y="${offset}" width="${rectSize}" height="${rectSize}" fill="none" stroke="${colorHex}" stroke-width="${adjustedStroke}"/>`;
    }

    const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}">${borderElement}${cleanContent}</svg>`;
    
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
        const borderSuffix = hasBorder ? '_with-border' : '';
        a.download = `${iconId}_${size}px_${colorClass}${borderSuffix}.png`;
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

// Open background generator modal
function openBackgroundGenerator(wireblockId) {
    // Find the corresponding background wireblock
    // Pattern: wireblock "Business-Concepts_Accomplish" -> background "HS_US_EN_Wireblock_non-scaling-stroke-2_Business-Concepts_Accomplish"
    const backgroundId = `HS_US_EN_Wireblock_non-scaling-stroke-2_${wireblockId}`;
    
    // Check if this background exists
    const backgroundWireblock = currentConfig.icons.find(i => i.id === backgroundId);
    if (!backgroundWireblock) {
        alert('Background version not found for this wireblock');
        return;
    }
    
    // Show the modal
    const modal = document.getElementById('background-modal');
    modal.style.display = 'flex';
    
    // Update modal title
    document.getElementById('modal-title').textContent = `Background Generator: ${formatBackgroundLabel(backgroundId)}`;
    
    // Render the background wireblock in the modal
    const container = document.getElementById('modal-background-container');
    container.innerHTML = '';
    
    const card = document.createElement('div');
    const safeId = backgroundWireblock.id.replace(/[^a-zA-Z0-9-_]/g, '_');
    card.dataset.id = backgroundWireblock.id;
    card.id = `card-${safeId}`;
    card.className = 'card-wide is-loading';
    
    container.appendChild(card);
    card.innerHTML = `<div class="preview-area"></div>`;
    loadActualContent(card, backgroundWireblock);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
}

// Close background generator modal
function closeBackgroundModal() {
    const modal = document.getElementById('background-modal');
    modal.style.display = 'none';
    
    // Re-enable body scroll
    document.body.style.overflow = '';
}

// Close modal when clicking outside of it
document.addEventListener('click', (e) => {
    const modal = document.getElementById('background-modal');
    if (e.target === modal) {
        closeBackgroundModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeBackgroundModal();
    }
});
// Open help/about modal
function openHelpModal() {
    const modal = document.getElementById('help-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Close help/about modal
function closeHelpModal() {
    const modal = document.getElementById('help-modal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

// Close help modal when clicking outside or pressing Escape
document.addEventListener('click', (e) => {
    const helpModal = document.getElementById('help-modal');
    if (e.target === helpModal) {
        closeHelpModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const helpModal = document.getElementById('help-modal');
        if (helpModal && helpModal.style.display === 'flex') {
            closeHelpModal();
        }
    }
});