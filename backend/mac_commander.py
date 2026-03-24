import subprocess

def get_screen_size():
    try:
        result = subprocess.run(["osascript", "-e", 'tell application "Finder" to get bounds of window of desktop'], capture_output=True, text=True, check=True)
        bounds = result.stdout.strip().split(', ')
        return int(bounds[2]), int(bounds[3])  # width, height
    except Exception as e:
        print(f"Failed to get screen size: {e}, using fallback 1920x1080")
        return 1920, 1080

def execute_action(action_key: str, app_path: str | None = None):
    try:
        if action_key == "none":
            return
        elif action_key == "switch_tab":
            subprocess.run(["osascript", "-e", 'tell application "System Events" to key code 48 using control down'])
        elif action_key == "close_tab":
            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke "w" using command down'])
        elif action_key == "play_pause":
            # Spacebar overrides active media, and Music handles background
            subprocess.run(["osascript", "-e", 'try\ntell application "Music" to playpause\nend try'])
            subprocess.run(["osascript", "-e", 'try\ntell application "Spotify" to playpause\nend try'])
            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke space'])
        elif action_key == "next_track":
            subprocess.run(["osascript", "-e", 'try\ntell application "Music" to next track\nend try'])
        elif action_key == "open_app" and app_path:
            # The 'open' command dynamically handles partial names ("Calculator") or paths ("/Applications/..")
            if app_path.endswith(".app"):
                subprocess.run(["open", app_path])
            else:
                subprocess.run(["open", "-a", app_path])
        elif action_key == "show_desktop":
            subprocess.run(["osascript", "-e", 'tell application "System Events" to key code 103'])
        elif action_key == "volume_up":
            subprocess.run(["osascript", "-e", 'set volume output volume (output volume of (get volume settings) + 10)'])
        elif action_key == "volume_down":
            subprocess.run(["osascript", "-e", 'set volume output volume (output volume of (get volume settings) - 10)'])
        elif action_key == "mute_toggle":
            subprocess.run(["osascript", "-e", 'set volume output muted not (output muted of (get volume settings))'])
        elif action_key == "pointer_move" and app_path:
            try:
                parts = app_path.split(',')
                x = int(float(parts[0]))
                y = int(float(parts[1]))
                videoWidth = int(float(parts[2])) if len(parts) > 2 else 640
                videoHeight = int(float(parts[3])) if len(parts) > 3 else 480
                screen_width, screen_height = get_screen_size()
                # Flip x because video is mirrored
                x_screen = screen_width - int(x * screen_width / videoWidth)
                y_screen = int(y * screen_height / videoHeight)
                print(f"Moving pointer to {x_screen}, {y_screen}")
                subprocess.run(["osascript", "-e", "tell application \"System Events\" to set the mouse position to {" + str(x_screen) + "," + str(y_screen) + "}"])
            except Exception as e:
                print(f"pointer_move failed: {e}")
        elif action_key == "left_click":
            print("Executing left_click")
            subprocess.run(["osascript", "-e", 'tell application "System Events" to click'"])
        elif action_key == "right_click":
            print("Executing right_click")
            subprocess.run(["osascript", "-e", 'tell application "System Events" to key down control'])
            subprocess.run(["osascript", "-e", 'tell application "System Events" to click'])
            subprocess.run(["osascript", "-e", 'tell application "System Events" to key up control'])
        else:
            print(f"Unknown action: {action_key}")
            return
            
        print(f"Executed action: {action_key}")
    except Exception as e:
        print(f"Error executing action {action_key}: {e}")
