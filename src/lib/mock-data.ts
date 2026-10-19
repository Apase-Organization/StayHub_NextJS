export interface Destination {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
}

export const POPULAR_DESTINATIONS: Destination[] = [
  {
    id: "dest-1",
    name: "Hồ Chí Minh",
    slug: "ho-chi-minh",
    image: "/destinations/ho-chi-minh.jpg",
    description:
      "Thành phố sôi động với Landmark 81, Cầu Sài Gòn và Bitexco hoa lệ",
  },
  {
    id: "dest-2",
    name: "Hà Nội",
    slug: "ha-noi",
    image: "/destinations/ha-noi.jpg",
    description:
      "Thủ đô nghìn năm văn hiến, Tháp Rùa Hồ Gươm và 36 phố phường cổ kính",
  },
  {
    id: "dest-3",
    name: "Đà Nẵng",
    slug: "da-nang",
    image: "/destinations/da-nang.jpg",
    description:
      "Thành phố biển đáng sống với Cầu Vàng Bà Nà Hills và biển Mỹ Khê",
  },
  {
    id: "dest-4",
    name: "Đà Lạt",
    slug: "da-lat",
    image: "/destinations/da-lat.jpg",
    description:
      "Thành phố ngàn hoa với Hồ Xuân Hương và đồi thông se lạnh mộng mơ",
  },
  {
    id: "dest-5",
    name: "Nha Trang",
    slug: "nha-trang",
    image: "/destinations/nha-trang.jpg",
    description:
      "Vịnh biển trong xanh, bãi cát dài cùng thiên đường nghỉ dưỡng nhiệt đới",
  },
  {
    id: "dest-6",
    name: "Phú Quốc",
    slug: "phu-quoc",
    image: "/destinations/phu-quoc.jpg",
    description:
      "Đảo ngọc hoang sơ với hoàng hôn rực rỡ và các khu nghỉ dưỡng ven biển",
  },
  {
    id: "dest-7",
    name: "Hội An",
    slug: "hoi-an",
    image: "/destinations/hoi-an.jpg",
    description:
      "Phố cổ di sản thế giới lung linh sắc màu đèn lồng bên bờ sông Hoài",
  },
  {
    id: "dest-8",
    name: "Hạ Long",
    slug: "ha-long",
    image: "/destinations/ha-long.jpg",
    description:
      "Kỳ quan thiên nhiên thế giới với hàng ngàn đảo đá vôi tráng lệ trên vịnh",
  },
];
