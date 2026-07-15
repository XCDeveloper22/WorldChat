/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Splash from "./Splash";
import Login from "./Login";
import Chat from "./Chat";
import VercelCallback from "./VercelCallback";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/vercel-callback" element={<VercelCallback />} />
      </Routes>
    </BrowserRouter>
  );
}
