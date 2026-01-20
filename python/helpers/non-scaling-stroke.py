import os
import xml.etree.ElementTree as ET

OUTPUT_DIR = "non-scaling-stroke"
TARGET_STROKE_WIDTH = "2"

SVG_TAGS_WITH_STROKE = {
    "path",
    "line",
    "polyline",
    "polygon",
    "rect",
    "circle",
    "ellipse",
}

def process_svg(input_path, output_path):
    tree = ET.parse(input_path)
    root = tree.getroot()

    # Detect namespace
    if root.tag.startswith("{"):
        ns = root.tag.split("}")[0] + "}"
    else:
        ns = ""

    # ✅ FORCE stroke-width on root <svg>
    root.set("stroke-width", TARGET_STROKE_WIDTH)

    # Optional but recommended: ensure stroke exists
    if "stroke" not in root.attrib:
        root.set("stroke", "currentColor")

    for elem in root.iter():
        tag = elem.tag.replace(ns, "")

        if tag in SVG_TAGS_WITH_STROKE:
            elem.set("vector-effect", "non-scaling-stroke")
            elem.set("stroke-width", TARGET_STROKE_WIDTH)

    tree.write(output_path, encoding="utf-8", xml_declaration=True)

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for filename in os.listdir("."):
        if filename.lower().endswith(".svg"):
            input_path = filename
            output_path = os.path.join(OUTPUT_DIR, filename)

            try:
                process_svg(input_path, output_path)
                print(f"Created: {output_path}")
            except Exception as e:
                print(f"Failed: {filename} — {e}")

if __name__ == "__main__":
    main()
