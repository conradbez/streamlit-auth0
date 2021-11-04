import React from "react"

// styles
import "./NavBar.css"
// eslint-disable-next-line
import {
  Container,
  Button,
} from "reactstrap"


// eslint-disable-next-line
import { useAuth0 } from "@auth0/auth0-react"

const NavBar = (props) => {

  const onRun = props["props"]["onRun"]
  const domain = props["props"]["domain"]

  // eslint-disable-next-line
  const {
    user,
    isAuthenticated,
    loginWithRedirect,
    loginWithPopup,
    logout,
    getAccessTokenSilently,
    getAccessTokenWithPopup,
  } = useAuth0()

  const logoutWithRedirect = () =>
    logout({
      returnTo: window.location,
    })



  // set react state for token
  const [access_token, setAccessToken] = React.useState(null)

  // useEffect to get the access token whenever the user changes / isAuthenticated
  React.useEffect(() => {

    const access_token_options = {
      audience: `https://${domain}/api/v2/`,
    }

    const getAccessToken = () => {
      if (access_token) {
        onRun(user, access_token)
      } else {
        // try getting token silently, and return it, if it fails , try getting it with popup
        getAccessTokenSilently(access_token_options)
          .catch(() => {
            return getAccessTokenWithPopup(access_token_options)
          })
          .then((token) => {
              setAccessToken(token)
              onRun(user, token)
            },
          )
      }
    }

    if (isAuthenticated) {
      getAccessToken()
    } else {
      onRun(false, null)
    }
  }, )


  return (
    <div className="nav-container">
      <Container className="login-component">
        {!isAuthenticated && (
          <Button
            color="primary"
            className="btn-margin"
            onClick={() => {
              loginWithPopup({}).then(() => {
                onRun(false, null)
              }).catch((err) => console.log(err))
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
  )
}

export default NavBar

