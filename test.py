from auth0_component import login_button
import streamlit as st
from dotenv import load_dotenv
import os
load_dotenv()

clientId = os.environ['clientId']
domain = os.environ['domain']

# Optional: Get custom authorization parameters from environment variables
# These are optional - if not set, defaults will be used (backward compatible)
audience = os.environ.get('audience', None)
scope = os.environ.get('scope', None)
prompt = os.environ.get('prompt', None)

st.title('Welcome to Auth0-Streamlit')

# Basic usage (backward compatible)
# user_info = login_button(clientId=clientId, domain=domain)

# Advanced usage with custom audience, scope, and prompt
login_params = {
    'clientId': clientId,
    'domain': domain
}

# Add optional parameters if provided
if audience:
    login_params['audience'] = audience
if scope:
    login_params['scope'] = scope
if prompt:
    login_params['prompt'] = prompt

user_info = login_button(**login_params)

if user_info:
    st.write(f'Hi {user_info["nickname"]}')
    
    # Access the raw token
    if 'token' in user_info:
        token = user_info['token']
        st.write("**Access Token:**")
        st.code(token, language=None)
        
        # Or store it in session state for later use
        if 'access_token' not in st.session_state:
            st.session_state.access_token = token
    
    # Uncomment to see all user info
    # st.write(user_info)
    
if not user_info:
    st.write("Please login to continue")
