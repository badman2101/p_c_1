// Create a new file: src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';

// Modified App.jsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/contexts/theme-context";
import Layout from "@/routes/layout";
import UserPage from "./routes/user/page";
import LoginPage from "./routes/login/page";
import ProtectedRoute from './components/ProtectedRoute';
import PetitionsPage from './routes/petitions/page';
import ProfilePage from './routes/profile/page';
import AssignmentsPage from './routes/assignments/page';
import VuanPage from './routes/cases/page';

// Guard chỉ cho phpép admin/super_admin truy cập
const AdminRoute = ({ children }) => {
    const location = useLocation();
    try {
        const token = localStorage.getItem('token');
        if (token) {
            const user = JSON.parse(token);
            if (user && user.role !== 'admin' && user.role !== 'super_admin') {
                return <Navigate to="/don_thu" state={{ from: location }} replace />;
            }
        }
    } catch (e) {}
    return children;
};

function App() {
    const router = createBrowserRouter([
        {
            path: "/login",
            element: <LoginPage />,
        },
        {
            path: "/",
            element: (
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            ),
            children: [
                {
                    index: true,
                    element: <Navigate to="/don_thu" replace />,
                },
                {
                    path: "/tai_khoan",
                    element: <AdminRoute><UserPage /></AdminRoute>,
                },
                {
                    path: "/don_thu",
                    element: <PetitionsPage/>,
                },
                {
                    path: "/ho_so",
                    element: <ProfilePage />,
                },
                {
                    path: "/nguon_tin",
                    element: <AssignmentsPage />,
                },
                {
                    path: "/vu_an",
                    element: <VuanPage />,
                },
            ],
        },
    ]);

    return (
        <ThemeProvider storageKey="theme" defaultTheme="light">
            <RouterProvider router={router} />
        </ThemeProvider>
    );
}

export default App;