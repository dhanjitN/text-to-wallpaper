# Text to Wallpaper

Text to Wallpaper is a futuristic Electron application designed to help you personalize your desktop with custom-generated wallpapers. Whether you want to display an inspiring message or keep your mission objectives (todos) front and center, this tool creates high-quality 4K wallpapers and applies them directly to your desktop.

## Features

- **Text Mode**: Generate wallpapers with large, bold text in various futuristic styles.
- **Todo Mode**: Turn your daily tasks into a functional wallpaper to stay focused.
- **Futuristic Themes**: Choose from several built-in themes like Cyberpunk, Neon Night, Midnight, and more.
- **Multiple Fonts**: Select from a variety of sleek, terminal, and modern font styles.
- **Auto-Set**: Automatically sets the generated image as your wallpaper (optimized for Linux).
- **High Resolution**: Generates 4K (3840x2160) wallpapers for crisp displays.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Local Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd text-to-wallpaper
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the application:**
   ```bash
   npm start
   ```

## Usage

### Text Mode
1. Select "Text Mode" at the top.
2. Enter your message in the text area.
3. Choose your preferred **Font Style** and **Color Theme**.
4. Click **Generate & Set Wallpaper**.

### Todo Mode
1. Select "Todo Mode" at the top.
2. Add your tasks using the input field.
3. Check off tasks as you complete them.
4. Choose your style options and click **Generate & Set Wallpaper** to update your background with your current list.

## Customization

You can easily customize the application by modifying the source code:

### Adding New Themes
To add a new theme, open `renderer.js` and locate the `themes` object inside the `generateWallpaper` function. Add your new theme configuration:

```javascript
const themes = {
    // ... existing themes
    myNewTheme: { bg: '#123456', text: '#ffffff', accent: '#abcdef' },
};
```

Then, update `index.html` to include your new theme in the `<select id="theme-select">` dropdown:

```html
<option value="myNewTheme">My New Theme</option>
```

### Adding New Fonts
To add a new font:
1. Add the font link to the `<head>` of `index.html` (e.g., from Google Fonts).
2. Add the font option to the `<select id="font-select">` in `index.html`.
3. The renderer will automatically use the `value` of the selected option as the font family.

## Platform Support (Linux)

This application has specialized support for various Linux desktop environments:
- **GNOME**: Uses `gsettings`.
- **KDE Plasma**: Uses `qdbus` to run Plasma scripts.
- **COSMIC (Pop!_OS)**: Directly updates COSMIC background configuration files.
- **Other**: Uses the `wallpaper` npm package or `feh` as a fallback.

## License

This project is licensed under the [ISC License](LICENSE).
