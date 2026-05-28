import os
import json
import streamlit.components.v1 as components
from six.moves.urllib.request import urlopen
from jose import jwt

_RELEASE = True

if not _RELEASE:
    _login_button = components.declare_component(
        "login_button",
        url="http://localhost:3000",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/dist")
    _login_button = components.declare_component("login_button", path=build_dir)


def getVerifiedSubFromToken(token, domain, audience=None):
    """Verify JWT token and return the subject (sub) claim."""
    if not domain.startswith("https://"):
        domain = "https://" + domain
    domain = domain.rstrip('/')
    
    try:
        jsonurl = urlopen(domain + "/.well-known/jwks.json")
        jwks = json.loads(jsonurl.read())
    except Exception as e:
        raise ValueError(f"Failed to fetch JWKS from {domain}/.well-known/jwks.json: {str(e)}")
    
    unverified_header = jwt.get_unverified_header(token)
    rsa_key = {}
    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"]
            }
    
    if not rsa_key:
        raise ValueError(f"Unable to find matching RSA key for kid: {unverified_header.get('kid', 'unknown')}")
    
    token_audience = audience if audience is not None else domain + "/api/v2/"
    
    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=token_audience,
            issuer=domain + '/'
        )
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.JWTClaimsError as e:
        raise ValueError(f"Token validation failed: {str(e)}")
    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")

    return payload['sub']


def isAuth(response, domain, audience=None):
    """Check if the response contains a valid token."""
    return getVerifiedSubFromToken(token=response['token'], domain=domain, audience=audience) == response['sub']


def login_button(clientId, domain, key=None, audience=None, scope=None, prompt=None, **authorization_params):
    """Create an Auth0 login button component.
    
    Authentication is persisted via:
    1. Streamlit session state (survives reruns and page refresh)
    2. Browser localStorage via Auth0 SDK (survives browser restart)
    
    Parameters
    ----------
    clientId : str
        Auth0 client ID from your Application settings
    domain : str
        Auth0 domain (e.g., dev-xxxx.us.auth0.com)
    key : str, optional
        Unique key for this component instance
    audience : str, optional
        Custom audience for the token
    scope : str, optional
        Space-separated scopes (e.g., "openid profile email")
    prompt : str, optional
        Auth prompt behavior ("login", "consent", "none")
    **authorization_params
        Additional Auth0 authorization parameters
        
    Returns
    -------
    dict or False
        User info dict with token if authenticated, False otherwise
    """
    import streamlit as st

    component_key = key or "auth0_login"
    session_key = f"_auth0_user_{clientId}_{domain}_{component_key}"
    
    # 1. Check session state (persists across reruns)
    cached_user = None
    if session_key in st.session_state:
        cached = st.session_state[session_key]
        if cached and isinstance(cached, dict) and cached.get("token") and cached.get("sub"):
            cached_user = cached

    # 2. Build component args
    component_args = {
        "client_id": clientId,
        "domain": domain
    }
    if audience is not None:
        component_args["audience"] = audience
    if scope is not None:
        component_args["scope"] = scope
    if prompt is not None:
        component_args["prompt"] = prompt
    component_args.update(authorization_params)

    # Pass cached user to frontend so it shows correct UI
    if cached_user is not None:
        component_args["_cached_user"] = cached_user

    # 3. Call component
    default_value = cached_user if cached_user is not None else 0
    user_info = _login_button(key=component_key, default=default_value, **component_args)
    
    # 4. Handle result
    if not user_info:
        # User logged out or not logged in
        if session_key in st.session_state:
            del st.session_state[session_key]
        return False
    
    # Validate token (only on first login, not on every rerun)
    if cached_user and user_info.get("sub") == cached_user.get("sub"):
        # Same user as cached, trust it
        return user_info
    
    # New login - validate the token
    try:
        if isAuth(response=user_info, domain=domain, audience=audience):
            st.session_state[session_key] = user_info
            return user_info
    except Exception as e:
        print(f'Auth validation failed: {e}')
    
    # Validation failed
    if session_key in st.session_state:
        del st.session_state[session_key]
    return False


# Development mode testing
if not _RELEASE:
    import streamlit as st
    from dotenv import load_dotenv
    load_dotenv()

    clientId = os.environ['clientId']
    domain = os.environ['domain']
    st.subheader("Login component")
    user_info = login_button(clientId, domain=domain)
    st.write('User info')
    st.write(user_info)
    if st.button('rerun'):
        st.rerun()
