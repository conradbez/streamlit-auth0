# Welcome to Auth0-Streamlit

**The fastest way to provide comprehensive login inside Streamlit**

![Example of Streamlit-Auth0|635x380](https://raw.githubusercontent.com/conradbez/streamlit-auth0/main/demo.gif)

## Installation
Todo

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

