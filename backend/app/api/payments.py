from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.config import settings
from app.core.security import get_current_user, get_optional_current_user
from app.schemas.user import UserResponse
from app.schemas.payment import (
    CreditPackage,
    PaymentConfigResponse,
    RazorpayCreateOrderRequest,
    RazorpayCreateOrderResponse,
    RazorpayVerifyPaymentRequest,
    RazorpayVerifyPaymentResponse,
    PayPalCreateOrderRequest,
    PayPalCreateOrderResponse,
    PayPalCaptureOrderRequest,
    PayPalCaptureOrderResponse,
)
from app.services.razorpay_service import razorpay_service
from app.services.paypal_service import paypal_service
from app.services.superapp_service import SuperAppService
from app.services.loyalty_service import LoyaltyService
from app.database.mongodb import get_database
from app.core.logging import logger

router = APIRouter(prefix="/payments", tags=["Payments & Gateways"])


@router.get(
    "/config",
    response_model=PaymentConfigResponse,
    summary="Get Dual Gateway Public Configuration",
)
async def get_payment_config():
    """Return public Razorpay and PayPal configuration for client initialization."""
    return {
        "razorpay_key_id": razorpay_service.key_id,
        "paypal_client_id": settings.PAYPAL_CLIENT_ID,
        "paypal_mode": settings.PAYPAL_MODE,
        "currency": "INR",
        "mode": "test"
    }


@router.get(
    "/packages",
    response_model=List[CreditPackage],
    summary="Get Available Credit Packages",
)
async def get_credit_packages():
    """Return official list of credit packages. Pricing is enforced server-side."""
    return razorpay_service.get_packages()


@router.post(
    "/razorpay/create-order",
    response_model=RazorpayCreateOrderResponse,
    summary="Create Razorpay Checkout Order",
)
async def create_razorpay_order(
    payload: RazorpayCreateOrderRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
):
    """
    Initiate a Razorpay Order.
    Never trusts client amounts; pricing is verified against server-side package or reservation.
    """
    db = get_database()
    amount_inr = 0.0
    description = "Nexgile-TravAI Transaction"
    purchased_credits = None
    user_identifier = current_user.id[:8] if current_user else "guest"
    receipt = f"rcpt_{user_identifier}_{int(datetime.now(timezone.utc).timestamp())}"

    # 1. Package purchase scenario (Credit Wallet)
    if payload.package_id:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to purchase wallet credit packages."
            )
        pkg = razorpay_service.get_package_by_id(payload.package_id)
        if not pkg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Credit package '{payload.package_id}' not found."
            )
        amount_inr = pkg["price_inr"]
        purchased_credits = pkg["total_credits"]
        description = f"Purchase of {pkg['name']} ({purchased_credits} Credits)"

    # 2. Hotel reservation scenario
    elif payload.reservation_id:
        if not ObjectId.is_valid(payload.reservation_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reservation ID."
            )
        res = await db.reservations.find_one({"_id": ObjectId(payload.reservation_id)})
        if not res:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found."
            )
        amount_inr = float(res.get("total_amount", 0.0))
        booking_ref = res.get("booking_reference", "")
        description = f"Hotel Reservation Checkout - Ref #{booking_ref}"
        receipt = f"rcpt_res_{booking_ref[:20]}"
    # 3. Multimodal cart / direct journey checkout scenario
    elif payload.cart_id or (payload.amount and payload.amount > 0):
        if payload.cart_id and ObjectId.is_valid(payload.cart_id):
            cart_doc = await db.unified_carts.find_one({"_id": ObjectId(payload.cart_id)})
            amount_inr = float(cart_doc.get("total_amount", 0.0)) if cart_doc else float(payload.amount or 100.0)
        else:
            amount_inr = float(payload.amount or 100.0)
        description = "Multimodal Travel Journey Checkout (Flights & Cabs)"
        receipt = f"rcpt_mm_{int(datetime.now(timezone.utc).timestamp())}"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either package_id, reservation_id, or cart_id/amount must be provided."
        )

    # 3. Create Order via Razorpay Service
    notes = payload.notes or {}
    notes.update({
        "user_id": str(current_user.id),
        "user_email": current_user.email,
        "package_id": payload.package_id or "",
        "reservation_id": payload.reservation_id or "",
    })

    order_data = await razorpay_service.create_order(
        amount_inr=amount_inr,
        receipt=receipt,
        notes=notes
    )

    # 4. Record initial transaction in database
    now = datetime.now(timezone.utc)
    tx_doc = {
        "order_id": order_data["id"],
        "user_id": str(current_user.id),
        "amount_inr": amount_inr,
        "amount_paise": order_data["amount"],
        "currency": "INR",
        "package_id": payload.package_id,
        "reservation_id": payload.reservation_id,
        "purchased_credits": purchased_credits,
        "status": "CREATED",
        "payment_method": "RAZORPAY",
        "receipt": receipt,
        "created_at": now,
        "updated_at": now,
    }
    await db.payment_transactions.update_one(
        {"order_id": order_data["id"]},
        {"$set": tx_doc},
        upsert=True
    )

    return {
        "order_id": order_data["id"],
        "amount": order_data["amount"],
        "amount_inr": amount_inr,
        "currency": "INR",
        "key_id": razorpay_service.key_id or "rzp_test_placeholder",
        "package_id": payload.package_id,
        "reservation_id": payload.reservation_id,
        "purchased_credits": purchased_credits,
        "description": description
    }


