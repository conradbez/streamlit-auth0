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
  console.log(props)
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

  const logoutWithRedirect = () =>
    logout({
      returnTo: window.location.origin,
    });
  
  const getAccessToken = () => {
    return getAccessTokenWithPopup({
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

    // const accessToken = getAccessTokenSilently({
    //   audience: `https://example.com/api/v2/`,
    //   scope: "read:current_user",
    // });
    // console.log( accessToken )

  return (
    <div className="nav-container">
      <Container className="login-component">
            {!isAuthenticated && (
                <Button
                  color="primary"
                  className="btn-margin"
                  onClick={() => {
                      loginWithPopup({})
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

