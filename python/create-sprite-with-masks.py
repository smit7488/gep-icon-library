import os
import sys
import json
from xml.etree import ElementTree as ET

def create_gep_sprite_system():
    # 1. Setup Configuration
    file_name = input("Enter name for sprite file (e.g. hs-icons-masks): ").strip() or "hs-icons-masks"
    
    full_file_name = f"{file_name}.svg"
    output_folder = "dist"
    input_base_dir = "svg" 
    
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # GEP Color Library
    color_map = {
      "Quick Colors: Primary": {
      "icon-blue": "#0072BC",
      "icon-dark-blue": "#002F6E",
      "icon-light-blue": "#3DB5E6",
      "icon-green": "#008996",
      "icon-red": "#ED1C24",
      "icon-orange": "#F28B00",
      "icon-violet": "#831A5B"
    },
    "Primary Blues": {
      "icon-blue": "#0072BC",
      "icon-blue-t4": "#80B9DE",
      "icon-blue-t3": "#B3D5EB",
      "icon-blue-t2": "#E6F1F9",
      "icon-blue-t1": "#F5F9FC",
      "icon-dark-blue": "#002F6E",
      "icon-dark-blue-t4": "#8098B7",
      "icon-dark-blue-t3": "#B3C1D4",
      "icon-dark-blue-t2": "#E6EBF1",
      "icon-dark-blue-t1": "#F5F7F9",
      "icon-light-blue": "#3DB5E6",
      "icon-light-blue-t4": "#9FDBF3",
      "icon-light-blue-t3": "#C5E9F8",
      "icon-light-blue-t2": "#ECF8FD",
      "icon-light-blue-t1": "#F7FCFE"
    },
    "Brand Accents": {
      "icon-green": "#008996",
      "icon-green-t4": "#80C5CB",
      "icon-green-t3": "#B3DCE0",
      "icon-green-t2": "#E6F4F5",
      "icon-green-t1": "#F5FAFB",
      "icon-red": "#ED1C24",
      "icon-red-t4": "#F78E92",
      "icon-red-t3": "#FABBB0",
      "icon-red-t2": "#FEE9EA",
      "icon-red-t1": "#FFF6F6",
      "icon-orange": "#F28B00",
      "icon-orange-t1": "#FFFAF5",
      "icon-orange-t2": "#FEF4E6",
      "icon-orange-t3": "#FBDCB3",
      "icon-orange-t4": "#F9C680",
      "icon-violet": "#831A5B",
      "icon-violet-t4": "#C28DAE",
      "icon-violet-t3": "#DABACE",
      "icon-violet-t2": "#F3E9EF",
      "icon-violet-t1": "#FAF6F8"
    },
    "Neutrals": {
      "icon-dark-gray": "#474F50",
      "icon-gray": "#6B6F70",
      "icon-light-gray-1": "#F7F7F6",
      "icon-light-gray-2": "#E6E6E6",
      "icon-black": "#000000",
      "icon-white": "#FFFFFF"
    }
  }

    sprite_root = ET.Element("svg", {"xmlns": "http://www.w3.org/2000/svg", "style": "display: none;"})
    icon_metadata = []

    if not os.path.exists(input_base_dir):
        sys.exit(f"Error: Folder '{input_base_dir}' not found.")

    for root_dir, dirs, files in os.walk(input_base_dir):
        # Identify folder name to check for backgrounds
        folder_name = os.path.basename(root_dir).lower()
        is_background_folder = (folder_name == "backgrounds")

        for svg_file in files:
            if not svg_file.lower().endswith(".svg"):
                continue

            file_path = os.path.join(root_dir, svg_file)
            base_name = os.path.splitext(svg_file)[0]
            
            # Logic for IDs and Categories
            parts = base_name.split('_', 2)
            if is_background_folder:
                asset_type, category, icon_id = "background", "Backgrounds", base_name
            elif len(parts) >= 3:
                asset_type, category, icon_id = parts[0], parts[1], f"{parts[1]}_{parts[2]}" 
            elif len(parts) == 2:
                asset_type, category, icon_id = parts[0], "General", parts[1]
            else:
                asset_type, category, icon_id = "unknown", "General", base_name

            try:
                tree = ET.parse(file_path)
                svg_content = tree.getroot()
                viewBox = svg_content.get("viewBox", "0 0 110 110")
                
                # If NOT a background, add to the SVG Sprite
                if not is_background_folder:
                    symbol = ET.SubElement(sprite_root, "symbol", {"id": icon_id, "viewBox": viewBox})
                    for element in svg_content.iter():
                        if any(tag in element.tag for tag in ['path', 'circle', 'rect', 'line', 'polyline', 'polygon']):
                            element.set("vector-effect", "non-scaling-stroke")
                    for child in svg_content:
                        symbol.append(child)
                
                # Metadata (Important: path uses the actual SVG location for masking)
                icon_metadata.append({
                    "id": icon_id,
                    "viewBox": viewBox,
                    "type": asset_type,
                    "category": category,
                    "path": f"./svg/backgrounds/{svg_file}" if is_background_folder else None
                })
                
                print(f"Processed: {icon_id} (Type: {asset_type})")
            except Exception as e:
                print(f"Error processing {file_path}: {e}")

    # 4. Save SVG sprite (even if empty, it prevents the JS error)
    sprite_path = os.path.join(output_folder, full_file_name)
    with open(sprite_path, "wb") as f:
        f.write(ET.tostring(sprite_root, encoding="utf-8", xml_declaration=True))
    
    # 5. Save configuration JSON (Including spriteFile)
    config = {
        "spriteName": file_name,
        "spriteUrl": f"./dist/{full_file_name}", 
        "spriteFile": f"./dist/{full_file_name}", 
        "icons": icon_metadata,
        "colors": color_map
    }
    
    config_path = os.path.join(output_folder, f"{file_name}-config.json")
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    
    print(f"\n✓ Done! Files saved in: {output_folder}")

if __name__ == "__main__":
    create_gep_sprite_system()