# Deploying WearWise on Google Cloud (Always Free e2-micro)

Target: `https://wearwise.otnielcodes.com` on a free Google Cloud **e2-micro** VM (2 shared vCPU, 1 GB RAM, 30 GB disk). Measured footprint: about 500 MB RAM for the whole stack, with a 2 GB swap file as headroom.

How it works: GitHub Actions builds the three images on every push to `main` and publishes them to GitHub Container Registry (GHCR). The VM never builds anything; it pulls the images and runs them with `docker-compose.yml` + `docker-compose.prod.yml`. Caddy in front obtains the HTTPS certificate automatically.

> Free-tier terms change. Check the current Google Cloud Free Tier page when you sign up, and set a budget alert (step 7).

## 1. Publish the images (once, then automatically)
1. Push to `main`. The **Publish images** workflow (Actions tab) builds `wearwise-backend`, `wearwise-frontend` and `wearwise-ai-engine`. The first run takes about 10 minutes.
2. Make the three packages **public**, so the server can download them without a password: GitHub → your profile → **Packages** → each `wearwise-*` package → **Package settings** → *Danger zone* → **Change visibility → Public**.

## 2. Create the VM
1. Go to https://console.cloud.google.com and sign in. Accept the free trial (a card is required for verification). When the trial ends, the e2-micro keeps running under the Always Free tier.
2. **Compute Engine → VM instances** (enable the API if asked) → **Create instance**:
   | Setting | Value |
   |---|---|
   | Name | `wearwise` |
   | Region | **us-central1**, **us-east1** or **us-west1** (only these are free) |
   | Machine type | **E2 → e2-micro** |
   | Boot disk → Change | **Ubuntu 24.04 LTS (x86/64)**, disk type **Standard persistent disk**, size **30 GB** |
   | Firewall | tick **Allow HTTP traffic** and **Allow HTTPS traffic** |
3. Click **Create** and wait until the VM shows a green check.

## 3. Give it a fixed IP
**VPC network → IP addresses** → find the VM's *External* address → **⋮ → Promote to static IP address**. Without this, the IP can change when the VM restarts and the domain would stop working.

## 4. Point the domain to it (Spaceship)
Spaceship → **Domains → otnielcodes.com → DNS records**:
- Edit the **A** record with host **`wearwise`** → value = the VM's static IP, TTL 5 minutes.
- Remove any URL redirect / forwarding configured for `wearwise`.

Check it from your computer: `nslookup wearwise.otnielcodes.com` should return the new IP. This usually takes a few minutes.

## 5. Install WearWise
In the VM list click **SSH**. A terminal opens in the browser. Run:
```bash
curl -fsSL https://raw.githubusercontent.com/Oti404/wearwise/main/deploy/setup.sh | sudo bash -s -- wearwise.otnielcodes.com
```
The script:
- adds a 2 GB swap file
- installs Docker
- clones the repo to `/opt/wearwise`
- generates `.env` with random secrets
- pulls the images and starts everything, waiting until every service is healthy
- installs a nightly backup

It is safe to run again.

Optional demo data:
```bash
cd /opt/wearwise && sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npm run seed
sudo grep SEED_PASSWORD /opt/wearwise/.env      # password for demo@wearwise.app
```

Open **https://wearwise.otnielcodes.com**. Caddy requests the certificate on the first visit, so that request can take a few seconds.

## 6. Day-to-day
| Task | Command (on the VM) |
|---|---|
| Deploy a new version | push to `main` → wait for *Publish images* to finish → `sudo /opt/wearwise/deploy/update.sh` |
| Status | `cd /opt/wearwise && sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml ps` |
| Logs | `... logs -f backend` (or `ai-engine`, `caddy`, `db`) |
| Backups | nightly at 03:15 in `/var/backups/wearwise` (7 days kept); run now with `sudo /opt/wearwise/deploy/backup.sh` |
| Download a backup | `gcloud compute scp wearwise:/var/backups/wearwise/db-YYYY-MM-DD.sql.gz .` (or the SSH window's *Download file*) |
| Restore the database | `gunzip -c db-….sql.gz \| sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db psql -U wearwise -d wearwise` (into an empty database) |

The backups are on the same disk as the data. Download one now and then so you have a copy if the VM is ever lost.

## 7. Stay within the free tier
- **Billing → Budgets & alerts → Create budget** of **$1** with email alerts, so any unexpected charge reaches you immediately.
- Only **1 GB of outbound traffic per month** is free (roughly 1,000 first visits, since the app bundle is cached afterwards). Beyond that, traffic is billed per GB.
- Keep exactly one e2-micro and the 30 GB *standard* disk. Other machine types, disk types and regions are not free.
- Check **Billing** after the first few days to confirm the bill is $0. Google has changed how external IPv4 addresses are billed; if the static IP shows a charge, that is where it comes from.

## Troubleshooting
| Symptom | Fix |
|---|---|
| `pull access denied` / `unauthorized` during setup | The GHCR packages are still private, see step 1.2 |
| HTTPS doesn't work, browser shows a certificate error | DNS doesn't point to the VM yet (`nslookup`), or HTTP/HTTPS traffic isn't allowed on the VM (edit the VM → Firewall). Then `sudo docker compose … restart caddy` |
| `ai-engine` stays *starting* | The first model load on an e2-micro takes 1–3 minutes; check `logs ai-engine` |
| Site very slow, VM unresponsive | Memory pressure: `free -h` and `sudo docker stats`. Make sure the swap exists (`swapon --show`) |
| Image changes don't appear after `update.sh` | The *Publish images* run for that commit hadn't finished; wait for it and run `update.sh` again |
