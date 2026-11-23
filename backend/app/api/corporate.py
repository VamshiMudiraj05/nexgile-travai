from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path, status
from app.core.security import get_current_user, require_role
from app.schemas.user import UserResponse, UserRole
from app.schemas.corporate_account import (
    CorporateAccountCreate,
    CorporateAccountUpdate,
    CorporateAccountResponse,
    GroupBlockCreate,
    GroupBlockUpdate,
    GroupBlockResponse,
    CorporateCodeVerifyResponse,
)
from app.schemas.corporate_expense import (
    CorporatePolicyResponse,
    ComplianceCheckRequest,
    ComplianceCheckResponse,
    TravelApprovalCreate,
    TravelApprovalAction,
    TravelApprovalResponse,
    OCRScanRequest,
    OCRScanResponse,
    ExpenseReportCreate,
    ExpenseReportResponse,
    VATRecoverySummary,
    DutyOfCareTravelerResponse,
    BroadcastAlertRequest,
)
from app.services.corporate_service import CorporateService
from app.services.corporate_expense_service import CorporateExpenseService

router = APIRouter(prefix="/corporate", tags=["Corporate Accounts & Group Blocks"])


# --- CORPORATE ACCOUNTS ---
@router.get(
    "/accounts",
    response_model=List[CorporateAccountResponse],
    summary="List Contracted Corporate Accounts",
)
async def list_corporate_accounts(
    active_only: bool = Query(False, description="Filter active accounts only"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve all corporate client accounts with contracted discounts and credit limits."""
    return await CorporateService.list_corporate_accounts(active_only=active_only)


@router.get(
    "/accounts/{account_id}",
    response_model=CorporateAccountResponse,
    summary="Get Corporate Account by ID",
)
async def get_corporate_account(
    account_id: str = Path(..., description="Corporate account ID"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve full corporate contract details."""
    return await CorporateService.get_corporate_account(account_id)


@router.post(
    "/accounts",
    response_model=CorporateAccountResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New Corporate Account",
)
async def create_corporate_account(
    payload: CorporateAccountCreate = ...,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.FINANCE])),
):
    """Register a new corporate enterprise contract with negotiated discount terms."""
    return await CorporateService.create_corporate_account(payload.model_dump())


@router.put(
    "/accounts/{account_id}",
    response_model=CorporateAccountResponse,
    summary="Update Corporate Account Terms",
)
async def update_corporate_account(
    account_id: str = Path(..., description="Corporate account ID"),
    payload: CorporateAccountUpdate = ...,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.FINANCE])),
):
    """Update company contacts, credit limits, or negotiated rates."""
    return await CorporateService.update_corporate_account(
        account_id=account_id,
        payload=payload.model_dump(exclude_unset=True),
    )


