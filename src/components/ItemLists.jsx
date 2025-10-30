import React, { useMemo, useState } from "react";
import { useDrag } from "react-dnd";
import { usePlanner } from "../context/PlannerContext";
import {
  FREQUENCY_ICONS,
  ITEM_TYPES,
  ITEM_TYPE_ICONS,
  NORMAL_SUBTYPES,
  SUBTYPE_ICONS,
} from "../models";

const SubItemBox = ({ subItem, parentItem, parentItemType, onContextMenu }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "sub-item",
    item: {
      id: subItem.id,
      parentId: parentItem.id,
      type: "sub-item",
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(
      e,
      subItem,
      parentItemType === ITEM_TYPES.REPEATED ? "repeated" : "pool"
    );
  };

  return (
    <div
      ref={drag}
      className="meal-box sub-item-box"
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onContextMenu={handleContextMenu}
    >
      <span className="item-text">
        {subItem.name}
        <span className="sub-item-indicator">📋</span>
      </span>

      {subItem.duration > 0 && (
        <span className="duration-badge" title="Duration">
          ⏱️ {subItem.getFormattedDuration()}
        </span>
      )}

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

const ItemBox = ({ item, itemType, onContextMenu }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "item",
    item: {
      id: item.id,
      itemType: itemType,
      source: itemType === ITEM_TYPES.REPEATED ? "repeated" : "pool",
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const renderSubItems = () => {
    if (!item.subItems || item.subItems.length === 0) return null;

    return item.subItems.map((subItem) => (
      <SubItemBox
        key={subItem.id}
        subItem={subItem}
        parentItem={item}
        parentItemType={itemType}
        onContextMenu={onContextMenu}
      />
    ));
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(
      e,
      item,
      itemType === ITEM_TYPES.REPEATED ? "repeated" : "pool"
    );
  };

  const displayName = item.name;
  const duration = item.getFormattedDuration();
  const countDisplay = itemType === ITEM_TYPES.REPEATED ? "∞" : item.quantity;

  return (
    <div className="item-container">
      <div
        ref={drag}
        className="meal-box"
        style={{ opacity: isDragging ? 0.5 : 1 }}
        onContextMenu={handleContextMenu}
      >
        <span className="item-text">
          {displayName}
          <span className="type-icon" title={itemType}>
            {ITEM_TYPE_ICONS[itemType]}
          </span>
        </span>

        {item.subtype && (
          <span className="subtype-icon" title={item.subtype}>
            {SUBTYPE_ICONS[item.subtype]}
          </span>
        )}

        {item.frequency && (
          <span className="frequency-icon" title={item.frequency}>
            {FREQUENCY_ICONS[item.frequency]}
          </span>
        )}

        {duration && (
          <span className="duration-badge" title="Duration">
            ⏱️ {duration}
          </span>
        )}

        <span
          className="meal-count"
          title={
            itemType === ITEM_TYPES.REPEATED ? "Repeated item" : "Quantity"
          }
        >
          {countDisplay}
        </span>

        <button
          className="context-menu-btn"
          onClick={handleContextMenu}
          title="More options"
        >
          ⋯
        </button>
      </div>

      {renderSubItems()}
    </div>
  );
};

const ItemList = ({ items, title, itemType, onContextMenu }) => {
  const itemArray = Object.values(items);

  return (
    <div className="card">
      <div className="card-header">{title}</div>
      <div className="card-content">
        <div
          className={`meals-container ${itemArray.length === 0 ? "empty" : ""}`}
        >
          {itemArray.map((item) => (
            <ItemBox
              key={item.id}
              item={item}
              itemType={itemType}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const ItemLists = () => {
  const { state, actions } = usePlanner();
  const [activeTab, setActiveTab] = useState("DO");

  const handleContextMenu = (e, item, type) => {
    const rect = e.currentTarget.getBoundingClientRect();
    actions.openContextMenu(
      { x: rect.right - 120, y: rect.bottom + 5 },
      item,
      type
    );
  };

  // Build subtype-specific pools for normal items
  const normalItems = state.items;
  const decideItems = Object.fromEntries(
    Object.entries(normalItems).filter(
      ([, item]) => item.subtype === NORMAL_SUBTYPES.DECIDE
    )
  );
  const deleteItems = Object.fromEntries(
    Object.entries(normalItems).filter(
      ([, item]) => item.subtype === NORMAL_SUBTYPES.DELETE
    )
  );
  const deferItems = Object.fromEntries(
    Object.entries(normalItems).filter(
      ([, item]) => item.subtype === NORMAL_SUBTYPES.DEFER
    )
  );
  const planItems = Object.fromEntries(
    Object.entries(normalItems).filter(
      ([, item]) => item.subtype === NORMAL_SUBTYPES.PLAN
    )
  );
  const doItems = Object.fromEntries(
    Object.entries(normalItems).filter(
      ([, item]) => item.subtype === NORMAL_SUBTYPES.DO
    )
  );

  const tabs = useMemo(
    () => [
      { key: "DECIDE", label: "🤔 Decide", items: decideItems, type: ITEM_TYPES.NORMAL },
      { key: "DELETE", label: "🗑️ Delete", items: deleteItems, type: ITEM_TYPES.NORMAL },
      { key: "DEFER", label: "⏳ Defer", items: deferItems, type: ITEM_TYPES.NORMAL },
      { key: "PLAN", label: "📋 Plan", items: planItems, type: ITEM_TYPES.NORMAL },
      { key: "DO", label: "✅ Do", items: doItems, type: ITEM_TYPES.NORMAL },
      { key: "REPEATED", label: "🔄 Repeated", items: state.repeatedItems, type: ITEM_TYPES.REPEATED },
    ],
    [decideItems, deleteItems, deferItems, planItems, doItems, state.repeatedItems]
  );

  const active = tabs.find((t) => t.key === activeTab) || tabs[4];
  const headerCount = Object.keys(active.items).length;
  const headerTitle = `${active.label} (${headerCount})`;

  return (
    <div className="items-section">
      <div className="items-nav" role="tablist" aria-label="Item categories">
        {tabs.map((tab) => {
          const count = Object.keys(tab.items).length;
          const isActive = tab.key === active.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              className={`pill ${isActive ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="pill-label">{tab.label}</span>
              <span className="pill-count">{count}</span>
            </button>
          );
        })}
      </div>

      <ItemList
        items={active.items}
        title={headerTitle}
        itemType={active.type}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
};

export default ItemLists;
