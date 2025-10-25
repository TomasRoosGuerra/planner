import React, { useState } from "react";
import toast from "react-hot-toast";
import { usePlanner } from "../context/PlannerContext";
import { FREQUENCY_TYPES, ITEM_TYPES, NORMAL_SUBTYPES } from "../models";

const ItemForm = () => {
  const { state, actions } = usePlanner();
  const [formData, setFormData] = useState({
    name: "",
    itemType: ITEM_TYPES.NORMAL,
    subtype: NORMAL_SUBTYPES.DO,
    quantity: 1,
    durationHours: 0,
    durationMinutes: 30,
    frequency: FREQUENCY_TYPES.DAILY,
    customFrequency: 7,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter an item name");
      return;
    }

    const duration =
      parseInt(formData.durationHours) * 60 +
      parseInt(formData.durationMinutes);

    const itemData = {
      name: formData.name.trim(),
      itemType: formData.itemType,
      subtype:
        formData.itemType === ITEM_TYPES.NORMAL ? formData.subtype : null,
      quantity: parseInt(formData.quantity),
      duration: duration,
      frequency:
        formData.itemType === ITEM_TYPES.REPEATED ? formData.frequency : null,
      customFrequency:
        formData.itemType === ITEM_TYPES.REPEATED &&
        formData.frequency === FREQUENCY_TYPES.CUSTOM
          ? parseInt(formData.customFrequency)
          : null,
    };

    actions.addItem(itemData);
    toast.success("Item added successfully!");

    // Reset form
    setFormData({
      name: "",
      itemType: ITEM_TYPES.NORMAL,
      subtype: NORMAL_SUBTYPES.DO,
      quantity: 1,
      durationHours: 0,
      durationMinutes: 30,
      frequency: FREQUENCY_TYPES.DAILY,
      customFrequency: 7,
    });
  };

  const showFrequencyFields = formData.itemType === ITEM_TYPES.REPEATED;
  const showSubtypeFields = formData.itemType === ITEM_TYPES.NORMAL;
  const showCustomFrequency =
    showFrequencyFields && formData.frequency === FREQUENCY_TYPES.CUSTOM;

  return (
    <div className="card">
      <div className="card-header">📝 Add New Items</div>
      <div className="card-content">
        <form onSubmit={handleSubmit}>
          <div className="input-section">
            <div className="input-group">
              <label htmlFor="name">📝 Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter item name"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="itemType">📦 Type</label>
              <select
                id="itemType"
                name="itemType"
                value={formData.itemType}
                onChange={handleInputChange}
              >
                <option value={ITEM_TYPES.NORMAL}>📦 Normal</option>
                <option value={ITEM_TYPES.REPEATED}>🔄 Repeated</option>
              </select>
            </div>

            {showSubtypeFields && (
              <div className="input-group">
                <label htmlFor="subtype">🎯 Subtype</label>
                <select
                  id="subtype"
                  name="subtype"
                  value={formData.subtype}
                  onChange={handleInputChange}
                >
                  <option value={NORMAL_SUBTYPES.DECIDE}>🤔 Decide</option>
                  <option value={NORMAL_SUBTYPES.DELETE}>🗑️ Delete</option>
                  <option value={NORMAL_SUBTYPES.DEFER}>⏳ Defer</option>
                  <option value={NORMAL_SUBTYPES.PLAN}>📋 Plan</option>
                  <option value={NORMAL_SUBTYPES.DO}>✅ Do</option>
                </select>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="quantity">📊 Quantity</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-toggle-section">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={actions.toggleAdvancedOptions}
            >
              <span>⚙️</span>{" "}
              {state.showAdvancedOptions ? "Fewer Options" : "More Options"}
            </button>
          </div>

          {state.showAdvancedOptions && (
            <div className="advanced-options">
              <div className="input-group">
                <label htmlFor="durationHours">⏱️ Duration (hours)</label>
                <input
                  type="number"
                  id="durationHours"
                  name="durationHours"
                  value={formData.durationHours}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div className="input-group">
                <label htmlFor="durationMinutes">⏱️ Duration (minutes)</label>
                <input
                  type="number"
                  id="durationMinutes"
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleInputChange}
                  min="0"
                  max="59"
                />
              </div>

              {showFrequencyFields && (
                <div className="input-group">
                  <label htmlFor="frequency">🔄 Frequency</label>
                  <select
                    id="frequency"
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleInputChange}
                  >
                    <option value={FREQUENCY_TYPES.DAILY}>📅 Daily</option>
                    <option value={FREQUENCY_TYPES.WEEKLY}>📆 Weekly</option>
                    <option value={FREQUENCY_TYPES.BIWEEKLY}>
                      📋 Bi-weekly
                    </option>
                    <option value={FREQUENCY_TYPES.MONTHLY}>🗓️ Monthly</option>
                    <option value={FREQUENCY_TYPES.CUSTOM}>⚙️ Custom</option>
                  </select>
                </div>
              )}

              {showCustomFrequency && (
                <div className="input-group">
                  <label htmlFor="customFrequency">
                    📊 Custom Frequency (days)
                  </label>
                  <input
                    type="number"
                    id="customFrequency"
                    name="customFrequency"
                    value={formData.customFrequency}
                    onChange={handleInputChange}
                    min="1"
                  />
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-primary">
            <span>➕</span> Add to Collection
          </button>
        </form>
      </div>
    </div>
  );
};

export default ItemForm;
