import assert from "node:assert/strict";

export const destinations = [
  ["Ninh Bình", "Tràng An", "Trang An Ninh Binh landscape"],
  ["Đà Nẵng", "Mỹ Khê", "Da Nang beach"],
  ["Hội An", "Cẩm Châu", "Hoi An ancient town"],
  ["Đà Lạt", "Phường Xuân Hương", 'intitle:"Da Lat"'],
  ["Hạ Long", "Bãi Cháy", "Ha Long Bay landscape"],
];

export function dataset() {
  const styles = [
    [
      "Studio thư thái",
      "APARTMENT",
      2,
      1,
      650000,
      "Không gian nhỏ gọn cho cặp đôi, có góc đọc sách và bàn ăn.",
    ],
    [
      "Nhà nghỉ gia đình",
      "HOUSE",
      6,
      3,
      1450000,
      "Nhà rộng cho gia đình, có khu sinh hoạt chung và bếp tự nấu.",
    ],
    [
      "Homestay cuối tuần",
      "HOMESTAY",
      4,
      2,
      950000,
      "Chỗ nghỉ ấm cúng cho nhóm nhỏ, có bàn làm việc và khu uống trà.",
    ],
    [
      "Villa nghỉ dưỡng",
      "VILLA",
      8,
      4,
      2600000,
      "Không gian nghỉ dưỡng cho nhóm bạn với phòng khách lớn và sân thư giãn.",
    ],
  ];
  return destinations.flatMap(([city, area], destination) =>
    styles.map(([name, type, guests, bedrooms, price, detail], style) => ({
      title: `${name} ${city} — Demo`,
      description: `${detail} Gợi ý khám phá ${area}, ${city}. Đây là chỗ ở demo hư cấu, không nhận đặt phòng thực tế. Ảnh minh họa điểm đến, không phải ảnh chỗ ở và không xác nhận vị trí thực tế.`,
      city,
      address: `Khu vực ${area}, ${city}, Việt Nam (địa chỉ minh họa, không phải cơ sở thực tế)`,
      type,
      pricePerNight: price + destination * 50000,
      cleaningFee: 100000 + style * 50000,
      maxGuests: guests,
      bedrooms,
      beds: bedrooms,
      bathrooms: Math.max(1, bedrooms - 1),
      status: "ACTIVE",
      images: [0, 1, 2].map((index) => ({
        imageUrl: `/demo-properties/destination-${destination}-${index}.jpg`,
        displayOrder: index,
        isCover: index === 0,
      })),
    }))
  );
}

export function validateDataset(rows) {
  assert.equal(rows.length, 20);
  assert.equal(new Set(rows.map((row) => row.title)).size, 20);
  for (const row of rows) {
    const destination = destinations.find(([city]) => city === row.city);
    assert.ok(
      destination &&
        row.address.includes(destination[1]) &&
        row.address.includes(row.city)
    );
    assert.ok(row.description.includes("demo hư cấu"));
    assert.ok(row.pricePerNight > 0 && row.cleaningFee >= 0);
    for (const field of ["maxGuests", "bedrooms", "beds", "bathrooms"])
      assert.ok(Number.isInteger(row[field]) && row[field] > 0);
    assert.ok(row.images.length >= 3);
    assert.equal(
      new Set(row.images.map((image) => image.imageUrl)).size,
      row.images.length
    );
    assert.equal(row.images.filter((image) => image.isCover).length, 1);
    assert.equal(
      new Set(row.images.map((image) => image.displayOrder)).size,
      row.images.length
    );
  }
}

export function authorizeReset(args) {
  assert.ok(
    args.every((arg) =>
      ["--execute", "--confirm=DELETE_ALL_DEMO_PROPERTIES"].includes(arg)
    ),
    "Unknown argument"
  );
  if (!args.length) return false;
  assert.ok(
    args.includes("--execute") &&
      args.includes("--confirm=DELETE_ALL_DEMO_PROPERTIES"),
    "Both destructive consent arguments required"
  );
  return true;
}
