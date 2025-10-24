import sys
import json

def is_numeric(s):
    """Check if a string represents a numeric value."""
    try:
        float(s)  # Changed from int to float for more general applicability
        return True
    except ValueError:
        return False

def select_profile(voltage, top_threshold, bottom_threshold, presets):
    """Select the most suitable profile based on voltage and thresholds."""
    # Filter presets to those with numeric names if applicable
    numeric_presets = [preset for preset in presets if is_numeric(preset['name'])]
    
    # Sort numeric presets by name assuming it's indicative of their suitability
    sorted_presets = sorted(numeric_presets, key=lambda x: float(x['name']), reverse=True)
    
    # Default to the first available preset if no suitable one is found
    selected_profile = presets[0]['name'] if presets else "No profile available"
    
    # Logic to select the profile
    for preset in sorted_presets:
        preset_voltage = float(preset['name'])
        if preset_voltage >= top_threshold:
            selected_profile = preset['name']
            break
        elif preset_voltage <= bottom_threshold:
            selected_profile = preset['name']  # Assuming lower thresholds are handled similarly
            break
        # Add more conditions as needed

    return selected_profile

if __name__ == "__main__":
    # Ensure correct number of arguments are passed
    if len(sys.argv) != 5:
        print("Usage: python select_profile.py <voltage> <top_threshold> <bottom_threshold> <presets_json_path>", file=sys.stderr)
        sys.exit(1)
    
    voltage = float(sys.argv[1])
    top_threshold = float(sys.argv[2])
    bottom_threshold = float(sys.argv[3])
    presets_json_path = sys.argv[4]
    
    try:
        # Assuming the presets JSON is provided as a filepath
        with open(presets_json_path, 'r') as file:
            presets_json = file.read()
        presets = json.loads(presets_json)
    except Exception as e:
        print(f"Error reading or parsing presets JSON: {e}", file=sys.stderr)
        sys.exit(1)
    
    selected_profile = select_profile(voltage, top_threshold, bottom_threshold, presets)
    print(selected_profile)

