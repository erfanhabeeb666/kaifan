import { create } from 'zustand';
import type { DashboardResponse, CallLogResponse, EmployeeResponse, QueueEntryResponse } from '../types';

interface DashboardState {
  dashboard: DashboardResponse | null;
  setDashboard: (data: DashboardResponse) => void;
  updateActiveCall: (call: CallLogResponse | null) => void;
  updateEmployee: (employee: EmployeeResponse) => void;
  updateQueue: (entries: QueueEntryResponse[]) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  dashboard: null,
  setDashboard: (data) => set({ dashboard: data }),
  updateActiveCall: (call) =>
    set((state) => ({
      dashboard: state.dashboard
        ? { ...state.dashboard, activeCall: call }
        : null,
    })),
  updateEmployee: (employee) =>
    set((state) => {
      if (!state.dashboard) return state;
      const employees = state.dashboard.employees.map((e) =>
        e.id === employee.id ? employee : e
      );
      return { dashboard: { ...state.dashboard, employees } };
    }),
  updateQueue: (entries) =>
    set((state) => ({
      dashboard: state.dashboard
        ? { ...state.dashboard, queueEntries: entries }
        : null,
    })),
}));
