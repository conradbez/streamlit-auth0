# Welcome to Auth0-Streamlit

**The fastest way to provide comprehensive login inside Streamlit**

![Example of Streamlit-Auth0|635x380](demo.gif?raw=true)

## Installation
`pip install streamlit-auth0-component`

## Setup

- Register for Auth0
- Create a Single Page Application and navigate to the "settings" tab 
- set your callback url's to `http://localhost:8501/component/auth0_component.login_button/index.html` assuming you're running on localhost or `http://YOUR_DOMAIN/component/auth0_component.login_button/index.html` if you're deploying
- Copy `client_id` and `domain` from this page
- Follow example below

## An example
On Auth0 website start a "Single Page Web Application" and copy your client-id / domain (of form xxxx.us.auth0.com) into code below.

```
from auth0_component import login_button
import streamlit as st

clientId = "...."
domain = "...."

user_info = login_button(clientId, domain = domain)
st.write(user_info)
```

`user_info` will now contain your user's information 


## Todo

- Pass all info through JWT, at the moment the `sub` field is the only field assing through verification
- Test with other providers, only Google tested 


## Deploy

- `Change version in setup.py`
- `cd auth_component/frontend && npm run build && cd ../.. rm -rf dist/* && python setup.py sdist bdist_wheel`
- `twine upload dist/*`