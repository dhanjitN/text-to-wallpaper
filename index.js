const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

// Dynamic import for ESM-only wallpaper package
let setWallpaperPkg;
async function loadWallpaperPkg() {
  if (!setWallpaperPkg) {
    try {
      // Dynamic import() works in CJS to load ESM
      const { setWallpaper } = await import("wallpaper");
      setWallpaperPkg = setWallpaper;
    } catch (err) {
      console.error("Failed to load wallpaper package:", err);
    }
  }
}

if (process.platform === "linux") {
  app.commandLine.appendSwitch("ozone-platform-hint", "auto");
  app.commandLine.appendSwitch("enable-features", "WaylandWindowDecorations");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("index.html");
}

async function setWallpaperLinux(filePath) {
  const absolutePath = path.resolve(filePath);
  const fileUri = `file://${absolutePath}`;
  const sessionType = process.env.XDG_SESSION_TYPE;
  const desktopEnv = (process.env.XDG_CURRENT_DESKTOP || "").toLowerCase();

  console.log(`Setting wallpaper on Linux. Session: ${sessionType}, Desktop: ${desktopEnv}`);

  // COSMIC/Pop!_OS Detection
  const cosmicPath = path.join(app.getPath("home"), ".config/cosmic/com.system76.CosmicBackground/v1/");
  let isPopOS = false;
  try {
    const osRelease = fs.readFileSync("/etc/os-release", "utf8");
    isPopOS = osRelease.includes("ID=pop");
  } catch (e) {}

  if (isPopOS && fs.existsSync(cosmicPath)) {
    try {
      const backgroundsFile = path.join(cosmicPath, "backgrounds");
      if (fs.existsSync(backgroundsFile)) {
        const content = fs.readFileSync(backgroundsFile, "utf8");
        const outputs = content.match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, "")) || [];

        for (const output of outputs) {
          const outputFile = path.join(cosmicPath, `output.${output}`);
          const ronContent = `(
    output: "${output}",
    source: Path("${absolutePath}"),
    filter_by_theme: false,
    rotation_frequency: 300,
    filter_method: Lanczos,
    scaling_mode: Zoom,
    sampling_method: Alphanumeric,
)`;
          fs.writeFileSync(outputFile, ronContent);
        }

        await new Promise((resolve) => exec("pkill cosmic-bg", () => resolve()));
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        const { spawn } = require("child_process");
        const child = spawn("cosmic-bg", [], {
          detached: true,
          stdio: "ignore",
        });
        child.unref();
        return;
      }
    } catch (err) {
      console.error("Failed to set COSMIC wallpaper:", err);
    }
  }

  if (sessionType === "wayland" || desktopEnv.includes("gnome")) {
    const commands = [
      `gsettings set org.gnome.desktop.background picture-uri "${fileUri}"`,
      `gsettings set org.gnome.desktop.background picture-uri-dark "${fileUri}"`,
      `gsettings set org.gnome.desktop.screensaver picture-uri "${fileUri}"`,
    ];

    for (const cmd of commands) {
      try {
        await new Promise((resolve, reject) => {
          exec(cmd, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (err) {
        console.error(`Gsettings failed: ${cmd}`, err);
      }
    }
  } else if (desktopEnv.includes("kde")) {
    const script = `
      var allDesktops = desktops();
      for (var i = 0; i < allDesktops.length; i++) {
        var d = allDesktops[i];
        d.wallpaperPlugin = "org.kde.image";
        d.currentConfigGroup = ["Wallpaper", "org.kde.image", "General"];
        d.writeConfig("Image", "${fileUri}");
      }
    `;
    const cmd = `qdbus org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.evaluateScript '${script}'`;
    await new Promise((resolve, reject) => {
      exec(cmd, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } else {
    await loadWallpaperPkg();
    if (setWallpaperPkg) {
      await setWallpaperPkg(absolutePath);
    } else {
      // Last resort: feh
      await new Promise((resolve, reject) => {
        exec(`feh --bg-scale "${absolutePath}"`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
}

ipcMain.on("save-wallpaper", async (event, dataUrl) => {
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
  const userDataPath = app.getPath("userData");
  const fileName = `wallpaper_${Date.now()}.png`;
  const filePath = path.join(userDataPath, fileName);

  fs.writeFile(filePath, base64Data, "base64", async (err) => {
    if (err) {
      event.reply("save-wallpaper-response", { success: false, error: err.message });
    } else {
      try {
        if (process.platform === "linux") {
          await setWallpaperLinux(filePath);
        } else {
          await loadWallpaperPkg();
          if (setWallpaperPkg) {
            await setWallpaperPkg(filePath);
          } else {
            throw new Error("Wallpaper package not available");
          }
        }

        // Cleanup old files
        try {
          const files = fs.readdirSync(userDataPath);
          files.forEach((file) => {
            if (file.startsWith("wallpaper_") && file.endsWith(".png") && file !== fileName) {
              fs.unlinkSync(path.join(userDataPath, file));
            }
          });
        } catch (e) {}

        event.reply("save-wallpaper-response", { success: true, path: filePath });
      } catch (wallErr) {
        event.reply("save-wallpaper-response", { success: false, error: wallErr.message });
      }
    }
  });
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
