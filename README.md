# General Planner - React Version

A modern, feature-rich general planner built with React, featuring drag-and-drop scheduling, progressive disclosure UI, and desert minimalism design.

## 🚀 Features

### Core Functionality

- **Item Management**: Create normal and repeated items with subtypes
- **Drag & Drop Scheduling**: Intuitive weekly schedule with time slots
- **Sub-items**: Break down main items into manageable sub-tasks
- **Duration Tracking**: Set and track estimated durations for items
- **Completion Tracking**: Mark scheduled items as complete/incomplete
- **Data Persistence**: Automatic localStorage saving and loading

### UI/UX Features

- **Progressive Disclosure**: Context menus hide secondary actions behind "⋯" button
- **Collapsible Forms**: Advanced options hidden behind "More Options" toggle
- **Desert Minimalism Design**: Warm, calming color palette with clean typography
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Toast Notifications**: User-friendly feedback for all actions

### Item Types & Subtypes

- **Normal Items**: With subtypes (Decide, Delete, Defer, Plan, Do)
- **Repeated Items**: With frequency settings (Daily, Weekly, Bi-weekly, Monthly, Custom)

### Export/Import

- **CSV Export**: Schedule and items in spreadsheet format
- **JSON Export**: Complete data backup
- **Data Import**: Restore from JSON backups
- **Clear Options**: Clear schedule or all data

## 🛠️ Technology Stack

- **React 18**: Modern React with hooks and functional components
- **React DnD**: Drag and drop functionality
- **React Context**: State management without external libraries
- **React Hot Toast**: Beautiful toast notifications
- **Vite**: Fast build tool and development server
- **CSS3**: Custom desert minimalism styling with CSS Grid and Flexbox

## 📦 Installation

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## 🏗️ Project Structure

```
src/
├── components/           # React components
│   ├── Header.jsx       # App header
│   ├── ItemForm.jsx     # Add/edit items form
│   ├── ItemLists.jsx    # Available and repeated items
│   ├── Schedule.jsx     # Weekly schedule grid
│   ├── ContextMenu.jsx  # Progressive disclosure menu
│   └── ExportSection.jsx # Export/import functionality
├── context/             # React Context for state management
│   └── PlannerContext.jsx
├── models/              # Data models and utilities
│   └── index.js
├── App.jsx              # Main app component
├── App.css              # Desert minimalism styles
└── main.jsx             # App entry point
```

## 🎨 Design Philosophy

### Desert Minimalism

- **Warm Earth Tones**: Sandy beiges, terracotta, and warm browns
- **Clean Typography**: Source Sans Pro for UI, Crimson Text for headers
- **Subtle Shadows**: Soft, natural-looking depth
- **Rounded Corners**: Organic, friendly shapes
- **Backdrop Blur**: Modern glass-morphism effects

### Progressive Disclosure

- **80/20 Rule**: Show essential features by default
- **Context Menus**: Hide secondary actions behind "⋯" button
- **Collapsible Forms**: Advanced options behind toggle
- **Smart Defaults**: Sensible initial values and behaviors

## 🔧 Key Components

### PlannerContext

Centralized state management using React Context and useReducer:

- Item management (add, remove, update)
- Schedule operations (schedule, unschedule, complete)
- UI state (context menu, advanced options)
- Data persistence (localStorage integration)

### Drag & Drop System

- **React DnD**: Professional drag and drop library
- **Item Types**: Distinguish between different draggable items
- **Drop Zones**: Schedule cells accept dropped items
- **Visual Feedback**: Drag preview and drop indicators

### Context Menu System

- **Progressive Disclosure**: Hide secondary actions
- **Dynamic Content**: Menu items change based on context
- **Smart Positioning**: Fixed positioning to avoid z-index issues
- **Click Outside**: Automatic menu closing

## 📱 Responsive Design

- **Mobile First**: Optimized for touch interactions
- **Flexible Grid**: Schedule adapts to screen size
- **Collapsible Sections**: Form sections stack on mobile
- **Touch Friendly**: Larger touch targets on mobile

## 🔄 Data Flow

1. **User Input** → ItemForm component
2. **Form Submission** → PlannerContext actions
3. **State Update** → useReducer updates state
4. **UI Re-render** → Components reflect new state
5. **Persistence** → localStorage automatically saves

## 🚀 Performance Optimizations

- **React.memo**: Prevent unnecessary re-renders
- **useCallback**: Memoize event handlers
- **useMemo**: Cache expensive calculations
- **Efficient State**: Minimal state updates
- **Lazy Loading**: Components load as needed

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build and test production bundle
npm run build
npm run preview
```

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🔮 Future Enhancements

- **Team Collaboration**: Multi-user support
- **Calendar Integration**: Sync with external calendars
- **Mobile App**: React Native version
- **Advanced Analytics**: Usage statistics and insights
- **Themes**: Multiple design themes
- **Offline Support**: Service worker implementation

---

Built with ❤️ using React and modern web technologies.
