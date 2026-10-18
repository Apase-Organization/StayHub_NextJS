export interface Destination {
  id: string;
  name: string;
  slug: string;
  image: string;
  propertiesCount: number;
  description: string;
}

export interface Property {
  id: string;
  title: string;
  slug: string;
  propertyType: "APARTMENT" | "VILLA" | "HOUSE" | "STUDIO";
  propertyTypeName: string;
  city: string;
  address: string;
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
  rating: number;
  reviewCount: number;
  isSuperhost: boolean;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  images: string[];
  amenities: string[];
  description: string;
  host: {
    name: string;
    avatar: string;
    isSuperhost: boolean;
    joinedYear: number;
    responseRate: string;
    responseTime: string;
  };
}

export interface Booking {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyCity: string;
  propertyAddress: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalPrice: number;
  status: "UPCOMING" | "PENDING" | "COMPLETED" | "CANCELLED";
  paymentStatus: "PAID" | "PENDING" | "REFUNDED";
  paymentMethod: "VNPAY" | "CREDIT_CARD";
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  hostName: string;
  createdAt: string;
}

export const POPULAR_DESTINATIONS: Destination[] = [
  {
    id: "dest-1",
    name: "Đà Nẵng",
    slug: "da-nang",
    image:
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80",
    propertiesCount: 248,
    description: "Thành phố biển đáng sống với bãi biển Mỹ Khê và Cầu Vàng",
  },
  {
    id: "dest-2",
    name: "Đà Lạt",
    slug: "da-lat",
    image:
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80",
    propertiesCount: 312,
    description: "Thành phố ngàn hoa với khí hậu se lạnh và đồi thông lãng mạn",
  },
  {
    id: "dest-3",
    name: "Nha Trang",
    slug: "nha-trang",
    image:
      "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=800&q=80",
    propertiesCount: 185,
    description:
      "Vịnh biển trong xanh, bãi cát dài cùng thiên đường nghỉ dưỡng",
  },
  {
    id: "dest-4",
    name: "Hồ Chí Minh",
    slug: "ho-chi-minh",
    image:
      "https://images.unsplash.com/photo-1583417654171-995b0f15c1e9?auto=format&fit=crop&w=800&q=80",
    propertiesCount: 420,
    description: "Trung tâm sôi động với các căn hộ cao cấp và văn hóa ẩm thực",
  },
  {
    id: "dest-5",
    name: "Hà Nội",
    slug: "ha-noi",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    propertiesCount: 295,
    description:
      "Nét đẹp nghìn năm văn hiến, phố cổ trầm mặc và ẩm thực tinh tế",
  },
  {
    id: "dest-6",
    name: "Phú Quốc",
    slug: "phu-quoc",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    propertiesCount: 160,
    description: "Đảo ngọc hoang sơ với hoàng hôn lộng lẫy và resort ven biển",
  },
];

