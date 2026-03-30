import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerDashboard from "./pages/CustomerDashboard";
import CompleteProfile from "./pages/CompleteProfile";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import ProfilePage from "./pages/ProfilePage";
import CafeOwnerDashboard from "./pages/CafeOwnerDashboard";
import BookTable from "./pages/BookTable";
import CafeDetails from "./pages/CafeDetails";
import ChefDashboard from "./pages/ChefDashboard";
import WaiterDashboard from "./pages/WaiterDashboard";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<CustomerDashboard />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/cafe-owner-dashboard" element={<CafeOwnerDashboard />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/book-table" element={<BookTable />} />
                <Route path="/cafe/:id" element={<CafeDetails />} />
                <Route path="/chef-dashboard" element={<ChefDashboard />} />
                <Route path="/waiter-dashboard" element={<WaiterDashboard />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
