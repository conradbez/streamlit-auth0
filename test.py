from auth0_component import login_button
import streamlit as st
from dotenv import load_dotenv
import os
load_dotenv()

clientId = os.environ['clientId']
domain = os.environ['domain']
user_info = login_button(clientId, domain = domain)

st.write(user_info)


st.write(st.slider('hi'))
st.write(user_info['nickname'])