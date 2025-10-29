import React from "react";
import toast from "react-hot-toast";
import { usePlanner } from "../context/PlannerContext";
import { ITEM_TYPES } from "../models";

const ExportSection = () => {
  const { state, actions } = usePlanner();

  const exportToCSV = (data, filename) => {
    const csvContent = "data:text/csv;charset=utf-8," + data;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSchedule = () => {
    const headers = [
      "Day",
      "Time Slot",
      "Item",
      "Sub-Item",
      "Duration",
      "Completed",
    ];
    const rows = [headers.join(",")];

    Object.entries(state.schedule).forEach(([scheduleKey, items]) => {
      const [day, timeSlot] = scheduleKey.split("-");
      items.forEach((scheduleItem, index) => {
        const item =
          state.items[scheduleItem.itemId] ||
          state.repeatedItems[scheduleItem.itemId];
        const subItem = scheduleItem.subItemId
          ? item?.subItems?.find((si) => si.id === scheduleItem.subItemId)
          : null;

        const completionKey = `${scheduleItem.itemId}-${
          scheduleItem.subItemId || "main"
        }-${day}-${timeSlot}-${index}`;
        const isCompleted = state.completedItems[completionKey] ? "Yes" : "No";

        const itemName = item?.name || "Unknown";
        const subItemName = subItem?.name || "";
        const duration = subItem
          ? subItem.duration
            ? `${Math.floor(subItem.duration / 60)}h ${subItem.duration % 60}m`
            : ""
          : item?.getFormattedDuration?.() || "";

        rows.push(
          [
            day,
            timeSlot,
            `"${itemName}"`,
            `"${subItemName}"`,
            `"${duration}"`,
            isCompleted,
          ].join(",")
        );
      });
    });

    exportToCSV(rows.join("\n"), "schedule.csv");
    toast.success("Schedule exported successfully!");
  };

  const exportItems = () => {
    const headers = ["Item", "Quantity", "Frequency", "Type"];
    const rows = [headers.join(",")];

    // Export normal items
    Object.values(state.items).forEach((item) => {
      const subItems = item.subItems?.map((si) => si.name).join("; ") || "";
      rows.push([`"${item.name}"`, item.quantity, "", "normal"].join(","));
    });

    // Export repeated items
    Object.values(state.repeatedItems).forEach((item) => {
      const subItems = item.subItems?.map((si) => si.name).join("; ") || "";
      rows.push(
        [`"${item.name}"`, "∞", item.frequency || "", "repeated"].join(",")
      );
    });

    exportToCSV(rows.join("\n"), "items.csv");
    toast.success("Items exported successfully!");
  };

  const exportAllData = () => {
    let csv = "=== WEEKLY SCHEDULE ===\n";
    csv += "Day,Morning,Afternoon,Evening,Night\n";

    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const timeSlots = ["Morning", "Afternoon", "Evening", "Night"];

    days.forEach((day) => {
      let row = [day];
      timeSlots.forEach((timeSlot) => {
        const scheduleKey = `${day}-${timeSlot}`;
        const scheduleItems = state.schedule[scheduleKey] || [];
        const itemNames = scheduleItems.map((scheduleItem) => {
          const item =
            state.items[scheduleItem.itemId] ||
            state.repeatedItems[scheduleItem.itemId];
          const subItem = scheduleItem.subItemId
            ? item?.subItems?.find((si) => si.id === scheduleItem.subItemId)
            : null;
          return subItem ? subItem.name : item?.name || "Unknown";
        });
        row.push(`"${itemNames.join("; ")}"`);
      });
      csv += row.join(",") + "\n";
    });

    csv += "\n=== AVAILABLE ITEMS ===\n";
    csv += "Item,Quantity\n";
    Object.values(state.items).forEach((item) => {
      csv += `"${item.name}","${item.quantity}"\n`;
    });

    csv += "\n=== REPEATED ITEMS ===\n";
    csv += "Item,Frequency\n";
    Object.values(state.repeatedItems).forEach((item) => {
      csv += `"${item.name}","${item.frequency || "daily"}"\n`;
    });

    csv += "\n=== EXPORT INFO ===\n";
    csv += "Export Date,Version\n";
    csv += `"${new Date().toLocaleDateString()}","2.0"\n`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "complete-plan.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("All data exported successfully!");
  };

  const exportJSONData = () => {
    const data = {
      items: state.items,
      repeatedItems: state.repeatedItems,
      schedule: state.schedule,
      completedItems: state.completedItems,
      version: "2.0",
      exportedAt: new Date().toISOString(),
    };

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "planner-data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("JSON data exported successfully!");
  };

  const importData = () => {
    console.log("Import data function called");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.csv";
    input.onchange = (e) => {
      console.log("File selected:", e.target.files[0]);
      const file = e.target.files[0];
      if (!file) {
        console.log("No file selected");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        console.log("File read completed, starting import process");
        try {
          if (file.name.endsWith(".json")) {
            console.log("Importing JSON file");
            const data = JSON.parse(e.target.result);

            // Clear data ONLY if valid data exists
            if (data.items || data.repeatedItems || data.schedule) {
              // Use the new loadImportedData function which properly converts
              // plain objects to class instances and loads all data at once
              // Note: loadImportedData clears data internally
              actions.loadImportedData(data);
              toast.success("Data imported successfully!");
            } else {
              toast.error("No valid data found in file");
            }
          } else if (file.name.endsWith(".csv")) {
            console.log("Importing CSV file");
            importCSVData(e.target.result);
          } else {
            console.error("Unsupported file type:", file.name);
            toast.error(
              "Unsupported file type. Please select a .json or .csv file."
            );
          }
        } catch (error) {
          console.error("Import error:", error);
          toast.error("Failed to import data: " + error.message);
        }
      };

      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        toast.error("Failed to read file: " + error.message);
      };

      console.log("Starting to read file as text");
      reader.readAsText(file);
    };
    input.click();
  };

  const importCSVData = (csvContent) => {
    console.log("Starting CSV import with content length:", csvContent.length);
    try {
      const lines = csvContent.split("\n");
      console.log("CSV lines count:", lines.length);
      let currentSection = "";
      let importedCount = 0;
      const itemsToImport = new Map(); // Track main items and their sub-items

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.includes("=== AVAILABLE ITEMS ===")) {
          currentSection = "available";
          console.log("Found AVAILABLE ITEMS section");
          continue;
        } else if (line.includes("=== REPEATED ITEMS ===")) {
          currentSection = "repeated";
          console.log("Found REPEATED ITEMS section");
          continue;
        } else if (line.includes("=== EXPORT INFO ===")) {
          currentSection = "";
          console.log("Found EXPORT INFO section, stopping");
          continue;
        }

        if (
          currentSection === "available" &&
          line &&
          !line.startsWith("Item,")
        ) {
          console.log("Processing available item line:", line);
          const [itemName, quantity] = parseCSVLine(line);
          console.log("Parsed item:", itemName, "quantity:", quantity);
          if (itemName && quantity) {
            console.log("Adding item:", itemName, "with quantity:", quantity);
            // Check if this is a sub-item (contains " → ")
            if (itemName.includes(" → ")) {
              const [mainItemName, subItemName] = itemName.split(" → ");
              if (!itemsToImport.has(mainItemName)) {
                itemsToImport.set(mainItemName, {
                  name: mainItemName,
                  itemType: ITEM_TYPES.NORMAL,
                  subtype: "do",
                  quantity: 0,
                  duration: 0,
                  subItems: [],
                });
              }
              const mainItem = itemsToImport.get(mainItemName);
              mainItem.subItems.push({
                name: subItemName,
                duration: 0,
              });
              mainItem.quantity += parseInt(quantity) || 1;
            } else {
              // Main item without sub-items
              if (!itemsToImport.has(itemName)) {
                itemsToImport.set(itemName, {
                  name: itemName,
                  itemType: ITEM_TYPES.NORMAL,
                  subtype: "do",
                  quantity: parseInt(quantity) || 1,
                  duration: 0,
                  subItems: [],
                });
              } else {
                itemsToImport.get(itemName).quantity += parseInt(quantity) || 1;
              }
            }
          }
        } else if (
          currentSection === "repeated" &&
          line &&
          !line.startsWith("Item,")
        ) {
          const [itemName, frequency] = parseCSVLine(line);
          if (itemName) {
            // Check if this is a sub-item (contains " → ")
            if (itemName.includes(" → ")) {
              const [mainItemName, subItemName] = itemName.split(" → ");
              if (!itemsToImport.has(mainItemName)) {
                itemsToImport.set(mainItemName, {
                  name: mainItemName,
                  itemType: ITEM_TYPES.REPEATED,
                  frequency: parseFrequency(frequency),
                  quantity: 1,
                  duration: 0,
                  subItems: [],
                });
              }
              const mainItem = itemsToImport.get(mainItemName);
              mainItem.subItems.push({
                name: subItemName,
                duration: 0,
              });
            } else {
              // Main repeated item
              if (!itemsToImport.has(itemName)) {
                itemsToImport.set(itemName, {
                  name: itemName,
                  itemType: ITEM_TYPES.REPEATED,
                  frequency: parseFrequency(frequency),
                  quantity: 1,
                  duration: 0,
                  subItems: [],
                });
              }
            }
          }
        }
      }

      console.log("Items to import:", itemsToImport.size);
      console.log(
        "Items to import details:",
        Array.from(itemsToImport.entries())
      );

      // Import all collected items with comprehensive error handling
      if (itemsToImport.size > 0) {
        try {
          console.log("Batch loading imported CSV items");
          // Build a data object compatible with loadImportedData
          const importedData = { items: {}, repeatedItems: {} };

          itemsToImport.forEach((itemData) => {
            // Normalize structure for loadImportedData
            const normalized = {
              id: undefined, // will be kept/assigned inside loadImportedData
              name: itemData.name.trim(),
              itemType: itemData.itemType || ITEM_TYPES.NORMAL,
              subtype: itemData.subtype || null,
              frequency: itemData.frequency || null,
              customFrequency: itemData.customFrequency || null,
              quantity: Math.max(1, parseInt(itemData.quantity) || 1),
              duration: Math.max(0, parseInt(itemData.duration) || 0),
              subItems:
                Array.isArray(itemData.subItems) && itemData.subItems.length > 0
                  ? itemData.subItems.map((si) => ({
                      id: undefined,
                      name: String(si.name || "").trim(),
                      duration: Math.max(0, parseInt(si.duration) || 0),
                    }))
                  : [],
            };

            if (normalized.itemType === ITEM_TYPES.REPEATED) {
              importedData.repeatedItems[normalized.name] = normalized;
            } else {
              importedData.items[normalized.name] = normalized;
            }
          });

          // Use batch loader to replace state in one go (and persist once)
          actions.loadImportedData(importedData);
          importedCount = itemsToImport.size;
        } catch (error) {
          console.error("Critical error during import process:", error);
          toast.error("Failed to import: " + error.message);
          throw error;
        }
      }

      if (importedCount > 0) {
        toast.success(`Successfully imported ${importedCount} items!`);
      } else {
        toast.error("No items found to import");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import CSV data: " + error.message);
    }
  };

  const parseCSVLine = (line) => {
    // Try to match quoted fields first
    const quotedMatches = line.match(/"([^"]+)"/g);
    if (quotedMatches && quotedMatches.length >= 2) {
      return [quotedMatches[0].slice(1, -1), quotedMatches[1].slice(1, -1)];
    }

    // Try to match unquoted fields with comma separator
    const unquotedMatches = line.match(/^([^,]+),(.+)$/);
    if (unquotedMatches && unquotedMatches.length >= 3) {
      return [unquotedMatches[1].trim(), unquotedMatches[2].trim()];
    }

    // Fallback: split by comma and trim
    const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
    if (parts.length >= 2) {
      return [parts[0], parts[1]];
    }

    return [null, null];
  };

  const parseFrequency = (frequencyText) => {
    if (!frequencyText) return "weekly";

    const freq = frequencyText.toLowerCase();
    if (freq.includes("daily")) return "daily";
    if (freq.includes("weekly")) return "weekly";
    if (freq.includes("bi-weekly") || freq.includes("biweekly"))
      return "biweekly";
    if (freq.includes("monthly")) return "monthly";
    if (freq.includes("custom")) return "custom";

    // Handle numeric frequency (e.g., "7 days")
    const numericMatch = freq.match(/(\d+)\s*days?/);
    if (numericMatch) {
      const days = parseInt(numericMatch[1]);
      if (days === 1) return "daily";
      if (days === 7) return "weekly";
      if (days === 14) return "biweekly";
      if (days === 30) return "monthly";
      return "custom";
    }

    return "weekly"; // default
  };

  const clearAllData = () => {
    if (
      confirm("Are you sure you want to clear ALL data? This cannot be undone!")
    ) {
      actions.clearAllData();
      toast.success("All data cleared successfully!");
    }
  };

  const clearSchedule = () => {
    if (confirm("Are you sure you want to clear the schedule?")) {
      actions.clearSchedule();
      toast.success("Schedule cleared successfully!");
    }
  };

  return (
    <div className="export-section">
      <button className="btn btn-success" onClick={exportSchedule}>
        <span>📋</span> Export Schedule
      </button>
      <button className="btn btn-success" onClick={exportItems}>
        <span>📦</span> Export Items
      </button>
      <button className="btn btn-success" onClick={exportAllData}>
        <span>💾</span> Export All Data (CSV)
      </button>
      <button className="btn btn-success" onClick={exportJSONData}>
        <span>💾</span> Export All Data (JSON)
      </button>
      <button className="btn btn-primary" onClick={importData}>
        <span>📤</span> Import Data
      </button>
      <button className="btn btn-primary" onClick={clearSchedule}>
        <span>🗑️</span> Clear Schedule
      </button>
      <button className="btn btn-danger" onClick={clearAllData}>
        <span>🗑️</span> Clear All Data
      </button>
    </div>
  );
};

export default ExportSection;
