import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  makeVar,
  ApolloProvider,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import axios from "axios";

import { buildAuthUrl, fetchUserData, UserData } from "../index";
import { useEffect } from "react";

const isLoggedInVar = makeVar<boolean>(false);
const userDataVar = makeVar<UserData | null>(null);

const httpLink = createHttpLink({
  uri: "https://graphql.anilist.co",
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("accessToken");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
  if (networkError) console.error(`Network: ${networkError}`);
});

const client = new ApolloClient({
  link: errorLink.concat(authLink.concat(httpLink)),
  cache: new InMemoryCache(),
});

function login() {
  axios
    .get("/get-csrf-token")
    .then((response) => {
      const csrfToken = response.data.csrfToken;
      const authUrl = buildAuthUrl(csrfToken);
      window.location.href = authUrl;
    })
    .catch((error) => {
      console.error("Error fetching CSRF token or building auth URL:", error);
    });
}

function logout() {
  localStorage.removeItem("accessToken");
  isLoggedInVar(false);
  userDataVar(null);
  window.location.href = "/profile";
  window.dispatchEvent(new CustomEvent("authUpdate"));
}

function handleAuthUpdate() {
  const token = localStorage.getItem("accessToken");
  if (token) {
    fetchUserData(token)
      .then((data) => {
        userDataVar(data);
        isLoggedInVar(true);
      })
      .catch((err) => {
        console.error("Failed to fetch user data:", err);
        logout();
      });
  } else {
    isLoggedInVar(false);
    userDataVar(null);
  }
}

export const ApolloClientProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  useEffect(() => {
    window.addEventListener("authUpdate", handleAuthUpdate);
    handleAuthUpdate();
    return () => {
      window.removeEventListener("authUpdate", handleAuthUpdate);
    };
  }, []);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

export {
  client as defaultApolloClient,
  login,
  logout,
  isLoggedInVar,
  userDataVar,
};
