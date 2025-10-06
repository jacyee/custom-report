# Vue Dashboard with Filtering

A modern, responsive dashboard built with Vue 3, TypeScript, and Vite featuring advanced filtering and data visualization.

## Features

- 📊 **Real-time Statistics**: Total projects, active count, total value, and average value
- 🔍 **Advanced Filtering**: Search by name, filter by category, status, and priority
- 📈 **Sorting Options**: Sort by name, value, date, or priority (ascending/descending)
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- 🎨 **Modern UI**: Beautiful gradient backgrounds, glassmorphism effects, and smooth animations
- 🏷️ **Status & Priority Badges**: Color-coded visual indicators
- 💰 **Currency Formatting**: Properly formatted monetary values
- 📅 **Date Formatting**: Human-readable date display

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Dashboard Features

### Filtering Options
- **Search**: Type to search project names
- **Category**: Filter by Development, Marketing, Sales
- **Status**: Filter by Active, Pending, Inactive
- **Priority**: Filter by High, Medium, Low priority
- **Sorting**: Sort by Name, Value, Date, or Priority
- **Order**: Ascending or Descending

### Data Visualization
- **Statistics Cards**: Real-time metrics at the top
- **Data Table**: Sortable and filterable project list
- **Status Badges**: Color-coded status indicators
- **Priority Badges**: Visual priority levels
- **Responsive Layout**: Adapts to all screen sizes

## Project Structure

```
src/
├── App.vue          # Main dashboard component
├── main.ts          # Application entry point
└── components/      # Reusable components
```

## Customization

### Adding New Data Fields
1. Update the `DataItem` interface in `App.vue`
2. Add new filter controls in the template
3. Update the filtering logic in `filteredData` computed property
4. Add new columns to the data table

### Styling
- All styles are scoped to the component
- Uses CSS Grid and Flexbox for responsive layouts
- Custom CSS variables can be added for theming
- Glassmorphism effects with backdrop-filter

### Data Source
Currently uses sample data. To connect to an API:
1. Replace the `data` ref with API calls
2. Add loading states
3. Implement error handling
4. Add data refresh functionality

## Browser Support

- Chrome 88+
- Firefox 87+
- Safari 14+
- Edge 88+

## Performance

- Optimized with Vue 3 Composition API
- Computed properties for efficient reactivity
- Responsive images and lazy loading ready
- Minimal bundle size with Vite

## License

MIT License - feel free to use this project for your own dashboards!