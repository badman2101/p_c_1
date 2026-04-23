import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/contexts/theme-context";
const Layout = lazy(() => import("@/routes/layout"));
const UserPage = lazy(() => import("./routes/user/page"));
const LoginPage = lazy(() => import("./routes/login/page"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const PetitionsPage = lazy(() => import("./routes/petitions/page"));
const ProfilePage = lazy(() => import("./routes/profile/page"));
const AssignmentsPage = lazy(() => import("./routes/assignments/page"));
const VuanPage = lazy(() => import("./routes/cases/page"));

// Guard chỉ cho phpép admin/super_admin truy cập
const PageLoader = () => <div className="p-4 text-sm text-muted-foreground">Dang tai du lieu...</div>;

const AdminRoute = ({ children }) => {
    const location = useLocation();
    try {
        const token = localStorage.getItem("token");
        if (token) {
            const user = JSON.parse(token);
            if (user && user.role !== "admin" && user.role !== "super_admin") {
                return <Navigate to="/don_thu" state={{ from: location }} replace />;
            }
        }
    } catch (e) {
        // If token parsing fails, fallback to default route behavior.
    }
    return children;
};

const withSuspense = (node) => <Suspense fallback={<PageLoader />}>{node}</Suspense>;

const router = createBrowserRouter([
    {
        path: "/login",
        element: withSuspense(<LoginPage />),
    },
    {
        path: "/",
        element: withSuspense(
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>,
        ),
        children: [
            {
                index: true,
                element: <Navigate to="/don_thu" replace />,
            },
            {
                path: "/tai_khoan",
                element: withSuspense(
                    <AdminRoute>
                        <UserPage />
                    </AdminRoute>,
                ),
            },
            {
                path: "/don_thu",
                element: withSuspense(<PetitionsPage />),
            },
            {
                path: "/ho_so",
                element: withSuspense(<ProfilePage />),
            },
            {
                path: "/nguon_tin",
                element: withSuspense(<AssignmentsPage />),
            },
            {
                path: "/vu_an",
                element: withSuspense(<VuanPage />),
            },
        ],
    },
]);

function App() {

    return (
        <ThemeProvider storageKey="theme" defaultTheme="light">
            <RouterProvider router={router} />
        </ThemeProvider>
    );
}

export default App;