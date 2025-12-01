# ⚠️ IMPORTANT: Docker Getting Started Guide

## Prerequisites Before Running Docker Compose

### 1. Install Docker Desktop (If Not Already Installed)

**Windows:**
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Install following the wizard
3. Restart computer if prompted
4. Run Docker Desktop from Start Menu

**Verify Docker Desktop Running:**
- Look for Docker 🐳 icon in system tray (bottom right taskbar)
- Icon must be colored (not gray)
- Click icon, ensure status "Docker Desktop is running"

### 2. Verify Docker CLI

Open PowerShell and run:

```powershell
docker --version
# Output: Docker version 28.x.x

docker-compose --version
# Output: Docker Compose version v2.x.x

docker ps
# Output: List of containers (can be empty, but no error)
```

### 3. Start Docker Desktop

**If Docker Desktop not running yet:**

```powershell
# Option 1: Open from Start Menu
# Search "Docker Desktop" → click

# Option 2: Via Command Line (if already in PATH)
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Wait 30-60 seconds until Docker is ready
timeout 60
```

**Check Status:**
```powershell
docker info
# If successful, will display info about Docker daemon
```

---

## 🚀 After Docker Desktop Running

### Quick Start Commands

```powershell
# 1. Navigate to prototype folder
cd d:\KULIAH\TESIS\prototype_eng

# 2. Build and run all services
docker-compose up -d --build

# 3. Wait for all containers to finish building (~5-10 minutes first time)
# Check progress:
docker-compose ps

# 4. Setup database
.\docker\setup-databases.ps1

# 5. Verify health
curl http://localhost:3001/health
curl http://localhost:3010/health
curl http://localhost:3020/health
curl http://localhost:3030/health
curl http://localhost:3040/health
```

---

## 🐛 Troubleshooting

### Error: "The system cannot find the file specified"

**Cause:** Docker Desktop not running.

**Solution:**
1. Start Docker Desktop from Start Menu
2. Wait until 🐳 icon in system tray is colored (not gray)
3. Run again `docker-compose up -d --build`

### Error: "port is already allocated"

**Cause:** Port already used by your local service.

**Solution Option 1 - Stop local services:**
```powershell
# Find process on port 3001 (for example)
netstat -ano | findstr ":3001"

# Kill process
taskkill /F /PID <PID>
```

**Solution Option 2 - Change port in docker-compose.yml:**
Edit `docker-compose.yml` file, example:
```yaml
auth-service:
  ports:
    - "4001:3001"  # Change 3001 to 4001 (host:container)
```

### Error: "Cannot connect to Docker daemon"

**Solution:**
1. Ensure Docker Desktop is running
2. Restart Docker Desktop
3. Restart computer if necessary

### Slow Build / Timeout

**Tips:**
- Ensure stable internet connection (to download base images)
- First build is slow (~10 minutes), subsequent builds are faster
- Use `docker-compose build --parallel` for parallel build

---

## 📋 Checklist Before Testing

- [ ] Docker Desktop installed and running (🐳 icon active)
- [ ] `docker ps` no error
- [ ] Ports 3001, 3010, 3020, 3030, 3040, 3306, 8080 available
- [ ] Stable internet connection (to pull images)
- [ ] Minimum 8GB RAM available
- [ ] Minimum 20GB disk space available

---

## 💡 Useful Tips

### Stop All Local Node Services

Before running Docker, stop all local Node services:

```powershell
# Check all Node processes
Get-Process node | Select-Object Id, ProcessName, @{Name="Port";Expression={(Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort}}

# Kill all Node processes (CAUTION!)
Get-Process node | Stop-Process -Force
```

### Clean Docker Environment

If many issues, reset Docker:

```powershell
# Stop semua containers
docker-compose down -v

# Remove semua unused images, containers, networks
docker system prune -a --volumes

# Start fresh
docker-compose up -d --build
```

### Monitor Resources

```powershell
# Real-time stats
docker stats

# Logs specific service
docker-compose logs -f auth-service

# Follow all logs
docker-compose logs -f
```

---

## ✅ Next Steps

After Docker Desktop is running and containers are up:

1. **See DOCKER_QUICK_START.md** for quick testing
2. **See DOCKER_DEPLOYMENT_GUIDE.md** for complete guide
3. **Run k6 tests**: `k6 run tests/loadtest-baseline.js`

---

**Need help?** Make sure Docker Desktop is running first before continuing!
