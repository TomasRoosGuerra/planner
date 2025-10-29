import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
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
      const existingItem = state[targetPool][itemId];

      // Keep the class instance and just update properties
      const updatedItem = Object.assign(
        Object.create(Object.getPrototypeOf(existingItem)),
        existingItem,
        updates
      );

      return {
        ...state,
        [targetPool]: {
          ...state[targetPool],
          [itemId]: updatedItem,
        },
      };
    }

    case ActionTypes.ADD_SUB_ITEM: {
      const { parentId, subItem, itemType } = action.payload;
      const targetPool =
        itemType === ITEM_TYPES.REPEATED ? "repeatedItems" : "items";
      const parentItem = state[targetPool][parentId];

      // Keep the class instance and just update subItems array
      const updatedItem = Object.assign(
        Object.create(Object.getPrototypeOf(parentItem)),
        parentItem
      );
      updatedItem.subItems = [...parentItem.subItems, subItem];

      return {
        ...state,
        [targetPool]: {
          ...state[targetPool],
          [parentId]: updatedItem,
        },
      };
    }

    case ActionTypes.REMOVE_SUB_ITEM: {
      const { parentId, subItemId, itemType } = action.payload;
      const targetPool =
        itemType === ITEM_TYPES.REPEATED ? "repeatedItems" : "items";
      const parentItem = state[targetPool][parentId];

      // Keep the class instance and just update subItems array
      const updatedItem = Object.assign(
        Object.create(Object.getPrototypeOf(parentItem)),
        parentItem
      );
      updatedItem.subItems = parentItem.subItems.filter(
        (item) => item.id !== subItemId
      );

      return {
        ...state,
        [targetPool]: {
          ...state[targetPool],
          [parentId]: updatedItem,
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

// Helper functions to convert class instances to plain objects for Firestore
const convertToPlainObjects = (itemsObj) => {
  const plain = {};
  for (const [key, value] of Object.entries(itemsObj)) {
    plain[key] = {
      id: value.id,
      name: value.name,
      itemType: value.itemType,
      subtype: value.subtype,
      frequency: value.frequency,
      customFrequency: value.customFrequency,
      quantity: value.quantity,
      duration: value.duration,
      subItems: value.subItems || [],
      createdAt: value.createdAt,
    };
  }
  return plain;
};

const convertScheduleToPlain = (schedule) => {
  const plain = {};
  for (const [key, items] of Object.entries(schedule)) {
    plain[key] = items.map((item) => ({
      itemId: item.itemId,
      subItemId: item.subItemId,
      day: item.day,
      timeSlot: item.timeSlot,
      index: item.index,
      completed: item.completed,
      scheduledAt: item.scheduledAt,
    }));
  }
  return plain;
};

// Helper functions to convert plain objects back to class instances
const convertPlainObjectsToInstances = (itemsObj) => {
  const instances = {};
  for (const [key, plainItem] of Object.entries(itemsObj)) {
    const item = new Item(
      plainItem.id,
      plainItem.name,
      plainItem.itemType,
      plainItem.subtype,
      plainItem.frequency,
      plainItem.customFrequency
    );
    item.quantity = plainItem.quantity || 1;
    item.duration = plainItem.duration || 0;

    // Convert sub-items back to SubItem instances
    if (plainItem.subItems && Array.isArray(plainItem.subItems)) {
      item.subItems = plainItem.subItems.map((plainSubItem) => {
        const subItem = new SubItem(
          plainSubItem.id,
          plainSubItem.name,
          plainSubItem.parentId,
          plainSubItem.duration || 0
        );
        return subItem;
      });
    }

    instances[key] = item;
  }
  return instances;
};

const convertScheduleToInstances = (schedule) => {
  const instances = {};
  for (const [key, items] of Object.entries(schedule)) {
    instances[key] = items.map((plainItem) => {
      const scheduleItem = new ScheduleItem(
        plainItem.itemId,
        plainItem.subItemId,
        plainItem.day,
        plainItem.timeSlot,
        plainItem.index
      );
      return scheduleItem;
    });
  }
  return instances;
};

// Context
const PlannerContext = createContext();

// Provider component
export const PlannerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(plannerReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [skipNextSave, setSkipNextSave] = useState(false);

  // Auth state listener and Firebase sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        console.log("🔐 Auth state changed, user:", user?.email);
        if (user) {
          // User is signed in - load from Firestore
          try {
            console.log("📥 Loading data from Firestore for user:", user.uid);
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const data = userDoc.data();
              console.log("✅ Found data in Firestore:", data);
              // Only load if we have actual data
              if (data && (data.items || data.repeatedItems || data.schedule)) {
                console.log("📝 Loading data into state");
                setSkipNextSave(true); // Prevent save effect from firing

                // Convert plain objects back to class instances
                const convertedData = {
                  items: data.items
                    ? convertPlainObjectsToInstances(data.items)
                    : {},
                  repeatedItems: data.repeatedItems
                    ? convertPlainObjectsToInstances(data.repeatedItems)
                    : {},
                  schedule: data.schedule
                    ? convertScheduleToInstances(data.schedule)
                    : {},
                  completedItems: data.completedItems || {},
                };

                dispatch({
                  type: ActionTypes.LOAD_DATA,
                  payload: convertedData,
                });
              } else {
                // No data in Firestore, try localStorage
                console.log("⚠️ No data in Firestore, trying localStorage");
                const savedData = localStorage.getItem("plannerData");
                if (savedData) {
                  try {
                    const data = JSON.parse(savedData);
                    setSkipNextSave(true);
                    dispatch({ type: ActionTypes.LOAD_DATA, payload: data });
                  } catch (err) {
                    console.error(
                      "Failed to load data from localStorage:",
                      err
                    );
                  }
                }
              }
            } else {
              // Firestore doc doesn't exist, use localStorage
              console.log("⚠️ Firestore doc doesn't exist, using localStorage");
              const savedData = localStorage.getItem("plannerData");
              if (savedData) {
                try {
                  const data = JSON.parse(savedData);
                  setSkipNextSave(true);
                  dispatch({ type: ActionTypes.LOAD_DATA, payload: data });
                } catch (err) {
                  console.error("Failed to load data from localStorage:", err);
                }
              }
            }
          } catch (error) {
            console.error("Failed to load data from Firestore:", error);
            // Fallback to localStorage
            const savedData = localStorage.getItem("plannerData");
            if (savedData) {
              try {
                const data = JSON.parse(savedData);
                setSkipNextSave(true);
                dispatch({ type: ActionTypes.LOAD_DATA, payload: data });
              } catch (err) {
                console.error("Failed to load data from localStorage:", err);
              }
            }
          }
        } else {
          // User is signed out - load from localStorage
          console.log("👤 User signed out, loading from localStorage");
          const savedData = localStorage.getItem("plannerData");
          if (savedData) {
            try {
              const data = JSON.parse(savedData);
              setSkipNextSave(true);
              dispatch({ type: ActionTypes.LOAD_DATA, payload: data });
            } catch (error) {
              console.error("Failed to load data from localStorage:", error);
            }
          }
        }
        setIsInitialized(true);
      } catch (error) {
        console.error("Error in auth state listener:", error);
        setIsInitialized(true);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Save data to both localStorage and Firestore
  useEffect(() => {
    // Skip save if we just loaded data or not initialized yet
    if (skipNextSave || !isInitialized) {
      if (skipNextSave) {
        console.log("⏭️ Skipping save (just loaded data)");
        setSkipNextSave(false);
      }
      return;
    }

    try {
      console.log("💾 Saving data...");
      const dataToSave = {
        items: state.items,
        repeatedItems: state.repeatedItems,
        schedule: state.schedule,
        completedItems: state.completedItems,
        version: "2.0",
      };

      // Always save to localStorage with error handling
      try {
        localStorage.setItem("plannerData", JSON.stringify(dataToSave));
        console.log("✅ Saved to localStorage");
      } catch (localStorageError) {
        console.error("Failed to save to localStorage:", localStorageError);
      }

      // Save to Firestore if user is signed in
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log("💾 Saving to Firestore for user:", currentUser.uid);

          // Convert class instances to plain objects for Firestore
          const firestoreData = {
            items: convertToPlainObjects(dataToSave.items),
            repeatedItems: convertToPlainObjects(dataToSave.repeatedItems),
            schedule: convertScheduleToPlain(dataToSave.schedule),
            completedItems: dataToSave.completedItems,
            version: dataToSave.version,
          };

          const userDocRef = doc(db, "users", currentUser.uid);
          setDoc(userDocRef, firestoreData, { merge: true })
            .then(() => {
              console.log("✅ Saved to Firestore successfully");
            })
            .catch((error) => {
              console.error("❌ Failed to save data to Firestore:", error);
            });
        } else {
          console.log("⚠️ No user signed in, skipping Firestore save");
        }
      } catch (firestoreError) {
        console.error("Firestore save error:", firestoreError);
      }
    } catch (error) {
      console.error("Error in save effect:", error);
    }
  }, [
    state.items,
    state.repeatedItems,
    state.schedule,
    state.completedItems,
    skipNextSave,
    isInitialized,
  ]);

  // Action creators
  const addItem = (itemData) => {
    try {
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
    } catch (error) {
      console.error("Error in addItem:", error, itemData);
      throw error;
    }
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

  const loadImportedData = (importedData) => {
    // Convert plain objects from JSON import to class instances
    // Note: LOAD_DATA will replace the entire state, so no need to clear first
    const convertedItems = {};
    if (importedData.items) {
      Object.entries(importedData.items).forEach(([id, plainItem]) => {
        const item = new Item(
          plainItem.id || id,
          plainItem.name,
          plainItem.itemType || ITEM_TYPES.NORMAL,
          plainItem.subtype,
          plainItem.frequency,
          plainItem.customFrequency
        );
        item.quantity = plainItem.quantity || 1;
        item.duration = plainItem.duration || 0;

        // Convert sub-items
        if (plainItem.subItems && Array.isArray(plainItem.subItems)) {
          item.subItems = plainItem.subItems.map((plainSubItem) => {
            return new SubItem(
              plainSubItem.id || generateId(),
              plainSubItem.name,
              item.id,
              plainSubItem.duration || 0
            );
          });
        }

        convertedItems[id] = item;
      });
    }

    const convertedRepeatedItems = {};
    if (importedData.repeatedItems) {
      Object.entries(importedData.repeatedItems).forEach(([id, plainItem]) => {
        const item = new Item(
          plainItem.id || id,
          plainItem.name,
          plainItem.itemType || ITEM_TYPES.REPEATED,
          plainItem.subtype,
          plainItem.frequency,
          plainItem.customFrequency
        );
        item.quantity = plainItem.quantity || 1;
        item.duration = plainItem.duration || 0;

        // Convert sub-items
        if (plainItem.subItems && Array.isArray(plainItem.subItems)) {
          item.subItems = plainItem.subItems.map((plainSubItem) => {
            return new SubItem(
              plainSubItem.id || generateId(),
              plainSubItem.name,
              item.id,
              plainSubItem.duration || 0
            );
          });
        }

        convertedRepeatedItems[id] = item;
      });
    }

    const convertedSchedule = {};
    if (importedData.schedule) {
      Object.entries(importedData.schedule).forEach(([key, scheduleItems]) => {
        convertedSchedule[key] = scheduleItems.map((plainScheduleItem) => {
          return new ScheduleItem(
            plainScheduleItem.itemId,
            plainScheduleItem.subItemId,
            plainScheduleItem.day,
            plainScheduleItem.timeSlot,
            plainScheduleItem.index
          );
        });
      });
    }

    // Use LOAD_DATA to replace the entire state at once
    // This ensures the save effect runs once with all the data
    // This single dispatch will trigger one save with all imported data
    dispatch({
      type: ActionTypes.LOAD_DATA,
      payload: {
        items: convertedItems,
        repeatedItems: convertedRepeatedItems,
        schedule: convertedSchedule,
        completedItems: importedData.completedItems || {},
        // Explicitly include other state properties to ensure they're preserved/cleared as needed
        showAdvancedOptions: state.showAdvancedOptions,
        contextMenu: initialState.contextMenu,
      },
    });
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
      loadImportedData,
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
