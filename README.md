\# TechShelf

 

IT asset management web app for IT 340 (makeup). Tracks company devices (laptops, phones, monitors, accessories), who has them, and their status.



\## Architecture (Milestone 2)



Three Ubuntu 26.04 LTS VMs on VMware Workstation, connected by a private host-only network (VMnet2, 10.0.0.0/24, no DHCP, no host adapter).



| VM | Internal IP | Runs | Port | Internet | Accepts traffic from |

|----|-------------|------|------|----------|----------------------|

| FE | 10.0.0.10 (+ NAT) | Node/Express web server (`server.js`) | 3000 | Yes (NAT) | Anyone |

| BE | 10.0.0.20 | Node/Express API (`backend/server.js`) | 4000 | No | FE only |

| DB | 10.0.0.30 | MySQL 8 | 3306 | No | BE only |



Request flow: \*\*Browser → FE (3000) → BE (4000) → DB (3306)\*\*. The browser never talks to the BE or DB directly; the FE forwards only `/api/login` and `/api/register`.



\## Milestone 1 – Front-End



\- `public/index.html`, `public/login.html`, `public/register.html` – Home, Login, Register pages

\- `public/css/style.css` – shared styling

\- `server.js` – Express server for the pages, with request logging



\## Milestone 2 – Authentication



\- \*\*Register and login\*\* work end to end (`public/js/auth.js` sends the forms to the API).

\- \*\*Password hashing:\*\* Node's built-in `crypto.scrypt` with a random 16-byte salt per user. Only the hash is stored.

\- \*\*SQL injection protection:\*\* parameterized queries (`?` placeholders) plus server-side validation of every field.

\- \*\*Roles:\*\* each account has a `role` (`user` or `admin`, default `user`). Permission enforcement is Milestone 3.

\- \*\*Database:\*\* schema in `db/schema.sql`. The app's MySQL account can only connect from the BE's IP and only has SELECT/INSERT/UPDATE/DELETE.

\- \*\*Secrets:\*\* the DB password lives in `backend/.env` on the BE VM only (permissions 600) and is excluded by `.gitignore`.

\- \*\*Firewall (UFW):\*\* default deny incoming on every VM. FE allows 3000/tcp; BE allows 4000/tcp from 10.0.0.10 only; DB allows 3306/tcp from 10.0.0.20 only.

\- \*\*Services:\*\* the API and the web server run as systemd services under a normal user (not root), start after the network is online, and restart on failure. MySQL waits for the network via a systemd override.

\- \*\*Logging:\*\* both Node apps log every request (timestamp, IP, method, path, status) without request bodies. Logs are kept in the systemd journal (`journalctl -u techshelf-api`).



\## Setup summary



\*\*DB VM\*\*

```bash

sudo apt install -y mysql-server

sudo mysql < db/schema.sql            # then set the real password with ALTER USER

\# /etc/mysql/mysql.conf.d/mysqld.cnf: bind-address = 10.0.0.30

sudo systemctl edit mysql             # \[Unit] After=network-online.target / Wants=network-online.target

sudo ufw default deny incoming

sudo ufw allow from 10.0.0.20 to any port 3306 proto tcp

sudo ufw enable

```



\*\*BE VM\*\*

```bash

cd techshelf/backend \&\& npm install

\# create .env: DB\_HOST, DB\_USER, DB\_PASSWORD, DB\_NAME, PORT  (chmod 600 .env)

\# /etc/systemd/system/techshelf-api.service → ExecStart=/usr/bin/node --env-file=.env server.js

sudo systemctl enable --now techshelf-api

sudo ufw default deny incoming

sudo ufw allow from 10.0.0.10 to any port 4000 proto tcp

sudo ufw enable

```



\*\*FE VM\*\*

```bash

cd techshelf \&\& npm install

\# /etc/systemd/system/techshelf-web.service → ExecStart=/usr/bin/node server.js

sudo systemctl enable --now techshelf-web

sudo ufw default deny incoming

sudo ufw allow 3000/tcp

sudo ufw enable

```



Static internal IPs are set with NetworkManager, for example on the DB:

```bash

sudo nmcli connection add type ethernet ifname ens37 con-name internal ipv4.method manual ipv4.addresses 10.0.0.30/24

```



\## Specific deliverables (from instructor)



1\. Two account types: \*\*user\*\* (manages own assigned devices) and \*\*admin\*\* (manages all devices).

2\. Device search bar backed by an API (laptops, phones, etc.).

3\. Profile page listing a user's devices.

4\. Checkout system: an assigned device can't be reserved by someone else; status shows available/unavailable.

5\. Remote Lock (admin only): locks a device so nobody can use it, including the person it's checked out to.



Plus the general deliverables: VLAN, username/password auth, email verification or MFA, password hashing, logging/monitoring, UFW between VMs.



\## Tools



Ubuntu 26.04 LTS, VMware Workstation, Node.js, Express, MySQL, Git/GitHub, Trello. The `mysql2` package (MySQL driver for Node) was submitted to the instructor for approval.



\## AI usage



I used Claude (Anthropic) throughout the project. I ran every command, built and configured the VMs, tested everything, and managed GitHub and Trello myself.



\*\*Milestone 1\*\*

\- Generated the HTML/CSS pages from my proposal mockups and the Express server.

\- Provided the Ubuntu, UFW and Git commands, and helped troubleshoot (OneDrive interfering with Git).

\- Tested the pages and fixed two layout bugs before I deployed them.



\*\*Milestone 2\*\*

\- Helped diagnose that my VMs were running the Ubuntu live session (nothing persisted) and guided the reinstall to disk.

\- Designed the network layout with me and provided the VMware and `nmcli` steps for static IPs.

\- Recommended switching from MongoDB to MySQL (MongoDB didn't support my Ubuntu version at the time) and wrote the database schema.

\- Wrote the back-end API (`backend/server.js`), the FE forwarding code and `auth.js`, and tested them against MySQL before I deployed them.

\- Provided the UFW rules and the method for testing which ports are open or blocked.

\- Wrote the systemd service files, and helped diagnose two boot problems (MySQL and the API starting before the internal IP was ready) from the logs I collected.

