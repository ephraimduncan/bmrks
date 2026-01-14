# Minimal Chrome Extension

Save any page or link to your Minimal bookmarks with one click.

## Development Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Load the extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. Copy the extension ID shown under the extension name

### 3. Configure the server

Add the extension ID to your `.env` file:

```bash
CHROME_EXTENSION_ID=your-extension-id-here
```

This is required for CORS validation - the server only accepts requests from your extension.

### 4. Run with web-ext (optional)

For automatic reloading during development:

```bash
bun run ext:dev
```

## Usage

### Save Current Page
Click the extension icon in the toolbar to instantly save the current page.

### Save from Context Menu
- Right-click anywhere on a page and select "Save to Minimal" to save the current page
- Right-click on any link and select "Save to Minimal" to save that specific link

### Feedback
- Green badge + notification = Successfully saved
- Red badge + notification = Error occurred
- Orange badge + notification = Not logged in (will open login page)

## Configuration

1. Right-click the extension icon and select "Options"
2. Change the Server URL if you're self-hosting or developing locally

## Building for Production

```bash
bun run ext:build
```

This creates a zip file in `extension-dist/` ready for Chrome Web Store submission.

## Security

The extension endpoint validates that requests come from the configured extension ID only. This prevents unauthorized third parties from making requests to the bookmark API on behalf of logged-in users.

When you publish to the Chrome Web Store, update `CHROME_EXTENSION_ID` in your production environment with the published extension ID.