@router.get(
    "/verify/{corporate_code}",
    response_model=CorporateCodeVerifyResponse,
    summary="Verify Corporate Negotiated Rate Code",
)
async def verify_corporate_code(
    corporate_code: str = Path(..., description="Corporate code entered during booking"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Verify validity of corporate code and retrieve contracted discount percentage."""
    return await CorporateService.verify_corporate_code(corporate_code)


# --- GROUP BLOCKS ---
@router.get(
    "/group-blocks",
    response_model=List[GroupBlockResponse],
    summary="List Conference & Event Group Room Blocks",
)
async def list_group_blocks(
    property_id: Optional[str] = Query(None, description="Optional property ID filter"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve room blocks, cutoff dates, and pickup statistics."""
    return await CorporateService.list_group_blocks(property_id=property_id)


@router.get(
    "/group-blocks/{block_id}",
    response_model=GroupBlockResponse,
    summary="Get Group Block by ID",
)
async def get_group_block(
    block_id: str = Path(..., description="Group block ID"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve specific room block details and pickup status."""
    return await CorporateService.get_group_block(block_id)


@router.post(
    "/group-blocks",
    response_model=GroupBlockResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Group Block",
)
async def create_group_block(
    payload: GroupBlockCreate = ...,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.FRONT_DESK, UserRole.REVENUE_MANAGER])),
):
    """Block inventory for a conference, wedding, or corporate retreat with cutoff release date."""
    return await CorporateService.create_group_block(payload.model_dump())


@router.post(
    "/group-blocks/{block_id}/release",
    response_model=GroupBlockResponse,
    summary="Release Unpicked Rooms Back to Inventory",
)
async def release_unpicked_rooms(
    block_id: str = Path(..., description="Group block ID"),
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.FRONT_DESK, UserRole.REVENUE_MANAGER])),
):
    """Release unbooked rooms from the block back to general hotel inventory upon reaching cutoff date."""
    return await CorporateService.release_unpicked_rooms(block_id)


# --- PHASE 4: CORPORATE TRAVEL POLICY & COMPLIANCE ---
@router.get(
    "/policy",
    response_model=CorporatePolicyResponse,
    summary="Get Corporate Travel Policy",
)
async def get_corporate_policy(
    company_id: str = Query("COMP-GLOBAL", description="Company ID"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve active corporate travel policy, per-diem caps, and cabin restrictions."""
    return await CorporateExpenseService.get_or_create_policy(company_id=company_id)


@router.post(
    "/policy/compliance-check",
    response_model=ComplianceCheckResponse,
    summary="Validate Booking Against Corporate Policy",
)
async def check_policy_compliance(
    payload: ComplianceCheckRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """Evaluate hotel nightly rates, flight class, advance purchase window, and meal estimates."""
    return await CorporateExpenseService.check_compliance(payload.model_dump())


# --- PHASE 4: MULTI-TIER TRAVEL APPROVALS ---
@router.get(
    "/approvals",
    response_model=List[TravelApprovalResponse],
    summary="List Corporate Travel Approval Requests",
)
async def list_travel_approvals(
    company_id: Optional[str] = Query(None, description="Company filter"),
    status: Optional[str] = Query(None, description="Status filter: PENDING_APPROVAL, APPROVED, REJECTED"),
    current_user: UserResponse = Depends(get_current_user),
):
    """List travel requests pending or completed manager reviews."""
    return await CorporateExpenseService.list_approvals(company_id=company_id, status_filter=status)


@router.post(
    "/approvals",
    response_model=TravelApprovalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Travel Request for Approval",
)
async def submit_travel_approval(
    payload: TravelApprovalCreate,
    current_user: UserResponse = Depends(get_current_user),
):
    """Submit business itinerary for managerial compliance review or automated approval."""
    return await CorporateExpenseService.submit_approval_request(payload.model_dump())


@router.post(
    "/approvals/{req_id}/action",
    response_model=TravelApprovalResponse,
    summary="Approve or Reject Travel Request",
)
async def take_approval_action(
    req_id: str = Path(..., description="Approval request ID or request number"),
    payload: TravelApprovalAction = ...,
    current_user: UserResponse = Depends(get_current_user),
):
    """Manager approves or rejects travel request with justification comments."""
    return await CorporateExpenseService.take_approval_action(
        req_id=req_id,
        action=payload.action,
        approver_name=payload.approver_name or current_user.name,
        comments=payload.comments or "",
    )


# --- PHASE 4: EXPENSES & OCR DIGITIZATION ---
@router.post(
    "/expenses/ocr-scan",
    response_model=OCRScanResponse,
    summary="Simulate AI OCR Receipt Parsing",
)
async def scan_receipt_ocr(
    payload: OCRScanRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """Extract merchant, date, amounts, VAT, and line-item categorization from receipt image."""
    return CorporateExpenseService.simulate_receipt_ocr(filename=payload.receipt_filename or "receipt.jpg")


@router.get(
    "/expenses",
    response_model=List[ExpenseReportResponse],
    summary="List Digitized Expense Reports",
)
async def list_expense_reports(
    company_id: Optional[str] = Query(None, description="Optional company ID filter"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve expense reports with line items and VAT totals."""
    return await CorporateExpenseService.list_expense_reports(company_id=company_id)


@router.post(
    "/expenses",
    response_model=ExpenseReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Expense Report",
)
async def create_expense_report(
    payload: ExpenseReportCreate,
    current_user: UserResponse = Depends(get_current_user),
):
    """Submit digitized expense report with OCR receipts and automated VAT computation."""
    return await CorporateExpenseService.create_expense_report(payload.model_dump())


@router.put(
    "/expenses/{report_id}/status",
    response_model=ExpenseReportResponse,
    summary="Update Expense Report Status (Approve / Reimburse)",
)
async def update_expense_report_status(
    report_id: str = Path(..., description="Expense report ID or report number"),
    new_status: str = Query(..., description="Status: APPROVED, REIMBURSED, REJECTED"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Mark expense report as approved or reimbursed."""
    return await CorporateExpenseService.update_report_status(report_id=report_id, new_status=new_status)


@router.get(
    "/expenses/vat-summary",
    response_model=VATRecoverySummary,
    summary="Calculate Recoverable International VAT",
)
async def get_vat_recovery_summary(
    company_id: Optional[str] = Query(None, description="Optional company ID filter"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Aggregate reclaimable cross-border VAT across accommodation, transport, and dining."""
    return await CorporateExpenseService.get_vat_recovery_summary(company_id=company_id)


# --- PHASE 4: DUTY OF CARE TRACKER ---
@router.get(
    "/duty-of-care",
    response_model=List[DutyOfCareTravelerResponse],
    summary="Duty of Care Deployed Travelers Roster",
)
async def list_duty_of_care_travelers(
    company_id: Optional[str] = Query(None, description="Optional company ID filter"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Monitor deployed employees, live cities, flight PNRs, and safety statuses."""
    return await CorporateExpenseService.list_travelers(company_id=company_id)


@router.post(
    "/duty-of-care/alert",
    summary="Dispatch Emergency Broadcast to Deployed Travelers",
)
async def send_duty_of_care_alert(
    payload: BroadcastAlertRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """Broadcast urgent travel safety alerts and prompt safety check-ins."""
    return await CorporateExpenseService.send_broadcast_alert(payload.model_dump())

