import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { usePlanner } from "../context/PlannerContext";
import { ITEM_TYPES } from "../models";
import SubItemModal from "./SubItemModal";

const ContextMenu = () => {
  const { state, actions } = usePlanner();
  const menuRef = useRef(null);
  const [subItemModal, setSubItemModal] = useState({
    isOpen: false,
    parentItem: null,
    parentItemType: null,
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        actions.closeContextMenu();
      }
    };

    if (state.contextMenu.isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [state.contextMenu.isOpen, actions]);

  if (!state.contextMenu.isOpen || !state.contextMenu.item) {
    return null;
  }

  const { item, type } = state.contextMenu;
  const isScheduleItem = type === "schedule";
  const isRepeatedItem = type === "repeated";

  const handleDurationEdit = () => {
    const currentDuration = item.duration || 0;
    const hours = Math.floor(currentDuration / 60);
    const minutes = currentDuration % 60;

    const newHours = prompt(`Edit duration for "${item.name}"\nHours:`, hours);
    if (newHours === null) return;

    const newMinutes = prompt(`Minutes:`, minutes);
    if (newMinutes === null) return;

    const newDuration =
      (parseInt(newHours) || 0) * 60 + (parseInt(newMinutes) || 0);

    if (isScheduleItem) {
      // For schedule items, we need to update the original item
      const originalItem =
        state.items[item.itemId] || state.repeatedItems[item.itemId];
      if (originalItem) {
        if (item.subItemId) {
          // Update sub-item duration
          const subItem = originalItem.subItems?.find(
            (si) => si.id === item.subItemId
          );
          if (subItem) {
            subItem.duration = newDuration;
            actions.updateItem(
              originalItem.id,
              { subItems: originalItem.subItems },
              isRepeatedItem ? ITEM_TYPES.REPEATED : ITEM_TYPES.NORMAL
            );
          }
        } else {
          // Update main item duration
          actions.updateItem(
            originalItem.id,
            { duration: newDuration },
            isRepeatedItem ? ITEM_TYPES.REPEATED : ITEM_TYPES.NORMAL
          );
        }
      }
    } else {
      // For pool items
      if (item.subItems && item.subItems.length > 0) {
        // This is a main item with sub-items - we can't edit duration directly
        toast.error(
          "Cannot edit duration for items with sub-items. Edit individual sub-items instead."
        );
        return;
      }
      actions.updateItem(
        item.id,
        { duration: newDuration },
        isRepeatedItem ? ITEM_TYPES.REPEATED : ITEM_TYPES.NORMAL
      );
    }

    actions.closeContextMenu();
    toast.success("Duration updated successfully!");
  };

  const handleDurationDelete = () => {
    if (confirm("Delete duration for this item?")) {
      if (isScheduleItem) {
        const originalItem =
          state.items[item.itemId] || state.repeatedItems[item.itemId];
        if (originalItem) {
          if (item.subItemId) {
            const subItem = originalItem.subItems?.find(
              (si) => si.id === item.subItemId
            );
            if (subItem) {
              subItem.duration = 0;
              actions.updateItem(
                originalItem.id,
                { subItems: originalItem.subItems },
                isRepeatedItem ? ITEM_TYPES.REPEATED : ITEM_TYPES.NORMAL
              );
            }
          } else {
            actions.updateItem(
              originalItem.id,
              { duration: 0 },
              isRepeatedItem ? ITEM_TYPES.REPEATED : ITEM_TYPES.NORMAL
            );
          }
        }
      } else {
        actions.updateItem(
          item.id,
          { duration: 0 },
          isRepeatedItem ? ITEM_TYPES.REPEATED : ITEM_TYPES.NORMAL
        );
      }

      actions.closeContextMenu();
      toast.success("Duration deleted successfully!");
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this item?")) {
      if (isScheduleItem) {
        // For schedule items, we need to unschedule them
        const scheduleKey = `${item.day}-${item.timeSlot}`;
        const scheduleItems = state.schedule[scheduleKey] || [];
        const index = scheduleItems.findIndex(
          (si) => si.itemId === item.itemId && si.subItemId === item.subItemId
        );
        if (index !== -1) {
          actions.unscheduleItem(item.day, item.timeSlot, index);
        }
      } else {
        // For pool items
        actions.removeItem(
          item.id,
          isRepeatedItem ? ITEM_TYPES.REPEATED : ITEM_TYPES.NORMAL
        );
      }

      actions.closeContextMenu();
      toast.success("Item deleted successfully!");
    }
  };

  const handleAddSubItem = () => {
    setSubItemModal({
      isOpen: true,
      parentItem: item,
      parentItemType: isRepeatedItem ? ITEM_TYPES.REPEATED : ITEM_TYPES.NORMAL,
    });
    actions.closeContextMenu();
  };

  const hasDuration =
    item.duration > 0 ||
    (item.subItems && item.subItems.some((si) => si.duration > 0));
  const canAddSubItem =
    !isScheduleItem && (!item.subItems || item.subItems.length === 0);

  return (
    <>
      <div
        ref={menuRef}
        className="context-menu-dropdown show"
        style={{
          top: state.contextMenu.position.y,
          left: state.contextMenu.position.x,
        }}
      >
        {hasDuration ? (
          <>
            <div className="context-menu-item" onClick={handleDurationEdit}>
              ✏️ Edit Duration
            </div>
            <div
              className="context-menu-item danger"
              onClick={handleDurationDelete}
            >
              🗑️ Delete Duration
            </div>
          </>
        ) : (
          <div className="context-menu-item" onClick={handleDurationEdit}>
            ⏱️ Add Duration
          </div>
        )}

        {canAddSubItem && (
          <div className="context-menu-item" onClick={handleAddSubItem}>
            ➕ Add Sub-item
          </div>
        )}

        <div className="context-menu-item danger" onClick={handleDelete}>
          🗑️ Delete
        </div>
      </div>

      <SubItemModal
        isOpen={subItemModal.isOpen}
        onClose={() =>
          setSubItemModal({
            isOpen: false,
            parentItem: null,
            parentItemType: null,
          })
        }
        parentItem={subItemModal.parentItem}
        parentItemType={subItemModal.parentItemType}
      />
    </>
  );
};

export default ContextMenu;
