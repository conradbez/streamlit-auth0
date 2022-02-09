import React from "react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// styles
import "./NavBar.css";
// eslint-disable-next-line
import {
  Container,
  Nav,
  NavItem,
  Button,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";

import {
  Streamlit
} from "streamlit-component-lib"

// eslint-disable-next-line
import { useAuth0 } from "@auth0/auth0-react";

const NavBar = (props) => {

  var onRun  = props['props']['onRun']
  var domain = props['props']['domain']

  // eslint-disable-next-line
  const {
    user,
    isAuthenticated,
    loginWithRedirect,
    loginWithPopup,
    logout,
    getAccessTokenSilently,
    getAccessTokenWithPopup
  } = useAuth0();

  const getOriginUrl = () => {
    // Detect if you're inside an iframe
    if (window.parent !== window) {
      const currentIframeHref = new URL(document.location.href);
      const urlOrigin = currentIframeHref.origin;
      const urlFilePath = decodeURIComponent(currentIframeHref.pathname);
      // Take referrer as origin
      return urlOrigin + urlFilePath;
    } else {
      return window.location.origin;
    }
  }


  const logoutWithRedirect = () =>
    logout({
      returnTo: getOriginUrl(),
    });

  const getAccessToken = () => {
    return getAccessTokenSilently({
    // return getAccessTokenWithPopup({
      audience:`https://${domain}/api/v2/`,
      scope: "read:current_user",
    })
  }


  if (isAuthenticated){
        user['token'] = getAccessToken;
        onRun(user);
  }else{
        onRun(false)
  }

  return (
    <div className="nav-container">
      <Container className="login-component">
            {!isAuthenticated && (
                <Button
                  color="primary"
                  className="btn-margin"
                  onClick={() => {
                      loginWithPopup({}).then(()=>{onRun(false)})
                }}
                >
                  Log in
                </Button>
            )}
            {isAuthenticated && (
                <Button
                onClick={() => {
                    logoutWithRedirect()
                  }}
                >Logout
                </Button>
            )}
      </Container>
    </div>
  );
};

export default NavBar;

