import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSockets"])


class ConnectionManager:
    """Manages active WebSocket connections for hotel real-time events."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, data: Dict[str, Any]):
        """Broadcast an event payload to all currently connected staff and traveler clients."""
        payload = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(payload))
            except Exception as e:
                logger.warning(f"Error sending message to websocket: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)


# Global singleton manager instance
hotel_ws_manager = ConnectionManager()


@router.websocket("/ws/hotel-events")
async def websocket_hotel_events(websocket: WebSocket):
    """
    Real-time bidirectional event bus for Front Desk, Housekeeping, and Concierge staff.
    Receives room status updates, housekeeping handoffs, and guest service tickets.
    """
    await hotel_ws_manager.connect(websocket)
    try:
        # Initial greeting confirmation
        await websocket.send_text(
            json.dumps({
                "type": "CONNECTION_ESTABLISHED",
                "message": "Connected to Nexgile-TravAI Live Hotel Event Bus",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
        )
        while True:
            # Keep socket alive and allow heartbeat ping/pong messages from client
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_text(
                        json.dumps({"type": "PONG", "timestamp": datetime.now(timezone.utc).isoformat()})
                    )
            except Exception:
                pass
    except WebSocketDisconnect:
        hotel_ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"Unexpected WebSocket disconnection: {e}")
        hotel_ws_manager.disconnect(websocket)
