/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AMENITY_DEFINITIONS = [
  { name: "Wifi tốc độ cao (150 Mbps)", icon: "Wifi" },
  { name: "Hồ bơi vô cực riêng", icon: "Waves" },
  { name: "Hồ bơi tầng thượng 360 độ", icon: "Waves" },
  { name: "Điều hòa 2 chiều", icon: "AirVent" },
  { name: "Bếp nấu đầy đủ dụng cụ", icon: "UtensilsCrossed" },
  { name: "Máy giặt & sấy đồ", icon: "WashingMachine" },
  { name: "Bãi đỗ ô tô miễn phí", icon: "Car" },
  { name: "Bồn tắm massage Jacuzzi", icon: "Bath" },
  { name: "Ban công ngắm biển trọn vẹn", icon: "Sun" },
  { name: "Lối đi thẳng ra bãi biển riêng", icon: "Footprints" },
  { name: "Ban công view Landmark 81 & sông Sài Gòn", icon: "Building" },
  { name: "Ban công view Hồ Gươm", icon: "Compass" },
  { name: "Ban công ngắm hoàng hôn Hồ Tây", icon: "Sunset" },
  { name: "Ban công ngắm Cầu Rồng & sông Hàn", icon: "Sparkles" },
  { name: "Ban công ngắm đồi thông & thung lũng sương mù", icon: "Trees" },
  { name: "Ban công săn mây Trại Mát", icon: "CloudSun" },
  { name: "Ban công ngắm toàn cảnh Vịnh Hạ Long", icon: "Ship" },
  { name: "Ban công ngắm phố đèn lồng", icon: "Flame" },
  { name: "Sân BBQ ngoài trời", icon: "Flame" },
  { name: "Bàn làm việc chuyên dụng", icon: "Laptop" },
  { name: "Smart TV & Netflix 4K", icon: "Tv" },
  { name: "Tự nhận phòng thông minh (Smart Lock)", icon: "Key" },
  { name: "Máy pha cà phê pha sẵn", icon: "Coffee" },
  { name: "Bồn tắm ngâm thảo mộc", icon: "Sparkles" },
  { name: "Sân vườn nhiệt đới", icon: "Trees" },
  { name: "Xe đạp miễn phí dạo phố", icon: "Bike" },
  { name: "Cho phép mang thú cưng", icon: "Dog" },
];