export const MOCK_PROPERTIES: Property[] = [
  {
    id: "prop-1",
    title: "Luxury Oceanfront Horizon Villa Mỹ Khê",
    slug: "luxury-oceanfront-horizon-villa-my-khe",
    propertyType: "VILLA",
    propertyTypeName: "Biệt thự nguyên căn",
    city: "Đà Nẵng",
    address: "Đường Võ Nguyên Giáp, Quận Ngũ Hành Sơn, Đà Nẵng",
    pricePerNight: 2850000,
    cleaningFee: 250000,
    serviceFee: 150000,
    rating: 4.96,
    reviewCount: 142,
    isSuperhost: true,
    maxGuests: 6,
    bedrooms: 3,
    beds: 4,
    bathrooms: 3,
    images: [
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    ],
    amenities: [
      "Bể bơi vô cực riêng",
      "Wifi tốc độ cao (150 Mbps)",
      "Bàn làm việc chuyên dụng",
      "Bếp nấu đầy đủ dụng cụ",
      "Máy giặt & sấy đồ",
      "Điều hòa 2 chiều",
      "Tự nhận phòng thông minh",
      "Bãi đỗ ô tô miễn phí",
      "Ban công ngắm biển trọn vẹn",
      "Bồn tắm massage Jacuzzi",
    ],
    description:
      "Biệt thự nghỉ dưỡng cao cấp tọa lạc ngay sát bãi biển Mỹ Khê danh tiếng. Không gian được thiết kế theo phong cách hiện đại tối giản (Minimalism) đón trọn ánh sáng tự nhiên và gió biển trong lành. Khuôn viên sở hữu bể bơi vô cực riêng tư nhìn ra bờ cát trắng mịn, thích hợp cho nhóm gia đình hoặc bạn bè tìm kiếm kỳ nghỉ dưỡng đẳng cấp.",
    host: {
      name: "Thái Duy & Đức Anh",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      isSuperhost: true,
      joinedYear: 2023,
      responseRate: "100%",
      responseTime: "Trong vòng 15 phút",
    },
  },
  {
    id: "prop-2",
    title: "The Pine Hill Studio Homestay Đà Lạt",
    slug: "the-pine-hill-studio-homestay-da-lat",
    propertyType: "STUDIO",
    propertyTypeName: "Căn hộ Studio",
    city: "Đà Lạt",
    address: "Đường Triệu Việt Vương, Phường 4, TP. Đà Lạt",
    pricePerNight: 950000,
    cleaningFee: 100000,
    serviceFee: 80000,
    rating: 4.88,
    reviewCount: 96,
    isSuperhost: true,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    images: [
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
    ],
    amenities: [
      "Lò sưởi củi ấm cúng",
      "View đồi thông cực chill",
      "Wifi cáp quang tốc độ cao",
      "Bếp mini pha cà phê/trà",
      "Nước nóng năng lượng mặt trời",
      "Vườn hoa cẩm tú cầu",
      "Check-in bằng khóa từ",
    ],
    description:
      "Tận hưởng trọn vẹn cái lạnh đặc trưng của Đà Lạt tại căn studio gỗ thông nép mình giữa thung lũng. Cửa sổ kính lớn từ sàn tới trần mở ra bức tranh đồi thông mù sương mỗi sớm mai. Thích hợp cho các cặp đôi hoặc du khách muốn tìm khoảng lặng yên bình.",
    host: {
      name: "Nguyên Đức Huy",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      isSuperhost: true,
      joinedYear: 2024,
      responseRate: "98%",
      responseTime: "Trong vòng 30 phút",
    },
  },
  {
    id: "prop-3",
    title: "Panoramic Sunset Panorama Suite Nha Trang",
    slug: "panoramic-sunset-panorama-suite-nha-trang",
    propertyType: "APARTMENT",
    propertyTypeName: "Căn hộ cao cấp",
    city: "Nha Trang",
    address: "Đường Trần Phú, Phường Lộc Thọ, TP. Nha Trang",
    pricePerNight: 1450000,
    cleaningFee: 150000,
    serviceFee: 100000,
    rating: 4.92,
    reviewCount: 115,
    isSuperhost: false,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80",
    ],
    amenities: [
      "Hồ bơi tầng thượng 360 độ",
      "Ban công ngắm trọn vịnh Nha Trang",
      "Bếp điện từ & tủ lạnh lớn",
      "Smart TV 55 inch với Netflix",
      "Phòng tập gym cao cấp",
      "Bảo vệ 24/7 an ninh tuyệt đối",
    ],
    description:
      "Căn hộ cao cấp tọa lạc tại trục đường vàng Trần Phú đối diện bờ biển Nha Trang. Tầm nhìn panorama ngoạn mục từ tầng cao ngắm trọn vịnh biển và quảng trường 2/4 sôi động. Tiện ích tòa nhà 5 sao với hồ bơi vô cực tầng thượng và sky bar đẳng cấp.",
    host: {
      name: "Minh Trang Host",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      isSuperhost: false,
      joinedYear: 2023,
      responseRate: "95%",
      responseTime: "Trong vòng 1 giờ",
    },
  },
  {
    id: "prop-4",
    title: "Saigon Riverfront Penthouse & Jacuzzi",
    slug: "saigon-riverfront-penthouse-jacuzzi",
    propertyType: "APARTMENT",
    propertyTypeName: "Penthouse ven sông",
    city: "Hồ Chí Minh",
    address: "Đường Nguyễn Hữu Cảnh, Quận Bình Thạnh, TP. Hồ Chí Minh",
    pricePerNight: 3200000,
    cleaningFee: 300000,
    serviceFee: 180000,
    rating: 4.98,
    reviewCount: 168,
    isSuperhost: true,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=800&q=80",
    ],
    amenities: [
      "Bồn sục Jacuzzi ngoài trời",
      "View Landmark 81 & sông Sài Gòn",
      "Bếp đảo cao cấp nhập khẩu",
      "Phòng xông hơi riêng",
      "Chỗ đỗ xe có trạm sạc điện",
      "Thang máy riêng bảo mật",
    ],
    description:
      "Đỉnh cao trải nghiệm sống thượng lưu giữa trung tâm thành phố hoa lệ. Tận hưởng ly rượu vang bên bồn sục Jacuzzi ngoài trời ngắm pháo hoa và tòa tháp Landmark 81 rực rỡ về đêm. Thiết kế nội thất đạt giải thưởng kiến trúc quốc tế.",
    host: {
      name: "Hoàng Long Superhost",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      isSuperhost: true,
      joinedYear: 2022,
      responseRate: "100%",
      responseTime: "Trong vòng 5 phút",
    },
  },
  {
    id: "prop-5",
    title: "Phố Cổ Heritage Boutique Townhouse Hà Nội",
    slug: "pho-co-heritage-boutique-townhouse-ha-noi",
    propertyType: "HOUSE",
    propertyTypeName: "Nhà phố nguyên căn",
    city: "Hà Nội",
    address: "Phố Hàng Bè, Phường Hàng Bạc, Quận Hoàn Kiếm, Hà Nội",
    pricePerNight: 1650000,
    cleaningFee: 150000,
    serviceFee: 100000,
    rating: 4.91,
    reviewCount: 88,
    isSuperhost: true,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
    ],
    amenities: [
      "Cách Hồ Hoàn Kiếm 3 phút đi bộ",
      "Kiến trúc Đông Dương (Indochine) hoài niệm",
      "Giếng trời thoáng đãng nhiều cây xanh",
      "Trà và cà phê truyền thống miễn phí",
      "Khóa cửa vân tay bảo mật",
    ],
    description:
      "Tọa lạc ngay trái tim 36 phố phường Hà Nội, ngôi nhà giao thoa tinh tế giữa kiến trúc Pháp cổ kính và phong cách Indochine thanh lịch. Bước ra khỏi cửa là hương vị phở truyền thống và nhịp sống văn hóa Thủ đô ngàn năm văn hiến.",
    host: {
      name: "Thảo My",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
      isSuperhost: true,
      joinedYear: 2023,
      responseRate: "99%",
      responseTime: "Trong vòng 20 phút",
    },
  },
  {
    id: "prop-6",
    title: "Coral Reef Sunset Bungalow Phú Quốc",
    slug: "coral-reef-sunset-bungalow-phu-quoc",
    propertyType: "VILLA",
    propertyTypeName: "Bungalow bãi biển",
    city: "Phú Quốc",
    address: "Bãi Ông Lang, Cửa Dương, TP. Phú Quốc, Kiên Giang",
    pricePerNight: 2100000,
    cleaningFee: 200000,
    serviceFee: 120000,
    rating: 4.94,
    reviewCount: 132,
    isSuperhost: true,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    images: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
    ],
    amenities: [
      "Lối đi thẳng ra bãi biển riêng",
      "Thuyền Kayak & kính lặn san hô",
      "Bữa sáng nhiệt đới phục vụ tận phòng",
      "Võng thư giãn đón hoàng hôn",
      "Đưa đón sân bay 2 chiều",
    ],
    description:
      "Bungalow lợp mái lá tự nhiên nằm nép mình bên rặng dừa Bãi Ông Lang. Mỗi chiều bạn có thể chiêm ngưỡng hoàng hôn rực đỏ buông xuống mặt biển từ chiếc võng êm ái ngoài hiên nhà. Chốn thiên đường để tái tạo năng lượng.",
    host: {
      name: "Quốc Hưng Resort",
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
      isSuperhost: true,
      joinedYear: 2022,
      responseRate: "97%",
      responseTime: "Trong vòng 45 phút",
    },
  },
];

