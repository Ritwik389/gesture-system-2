import json
import numpy as np
import pickle
from pathlib import Path
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

from config_store import DATA_DIR, load_config

MODEL_PATH = Path(__file__).parent / "gesture_model.pkl"

class GestureModel:
    def __init__(self):
        self.model = None
        self.classes = []
        self.load_model()
        
    def load_model(self):
        if MODEL_PATH.exists():
            with open(MODEL_PATH, "rb") as f:
                data = pickle.load(f)
                self.model = data["model"]
                self.classes = data["classes"]
                
    def train(self) -> dict:
        """Reads all JSON files in data directory and trains the MLP with stratified split."""
        X = []
        y = []
        
        if not DATA_DIR.exists():
            return {"success": False, "error": "No data directory found."}
            
        # load valid gestures from config
        config = load_config()
        valid_gesture_ids = {g["id"] for g in config.get("gestures", [])}
            
        for file in DATA_DIR.glob("*.json"):
            gesture_name = file.stem
            if gesture_name not in valid_gesture_ids:
                continue # Ignore data for deleted gestures
                
            with open(file, "r") as f:
                samples = json.load(f)
                for s in samples:
                    X.append(s)
                    y.append(gesture_name)
                    
        if len(X) < 10:
            return {"success": False, "error": "Not enough data to train."}
            
        X = np.array(X)
        y = np.array(y)
        self.classes = list(np.unique(y))
        
        class_counts = {c: list(y).count(c) for c in self.classes}
        min_samples = min(class_counts.values()) if class_counts else 0
        
        if len(self.classes) < 2:
            return {"success": False, "error": "Need at least 2 distinct gestures configured to train."}
            
        if min_samples < 2:
            return {"success": False, "error": "Need at least 2 samples per gesture for stratified split."}
            
        # Perform Stratified Split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
        
        # Train lightweight MLP
        clf = MLPClassifier(hidden_layer_sizes=(32, 16), max_iter=500, random_state=42)
        clf.fit(X_train, y_train)
        
        # Evaluate Accuracy
        y_pred = clf.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        
        self.model = clf
        with open(MODEL_PATH, "wb") as f:
            pickle.dump({"model": self.model, "classes": self.classes}, f)
            
        return {"success": True, "accuracy": round(acc * 100, 2), "classes": self.classes}
        
    def predict(self, landmarks: list):
        if not self.model:
            return None, 0.0
            
        # landmarks is 1x63 list
        X_in = np.array([landmarks])
        probs = self.model.predict_proba(X_in)[0]
        max_idx = np.argmax(probs)
        confidence = probs[max_idx]
        predicted_class = self.model.classes_[max_idx]
        
        return predicted_class, confidence

trainer = GestureModel()
