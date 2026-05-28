import { Streamlit } from "streamlit-component-lib"
import createAuth0Client from '@auth0/auth0-spa-js';
import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"
import "./style.css"

const div = document.body.appendChild(document.createElement("div"))
const button = div.appendChild(document.createElement("button"))
button.className = "log"
button.textContent = "Login"

// set flex column so the error message appears under the button
div.style = "display: flex; flex-direction: column; color: rgb(104, 85, 224); font-weight: 600; margin: 0; padding: 10px"
const errorNode = div.appendChild(document.createTextNode(""))

// Global vars
let client_id
let domain
let auth0
let audience
let scope
let prompt
let authorization_params = {}

// Build Auth0 authorization params
function buildAuthorizationParams() {
  const authorizationParams = {
    redirect_uri: getOriginUrl(),
  }
  
  if (audience !== undefined && audience !== null) {
    authorizationParams.audience = audience
  } else {
    authorizationParams.audience = `https://${domain}/api/v2/`
  }
  
  if (scope !== undefined && scope !== null) {
    authorizationParams.scope = scope
  }
  
  if (prompt !== undefined && prompt !== null) {
    authorizationParams.prompt = prompt
  }
  
  Object.assign(authorizationParams, authorization_params)
  return authorizationParams
}

// Build token options
function buildTokenOptions() {
  const tokenOptions = {}
  tokenOptions.audience = audience !== undefined && audience !== null 
    ? audience 
    : `https://${domain}/api/v2/`
  
  if (scope !== undefined && scope !== null) {
    tokenOptions.scope = scope
  }
  return tokenOptions
}

// Initialize Auth0 client (uses localStorage for caching)
async function initAuth0Client() {
  if (auth0) return auth0
  
  auth0 = await createAuth0Client({
    domain: domain,
    client_id: client_id,
    authorizationParams: buildAuthorizationParams(),
    useRefreshTokens: true,
    cacheLocation: "localstorage",  // This stores tokens in localStorage
  })
  return auth0
}

const logout = async () => {
  try {
    // 1. Clear Auth0 localStorage cache first (local logout)
    if (auth0) {
      await auth0.logout({ localOnly: true })
    }
    
    // 2. Reset auth0 client
    auth0 = null
    
    // 3. Notify Streamlit to clear session state
    Streamlit.setComponentValue(null)
    
    console.log('Logout complete - localStorage cleared, reloading...')
    
    // 4. Reload the page to get fresh state
    // Small delay to ensure Streamlit processes the null value
    setTimeout(() => {
      if (window.parent !== window) {
        window.parent.location.reload()
      } else {
        window.location.reload()
      }
    }, 100)
  } catch (error) {
    console.error('Logout error:', error)
    auth0 = null
    Streamlit.setComponentValue(null)
    // Still reload even on error
    setTimeout(() => {
      if (window.parent !== window) {
        window.parent.location.reload()
      } else {
        window.location.reload()
      }
    }, 100)
  }
}

const login = async () => {
  button.textContent = 'working...'
  errorNode.textContent = ''
  
  try {
    await initAuth0Client()
    
    await auth0.loginWithPopup()
    
    const user = await auth0.getUser()
    const token = await auth0.getTokenSilently(buildTokenOptions())
    
    let userCopy = JSON.parse(JSON.stringify(user))
    userCopy.token = token
    
    Streamlit.setComponentValue(userCopy)
    button.textContent = "Logout"
    button.onclick = logout
  } catch (err) {
    console.error('Login error:', err)
    if (err.message && err.message.includes('Popup')) {
      errorNode.textContent = 'Popup blocked, please try again or enable popups'
    } else {
      errorNode.textContent = 'Login failed, please try again'
    }
    button.textContent = "Login"
    button.onclick = login
  }
}

// Check if user is already authenticated via localStorage (Auth0 SDK cache)
async function checkLocalStorageAuth() {
  console.log('Checking localStorage for cached auth...')
  
  try {
    await initAuth0Client()
    
    // Check if there's a cached user
    const user = await auth0.getUser()
    
    if (!user) {
      console.log('No cached user found in localStorage')
      return false
    }
    
    console.log('Cached user found:', user.email || user.sub)
    
    // Try to get token silently (uses cached token or refresh token)
    try {
      const token = await auth0.getTokenSilently(buildTokenOptions())
      
      if (token) {
        console.log('Got valid token from localStorage cache')
        
        let userCopy = JSON.parse(JSON.stringify(user))
        userCopy.token = token
        
        Streamlit.setComponentValue(userCopy)
        button.textContent = "Logout"
        button.onclick = logout
        
        return true
      }
    } catch (tokenError) {
      console.log('Token fetch failed:', tokenError.error || tokenError.message)
      
      if (tokenError.error === 'login_required' || tokenError.error === 'consent_required') {
        // Token expired and can't be refreshed, need to login again
        try {
          await auth0.logout({ localOnly: true })
        } catch (e) {}
        return false
      }
      
      // For other errors (network, etc.), still return false to show login
      return false
    }
  } catch (error) {
    console.error('Error checking localStorage auth:', error)
    return false
  }
  
  return false
}

button.onclick = login

function onRender(event) {
  const data = event.detail
  
  client_id = data.args["client_id"]
  domain = data.args["domain"]
  audience = data.args["audience"]
  scope = data.args["scope"]
  prompt = data.args["prompt"]
  
  // Extract additional authorization parameters
  authorization_params = {}
  const knownParams = ["client_id", "domain", "audience", "scope", "prompt", "_cached_user"]
  for (const key in data.args) {
    if (!knownParams.includes(key)) {
      authorization_params[key] = data.args[key]
    }
  }

  // If backend passed cached user (from session state), use it immediately
  const cachedUser = data.args["_cached_user"]
  if (cachedUser && typeof cachedUser === "object" && cachedUser.token && cachedUser.sub) {
    console.log('Using cached user from backend session state')
    button.textContent = "Logout"
    button.onclick = logout
    Streamlit.setComponentValue(cachedUser)
    Streamlit.setFrameHeight()
    return
  }

  // Check localStorage for cached auth (via Auth0 SDK)
  checkLocalStorageAuth().then(authenticated => {
    if (!authenticated) {
      button.textContent = "Login"
      button.onclick = login
    }
    Streamlit.setFrameHeight()
  }).catch(error => {
    console.error('Error checking auth:', error)
    button.textContent = "Login"
    button.onclick = login
    Streamlit.setFrameHeight()
  })
}

Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender)
Streamlit.setComponentReady()

const getOriginUrl = () => {
  const componentPath = '/component/auth0_component.login_button/index.html'
  
  if (window.parent !== window) {
    try {
      const currentIframeHref = new URL(document.location.href)
      const urlOrigin = currentIframeHref.origin
      const urlFilePath = decodeURIComponent(currentIframeHref.pathname)
      
      if (urlFilePath && urlFilePath.includes('/component/')) {
        return urlOrigin + urlFilePath
      }
      
      return urlOrigin + componentPath
    } catch (e) {
      try {
        if (window.parent.location) {
          return window.parent.location.origin + componentPath
        }
      } catch (e2) {}
    }
  }
  
  const origin = window.location.origin
  const pathname = window.location.pathname
  
  if (pathname && pathname.includes('/component/')) {
    return origin + pathname
  }
  
  return origin + componentPath
}
