import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useReducer } from "react";
import { auth, db } from "../firebase";
import { generateId, Item, ITEM_TYPES, ScheduleItem, SubItem } from "../models";

// Initial state
const initialState = {
  items: {},
  repeatedItems: {},
  schedule: {},
  completedItems: {},
  showAdvancedOptions: false,
  contextMenu: {
    isOpen: false,
    position: { x: 0, y: 0 },
    item: null,
    type: null, // 'pool' or 'schedule'
  },
};

// Action types
const ActionTypes = {
  ADD_ITEM: "ADD_ITEM",
  REMOVE_ITEM: "REMOVE_ITEM",
  UPDATE_ITEM: "UPDATE_ITEM",
  ADD_SUB_ITEM: "ADD_SUB_ITEM",
  REMOVE_SUB_ITEM: "REMOVE_SUB_ITEM",
  UPDATE_SUB_ITEM: "UPDATE_SUB_ITEM",
  SCHEDULE_ITEM: "SCHEDULE_ITEM",
  UNSCHEDULE_ITEM: "UNSCHEDULE_ITEM",
  TOGGLE_COMPLETION: "TOGGLE_COMPLETION",
  CLEAR_SCHEDULE: "CLEAR_SCHEDULE",
  TOGGLE_ADVANCED_OPTIONS: "TOGGLE_ADVANCED_OPTIONS",
  OPEN_CONTEXT_MENU: "OPEN_CONTEXT_MENU",
  CLOSE_CONTEXT_MENU: "CLOSE_CONTEXT_MENU",
  LOAD_DATA: "LOAD_DATA",
  CLEAR_ALL_DATA: "CLEAR_ALL_DATA",
};

// Reducer
const plannerReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.ADD_ITEM: {
      const { item } = action.payload;
      const targetPool =
        item.itemType === ITEM_TYPES.REPEATED ? "repeatedItems" : "items";
      return {
        ...state,
        [targetPool]: {
          ...state[targetPool],
          [item.id]: item,
        },
      };
    }

    case ActionTypes.REMOVE_ITEM: {
      const { itemId, itemType } = action.payload;
      const targetPool =
        itemType === ITEM_TYPES.REPEATED ? "repeatedItems" : "items";
      const newPool = { ...state[targetPool] };
      delete newPool[itemId];
      return {
        ...state,
        [targetPool]: newPool,
      };
    }

    case ActionTypes.UPDATE_ITEM: {
      const { itemId, updates, itemType } = action.payload;
      const targetPool =
        itemType === ITEM_TYPES.REPEATED ? "repeatedItems" : "items";
      return {
        ...state,
        [targetPool]: {
          ...state[targetPool],
          [itemId]: {
            ...state[targetPool][itemId],
            ...updates,
          },
        },
      };
    }

    case ActionTypes.ADD_SUB_ITEM: {
      const { parentId, subItem, itemType } = action.payload;
      const targetPool =
        itemType === ITEM_TYPES.REPEATED ? "repeatedItems" : "items";
      const parentItem = state[targetPool][parentId];

      return {
        ...state,
        [targetPool]: {
          ...state[targetPool],
          [parentId]: {
            ...parentItem,
            subItems: [...parentItem.subItems, subItem],
          },
        },
      };
    }

    case ActionTypes.REMOVE_SUB_ITEM: {
      const { parentId, subItemId, itemType } = action.payload;
      const targetPool =
        itemType === ITEM_TYPES.REPEATED ? "repeatedItems" : "items";
      const parentItem = state[targetPool][parentId];

      return {
        ...state,
        [targetPool]: {
          ...state[targetPool],
          [parentId]: {
            ...parentItem,
            subItems: parentItem.subItems.filter(
              (item) => item.id !== subItemId
            ),
          },
        },
      };
    }

    case ActionTypes.SCHEDULE_ITEM: {
      const { day, timeSlot, itemId, subItemId, index } = action.payload;
      const scheduleKey = `${day}-${timeSlot}`;
      const newScheduleItem = new ScheduleItem(
        itemId,
        subItemId,
        day,
        timeSlot,
        index
      );

      return {
        ...state,
        schedule: {
          ...state.schedule,
          [scheduleKey]: [
            ...(state.schedule[scheduleKey] || []),
            newScheduleItem,
          ],
        },
      };
    }

    case ActionTypes.UNSCHEDULE_ITEM: {
      const { day, timeSlot, index } = action.payload;
      const scheduleKey = `${day}-${timeSlot}`;
      const newSchedule = [...(state.schedule[scheduleKey] || [])];
      newSchedule.splice(index, 1);

      return {
        ...state,
        schedule: {
          ...state.schedule,
          [scheduleKey]: newSchedule,
        },
      };
    }

    case ActionTypes.TOGGLE_COMPLETION: {
      const { day, timeSlot, index } = action.payload;
      const scheduleKey = `${day}-${timeSlot}`;
      const scheduleItem = state.schedule[scheduleKey][index];
      const completionKey = `${scheduleItem.itemId}-${
        scheduleItem.subItemId || "main"
      }-${day}-${timeSlot}-${index}`;

      return {
        ...state,
        completedItems: {
          ...state.completedItems,
          [completionKey]: !state.completedItems[completionKey],
        },
      };
    }

    case ActionTypes.CLEAR_SCHEDULE:
      return {
        ...state,
        schedule: {},
        completedItems: {},
      };

    case ActionTypes.TOGGLE_ADVANCED_OPTIONS:
      return {
        ...state,
        showAdvancedOptions: !state.showAdvancedOptions,
      };

    case ActionTypes.OPEN_CONTEXT_MENU:
      return {
        ...state,
        contextMenu: {
          isOpen: true,
          position: action.payload.position,
          item: action.payload.item,
          type: action.payload.type,
        },
      };

    case ActionTypes.CLOSE_CONTEXT_MENU:
      return {
        ...state,
        contextMenu: {
          ...state.contextMenu,
          isOpen: false,
        },
      };

    case ActionTypes.LOAD_DATA:
      return {
        ...state,
        ...action.payload,
      };

    case ActionTypes.CLEAR_ALL_DATA:
      return initialState;

    default:
      return state;
  }
};

