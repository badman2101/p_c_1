import { ChartColumn, FileQuestion, Home, NotepadText, Package, PackagePlus, Settings, ShoppingBag, UserCheck, UserPlus, Users, Mail } from "lucide-react";

import ProfileImage from "@/assets/profile-image.jpg";
import ProductImage from "@/assets/product-image.jpg";

export const navbarLinks = [
    {
        title: "Hệ thống",
        links: [
            {
                label: "Trang chủ",
                icon: Home,
                path: "/",
            },
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

export const incidentsData = [
    {
        name: "Tháng 1",
        total: 120,
    },
    {
        name: "Tháng 2",
        total: 95,
    },
    {
        name: "Tháng 3",
        total: 140,
    },
    {
        name: "Tháng 4",
        total: 110,
    },
    {
        name: "Tháng 5",
        total: 160,
    },
    {
        name: "Tháng 6",
        total: 180,
    },
    {
        name: "Tháng 7",
        total: 155,
    },
    {
        name: "Tháng 8",
        total: 210,
    },
    {
        name: "Tháng 9",
        total: 195,
    },
    {
        name: "Tháng 10",
        total: 170,
    },
    {
        name: "Tháng 11",
        total: 130,
    },
    {
        name: "Tháng 12",
        total: 150,
    },
];

export const recentPetitionsData = [
    {
        id: 1,
        name: "Nguyễn Văn An",
        email: "nguyenan@email.com",
        image: ProfileImage,
        total: "Trộm cắp tài sản",
    },
    {
        id: 2,
        name: "Trần Thị Bích",
        email: "tranbich@email.com",
        image: ProfileImage,
        total: "Cố ý gây thương tích",
    },
    {
        id: 3,
        name: "Lê Văn Cường",
        email: "lecuong@email.com",
        image: ProfileImage,
        total: "Lừa đảo chiếm đoạt",
    },
    {
        id: 4,
        name: "Phạm Thu Dung",
        email: "phamdung@email.com",
        image: ProfileImage,
        total: "Gây rối trật tự",
    },
    {
        id: 5,
        name: "Hoàng Minh Tuấn",
        email: "hoangtuan@email.com",
        image: ProfileImage,
        total: "Bạo hành gia đình",
    },
];

export const activeCasesData = [
    {
        number: "VA-24-001",
        name: "Chuyên án ma túy liên tỉnh",
        image: ProductImage,
        description: "Phá đường dây vận chuyển trái phép chất ma túy.",
        price: "Cao",
        status: "Đang mở rộng",
        rating: 5.0,
    },
    {
        number: "VA-24-012",
        name: "Lừa đảo công nghệ cao",
        image: ProductImage,
        description: "Bắt giữ nhóm đối tượng giả danh cơ quan chức năng.",
        price: "Cao",
        status: "Khảo sát",
        rating: 4.8,
    },
    {
        number: "VA-24-033",
        name: "Trộm cắp tại siêu thị",
        image: ProductImage,
        description: "Băng nhóm trộm cắp có tổ chức tại trung tâm thương mại.",
        price: "Trung bình",
        status: "Tạm đình chỉ",
        rating: 4.2,
    },
    {
        number: "VA-24-045",
        name: "Gây rối trật tự công cộng",
        image: ProductImage,
        description: "Xô xát, đánh nhau có hung khí nguy hiểm.",
        price: "Cao",
        status: "Khởi tố",
        rating: 4.9,
    },
    {
        number: "VA-24-051",
        name: "Cưỡng đoạt tài sản",
        image: ProductImage,
        description: "Tội phạm tín dụng đen móp méo tinh thần nạn nhân.",
        price: "Trung bình",
        status: "Đang điều tra",
        rating: 4.5,
    },
];
