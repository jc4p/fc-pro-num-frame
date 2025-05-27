import './style.css'
import * as frame from '@farcaster/frame-sdk'

let userFid = null;
let userData = null;

async function initializeFrame() {
  try {
    const context = await frame.sdk.context;
    
    if (context && context.user) {
      let user = context.user;
      // Handle known issue where user might be nested
      if (user.user) {
        user = user.user;
      }
      userFid = user.fid;
    } else {
      // Fallback for development/testing
      userFid = window.userFid || 573;
    }
    
    frame.sdk.actions.ready();
  } catch (error) {
    console.log('Not in frame context, using fallback');
    userFid = window.userFid || 573;
  }
  
  await fetchUserData();
  renderApp();
}

async function fetchUserData() {
  try {
    const response = await fetch(`https://fc-pro-number-api.kasra.codes/user?fid=${userFid}`);
    if (response.ok) {
      userData = await response.json();
    } else {
      userData = null;
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    userData = null;
  }
}

function calculateMinutesAfterLaunch(timestamp) {
  // Launch was 1:00 PM PT today (May 27, 2025)
  const launchTime = new Date('2025-05-27T20:00:00.000Z'); // 1:00 PM PT = 20:00 UTC
  const userTime = new Date(timestamp);
  const diffMs = userTime.getTime() - launchTime.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return Math.max(0, diffMinutes);
}

async function handleShare() {
  let shareText;
  
  if (userData && userData.position) {
    const minutesAfter = calculateMinutesAfterLaunch(userData.timestamp);
    shareText = `I am Farcaster Pro User #${userData.position.toLocaleString()} (approx), I signed up ${minutesAfter} minutes after launch!`;
  } else {
    shareText = "I'm not a Farcaster Pro user yet, check if you are!";
  }
  
  const appUrl = 'https://fc-pro-num.kasra.codes/';
  const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(appUrl)}`;
  
  try {
    await frame.sdk.actions.openUrl({ url: shareUrl });
  } catch (error) {
    // Fallback for non-frame environment
    if (navigator.share) {
      navigator.share({
        title: 'My Farcaster Pro Number',
        text: shareText,
        url: appUrl
      });
    } else {
      // Copy to clipboard as fallback
      navigator.clipboard.writeText(`${shareText} ${appUrl}`);
      alert('Share text copied to clipboard!');
    }
  }
}

function renderApp() {
  let content;
  
  if (userData && userData.position) {
    const formattedPosition = userData.position.toLocaleString();
    const minutesAfter = calculateMinutesAfterLaunch(userData.timestamp);
    
    content = `
      <div class="container">
        <h1 class="title">YOUR PRO NUMBER</h1>
        <div class="number">${formattedPosition}</div>
        <div class="subtitle">Joined ${minutesAfter} minutes after launch</div>
        <button id="shareBtn" class="share-btn">Share</button>
      </div>
    `;
  } else {
    content = `
      <div class="container">
        <h1 class="title">YOU'RE NOT FARCASTER PRO</h1>
        <div class="not-pro">😔</div>
        <div class="subtitle">You haven't subscribed to Farcaster Pro yet</div>
      </div>
    `;
  }
  
  document.querySelector('#app').innerHTML = content;
  
  const shareBtn = document.querySelector('#shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', handleShare);
  }
}

// Initialize the app
initializeFrame();