from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Any
import json

router = APIRouter(tags=["Multiplayer WebSocket Battle"])

class ConnectionManager:
    def __init__(self):
        self.active_rooms: Dict[str, List[WebSocket]] = {}
        self.room_players: Dict[str, Dict[str, Any]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = []
            self.room_players[room_id] = {}
        self.active_rooms[room_id].append(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_rooms:
            if websocket in self.active_rooms[room_id]:
                self.active_rooms[room_id].remove(websocket)
            if not self.active_rooms[room_id]:
                del self.active_rooms[room_id]
                if room_id in self.room_players:
                    del self.room_players[room_id]

    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.active_rooms:
            payload = json.dumps(message)
            for connection in self.active_rooms[room_id]:
                try:
                    await connection.send_text(payload)
                except Exception:
                    pass

manager = ConnectionManager()

@router.websocket("/ws/battle/{room_id}")
async def websocket_battle_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(room_id, websocket)
    try:
        while True:
            data_raw = await websocket.receive_text()
            data = json.loads(data_raw)
            event_type = data.get("type", "update")

            if event_type == "join":
                player_name = data.get("player_name", "Anonymous")
                avatar = data.get("avatar", "User")
                manager.room_players[room_id][player_name] = {
                    "avatar": avatar,
                    "score": 0,
                    "progress": 0
                }
                await manager.broadcast(room_id, {
                    "type": "player_joined",
                    "player_name": player_name,
                    "avatar": avatar,
                    "players": manager.room_players[room_id],
                    "message": f"{player_name} stepped into the Battle Arena!"
                })

            elif event_type == "score_update":
                player_name = data.get("player_name", "Anonymous")
                score = data.get("score", 0)
                progress = data.get("progress", 0)
                streak = data.get("streak", 0)

                if player_name in manager.room_players[room_id]:
                    manager.room_players[room_id][player_name]["score"] = score
                    manager.room_players[room_id][player_name]["progress"] = progress

                await manager.broadcast(room_id, {
                    "type": "live_score",
                    "player_name": player_name,
                    "score": score,
                    "streak": streak,
                    "progress": progress,
                    "players": manager.room_players[room_id]
                })

            elif event_type == "taunt":
                player_name = data.get("player_name", "Challenger")
                message = data.get("message", "GG!")
                await manager.broadcast(room_id, {
                    "type": "taunt",
                    "player_name": player_name,
                    "message": message
                })

            elif event_type == "finish":
                player_name = data.get("player_name", "Challenger")
                final_score = data.get("score", 0)
                await manager.broadcast(room_id, {
                    "type": "player_finished",
                    "player_name": player_name,
                    "final_score": final_score
                })

    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
        await manager.broadcast(room_id, {
            "type": "player_left",
            "message": "A challenger has disconnected from the battle."
        })
    except Exception:
        manager.disconnect(room_id, websocket)
