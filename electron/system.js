const { exec, spawn, execSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const PLATFORM = process.platform;
const IS_LINUX = PLATFORM === 'linux';
const IS_MAC = PLATFORM === 'darwin';
const IS_WINDOWS = PLATFORM === 'win32';

function execpromise(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) {
                reject({ error: error.message, stderr });
            } else {
                resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
            }
        });
    });
}

async function getwifistatus() {
    try {
        if (IS_LINUX) {
            const { stdout } = await execpromise('nmcli -t -f WIFI general');
            const enabled = stdout.includes('enabled');
            const { stdout: conninfo } = await execpromise('nmcli -t -f active,ssid dev wifi | grep "^yes"').catch(() => ({ stdout: '' }));
            const ssid = conninfo ? conninfo.split(':')[1] : null;
            return { enabled, connected: !!ssid, ssid };
        } else if (IS_MAC) {
            const { stdout: powerout } = await execpromise('networksetup -getairportpower en0');
            const enabled = powerout.toLowerCase().includes('on');
            const { stdout: ssidout } = await execpromise('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | grep " SSID" | cut -d ":" -f 2').catch(() => ({ stdout: '' }));
            const ssid = ssidout ? ssidout.trim() : null;
            return { enabled, connected: !!ssid, ssid };
        } else if (IS_WINDOWS) {
            const { stdout } = await execpromise('netsh wlan show interfaces');
            const enabled = !stdout.includes('There is no wireless interface');
            const ssidmatch = stdout.match(/SSID\s*:\s*(.+)/);
            const ssid = ssidmatch ? ssidmatch[1].trim() : null;
            return { enabled, connected: !!ssid, ssid };
        }
    } catch (e) {
        return { enabled: false, connected: false, ssid: null, error: e.message };
    }
}

