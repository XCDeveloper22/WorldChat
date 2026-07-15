/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Splash from "./Splash";
import Login from "./Login";
import Chat from "./Chat";

// Client ID obtained from firebase-applet-config.json
const GOOGLE_CLIENT_ID = "614473808276-2cphp7cttehfcmcn7pj96ngo6cu8ce7p.apps.googleusercontent.com";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
