# Reminders

## PM2 Production Setup (do this when you're done developing)

When the app is ready and you want it running permanently in the background
(no Command Prompt windows needed, auto-starts on reboot):

```
npm install -g pm2
npm start
npm run startup
```

For the client in production, open a Command Prompt and run:
```
cd C:\Users\OWNER\Documents\home_dash\client
npm run serve
```

## Update Your Local IP If It Changes

If your router assigns a new IP to your PC, you'll need to update two files:
- `.env` → update `HOST_IP=`
- `client\.env` → update `VITE_HOST_IP=`

To check your current IP: run `ipconfig` in Command Prompt and look for "IPv4 Address".

## Accessing From Other Devices

Once the app is running, any phone/tablet/laptop on your home Wi-Fi can
access it by opening a browser and going to:
```
http://<your-PC-IP>:5173
```

## Anthropic API Key (needed for AI features)

The Meals "Suggest Meals" button and the Finance "Get Insights" button
require an Anthropic API key. When you're ready to enable AI features:
1. Get an API key from https://console.anthropic.com
2. Open `.env` and set `ANTHROPIC_API_KEY=your-key-here`
3. Restart the server

## Pulling Latest Code Updates

If changes are pushed to GitHub and you need to update your local copy:
```
cd C:\Users\OWNER\Documents\home_dash
git pull
npm install
```
Then restart the server and client.