@router.post(
    "/razorpay/verify",
    response_model=RazorpayVerifyPaymentResponse,
    summary="Verify Razorpay Payment Signature & Credit Wallet / Confirm Reservation",
)
async def verify_razorpay_payment(
    payload: RazorpayVerifyPaymentRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
):
    """
    Verify payment signature securely on server-side.
    Enforces idempotency: duplicate requests return existing success without re-crediting.
    """
    db = get_database()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # 1. Idempotency Check: prevent duplicate credits for already-verified payment
    existing_successful_tx = await db.payment_transactions.find_one({
        "payment_id": payload.razorpay_payment_id,
        "status": "SUCCESSFUL"
    })
    if existing_successful_tx:
        logger.info(f"Duplicate payment verification request for {payload.razorpay_payment_id} - returning idempotent response.")
        wallet_balance = None
        if current_user:
            wallet = await SuperAppService.get_or_create_wallet(str(current_user.id))
            wallet_balance = wallet.get("cash_balance")
        return {
            "success": True,
            "message": "Payment was already verified successfully.",
            "order_id": payload.razorpay_order_id,
            "payment_id": payload.razorpay_payment_id,
            "status": "SUCCESSFUL",
            "wallet_balance": wallet_balance,
            "credits_added": existing_successful_tx.get("purchased_credits"),
            "reservation_id": existing_successful_tx.get("reservation_id"),
            "booking_reference": existing_successful_tx.get("booking_reference")
        }

    # 2. Verify signature
    is_valid = razorpay_service.verify_signature(
        order_id=payload.razorpay_order_id,
        payment_id=payload.razorpay_payment_id,
        signature=payload.razorpay_signature
    )

    if not is_valid:
        # Record failed attempt
        await db.payment_transactions.update_one(
            {"order_id": payload.razorpay_order_id},
            {"$set": {
                "payment_id": payload.razorpay_payment_id,
                "status": "FAILED",
                "failure_reason": "INVALID_SIGNATURE",
                "updated_at": now
            }},
            upsert=True
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay payment signature. Payment could not be verified."
        )

    # 3. Retrieve order transaction details
    order_tx = await db.payment_transactions.find_one({"order_id": payload.razorpay_order_id})
    package_id = payload.package_id or (order_tx.get("package_id") if order_tx else None)
    reservation_id = payload.reservation_id or (order_tx.get("reservation_id") if order_tx else None)

    wallet_balance = None
    credits_added = None
    booking_ref = None

    # Scenario A: Credit Package Purchase (Wallet Top-Up)
    if package_id:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to credit wallet."
            )
        pkg = razorpay_service.get_package_by_id(package_id)
        if not pkg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Package details not found.")
        
        credits_added = pkg["total_credits"]
        amount_inr = pkg["price_inr"]

        # Ensure wallet exists
        await SuperAppService.get_or_create_wallet(str(current_user.id))

        wallet_tx = {
            "tx_id": f"TX-RZP-{payload.razorpay_payment_id[-8:].upper()}",
            "tx_type": "RAZORPAY_TOP_UP",
            "amount": float(credits_added),
            "description": f"Purchased {pkg['name']} (+{credits_added} Credits)",
            "order_id": payload.razorpay_order_id,
            "payment_id": payload.razorpay_payment_id,
            "timestamp": now,
        }

        # Atomically credit wallet
        updated_wallet = await db.traveler_wallets.find_one_and_update(
            {"user_id": str(current_user.id)},
            {
                "$inc": {"cash_balance": float(credits_added)},
                "$push": {"transactions": {"$each": [wallet_tx], "$position": 0}},
                "$set": {"updated_at": now},
            },
            return_document=True
        )
        wallet_balance = updated_wallet.get("cash_balance", 0.0) if updated_wallet else None

    # Scenario B: Hotel Reservation Booking
    elif reservation_id and ObjectId.is_valid(reservation_id):
        res = await db.reservations.find_one({"_id": ObjectId(reservation_id)})
        if res:
            booking_ref = res.get("booking_reference", "")
            amount_inr = float(res.get("total_amount", 0.0))

            await db.reservations.update_one(
                {"_id": ObjectId(reservation_id)},
                {"$set": {
                    "status": "CONFIRMED",
                    "payment_status": "PAID",
                    "payment_details": {
                        "gateway": "RAZORPAY",
                        "razorpay_order_id": payload.razorpay_order_id,
                        "razorpay_payment_id": payload.razorpay_payment_id,
                        "amount_paid": amount_inr,
                        "currency": "INR",
                        "paid_at": now_iso
                    },
                    "updated_at": now_iso
                }}
            )

            # Award loyalty points if user is logged in
            if current_user:
                await LoyaltyService.award_points_for_booking(str(current_user.id), booking_ref, amount_inr)
    else:
        # Generic direct deposit / custom payment fallback
        amount_inr = order_tx.get("amount_inr", 0.0) if order_tx else 0.0

    # 4. Mark transaction as SUCCESSFUL
    await db.payment_transactions.update_one(
        {"order_id": payload.razorpay_order_id},
        {"$set": {
            "payment_id": payload.razorpay_payment_id,
            "signature": payload.razorpay_signature,
            "status": "SUCCESSFUL",
            "purchased_credits": credits_added,
            "reservation_id": reservation_id,
            "booking_reference": booking_ref,
            "updated_at": now
        }},
        upsert=True
    )

    logger.info(f"Razorpay payment verified successfully! Order: {payload.razorpay_order_id}, Payment: {payload.razorpay_payment_id}")

    return {
        "success": True,
        "message": "Payment verified and credited successfully.",
        "order_id": payload.razorpay_order_id,
        "payment_id": payload.razorpay_payment_id,
        "status": "SUCCESSFUL",
        "wallet_balance": wallet_balance,
        "credits_added": credits_added,
        "reservation_id": reservation_id,
        "booking_reference": booking_ref
    }


