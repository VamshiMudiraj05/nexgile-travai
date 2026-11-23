from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId


def corporate_policy_helper(p: Dict[str, Any]) -> Dict[str, Any]:
    if not p:
        return {}
    return {
        "id": str(p.get("_id")),
        "company_id": str(p.get("company_id", "")),
        "policy_name": p.get("policy_name", "Global Enterprise Travel Policy"),
        "max_hotel_rate_per_night": float(p.get("max_hotel_rate_per_night", 300.0)),
        "daily_meal_per_diem": float(p.get("daily_meal_per_diem", 85.0)),
        "max_flight_duration_for_economy": float(p.get("max_flight_duration_for_economy", 6.0)),
        "advance_booking_days": int(p.get("advance_booking_days", 7)),
        "approval_threshold_amount": float(p.get("approval_threshold_amount", 1000.0)),
        "restricted_destinations": p.get("restricted_destinations", []),
        "is_active": p.get("is_active", True),
        "created_at": p.get("created_at"),
        "updated_at": p.get("updated_at"),
    }


def travel_approval_helper(req: Dict[str, Any]) -> Dict[str, Any]:
    if not req:
        return {}
    return {
        "id": str(req.get("_id")),
        "request_number": req.get("request_number", ""),
        "company_id": str(req.get("company_id", "")),
        "employee_id": str(req.get("employee_id", "")),
        "employee_name": req.get("employee_name", ""),
        "employee_email": req.get("employee_email", ""),
        "department": req.get("department", "Operations"),
        "destination": req.get("destination", ""),
        "departure_date": req.get("departure_date", ""),
        "return_date": req.get("return_date", ""),
        "estimated_total": float(req.get("estimated_total", 0.0)),
        "is_in_policy": req.get("is_in_policy", True),
        "policy_violations": req.get("policy_violations", []),
        "business_justification": req.get("business_justification", ""),
        "status": req.get("status", "PENDING_APPROVAL"),  # PENDING_APPROVAL, APPROVED, REJECTED, AUTO_APPROVED
        "approver_name": req.get("approver_name"),
        "approver_comments": req.get("approver_comments"),
        "reviewed_at": req.get("reviewed_at"),
        "created_at": req.get("created_at"),
    }


def expense_report_helper(rep: Dict[str, Any]) -> Dict[str, Any]:
    if not rep:
        return {}
    return {
        "id": str(rep.get("_id")),
        "report_number": rep.get("report_number", ""),
        "company_id": str(rep.get("company_id", "")),
        "employee_id": str(rep.get("employee_id", "")),
        "employee_name": rep.get("employee_name", ""),
        "title": rep.get("title", ""),
        "department": rep.get("department", "Sales"),
        "cost_center": rep.get("cost_center", "CC-4001"),
        "period": rep.get("period", ""),
        "line_items": rep.get("line_items", []),
        "subtotal": float(rep.get("subtotal", 0.0)),
        "vat_amount": float(rep.get("vat_amount", 0.0)),
        "total_amount": float(rep.get("total_amount", 0.0)),
        "currency": rep.get("currency", "USD"),
        "status": rep.get("status", "SUBMITTED"),  # DRAFT, SUBMITTED, APPROVED, REIMBURSED
        "receipt_count": len(rep.get("line_items", [])),
        "audit_flag": rep.get("audit_flag", "CLEAN"),  # CLEAN, REQUIRES_REVIEW, FRAUD_SUSPECT
        "created_at": rep.get("created_at"),
        "updated_at": rep.get("updated_at"),
    }


def duty_of_care_helper(trv: Dict[str, Any]) -> Dict[str, Any]:
    if not trv:
        return {}
    return {
        "id": str(trv.get("_id")),
        "employee_name": trv.get("employee_name", ""),
        "employee_email": trv.get("employee_email", ""),
        "department": trv.get("department", "Engineering"),
        "current_city": trv.get("current_city", ""),
        "destination_country": trv.get("destination_country", ""),
        "start_date": trv.get("start_date", ""),
        "end_date": trv.get("end_date", ""),
        "hotel_name": trv.get("hotel_name", ""),
        "flight_pnr": trv.get("flight_pnr", ""),
        "risk_level": trv.get("risk_level", "LOW"),  # LOW, MEDIUM, HIGH, CRITICAL
        "safety_status": trv.get("safety_status", "CHECKED_IN_SAFE"),  # CHECKED_IN_SAFE, IN_TRANSIT, ASSISTANCE_REQUESTED
        "last_ping_time": trv.get("last_ping_time"),
        "emergency_phone": trv.get("emergency_phone", "+1 800-555-SAFE"),
    }
