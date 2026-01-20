import os
import xml.etree.ElementTree as ET

def process_svgs():
    output_dir = "processed_backgrounds"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    CANVAS_W = 1920
    CANVAS_H = 400
    TARGET_ICON_H = 650
    RIGHT_COLUMN_CENTER = 1440

    # This is the key for Chrome: 
    # Ensuring the namespace is handled globally without prefixes
    SVG_NS = "http://www.w3.org/2000/svg"
    ET.register_namespace('', SVG_NS)

    for filename in os.listdir('.'):
        if not filename.lower().endswith('.svg') or filename == "processed_backgrounds":
            continue

        try:
            tree = ET.parse(filename)
            root = tree.getroot()

            # Extract ViewBox
            viewbox = root.get('viewBox')
            if viewbox:
                vb_x, vb_y, vb_w, vb_h = map(float, viewbox.split())
            else:
                vb_x, vb_y = 0.0, 0.0
                vb_w = float(root.get('width', 110).replace('px', ''))
                vb_h = float(root.get('height', 110).replace('px', ''))

            dynamic_scale = TARGET_ICON_H / vb_h
            x_translation = RIGHT_COLUMN_CENTER - ((vb_x + (vb_w / 2)) * dynamic_scale)
            y_translation = (CANVAS_H / 2) - ((vb_y + (vb_h / 2)) * dynamic_scale)

            # Build the new SVG with explicit Namespace for Chrome
            new_svg = ET.Element(f"{{{SVG_NS}}}svg", {
                "viewBox": f"0 0 {CANVAS_W} {CANVAS_H}",
                "width": str(CANVAS_W),
                "height": str(CANVAS_H),
                "fill": "none"
            })

            defs = ET.SubElement(new_svg, f"{{{SVG_NS}}}defs")
            clip = ET.SubElement(defs, f"{{{SVG_NS}}}clipPath", {"id": "canvasClip"})
            ET.SubElement(clip, f"{{{SVG_NS}}}rect", {"width": str(CANVAS_W), "height": str(CANVAS_H)})

            main_g = ET.SubElement(new_svg, f"{{{SVG_NS}}}g", {"clip-path": "url(#canvasClip)"})
            
            transform_str = f"translate({x_translation} {y_translation}) scale({dynamic_scale})"
            transform_g = ET.SubElement(main_g, f"{{{SVG_NS}}}g", {"transform": transform_str})

            # Transfer paths/shapes
            for element in list(root):
                for el in element.iter():
                    # Clean the tag (remove old namespaces)
                    tag_name = el.tag.split('}', 1)[1] if '}' in el.tag else el.tag
                    
                    # Create a clean element in the proper namespace
                    new_el = ET.SubElement(transform_g, f"{{{SVG_NS}}}{tag_name}")
                    
                    # Transfer attributes
                    for attr_name, attr_value in el.attrib.items():
                        if 'style' not in attr_name: # Skip styles
                            new_el.set(attr_name, attr_value)
                    
                    # Force our styles
                    new_el.set('fill', 'none')
                    new_el.set('stroke', '#000000')
                    new_el.set('stroke-width', '2')
                    new_el.set('vector-effect', 'non-scaling-stroke')
                    new_el.set('stroke-linecap', 'round')
                    new_el.set('stroke-linejoin', 'round')
                    
                    # If the element has specific data (like path 'd')
                    if 'd' in el.attrib:
                        new_el.set('d', el.attrib['d'])

            output_path = os.path.join(output_dir, filename)
            
            # Use a more robust writing method to ensure Chrome recognizes the file
            with open(output_path, "wb") as f:
                content = ET.tostring(new_svg, encoding="utf-8", xml_declaration=True)
                f.write(content)
            
            print(f"✓ Chrome-Ready: {filename}")

        except Exception as e:
            print(f"✗ Error: {filename} -> {e}")

if __name__ == "__main__":
    process_svgs()