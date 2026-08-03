export type ActivityTemplateStatus = "Draft" | "Ready" | "Blocked";

export type ActivityTemplate = {
  id: string;
  name: string;
  campus: string;
  programme: string;
  moduleCode: string;
  moduleName: string;
  activityType: string;
  plannedSize: number;
  durationHours: number;
  weeklySessions: number;
  teachingWeeks: number[];
  studentGroup: string;
  lecturerSuitability: string;
  roomSuitability: string;
  preferredDays: string;
  preferredTime: string;
  publicationRule: "Standard" | "Hold until approved";
  status: ActivityTemplateStatus;
  updatedAt: string;
};

export type AvailabilityException = {
  id: string;
  resourceType: "Lecturer" | "Student group" | "Room";
  resourceId: string;
  resourceName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  availabilityType: "Unavailable" | "Preferred" | "Available";
  reason: string;
  notes: string;
  createdAt: string;
};

export type PublicationStatus = "Draft" | "Ready for Review" | "Published";

export type PublicationState = {
  version: number;
  status: PublicationStatus;
  scope: string;
  notes: string;
  lastPublishedAt?: string;
  publishedBy?: string;
};

export type TemplateValidationItem = {
  label: string;
  passed: boolean;
  message: string;
};

export type SuggestionInput = {
  name?: string;
  email?: string;
  area: string;
  category: string;
  rating: number;
  suggestion: string;
  page: string;
  userAgent?: string;
};
