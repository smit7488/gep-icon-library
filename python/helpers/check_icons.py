import os
import shutil
from xml.etree import ElementTree as ET

def parse_style(style_str):
    if not style_str: return {}
    pairs = [item.split(":", 1) for item in style_str.split(";") if ":" in item]
    return {k.strip().lower(): v.strip() for k, v in pairs}

def has_stroke(filepath):
    """Returns True if the file contains any stroke properties."""
    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
        for el in root.iter():
            # Check attribute
            s_attr = el.attrib.get("stroke", "").lower()
            if s_attr and s_attr != "none":
                return True
            # Check style string
            if "style" in el.attrib:
                style_dict = parse_style(el.attrib["style"])
                s_val = style_dict.get("stroke", "").lower()
                if s_val and s_val != "none":
                    return True
        return False
    except:
        return False

def main():
    source_dir = "."
    target_dir = "Sorted_Icons"
    fill_dir = os.path.join(target_dir, "Fill_Only")
    stroke_dir = os.path.join(target_dir, "Has_Strokes")

    # Create directory structure
    for d in [fill_dir, stroke_dir]:
        os.makedirs(d, exist_ok=True)

    svgs = [f for f in os.listdir(source_dir) if f.lower().endswith(".svg")]
    
    print(f"Sorting {len(svgs)} icons...")

    counts = {"fill": 0, "stroke": 0}

    for svg in svgs:
        src_path = os.path.join(source_dir, svg)
        
        if has_stroke(src_path):
            shutil.copy2(src_path, os.path.join(stroke_dir, svg))
            counts["stroke"] += 1
        else:
            shutil.copy2(src_path, os.path.join(fill_dir, svg))
            counts["fill"] += 1

    print(f"\nFinished!")
    print(f"  > Fills moved to /Fill_Only: {counts['fill']}")
    print(f"  > Strokes moved to /Has_Strokes: {counts['stroke']}")
    print(f"Check the '{target_dir}' folder.")

if __name__ == "__main__":
    main()