# Padaraksha — VPS Deployment Guide

Runs alongside **kk_v1** on the same VPS. No port conflicts:

| App       | Backend | Frontend | Domain             |
|-----------|---------|----------|--------------------|
| kk_v1     | 8000    | 3000     | kutterkitchen.com (existing)              |
| padaraksha| 8001    | 3001     | padaraksha-dev.kutterkitchen.com          |

---

## One-time server setup

### 1. Clone the repo

```bash
sudo mkdir -p /var/www/padaraksha
sudo chown $USER:$USER /var/www/padaraksha
git clone https://gitlab.com/personal-projects-overide/padaraksha.git /var/www/padaraksha
```

### 2. MySQL — create a dedicated database and user

```sql
CREATE DATABASE padaraksha_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'padaraksha'@'localhost' IDENTIFIED BY 'rYncWWhjPJet2XnewTjzlXt2BZgv';
GRANT ALL PRIVILEGES ON padaraksha_db.* TO 'padaraksha'@'localhost';
FLUSH PRIVILEGES;
```

Run the schema:
```bash
mysql -u root -p padaraksha_db < /var/www/padaraksha/backend/migrations/001_initial_schema.sql
```

Seed initial data (factory + admin user):
```bash
cd /var/www/padaraksha/backend
source /var/www/padaraksha/.venv/bin/activate
python seed.py
```

### 3. Backend .env

```bash
cp /var/www/padaraksha/backend/.env.example /var/www/padaraksha/backend/.env
nano /var/www/padaraksha/backend/.env
```

Fill in:
```
DATABASE_URL=mysql+pymysql://padaraksha:STRONG_PASSWORD_HERE@localhost/padaraksha_db
SECRET_KEY=generate-a-long-random-string-here
```

Also update `backend/main.py` CORS `allow_origins` to include your production domain:
```python
allow_origins=["https://padaraksha-dev.kutterkitchen.com"]
```

### 4. Nginx

```bash
# Replace padaraksha-dev.kutterkitchen.com in the config first
sudo cp /var/www/padaraksha/deploy/nginx/padaraksha.conf /etc/nginx/sites-available/padaraksha
sudo ln -s /etc/nginx/sites-available/padaraksha /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL (certbot)

```bash
sudo certbot --nginx -d padaraksha-dev.kutterkitchen.com
```

### 6. Systemd services

```bash
sudo cp /var/www/padaraksha/deploy/systemd/padaraksha-backend.service /etc/systemd/system/
sudo cp /var/www/padaraksha/deploy/systemd/padaraksha-frontend.service /etc/systemd/system/

# Fill in your domain in the frontend service
sudo nano /etc/systemd/system/padaraksha-frontend.service

sudo systemctl daemon-reload
sudo systemctl enable padaraksha-backend padaraksha-frontend
```

### 7. First build + start

```bash
chmod +x /var/www/padaraksha/deploy/setup.sh
# Edit setup.sh to set your DOMAIN first
nano /var/www/padaraksha/deploy/setup.sh

sudo -u www-data /var/www/padaraksha/deploy/setup.sh
sudo systemctl start padaraksha-backend padaraksha-frontend
```

---

## Deploying updates

```bash
cd /var/www/padaraksha
git pull origin main
sudo -u www-data ./deploy/setup.sh
```

---

## Checking status

```bash
sudo systemctl status padaraksha-backend
sudo systemctl status padaraksha-frontend
sudo journalctl -u padaraksha-backend -f    # live backend logs
sudo journalctl -u padaraksha-frontend -f   # live frontend logs
```

---

## How kk_v1 is unaffected

- Completely separate ports (8001/3001 vs 8000/3000)
- Separate nginx server block (`server_name` is a different domain)
- Separate systemd services (`padaraksha-*` vs `kk-*`)
- Separate MySQL database (`padaraksha_db` vs whatever kk_v1 uses)
- Separate app directory (`/var/www/padaraksha` vs `/var/www/kk_v1`)
- Separate Python venv (`/var/www/padaraksha/.venv`)
