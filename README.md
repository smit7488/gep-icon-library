# GEP Icon Library

A comprehensive icon management system for GEP (Global Enablement & Procurement) with visual generation, customization, and organizational tools.

## 📋 Overview

GEP Icon Library is a complete icon management solution that allows you to:
- **Generate SVG sprite sheets** from individual icon files
- **Customize icons** with colors, scales, rotations, and effects
- **Organize icons** with categories and searchable tags
- **Manage metadata** through an intuitive tag manager interface
- **Export reusable CSS** for implementing icons in applications

---

## 🎯 Key Features

### 1. **Icon Viewer & Customizer**
- Browse icons organized by category (Pictographs, UI Icons, Wireblocks, Non-scaling)
- Preview icons with real-time customization:
  - Color selection from an extensive GEP color palette
  - Scale adjustment (100-200%)
  - Positioning controls (horizontal/vertical)
  - Rotation angles
  - Opacity levels
  - Mobile display toggles
- Search functionality to find icons by name or tags
- Copy individual icon CSS or bulk export

### 2. **Tag Manager Interface**
- Visually manage icon metadata
- Add/edit categories for each icon
- Create and assign searchable tags
- Persist changes to `icon-tags.json`
- Bulk operations support

### 3. **Python Sprite Generator**
- Automated SVG sprite sheet creation
- Processes icons from organized subdirectories
- Generates accompanying JSON configuration files
- Supports batch processing across multiple icon sets

---

## 📁 Project Structure

```
gep-icon-library/
├── index.html              # Main icon viewer & customizer interface
├── tag-manager.html        # Tag and category management UI
├── python/
│   ├── generate.py         # Main sprite generation script
│   └── helpers/            # Utility scripts for icon processing
│       ├── background.py
│       ├── category-generator.py
│       ├── check_icons.py
│       ├── convert-tags-format.py
│       ├── create-sprite.py
│       ├── icon_recolor-for-ui.py
│       ├── identify-duplicates.py
│       ├── non-scaling-stroke.py
│       ├── recolor_svg-cssmethod.py
│       └── remove-svg-dimensions.py
├── script/
│   ├── main.js             # Main application logic
│   └── highlight.js        # Syntax highlighting
├── styles/
│   └── main.css            # Application styling
├── svg/                    # Source icon files
│   ├── pictographs/
│   ├── ui icons/
│   ├── wireblocks/
│   └── non-scaling/
├── meta/                   # Metadata & assets
└── zbackup/               # Backup configurations
```

---

## 🚀 Getting Started

### View Icons
1. Open `index.html` in a web browser
2. Select icon categories from the dropdown
3. Search for specific icons using tags or names
4. Customize icons with color, scale, and positioning controls
5. Copy CSS for individual icons or export the master CSS

### Manage Icon Metadata
1. Open `tag-manager.html` in a web browser
2. Search for icons by filename
3. Add categories and tags for organization
4. Changes are saved to `icon-tags.json`

### Generate Sprite Sheet
1. Navigate to the `python/` directory
2. Run: `python generate.py`
3. Follow the prompts to specify:
   - Sprite file name
   - Icon categories to include
4. Output files are generated in the `dist/` folder

---

## 📊 Data Structure

### icon-tags.json Format

Icons are organized with metadata stored in `icon-tags.json`:

```json
{
  "Business_110": {
    "tags": [
      "plug",
      "outlet",
      "socket",
      "connect",
      "connection",
      "power",
      "connectivity"
    ],
    "categories": [
      "business",
      "product"
    ]
  },
  "Business_Administration": {
    "tags": [
      "gear",
      "settings",
      "configuration",
      "admin",
      "manage"
    ],
    "categories": [
      "business",
      "corporate"
    ]
  }
}
      "protection",
      "ppe"
    ],
    "categories": [
      "medical",
      "product"
    ]
}
```

Each icon entry contains:
- **tags**: Array of searchable keywords (5-15 descriptive terms)
- **categories**: Array of organizational buckets (1-3 broad categories)

---

## 🎨 Color Palette

The system includes an extensive GEP color library organized into groups:

