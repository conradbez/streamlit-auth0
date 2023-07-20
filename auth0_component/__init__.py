import os
import streamlit.components.v1 as components

# _RELEASE = False
_RELEASE = True


if not _RELEASE:
    _login_button = components.declare_component(
        "login_button",
        url="http://localhost:3000",  # vite dev server port
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/dist")
    _login_button = components.declare_component("login_button", path=build_dir)


import json
from six.moves.urllib.request import urlopen
from functools import wraps
from jose import jwt


def to_bool(val): pass


def getVerifiedSubFromToken(token, domain, audience, issuer):
    domain = "https://" + domain
    jsonurl = urlopen(domain + "/.well-known/jwks.json")
    jwks = json.loads(jsonurl.read())
    unverified_header = jwt.get_unverified_header(token)
    rsa_key = {}
    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"],
            }
    if rsa_key:
        try:
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=["RS256"],
                audience=audience,
                issuer=issuer,
            )
        except jwt.ExpiredSignatureError:
            raise
        except jwt.JWTClaimsError:
            raise
        except Exception:
            raise

        return payload["sub"]


def login_button(clientId, domain, audience=None, issuer=None, key=None, debug_logs=False, **kwargs):
    """Create a new instance of "login_button".
    Parameters
    ----------
    clientId: str
        client_id per auth0 config on your Applications / Settings page

    domain: str
        domain per auth0 config on your Applications / Settings page in the form dev-xxxx.us.auth0.com
    key: str or None
        An optional key that uniquely identifies this component. If this is
        None, and the component's arguments are changed, the component will
        be re-mounted in the Streamlit frontend and lose its current state.
    Returns
    -------
    dict
        User info
    """

    user_info = _login_button(
        client_id=clientId,
        domain=domain,
        audience=audience if audience else f"{domain}/api/v2/",
        issuer=issuer if issuer else f"{domain}/",
        debug_logs=to_bool(debug_logs),
        key=key,
        default=0
    )
    if not user_info:
        return False
    elif isAuth(response=user_info, domain=domain, audience=audience, issuer=issuer):
        return user_info
    else:
        print("Auth failed: invalid token")
        raise


def isAuth(response, domain, audience, issuer):
    return (
        getVerifiedSubFromToken(
            token=response["token"],
            domain=domain,
            audience=audience,
            issuer=issuer
        )
        == response["sub"]
    )

def to_bool(val):
    if type(val) is bool:
        return val
    elif type(val) is str:
        if val.lower() == "true":
            return True
        if val.lower() == "false":
            return False
    elif type(val) is int:
        return False if val == 0 else True
    elif type(val) is float:
        return False if val == 0 else True
    raise ValueError("invalid truth value %r" % (val,))

if not _RELEASE:
    import streamlit as st
    from dotenv import load_dotenv
    import os

    load_dotenv()

    clientId = os.environ["clientId"]
    domain = os.environ["domain"]
    audience = os.getenv("audience")
    issuer = os.getenv("issuer")
    debug_logs = os.getenv("debug_logs", False)

    st.subheader("Login component")
    user_info = login_button(
        clientId,
        domain=domain,
        audience=audience,
        issuer=issuer,
        debug_logs=debug_logs
    )
    # user_info = login_button(clientId = "...", domain = "...")
    st.write("User info")
    st.write(user_info)
    if st.button("rerun"):
        st.experimental_rerun()
