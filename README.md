# SQU Website Demo — Drupal 11 + PostgreSQL 16 (Docker Desktop)

This folder is a complete, self-contained Docker project. It spins up:

- **Drupal 11** (web app), on `http://localhost:8080`
- **PostgreSQL 16** (database)
- **pgAdmin** (optional database viewer), on `http://localhost:5050`

You do not need PHP, PostgreSQL, or Drupal installed on your PC — Docker
Desktop runs everything inside containers.

> ⚠️ Honest note: I put this together from the standard, well-documented
> Drupal + Docker + Postgres pattern, but I was not able to actually run
> `docker compose up` and click through it myself in this environment (no
> internet access on my end). Everything here is the normal, supported way
> to do this — but budget time for the installer's normal first-run
> hiccups (e.g. a permissions warning) rather than expecting zero friction.

---

## 1. Prerequisites

1. **Docker Desktop for Windows 11**, installed and running, with the
   **WSL2 backend** enabled (Docker Desktop enables this by default on
   Windows 11 — check *Settings → General → Use the WSL 2 based engine*).
2. At least ~4 GB of free RAM available to Docker
   (*Settings → Resources*).

---

## 2. What's in this folder

```
squ-drupal-project/
├── docker-compose.yml       ← defines the 3 containers (drupal, db, pgadmin)
├── Dockerfile                ← Drupal 11 image + Postgres driver + Drush + Paragraphs module
├── README.md                  ← this file
├── SITE-BUILDING-GUIDE.md    ← click-by-click guide to build the homepage, section by section
└── assets/                    ← the 10 section images from your document, ready to upload
```

---

## 3. First-time setup

Open **PowerShell**, `cd` into this folder, then run:

```powershell
docker compose up -d --build
```

The first run downloads the Drupal and PostgreSQL images and installs a
few Composer packages, so it can take 5–10 minutes depending on your
connection. Check progress with:

```powershell
docker compose logs -f drupal
```

Once it settles down, confirm both containers are up:

```powershell
docker compose ps
```

---

## 4. Run the Drupal installer

1. Open a browser to **http://localhost:8080**
2. Choose **English**, then choose the **Standard** installation profile.
3. On the **Database configuration** screen:
   - Click **PostgreSQL** (if it's not shown, click "Choose another
     database").
   - Database name: `squdb`
   - Database username: `squuser`
   - Database password: `squpass123`
   - Click **Advanced options** and set:
     - Host: `db`
     - Port: `5432`
4. Continue through **Site name** (e.g. "Sultan Qaboos University"),
   **site email**, and create your **admin account** — remember these
   credentials, you'll use them to log in and build the page.
5. Wait for install to finish, then you'll land on the new site's home
   page, logged in as admin.

If you ever need to start over, the simplest reset is:

```powershell
docker compose down -v
docker compose up -d --build
```

(`-v` wipes the database volume too, so you get a completely fresh site.)

---

## 5. Log in and start building

- Front end: `http://localhost:8080`
- Admin login: `http://localhost:8080/user/login`

From here, follow **SITE-BUILDING-GUIDE.md** — it walks through each of
the 9 sections in your document (header, banner, search widget, academic
cards, stats, research, "We Are SQU", news, student life) plus the
footer, using only the Drupal admin UI (Structure, Content, Paragraphs,
Layout Builder, Block Layout) — no PHP or custom code required. The
`assets/` folder has the images already cropped per-section so you can
upload them straight into Drupal's Media library as you go.

---

## 6. Useful commands

Run Drush commands inside the Drupal container (Drush is pre-installed):

```powershell
docker compose exec drupal vendor/bin/drush status
docker compose exec drupal vendor/bin/drush en layout_builder -y
docker compose exec drupal vendor/bin/drush cr
```

Install additional modules later:

```powershell
docker compose exec drupal composer require drupal/<module_name>
docker compose exec drupal vendor/bin/drush en <module_name> -y
```

Stop everything (keeps your data):

```powershell
docker compose down
```
