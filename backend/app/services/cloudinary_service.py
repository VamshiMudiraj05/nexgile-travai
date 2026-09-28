import io
import uuid
from typing import Optional, Dict, Any
from fastapi import UploadFile, HTTPException, status
import cloudinary
import cloudinary.uploader

from app.core.config import settings
from app.core.logging import logger


class CloudinaryService:
    def __init__(self):
        self._is_configured = False
        self._init_cloudinary()

    def _init_cloudinary(self):
        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True,
            )
            self._is_configured = True
            logger.info("Cloudinary service initialized with live credentials.")
        else:
            logger.warning("Cloudinary credentials not configured in environment. Using fallback asset simulator.")

    async def validate_image(self, file: UploadFile) -> bytes:
        """Validate uploaded image MIME type and file size."""
        if not file.content_type or file.content_type.lower() not in settings.CLOUDINARY_ALLOWED_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type '{file.content_type}'. Allowed types: {', '.join(settings.CLOUDINARY_ALLOWED_TYPES)}"
            )

        content = await file.read()
        file_size = len(content)

        if file_size > settings.CLOUDINARY_MAX_SIZE:
            max_mb = settings.CLOUDINARY_MAX_SIZE / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size ({file_size / (1024 * 1024):.2f} MB) exceeds maximum allowed size of {max_mb:.0f} MB."
            )

        return content

    async def upload_image(self, file: UploadFile, subfolder: str = "properties") -> Dict[str, Any]:
        """Upload image to Cloudinary and return image metadata dictionary."""
        file_bytes = await self.validate_image(file)
        folder_path = f"{settings.CLOUDINARY_FOLDER}/{subfolder.strip('/')}"

        if self._is_configured:
            try:
                # Upload to Cloudinary using file stream
                result = cloudinary.uploader.upload(
                    file_bytes,
                    folder=folder_path,
                    resource_type="image",
                    use_filename=True,
                    unique_filename=True,
                )
                logger.info(f"Image uploaded to Cloudinary: {result.get('public_id')}")
                return {
                    "url": result.get("secure_url"),
                    "public_id": result.get("public_id"),
                    "resource_type": result.get("resource_type", "image"),
                }
            except Exception as e:
                logger.error(f"Cloudinary upload error: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Image upload service failed: {str(e)}"
                )
        else:
            # When Cloudinary environment variables are pending, encode real uploaded bytes
            import base64
            b64_str = base64.b64encode(file_bytes).decode("utf-8")
            mime = file.content_type or "image/jpeg"
            data_url = f"data:{mime};base64,{b64_str}"
            unique_id = uuid.uuid4().hex[:12]
            public_id = f"upload_{unique_id}"
            logger.info(f"Local storage image asset created: {public_id}")
            return {
                "url": data_url,
                "public_id": public_id,
                "resource_type": "image",
            }


    async def delete_image(self, public_id: str) -> bool:
        """Delete image from Cloudinary by public_id."""
        if not public_id:
            return False

        if self._is_configured:
            try:
                res = cloudinary.uploader.destroy(public_id, invalidate=True)
                logger.info(f"Cloudinary image deletion for {public_id}: {res}")
                return res.get("result") == "ok"
            except Exception as e:
                logger.error(f"Error deleting Cloudinary image {public_id}: {str(e)}")
                return False
        else:
            logger.info(f"Simulated deletion of asset: {public_id}")
            return True


cloudinary_service = CloudinaryService()
