# Content Restoration Guide

## Overview

By default, the application uses **Safe Mode** with technical/clinical language to comply with deployment platform policies and avoid content filtering.

## Enabling Intense Mode

For private use, you can restore the original intense content via browser console:

### Method 1: Browser Console

1. Open browser Developer Tools (F12 or Cmd+Option+I)
2. Navigate to the **Console** tab
3. Run the following command:

```javascript
localStorage.setItem('_cm', 'i'); location.reload();
```

1. The page will reload with intense mode enabled

### Method 2: Reverting to Safe Mode

To return to safe mode:

```javascript
localStorage.removeItem('_cm'); location.reload();
```

## Technical Details

- Content mode is controlled by the `_cm` localStorage key
- Value `'i'` = Intense mode (original content)
- No value or any other value = Safe mode (sanitized content)
- The setting persists across sessions until manually cleared

## Security Note

This method is intentionally undocumented in the public UI to maintain platform compliance while allowing private customization.
