import os
import hashlib
import shutil
import xml.etree.ElementTree as ET

BASE_FOLDER = os.path.dirname(os.path.abspath(__file__))
DUPLICATE_FOLDER = os.path.join(BASE_FOLDER, "duplicates")

os.makedirs(DUPLICATE_FOLDER, exist_ok=True)


def normalize_svg(path):
    """
    Normalize SVG to ignore formatting differences.
    """
    try:
        tree = ET.parse(path)
        root = tree.getroot()

        def normalize_element(elem):
            # Sort attributes for consistency
            attrib = sorted(elem.attrib.items())
            elem.attrib.clear()
            elem.attrib.update(attrib)

            # Trim whitespace
            if elem.text:
                elem.text = elem.text.strip()
            if elem.tail:
                elem.tail = elem.tail.strip()

            for child in elem:
                normalize_element(child)

        normalize_element(root)
        return ET.tostring(root, encoding="utf-8")

    except Exception as e:
        print(f"⚠️ Skipping {os.path.basename(path)}: {e}")
        return None


def hash_content(content):
    return hashlib.sha256(content).hexdigest()


def find_and_move_duplicates():
    seen_hashes = {}
    moved = []

    for filename in os.listdir(BASE_FOLDER):
        if not filename.lower().endswith(".svg"):
            continue

        src_path = os.path.join(BASE_FOLDER, filename)

        # Skip already-moved files
        if DUPLICATE_FOLDER in src_path:
            continue

        normalized = normalize_svg(src_path)
        if not normalized:
            continue

        file_hash = hash_content(normalized)

        if file_hash in seen_hashes:
            original = seen_hashes[file_hash]

            dest_path = os.path.join(DUPLICATE_FOLDER, filename)

            # Prevent overwrite in duplicates folder
            if os.path.exists(dest_path):
                base, ext = os.path.splitext(filename)
                i = 1
                while os.path.exists(dest_path):
                    dest_path = os.path.join(
                        DUPLICATE_FOLDER, f"{base}_{i}{ext}"
                    )
                    i += 1

            shutil.move(src_path, dest_path)
            moved.append((filename, original))

        else:
            seen_hashes[file_hash] = filename

    return moved


if __name__ == "__main__":
    moved_duplicates = find_and_move_duplicates()

    if not moved_duplicates:
        print("✅ No duplicate SVGs found.")
    else:
        print("🗂️ Duplicates moved to ./duplicates/\n")
        for dup, original in moved_duplicates:
            print(f"- {dup} → duplicate of {original}")
