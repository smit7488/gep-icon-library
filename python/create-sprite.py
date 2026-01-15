import os
import sys
import json
from xml.etree import ElementTree as ET

def create_gep_sprite_system():
    # 1. Setup Configuration
    file_name = input("Enter name for sprite file (e.g. hs-pictographs): ").strip() or "hs-pictographs"
    
    full_file_name = f"{file_name}.svg"
    full_sprite_url = f"https://www.henryschein.com/images/assets/gep/{full_file_name}"
    
    output_folder = "Generated_Sprites"
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # 2. GEP Color Library
    color_map = {
        "Primary Blues": {
            "icon-blue": "#0072BC", "icon-blue-t4": "#80B9DE", "icon-blue-t3": "#B3D5EB", 
            "icon-blue-t2": "#E6F1F9", "icon-blue-t1": "#F5F9FC",
            "icon-dark-blue": "#002F6E", "icon-dark-blue-t4": "#8098B7", "icon-dark-blue-t3": "#B3C1D4", 
            "icon-dark-blue-t2": "#E6EBF1", "icon-dark-blue-t1": "#F5F7F9",
            "icon-light-blue": "#3DB5E6", "icon-light-blue-t4": "#9FDBF3", "icon-light-blue-t3": "#C5E9F8", 
            "icon-light-blue-t2": "#ECF8FD", "icon-light-blue-t1": "#F7FCFE"
        },
        "Brand Accents": {
            "icon-green": "#008996", "icon-green-t4": "#80C5CB", "icon-green-t3": "#B3DCE0", 
            "icon-green-t2": "#E6F4F5", "icon-green-t1": "#F5FAFB",
            "icon-red": "#ED1C24", "icon-red-t4": "#F7BE92", "icon-red-t3": "#FABBB0", 
            "icon-red-t2": "#FEE9EA", "icon-red-t1": "#FFF6F6",
            "icon-orange": "#F28B00", "icon-orange-t4": "#FFFAF5", "icon-orange-t3": "#FEF4E6", 
            "icon-orange-t2": "#FBDCB3", "icon-orange-t1": "#F9C680",
            "icon-violet": "#831A5B", "icon-violet-t4": "#C2BDAE", "icon-violet-t3": "#DABACE", 
            "icon-violet-t2": "#F3E9EF", "icon-violet-t1": "#FAF6F8"
        },
        "Neutrals": {
            "icon-dark-gray": "#474F50", "icon-gray": "#6B6F70", "icon-light-gray-1": "#F7F7F6", 
            "icon-light-gray-2": "#E6E6E6", "icon-black": "#000000", "icon-white": "#FFFFFF"
        }
    }

    sprite_root = ET.Element("svg", {"xmlns": "http://www.w3.org/2000/svg", "style": "display: none;"})
    svgs = [f for f in os.listdir(".") if f.lower().endswith(".svg")]
    
    if not svgs:
        sys.exit("Error: No individual SVG files found.")

    # 3. Build sprite and collect icon metadata
    icon_metadata = []
    
    for svg_file in svgs:
        icon_id = os.path.splitext(svg_file)[0]
        try:
            tree = ET.parse(svg_file)
            root = tree.getroot()
            viewBox = root.get("viewBox", "0 0 110 110")
            
            # Add to sprite
            symbol = ET.SubElement(sprite_root, "symbol", {"id": icon_id, "viewBox": viewBox})
            for child in root:
                symbol.append(child)
            
            # Collect metadata
            icon_metadata.append({
                "id": icon_id,
                "viewBox": viewBox
            })
            
            print(f"Merged: {icon_id}")
        except Exception as e:
            print(f"Error processing {svg_file}: {e}")

    # 4. Save SVG sprite
    sprite_path = os.path.join(output_folder, full_file_name)
    with open(sprite_path, "wb") as f:
        f.write(ET.tostring(sprite_root, encoding="utf-8", xml_declaration=True))
    
    # 5. Save configuration JSON
    config = {
        "spriteName": file_name,
        "spriteUrl": full_sprite_url,
        "spriteFile": full_file_name,
        "icons": icon_metadata,
        "colors": color_map
    }
    
    config_path = os.path.join(output_folder, f"{file_name}-config.json")
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    
    print(f"\n✓ Sprite saved: {sprite_path}")
    print(f"✓ Config saved: {config_path}")
    print(f"\nNext steps:")
    print(f"1. Copy the HTML viewer to your output folder")
    print(f"2. Update the config file name in the HTML if needed")
    print(f"3. Open the HTML file in a browser")

if __name__ == "__main__":
    create_gep_sprite_system()