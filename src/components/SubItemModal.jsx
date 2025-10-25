import React, { useState } from "react";
import toast from "react-hot-toast";
import { usePlanner } from "../context/PlannerContext";
import { ITEM_TYPES } from "../models";

const SubItemModal = ({ isOpen, onClose, parentItem, parentItemType }) => {
  const { actions } = usePlanner();
  const [subItemName, setSubItemName] = useState("");
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(30);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!subItemName.trim()) {
      toast.error("Please enter a sub-item name");
      return;
    }

    const duration = parseInt(durationHours) * 60 + parseInt(durationMinutes);

    actions.addSubItem(
      parentItem.id,
      { name: subItemName.trim(), duration },
      parentItemType === ITEM_TYPES.REPEATED
        ? ITEM_TYPES.REPEATED
        : ITEM_TYPES.NORMAL
    );

    toast.success("Sub-item added successfully!");

    // Reset form
    setSubItemName("");
    setDurationHours(0);
    setDurationMinutes(30);

    onClose();
  };

  const handleClose = () => {
    setSubItemName("");
    setDurationHours(0);
    setDurationMinutes(30);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Sub-item to "{parentItem?.name}"</h3>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="subItemName">📝 Sub-item Name</label>
              <input
                type="text"
                id="subItemName"
                value={subItemName}
                onChange={(e) => setSubItemName(e.target.value)}
                placeholder="Enter sub-item name"
                required
                autoFocus
              />
            </div>

            <div className="input-group">
              <label htmlFor="subItemDurationHours">⏱️ Duration (hours)</label>
              <input
                type="number"
                id="subItemDurationHours"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                min="0"
              />
            </div>

            <div className="input-group">
              <label htmlFor="subItemDurationMinutes">
                ⏱️ Duration (minutes)
              </label>
              <input
                type="number"
                id="subItemDurationMinutes"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                min="0"
                max="59"
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <span>➕</span> Add Sub-item
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubItemModal;
