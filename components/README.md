# Components

This directory contains reusable UI components for the Cashalyst app. All components are designed to be consistent with the app's theme and provide a smooth user experience.

## Overview

The components in this directory follow a consistent design system and are built to be:
- **Reusable** across different screens
- **Accessible** with proper accessibility roles and labels
- **Themeable** using the app's design system
- **Responsive** with proper scaling for different screen sizes

## Components

### AppButton
A customizable button component with multiple variants and states.

**Props:**
- `title` (string): Button text
- `onPress` (function): Press handler
- `variant` (string): Style variant - 'filled', 'outlined', 'text', 'danger'
- `disabled` (boolean): Disable the button
- `loading` (boolean): Show loading spinner
- `fullWidth` (boolean): Make button full width
- `style` (object): Custom styles
- `labelStyle` (object): Custom text styles
- `children` (node): Custom content instead of title

**Usage:**
```jsx
<AppButton 
  title="Save Transaction" 
  onPress={handleSave}
  variant="filled"
  loading={isSaving}
/>
```

### AppTextField
A styled text input component with error handling and theming.

**Props:**
- `value` (string): Input value
- `onChangeText` (function): Text change handler
- `placeholder` (string): Placeholder text
- `keyboardType` (string): Keyboard type (default, numeric, email, etc.)
- `error` (boolean): Show error state
- `helperText` (string): Helper text below input
- `style` (object): Custom styles

**Usage:**
```jsx
<AppTextField
  value={amount}
  onChangeText={setAmount}
  placeholder="Enter amount"
  keyboardType="numeric"
  error={hasError}
  helperText="Please enter a valid amount"
/>
```

### AppDropdown
A custom dropdown component with modal-based selection.

**Props:**
- `selectedValue` (any): Currently selected value
- `onValueChange` (function): Selection change handler
- `items` (array): Array of options (strings or objects with value/label)
- `placeholder` (string): Placeholder text
- `error` (boolean): Show error state
- `helperText` (string): Helper text below dropdown

**Usage:**
```jsx
<AppDropdown
  selectedValue={selectedCategory}
  onValueChange={setSelectedCategory}
  items={categories}
  placeholder="Select category"
/>
```

### AppModal
A customizable modal component with different types and actions.

**Props:**
- `visible` (boolean): Modal visibility
- `onDismiss` (function): Dismiss handler
- `title` (string): Modal title
- `message` (string): Modal message
- `type` (string): Modal type - 'info', 'success', 'warning', 'error'
- `actions` (array): Action buttons array
- `showCloseButton` (boolean): Show close button
- `blurBackground` (boolean): Use blur effect
- `children` (node): Custom content

**Usage:**
```jsx
<AppModal
  visible={showModal}
  onDismiss={() => setShowModal(false)}
  title="Transaction Saved"
  message="Your transaction has been saved successfully."
  type="success"
  actions={[
    { text: "OK", onPress: handleOK }
  ]}
/>
```

### AppSearchBar
A search input component with clear functionality.

**Props:**
- `onSearch` (function): Search handler
- `placeholder` (string): Placeholder text
- `style` (object): Custom styles

**Usage:**
```jsx
<AppSearchBar
  onSearch={handleSearch}
  placeholder="Search transactions..."
/>
```

### AppSegmentedButton
A segmented control component for switching between options.

**Props:**
- `items` (array): Array of segments (strings or objects with label/icon)
- `selectedIndex` (number): Currently selected index
- `onSelect` (function): Selection change handler
- `style` (object): Custom styles

**Usage:**
```jsx
<AppSegmentedButton
  items={['Income', 'Expense']}
  selectedIndex={selectedType}
  onSelect={setSelectedType}
/>
```

### SplashScreen
An animated splash screen with financial quotes and loading animation.

**Props:**
- `onFinish` (function): Called when splash animation completes

**Usage:**
```jsx
<SplashScreen onFinish={handleSplashFinish} />
```

## Design System

All components use the app's theme system located in `utils/theme.js`. This ensures:
- Consistent colors, spacing, and typography
- Dark/light mode support
- Responsive design with proper scaling
- Accessibility compliance

## Contributing

When adding new components:
1. Follow the existing naming convention (`App` prefix)
2. Use the theme system for styling
3. Include proper TypeScript types if applicable
4. Add accessibility props where needed
5. Test on different screen sizes
6. Document props and usage examples

## Dependencies

Components use these main dependencies:
- `react-native-paper` for Material Design components
- `lucide-react-native` for icons
- `expo-blur` for blur effects
- `expo-linear-gradient` for gradients
- `@react-native-async-storage/async-storage` for storage

## File Structure

```
components/
├── AppButton.jsx          # Button component with variants
├── AppTextField.jsx       # Text input with theming
├── AppDropdown.jsx        # Custom dropdown with modal
├── AppModal.jsx          # Modal with different types
├── AppSearchBar.jsx      # Search input with clear
├── AppSegmentedButton.jsx # Segmented control
├── SplashScreen.jsx      # Animated splash screen
└── README.md            # This file
``` 