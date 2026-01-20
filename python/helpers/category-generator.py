import json
import re

def auto_assign_categories():
    """
    Automatically assigns categories to icons based on their ID and tags.
    Categories: dental, medical, corporate, team-schein, product, business, marketing, design-elements, diversity
    """
    
    print("=" * 60)
    print("Auto-Assign Categories Script")
    print("=" * 60)
    print()
    
    # Get input file
    input_file = input("Enter input JSON filename (default: icon-tags.json): ").strip()
    if not input_file:
        input_file = "icon-tags.json"
    
    # Get output file
    output_file = input("Enter output JSON filename (default: icon-tags-categorized.json): ").strip()
    if not output_file:
        output_file = "icon-tags-categorized.json"
    
    try:
        # Read the JSON file
        print(f"\n📖 Reading {input_file}...")
        with open(input_file, 'r', encoding='utf-8') as f:
            icon_data = json.load(f)
        
        print(f"✓ Loaded {len(icon_data)} icons")
        print()
        
        # Category detection rules
        category_rules = {
            'dental': {
                'name_keywords': ['dental', 'tooth', 'teeth', 'bur', 'endodontic', 'prophy', 'amalgam', 'composite'],
                'tag_keywords': ['dental', 'tooth', 'teeth', 'bur', 'filling', 'cavity', 'enamel', 'gum', 'orthodontic', 'crown', 'bridge']
            },
            'medical': {
                'name_keywords': ['medical', 'bandage', 'pharma', 'lab', 'test', 'vaccine', 'syringe', 'stethoscope', 'hospital', 'clinic', 'patient', 'specimen', 'blood', 'gloves', 'mask', 'ppe', 'surgical', 'wound', 'cardiology', 'exam', 'diagnostic', 'orthopedic', 'diabetes', 'oxygen', 'scopes', 'microscope'],
                'tag_keywords': ['medical', 'health', 'healthcare', 'medicine', 'doctor', 'nurse', 'patient', 'treatment', 'surgery', 'hospital', 'clinic', 'pharmaceutical', 'drug', 'medication', 'diagnosis', 'bandage', 'wound', 'injury', 'safety', 'protection', 'ppe', 'sterile', 'hygienic']
            },
            'product': {
                'name_keywords': ['product-categories', 'absorbent', 'acrylics', 'alginate', 'alloys', 'anesthetics', 'apparel', 'autoclaves', 'cabinetry', 'cadcam', 'capital-equipment', 'chairs', 'cleaners', 'composites', 'curing', 'desensitizing', 'disposable', 'equipment', 'eyewear', 'furniture', 'gutta', 'gypsum', 'hand-hygiene', 'hi-tech', 'imaging', 'impression', 'incontinence', 'infection-control', 'instruments', 'irrigating', 'lab-coats', 'lancets', 'matrix', 'medicaments', 'mixing', 'nebulizers', 'nitrous', 'obturation', 'organizers', 'pins-posts', 'pipettes', 'pit-fissure', 'prophy', 'protective', 'putty', 'restraints', 'rotary', 'rubber-dam', 'scanner', 'small-equipment', 'specimen', 'spirometers', 'supplies', 'surface', 'syringe', 'temporary', 'toothbrush', 'topical', 'tourniquets', 'ultrasonic', 'unisex', 'unwrap', 'vinyl', 'water-cleaning'],
                'tag_keywords': ['product', 'supplies', 'equipment', 'tool', 'instrument', 'device', 'kit', 'set']
            },
            'corporate': {
                'name_keywords': ['corporate-focus', 'fortune', 'admired', 'centers', 'business-standards', 'governance', 'code-of-ethics', 'strategic', 'shareholder'],
                'tag_keywords': ['corporate', 'company', 'organization', 'enterprise', 'governance', 'compliance', 'ethics', 'standards', 'professional']
            },
            'team-schein': {
                'name_keywords': ['team-schein', 'schein-together', 'team-schein-member', 'volunteerism'],
                'tag_keywords': ['team-schein', 'schein', 'culture', 'values', 'employees', 'staff', 'workforce', 'volunteer']
            },
            'business': {
                'name_keywords': ['business-concepts', 'business_'],
                'tag_keywords': ['business', 'strategy', 'planning', 'management', 'operations', 'workflow', 'process', 'efficiency', 'productivity', 'growth', 'success', 'goal', 'target', 'achievement', 'performance', 'analysis', 'data', 'chart', 'graph', 'report']
            },
            'marketing': {
                'name_keywords': ['marketing'],
                'tag_keywords': ['marketing', 'advertising', 'promotion', 'campaign', 'brand', 'communication', 'message', 'audience', 'engagement']
            },
            'design-elements': {
                'name_keywords': ['design-elements'],
                'tag_keywords': ['geometric', 'shape', 'pattern', 'abstract', 'decoration', 'ornament']
            },
            'diversity': {
                'name_keywords': ['diversity-inclusion', 'elevasian', 'colegas', 'wln', 'black-legacy'],
                'tag_keywords': ['diversity', 'inclusion', 'equality', 'culture', 'heritage', 'community']
            },
            'hs-cares': {
                'name_keywords': ['hs-cares', 'social-responsibility', 'sustainability', 'environment'],
                'tag_keywords': ['social-responsibility', 'sustainability', 'environment', 'community', 'giving', 'impact']
            }
        }
        
        # Track statistics
        stats = {cat: 0 for cat in category_rules.keys()}
        already_categorized = 0
        newly_categorized = 0
        
        # Process each icon
        print("🔄 Analyzing icons and assigning categories...")
        print()
        
        for icon_id, icon_info in icon_data.items():
            # Skip if already has categories
            if icon_info.get('categories') and len(icon_info['categories']) > 0:
                already_categorized += 1
                continue
            
            # Initialize categories if not present
            if 'categories' not in icon_info:
                icon_info['categories'] = []
            
            # Get lowercase versions for matching
            icon_id_lower = icon_id.lower()
            tags_lower = [tag.lower() for tag in icon_info.get('tags', [])]
            
            # Check each category
            assigned_categories = []
            
            for category, rules in category_rules.items():
                # Check name keywords
                name_match = any(keyword in icon_id_lower for keyword in rules['name_keywords'])
                
                # Check tag keywords
                tag_match = any(
                    any(keyword in tag for keyword in rules['tag_keywords'])
                    for tag in tags_lower
                )
                
                # Assign if matches
                if name_match or tag_match:
                    if category not in assigned_categories:
                        assigned_categories.append(category)
            
            # Assign categories
            if assigned_categories:
                icon_info['categories'] = assigned_categories
                newly_categorized += 1
                for cat in assigned_categories:
                    stats[cat] += 1
        
        # Save the categorized data
        print(f"💾 Saving to {output_file}...")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(icon_data, f, indent=2, ensure_ascii=False)
        
        # Show results
        print("\n" + "=" * 60)
        print("✅ Categorization Complete!")
        print("=" * 60)
        print(f"\n📊 Summary:")
        print(f"   Total icons: {len(icon_data)}")
        print(f"   Already categorized: {already_categorized}")
        print(f"   Newly categorized: {newly_categorized}")
        print(f"   Still uncategorized: {len(icon_data) - already_categorized - newly_categorized}")
        print()
        print(f"📋 Categories assigned:")
        for category, count in sorted(stats.items(), key=lambda x: x[1], reverse=True):
            if count > 0:
                print(f"   {category}: {count} icons")
        print()
        print(f"✓ Output saved to: {output_file}")
        print()
        print("📋 Next steps:")
        print("   1. Review the categorized file")
        print("   2. Make any manual adjustments if needed")
        print("   3. Import into tag manager")
        print("   4. Export final version")
        print()
        
    except FileNotFoundError:
        print(f"❌ Error: File '{input_file}' not found")
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in '{input_file}'")
        print(f"   {str(e)}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    try:
        auto_assign_categories()
    except KeyboardInterrupt:
        print("\n\n❌ Categorization cancelled by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")