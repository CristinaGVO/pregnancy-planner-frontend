import { useContext } from "react";
import { Routes, Route } from "react-router-dom";

import NavBar from "./components/NavBar/NavBar";
import SignUpForm from "./components/SignUpForm/SignUpForm";
import SignInForm from "./components/SignInForm/SignInForm";
import Landing from "./components/Landing/Landing";
import Dashboard from "./components/Dashboard/Dashboard";
import AppointmentEdit from "./components/AppointmentEdit/AppointmentEdit";


import AppointmentsIndex from "./components/AppointmentsIndex/AppointmentsIndex";
import AppointmentNew from "./components/AppointmentNew/AppointmentNew";

import { UserContext } from "./contexts/UserContext";

const App = () => {
  const { user } = useContext(UserContext);

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={user ? <Dashboard /> : <Landing />} />
        <Route path="/sign-up" element={<SignUpForm />} />
        <Route path="/sign-in" element={<SignInForm />} />

        {/* NUEVAS PAGES */}
        <Route path="/appointments" element={<AppointmentsIndex />} />
        <Route path="/appointments/new" element={<AppointmentNew />} />
        <Route path="/appointments/:id/edit" element={<AppointmentEdit />} />
      </Routes>
    </>
  );
};

export default App;
