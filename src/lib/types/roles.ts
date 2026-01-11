/**
 * Role Type Definitions
 *
 * Discriminated unions and type guards for role-based access control.
 */

// Staff roles for event management
export type StaffRole =
  | "ticket_scanner"
  | "door_manager"
  | "event_staff"
  | "box_office"
  | "sales_associate";

// All staff roles as array (for validation)
export const STAFF_ROLES: StaffRole[] = [
  "ticket_scanner",
  "door_manager",
  "event_staff",
  "box_office",
  "sales_associate",
];

// Type guard for staff role
export function isValidStaffRole(role: string): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

// Staff permissions by role
export interface StaffPermissions {
  canScanTickets: boolean;
  canSellTickets: boolean;
  canManageDoor: boolean;
  canViewAttendees: boolean;
  canProcessRefunds: boolean;
  canViewSalesReports: boolean;
}

// Get permissions for a staff role
export function getStaffPermissions(role: StaffRole): StaffPermissions {
  switch (role) {
    case "ticket_scanner":
      return {
        canScanTickets: true,
        canSellTickets: false,
        canManageDoor: false,
        canViewAttendees: true,
        canProcessRefunds: false,
        canViewSalesReports: false,
      };
    case "door_manager":
      return {
        canScanTickets: true,
        canSellTickets: true,
        canManageDoor: true,
        canViewAttendees: true,
        canProcessRefunds: false,
        canViewSalesReports: true,
      };
    case "event_staff":
      return {
        canScanTickets: true,
        canSellTickets: false,
        canManageDoor: false,
        canViewAttendees: true,
        canProcessRefunds: false,
        canViewSalesReports: false,
      };
    case "box_office":
      return {
        canScanTickets: true,
        canSellTickets: true,
        canManageDoor: false,
        canViewAttendees: true,
        canProcessRefunds: true,
        canViewSalesReports: true,
      };
    case "sales_associate":
      return {
        canScanTickets: false,
        canSellTickets: true,
        canManageDoor: false,
        canViewAttendees: false,
        canProcessRefunds: false,
        canViewSalesReports: true,
      };
    default:
      return {
        canScanTickets: false,
        canSellTickets: false,
        canManageDoor: false,
        canViewAttendees: false,
        canProcessRefunds: false,
        canViewSalesReports: false,
      };
  }
}

// Role display names
export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  ticket_scanner: "Ticket Scanner",
  door_manager: "Door Manager",
  event_staff: "Event Staff",
  box_office: "Box Office",
  sales_associate: "Sales Associate",
};

// Get display label for role
export function getStaffRoleLabel(role: StaffRole): string {
  return STAFF_ROLE_LABELS[role] || role;
}
