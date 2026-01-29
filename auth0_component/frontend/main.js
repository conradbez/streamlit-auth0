import { Streamlit } from "streamlit-component-lib"
import createAuth0Client from '@auth0/auth0-spa-js';
import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"
import "./style.css"

const div = document.body.appendChild(document.createElement("div"))
const button = div.appendChild(document.createElement("button"))
button.className = "log"
button.textContent = "Login"

// set flex collumn so the error message appears under the button
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

const logout = async () => {
  try {
    // Clear the component value first to update Streamlit
    Streamlit.setComponentValue(null)
    
    // Determine the returnTo URL - should be the parent window's origin (Streamlit app)
    let returnTo = window.location.origin
    
    if (window.parent !== window) {
      // We're in an iframe - redirect parent window to Auth0 logout endpoint
      try {
        if (window.parent.location) {
          returnTo = window.parent.location.origin
          // Manually redirect parent window to Auth0 logout endpoint
          // This properly logs out from Auth0 and redirects back to the Streamlit app
          const logoutUrl = `https://${domain}/v2/logout?client_id=${client_id}&returnTo=${encodeURIComponent(returnTo)}`
          window.parent.location.href = logoutUrl
          return
        }
      } catch (e) {
        // Cross-origin iframe - can't access parent.location
        // Fall back to clearing local state and using auth0.logout() on iframe
        console.warn('Cannot access parent window, clearing local state only')
        await auth0.logout({ localOnly: true })
        Streamlit.setComponentValue(null)
        button.textContent = "Login"
        button.removeEventListener('click', logout)
        button.addEventListener('click', login)
        return
      }
    }
    
    // Not in iframe - use regular logout which will redirect to Auth0 and back
    await auth0.logout({ returnTo: returnTo })
    
    // Update UI immediately (though redirect will happen)
    button.textContent = "Login"
    button.removeEventListener('click', logout)
    button.addEventListener('click', login)
  } catch (error) {
    console.error('Logout error:', error)
    // Even if logout fails, clear local state
    try {
      await auth0.logout({ localOnly: true })
    } catch (e) {
      console.error('Local logout also failed:', e)
    }
    Streamlit.setComponentValue(null)
    button.textContent = "Login"
    button.removeEventListener('click', logout)
    button.addEventListener('click', login)
  }
}

const login = async () => {
  button.textContent = 'working...'
  console.log('Callback urls set to: ', getOriginUrl())
  
  // Build authorizationParams object dynamically
  const authorizationParams = {
    redirect_uri: getOriginUrl(),
  }
  
  // Use custom audience if provided, otherwise default to https://${domain}/api/v2/
  if (audience !== undefined && audience !== null) {
    authorizationParams.audience = audience
  } else {
    authorizationParams.audience = `https://${domain}/api/v2/`
  }
  
  // Add scope if provided
  if (scope !== undefined && scope !== null) {
    authorizationParams.scope = scope
  }
  
  // Add prompt if provided
  if (prompt !== undefined && prompt !== null) {
    authorizationParams.prompt = prompt
  }
  
  // Add any other authorization parameters
  Object.assign(authorizationParams, authorization_params)
  
  auth0 = await createAuth0Client({
      domain: domain,
      client_id: client_id,
      authorizationParams: authorizationParams,
      useRefreshTokens: true,
      cacheLocation: "localstorage",
    });
    try{
      await auth0.loginWithPopup();
      errorNode.textContent = ''
    }
    catch(err){
      console.log(err)
      errorNode.textContent = `Popup blocked, please try again or enable popups` + String.fromCharCode(160)
      return
    }
    const user = await auth0.getUser();
    console.log(user)
    
    // Build token options with custom audience and scope if provided
    const tokenOptions = {}
    const defaultAudience = audience !== undefined && audience !== null ? audience : `https://${domain}/api/v2/`
    tokenOptions.audience = defaultAudience
    
    if (scope !== undefined && scope !== null) {
      tokenOptions.scope = scope
    }
    
    let token = false
    
    try{
    token = await auth0.getTokenSilently(tokenOptions);
      }
      catch(error){
        if (error.error === 'consent_required' || error.error === 'login_required'){
          console.log('asking user for permission to their profile')
           token = await auth0.getTokenWithPopup(tokenOptions);
            console.log(token)
        }
        else{console.log(error)}
      }

    let userCopy = JSON.parse(JSON.stringify(user));
    userCopy.token = token
    console.log(userCopy);
    Streamlit.setComponentValue(userCopy)
    button.textContent = "Logout"
    button.removeEventListener('click', login)
    button.addEventListener('click', logout)
}

button.onclick = login

function onRender(event) {
  const data = event.detail
  
  client_id = data.args["client_id"]
  domain = data.args["domain"]
  audience = data.args["audience"]
  scope = data.args["scope"]
  prompt = data.args["prompt"]
  
  // Extract any additional authorization parameters
  // Filter out the known parameters and pass through the rest
  authorization_params = {}
  const knownParams = ["client_id", "domain", "audience", "scope", "prompt"]
  for (const key in data.args) {
    if (!knownParams.includes(key)) {
      authorization_params[key] = data.args[key]
    }
  }

  Streamlit.setFrameHeight()
}


Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender)
Streamlit.setComponentReady()

const getOriginUrl = () => {
  // For popup authentication, the redirect_uri must match what's configured in Auth0
  // Streamlit components are served at: {origin}/component/{component_name}/index.html
  // The component name is "auth0_component.login_button"
  const componentPath = '/component/auth0_component.login_button/index.html'
  
  // Detect if you're inside an iframe (Streamlit component)
  if (window.parent !== window) {
    try {
      // First, try to get the full URL from the iframe's location
      const currentIframeHref = new URL(document.location.href)
      const urlOrigin = currentIframeHref.origin
      const urlFilePath = decodeURIComponent(currentIframeHref.pathname)
      
      // If we have a valid pathname that looks like a component path, use it
      if (urlFilePath && urlFilePath.includes('/component/')) {
        return urlOrigin + urlFilePath
      }
      
      // Otherwise, construct it from the origin
      return urlOrigin + componentPath
    } catch (e) {
      // If URL parsing fails, try to get parent origin
      try {
        if (window.parent.location) {
          const parentOrigin = window.parent.location.origin
          return parentOrigin + componentPath
        }
      } catch (e2) {
        // Cross-origin iframe - fall through to use current location
      }
    }
  }
  
  // Fallback: construct from current location
  // Always use the component path to ensure it matches Auth0 configuration
  const origin = window.location.origin
  const pathname = window.location.pathname
  
  // If pathname already contains the component path, use it
  if (pathname && pathname.includes('/component/')) {
    return origin + pathname
  }
  
  // Otherwise, construct it
  return origin + componentPath
}
