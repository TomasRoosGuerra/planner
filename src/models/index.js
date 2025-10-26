// Core data types and models
export const ITEM_TYPES = {
  NORMAL: "normal",
  REPEATED: "repeated",
};

export const NORMAL_SUBTYPES = {
  DECIDE: "decide",
  DELETE: "delete",
  DEFER: "defer",
  PLAN: "plan",
  DO: "do",
};

export const FREQUENCY_TYPES = {
  DAILY: "daily",
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  MONTHLY: "monthly",
  CUSTOM: "custom",
};

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
export const TIME_SLOTS = ["Morning", "Afternoon", "Evening", "Night"];

// Item model
export class Item {
  constructor(
    id,
    name,
    itemType = ITEM_TYPES.NORMAL,
    subtype = null,
    frequency = null,
    customFrequency = null
  ) {
    // Validate required parameters with better error handling
    if (!id) {
      console.error("Invalid Item ID:", id);
      throw new Error("Item ID is required");
    }

    // Convert to string if needed
    const stringId = String(id);

    if (!name) {
      console.error("Invalid Item name:", name);
      throw new Error("Item name is required");
    }

    // Convert to string if needed
    const stringName = String(name);

    if (stringName.trim() === "") {
      console.error("Invalid Item name: empty string");
      throw new Error("Item name cannot be empty");
    }

    // Allow any itemType for backwards compatibility
    const validItemType = Object.values(ITEM_TYPES).includes(itemType)
      ? itemType
      : ITEM_TYPES.NORMAL;

    this.id = stringId;
    this.name = stringName.trim();
    this.itemType = validItemType;
    this.subtype = subtype || null;
    this.frequency = frequency || null;
    this.customFrequency = customFrequency || null;
    this.quantity = 1;
    this.duration = 0; // in minutes
    this.subItems = [];
    this.createdAt = new Date().toISOString();
  }

  addSubItem(subItem) {
    this.subItems.push(subItem);
  }

  removeSubItem(subItemId) {
    this.subItems = this.subItems.filter((item) => item.id !== subItemId);
  }

  getTotalDuration() {
    if (this.subItems.length > 0) {
      return this.subItems.reduce(
        (total, subItem) => total + subItem.duration,
        0
      );
    }
    return this.duration;
  }

  getFormattedDuration() {
    const minutes = this.getTotalDuration();
    if (minutes <= 0) return "";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  }
}

// SubItem model
export class SubItem {
  constructor(id, name, parentId, duration = 0) {
    // Validate required parameters
    if (!id || typeof id !== "string") {
      throw new Error("SubItem ID is required and must be a string");
    }
    if (!name || typeof name !== "string" || name.trim() === "") {
      throw new Error(
        "SubItem name is required and must be a non-empty string"
      );
    }
    if (!parentId || typeof parentId !== "string") {
      throw new Error("Parent ID is required and must be a string");
    }
    if (typeof duration !== "number" || duration < 0) {
      throw new Error("Duration must be a non-negative number");
    }

    this.id = id;
    this.name = name.trim();
    this.parentId = parentId;
    this.duration = duration;
    this.createdAt = new Date().toISOString();
  }

  getFormattedDuration() {
    if (this.duration <= 0) return "";

    const hours = Math.floor(this.duration / 60);
    const mins = this.duration % 60;

    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  }
}

// Schedule item model
export class ScheduleItem {
  constructor(itemId, subItemId = null, day, timeSlot, index = 0) {
    this.itemId = itemId;
    this.subItemId = subItemId;
    this.day = day;
    this.timeSlot = timeSlot;
    this.index = index;
    this.completed = false;
    this.scheduledAt = new Date().toISOString();
  }

  getKey() {
    return this.subItemId ? `${this.itemId}-${this.subItemId}` : this.itemId;
  }
}

// Utility functions
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatDuration = (minutes) => {
  if (minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
};

export const parseDuration = (hours, minutes) => {
  return (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
};

// Icon mappings
export const ITEM_TYPE_ICONS = {
  [ITEM_TYPES.NORMAL]: "📦",
  [ITEM_TYPES.REPEATED]: "🔄",
};

export const SUBTYPE_ICONS = {
  [NORMAL_SUBTYPES.DECIDE]: "🤔",
  [NORMAL_SUBTYPES.DELETE]: "🗑️",
  [NORMAL_SUBTYPES.DEFER]: "⏳",
  [NORMAL_SUBTYPES.PLAN]: "📋",
  [NORMAL_SUBTYPES.DO]: "✅",
};

export const FREQUENCY_ICONS = {
  [FREQUENCY_TYPES.DAILY]: "📅",
  [FREQUENCY_TYPES.WEEKLY]: "📆",
  [FREQUENCY_TYPES.BIWEEKLY]: "📋",
  [FREQUENCY_TYPES.MONTHLY]: "🗓️",
  [FREQUENCY_TYPES.CUSTOM]: "⚙️",
};
