# TechShelf

IT asset management web app for IT 340 (makeup). Tracks company devices (laptops, phones, monitors, accessories), who has them, and their status.

## Milestone 1 – Front-End (due Oct 12)

- `public/index.html` – Home / dashboard (search bar, asset stat cards)
- `public/login.html` – Login page
- `public/register.html` – Register page
- `public/css/style.css` – shared styling
- `server.js` – Express server hosting the pages on the Front-End VM

Forms are not wired to a back end yet; that is Milestone 2 (auth, hashing, DB VM).

## Run locally

```bash
npm install
npm start
# open http://localhost:3000
```

## Deploy on the Front-End VM (Ubuntu)

```bash
sudo apt update
sudo apt install -y git nodejs npm
git clone https://github.com/<your-username>/techshelf.git
cd techshelf
npm install
npm start
```

From the host machine, browse to `http://<FE-VM-IP>:3000` (`ip a` on the VM shows the IP).

Open the port if UFW is enabled:

```bash
sudo ufw allow 3000/tcp
sudo ufw enable
sudo ufw status
```

Keep it running after logout (optional):

```bash
sudo npm install -g pm2
pm2 start server.js --name techshelf
pm2 save
```

## Planned architecture

| VM | Role | Network |
|----|------|---------|
| FE | Express + front-end pages | Public (NAT/Bridged) + internal VLAN |
| BE | Node/Express API (auth, devices, checkout, lock) | Internal VLAN only |
| DB | MongoDB or MySQL | Internal VLAN only |
| MON (optional 4th) | monitor.sh / logging | Internal VLAN only |

## Specific deliverables (from instructor)

| Milestone | Due |
|-----------|-----|
| 1 – Front-End | Oct 12 |
| 2 – Authentication | Oct 26 |
| 3 – Full functionality | Nov 9 |

1. Two account types: **user** (manages own assigned devices) and **admin** (manages all devices).
2. Device search bar backed by an API (laptops, phones, etc.).
3. Profile page listing a user's devices.
4. Checkout system: an assigned device can't be reserved by someone else; status shows available/unavailable.
5. Remote Lock (admin only): locks a device so nobody can use it, including the person it's checked out to.

Plus the general deliverables: VLAN, username/password auth, email verification or MFA, password hashing, logging/monitoring, UFW between VMs.

## AI usage

HTML, CSS and the Express server were generated with Claude (Anthropic) from my proposal mockups, then reviewed and deployed by me.