const REAL_PROPERTIES = [
  // ==========================================
  // 1. HỒ CHÍ MINH (TP. Hồ Chí Minh) - 3 properties
  // ==========================================
  {
    title: "The Landmark 81 Skyview Luxury Residence",
    description: `Tọa lạc tại tầng cao tòa nhà Landmark 81 biểu tượng của TP. Hồ Chí Minh, căn hộ mang đến trải nghiệm sống thượng lưu đỉnh cao với tầm nhìn toàn cảnh sông Sài Gòn và nhịp sống sôi động của thành phố.

Không gian được bài trí hiện đại với phòng khách kính kịch trần đón ánh sáng tự nhiên rực rỡ, nội thất phong cách Bắc Âu sang trọng, phòng ngủ ấm cúng cùng bồn tắm massage ngắm ánh đèn đô thị về đêm. Khách lưu trú được sử dụng bể bơi vô cực ngoài trời, phòng gym tiêu chuẩn quốc tế và lối đi thẳng vào TTTM Vincom Center.`,
    type: "APARTMENT",
    city: "Hồ Chí Minh",
    address: "Tòa tháp Landmark 81, Vinhomes Central Park, 208 Nguyễn Hữu Cảnh, Quận Bình Thạnh, TP. Hồ Chí Minh",
    pricePerNight: 2850000,
    cleaningFee: 250000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    ratingAvg: 4.96,
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Ban công view Landmark 81 & sông Sài Gòn",
      "Hồ bơi vô cực riêng",
      "Wifi tốc độ cao (150 Mbps)",
      "Điều hòa 2 chiều",
      "Bếp nấu đầy đủ dụng cụ",
      "Bồn tắm massage Jacuzzi",
      "Smart TV & Netflix 4K",
      "Bãi đỗ ô tô miễn phí",
    ],
  },
  {
    title: "The Opera Thủ Thiêm Panorama Penthouse",
    description: `Căn Penthouse tuyệt mỹ nằm tại khu đô thị Thủ Thiêm mới, sở hữu góc nhìn trực diện sang trung tâm Quận 1 và tháp Bitexco tài chính lung linh qua dòng sông Sài Gòn.

Căn hộ có thiết kế mở thông tầng, ban công đón gió sông lộng lẫy, đảo bếp ốp đá cẩm thạch đẳng cấp và phòng ngủ master với view đắt giá bậc nhất Sài Gòn. Chỉ cách Cầu Ba Son 3 phút di chuyển để hòa mình vào các nhà hàng ẩm thực và quán bar sang trọng nhất Quận 1.`,
    type: "APARTMENT",
    city: "Hồ Chí Minh",
    address: "Phân khu The Opera Residence, Khu đô thị Thủ Thiêm, TP. Thủ Đức, TP. Hồ Chí Minh",
    pricePerNight: 3600000,
    cleaningFee: 300000,
    maxGuests: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 3,
    ratingAvg: 4.98,
    images: [
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Hồ bơi vô cực riêng",
      "Wifi tốc độ cao (150 Mbps)",
      "Điều hòa 2 chiều",
      "Bếp nấu đầy đủ dụng cụ",
      "Máy giặt & sấy đồ",
      "Bàn làm việc chuyên dụng",
      "Smart TV & Netflix 4K",
      "Bãi đỗ ô tô miễn phí",
    ],
  },
  {
    title: "Saigon Heritage Indochine House Quận 1",
    description: `Ngôi nhà phố biệt lập mang đậm phong cách kiến trúc Đông Dương (Indochine) cổ điển giữa lòng Quận 1 sôi động. Từng chi tiết gạch bông cổ, cửa gỗ chớp xanh và khoảng sân vườn xanh mát tạo cảm giác an yên hiếm có giữa lòng phố thị.

Đi bộ chỉ 5 phút là tới Chợ Bến Thành, phố đi bộ Nguyễn Huệ, Nhà hát Thành phố và bảo tàng Mỹ thuật. Chỗ ở lý tưởng cho gia đình hoặc nhóm bạn muốn khám phá chiều sâu văn hóa và ẩm thực Sài Gòn.`,
    type: "HOUSE",
    city: "Hồ Chí Minh",
    address: "Hẻm 150 Lê Thị Hồng Gấm, Phường Cầu Ông Lãnh, Quận 1, TP. Hồ Chí Minh",
    pricePerNight: 2100000,
    cleaningFee: 200000,
    maxGuests: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 2,
    ratingAvg: 4.92,
    images: [
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Wifi tốc độ cao (150 Mbps)",
      "Điều hòa 2 chiều",
      "Bếp nấu đầy đủ dụng cụ",
      "Máy giặt & sấy đồ",
      "Sân vườn nhiệt đới",
      "Smart TV & Netflix 4K",
      "Tự nhận phòng thông minh (Smart Lock)",
    ],
  },

  // ==========================================
  // 2. HÀ NỘI - 3 properties
  // ==========================================
  {
    title: "Hoan Kiem Lake Heritage Boutique Homestay",
    description: `Nằm cách bờ Hồ Hoàn Kiếm và Tháp Rùa chỉ 100m, căn homestay mang hơi thở thanh lịch của Hà Nội xưa với ban công hoa giấy ngắm nhìn dòng người tản bộ trên phố cổ Đinh Tiên Hoàng.

Không gian được phục dựng tỉ mỉ với trần gỗ cao, đèn lồng gốm mộc, máy pha cà phê phin truyền thống và bộ sưu tập tranh phố cổ Hà Nội. Bạn có thể thả bộ ra Hồ Gươm ngắm bình minh lúc sớm mai hoặc thưởng thức kem Tràng Tiền chỉ vài bước chân.`,
    type: "HOMESTAY",
    city: "Hà Nội",
    address: "Số 28 Phố Đinh Liệt, Phường Hàng Bạc, Quận Hoàn Kiếm, Hà Nội",
    pricePerNight: 1650000,
    cleaningFee: 150000,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    ratingAvg: 4.95,
    images: [
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560185007-5f0bb1866cab?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Ban công view Hồ Gươm",
      "Wifi tốc độ cao (150 Mbps)",
      "Điều hòa 2 chiều",
      "Máy pha cà phê pha sẵn",
      "Bàn làm việc chuyên dụng",
      "Smart TV & Netflix 4K",
      "Xe đạp miễn phí dạo phố",
    ],
  },
  {
    title: "West Lake Tranquil Sunset Lakeside Suite",
    description: `Căn hộ cao cấp ven Hồ Tây với ban công rộng mở ôm trọn cảnh hoàng hôn tráng lệ buông xuống mặt nước hồ lấp lánh. Không gian yên bình, thoáng đãng với gió hồ tự nhiên mát rượi.

Căn hộ có phòng khách kính panorama, bồn tắm sục Jacuzzi thư giãn, bếp gia đình hiện đại cùng khu vực xung quanh tập trung nhiều quán cà phê nghệ thuật và nhà hàng Âu - Á đặc sắc của bán đảo Quảng An.`,
    type: "APARTMENT",
    city: "Hà Nội",
    address: "Đường Quảng An, Bán đảo Quảng Bá, Quận Tây Hồ, Hà Nội",
    pricePerNight: 2300000,
    cleaningFee: 200000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    ratingAvg: 4.97,
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Ban công ngắm hoàng hôn Hồ Tây",
      "Hồ bơi tầng thượng 360 độ",
      "Wifi tốc độ cao (150 Mbps)",
      "Điều hòa 2 chiều",
      "Bếp nấu đầy đủ dụng cụ",
      "Bồn tắm massage Jacuzzi",
      "Smart TV & Netflix 4K",
      "Bãi đỗ ô tô miễn phí",
    ],
  },
  {
    title: "The Old Quarter Bohemian Loft Penthouse",
    description: `Căn loft thông tầng mang phong cách bohemian nghệ thuật nằm trên tầng thượng một ngôi nhà cổ tại phố Hàng Bè. Không gian tràn ngập ánh sáng với trần kính đón nắng và sân thượng trồng nhiều hoa sen, hoa hồng thơm ngát.

Vị trí tuyệt vời để cảm nhận nhịp đập của 36 phố phường Hà Nội: chợ đêm Đồng Xuân, phố bia Tạ Hiện, bún chả Hàng Buồm và những quán cà phê trứng nức tiếng chỉ trong vòng vài bước chân.`,
    type: "APARTMENT",
    city: "Hà Nội",
    address: "Phố Hàng Bè, Phường Hàng Bạc, Quận Hoàn Kiếm, Hà Nội",
    pricePerNight: 1450000,
    cleaningFee: 150000,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    ratingAvg: 4.91,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Wifi tốc độ cao (150 Mbps)",
      "Điều hòa 2 chiều",
      "Bếp nấu đầy đủ dụng cụ",
      "Máy giặt & sấy đồ",
      "Bàn làm việc chuyên dụng",
      "Smart TV & Netflix 4K",
      "Tự nhận phòng thông minh (Smart Lock)",
    ],
  },

  // ==========================================
  // 3. ĐÀ NẴNG - 3 properties
  // ==========================================
  {
    title: "My Khe Beachfront Infinity Luxury Villa",
    description: `Biệt thự nghỉ dưỡng 5 sao tọa lạc trực diện cung đường biển Võ Nguyên Giáp, đối diện bãi tắm Mỹ Khê - một trong những bãi biển quyến rũ nhất hành tinh.

Căn villa sở hữu bể bơi tràn vô cực riêng hướng biển, phòng khách lớn nối liền sân vườn nhiệt đới, 3 phòng ngủ master đều có bồn tắm ngắm sóng biển rì rào. Đội ngũ quản gia chuyên nghiệp sẵn sàng hỗ trợ tiệc nướng BBQ hải sản tươi sống ngay tại vườn.`,
    type: "VILLA",
    city: "Đà Nẵng",
    address: "Đường Võ Nguyên Giáp, Phường Khuê Mỹ, Quận Ngũ Hành Sơn, Đà Nẵng",
    pricePerNight: 4200000,
    cleaningFee: 350000,
    maxGuests: 8,
    bedrooms: 3,
    beds: 4,
    bathrooms: 3,
    ratingAvg: 4.98,
    images: [
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Hồ bơi vô cực riêng",
      "Lối đi thẳng ra bãi biển riêng",
      "Ban công ngắm biển trọn vẹn",
      "Bếp nấu đầy đủ dụng cụ",
      "Bồn tắm massage Jacuzzi",
      "Sân BBQ ngoài trời",
      "Bãi đỗ ô tô miễn phí",
      "Wifi tốc độ cao (150 Mbps)",
    ],
  },
  {
    title: "Han River Dragon Bridge Riverfront Condo",
    description: `Căn hộ cao cấp trên cung đường Bạch Đằng danh giá ven sông Hàn, sở hữu vị trí khán đài ngắm trọn màn trình diễn phun lửa và phun nước độc đáo của Cầu Rồng mỗi dịp cuối tuần.

Căn hộ có thiết kế tinh giản, cửa kính cách âm cao cấp, ban công lộng gió sông Hàn mát lành, hồ bơi trên cao ngắm trọn các cây cầu biểu tượng của Đà Nẵng. Rất gần chợ đêm Sơn Trà và trung tâm ẩm thực sầm uất.`,
    type: "APARTMENT",
    city: "Đà Nẵng",
    address: "Đường Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, Đà Nẵng",
    pricePerNight: 1850000,
    cleaningFee: 200000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    ratingAvg: 4.93,
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Ban công ngắm Cầu Rồng & sông Hàn",
      "Hồ bơi vô cực riêng",
      "Wifi tốc độ cao (150 Mbps)",
      "Điều hòa 2 chiều",
      "Bếp nấu đầy đủ dụng cụ",
      "Smart TV & Netflix 4K",
      "Bãi đỗ ô tô miễn phí",
    ],
  },
  {
    title: "Son Tra Ocean Breeze Retreat House",
    description: `Ngôi nhà nhiệt đới thanh bình tựa lưng vào bán đảo Sơn Trà và hướng mặt ra biển xanh biếc. Không gian xanh mướt với cây cối tự nhiên, sân hiên uống trà đón gió núi và biển hòa quyện.

Chỉ 10 phút lái xe tới Chùa Linh Ứng ngắm tượng Phật Bà nghìn mắt nghìn tay và bãi đá Obama hoang sơ. Thích hợp cho kỳ nghỉ tái tạo năng lượng bên gia đình và người thân.`,
    type: "HOUSE",
    city: "Đà Nẵng",
    address: "Đường Hoàng Sa, Phường Thọ Quang, Quận Sơn Trà, Đà Nẵng",
    pricePerNight: 2100000,
    cleaningFee: 200000,
    maxGuests: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 2,
    ratingAvg: 4.89,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Wifi tốc độ cao (150 Mbps)",
      "Sân BBQ ngoài trời",
      "Sân vườn nhiệt đới",
      "Bếp nấu đầy đủ dụng cụ",
      "Bãi đỗ ô tô miễn phí",
      "Cho phép mang thú cưng",
      "Smart TV & Netflix 4K",
    ],
  },

  // ==========================================
  // 4. ĐÀ LẠT - 3 properties
  // ==========================================
  {
    title: "Pine Hill Wooden Chalet & Mist Valley",
    description: `Căn nhà gỗ phong cách Bắc Âu nằm giữa sườn đồi thông reo vi vu tại Đà Lạt. Buổi sáng thức dậy trong màn sương mù bồng bềnh phủ kín thung lũng, nhâm nhi tách trà Atiso ấm nóng bên lò sưởi bập bùng.

Chalet có hiên gỗ lớn nhìn ra thung lũng đèn lồng lung linh khi màn đêm buông xuống, bồn tắm ngâm thảo mộc thư giãn và bếp nướng BBQ ngoài trời cực kỳ ấm cúng cho những đêm se lạnh.`,
    type: "HOMESTAY",
    city: "Đà Lạt",
    address: "Đường Khe Sanh, Phường 10, TP. Đà Lạt, Lâm Đồng",
    pricePerNight: 1550000,
    cleaningFee: 150000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    ratingAvg: 4.96,
    images: [
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Ban công ngắm đồi thông & thung lũng sương mù",
      "Bồn tắm ngâm thảo mộc",
      "Sân BBQ ngoài trời",
      "Wifi tốc độ cao (150 Mbps)",
      "Bếp nấu đầy đủ dụng cụ",
      "Máy pha cà phê pha sẵn",
      "Smart TV & Netflix 4K",
    ],
  },
  {
    title: "Xuan Huong Lakeview French Heritage Villa",
    description: `Biệt thự kiến trúc Pháp cổ điển nép mình bên vườn hồng rực rỡ, chỉ cách mặt nước Hồ Xuân Hương 300m đi bộ. Không gian toát lên vẻ đài các, tao nhã với nội thất gỗ sồi cao cấp và cửa sổ vòm lớn ngắm trọn hàng thông ven hồ.

Biệt thự có 4 phòng ngủ sang trọng, phòng khách sưởi củi ấm áp, phòng ăn gia đình rộng rãi và bãi đỗ xe riêng biệt an toàn. Địa điểm hoàn hảo để đạp xe đôi quanh bờ hồ và thưởng thức ẩm thực chợ đêm Đà Lạt.`,
    type: "VILLA",
    city: "Đà Lạt",
    address: "Đường Trần Hưng Đạo, Phường 10, TP. Đà Lạt, Lâm Đồng",
    pricePerNight: 3500000,
    cleaningFee: 300000,
    maxGuests: 8,
    bedrooms: 4,
    beds: 4,
    bathrooms: 3,
    ratingAvg: 4.97,
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Sân vườn nhiệt đới",
      "Sân BBQ ngoài trời",
      "Bãi đỗ ô tô miễn phí",
      "Bếp nấu đầy đủ dụng cụ",
      "Wifi tốc độ cao (150 Mbps)",
      "Smart TV & Netflix 4K",
      "Xe đạp miễn phí dạo phố",
    ],
  },
  {
    title: "Cloud Valley Panorama Glasshouse Studio",
    description: `Căn studio bằng kính panorama độc đáo nằm trên đỉnh đồi Trại Mát, nơi đón biển mây trắng bồng bềnh cuộn trôi ngay dưới chân bạn mỗi ban mai.

Buổi tối, bạn sẽ được chiêm ngưỡng 'thung lũng kinh đô ánh sáng' lung linh huyền ảo của hàng ngàn nhà lồng trồng hoa Đà Lạt. Căn phòng trang bị giường nệm cao cấp, bồn tắm kính ngắm sao đêm và góc sống ảo triệu view.`,
    type: "HOMESTAY",
    city: "Đà Lạt",
    address: "Khu vực đồi Trại Mát, Phường 11, TP. Đà Lạt, Lâm Đồng",
    pricePerNight: 1250000,
    cleaningFee: 150000,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    ratingAvg: 4.94,
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Ban công săn mây Trại Mát",
      "Bồn tắm ngâm thảo mộc",
      "Wifi tốc độ cao (150 Mbps)",
      "Máy pha cà phê pha sẵn",
      "Bếp nấu đầy đủ dụng cụ",
      "Smart TV & Netflix 4K",
    ],
  },

  // ==========================================
  // 5. NHA TRANG - 3 properties
  // ==========================================
  {
    title: "Tran Phu Oceanfront High-Rise Panorama Suite",
    description: `Căn hộ cao cấp trên trục đường huyết mạch Trần Phú nhìn thẳng ra toàn cảnh Vịnh Nha Trang và cáp treo Vinpearl vượt biển trứ danh.

Căn hộ có ban công kính kịch trần ngắm sóng biển xanh ngọc, hồ bơi vô cực trên tầng thượng tòa nhà, phòng ngủ view biển lộng lẫy và tiện nghi nấu nướng đầy đủ. Chỉ cần bước chân qua đường là tới bờ cát trắng mịn và biển xanh trong vắt.`,
    type: "APARTMENT",
    city: "Nha Trang",
    address: "Đường Trần Phú, Phường Lộc Thọ, TP. Nha Trang, Khánh Hòa",
    pricePerNight: 1750000,
    cleaningFee: 180000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    ratingAvg: 4.93,
    images: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Ban công ngắm biển trọn vẹn",
      "Hồ bơi tầng thượng 360 độ",
      "Wifi tốc độ cao (150 Mbps)",
      "Điều hòa 2 chiều",
      "Bếp nấu đầy đủ dụng cụ",
      "Smart TV & Netflix 4K",
      "Bãi đỗ ô tô miễn phí",
    ],
  },
  {
    title: "An Vien Coastal Private Pool Luxury Villa",
    description: `Biệt thự nghỉ dưỡng khép kín biệt lập tại khu đô thị ven biển An Viên, nơi được mệnh danh là 'khu nhà giàu' yên bình nhất Nha Trang ngay sát cảng cáp treo Vinpearl.

Villa sở hữu hồ bơi ngoài trời riêng biệt, sân vườn BBQ xanh mát, phòng khách lớn tràn ngập ánh sáng và 4 phòng ngủ tiện nghi cao cấp. Lý tưởng cho các gia đình nhiều thế hệ hoặc nhóm bạn muốn tận hưởng kỳ nghỉ riêng tư tuyệt đối.`,
    type: "VILLA",
    city: "Nha Trang",
    address: "Khu biệt thự biển An Viên, Phường Vĩnh Trường, TP. Nha Trang, Khánh Hòa",
    pricePerNight: 3800000,
    cleaningFee: 300000,
    maxGuests: 10,
    bedrooms: 4,
    beds: 5,
    bathrooms: 4,
    ratingAvg: 4.97,
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Hồ bơi vô cực riêng",
      "Sân BBQ ngoài trời",
      "Bếp nấu đầy đủ dụng cụ",
      "Bãi đỗ ô tô miễn phí",
      "Wifi tốc độ cao (150 Mbps)",
      "Điều hòa 2 chiều",
      "Bồn tắm massage Jacuzzi",
      "Cho phép mang thú cưng",
    ],
  },
  {
    title: "Hon Chong Sunset Bohemian Coastal Stay",
    description: `Không gian nghỉ ngơi phóng khoáng mang phong cách Bohemian nằm ngay gần quần thể danh thắng Hòn Chồng. Từ ban công, bạn có thể chiêm ngưỡng ánh hoàng hôn ráng vàng trác tuyệt buông xuống vịnh biển.

Gần các quán cà phê ngắm biển nổi tiếng, chợ hải sản Tháp Bà tươi rói với giá cả bình dân và viện Hải dương học Nha Trang. Chỗ nghỉ có bếp mở để bạn thoải mái tự tay chế biến hải sản tươi ngon mua về.`,
    type: "HOMESTAY",
    city: "Nha Trang",
    address: "Đường Phạm Văn Đồng, Phường Vĩnh Phước, TP. Nha Trang, Khánh Hòa",
    pricePerNight: 1100000,
    cleaningFee: 120000,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    ratingAvg: 4.88,
    images: [
      "https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Ban công ngắm biển trọn vẹn",
      "Wifi tốc độ cao (150 Mbps)",
      "Điều hòa 2 chiều",
      "Bếp nấu đầy đủ dụng cụ",
      "Smart TV & Netflix 4K",
      "Tự nhận phòng thông minh (Smart Lock)",
    ],
  },

  // ==========================================
  // 6. PHÚ QUỐC - 3 properties
  // ==========================================
  {
    title: "Sunset Sanato Luxury Beachfront Pool Villa",
    description: `Biệt thự nghỉ dưỡng sát bờ biển Bãi Trường - 'thủ phủ ngắm hoàng hôn' đẹp nhất Phú Quốc với những công trình nghệ thuật biểu tượng bên mép sóng.

Căn villa có hồ bơi riêng biệt sát rặng dừa nghiêng bóng, lối đi riêng trải cát trắng mịn chạm ngay tới làn nước biển trong veo. Ban đêm bạn có thể lắng nghe tiếng sóng vỗ rì rào và thưởng thức cocktail mát lạnh dưới bầu trời đầy sao.`,
    type: "VILLA",
    city: "Phú Quốc",
    address: "Khu nghỉ dưỡng Sunset Sanato, Bãi Trường, Xã Dương Tơ, TP. Phú Quốc, Kiên Giang",
    pricePerNight: 4500000,
    cleaningFee: 350000,
    maxGuests: 8,
    bedrooms: 3,
    beds: 4,
    bathrooms: 3,
    ratingAvg: 4.98,
    images: [
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Hồ bơi vô cực riêng",
      "Lối đi thẳng ra bãi biển riêng",
      "Ban công ngắm biển trọn vẹn",
      "Bếp nấu đầy đủ dụng cụ",
      "Bồn tắm massage Jacuzzi",
      "Sân BBQ ngoài trời",
      "Wifi tốc độ cao (150 Mbps)",
      "Bãi đỗ ô tô miễn phí",
    ],
  },
  {
    title: "Grand World Venice Canal Balcony Suite",
    description: `Căn hộ rực rỡ sắc màu phong cách Địa Trung Hải tọa lạc ngay bên dòng kênh Venice thuộc 'thành phố không ngủ' Grand World Phú Quốc.

Từ ban công rộng mở, bạn có thể thưởng lãm những chiếc thuyền Gondola lướt nhẹ trên dòng kênh và xem show diễn thực cảnh Sắc Màu Venice triệu đô vào mỗi tối. Vị trí trung tâm siêu tiện lợi, gần Corona Casino, VinWonders và Vinpearl Safari.`,
    type: "APARTMENT",
    city: "Phú Quốc",
    address: "Phân khu Mallorca, Grand World, Bãi Dài, Xã Gành Dầu, TP. Phú Quốc, Kiên Giang",
    pricePerNight: 1550000,
    cleaningFee: 150000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    ratingAvg: 4.92,
    images: [
      "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Wifi tốc độ cao (150 Mbps)",
      "Điều hòa 2 chiều",
      "Bếp nấu đầy đủ dụng cụ",
      "Smart TV & Netflix 4K",
      "Tự nhận phòng thông minh (Smart Lock)",
      "Bãi đỗ ô tô miễn phí",
    ],
  },
  {
    title: "Sao Beach Tropical Palm Eco Bungalow",
    description: `Bungalow mộc mạc nép mình dưới rặng dừa xanh mát bên Bãi Sao - bãi biển sở hữu cát trắng như kem và làn nước trong vắt màu ngọc bích nổi tiếng nhất đảo ngọc.

Mỗi căn bungalow được làm từ vật liệu thân thiện thiên nhiên với võng đung đưa trước hiên, vòi tắm ngoài trời nhiệt đới và không khí biển nguyên sơ tinh khiết. Thưởng thức nước dừa tươi ngọt lịm và hải sản nướng thơm lừng ngay tại bờ biển.`,
    type: "RESORT",
    city: "Phú Quốc",
    address: "Khu vực Bãi Sao, Phường An Thới, TP. Phú Quốc, Kiên Giang",
    pricePerNight: 1800000,
    cleaningFee: 150000,
    maxGuests: 4,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    ratingAvg: 4.9,
    images: [
      "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519643381401-22c77e60520e?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Lối đi thẳng ra bãi biển riêng",
      "Sân vườn nhiệt đới",
      "Wifi tốc độ cao (150 Mbps)",
      "Điều hòa 2 chiều",
      "Cho phép mang thú cưng",
      "Bãi đỗ ô tô miễn phí",
    ],
  },

  // ==========================================
  // 7. HỘI AN - 3 properties
  // ==========================================
  {
    title: "Ancient Town Lantern Heritage Wooden House",
    description: `Ngôi nhà cổ gỗ lim truyền thống nằm ngay trong vùng lõi phố đi bộ phố cổ Hội An, được bảo tồn nguyên vẹn kiến trúc vì kèo chạm khắc tinh xảo và mái ngói âm dương rêu phong.

Ban đêm, chỉ cần mở cánh cửa sổ gỗ là ngắm trọn sắc màu lung linh của hàng trăm chiếc đèn lồng hoa đăng rực rỡ và tiếng hát bài chòi vọng lại từ bờ sông Hoài. Trải nghiệm không gian văn hóa sống động có một không hai tại di sản thế giới UNESCO.`,
    type: "HOUSE",
    city: "Hội An",
    address: "Đường Nguyễn Thái Học, Phường Minh An, TP. Hội An, Quảng Nam",
    pricePerNight: 2400000,
    cleaningFee: 200000,
    maxGuests: 6,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    ratingAvg: 4.96,
    images: [
      "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Ban công ngắm phố đèn lồng",
      "Xe đạp miễn phí dạo phố",
      "Wifi tốc độ cao (150 Mbps)",
      "Điều hòa 2 chiều",
      "Bếp nấu đầy đủ dụng cụ",
      "Máy pha cà phê pha sẵn",
      "Smart TV & Netflix 4K",
    ],
  },
  {
    title: "An Bang Beach Coconut Grove Pool Villa",
    description: `Biệt thự nghỉ dưỡng nhiệt đới xinh đẹp nằm giữa rặng dừa râm mát, chỉ cách bãi cát trắng phau của biển An Bàng 150m tản bộ.

Villa có hồ ngâm nước mát riêng trong sân vườn, hiên tắm nắng thoáng đãng, phòng ngủ đón gió biển trong lành và bếp mở tiện nghi. Quanh khu vực có nhiều nhà hàng ẩm thực địa phương và quán bar biển phong cách mộc mạc chill bậc nhất Hội An.`,
    type: "VILLA",
    city: "Hội An",
    address: "Khu vực Bãi biển An Bàng, Phường Cẩm An, TP. Hội An, Quảng Nam",
    pricePerNight: 3200000,
    cleaningFee: 250000,
    maxGuests: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 3,
    ratingAvg: 4.95,
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Hồ bơi vô cực riêng",
      "Ban công ngắm biển trọn vẹn",
      "Sân vườn nhiệt đới",
      "Sân BBQ ngoài trời",
      "Bếp nấu đầy đủ dụng cụ",
      "Bãi đỗ ô tô miễn phí",
      "Xe đạp miễn phí dạo phố",
    ],
  },
  {
    title: "Cam Chau Green Paddyfield Eco Homestay",
    description: `Homestay sinh thái bình dị ôm trọn cánh đồng lúa xanh ngút ngàn của vùng quê Cẩm Châu thanh bình, nơi đàn cò trắng bay lượn và hoa sen ngát hương mỗi độ hè về.

Homestay cung cấp xe đạp miễn phí để bạn dạo chơi trên những con đường làng quanh co rợp bóng tre, hồ bơi ngoài trời nhìn thẳng ra đồng lúa và bữa sáng tươi ngon với cao lầu, mì Quảng chuẩn vị Hội An.`,
    type: "HOMESTAY",
    city: "Hội An",
    address: "Đường Trần Nhân Tông, Phường Cẩm Châu, TP. Hội An, Quảng Nam",
    pricePerNight: 980000,
    cleaningFee: 100000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    ratingAvg: 4.91,
    images: [
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Xe đạp miễn phí dạo phố",
      "Hồ bơi tầng thượng 360 độ",
      "Wifi tốc độ cao (150 Mbps)",
      "Điều hòa 2 chiều",
      "Sân vườn nhiệt đới",
      "Cho phép mang thú cưng",
    ],
  },

  // ==========================================
  // 8. HẠ LONG - 3 properties
  // ==========================================
  {
    title: "Bai Chay Panorama Ha Long Bay Penthouse",
    description: `Căn hộ penthouse đẳng cấp trên tầng cao khu Bãi Cháy, mở ra tầm nhìn bao quát 180 độ trọn vẹn vịnh Hạ Long kỳ vĩ với hàng ngàn hòn đảo đá vôi nhấp nhô trên làn nước ngọc bích.

Căn hộ sở hữu ban công kính dài ngắm du thuyền qua lại trên vịnh, bồn sục Jacuzzi kính view biển, phòng khách thông tầng lộng lẫy và hệ thống chiếu sáng thông minh. Trải nghiệm ngắm hoàng hôn đỏ ối chìm dần sau những rặng núi đá vôi triệu năm tuổi.`,
    type: "APARTMENT",
    city: "Hạ Long",
    address: "Đường Hạ Long, Phường Bãi Cháy, TP. Hạ Long, Quảng Ninh",
    pricePerNight: 2600000,
    cleaningFee: 250000,
    maxGuests: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 2,
    ratingAvg: 4.97,
    images: [
      "https://images.unsplash.com/photo-1617103996702-96ff29b1c467?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Ban công ngắm toàn cảnh Vịnh Hạ Long",
      "Hồ bơi vô cực riêng",
      "Bồn tắm massage Jacuzzi",
      "Wifi tốc độ cao (150 Mbps)",
      "Bếp nấu đầy đủ dụng cụ",
      "Điều hòa 2 chiều",
      "Smart TV & Netflix 4K",
      "Bãi đỗ ô tô miễn phí",
    ],
  },
  {
    title: "Tuan Chau Marina Luxury Waterfront Villa",
    description: `Biệt thự nghỉ dưỡng hướng vịnh tại đảo ngọc Tuần Châu, nằm liền kề bến cảng du thuyền quốc tế Tuần Châu - điểm khởi hành của những chuyến hải trình khám phá Vịnh Hạ Long.

Villa sở hữu sân vườn rộng lớn, bể bơi riêng tư, khu vực nướng BBQ tiệc tùng và bãi đỗ cano tiện lợi. Phòng ngủ thiết kế sang trọng với giường cỡ King nệm êm ái, bồn tắm thư giãn và cửa sổ kính lớn ngắm nhìn vịnh biển êm đềm.`,
    type: "VILLA",
    city: "Hạ Long",
    address: "Khu đô thị cảng Tuần Châu, Đảo Tuần Châu, TP. Hạ Long, Quảng Ninh",
    pricePerNight: 3900000,
    cleaningFee: 300000,
    maxGuests: 8,
    bedrooms: 4,
    beds: 4,
    bathrooms: 4,
    ratingAvg: 4.96,
    images: [
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Hồ bơi vô cực riêng",
      "Ban công ngắm toàn cảnh Vịnh Hạ Long",
      "Sân BBQ ngoài trời",
      "Bãi đỗ ô tô miễn phí",
      "Bếp nấu đầy đủ dụng cụ",
      "Điều hòa 2 chiều",
      "Bồn tắm massage Jacuzzi",
      "Wifi tốc độ cao (150 Mbps)",
    ],
  },
  {
    title: "Sun World Ha Long Park Boutique Studio",
    description: `Căn studio hiện đại đầy đủ tiện nghi cách công viên giải trí Sun World Hạ Long Park và bãi tắm Bãi Cháy chỉ 300m đi bộ.

Không gian được decor trẻ trung, ấm cúng với đầy đủ bếp nấu, bàn làm việc tốc độ mạng cao, máy giặt riêng và smart TV kết nối Netflix. Xung quanh là con phố ẩm thực và chợ đêm sầm uất với vô vàn món chả mực Hạ Long nức tiếng.`,
    type: "APARTMENT",
    city: "Hạ Long",
    address: "Đường Tiên Ông, Phường Bãi Cháy, TP. Hạ Long, Quảng Ninh",
    pricePerNight: 1150000,
    cleaningFee: 120000,
    maxGuests: 3,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    ratingAvg: 4.9,
    images: [
      "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560185009-5bf9f2849488?auto=format&fit=crop&w=800&q=80",
    ],
    amenityNames: [
      "Wifi tốc độ cao (150 Mbps)",
      "Điều hòa 2 chiều",
      "Bếp nấu đầy đủ dụng cụ",
      "Bàn làm việc chuyên dụng",
      "Smart TV & Netflix 4K",
      "Tự nhận phòng thông minh (Smart Lock)",
    ],
  },
];

