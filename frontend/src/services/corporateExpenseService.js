import api from './api';

export const corporateExpenseService = {
  // Policy & Compliance
  getPolicy: async (companyId = 'COMP-GLOBAL') => {
    const response = await api.get('/corporate/policy', { params: { company_id: companyId } });
    return response.data;
  },

  checkCompliance: async (payload) => {
    const response = await api.post('/corporate/policy/compliance-check', payload);
    return response.data;
  },

  // Approvals
  getApprovals: async (params = {}) => {
    const response = await api.get('/corporate/approvals', { params });
    return response.data;
  },

  submitApproval: async (payload) => {
    const response = await api.post('/corporate/approvals', payload);
    return response.data;
  },

  takeApprovalAction: async (reqId, action, comments, approverName) => {
    const response = await api.post(`/corporate/approvals/${reqId}/action`, {
      action,
      comments,
      approver_name: approverName,
    });
    return response.data;
  },

  // Expenses & OCR
  scanReceiptOCR: async (filename, imageUrl) => {
    const response = await api.post('/corporate/expenses/ocr-scan', {
      receipt_filename: filename,
      receipt_image_url: imageUrl,
    });
    return response.data;
  },

  getExpenseReports: async (companyId) => {
    const response = await api.get('/corporate/expenses', {
      params: companyId ? { company_id: companyId } : {},
    });
    return response.data;
  },

  createExpenseReport: async (payload) => {
    const response = await api.post('/corporate/expenses', payload);
    return response.data;
  },

  updateReportStatus: async (reportId, newStatus) => {
    const response = await api.put(`/corporate/expenses/${reportId}/status`, null, {
      params: { new_status: newStatus },
    });
    return response.data;
  },

  getVATSummary: async (companyId) => {
    const response = await api.get('/corporate/expenses/vat-summary', {
      params: companyId ? { company_id: companyId } : {},
    });
    return response.data;
  },

  // Duty of Care
  getTravelers: async (companyId) => {
    const response = await api.get('/corporate/duty-of-care', {
      params: companyId ? { company_id: companyId } : {},
    });
    return response.data;
  },

  sendBroadcastAlert: async (payload) => {
    const response = await api.post('/corporate/duty-of-care/alert', payload);
    return response.data;
  },
};