### Quick Colors (Primary)
- `icon-blue` (#0072BC)
- `icon-dark-blue` (#002F6E)
- `icon-light-blue` (#3DB5E6)
- `icon-green` (#008996)
- `icon-red` (#ED1C24)
- `icon-orange` (#F28B00)
- `icon-violet` (#831A5B)

### Extended Palette
Each primary color includes shade variations:
- `-s1`: Shade (darker)
- `-t1` through `-t4`: Tints (lighter variations)

### Neutrals
- `icon-dark-gray` (#474F50)
- `icon-gray` (#6B6F70)
- `icon-light-gray-1` (#F7F7F6)
- `icon-light-gray-2` (#E6E6E6)
- `icon-black` (#000000)
- `icon-white` (#FFFFFF)

---

## 📖 Usage Guide

### For Designers

1. **Open index.html** in your browser
2. **Browse icons** by category dropdown
3. **Search** for icons by name, tag, or category
4. **Customize** individual icons:
   - Select color from palette
   - Adjust scale (100-200%)
   - Reposition (horizontal/vertical offset)
   - Rotate to any angle
   - Adjust opacity
   - Toggle mobile visibility
5. **Copy CSS** for individual icons or download master CSS

### For Developers

1. **Include Master CSS** from index.html
2. **Use icon classes** in your HTML:
   ```html
   <svg class="icon icon-blue">
     <use xlink:href="sprite.svg#IconName"></use>
   </svg>
   ```
3. **Apply color classes**:
   ```html
   <svg class="icon icon-blue-t4 icon-lg">
     <use xlink:href="sprite.svg#IconName"></use>
   </svg>
   ```
4. **Size modifiers**: `icon-sm`, `icon-md`, `icon-lg`

### For Icon Management

1. **Open tag-manager.html**
2. **Search for icons** by filename
3. **Assign categories** (purple section):
   - Click quick tags for common categories
   - Add custom categories as needed
4. **Add tags** (blue section):
   - Enter descriptive keywords
   - Separate with commas
   - Can include visual, functional, and contextual terms
5. **Save changes** - automatically updates `icon-tags.json`

---

## ⚙️ Setup & Configuration

### Prerequisites
- Python 3.6+ (for sprite generation)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - runs locally

### Installation

1. **Clone or download** the repository
2. **Place SVG icons** in appropriate `/svg` subdirectories:
   - `svg/pictographs/` - Illustrative icons
   - `svg/ui icons/` - User interface icons
   - `svg/wireblocks/` - Wireframe/decorative
   - `svg/non-scaling/` - Icons with non-scaling strokes

3. **Generate sprite sheet**:
   ```bash
   cd python
   python generate.py
   ```

4. **Follow prompts** to specify sprite name and icon categories

5. **Tag icons** using tag-manager.html

6. **View in index.html** with full customization features

---

## 🛠️ Python Helper Scripts

Located in `python/helpers/`, these utilities assist with icon processing:

- **create-sprite.py** - Core sprite sheet generation
- **category-generator.py** - Bulk category assignment
- **check_icons.py** - Validate icon files
- **identify-duplicates.py** - Find similar/duplicate icons
- **recolor_svg-cssmethod.py** - Apply CSS-based recoloring
- **icon_recolor-for-ui.py** - Convert icons for UI use
- **remove-svg-dimensions.py** - Strip fixed dimensions
- **non-scaling-stroke.py** - Configure stroke scaling
- **convert-tags-format.py** - Transform tag data formats
- **background.py** - Add backgrounds to icons

---

## 🔍 Search & Filter Features

### Search Operators
- **By name**: Type icon filename (e.g., "business")
- **By tag**: Search descriptive keywords (e.g., "gear", "settings")
- **By category**: Filter using category dropdown
- **Combined**: Select category AND search tags simultaneously

### Example Searches
```
Category: "Business" + Search: "settings"
→ Shows business-related icons with "settings" tags

Search: "medical gear"
→ Shows icons tagged with both "medical" and "gear"

Category: "Product"
→ Shows all icons in the product category
```

---

## 💾 Export & Sharing

### Individual Icon CSS
1. Customize icon in viewer
2. Click "Copy CSS" button
3. Paste into your stylesheet

### Master CSS Export
1. Click "Export Master CSS" button
2. Includes all color variations and size modifiers
3. Ready to use in production

### Icon Metadata Export
1. In tag-manager.html, click "Download icon-tags.json"
2. Contains all categories and tags
3. Share with team or version control

---

## 🎯 Best Practices

### Tagging Icons
- **Categories** (1-3): Broad organizational buckets (business, medical, product)
- **Tags** (5-15): Specific descriptors (visual, functional, contextual)

### Visual Descriptions
Include what the icon looks like: `gear`, `person`, `heart`, `arrow`, `star`

### Functional Descriptions
Include what the icon represents: `settings`, `admin`, `health`, `navigation`

### Industry/Context Terms
Add domain-specific language: `medical`, `dental`, `equipment`, `product`

---

## 📝 Common Workflows

### Adding New Icons
1. Place SVG files in appropriate `/svg` subdirectory
2. Run `python generate.py`
3. New icons appear in sprite
4. Open tag-manager.html and tag new icons
5. Export updated `icon-tags.json`

### Updating Existing Icons
1. Edit SVG source files
2. Run `python generate.py` to regenerate sprite
3. Tag changes handled separately in tag-manager.html
4. Icon customization settings are independent

### Team Collaboration
1. Each person can tag different icon sets
2. Export individual `icon-tags.json` segments
3. Merge updates in version control
4. All tags combine without conflicts

---

## 🐛 Troubleshooting

### Icons not appearing
- Verify SVG files are in `/svg` subdirectories
- Check that `generate.py` completed successfully
- Ensure `dist/` folder contains generated files

### Search not working
- Confirm `icon-tags.json` is loaded
- Check browser console for errors
- Verify JSON syntax in `icon-tags.json`

### Categories not showing
- Open tag-manager.html and add categories
- Export `icon-tags.json` to `/dist` folder
- Refresh index.html browser page

### CSS not copying
- Check browser console permissions
- Ensure JavaScript is enabled
- Try copying from different icon

---

## 📄 License

See [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

To add improvements:
1. Update source SVG files in `/svg`
2. Run sprite generation
3. Add/update tags via tag-manager
4. Test in index.html viewer
5. Submit changes with updated assets

---

## 📞 Support

For issues or questions:
1. Check the embedded help (? button in index.html)
2. Review troubleshooting section above
3. Inspect browser console for error messages
4. Verify all files are in correct locations

### Data Flow

```
Tag Manager
    ↓
icon-tags.json
    ↓
Main Viewer (loads on startup)
    ↓
Category dropdown populated
    ↓
User filters/searches
    ↓
Icons filtered by categories & tags
```

---

## ❓ FAQ

**Q: How are categories different from tags?**
A: Categories are broad organizational buckets (business, medical). Tags are specific descriptors (gear, gloves, settings).

**Q: Can an icon have multiple categories?**
A: Yes! That's the benefit. An icon can be in "business" AND "product" AND "corporate".

**Q: Will running Python overwrite my categories/tags?**
A: No! icon-tags.json is completely separate. Python never touches it.

**Q: How do I add a new category?**
A: Just type it in the category input in the tag manager. It will appear in the dropdown automatically.

**Q: What if I don't tag an icon?**
A: It won't appear when filtering by category, but will still show in "All Categories" and can be found by name.

**Q: How do I backup my tags?**
A: Click "Download icon-tags.json" regularly. Save to Git or cloud storage.

**Q: Can I edit the JSON file directly?**
A: Yes! It's just JSON. But the tag manager is safer and easier.

---

## 📋 Complete Checklist

### Initial Setup
- [ ] Replace Python script with no-categories version
- [ ] Run Python script once
- [ ] Save tag-manager-categories-tags.html
- [ ] Update main.js with new code
- [ ] Test category dropdown appears (empty at first)

### Tagging Phase
- [ ] Open tag manager
- [ ] Tag first icon (both categories and tags)
- [ ] Export icon-tags.json
- [ ] Save to /dist folder
- [ ] Refresh main viewer
- [ ] Verify category appears in dropdown

### Production
- [ ] Tag all icons (or at least most important ones)
- [ ] Export final icon-tags.json
- [ ] Commit to version control
- [ ] Document category naming conventions for team
- [ ] Train team on tag manager usage

### Maintenance
- [ ] Export tags weekly (backup)
- [ ] Run Python script when adding new icons
- [ ] Tag new icons after Python run
- [ ] Export updated icon-tags.json
- [ ] Commit to version control

---

## 🎉 You're All Set!

Your icon system now has:
- ✅ Flexible categories (stored separately)
- ✅ Searchable tags (descriptive keywords)
- ✅ Python-safe storage (won't be overwritten)
- ✅ Category dropdown filter (dynamic from tags file)
- ✅ Powerful search (across names, tags, categories)

**Next Steps:**
1. Start tagging your most-used icons
2. Build up your category and tag vocabulary
3. Export regularly
4. Enjoy the flexibility! 🚀