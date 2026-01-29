import os
import re
import streamlit.components.v1 as components

_RELEASE = False
_RELEASE = True


if not _RELEASE:
  _login_button = components.declare_component(
    "login_button",
    url="http://localhost:3000", # vite dev server port
  )
else:
  parent_dir = os.path.dirname(os.path.abspath(__file__))
  build_dir = os.path.join(parent_dir, "frontend/dist")
  _login_button = components.declare_component("login_button", path=build_dir)


import json
from six.moves.urllib.request import urlopen
from functools import wraps
from jose import jwt

def getVerifiedSubFromToken(token, domain, audience=None):
    # Ensure domain has https:// prefix
    if not domain.startswith("https://"):
        domain = "https://" + domain
    
    # Remove trailing slash if present
    domain = domain.rstrip('/')
    
    try:
        jsonurl = urlopen(domain+"/.well-known/jwks.json")
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
    
    # Use custom audience if provided, otherwise default to domain/api/v2/
    token_audience = audience if audience is not None else domain+"/api/v2/"
    
    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=token_audience,
            issuer=domain+'/'
        )
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.JWTClaimsError as e:
        raise ValueError(f"Token validation failed: {str(e)}. Expected audience: {token_audience}, issuer: {domain+'/'}")
    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")

    return payload['sub']

def login_button(clientId, domain, key=None, audience=None, scope=None, prompt=None, **authorization_params):
    """Create a new instance of "login_button".
    Parameters
    ----------
    clientId: str
        client_id per auth0 config on your Applications / Settings page
    
    domain: str
        domain per auth0 config on your Applications / Settings page in the form dev-xxxx.xx.auth0.com
    key: str or None
        An optional key that uniquely identifies this component. If this is
        None, and the component's arguments are changed, the component will
        be re-mounted in the Streamlit frontend and lose its current state.
    audience: str or None, optional
        Custom audience for the token. If not provided, defaults to https://{domain}/api/v2/
    scope: str or None, optional
        Space-separated list of scopes to request (e.g., "openid profile email zefr-bsx")
    prompt: str or None, optional
        Prompt parameter for authentication (e.g., "login", "consent")
    **authorization_params: dict, optional
        Additional authorization parameters to pass to auth0-spa-js authorizationParams
    Returns
    -------
    dict
        User info
    """

    # Build component args, filtering out None values
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
    
    # Add any additional authorization parameters
    component_args.update(authorization_params)

    user_info = _login_button(key=key, default=0, **component_args)
    if not user_info:
        return False
    elif isAuth(response = user_info, domain = domain, audience=audience):
        return user_info
    else:
        print('Auth failed: invalid token')
        raise 

def isAuth(response, domain, audience=None):
    return getVerifiedSubFromToken(token = response['token'], domain=domain, audience=audience) == response['sub']

if not _RELEASE:
    import streamlit as st
    from dotenv import load_dotenv
    import os
    load_dotenv()

    clientId = os.environ['clientId']
    domain = os.environ['domain']
    st.subheader("Login component")
    user_info = login_button(clientId, domain = domain)
    # user_info = login_button(clientId = "...", domain = "...")
    st.write('User info')
    st.write(user_info)
    if st.button('rerun'):
        st.experimental_rerun()
