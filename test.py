from auth0_component import login_button
import streamlit as st
from dotenv import load_dotenv
import os
load_dotenv()

clientId = os.environ['clientId']
domain = os.environ['domain']
audience = os.environ.get('audience', None)
scope = os.environ.get('scope', None)
prompt = os.environ.get('prompt', None)

st.title('Welcome to Auth0-Streamlit')

# Login component - persists via session state + localStorage
login_params = {'clientId': clientId, 'domain': domain}
if audience:
    login_params['audience'] = audience
if scope:
    login_params['scope'] = scope
if prompt:
    login_params['prompt'] = prompt

user_info = login_button(**login_params)

if user_info:
    st.write(f'Hi {user_info.get("nickname", user_info.get("email", "User"))}')
    
    # Access the raw token
    if 'token' in user_info:
        token = user_info['token']
        st.write("**Access Token:**")
        st.code(token[:50] + "...", language=None)
else:
    st.write("Please login to continue")