export const MOCK_USER_BOOKINGS: Booking[] = [
  {
    id: "BK-88219",
    propertyId: "prop-1",
    propertyTitle: "Luxury Oceanfront Horizon Villa Mỹ Khê",
    propertyImage:
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=600&q=80",
    propertyCity: "Đà Nẵng",
    propertyAddress: "Đường Võ Nguyên Giáp, Quận Ngũ Hành Sơn, Đà Nẵng",
    checkIn: "2026-10-15",
    checkOut: "2026-10-18",
    guests: 4,
    nights: 3,
    totalPrice: 8950000,
    status: "UPCOMING",
    paymentStatus: "PAID",
    paymentMethod: "VNPAY",
    guestName: "Trần Đức Anh",
    guestEmail: "ducanh@gmail.com",
    guestPhone: "0912345678",
    hostName: "Thái Duy & Đức Anh",
    createdAt: "2026-09-25",
  },
  {
    id: "BK-77402",
    propertyId: "prop-2",
    propertyTitle: "The Pine Hill Studio Homestay Đà Lạt",
    propertyImage:
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80",
    propertyCity: "Đà Lạt",
    propertyAddress: "Đường Triệu Việt Vương, Phường 4, TP. Đà Lạt",
    checkIn: "2026-11-02",
    checkOut: "2026-11-05",
    guests: 2,
    nights: 3,
    totalPrice: 3030000,
    status: "PENDING",
    paymentStatus: "PENDING",
    paymentMethod: "VNPAY",
    guestName: "Trần Đức Anh",
    guestEmail: "ducanh@gmail.com",
    guestPhone: "0912345678",
    hostName: "Nguyên Đức Huy",
    createdAt: "2026-09-27",
  },
  {
    id: "BK-55210",
    propertyId: "prop-3",
    propertyTitle: "Panoramic Sunset Panorama Suite Nha Trang",
    propertyImage:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80",
    propertyCity: "Nha Trang",
    propertyAddress: "Đường Trần Phú, Phường Lộc Thọ, TP. Nha Trang",
    checkIn: "2026-08-10",
    checkOut: "2026-08-14",
    guests: 3,
    nights: 4,
    totalPrice: 6050000,
    status: "COMPLETED",
    paymentStatus: "PAID",
    paymentMethod: "VNPAY",
    guestName: "Trần Đức Anh",
    guestEmail: "ducanh@gmail.com",
    guestPhone: "0912345678",
    hostName: "Minh Trang Host",
    createdAt: "2026-07-28",
  },
  {
    id: "BK-33190",
    propertyId: "prop-6",
    propertyTitle: "Coral Reef Sunset Bungalow Phú Quốc",
    propertyImage:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
    propertyCity: "Phú Quốc",
    propertyAddress: "Bãi Ông Lang, Cửa Dương, TP. Phú Quốc",
    checkIn: "2026-07-01",
    checkOut: "2026-07-04",
    guests: 2,
    nights: 3,
    totalPrice: 6620000,
    status: "CANCELLED",
    paymentStatus: "REFUNDED",
    paymentMethod: "VNPAY",
    guestName: "Trần Đức Anh",
    guestEmail: "ducanh@gmail.com",
    guestPhone: "0912345678",
    hostName: "Quốc Hưng Resort",
    createdAt: "2026-06-20",
  },
];