// Context
const PlannerContext = createContext();

// Provider component
export const PlannerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(plannerReducer, initialState);

  // Auth state listener and Firebase sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in - load from Firestore
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            dispatch({ type: ActionTypes.LOAD_DATA, payload: data });
          }
        } catch (error) {
          console.error("Failed to load data from Firestore:", error);
          // Fallback to localStorage
          const savedData = localStorage.getItem("plannerData");
          if (savedData) {
            try {
              const data = JSON.parse(savedData);
              dispatch({ type: ActionTypes.LOAD_DATA, payload: data });
            } catch (err) {
              console.error("Failed to load data from localStorage:", err);
            }
          }
        }
      } else {
        // User is signed out - load from localStorage
        const savedData = localStorage.getItem("plannerData");
        if (savedData) {
          try {
            const data = JSON.parse(savedData);
            dispatch({ type: ActionTypes.LOAD_DATA, payload: data });
          } catch (error) {
            console.error("Failed to load data from localStorage:", error);
          }
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Save data to both localStorage and Firestore
  useEffect(() => {
    const dataToSave = {
      items: state.items,
      repeatedItems: state.repeatedItems,
      schedule: state.schedule,
      completedItems: state.completedItems,
      version: "2.0",
    };

    // Always save to localStorage
    localStorage.setItem("plannerData", JSON.stringify(dataToSave));

    // Save to Firestore if user is signed in
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userDocRef = doc(db, "users", currentUser.uid);
      setDoc(userDocRef, dataToSave, { merge: true }).catch((error) => {
        console.error("Failed to save data to Firestore:", error);
      });
    }
  }, [state.items, state.repeatedItems, state.schedule, state.completedItems]);

  // Action creators
  const addItem = (itemData) => {
    const item = new Item(
      generateId(),
      itemData.name,
      itemData.itemType,
      itemData.subtype,
      itemData.frequency,
      itemData.customFrequency
    );
    item.quantity = itemData.quantity || 1;
    item.duration = itemData.duration || 0;

    dispatch({ type: ActionTypes.ADD_ITEM, payload: { item } });
    return item;
  };

  const removeItem = (itemId, itemType) => {
    dispatch({ type: ActionTypes.REMOVE_ITEM, payload: { itemId, itemType } });
  };

  const updateItem = (itemId, updates, itemType) => {
    dispatch({
      type: ActionTypes.UPDATE_ITEM,
      payload: { itemId, updates, itemType },
    });
  };

  const addSubItem = (parentId, subItemData, itemType) => {
    const subItem = new SubItem(
      generateId(),
      subItemData.name,
      parentId,
      subItemData.duration || 0
    );
    dispatch({
      type: ActionTypes.ADD_SUB_ITEM,
      payload: { parentId, subItem, itemType },
    });
    return subItem;
  };

  const removeSubItem = (parentId, subItemId, itemType) => {
    dispatch({
      type: ActionTypes.REMOVE_SUB_ITEM,
      payload: { parentId, subItemId, itemType },
    });
  };

  const scheduleItem = (day, timeSlot, itemId, subItemId = null, index = 0) => {
    dispatch({
      type: ActionTypes.SCHEDULE_ITEM,
      payload: { day, timeSlot, itemId, subItemId, index },
    });
  };

  const unscheduleItem = (day, timeSlot, index) => {
    dispatch({
      type: ActionTypes.UNSCHEDULE_ITEM,
      payload: { day, timeSlot, index },
    });
  };

  const toggleCompletion = (day, timeSlot, index) => {
    dispatch({
      type: ActionTypes.TOGGLE_COMPLETION,
      payload: { day, timeSlot, index },
    });
  };

  const clearSchedule = () => {
    dispatch({ type: ActionTypes.CLEAR_SCHEDULE });
  };

  const toggleAdvancedOptions = () => {
    dispatch({ type: ActionTypes.TOGGLE_ADVANCED_OPTIONS });
  };

  const openContextMenu = (position, item, type) => {
    dispatch({
      type: ActionTypes.OPEN_CONTEXT_MENU,
      payload: { position, item, type },
    });
  };

  const closeContextMenu = () => {
    dispatch({ type: ActionTypes.CLOSE_CONTEXT_MENU });
  };

  const clearAllData = () => {
    dispatch({ type: ActionTypes.CLEAR_ALL_DATA });
  };

  const value = {
    state,
    actions: {
      addItem,
      removeItem,
      updateItem,
      addSubItem,
      removeSubItem,
      scheduleItem,
      unscheduleItem,
      toggleCompletion,
      clearSchedule,
      toggleAdvancedOptions,
      openContextMenu,
      closeContextMenu,
      clearAllData,
    },
  };

  return (
    <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
  );
};

// Custom hook to use the planner context
export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error("usePlanner must be used within a PlannerProvider");
  }
  return context;
};
