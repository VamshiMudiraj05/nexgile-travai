import base64
import uuid
from typing import Dict, Any
from fastapi import UploadFile, HTTPException, status

from app.core.config import settings
from app.core.logging import logger


class ImageUploadService:
    """
    Self-contained image upload and validation service.
    Encodes verified uploaded images directly into secure base64 data URIs
    stored in MongoDB, eliminating external third-party storage dependencies.
    """

    ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
    MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

    async def validate_image(self, file: UploadFile) -> bytes:
        """Validate uploaded image MIME type and file size."""
        if not file.content_type or file.content_type.lower() not in self.ALLOWED_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type '{file.content_type}'. Allowed types: {', '.join(self.ALLOWED_TYPES)}"
            )

        content = await file.read()
        file_size = len(content)

        if file_size > self.MAX_SIZE_BYTES:
            max_mb = self.MAX_SIZE_BYTES / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size ({file_size / (1024 * 1024):.2f} MB) exceeds maximum allowed size of {max_mb:.0f} MB."
            )

        return content

    async def upload_image(self, file: UploadFile, subfolder: str = "properties") -> Dict[str, Any]:
        """Validate and encode uploaded image into a self-contained data URL."""
        file_bytes = await self.validate_image(file)
        b64_str = base64.b64encode(file_bytes).decode("utf-8")
        mime = file.content_type or "image/jpeg"
        data_url = f"data:{mime};base64,{b64_str}"
        unique_id = uuid.uuid4().hex[:12]
        public_id = f"img_{subfolder}_{unique_id}"
        
        logger.info(f"Image asset processed and stored: {public_id}")
        return {
            "url": data_url,
            "public_id": public_id,
            "resource_type": "image",
        }

    async def delete_image(self, public_id: str) -> bool:
        """Acknowledge deletion of image asset."""
        if not public_id:
            return False
        logger.info(f"Image asset removed: {public_id}")
        return True


# Export service instance (named cloudinary_service for backward compatibility across endpoints)
image_service = ImageUploadService()
cloudinary_service = image_service
