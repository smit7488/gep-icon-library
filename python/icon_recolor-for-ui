import os
import sys
from xml.etree import ElementTree as ET

WHITE_VALUES = {
    "white", "#fff", "#ffffff",
    "rgb(255,255,255)", "rgba(255,255,255,1)"
}

TRANSPARENT_VALUES = {
    "none", "transparent", "rgba(0,0,0,0)"
}

def parse_style(style_str):
    if not style_str:
        return {}
    pairs = [item.split(":", 1) for item in style_str.split(";") if ":" in item]
    return {k.strip().lower(): v.strip() for k, v in pairs}

def is_white_or_transparent(val):
    if not val:
        return False
    v = val.lower().replace(" ", "")
    return v in WHITE_VALUES or v in TRANSPARENT_VALUES

def convert_to_css_ready(src, dest):
    ET.register_namespace("", "http://www.w3.org/2000/svg")

    try:
        tree = ET.parse(src)
        root = tree.getroot()
    except Exception as e:
        print(f"Error parsing {src}: {e}")
        return

    for el in root.iter():

        # ---- Handle style="" ----
        if "style" in el.attrib:
            style = parse_style(el.attrib["style"])

            # Fill logic
            fill = style.get("fill")
            if is_white_or_transparent(fill):
                style["fill"] = "none"
            elif fill and fill != "none":
                style["fill"] = "currentColor"

            # Stroke logic
            stroke = style.get("stroke")
            if is_white_or_transparent(stroke):
                style["stroke"] = "none"
                style["stroke-width"] = "0"
            elif stroke and stroke != "none":
                style["stroke"] = "currentColor"
                style["stroke-width"] = "1.5"  # Set stroke-width to 1.5

            el.attrib["style"] = ";".join(f"{k}:{v}" for k, v in style.items())

        # ---- Handle direct attributes ----
        fill = el.attrib.get("fill")
        if is_white_or_transparent(fill):
            el.attrib["fill"] = "none"
        elif fill and fill != "none":
            el.attrib["fill"] = "currentColor"

        stroke = el.attrib.get("stroke")
        if is_white_or_transparent(stroke):
            el.attrib["stroke"] = "none"
            el.attrib["stroke-width"] = "0"
        elif stroke and stroke != "none":
            el.attrib["stroke"] = "currentColor"
            el.attrib["stroke-width"] = "1.5"  # Set stroke-width to 1.5

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

    print("\nDone! All icons now use currentColor and 1.5 stroke-width where applicable.")

if __name__ == "__main__":
    main()