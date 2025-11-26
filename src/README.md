# 💊 Pill Timer

A modern, minimalist medication management Progressive Web App (PWA) built with React and Tailwind CSS.

![Pill Timer](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/react-18.x-61dafb.svg)

## ✨ Features

### 📋 Core Functionality
- **Smart Daily Reset** - Automatically clears "taken" statuses when a new day begins
- **Time-Based Greetings** - Personalized greetings based on time of day
- **Daily Progress Tracking** - Visual progress bar showing medication completion
- **Chronological Lists** - Medications sorted by time, name, or status

### 💊 Medication Management
- **Add/Edit/Delete** - Full CRUD operations for medications
- **Quick Toggle** - Mark medications as taken/untaken with a single tap
- **Duplicate Feature** - Quickly copy existing medications
- **Dosage Tracking** - Optional dosage information for each medication

### ⏱️ Smart Duration Tracking
- **Dual Input Modes** - Enter treatment duration as days OR date ranges
- **Bidirectional Conversion** - Automatically converts between days and dates
- **Progress Visualization** - See how many days remain for each medication
- **Treatment Completion** - Visual indicators when treatment is complete

### 🎨 Design & UX
- **Mobile-First Design** - Optimized for touch interactions
- **Clean Slate/Gray Palette** - Professional, minimalist aesthetic
- **Smooth Animations** - Polished transitions and interactions
- **12px Border Radius** - Consistent, modern card design
- **Generous Whitespace** - Easy-to-read, uncluttered interface

### 💾 Data Persistence
- **localStorage Integration** - All data saved locally on your device
- **No Backend Required** - Works completely offline
- **Privacy First** - Your medication data never leaves your device

### 📱 PWA Support
- **Install to Home Screen** - Add to your device like a native app
- **Service Worker** - Offline functionality (notifications commented out)
- **Responsive Design** - Works on phones, tablets, and desktops

## 🚀 Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/enamulkhanbd/pill-timer.git
   cd pill-timer
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
# or
yarn build
```

The production-ready files will be in the `dist` folder.

## 📱 Installing as PWA

### On Android (Chrome)
1. Open the app in Chrome
2. Tap the menu icon (⋮)
3. Select "Add to Home screen"
4. Tap "Add" to confirm
5. The app icon will appear on your home screen

### On iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm
5. The app icon will appear on your home screen

## 🛠️ Tech Stack

- **Frontend Framework:** React 18.x
- **Styling:** Tailwind CSS 4.0
- **UI Components:** Custom shadcn/ui inspired components
- **Icons:** Lucide React
- **Notifications:** Sonner (toast notifications)
- **Storage:** Browser localStorage
- **PWA:** Service Worker + Web App Manifest

## 📂 Project Structure

```
pill-timer/
├── App.tsx                    # Main application component
├── components/
│   ├── figma/
│   │   └── ImageWithFallback.tsx
│   └── ui/                    # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
├── styles/
│   └── globals.css            # Global styles and Tailwind config
├── public/
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service Worker
├── manifest.json              # PWA manifest (root)
├── sw.js                      # Service Worker (root)
└── README.md

```

## 🎯 Key Components

### App.tsx
Main application component containing:
- Medication state management
- localStorage integration
- Daily reset logic
- Modal forms for add/edit
- Progress tracking

### UI Components
Custom components inspired by shadcn/ui:
- `Button` - Multiple variants (primary, secondary, ghost, danger)
- `Input` - Styled text inputs with focus states
- `Card` - Container component with hover effects
- `Modal` - Animated modal for forms

## 🔧 Configuration

### Tailwind CSS
The app uses Tailwind CSS v4.0 with custom configuration in `/styles/globals.css`:
- Custom color palette (slate/gray)
- Typography settings
- Animation utilities

### PWA Settings
Configure PWA settings in `manifest.json`:
- App name and description
- Theme colors
- Icons (currently placeholders)
- Display mode (standalone)

## 📊 Data Structure

```typescript
interface Medication {
  id: string;              // Unique identifier
  name: string;            // Medication name
  time: string;            // Time in HH:MM format
  dosage?: string;         // Optional dosage (e.g., "500mg")
  taken: boolean;          // Completion status
  daysNeeded?: number;     // Treatment duration in days
  startDate?: string;      // ISO date string
  endDate?: string;        // ISO date string
}
```

## 🚧 Roadmap

- [ ] Re-enable push notifications with proper PWA support
- [ ] Add medication history/calendar view
- [ ] Export/import medication data
- [ ] Medication reminders with sound
- [ ] Multi-dose medications (e.g., 3x per day)
- [ ] Medication interaction warnings
- [ ] Dark mode support
- [ ] Multiple user profiles

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Enamul Khan**
- GitHub: [@enamulkhanbd](https://github.com/enamulkhanbd)

## 🙏 Acknowledgments

- Design inspiration from modern healthcare apps
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Built with [Figma Make](https://www.figma.com/)

## 📞 Support

If you have any questions or need help, please open an issue in the GitHub repository.

---

**Note:** This app stores all data locally on your device. Your medication information is private and never transmitted to any server.
