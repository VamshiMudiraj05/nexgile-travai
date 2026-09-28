from datetime import datetime
from typing import Dict, Any, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.config import settings
from app.core.security import get_current_user
from app.schemas.user import UserResponse
from app.schemas.payment import (
    PayPalCreateOrderRequest,
    PayPalCreateOrderResponse,
    PayPalCaptureOrderRequest,
    PayPalCaptureOrderResponse,
)
from app.services.paypal_service import paypal_service
from app.services.loyalty_service import LoyaltyService
from app.database.mongodb import get_database
from app.core.logging import logger

router = APIRouter(prefix="/payments", tags=["Payments & PayPal Gateway"])


@router.get(
    "/config",
    summary="Get PayPal Public Client Configuration",
)
async def get_payment_config():
    """Return PayPal client ID and active mode for client SDK initialization."""
    return {
        "paypal_client_id": settings.PAYPAL_CLIENT_ID,
        "paypal_mode": settings.PAYPAL_MODE,
        "currency": "USD"
    }


@router.post(
    "/paypal/create-order",
    response_model=PayPalCreateOrderResponse,
    summary="Create PayPal Checkout Order",
)
async def create_paypal_order(
    payload: PayPalCreateOrderRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """Initiate a PayPal Order via PayPal REST API v2."""
    order_data = await paypal_service.create_order(
        amount=payload.amount,
        currency=payload.currency,
        booking_reference=payload.booking_reference or "",
        description=payload.description or "Nexgile-TravAI Hotel Stay",
        reservation_id=payload.reservation_id or ""
    )

    approval_url = None
    for link in order_data.get("links", []):
        if link.get("rel") == "approve":
            approval_url = link.get("href")
            break

    return {
        "order_id": order_data.get("id"),
        "status": order_data.get("status", "CREATED"),
        "approval_url": approval_url,
        "amount": payload.amount,
        "currency": payload.currency
    }


@router.post(
    "/paypal/capture-order",
    response_model=PayPalCaptureOrderResponse,
    summary="Capture PayPal Payment & Update Reservation",
)
async def capture_paypal_order(
    payload: PayPalCaptureOrderRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """Capture authorized PayPal order, verify payment status, and update MongoDB reservation."""
    db = get_database()
    
    # 1. Capture on PayPal
    capture_data = await paypal_service.capture_order(payload.order_id)
    capture_status = capture_data.get("status")

    if capture_status != "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PayPal order status is {capture_status}, payment was not completed."
        )

    # 2. Extract capture details
    purchase_unit = capture_data.get("purchase_units", [{}])[0]
    payments_obj = purchase_unit.get("payments", {})
    captures = payments_obj.get("captures", [{}])
    capture_id = captures[0].get("id") if captures else None
    payer_email = capture_data.get("payer", {}).get("email_address")
    amount_val = float(captures[0].get("amount", {}).get("value", 0.0)) if captures else 0.0
    currency = captures[0].get("amount", {}).get("currency_code", "USD") if captures else "USD"

    # 3. Update Reservation Document
    res_id = payload.reservation_id
    booking_ref = ""
    now_iso = datetime.utcnow().isoformat()

    if ObjectId.is_valid(res_id):
        res = await db.reservations.find_one({"_id": ObjectId(res_id)})
        if res:
            booking_ref = res.get("booking_reference", "")
            await db.reservations.update_one(
                {"_id": ObjectId(res_id)},
                {"$set": {
                    "payment_status": "PAID",
                    "payment_details": {
                        "gateway": "PAYPAL",
                        "paypal_order_id": payload.order_id,
                        "paypal_capture_id": capture_id,
                        "payer_email": payer_email,
                        "amount_paid": amount_val,
                        "currency": currency,
                        "paid_at": now_iso
                    },
                    "updated_at": now_iso
                }}
            )

            # Award loyalty points for completed payment
            total_amt = float(res.get("total_amount", amount_val))
            await LoyaltyService.award_points_for_booking(str(current_user.id), booking_ref, total_amt)

    logger.info(f"PayPal capture successful for reservation {res_id}, reference: {booking_ref}")

    return {
        "success": True,
        "status": capture_status,
        "order_id": payload.order_id,
        "capture_id": capture_id,
        "payer_email": payer_email,
        "amount": amount_val,
        "currency": currency,
        "reservation_id": res_id,
        "booking_reference": booking_ref,
        "message": "Payment captured successfully via PayPal."
    }
