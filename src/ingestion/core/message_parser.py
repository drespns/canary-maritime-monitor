from typing import Any  # Tipado flexible para payload JSON.


def is_position_report(payload: dict[str, Any]) -> bool:
    """
    Devuelve True si el payload representa un PositionReport.

    Acepta dos variantes típicas de AISStream:
    - MessageType == "PositionReport"
    - Message.PositionReport existe
    """
    # Variante 1: tipo explícito en la raíz del mensaje.
    if payload.get("MessageType") == "PositionReport":
        return True

    # Variante 2: el tipo va anidado en "Message".
    message = payload.get("Message")
    # Validar que "Message" es dict y contiene la clave PositionReport.
    return isinstance(message, dict) and "PositionReport" in message


def vessel_identity(payload: dict[str, Any]) -> str:
    """Devuelve una etiqueta corta del barco para logs."""
    # Extraer metadata; si no existe, usar dict vacío.
    metadata = payload.get("MetaData", {})
    # Si metadata no es diccionario, devolver fallback seguro.
    if not isinstance(metadata, dict):
        return "MMSI=unknown"

    # Tomar MMSI y nombre si están disponibles.
    mmsi = metadata.get("MMSI")
    ship_name = metadata.get("ShipName")
    # Si hay ambos, mostrar ambos.
    if mmsi and ship_name:
        return f"MMSI={mmsi} Name={ship_name}"
    # Si solo hay MMSI, mostrar solo MMSI.
    if mmsi:
        return f"MMSI={mmsi}"
    # Fallback final si no hay info utilizable.
    return "MMSI=unknown"

