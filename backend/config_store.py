import json
from pathlib import Path

CONFIG_FILE = Path(__file__).parent / "gestures_config.json"
DATA_DIR = Path(__file__).parent / "data"

def load_config():
    if not CONFIG_FILE.exists():
        default_config = {
            "gestures": [],
            "settings": {
                "confidenceThreshold": 0.85,
                "cooldownMs": 1500
            }
        }
        with open(CONFIG_FILE, "w") as f:
            json.dump(default_config, f, indent=2)
        return default_config
    with open(CONFIG_FILE, "r") as f:
        return json.load(f)

def save_config(config_data):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config_data, f, indent=2)

def ensure_data_dir():
    DATA_DIR.mkdir(exist_ok=True)
