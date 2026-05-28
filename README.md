# Streamlit Auth0 Component (Extended)

**Enhanced Auth0 login component for Streamlit with support for custom audience, scope, and authorization parameters**

![Example of Streamlit-Auth0|635x380](demo.gif?raw=true)

## Installation
```bash
pip install streamlit-auth0-component-extended
```

> **Note**: This is an enhanced fork of [streamlit-auth0-component](https://github.com/conradbez/streamlit-auth0) with additional features including custom audience, scope, prompt, and custom domain support.

## Setup

- Register for Auth0
- Create a Single Page Application and navigate to the "settings" tab 
- set your callback url's to `http://localhost:8501/component/auth0_component.login_button/index.html` assuming you're running on localhost or `http://YOUR_DOMAIN/component/auth0_component.login_button/index.html` if you're deploying
- Copy `client_id` and `domain` from this page
- Follow example below

## Features

- ✅ **Custom Audience Support** - Use custom audience values for your Auth0 APIs
- ✅ **Custom Scope Support** - Request specific scopes (e.g., `"openid profile email read:reports"`)
- ✅ **Prompt Parameter** - Control authentication prompt behavior (`"login"`, `"consent"`, `"none"`)
- ✅ **Custom Domain Support** - Works with Auth0 custom domains (not just `.auth0.com`)
- ✅ **Enhanced Error Handling** - Better error messages and debugging
- ✅ **Backward Compatible** - All new parameters are optional

## Basic Example

On Auth0 website start a "Single Page Web Application" and copy your client-id / domain into code below.

```python
from auth0_component import login_button
import streamlit as st

clientId = "...."
domain = "...."

user_info = login_button(clientId, domain=domain)
st.write(user_info)
```

## Advanced Example with Custom Parameters

```python
from auth0_component import login_button
import streamlit as st

user_info = login_button(
    clientId="your-client-id",
    domain="your-domain.com",
    audience="your-api-audience",  # Custom audience
    scope="openid profile email read:reports",  # Custom scopes
    prompt="login"  # Force login prompt
)

if user_info:
    st.write(f'Hi {user_info["nickname"]}')
    # Access token is available in user_info["token"]
```

`user_info` will now contain your user's information including the access token. 


## Configuration

You can use environment variables for configuration. Create a `.env` file:

```bash
clientId=YOUR_CLIENT_ID
domain=YOUR_DOMAIN
audience=your-api-audience  # Optional
scope=openid profile email read:reports  # Optional
prompt=login  # Optional
```

See `.env.example` for a complete example.

## Differences from Original

This fork extends the original [streamlit-auth0-component](https://github.com/conradbez/streamlit-auth0) with:

- Support for custom audience, scope, and prompt parameters
- Custom domain support (not limited to `.auth0.com` domains)
- Improved error handling and validation
- Fixed logout functionality for iframe contexts
- Enhanced callback URL handling 



## Deploy

- `Change version in setup.py`
- `cd auth0_component/frontend/  && npm run build && cd .. && cd .. && rm -rf dist/* && python setup.py sdist bdist_wheel`
- `twine upload dist/*`