async function setwifienabled(enabled) {
    try {
        if (IS_LINUX) {
            await execpromise(`nmcli radio wifi ${enabled ? 'on' : 'off'}`);
            return { success: true };
        } else if (IS_MAC) {
            await execpromise(`networksetup -setairportpower en0 ${enabled ? 'on' : 'off'}`);
            return { success: true };
        } else if (IS_WINDOWS) {
            await execpromise(`netsh interface set interface "Wi-Fi" ${enabled ? 'enabled' : 'disabled'}`);
            return { success: true };
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function getwifinetworks() {
    try {
        if (IS_LINUX) {
            await execpromise('nmcli dev wifi rescan').catch(() => { });
            const { stdout } = await execpromise('nmcli -t -f ssid,signal,security,in-use dev wifi list');
            const networks = stdout.split('\n').filter(Boolean).map(line => {
                const [ssid, signal, security, inuse] = line.split(':');
                return { ssid: ssid || '(Hidden)', signal: parseInt(signal) || 0, security: security || 'Open', connected: inuse === '*' };
            });
            return { success: true, networks };
        } else if (IS_MAC) {
            const { stdout } = await execpromise('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s');
            const lines = stdout.split('\n').slice(1);
            const networks = lines.filter(Boolean).map(line => {
                const parts = line.trim().split(/\s+/);
                const ssid = parts[0];
                const signal = parseInt(parts[2]) || 0;
                const security = parts.slice(6).join(' ') || 'Open';
                return { ssid, signal: Math.min(100, Math.max(0, signal + 100)), security, connected: false };
            });
            return { success: true, networks };
        } else if (IS_WINDOWS) {
            const { stdout } = await execpromise('netsh wlan show networks mode=bssid');
            const networks = [];
            const blocks = stdout.split(/SSID \d+ :/);
            blocks.slice(1).forEach(block => {
                const ssidmatch = block.match(/^\s*(.+)/);
                const signalmatch = block.match(/Signal\s*:\s*(\d+)/);
                const secmatch = block.match(/Authentication\s*:\s*(.+)/);
                if (ssidmatch) {
                    networks.push({
                        ssid: ssidmatch[1].trim(),
                        signal: parseInt(signalmatch?.[1]) || 0,
                        security: secmatch?.[1].trim() || 'Open',
                        connected: false
                    });
                }
            });
            return { success: true, networks };
        }
    } catch (e) {
        return { success: false, networks: [], error: e.message };
    }
}

async function connecttowifi(ssid, password) {
    try {
        if (IS_LINUX) {
            if (password) {
                await execpromise(`nmcli dev wifi connect "${ssid}" password "${password}"`);
            } else {
                await execpromise(`nmcli dev wifi connect "${ssid}"`);
            }
            return { success: true };
        } else if (IS_MAC) {
            if (password) {
                await execpromise(`networksetup -setairportnetwork en0 "${ssid}" "${password}"`);
            } else {
                await execpromise(`networksetup -setairportnetwork en0 "${ssid}"`);
            }
            return { success: true };
        } else if (IS_WINDOWS) {
            await execpromise(`netsh wlan connect name="${ssid}"`);
            return { success: true };
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function getbluetoothstatus() {
    try {
        if (IS_LINUX) {
            const { stdout } = await execpromise('bluetoothctl show 2>/dev/null | grep "Powered:"');
            const enabled = stdout.includes('yes');
            return { enabled, available: true };
        } else if (IS_MAC) {
            const { stdout } = await execpromise('defaults read /Library/Preferences/com.apple.Bluetooth ControllerPowerState 2>/dev/null || echo 0');
            return { enabled: stdout.trim() === '1', available: true };
        } else if (IS_WINDOWS) {
            const { stdout } = await execpromise('powershell -command "Get-PnpDevice -Class Bluetooth | Where-Object {$_.Status -eq \'OK\'} | Select-Object -First 1"');
            return { enabled: !!stdout.trim(), available: true };
        }
    } catch (e) {
        return { enabled: false, available: false, error: e.message };
    }
}

async function setbluetoothenabled(enabled) {
    try {
        if (IS_LINUX) {
            await execpromise(`bluetoothctl power ${enabled ? 'on' : 'off'}`);
            return { success: true };
        } else if (IS_MAC) {
            await execpromise(`blueutil --power ${enabled ? '1' : '0'}`);
            return { success: true };
        } else if (IS_WINDOWS) {
            return { success: false, error: 'Bluetooth toggle requires admin on Windows' };
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function getbluetoothdevices() {
    try {
        if (IS_LINUX) {
            const { stdout: paired } = await execpromise('bluetoothctl devices Paired 2>/dev/null || bluetoothctl paired-devices 2>/dev/null').catch(() => ({ stdout: '' }));
            const { stdout: connected } = await execpromise('bluetoothctl devices Connected 2>/dev/null').catch(() => ({ stdout: '' }));
            const connectedmacs = connected.split('\n').map(l => l.split(' ')[1]).filter(Boolean);
            const devices = paired.split('\n').filter(Boolean).map(line => {
                const parts = line.replace('Device ', '').split(' ');
                const mac = parts[0];
                const name = parts.slice(1).join(' ');
                return { mac, name, connected: connectedmacs.includes(mac) };
            });
            return { success: true, devices };
        } else if (IS_MAC) {
            const { stdout } = await execpromise('system_profiler SPBluetoothDataType 2>/dev/null').catch(() => ({ stdout: '' }));
            const devices = [];
            const lines = stdout.split('\n');
            let currentdevice = null;
            for (const line of lines) {
                if (line.match(/^\s{8}\w/)) {
                    if (currentdevice) devices.push(currentdevice);
                    currentdevice = { name: line.trim().replace(/:$/, ''), connected: false, mac: '' };
                } else if (currentdevice && line.includes('Address:')) {
                    currentdevice.mac = line.split(':').slice(1).join(':').trim();
                } else if (currentdevice && line.includes('Connected: Yes')) {
                    currentdevice.connected = true;
                }
            }
            if (currentdevice) devices.push(currentdevice);
            return { success: true, devices };
        }
        return { success: true, devices: [] };
    } catch (e) {
        return { success: false, devices: [], error: e.message };
    }
}

async function getvolume() {
    try {
        if (IS_LINUX) {
            const { stdout } = await execpromise("pactl get-sink-volume @DEFAULT_SINK@ | grep -oP '\\d+%' | head -1");
            const volume = parseInt(stdout.replace('%', '')) || 0;
            const { stdout: muteout } = await execpromise('pactl get-sink-mute @DEFAULT_SINK@');
            const muted = muteout.includes('yes');
            return { volume, muted };
        } else if (IS_MAC) {
            const { stdout } = await execpromise('osascript -e "output volume of (get volume settings)"');
            const { stdout: muteout } = await execpromise('osascript -e "output muted of (get volume settings)"');
            return { volume: parseInt(stdout) || 0, muted: muteout.trim() === 'true' };
        } else if (IS_WINDOWS) {
            const { stdout } = await execpromise('powershell -command "(Get-AudioDevice -PlaybackVolume)"');
            return { volume: parseInt(stdout) || 0, muted: false };
        }
    } catch (e) {
        return { volume: 50, muted: false, error: e.message };
    }
}

async function setvolume(volume) {
    try {
        volume = Math.max(0, Math.min(100, volume));
        if (IS_LINUX) {
            await execpromise(`pactl set-sink-volume @DEFAULT_SINK@ ${volume}%`);
            return { success: true };
        } else if (IS_MAC) {
            await execpromise(`osascript -e "set volume output volume ${volume}"`);
            return { success: true };
        } else if (IS_WINDOWS) {
            await execpromise(`powershell -command "Set-AudioDevice -PlaybackVolume ${volume}"`);
            return { success: true };
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function setmuted(muted) {
    try {
        if (IS_LINUX) {
            await execpromise(`pactl set-sink-mute @DEFAULT_SINK@ ${muted ? '1' : '0'}`);
            return { success: true };
        } else if (IS_MAC) {
            await execpromise(`osascript -e "set volume output muted ${muted}"`);
            return { success: true };
        } else if (IS_WINDOWS) {
            return { success: false, error: 'Mute toggle not supported' };
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function getbrightness() {
    try {
        if (IS_LINUX) {
            const { stdout: max } = await execpromise('cat /sys/class/backlight/*/max_brightness 2>/dev/null | head -1').catch(() => ({ stdout: '100' }));
            const { stdout: current } = await execpromise('cat /sys/class/backlight/*/brightness 2>/dev/null | head -1').catch(() => ({ stdout: '50' }));
            const brightness = Math.round((parseInt(current) / parseInt(max)) * 100);
            return { brightness, available: true };
        } else if (IS_MAC) {
            const { stdout } = await execpromise('brightness -l 2>/dev/null | grep "display 0" | cut -d " " -f 4').catch(() => ({ stdout: '0.5' }));
            return { brightness: Math.round(parseFloat(stdout) * 100), available: true };
        }
        return { brightness: 100, available: false };
    } catch (e) {
        return { brightness: 100, available: false, error: e.message };
    }
}

async function setbrightness(brightness) {
    try {
        brightness = Math.max(0, Math.min(100, brightness));
        if (IS_LINUX) {
            await execpromise(`brightnessctl set ${brightness}% 2>/dev/null || xrandr --output $(xrandr | grep " connected" | head -1 | cut -d " " -f 1) --brightness ${brightness / 100}`);
            return { success: true };
        } else if (IS_MAC) {
            await execpromise(`brightness ${brightness / 100}`);
            return { success: true };
        }
        return { success: false, error: 'Not supported' };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function getbatterystatus() {
    try {
        if (IS_LINUX) {
            const { stdout: capacity } = await execpromise('cat /sys/class/power_supply/BAT*/capacity 2>/dev/null | head -1').catch(() => ({ stdout: '100' }));
            const { stdout: status } = await execpromise('cat /sys/class/power_supply/BAT*/status 2>/dev/null | head -1').catch(() => ({ stdout: 'Unknown' }));
            return {
                percentage: parseInt(capacity) || 100,
                charging: status.toLowerCase().includes('charging') && !status.toLowerCase().includes('discharging'),
                pluggedin: status.toLowerCase() === 'full' || (status.toLowerCase().includes('charging') && !status.toLowerCase().includes('discharging')),
                available: true
            };
        } else if (IS_MAC) {
            const { stdout } = await execpromise('pmset -g batt');
            const percentmatch = stdout.match(/(\d+)%/);
            const charging = stdout.includes('charging') && !stdout.includes('discharging');
            return {
                percentage: parseInt(percentmatch?.[1]) || 100,
                charging,
                pluggedin: stdout.includes('AC Power') || charging,
                available: true
            };
        } else if (IS_WINDOWS) {
            const { stdout } = await execpromise('WMIC PATH Win32_Battery Get EstimatedChargeRemaining,BatteryStatus /Format:List');
            const percentmatch = stdout.match(/EstimatedChargeRemaining=(\d+)/);
            const statusmatch = stdout.match(/BatteryStatus=(\d+)/);
            return {
                percentage: parseInt(percentmatch?.[1]) || 100,
                charging: statusmatch?.[1] === '2',
                pluggedin: statusmatch?.[1] === '2' || statusmatch?.[1] === '6',
                available: true
            };
        }
    } catch (e) {
        return { percentage: 100, charging: false, pluggedin: true, available: false, error: e.message };
    }
}

async function getprocesses() {
    try {
        if (IS_LINUX || IS_MAC) {
            const { stdout } = await execpromise('ps aux --sort=-%mem | head -100');
            const lines = stdout.split('\n').slice(1);
            const processes = lines.filter(Boolean).map(line => {
                const parts = line.trim().split(/\s+/);
                return {
                    user: parts[0],
                    pid: parseInt(parts[1]),
                    cpu: parseFloat(parts[2]),
                    mem: parseFloat(parts[3]),
                    command: parts.slice(10).join(' ')
                };
            });
            return { success: true, processes };
        } else if (IS_WINDOWS) {
            const { stdout } = await execpromise('powershell -command "Get-Process | Select-Object -First 100 Id, ProcessName, CPU, WorkingSet | ConvertTo-Json"');
            const data = JSON.parse(stdout);
            const processes = (Array.isArray(data) ? data : [data]).map(p => ({
                pid: p.Id,
                command: p.ProcessName,
                cpu: p.CPU || 0,
                mem: Math.round((p.WorkingSet / 1024 / 1024) * 10) / 10,
                user: ''
            }));
            return { success: true, processes };
        }
    } catch (e) {
        return { success: false, processes: [], error: e.message };
    }
}

async function killprocess(pid, force = false) {
    try {
        if (IS_LINUX || IS_MAC) {
            await execpromise(`kill ${force ? '-9' : '-15'} ${pid}`);
            return { success: true };
        } else if (IS_WINDOWS) {
            await execpromise(`taskkill ${force ? '/F' : ''} /PID ${pid}`);
            return { success: true };
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function poweraction(action) {
    try {
        if (IS_LINUX) {
            const commands = {
                shutdown: 'systemctl poweroff',
                restart: 'systemctl reboot',
                sleep: 'systemctl suspend',
                hibernate: 'systemctl hibernate',
                logout: 'loginctl terminate-session self',
                lock: 'loginctl lock-session'
            };
            if (commands[action]) {
                await execpromise(commands[action]);
                return { success: true };
            }
        } else if (IS_MAC) {
            const commands = {
                shutdown: 'osascript -e \'tell app "System Events" to shut down\'',
                restart: 'osascript -e \'tell app "System Events" to restart\'',
                sleep: 'pmset sleepnow',
                logout: 'osascript -e \'tell app "System Events" to log out\'',
                lock: '/System/Library/CoreServices/Menu\\ Extras/User.menu/Contents/Resources/CGSession -suspend'
            };
            if (commands[action]) {
                await execpromise(commands[action]);
                return { success: true };
            }
        } else if (IS_WINDOWS) {
            const commands = {
                shutdown: 'shutdown /s /t 0',
                restart: 'shutdown /r /t 0',
                sleep: 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0',
                hibernate: 'shutdown /h',
                logout: 'shutdown /l',
                lock: 'rundll32.exe user32.dll,LockWorkStation'
            };
            if (commands[action]) {
                await execpromise(commands[action]);
                return { success: true };
            }
        }
        return { success: false, error: 'Unknown action' };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function launchapp(apppath, args = []) {
    try {
        if (!apppath || apppath.trim() === '') {
            return { success: false, error: 'Invalid app path' };
        }
        let child;
        if (IS_LINUX) {
            const parts = apppath.split(' ');
            const cmd = parts[0];
            const cmdargs = [...parts.slice(1), ...args];
            child = spawn(cmd, cmdargs, { detached: true, stdio: 'ignore', shell: true });
        } else if (IS_MAC) {
            child = spawn('open', [apppath, ...args], { detached: true, stdio: 'ignore' });
        } else if (IS_WINDOWS) {
            child = spawn('cmd', ['/c', 'start', '', apppath, ...args], { detached: true, stdio: 'ignore', shell: true });
        }
        if (child) {
            child.unref();
            return { success: true, pid: child.pid };
        }
        return { success: false, error: 'Failed to spawn process' };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function getinstalledapps() {
    try {
        if (IS_LINUX) {
            const desktopfiles = [];
            const dirs = ['/usr/share/applications', '/usr/local/share/applications', path.join(os.homedir(), '.local/share/applications')];
            const iconpaths = [
                '/usr/share/icons/hicolor/48x48/apps',
                '/usr/share/icons/hicolor/64x64/apps',
                '/usr/share/icons/hicolor/128x128/apps',
                '/usr/share/icons/hicolor/scalable/apps',
                '/usr/share/pixmaps'
            ];
            const resolveicon = (iconname) => {
                if (!iconname) return null;
                if (iconname.startsWith('/') && fs.existsSync(iconname)) return iconname;
                for (const icondir of iconpaths) {
                    const exts = ['.png', '.svg', '.xpm', ''];
                    for (const ext of exts) {
                        const fullpath = path.join(icondir, iconname + ext);
                        if (fs.existsSync(fullpath)) return fullpath;
                    }
                }
                return null;
            };
            for (const dir of dirs) {
                if (fs.existsSync(dir)) {
                    const files = fs.readdirSync(dir).filter(f => f.endsWith('.desktop'));
                    for (const file of files) {
                        try {
                            const content = fs.readFileSync(path.join(dir, file), 'utf-8');
                            const name = content.match(/^Name=(.+)$/m)?.[1];
                            const exec = content.match(/^Exec=(.+)$/m)?.[1]?.replace(/%[fFuUdDnNickvm]/g, '').trim();
                            const iconname = content.match(/^Icon=(.+)$/m)?.[1];
                            const nodisplay = content.includes('NoDisplay=true');
                            if (name && exec && !nodisplay) {
                                const iconpath = resolveicon(iconname);
                                desktopfiles.push({ name, exec, icon: iconpath, path: path.join(dir, file) });
                            }
                        } catch (e) { }
                    }
                }
            }
            return { success: true, apps: desktopfiles };
        } else if (IS_MAC) {
            const appsdirs = ['/Applications', '/System/Applications', path.join(os.homedir(), 'Applications')];
            const apps = [];
            for (const dir of appsdirs) {
                try {
                    if (!fs.existsSync(dir)) continue;
                    const entries = fs.readdirSync(dir);
                    for (const entry of entries) {
                        if (entry.endsWith('.app') && !entry.startsWith('.')) {
                            apps.push({
                                name: entry.replace('.app', ''),
                                exec: path.join(dir, entry),
                                icon: null,
                                path: path.join(dir, entry)
                            });
                        }
                    }
                } catch (e) { }
            }
            return { success: true, apps };
        } else if (IS_WINDOWS) {
            const { stdout } = await execpromise('powershell -command "Get-StartApps | Select-Object -First 100 Name, AppID | ConvertTo-Json"');
            const data = JSON.parse(stdout || '[]');
            const apps = (Array.isArray(data) ? data : [data]).map(app => ({
                name: app.Name,
                exec: app.AppID,
                icon: null,
                path: app.AppID
            }));
            return { success: true, apps };
        }
        return { success: false, apps: [], error: 'Unknown platform' };
    } catch (e) {
        return { success: false, apps: [], error: e.message };
    }
}

async function getwindowlist() {
    try {
        if (IS_LINUX) {
            const { stdout } = await execpromise('wmctrl -l -p 2>/dev/null || xdotool search --name "" getwindowname %@ 2>/dev/null').catch(() => ({ stdout: '' }));
            const windows = stdout.split('\n').filter(Boolean).map(line => {
                const parts = line.split(/\s+/);
                return {
                    id: parts[0],
                    desktop: parseInt(parts[1]),
                    pid: parseInt(parts[2]),
                    title: parts.slice(4).join(' ')
                };
            });
            return { success: true, windows };
        }
        return { success: true, windows: [] };
    } catch (e) {
        return { success: false, windows: [], error: e.message };
    }
}

async function focuswindow(windowid) {
    try {
        if (IS_LINUX) {
            await execpromise(`wmctrl -i -a ${windowid}`);
            return { success: true };
        }
        return { success: false, error: 'Not supported on this platform' };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function minimizewindow(windowid) {
    try {
        if (IS_LINUX) {
            await execpromise(`xdotool windowminimize ${windowid}`);
            return { success: true };
        }
        return { success: false, error: 'Not supported on this platform' };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function closewindow(windowid) {
    try {
        if (IS_LINUX) {
            await execpromise(`wmctrl -i -c ${windowid}`);
            return { success: true };
        }
        return { success: false, error: 'Not supported on this platform' };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function setwallpaper(imagepath) {
    try {
        if (IS_LINUX) {
            await execpromise(`gsettings set org.gnome.desktop.background picture-uri "file://${imagepath}" 2>/dev/null || feh --bg-fill "${imagepath}" 2>/dev/null || nitrogen --set-zoom-fill "${imagepath}" 2>/dev/null`);
            return { success: true };
        } else if (IS_MAC) {
            await execpromise(`osascript -e 'tell application "Finder" to set desktop picture to POSIX file "${imagepath}"'`);
            return { success: true };
        } else if (IS_WINDOWS) {
            await execpromise(`powershell -command "Set-ItemProperty -Path 'HKCU:\\Control Panel\\Desktop' -Name Wallpaper -Value '${imagepath}'; RUNDLL32.EXE user32.dll,UpdatePerUserSystemParameters"`);
            return { success: true };
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function getnetworkinfo() {
    try {
        const interfaces = os.networkInterfaces();
        const result = {};
        for (const [name, addrs] of Object.entries(interfaces)) {
            result[name] = addrs.map(addr => ({
                address: addr.address,
                netmask: addr.netmask,
                family: addr.family,
                mac: addr.mac,
                internal: addr.internal
            }));
        }
        return { success: true, interfaces: result };
    } catch (e) {
        return { success: false, interfaces: {}, error: e.message };
    }
}

async function getdiskusage() {
    try {
        if (IS_LINUX || IS_MAC) {
            const { stdout } = await execpromise('df -h');
            const lines = stdout.split('\n').slice(1);
            const disks = lines.filter(Boolean).map(line => {
                const parts = line.split(/\s+/);
                return {
                    filesystem: parts[0],
                    size: parts[1],
                    used: parts[2],
                    available: parts[3],
                    usepercent: parseInt(parts[4]) || 0,
                    mountpoint: parts[5]
                };
            });
            return { success: true, disks };
        } else if (IS_WINDOWS) {
            const { stdout } = await execpromise('wmic logicaldisk get size,freespace,caption');
            const lines = stdout.split('\n').slice(1);
            const disks = lines.filter(l => l.trim()).map(line => {
                const parts = line.trim().split(/\s+/);
                const total = parseInt(parts[2]) || 0;
                const free = parseInt(parts[1]) || 0;
                const used = total - free;
                return {
                    filesystem: parts[0],
                    size: Math.round(total / 1024 / 1024 / 1024) + 'G',
                    used: Math.round(used / 1024 / 1024 / 1024) + 'G',
                    available: Math.round(free / 1024 / 1024 / 1024) + 'G',
                    usepercent: total ? Math.round((used / total) * 100) : 0,
                    mountpoint: parts[0]
                };
            });
            return { success: true, disks };
        }
    } catch (e) {
        return { success: false, disks: [], error: e.message };
    }
}

async function openfilewithapp(filepath, appname) {
    try {
        if (IS_LINUX) {
            spawn(appname, [filepath], { detached: true, stdio: 'ignore' }).unref();
            return { success: true };
        } else if (IS_MAC) {
            spawn('open', ['-a', appname, filepath], { detached: true, stdio: 'ignore' }).unref();
            return { success: true };
        } else if (IS_WINDOWS) {
            spawn('cmd', ['/c', 'start', '', appname, filepath], { detached: true, stdio: 'ignore', shell: true }).unref();
            return { success: true };
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function executeshell(command, cwd = null) {
    return new Promise((resolve) => {
        const options = {
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
            shell: true
        };
        if (cwd) options.cwd = cwd;

        exec(command, options, (error, stdout, stderr) => {
            resolve({
                success: !error,
                stdout: stdout || '',
                stderr: stderr || '',
                code: error ? error.code : 0,
                error: error ? error.message : null
            });
        });
    });
}

async function trash(filepath) {
    try {
        if (IS_LINUX) {
            await execpromise(`gio trash "${filepath}" 2>/dev/null || mv "${filepath}" ~/.local/share/Trash/files/`);
            return { success: true };
        } else if (IS_MAC) {
            await execpromise(`osascript -e 'tell application "Finder" to delete POSIX file "${filepath}"'`);
            return { success: true };
        } else if (IS_WINDOWS) {
            await execpromise(`powershell -command "$shell = New-Object -ComObject Shell.Application; $shell.NameSpace(0).ParseName('${filepath}').InvokeVerb('delete')"`);
            return { success: true };
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

module.exports = {
    getwifistatus,
    setwifienabled,
    getwifinetworks,
    connecttowifi,
    getbluetoothstatus,
    setbluetoothenabled,
    getbluetoothdevices,
    getvolume,
    setvolume,
    setmuted,
    getbrightness,
    setbrightness,
    getbatterystatus,
    getprocesses,
    killprocess,
    poweraction,
    launchapp,
    getinstalledapps,
    getwindowlist,
    focuswindow,
    minimizewindow,
    closewindow,
    setwallpaper,
    getnetworkinfo,
    getdiskusage,
    openfilewithapp,
    trash,
    executeshell,
    IS_LINUX,
    IS_MAC,
    IS_WINDOWS,
    PLATFORM
};
