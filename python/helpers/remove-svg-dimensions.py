import os
import sys
from xml.etree import ElementTree as ET

def convert_for_masks(src, dest):
    ET.register_namespace("", "http://www.w3.org/2000/svg")
    try:
        tree = ET.parse(src)
        root = tree.getroot()
    except: return

    # Remove fixed dimensions so it scales to the CSS container
    if 'width' in root.attrib: del root.attrib['width']
    if 'height' in root.attrib: del root.attrib['height']

    for el in root.iter():
        # Force the stroke to be solid for the mask to pick it up
        if "stroke" in el.attrib and el.attrib["stroke"] != "none":
            el.attrib["stroke"] = "black" 
            el.attrib["stroke-width"] = "1.5"
        
        # Style attribute handling
        if "style" in el.attrib:
            if "stroke:" in el.attrib["style"]:
                # Simple replacement to ensure the mask is opaque
                el.attrib["style"] = el.attrib["style"].replace("stroke:#0072BC", "stroke:black")
                # Ensure thickness
                if "stroke-width" not in el.attrib["style"]:
                     el.attrib["style"] += ";stroke-width:1.5"

    tree.write(dest, encoding="utf-8", xml_declaration=True)