import { ChartColumn, FileQuestion, Home, NotepadText, Package, PackagePlus, Settings, ShoppingBag, UserCheck, UserPlus, Users, Mail, Briefcase } from "lucide-react";

export const navbarLinks = [
    {
        title: "Hệ thống",
        links: [
            {
                label: "Tài khoản",
                icon: ChartColumn,
                path: "/tai_khoan",
            },
        ],
    },
    // {
    //     title: "Customers",
    //     links: [
    //         {
    //             label: "Môn học",
    //             icon: NotepadText,
    //             path: "/courses",
    //         },
    //         {
    //             label: "Bài học",
    //             icon: UserPlus,
    //             path: "/lession",
    //         },
    //         {
    //             label: "Exercises",
    //             icon: UserCheck,
    //             path: "/exercises",
    //         },
            
    //     ],
    // },
    {
        title: "Dịch vụ",
        links: [
            {
                label: "Đơn thư",
                icon: Mail,
                path: "/don_thu",
            },
            {
                label: "Nguồn tin",
                icon: NotepadText,
                path: "/nguon_tin",
            },
            {
                label: "Vụ án",
                icon: Briefcase,
                path: "/vu_an",
            },
        ],
    },
    // {
    //     title: "Products",
    //     links: [
    //         {
    //             label: "Products",
    //             icon: Package,
    //             path: "/products",
    //         },
    //         {
    //             label: "New product",
    //             icon: PackagePlus,
    //             path: "/new-product",
    //         },
    //         {
    //             label: "Inventory",
    //             icon: ShoppingBag,
    //             path: "/inventory",
    //         },
    //     ],
    // },
    // {
    //     title: "Settings",
    //     links: [
    //         {
    //             label: "Settings",
    //             icon: Settings,
    //             path: "/settings",
    //         },
    //     ],
    // },
];
