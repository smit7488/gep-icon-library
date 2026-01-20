import json
import sys
import os

def convert_json_format():
    """
    Converts old format:
    {
      "tags": {
        "Business_110": ["tag1", "tag2"],
        "Business_220": ["tag3", "tag4"]
      }
    }
    
    To new format:
    {
      "Business_110": {
        "tags": ["tag1", "tag2"],
        "categories": []
      },
      "Business_220": {
        "tags": ["tag3", "tag4"],
        "categories": []
      }
    }
    """
    
    print("=" * 60)
    print("Icon Tags JSON Format Converter")
    print("=" * 60)
    print()
    
    # Get directory location
    directory = input("Enter directory path (e.g., dist, ./dist, or press Enter for current): ").strip()
    if not directory:
        directory = "."
    
    # Normalize path
    directory = os.path.normpath(directory)
    
    # Check if directory exists
    if not os.path.exists(directory):
        print(f"❌ Error: Directory '{directory}' does not exist")
        create_dir = input(f"Create directory '{directory}'? (y/n): ").lower()
        if create_dir == 'y':
            os.makedirs(directory)
            print(f"✓ Created directory: {directory}")
        else:
            print("❌ Conversion cancelled.")
            return
    
    print(f"\n📁 Working in directory: {os.path.abspath(directory)}")
    print()
    
    # Get input file
    input_file = input("Enter input JSON filename (e.g., old-tags.json): ").strip()
    if not input_file:
        input_file = "icon-tags.json"
    
    # Build full input path
    input_path = os.path.join(directory, input_file)
    
    # Get output file
    output_file = input("Enter output JSON filename (e.g., icon-tags-new.json): ").strip()
    if not output_file:
        output_file = "icon-tags-converted.json"
    
    # Build full output path
    output_path = os.path.join(directory, output_file)
    
    try:
        # Read the old format
        print(f"\n📖 Reading {input_path}...")
        with open(input_path, 'r', encoding='utf-8') as f:
            old_data = json.load(f)
        
        # Check if it's in the old format
        if "tags" in old_data and isinstance(old_data["tags"], dict):
            print("✓ Detected old format (nested under 'tags' key)")
            tags_dict = old_data["tags"]
        elif isinstance(old_data, dict):
            # Check if it's already in new format
            first_key = next(iter(old_data))
            if isinstance(old_data[first_key], dict) and "tags" in old_data[first_key]:
                print("⚠️  File appears to already be in new format!")
                convert_anyway = input("Convert anyway? (y/n): ").lower()
                if convert_anyway != 'y':
                    print("❌ Conversion cancelled.")
                    return
                tags_dict = old_data
            else:
                # Assume it's the flat format
                print("✓ Detected flat format")
                tags_dict = old_data
        else:
            print("❌ Error: Unrecognized JSON format")
            return
        
        # Convert to new format
        print(f"\n🔄 Converting {len(tags_dict)} icons...")
        new_data = {}
        
        for icon_id, tag_list in tags_dict.items():
            # If tag_list is already a dict with tags and categories, keep it
            if isinstance(tag_list, dict):
                new_data[icon_id] = tag_list
            # Otherwise convert it
            else:
                new_data[icon_id] = {
                    "tags": tag_list if isinstance(tag_list, list) else [],
                    "categories": []
                }
        
        # Save to output file
        print(f"\n💾 Saving to {output_path}...")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(new_data, f, indent=2, ensure_ascii=False)
        
        # Show summary
        print("\n" + "=" * 60)
        print("✅ Conversion Complete!")
        print("=" * 60)
        print(f"📊 Summary:")
        print(f"   Total icons converted: {len(new_data)}")
        print(f"   Input file: {input_path}")
        print(f"   Output file: {output_path}")
        print(f"   Full output path: {os.path.abspath(output_path)}")
        print()
        print("📋 Next steps:")
        print("   1. Review the converted file")
        print(f"   2. It's saved in: {directory}/")
        print("   3. Upload via the Tag Manager import feature")
        print("   4. Start adding categories!")
        print()
        
        # Show sample
        sample_icon = next(iter(new_data))
        print("📄 Sample output:")
        print(json.dumps({sample_icon: new_data[sample_icon]}, indent=2))
        print()
        
    except FileNotFoundError:
        print(f"❌ Error: File '{input_path}' not found")
        print(f"   Looking in: {os.path.abspath(directory)}")
        print("   Make sure the file exists in that directory")
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in '{input_path}'")
        print(f"   {str(e)}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    try:
        convert_json_format()
    except KeyboardInterrupt:
        print("\n\n❌ Conversion cancelled by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")