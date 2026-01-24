# 🔧 Troubleshooting Guide

## Wallet Connection Issues

### Error: "No wallet address found"

**Possible Causes:**
1. Freighter extension not installed
2. Freighter wallet is locked
3. No wallet account created in Freighter
4. Wrong network (not on Testnet)

**Solutions:**

1. **Install Freighter**
   - Go to [freighter.app](https://freighter.app)
   - Install the browser extension
   - Refresh the page

2. **Unlock Freighter**
   - Click the Freighter extension icon
   - Enter your password to unlock
   - Try connecting again

3. **Create/Import Wallet**
   - Open Freighter extension
   - Create a new wallet or import existing
   - Make sure you have at least one account

4. **Switch to Testnet**
   - Open Freighter extension
   - Go to Settings
   - Switch network to "Testnet"
   - Refresh the app page

5. **Check Browser Console**
   - Open DevTools (F12)
   - Check Console tab for detailed errors
   - Look for Freighter-specific errors

### Error: "Freighter extension not found"

**Solution:**
- Install Freighter from https://freighter.app
- Refresh the page after installation
- Make sure the extension is enabled in your browser

### Error: "Invalid wallet address format"

**Solution:**
- This shouldn't happen with Freighter
- Try disconnecting and reconnecting
- Check that Freighter is on the latest version

---

## Next.js Warnings

### Warning: `scroll-behavior: smooth`

**Status:** ✅ Fixed
- Added `data-scroll-behavior="smooth"` to `<html>` element
- This warning should no longer appear

---

## Build Issues

### TypeScript Errors

**Solution:**
```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Build Fails

**Solution:**
1. Check Node.js version (need 18+)
2. Clear cache: `rm -rf .next`
3. Reinstall: `npm install`
4. Try again: `npm run build`

---

## Runtime Errors

### API Evaluation Fails

**Check:**
- Evidence URL is publicly accessible
- GitHub repos must be public
- URL format is correct
- Network connection is working

### Contract Errors

**Check:**
- Contract ID is correct in `src/lib/stellar.ts`
- Network is set to Testnet
- Account has XLM for fees
- Contract is deployed (or using memo fallback)

---

## Quick Fixes

### Reset Everything

```bash
# Stop dev server
# Clear cache
rm -rf .next
rm -rf node_modules

# Reinstall
npm install

# Restart
npm run dev
```

### Check Freighter Status

1. Open Freighter extension
2. Check:
   - ✅ Wallet is unlocked
   - ✅ Network is "Testnet"
   - ✅ Account exists
   - ✅ Account has XLM (even 0.1 XLM is enough)

---

## Still Having Issues?

1. **Check Browser Console** - Look for detailed error messages
2. **Check Network Tab** - See if API calls are failing
3. **Try Different Browser** - Sometimes extensions conflict
4. **Update Freighter** - Make sure you have the latest version
5. **Check Freighter Logs** - Extension might have its own error logs

---

## Common Scenarios

### "I just installed Freighter"
- ✅ Create a wallet in Freighter
- ✅ Switch to Testnet
- ✅ Refresh the app page
- ✅ Try connecting again

### "It worked yesterday but not today"
- ✅ Check if Freighter is still unlocked
- ✅ Verify network is still Testnet
- ✅ Try disconnecting and reconnecting
- ✅ Clear browser cache

### "I'm on Mainnet"
- ⚠️ Switch to Testnet in Freighter settings
- ⚠️ The app is configured for Testnet
- ⚠️ Mainnet requires real XLM and different contract

---

## Getting Help

If you're still stuck:
1. Check the error message in the browser console
2. Check Freighter extension status
3. Verify all prerequisites from README.md
4. Check if the issue is browser-specific

**Remember:** The app requires:
- ✅ Freighter extension installed
- ✅ Freighter wallet unlocked
- ✅ Network set to Testnet
- ✅ At least one account in Freighter