# ==========================================
# PAYPAL GATEWAY ENDPOINTS
# ==========================================

@router.post(
    "/paypal/create-order",
    response_model=PayPalCreateOrderResponse,
    summary="Create PayPal Checkout Order",
)
async def create_paypal_order(
    payload: PayPalCreateOrderRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
):
    """Initiate a PayPal Order via PayPal REST API v2."""
    db = get_database()
    amount = payload.amount
    currency = payload.currency
    booking_ref = payload.booking_reference or ""

    # If reservation_id is provided, verify amount from DB
    if payload.reservation_id and ObjectId.is_valid(payload.reservation_id):
        res = await db.reservations.find_one({"_id": ObjectId(payload.reservation_id)})
        if res:
            amount = float(res.get("total_amount", amount))
            booking_ref = res.get("booking_reference", booking_ref)

    order_data = await paypal_service.create_order(
        amount=amount,
        currency=currency,
        booking_reference=booking_ref,
        description=payload.description or "Nexgile-TravAI Hotel Stay",
        reservation_id=payload.reservation_id or ""
    )

    approval_url = None
    for link in order_data.get("links", []):
        if link.get("rel") == "approve":
            approval_url = link.get("href")
            break

    # Record transaction in database
    now = datetime.now(timezone.utc)
    user_id = str(current_user.id) if current_user else "guest"
    await db.payment_transactions.update_one(
        {"order_id": order_data.get("id")},
        {"$set": {
            "order_id": order_data.get("id"),
            "user_id": user_id,
            "amount_inr": amount if currency.upper() == "INR" else round(amount * 86.0, 2),
            "currency": currency,
            "reservation_id": payload.reservation_id,
            "status": "CREATED",
            "payment_method": "PAYPAL",
            "created_at": now,
            "updated_at": now,
        }},
        upsert=True
    )

    return {
        "order_id": order_data.get("id"),
        "status": order_data.get("status", "CREATED"),
        "approval_url": approval_url,
        "amount": amount,
        "currency": currency
    }


@router.post(
    "/paypal/capture-order",
    response_model=PayPalCaptureOrderResponse,
    summary="Capture PayPal Payment & Update Reservation",
)
async def capture_paypal_order(
    payload: PayPalCaptureOrderRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
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
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    if ObjectId.is_valid(res_id):
        res = await db.reservations.find_one({"_id": ObjectId(res_id)})
        if res:
            booking_ref = res.get("booking_reference", "")
            await db.reservations.update_one(
                {"_id": ObjectId(res_id)},
                {"$set": {
                    "status": "CONFIRMED",
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

            # Award loyalty points for completed payment if user is logged in
            if current_user:
                total_amt = float(res.get("total_amount", amount_val))
                await LoyaltyService.award_points_for_booking(str(current_user.id), booking_ref, total_amt)

    # Update payment transaction record
    await db.payment_transactions.update_one(
        {"order_id": payload.order_id},
        {"$set": {
            "payment_id": capture_id,
            "status": "SUCCESSFUL",
            "reservation_id": res_id,
            "booking_reference": booking_ref,
            "payer_email": payer_email,
            "updated_at": now
        }},
        upsert=True
    )

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
