import os
import sys
from xml.etree import ElementTree as ET

def parse_style(style_str):
    if not style_str: return {}
    pairs = [item.split(":", 1) for item in style_str.split(";") if ":" in item]
    return {k.strip().lower(): v.strip() for k, v in pairs}

def convert_to_css_ready(src, dest):
    ET.register_namespace('', "http://www.w3.org/2000/svg")
    try:
        tree = ET.parse(src)
        root = tree.getroot()
    except Exception as e:
        print(f"Error parsing {src}: {e}")
        return

    # Global Stroke Check
    file_has_stroke = False
    for el in root.iter():
        s_attr = el.attrib.get("stroke", "").lower()
        if s_attr and s_attr != "none":
            file_has_stroke = True
            break
        if "style" in el.attrib:
            style_dict = parse_style(el.attrib["style"])
            if style_dict.get("stroke", "").lower() not in ["", "none"]:
                file_has_stroke = True
                break

    # Apply Logic using 'currentColor'
    for el in root.iter():
        if "style" in el.attrib:
            style_dict = parse_style(el.attrib["style"])
            if file_has_stroke:
                style_dict["fill"] = "none"
                style_dict["stroke"] = "currentColor"
                style_dict["stroke-width"] = "1.5"
            else:
                if style_dict.get("fill", "").lower() != "none":
                    style_dict["fill"] = "currentColor"
                style_dict["stroke"] = "none"
                style_dict["stroke-width"] = "0"
            el.attrib["style"] = ";".join(f"{k}:{v}" for k, v in style_dict.items())

        if "fill" in el.attrib or "stroke" in el.attrib:
            if file_has_stroke:
                el.attrib["fill"] = "none"
                el.attrib["stroke"] = "currentColor"
                el.attrib["stroke-width"] = "1.5"
            else:
                if el.attrib.get("fill", "").lower() != "none":
                    el.attrib["fill"] = "currentColor"
                el.attrib["stroke"] = "none"
                el.attrib["stroke-width"] = "0"

    tree.write(dest, encoding="utf-8", xml_declaration=True)

def main():
    svgs = [f for f in os.listdir(".") if f.lower().endswith(".svg")]
    if not svgs:
        sys.exit("No SVG files found.")

    out_dir = "CSS_Ready_Icons"
    os.makedirs(out_dir, exist_ok=True)

    for svg_file in svgs:
        convert_to_css_ready(svg_file, os.path.join(out_dir, svg_file))
        print(f"Optimized: {svg_file}")

    print(f"\nDone! Use these icons with the CSS classes provided.")

if __name__ == "__main__":
    main()