async function main() {
  console.log("=== Seeding Real Properties & Amenities ===");

  // 1. Find or verify host
  const host =
    (await prisma.user.findUnique({
      where: { email: "host@stayhub.com" },
    })) ||
    (await prisma.user.findFirst({
      where: { role: "HOST" },
    }));

  if (!host) {
    throw new Error("No host user found! Please register or seed a host first.");
  }
  console.log(`Using Host: ${host.fullName} (${host.email}, ID: ${host.id})`);

  // 2. Upsert all amenities
  console.log(`Upserting ${AMENITY_DEFINITIONS.length} amenities...`);
  const amenityMap = new Map();
  for (const item of AMENITY_DEFINITIONS) {
    const record = await prisma.amenity.upsert({
      where: { name: item.name },
      update: { icon: item.icon },
      create: { name: item.name, icon: item.icon },
    });
    amenityMap.set(item.name, record.id);
  }
  console.log(`Amenities in DB: ${amenityMap.size}`);

  // 3. Remove old demo properties (safe deletion)
  const oldDemoProperties = await prisma.property.findMany({
    where: {
      OR: [
        { title: { contains: "Demo" } },
        { description: { contains: "demo hư cấu" } },
        { images: { some: { imageUrl: { startsWith: "/demo-properties/" } } } },
      ],
    },
    select: { id: true, title: true },
  });

  if (oldDemoProperties.length > 0) {
    console.log(`Found ${oldDemoProperties.length} old demo properties. Removing...`);
    const ids = oldDemoProperties.map((p) => p.id);
    await prisma.propertyImage.deleteMany({ where: { propertyId: { in: ids } } });
    await prisma.propertyAmenity.deleteMany({ where: { propertyId: { in: ids } } });
    await prisma.property.deleteMany({ where: { id: { in: ids } } });
    console.log(`Removed ${oldDemoProperties.length} old demo properties.`);
  }

  // 4. Insert the 24 realistic properties
  console.log(`Inserting ${REAL_PROPERTIES.length} realistic properties...`);
  for (const p of REAL_PROPERTIES) {
    const created = await prisma.property.create({
      data: {
        title: p.title,
        description: p.description,
        type: p.type,
        city: p.city,
        address: p.address,
        pricePerNight: p.pricePerNight,
        cleaningFee: p.cleaningFee,
        maxGuests: p.maxGuests,
        bedrooms: p.bedrooms,
        beds: p.beds,
        bathrooms: p.bathrooms,
        ratingAvg: p.ratingAvg,
        status: "ACTIVE",
        hostId: host.id,
        images: {
          create: p.images.map((url, idx) => ({
            imageUrl: url,
            displayOrder: idx,
            isCover: idx === 0,
          })),
        },
        amenities: {
          create: p.amenityNames.map((name) => {
            const amenityId = amenityMap.get(name);
            if (!amenityId) throw new Error(`Amenity not found: ${name}`);
            return { amenityId };
          }),
        },
      },
      include: {
        images: true,
        amenities: { include: { amenity: true } },
      },
    });

    console.log(
      `✓ [${created.city}] ${created.title} (${created.images.length} images, ${created.amenities.length} amenities)`
    );
  }

  const finalPropertyCount = await prisma.property.count();
  const finalAmenityCount = await prisma.amenity.count();
  const finalImageCount = await prisma.propertyImage.count();
  const finalPropAmenityCount = await prisma.propertyAmenity.count();

  console.log("=== Seed Completed Successfully ===");
  console.log(`Properties in DB: ${finalPropertyCount}`);
  console.log(`Amenities in DB: ${finalAmenityCount}`);
  console.log(`Property Images in DB: ${finalImageCount}`);
  console.log(`Property Amenities in DB: ${finalPropAmenityCount}`);
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
