import apiClient from '@/lib/api-client';
import { Roster, AssignRosterDto, RosterResponse, AssignAttendancePolicyDto, AttendancePolicyUserResponse, Assign24HourPolicyDto } from '@/types/roster';
import { toast } from 'sonner';

// Mock data for initial state
let mockRosters: Roster[] = [
  {
    _id: '1',
    employeeId: '101',
    employeeName: 'John Doe',
    companyName: 'TechCorp Solutions',
    shiftId: 'shift1',
    shiftName: 'Morning Shift',
    startDate: '2026-04-10',
    endDate: '2026-04-15',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '2',
    employeeId: '102',
    employeeName: 'Jane Smith',
    companyName: 'Innovate Hub',
    shiftId: 'shift2',
    shiftName: 'Evening Shift',
    startDate: '2026-04-11',
    endDate: '2026-04-16',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const rosterService = {
  /**
   * Get all rosters
   */
  getAll: async (): Promise<RosterResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { rosters: [...mockRosters] };
  },

  /**
   * Get assigned attendance policies
   */
  getAssignedPolicies: async (page = 1, limit = 10, search = ''): Promise<AttendancePolicyUserResponse> => {
    try {
      const response = await apiClient.get<void, AttendancePolicyUserResponse>(
        `/roster/assign-attendance-policy?page=${page}&limit=${limit}${search ? `&search=${search}` : ''}`
      );
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch assigned policies';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Assign roster to multiple employees
   */
  assign: async (data: AssignRosterDto): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real app, this would be an API call
    console.log('Assigning roster:', data);
    
    // Mock the assignment logic for the demo
    const newRosters: Roster[] = data.employeeIds.map(empId => ({
      _id: Math.random().toString(36).substr(2, 9),
      employeeId: empId,
      employeeName: `Employee ${empId}`, // Mock name
      companyName: 'Assigned Company', // Mock name
      shiftId: data.shiftId,
      shiftName: 'Assigned Shift', // Mock name
      startDate: data.startDate,
      endDate: data.endDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    mockRosters = [...newRosters, ...mockRosters];
    
    toast.success('Roster assigned successfully');
  },

  /**
   * Delete a roster entry
   */
  delete: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    mockRosters = mockRosters.filter(r => r._id !== id);
    toast.success('Roster entry deleted');
  },

  /**
   * Assign attendance policy to users
   */
  assignAttendancePolicy: async (data: AssignAttendancePolicyDto): Promise<void> => {
    try {
      await apiClient.post<AssignAttendancePolicyDto, void>('/roster/assign-attendance-policy', data);
      toast.success('Attendance policy assigned successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign attendance policy';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Assign 24-hour policy to users
   */
  assign24HourPolicy: async (data: Assign24HourPolicyDto): Promise<void> => {
    try {
      await apiClient.post<Assign24HourPolicyDto, void>('/roster/assign-24hour-policy', data);
      toast.success('24-hour policy assigned successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign 24-hour policy';
      toast.error(errorMessage);
      throw error;
    }
  }
};

export default rosterService;
