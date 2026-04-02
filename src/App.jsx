// Create a new file: src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';

// Modified App.jsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/contexts/theme-context";
import Layout from "@/routes/layout";
import DashboardPage from "@/routes/dashboard/page";
import UserPage from "./routes/user/page";
import LoginPage from "./routes/login/page";
import ProtectedRoute from './components/ProtectedRoute';
import PetitionsPage from './routes/petitions/page';

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
                    element: <DashboardPage />,
                },
                {
                    path: "/tai_khoan",
                    element: <UserPage />,
                },
                {
                    path: "/don_thu",
                    element: <PetitionsPage/>,
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