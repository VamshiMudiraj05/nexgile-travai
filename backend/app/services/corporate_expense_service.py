import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status

from app.database.mongodb import get_database
from app.models.corporate_policy import (
    corporate_policy_helper,
    travel_approval_helper,
    expense_report_helper,
    duty_of_care_helper,
)
from app.core.logging import logger


class CorporateExpenseService:
    # --- POLICY MANAGEMENT ---
    @staticmethod
    async def get_or_create_policy(company_id: str = "COMP-GLOBAL") -> Dict[str, Any]:
        """Fetch policy or seed default enterprise policy."""
        db = get_database()
        pol = await db.corporate_policies.find_one({"company_id": company_id})
        if not pol:
            now = datetime.now(timezone.utc)
            doc = {
                "company_id": company_id,
                "policy_name": "Global Enterprise Travel Policy",
                "max_hotel_rate_per_night": 300.0,
                "daily_meal_per_diem": 85.0,
                "max_flight_duration_for_economy": 6.0,
                "advance_booking_days": 7,
                "approval_threshold_amount": 1000.0,
                "restricted_destinations": ["Syria", "North Korea", "Yemen", "Somalia"],
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
            res = await db.corporate_policies.insert_one(doc)
            doc["_id"] = res.inserted_id
            return corporate_policy_helper(doc)
        return corporate_policy_helper(pol)

    @staticmethod
    async def check_compliance(payload: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate booking parameters against corporate travel policy."""
        company_id = payload.get("company_id") or "COMP-GLOBAL"
        policy = await CorporateExpenseService.get_or_create_policy(company_id)

        violations = []
        hotel_rate = float(payload.get("hotel_rate_per_night") or 0.0)
        max_hotel = float(policy.get("max_hotel_rate_per_night", 300.0))
        if hotel_rate > max_hotel:
            violations.append(f"Hotel rate of ${hotel_rate:.2f}/night exceeds cap of ${max_hotel:.2f}/night.")

        meals = float(payload.get("daily_meal_estimate") or 0.0)
        max_meals = float(policy.get("daily_meal_per_diem", 85.0))
        if meals > max_meals:
            violations.append(f"Meal estimate of ${meals:.2f}/day exceeds per-diem cap of ${max_meals:.2f}/day.")

        flight_hours = float(payload.get("flight_duration_hours") or 0.0)
        cabin = (payload.get("flight_cabin") or "ECONOMY").upper()
        if cabin in ["BUSINESS", "FIRST"] and flight_hours < float(policy.get("max_flight_duration_for_economy", 6.0)):
            violations.append(
                f"Premium cabin ({cabin}) selected for a {flight_hours:.1f}h flight. Economy required for flights under {policy.get('max_flight_duration_for_economy')} hours."
            )

        advance_days = int(payload.get("days_in_advance") or 10)
        min_advance = int(policy.get("advance_booking_days", 7))
        if advance_days < min_advance:
            violations.append(f"Trip booked {advance_days} days in advance; policy requires at least {min_advance} days notice.")

        dest = (payload.get("destination") or "").strip()
        restricted = policy.get("restricted_destinations", [])
        if any(r.lower() in dest.lower() for r in restricted if r):
            violations.append(f"Destination '{dest}' is restricted for corporate travel under safety policies.")

        total_cost = float(payload.get("total_cost") or 0.0)
        threshold = float(policy.get("approval_threshold_amount", 1000.0))
        requires_approval = len(violations) > 0 or total_cost > threshold

        return {
            "is_compliant": len(violations) == 0,
            "requires_approval": requires_approval,
            "violations": violations,
            "policy_notes": (
                "Compliant with enterprise travel guidelines."
                if len(violations) == 0
                else f"Booking violates {len(violations)} corporate travel policies. Manager approval required before issuance."
            ),
        }

    # --- APPROVAL WORKFLOWS ---
    @staticmethod
    async def submit_approval_request(req_data: Dict[str, Any]) -> Dict[str, Any]:
        """Submit trip for multi-tier manager review or auto-approval."""
        db = get_database()
        now = datetime.now(timezone.utc)
        req_num = f"REQ-{now.strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"

        # Evaluate compliance
        comp = await CorporateExpenseService.check_compliance({
            "company_id": req_data.get("company_id"),
            "hotel_rate_per_night": req_data.get("hotel_rate_per_night", 0.0),
            "flight_duration_hours": req_data.get("flight_duration_hours", 0.0),
            "flight_cabin": req_data.get("flight_cabin", "ECONOMY"),
            "total_cost": req_data.get("estimated_total", 0.0),
            "destination": req_data.get("destination", ""),
        })

        status_val = "AUTO_APPROVED" if comp["is_compliant"] and req_data.get("estimated_total", 0.0) < 1000.0 else "PENDING_APPROVAL"

        doc = {
            "request_number": req_num,
            "company_id": req_data.get("company_id", "COMP-GLOBAL"),
            "employee_id": req_data.get("employee_id", "EMP-1001"),
            "employee_name": req_data.get("employee_name", "Employee Traveler"),
            "employee_email": req_data.get("employee_email", "employee@nexgile.com"),
            "department": req_data.get("department", "Sales"),
            "destination": req_data.get("destination", "New York"),
            "departure_date": req_data.get("departure_date", ""),
            "return_date": req_data.get("return_date", ""),
            "estimated_total": float(req_data.get("estimated_total", 0.0)),
            "is_in_policy": comp["is_compliant"],
            "policy_violations": comp["violations"],
            "business_justification": req_data.get("business_justification", "Quarterly Client Review"),
            "status": status_val,
            "approver_name": "System Policy Sentinel" if status_val == "AUTO_APPROVED" else None,
            "approver_comments": "Auto-approved within per-diem and spending limits." if status_val == "AUTO_APPROVED" else None,
            "reviewed_at": now if status_val == "AUTO_APPROVED" else None,
            "created_at": now,
        }

        res = await db.travel_approvals.insert_one(doc)
        doc["_id"] = res.inserted_id
        return travel_approval_helper(doc)

    @staticmethod
    async def list_approvals(company_id: Optional[str] = None, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """List corporate travel approvals."""
        db = get_database()
        q: Dict[str, Any] = {}
        if company_id:
            q["company_id"] = company_id
        if status_filter:
            q["status"] = status_filter

        # Seed sample requests if empty
        count = await db.travel_approvals.count_documents({})
        if count == 0:
            now = datetime.now(timezone.utc)
            samples = [
                {
                    "request_number": f"REQ-{now.strftime('%Y%m')}-901",
                    "company_id": "COMP-GLOBAL",
                    "employee_id": "EMP-2001",
                    "employee_name": "Marcus Vance",
                    "employee_email": "marcus.vance@enterprise.com",
                    "department": "Global Sales",
                    "destination": "London, UK",
                    "departure_date": "2026-12-10",
                    "return_date": "2026-12-15",
                    "estimated_total": 3450.0,
                    "is_in_policy": False,
                    "policy_violations": ["Estimated hotel rate $420/night exceeds $300 cap"],
                    "business_justification": "Annual EMEA Enterprise Partner Summit keynote delivery",
                    "status": "PENDING_APPROVAL",
                    "approver_name": None,
                    "approver_comments": None,
                    "reviewed_at": None,
                    "created_at": now - timedelta(hours=4),
                },
                {
                    "request_number": f"REQ-{now.strftime('%Y%m')}-902",
                    "company_id": "COMP-GLOBAL",
                    "employee_id": "EMP-2002",
                    "employee_name": "Sophia Zhang",
                    "employee_email": "sophia.zhang@enterprise.com",
                    "department": "Engineering Operations",
                    "destination": "Zurich, Switzerland",
                    "departure_date": "2026-12-08",
                    "return_date": "2026-12-12",
                    "estimated_total": 1850.0,
                    "is_in_policy": True,
                    "policy_violations": [],
                    "business_justification": "Data center cloud migration and disaster recovery audit",
                    "status": "APPROVED",
                    "approver_name": "VP Engineering",
                    "approver_comments": "Approved. Stay aligned with Zurich client team.",
                    "reviewed_at": now - timedelta(hours=1),
                    "created_at": now - timedelta(days=1),
                },
            ]
            await db.travel_approvals.insert_many(samples)

        cursor = db.travel_approvals.find(q).sort("created_at", -1)
        results = []
        async for doc in cursor:
            results.append(travel_approval_helper(doc))
        return results

    @staticmethod
    async def take_approval_action(req_id: str, action: str, approver_name: str, comments: str) -> Dict[str, Any]:
        """Approve or reject a corporate travel request."""
        db = get_database()
        now = datetime.now(timezone.utc)
        clean_action = action.upper().strip()

        new_status = "APPROVED" if clean_action == "APPROVE" else "REJECTED"

        filter_q = {"_id": ObjectId(req_id)} if ObjectId.is_valid(req_id) else {"request_number": req_id}
        res = await db.travel_approvals.find_one_and_update(
            filter_q,
            {
                "$set": {
                    "status": new_status,
                    "approver_name": approver_name,
                    "approver_comments": comments,
                    "reviewed_at": now,
                }
            },
            return_document=True,
        )
        if not res:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval request not found.")
        return travel_approval_helper(res)

    # --- OCR RECEIPT PARSING & EXPENSES ---
    @staticmethod
    def simulate_receipt_ocr(filename: str = "receipt.jpg") -> Dict[str, Any]:
        """Simulate high-accuracy AI OCR receipt extraction with tax and merchant decomposition."""
        now = datetime.now(timezone.utc)
        fn_lower = (filename or "").lower()

        if "hotel" in fn_lower or "folio" in fn_lower:
            merchant = "The Grand Savoy Resort & Spa"
            category = "HOTEL"
            subtotal = 780.0
            vat = 93.60
            total = 873.60
            desc = "3-Night Executive Suite Stay + Room Dining"
        elif "flight" in fn_lower or "air" in fn_lower:
            merchant = "British Airways"
            category = "FLIGHT"
            subtotal = 640.0
            vat = 48.0
            total = 688.0
            desc = "Roundtrip Transatlantic Passenger Ticket"
        elif "taxi" in fn_lower or "uber" in fn_lower or "cab" in fn_lower:
            merchant = "Blacklane Chauffeur & Limousine"
            category = "GROUND_TRANSPORT"
            subtotal = 110.0
            vat = 13.20
            total = 123.20
            desc = "Airport Chauffeur Transfer to Downtown Office"
        else:
            merchant = "Bistro Le Gabriel Fine Dining"
            category = "MEALS"
            subtotal = 145.0
            vat = 17.40
            total = 162.40
            desc = "Client Dinner Hospitality Expense"

        line_item = {
            "item_id": f"EXP-{uuid.uuid4().hex[:6].upper()}",
            "date": now.strftime("%Y-%m-%d"),
            "category": category,
            "merchant": merchant,
            "description": desc,
            "amount": total,
            "vat_amount": vat,
            "receipt_url": f"https://travai.nexgile.com/receipts/{uuid.uuid4().hex[:8]}.pdf",
        }

        return {
            "merchant_name": merchant,
            "date": now.strftime("%Y-%m-%d"),
            "category": category,
            "subtotal": subtotal,
            "vat_amount": vat,
            "total_amount": total,
            "vat_percentage": 12.0,
            "confidence_score": 0.985,
            "suggested_line_item": line_item,
        }

    @staticmethod
    async def create_expense_report(rep_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new digitized expense report with automatic VAT computation."""
        db = get_database()
        now = datetime.now(timezone.utc)
        rep_num = f"EXP-{now.strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"

        items = rep_data.get("line_items", [])
        total = sum(float(i.get("amount", 0.0)) for i in items)
        vat = sum(float(i.get("vat_amount", 0.0)) for i in items)
        subtotal = round(total - vat, 2)

        doc = {
            "report_number": rep_num,
            "company_id": rep_data.get("company_id", "COMP-GLOBAL"),
            "employee_id": rep_data.get("employee_id", "EMP-1001"),
            "employee_name": rep_data.get("employee_name", "Employee Traveler"),
            "title": rep_data.get("title", f"Business Travel - {rep_data.get('period', 'Q4')}"),
            "department": rep_data.get("department", "Sales"),
            "cost_center": rep_data.get("cost_center", "CC-4001"),
            "period": rep_data.get("period", now.strftime("%B %Y")),
            "line_items": items,
            "subtotal": subtotal,
            "vat_amount": vat,
            "total_amount": total,
            "currency": "USD",
            "status": "SUBMITTED",
            "audit_flag": "CLEAN",
            "created_at": now,
            "updated_at": now,
        }

        res = await db.expense_reports.insert_one(doc)
        doc["_id"] = res.inserted_id
        return expense_report_helper(doc)

    @staticmethod
    async def list_expense_reports(company_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List corporate expense reports."""
        db = get_database()
        q: Dict[str, Any] = {}
        if company_id:
            q["company_id"] = company_id

        # Seed initial reports if empty
        count = await db.expense_reports.count_documents({})
        if count == 0:
            now = datetime.now(timezone.utc)
            samples = [
                {
                    "report_number": f"EXP-{now.strftime('%Y%m')}-101",
                    "company_id": "COMP-GLOBAL",
                    "employee_id": "EMP-1001",
                    "employee_name": "Eleanor Vance",
                    "title": "EMEA Client Discovery & Technical Architecture",
                    "department": "Engineering & Solutions",
                    "cost_center": "CC-2010",
                    "period": "November 2026",
                    "line_items": [
                        {
                            "item_id": "EXP-L01",
                            "date": "2026-11-18",
                            "category": "HOTEL",
                            "merchant": "The Grand Savoy Geneva",
                            "description": "3 Nights Lodging",
                            "amount": 960.0,
                            "vat_amount": 115.20,
                            "receipt_url": "https://sample.com/r1.pdf",
                        },
                        {
                            "item_id": "EXP-L02",
                            "date": "2026-11-19",
                            "category": "MEALS",
                            "merchant": "La Pergola Dining",
                            "description": "Executive Client Dinner",
                            "amount": 180.0,
                            "vat_amount": 21.60,
                            "receipt_url": "https://sample.com/r2.pdf",
                        },
                        {
                            "item_id": "EXP-L03",
                            "date": "2026-11-20",
                            "category": "GROUND_TRANSPORT",
                            "merchant": "Geneva Airport Express",
                            "description": "Train + Chauffeur",
                            "amount": 75.0,
                            "vat_amount": 9.0,
                            "receipt_url": "https://sample.com/r3.pdf",
                        },
                    ],
                    "subtotal": 1069.20,
                    "vat_amount": 145.80,
                    "total_amount": 1215.00,
                    "currency": "USD",
                    "status": "APPROVED",
                    "audit_flag": "CLEAN",
                    "created_at": now - timedelta(days=3),
                    "updated_at": now - timedelta(days=1),
                }
            ]
            await db.expense_reports.insert_many(samples)

        cursor = db.expense_reports.find(q).sort("created_at", -1)
        res = []
        async for doc in cursor:
            res.append(expense_report_helper(doc))
        return res

    @staticmethod
    async def update_report_status(report_id: str, new_status: str) -> Dict[str, Any]:
        """Update expense report status (e.g. APPROVED, REIMBURSED)."""
        db = get_database()
        now = datetime.now(timezone.utc)
        filter_q = {"_id": ObjectId(report_id)} if ObjectId.is_valid(report_id) else {"report_number": report_id}

        res = await db.expense_reports.find_one_and_update(
            filter_q,
            {"$set": {"status": new_status.upper().strip(), "updated_at": now}},
            return_document=True,
        )
        if not res:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense report not found.")
        return expense_report_helper(res)

    @staticmethod
    async def get_vat_recovery_summary(company_id: Optional[str] = None) -> Dict[str, Any]:
        """Calculate international recoverable VAT across eligible business expense categories."""
        reports = await CorporateExpenseService.list_expense_reports(company_id)
        total_exp = 0.0
        total_vat = 0.0
        count = 0
        cat_map: Dict[str, float] = {}

        for rep in reports:
            total_exp += rep.get("total_amount", 0.0)
            total_vat += rep.get("vat_amount", 0.0)
            for item in rep.get("line_items", []):
                count += 1
                cat = item.get("category", "OTHER")
                cat_map[cat] = round(cat_map.get(cat, 0.0) + float(item.get("vat_amount", 0.0)), 2)

        return {
            "total_expense": round(total_exp, 2),
            "total_reclaimable_vat": round(total_vat, 2),
            "eligible_transactions_count": count,
            "by_category": cat_map,
        }

    # --- DUTY OF CARE SENTINEL ---
    @staticmethod
    async def list_travelers(company_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List active and upcoming traveling employees for Duty of Care tracking."""
        db = get_database()
        q: Dict[str, Any] = {}

        count = await db.duty_of_care_travelers.count_documents({})
        if count == 0:
            now = datetime.now(timezone.utc)
            samples = [
                {
                    "employee_name": "Eleanor Vance",
                    "employee_email": "eleanor.vance@nexgile.com",
                    "department": "Solutions Engineering",
                    "current_city": "London",
                    "destination_country": "United Kingdom",
                    "start_date": (now - timedelta(days=1)).strftime("%Y-%m-%d"),
                    "end_date": (now + timedelta(days=4)).strftime("%Y-%m-%d"),
                    "hotel_name": "The Savoy London",
                    "flight_pnr": "PNR-LON-7841",
                    "risk_level": "LOW",
                    "safety_status": "CHECKED_IN_SAFE",
                    "last_ping_time": now - timedelta(minutes=24),
                    "emergency_phone": "+44 20 7946 0912",
                },
                {
                    "employee_name": "Marcus Vance",
                    "employee_email": "marcus.vance@enterprise.com",
                    "department": "Global Sales",
                    "current_city": "Zurich",
                    "destination_country": "Switzerland",
                    "start_date": now.strftime("%Y-%m-%d"),
                    "end_date": (now + timedelta(days=3)).strftime("%Y-%m-%d"),
                    "hotel_name": "Baur au Lac Zurich",
                    "flight_pnr": "PNR-ZUR-2219",
                    "risk_level": "LOW",
                    "safety_status": "IN_TRANSIT",
                    "last_ping_time": now - timedelta(minutes=45),
                    "emergency_phone": "+41 44 220 5000",
                },
                {
                    "employee_name": "Alexander Hayes",
                    "employee_email": "alex.hayes@enterprise.com",
                    "department": "Cloud Infrastructure",
                    "current_city": "Miami",
                    "destination_country": "United States",
                    "start_date": (now - timedelta(days=2)).strftime("%Y-%m-%d"),
                    "end_date": (now + timedelta(days=2)).strftime("%Y-%m-%d"),
                    "hotel_name": "Faena Hotel Miami Beach",
                    "flight_pnr": "PNR-MIA-9932",
                    "risk_level": "MEDIUM",
                    "safety_status": "CHECKED_IN_SAFE",
                    "last_ping_time": now - timedelta(hours=2),
                    "emergency_phone": "+1 305 534 8800",
                },
            ]
            await db.duty_of_care_travelers.insert_many(samples)

        cursor = db.duty_of_care_travelers.find(q)
        res = []
        async for doc in cursor:
            res.append(duty_of_care_helper(doc))
        return res

    @staticmethod
    async def send_broadcast_alert(alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send emergency broadcast / safety check-in request to deployed travelers."""
        travelers = await CorporateExpenseService.list_travelers()
        target_city = alert_data.get("target_city")
        if target_city:
            travelers = [t for t in travelers if t["current_city"].lower() == target_city.lower()]

        logger.info(f"Duty of Care Broadcast dispatched to {len(travelers)} travelers: {alert_data.get('subject')}")
        return {
            "status": "DISPATCHED",
            "recipients_count": len(travelers),
            "severity": alert_data.get("severity", "HIGH"),
            "target_city": target_city or "ALL_DEPLOYED_CITIES",
            "subject": alert_data.get("subject", "Emergency Security & Safety Alert"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