export const MOCK_HOST_KPIS = {
  totalProperties: 8,
  pendingRequests: 3,
  confirmedBookings: 24,
  monthlyRevenue: 48500000,
};

export const MOCK_HOST_BOOKING_REQUESTS = [
  {
    id: "REQ-901",
    guestName: "Nguyễn Văn An",
    guestAvatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
    propertyTitle: "Luxury Oceanfront Horizon Villa Mỹ Khê",
    dates: "12/10 - 15/10/2026",
    guests: 4,
    totalAmount: 8950000,
    status: "PENDING",
  },
  {
    id: "REQ-902",
    guestName: "Lê Hoàng Yến",
    guestAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    propertyTitle: "The Song Vung Tau Luxury Seaview",
    dates: "20/10 - 22/10/2026",
    guests: 2,
    totalAmount: 3450000,
    status: "PENDING",
  },
  {
    id: "REQ-903",
    guestName: "David Miller",
    guestAvatar:
      "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80",
    propertyTitle: "Dalat Pine Chalet with Garden",
    dates: "28/10 - 31/10/2026",
    guests: 3,
    totalAmount: 4200000,
    status: "PENDING",
  },
  {
    id: "REQ-899",
    guestName: "Phạm Minh Tuấn",
    guestAvatar:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80",
    propertyTitle: "Luxury Oceanfront Horizon Villa Mỹ Khê",
    dates: "01/10 - 05/10/2026",
    guests: 6,
    totalAmount: 11800000,
    status: "CONFIRMED",
  },
];

export const MOCK_ADMIN_KPIS = {
  totalUsers: 12450,
  activeHosts: 840,
  platformRevenue: 156800000,
  totalBookings: 3890,
};

export const MOCK_ADMIN_RECENT_BOOKINGS = [
  {
    id: "BK-99120",
    guestName: "Trần Đức Anh",
    hostName: "Thái Duy",
    propertyName: "Luxury Oceanfront Horizon Villa",
    dates: "15/10 - 18/10/2026",
    amount: 8950000,
    commission: 895000,
    status: "CONFIRMED",
  },
  {
    id: "BK-99119",
    guestName: "Nguyễn Đức Huy",
    hostName: "Minh Trang",
    propertyName: "Sunset Panorama Suite Nha Trang",
    dates: "10/10 - 12/10/2026",
    amount: 3200000,
    commission: 320000,
    status: "CONFIRMED",
  },
  {
    id: "BK-99118",
    guestName: "Vũ Bảo Ngọc",
    hostName: "Hoàng Long",
    propertyName: "Saigon Riverfront Penthouse",
    dates: "05/10 - 07/10/2026",
    amount: 6700000,
    commission: 670000,
    status: "PENDING",
  },
  {
    id: "BK-99117",
    guestName: "John Anderson",
    hostName: "Thảo My",
    propertyName: "Phố Cổ Heritage Townhouse",
    dates: "02/10 - 06/10/2026",
    amount: 7200000,
    commission: 720000,
    status: "CONFIRMED",
  },
  {
    id: "BK-99116",
    guestName: "Đặng Thu Thảo",
    hostName: "Quốc Hưng",
    propertyName: "Coral Reef Sunset Bungalow",
    dates: "28/09 - 30/09/2026",
    amount: 4500000,
    commission: 450000,
    status: "CANCELLED",
  },
];
