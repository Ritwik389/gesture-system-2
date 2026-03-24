from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import json
import time
from pathlib import Path

from config_store import load_config, save_config, ensure_data_dir, DATA_DIR
from model_trainer import trainer
from mac_commander import execute_action

FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ensure_data_dir()

class GestureConfig(BaseModel):
    id: str
    name: str
    action: str
    appPath: str = ""
    emoji: str = ""

@app.get("/api/config")
def get_config():
    return load_config()

@app.post("/api/config")
def update_config(gestures: list[GestureConfig]):
    config = load_config()
    config["gestures"] = [g.dict() for g in gestures]
    save_config(config)
    return {"success": True}

@app.post("/api/gestures/{gesture_id}/data")
async def save_gesture_data(gesture_id: str, request: dict):
    # request should contain 'samples': list of 63-dim arrays
    samples = request.get("samples", [])
    file_path = DATA_DIR / f"{gesture_id}.json"
    
    existing = []
    if file_path.exists():
        with open(file_path, "r") as f:
            existing = json.load(f)
            
    existing.extend(samples)
    
    with open(file_path, "w") as f:
        json.dump(existing, f)
        
    return {"success": True, "total_samples": len(existing)}

@app.delete("/api/gestures/{gesture_id}")
async def delete_gesture(gesture_id: str):
    config = load_config()
    config["gestures"] = [g for g in config["gestures"] if g["id"] != gesture_id]
    save_config(config)
    
    file_path = DATA_DIR / f"{gesture_id}.json"
    if file_path.exists():
        file_path.unlink()
    return {"success": True}

@app.post("/api/train")
def train_model():
    result = trainer.train()
    return result

@app.websocket("/ws/predict")
async def websocket_predict(websocket: WebSocket):
    await websocket.accept()
    
    config = load_config()
    threshold = config["settings"].get("confidenceThreshold", 0.85)
    cooldown = config["settings"].get("cooldownMs", 1500) / 1000.0
    
    last_trigger_time = 0
    last_builtin_time = 0
    builtin_cooldown = 0.5  # 500ms
    active = True
    
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            if "command" in payload:
                if payload["command"] == "pause":
                    active = False
                elif payload["command"] == "resume":
                    active = True
                elif payload["command"] == "sync_config":
                    config = load_config()
                    threshold = config["settings"].get("confidenceThreshold", 0.85)
                    cooldown = config["settings"].get("cooldownMs", 1500) / 1000.0
                continue
                
            if not active:
                continue

            if 'builtin' in payload:
                builtin = payload['builtin']
                print(f"Received builtin: {builtin}")
                now = time.time()
                if now - last_builtin_time > builtin_cooldown:
                    if builtin == 'pointer':
                        x = payload.get('x')
                        y = payload.get('y')
                        videoWidth = payload.get('videoWidth', 640)
                        videoHeight = payload.get('videoHeight', 480)
                        if x is not None and y is not None:
                            execute_action('pointer_move', f"{x},{y},{videoWidth},{videoHeight}")
                            await websocket.send_json({'type': 'builtin', 'gesture': 'full_palm', 'action': 'pointer_move', 'x': x, 'y': y})
                    elif builtin == 'left_click':
                        execute_action('left_click')
                        await websocket.send_json({'type': 'builtin', 'gesture': 'index_thumb_pinch', 'action': 'left_click'})
                    elif builtin == 'right_click':
                        execute_action('right_click')
                        await websocket.send_json({'type': 'builtin', 'gesture': 'pinky_thumb_pinch', 'action': 'right_click'})
                    last_builtin_time = now
                continue

            landmarks = payload.get("landmarks")
            if not landmarks or len(landmarks) != 63:
                continue

            predicted_class, confidence = trainer.predict(landmarks)

            # Send status update
            await websocket.send_json({
                "type": "prediction",
                "gesture": predicted_class,
                "confidence": confidence
            })
            
            if predicted_class and confidence >= threshold:
                now = time.time()
                if now - last_trigger_time > cooldown:
                    current_config = load_config()
                    action = None
                    app_path = None
                    for g in current_config.get("gestures", []):
                        if g["id"] == predicted_class:
                           action = g["action"]
                           app_path = g.get("appPath")
                           break
                    
                    if action:
                        execute_action(action, app_path)
                        last_trigger_time = now
                        await websocket.send_json({
                            "type": "trigger", 
                            "gesture": predicted_class,
                            "action": action,
                            "confidence": confidence
                        })
                        
    except WebSocketDisconnect:
        pass

# Serve React static files (must be AFTER all API/WS routes)
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/")
    async def serve_root():
        return FileResponse(str(FRONTEND_DIST / "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIST / "index.html"))
else:
    print(f"WARNING: Frontend dist not found at {FRONTEND_DIST}")

    @app.get("/")
    async def no_frontend():
        return {"error": "Frontend not built. Run 'npm run build' in the frontend folder."}
