from auth0_component import login_button
import streamlit as st
from dotenv import load_dotenv
import os
load_dotenv()

clientId = os.environ['clientId']
domain = os.environ['domain']

st.title('Welcome to Auth0-Streamlit')

with st.echo():
    user_info = login_button(clientId = clientId, domain = domain)
    if user_info:
        st.write(f'Hi {user_info["nickname"]}')
        # st.write(user_info) # some private information here
        
if not user_info:
    st.write("Please login to continue")
