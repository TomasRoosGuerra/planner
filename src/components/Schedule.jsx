import React from "react";
import { useDrop } from "react-dnd";
import { usePlanner } from "../context/PlannerContext";
import { DAYS, TIME_SLOTS } from "../models";

const ScheduleItem = ({
  scheduleItem,
  day,
  timeSlot,
  index,
  onContextMenu,
}) => {
  const { state, actions } = usePlanner();

  const itemId = scheduleItem.itemId;
  const subItemId = scheduleItem.subItemId;

  // Find the item and sub-item
  const item = state.items[itemId] || state.repeatedItems[itemId];
  const subItem = subItemId
    ? item?.subItems?.find((si) => si.id === subItemId)
    : null;

  if (!item) return null;

  const displayName = subItem ? subItem.name : item.name;
  const duration = subItem
    ? subItem.getFormattedDuration?.() || ""
    : item.getFormattedDuration();
  const completionKey = `${itemId}-${
    subItemId || "main"
  }-${day}-${timeSlot}-${index}`;
  const isCompleted = state.completedItems[completionKey];

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, scheduleItem, "schedule");
  };

  const handleToggleCompletion = (e) => {
    e.stopPropagation();
    actions.toggleCompletion(day, timeSlot, index);
  };

  return (
    <div
      className={`meal-in-slot ${isCompleted ? "completed-item" : ""}`}
      onContextMenu={handleContextMenu}
    >
      <span className="meal-text">{displayName}</span>

      {duration && (
        <span className="duration-badge" title="Duration">
          ⏱️ {duration}
        </span>
      )}

      <button
        className={`checkmark-btn ${isCompleted ? "completed" : ""}`}
        onClick={handleToggleCompletion}
        title={isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {isCompleted ? "✓" : "○"}
      </button>

      <button
        className="context-menu-btn"
        onClick={handleContextMenu}
        title="More options"
      >
        ⋯
      </button>
    </div>
  );
};

const DropZone = ({ day, timeSlot, children, onContextMenu }) => {
  const { actions } = usePlanner();

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ["item", "sub-item"],
    drop: (droppedItem) => {
      if (droppedItem.type === "sub-item") {
        // Schedule the sub-item
        actions.scheduleItem(
          day,
          timeSlot,
          droppedItem.parentId,
          droppedItem.id,
          0
        );
      } else {
        // Schedule the main item
        actions.scheduleItem(day, timeSlot, droppedItem.id, null, 0);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const isEmpty = !children || children.length === 0;

  return (
    <div
      ref={drop}
      className={`grid-cell dropzone ${isOver ? "drag-over" : ""} ${
        isEmpty ? "empty" : ""
      }`}
      onContextMenu={isEmpty ? undefined : onContextMenu}
    >
      {children}
    </div>
  );
};

const Schedule = () => {
  const { state, actions } = usePlanner();

  const handleContextMenu = (e, scheduleItem, type) => {
    const rect = e.currentTarget.getBoundingClientRect();
    actions.openContextMenu(
      { x: rect.right - 120, y: rect.bottom + 5 },
      scheduleItem,
      type
    );
  };

  const getScheduleItems = (day, timeSlot) => {
    const scheduleKey = `${day}-${timeSlot}`;
    return state.schedule[scheduleKey] || [];
  };

  return (
    <div className="schedule-container">
      <div className="card">
        <div className="card-header">📅 Weekly Schedule</div>
        <div className="card-content">
          <div className="grid">
            {/* Empty corner cell */}
            <div className="grid-cell header"></div>

            {/* Day headers */}
            {DAYS.map((day) => (
              <div key={day} className="grid-cell header">
                {day}
              </div>
            ))}

            {/* Time slots and grid cells */}
            {TIME_SLOTS.map((timeSlot) => (
              <React.Fragment key={timeSlot}>
                <div className="grid-cell time-slot">{timeSlot}</div>
                {DAYS.map((day) => {
                  const scheduleItems = getScheduleItems(day, timeSlot);
                  return (
                    <DropZone
                      key={`${day}-${timeSlot}`}
                      day={day}
                      timeSlot={timeSlot}
                      onContextMenu={handleContextMenu}
                    >
                      {scheduleItems.map((scheduleItem, index) => (
                        <ScheduleItem
                          key={`${scheduleItem.itemId}-${
                            scheduleItem.subItemId || "main"
                          }-${index}`}
                          scheduleItem={scheduleItem}
                          day={day}
                          timeSlot={timeSlot}
                          index={index}
                          onContextMenu={handleContextMenu}
                        />
                      ))}
                    </DropZone>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
