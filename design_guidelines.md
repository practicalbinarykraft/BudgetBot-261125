# Budget Buddy - Design Guidelines

## Design Approach
**System-Based Approach** using **Material Design** principles with inspiration from Linear's typography and Stripe's restraint. This finance application prioritizes clarity, trust, and data readability over visual flair.

### Core Principles
1. **Data Clarity First**: Financial information must be instantly scannable and understandable
2. **Trustworthy Aesthetic**: Clean, professional design that feels secure for handling money
3. **Minimal Cognitive Load**: Simple layouts that don't overwhelm users with choices
4. **Consistent Patterns**: Reuse components extensively for familiarity

---

## Typography

**Font Families** (Google Fonts):
- Primary: `Inter` (weights: 400, 500, 600, 700)
- Monospace: `JetBrains Mono` (for currency amounts)

**Hierarchy**:
- Page Headers: `text-3xl font-bold` (30px)
- Section Headers: `text-xl font-semibold` (20px)
- Card Titles: `text-base font-semibold` (16px)
- Body Text: `text-sm font-normal` (14px)
- Labels/Captions: `text-xs font-medium` (12px)
- Currency Amounts: `font-mono text-lg font-semibold` for prominence

---

## Layout System

**Spacing Scale** (Tailwind units):
Use only: `2, 4, 6, 8, 12, 16, 20, 24` for consistency
- Component padding: `p-4` or `p-6`
- Section gaps: `gap-6` or `gap-8`
- Page margins: `p-6` (mobile), `p-8` (desktop)
- Card spacing: `space-y-4` for internal content

**Grid Structure**:
- Dashboard: 3-column grid on desktop (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- Transaction lists: Single column with clear row separation
- Forms: Single column, max-width `max-w-md`

---

## Component Library

### 1. Navigation
**Sidebar Navigation** (Desktop):
- Fixed left sidebar, width `w-64`
- Logo at top with `p-6`
- Navigation items with icons (Heroicons) + text
- Active state: subtle background with accent border-left
- Logout at bottom

**Mobile**: Hamburger menu with slide-out drawer

### 2. Dashboard Cards
**Stat Cards** (Income/Expense/Balance):
- White background, rounded corners `rounded-lg`
- Padding `p-6`
- Large currency amount with `font-mono text-2xl font-bold`
- Label above in `text-sm text-gray-600`
- Icon in top-right corner with accent color
- Subtle shadow `shadow-sm`

**Chart Card**:
- Similar container styling
- Header with title and period selector
- Chart fills remaining height
- Use Recharts library for line/bar charts

### 3. Transaction List
**Transaction Item**:
- Row format: Icon | Category & Description | Date | Amount
- Padding `py-3 px-4` with `border-b`
- Positive amounts in green, negative in red
- Category icon with colored circle background
- Hover state: subtle background change
- Delete icon on right (appears on hover)

### 4. Forms
**Input Fields**:
- Full-width with `rounded-md border`
- Label above with `text-sm font-medium`
- Padding `px-4 py-2`
- Focus ring with accent color
- Error states with red border and message below

**Category Selector**:
- Grid of category chips with icons
- Active state: filled background
- Icon + label in each chip

**Date Picker**: Use native input with calendar icon

### 5. Buttons
- Primary: Filled with accent color, `rounded-md px-4 py-2`
- Secondary: Outlined with transparent background
- Sizes: `text-sm` (default), `text-xs` (compact)

### 6. Wallets Display
**Wallet Card**:
- Similar to stat card but horizontal layout
- Icon | Name & Type | Balance
- Rounded `rounded-lg` with `p-4`
- Grid of 2-3 cards on desktop

### 7. Category Badges
- Small rounded pill `rounded-full px-3 py-1`
- Icon + text
- Colored background (pastel versions of category colors)

### 8. AI Analysis Section
- Prominent card with distinct styling
- Loading state with skeleton
- Text formatted with clear paragraphs
- Bullet points for tips

### 9. Modals/Dialogs
- Centered overlay with backdrop
- Max width `max-w-lg`
- Padding `p-6`
- Close button in top-right

---

## Specific Page Layouts

### Dashboard
- 3 stat cards at top in grid
- Chart card below (full width)
- Recent transactions list below
- Quick add transaction button (floating or prominent)

### Transactions Page
- Filters bar at top (date range, category, type)
- Add transaction button (top-right)
- List of transactions with infinite scroll
- Empty state with illustration

### Wallets Page
- Grid of wallet cards
- Add wallet button
- Total net worth summary at top

### AI Analysis Page
- Analysis card with results
- Refresh/regenerate button
- Historical insights below

### Settings Page
- Simple form layout
- Sections: Profile, Preferences, Telegram Connection
- Save buttons per section

---

## Visual Treatment Notes
- **No bold colors**: Use subtle backgrounds and borders
- **Green for income**: `text-green-600` 
- **Red for expenses**: `text-red-600`
- **Accent for actions**: Blue/purple tones
- **Gray scale**: Extensive use of `gray-50` to `gray-900` for hierarchy
- **Shadows**: Minimal, only `shadow-sm` on cards
- **Borders**: `border-gray-200` for separation

---

## Animations
**Minimal and purposeful only:**
- Fade-in for page transitions
- Subtle scale on button press
- Smooth dropdown menus
- NO complex animations, parallax, or scroll effects

---

## Icons
**Library**: Heroicons (outline for navigation, solid for emphasis)
Common icons:
- Dashboard: ChartBarIcon
- Transactions: CurrencyDollarIcon
- Wallets: WalletIcon
- Categories: TagIcon
- AI: SparklesIcon
- Settings: CogIcon

---

## Responsive Behavior
- Mobile: Stack everything vertically, full-width cards
- Tablet: 2-column grids
- Desktop: 3-column grids, sidebar navigation
- Breakpoints: `sm: 640px, md: 768px, lg: 1024px, xl: 1280px`