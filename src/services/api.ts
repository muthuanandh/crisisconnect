import type { Incident, User, Feedback, AuditLog, Message } from '../db/types';

const API_BASE = '/api';

// Helper headers for session state
const getHeaders = (currentUser?: User) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (currentUser) {
    headers['x-demo-user-id'] = currentUser.id;
    headers['x-demo-role'] = currentUser.role;
    headers['x-demo-user-name'] = currentUser.name;
  }
  return headers;
};

export const api = {
  // Auth & User APIs
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async getUsers(): Promise<User[]> {
    try {
      const res = await fetch(`${API_BASE}/auth/users`);
      const data = await res.json();
      return data.success ? data.users : [];
    } catch {
      return [];
    }
  },

  async updateCitizen(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/citizens/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      return data.success ? data.citizen : null;
    } catch {
      return null;
    }
  },

  // Disaster Management APIs
  async getDisasters(): Promise<Incident[]> {
    try {
      const res = await fetch(`${API_BASE}/disasters`);
      const data = await res.json();
      return data.success ? data.disasters : [];
    } catch {
      return [];
    }
  },

  async addDisaster(incident: Partial<Incident>, currentUser?: User): Promise<Incident | null> {
    try {
      const res = await fetch(`${API_BASE}/disasters`, {
        method: 'POST',
        headers: getHeaders(currentUser),
        body: JSON.stringify({
          ...incident,
          created_by: currentUser?.name || 'Commander R. Srinivasan'
        })
      });
      const data = await res.json();
      return data.success ? data.disaster : null;
    } catch {
      return null;
    }
  },

  async updateDisaster(incident: Partial<Incident>, currentUser?: User): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/disasters/${incident.id}`, {
        method: 'PUT',
        headers: getHeaders(currentUser),
        body: JSON.stringify({
          ...incident,
          updated_by: currentUser?.name || 'Commander R. Srinivasan'
        })
      });
      const data = await res.json();
      return data.success;
    } catch {
      return false;
    }
  },

  // Citizen Reports APIs
  async getCitizenReports(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/reports`);
      const data = await res.json();
      return data.success ? data.reports : [];
    } catch {
      return [];
    }
  },

  async addCitizenReport(report: { citizenId: string; citizenName: string; reportType: string; description: string; lat?: number; lng?: number; locationName?: string; severity?: string; imagePath?: string }): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      const data = await res.json();
      return data.success ? data.report : null;
    } catch {
      return null;
    }
  },

  async updateReportStatus(reportId: string, status: string, currentUser?: User): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/reports/${reportId}/status`, {
        method: 'PUT',
        headers: getHeaders(currentUser),
        body: JSON.stringify({ status, updated_by: currentUser?.name })
      });
      const data = await res.json();
      return data.success;
    } catch {
      return false;
    }
  },

  // Alerts & Messages APIs
  async getAlerts(): Promise<Message[]> {
    try {
      const res = await fetch(`${API_BASE}/alerts`);
      const data = await res.json();
      return data.success ? data.alerts : [];
    } catch {
      return [];
    }
  },

  async generateAlerts(disasterId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/alerts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disaster_id: disasterId })
      });
      return await res.json();
    } catch {
      return { success: false };
    }
  },

  async getAlertExplanation(alertId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/alerts/${alertId}/explanation`);
      const data = await res.json();
      return data.success ? data.explanation : null;
    } catch {
      return null;
    }
  },

  async sendAlert(alertId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/alerts/${alertId}/send`, {
        method: 'POST'
      });
      return await res.json();
    } catch {
      return { success: false };
    }
  },

  // Human Review APIs
  async getPendingReviews(): Promise<Message[]> {
    try {
      const res = await fetch(`${API_BASE}/reviews/pending`);
      const data = await res.json();
      return data.success ? data.pending : [];
    } catch {
      return [];
    }
  },

  async approveReview(alertId: string, approvedBy: string, reason?: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/reviews/${alertId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy, reason })
      });
      const data = await res.json();
      return data.success;
    } catch {
      return false;
    }
  },

  async rejectReview(alertId: string, approvedBy: string, reason?: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/reviews/${alertId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy, reason })
      });
      const data = await res.json();
      return data.success;
    } catch {
      return false;
    }
  },

  async editReviewMessage(alertId: string, newContent: string, editor: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/reviews/${alertId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newContent, editor })
      });
      const data = await res.json();
      return data.success;
    } catch {
      return false;
    }
  },

  // Analytics & Dashboard APIs
  async getDashboardStats(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/analytics/dashboard`);
      const data = await res.json();
      return data.success ? data.stats : null;
    } catch {
      return null;
    }
  },

  async submitFeedback(fb: Partial<Feedback>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/analytics/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fb)
      });
      const data = await res.json();
      return data.success;
    } catch {
      return false;
    }
  },

  // Audit Logs APIs
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const res = await fetch(`${API_BASE}/audit-logs`);
      const data = await res.json();
      return data.success ? data.logs : [];
    } catch {
      return [];
    }
  },

  // Failure Case Sandbox API
  async testFailureCase(testCaseId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/failures/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCaseId })
      });
      const data = await res.json();
      return data.success ? data.result : null;
    } catch {
      return null;
    }
  },

  // Baseline vs Prototype Experiments API
  async runBaselineExperiment(scenarioName: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/experiments/baseline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioName })
      });
      const data = await res.json();
      return data.success ? data.result : null;
    } catch {
      return null;
    }
  },

  async runPrototypeExperiment(scenarioName: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/experiments/prototype`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioName })
      });
      const data = await res.json();
      return data.success ? data.result : null;
    } catch {
      return null;
    }
  }
};
