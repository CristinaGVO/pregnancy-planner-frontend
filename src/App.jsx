import { useContext } from "react";
import { Routes, Route } from "react-router-dom";

import NavBar from "./components/NavBar/NavBar";
import SignUpForm from "./components/SignUpForm/SignUpForm";
import SignInForm from "./components/SignInForm/SignInForm";
import Landing from "./components/Landing/Landing";
import Dashboard from "./components/Dashboard/Dashboard";
import AppointmentsIndex from "./components/AppointmentsIndex/AppointmentsIndex";
import AppointmentEdit from "./components/AppointmentEdit/AppointmentEdit";

import AppointmentNew from "./components/AppointmentNew/AppointmentNew";

import { UserContext } from "./contexts/UserContext";

export default function App() {
  const { user } = useContext(UserContext);

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={user ? <Dashboard /> : <Landing />} />
        <Route path="/sign-up" element={<SignUpForm />} />
        <Route path="/sign-in" element={<SignInForm />} />

        <Route path="/appointments" element={<AppointmentsIndex />} />
        <Route path="/appointments/new" element={<AppointmentNew />} />
        <Route path="/appointments/:id/edit" element={<AppointmentEdit />} />
      </Routes>
    </>
  );
}
